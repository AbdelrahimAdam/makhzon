import { db } from '@/firebase/config';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { ensureFirebaseReady } from '../utils/firebase-utils';
import { normalizeArabicText, matchArabicTextWithScore, fuzzyLocalSearch, removeDuplicatesAndSortByRelevance, mergeSearchResults } from '../utils/search-utils';
import { SearchCache, getCacheKey } from '../utils/cache';
import { SPARK_CONFIG, PERFORMANCE_CONFIG } from '../utils/constants';
import { ensureCompleteItemFields } from '../utils/helpers';

const searchCache = new SearchCache();

export default {
  async searchInventorySpark({ commit, state, dispatch, rootState }, {
    searchQuery,
    warehouseId = null,
    limit = SPARK_CONFIG.MAX_RESULTS,
    strategy = 'parallel'
  }) {
    const startTime = performance.now();

    try {
      if (!searchQuery || searchQuery.trim().length < 2) {
        commit('SET_SEARCH_RESULTS', { results: [], source: 'min_length', query: '' });
        return [];
      }

      const rawSearchTerm = searchQuery.trim();
      const targetWarehouse = warehouseId || state.warehouseFilter || 'all';

      commit('SET_SEARCH_LOADING', true);
      commit('SET_SEARCH_QUERY', rawSearchTerm);

      console.log(`🚀 SPARK Search: "${rawSearchTerm}" (warehouse: ${targetWarehouse}) | Strategy: ${strategy}`);

      console.log('⏳ Ensuring Firebase is ready for main search...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for main search');

      const cacheKey = getCacheKey(rawSearchTerm, targetWarehouse, limit);
      const cachedResults = searchCache.get(cacheKey);

      if (cachedResults) {
        console.log(`✅ Using cached results for: "${rawSearchTerm}"`);
        commit('SET_SEARCH_RESULTS', {
          results: cachedResults.slice(0, limit),
          source: 'cache',
          query: rawSearchTerm
        });
        commit('SET_SEARCH_LOADING', false);

        const duration = performance.now() - startTime;
        commit('UPDATE_SEARCH_PERFORMANCE', { duration, cacheHit: true });

        return cachedResults.slice(0, limit);
      }

      let results = [];

      switch(strategy) {
        case 'parallel':
          results = await dispatch('searchParallelSpark', {
            searchTerm: rawSearchTerm,
            targetWarehouse,
            limit
          });
          break;

        case 'local_first':
          results = await dispatch('searchLocalFirstSpark', {
            searchTerm: rawSearchTerm,
            targetWarehouse,
            limit
          });
          break;

        case 'firebase_first':
          results = await dispatch('searchFirebaseFirstSpark', {
            searchTerm: rawSearchTerm,
            targetWarehouse,
            limit
          });
          break;

        default:
          results = await dispatch('searchHybridSpark', {
            searchTerm: rawSearchTerm,
            targetWarehouse,
            limit
          });
      }

      if (results.length > 0) {
        searchCache.set(cacheKey, results);
        console.log(`💾 Cached ${results.length} results for: "${rawSearchTerm}"`);
      }

      const source = results.length > 0 ? 'spark_hybrid' : 'none';

      commit('SET_SEARCH_RESULTS', {
        results: results.slice(0, limit),
        source,
        query: rawSearchTerm
      });

      const duration = performance.now() - startTime;
      commit('UPDATE_SEARCH_PERFORMANCE', { duration, cacheHit: false });

      console.log(`🎯 SPARK Search completed in ${duration.toFixed(2)}ms: ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ SPARK Search error:', error);
      commit('SET_SEARCH_ERROR', error.message);

      const duration = performance.now() - startTime;
      commit('UPDATE_SEARCH_PERFORMANCE', { duration, cacheHit: false });

      try {
        const fallbackResults = fuzzyLocalSearch(state.inventory, searchQuery, warehouseId, limit);
        commit('SET_SEARCH_RESULTS', {
          results: fallbackResults,
          source: 'fallback',
          query: searchQuery
        });
        return fallbackResults;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        commit('SET_SEARCH_RESULTS', { results: [], source: 'error', query: searchQuery });
        return [];
      }
    } finally {
      commit('SET_SEARCH_LOADING', false);
    }
  },

  async searchParallelSpark({ state, dispatch }, {
    searchTerm,
    targetWarehouse,
    limit
  }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SPARK_CONFIG.PARALLEL_TIMEOUT);

    try {
      const localPromise = dispatch('searchLocalSpark', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit: Math.min(limit, SPARK_CONFIG.LOCAL_SEARCH_LIMIT)
      });

      const firebasePromise = dispatch('searchFirebaseSparkEnhanced', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit
      });

      const [localResults, firebaseResults] = await Promise.race([
        Promise.all([localPromise, firebasePromise]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), SPARK_CONFIG.PARALLEL_TIMEOUT)
        )
      ]);

      clearTimeout(timeoutId);

      return mergeSearchResults(localResults, firebaseResults, searchTerm, limit);

    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Parallel search failed:', error.message);

      return await dispatch('searchLocalSpark', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit
      });
    }
  },

  async searchLocalFirstSpark({ state, dispatch }, {
    searchTerm,
    targetWarehouse,
    limit
  }) {
    try {
      const localResults = await dispatch('searchLocalSpark', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit: Math.min(limit * 2, SPARK_CONFIG.LOCAL_SEARCH_LIMIT)
      });

      if (localResults.length >= limit) {
        console.log(`✅ Local-first: Found ${localResults.length} local results`);
        return removeDuplicatesAndSortByRelevance(localResults, searchTerm, limit);
      }

      const firebaseResults = await dispatch('searchFirebaseSparkEnhanced', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit: limit - localResults.length
      });

      const allResults = [...localResults, ...firebaseResults];
      return removeDuplicatesAndSortByRelevance(allResults, searchTerm, limit);

    } catch (error) {
      console.warn('Local-first search failed:', error.message);
      throw error;
    }
  },

  async searchFirebaseFirstSpark({ state, dispatch }, {
    searchTerm,
    targetWarehouse,
    limit
  }) {
    try {
      const firebaseResults = await dispatch('searchFirebaseSparkEnhanced', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit
      });

      if (firebaseResults.length >= limit) {
        console.log(`✅ Firebase-first: Found ${firebaseResults.length} Firebase results`);
        return removeDuplicatesAndSortByRelevance(firebaseResults, searchTerm, limit);
      }

      const localResults = await dispatch('searchLocalSpark', {
        query: searchTerm,
        warehouseId: targetWarehouse,
        limit: limit - firebaseResults.length
      });

      const allResults = [...firebaseResults, ...localResults];
      return removeDuplicatesAndSortByRelevance(allResults, searchTerm, limit);

    } catch (error) {
      console.warn('Firebase-first search failed:', error.message);
      throw error;
    }
  },

  async searchHybridSpark({ state, dispatch }, {
    searchTerm,
    targetWarehouse,
    limit
  }) {
    let strategy = 'parallel';

    if (state.inventory.length > SPARK_CONFIG.LOCAL_SEARCH_LIMIT * 2) {
      strategy = 'local_first';
    } else if (!state.inventoryLoaded || state.inventory.length === 0) {
      strategy = 'firebase_first';
    } else if (searchTerm.length <= 3) {
      strategy = 'parallel';
    }

    return await dispatch('searchInventorySpark', {
      searchQuery: searchTerm,
      warehouseId: targetWarehouse,
      limit,
      strategy
    });
  },

  async searchLocalSpark({ state }, {
    query,
    warehouseId,
    limit = SPARK_CONFIG.MAX_RESULTS
  }) {
    if (!query || query.trim().length < 2) return [];

    const searchTerm = query.trim();

    let items = [...state.inventory];

    if (items.length > SPARK_CONFIG.LOCAL_SEARCH_LIMIT) {
      items = items.slice(0, SPARK_CONFIG.LOCAL_SEARCH_LIMIT);
      console.log(`⚠️ Limiting local search to ${SPARK_CONFIG.LOCAL_SEARCH_LIMIT} items`);
    }

    if (warehouseId && warehouseId !== 'all') {
      items = items.filter(i => i.warehouse_id === warehouseId);
    }

    if (items.length === 0) return [];

    console.log(`🔎 SPARK Local search for: "${searchTerm}" in ${items.length} items`);

    const matches = fuzzyLocalSearch(items, searchTerm, warehouseId, limit * 2);

    console.log(`📍 SPARK Local search found ${matches.length} matches`);

    const completeMatches = matches.map(item => {
      return ensureCompleteItemFields(item);
    });

    return removeDuplicatesAndSortByRelevance(completeMatches, searchTerm, limit);
  },

  async searchFirebaseSparkEnhanced({ state, rootState }, { query, warehouseId, limit }) {
    const companyId = rootState.userProfile?.companyId;
    if (!companyId) throw new Error('لم يتم العثور على معرف الشركة');

    try {
      console.log(`🌐 SPARK Firebase Enhanced search for: "${query}"`);

      console.log('⏳ Ensuring Firebase is ready for Firebase search...');
      await ensureFirebaseReady();
      console.log('✅ Firebase ready for Firebase search');

      if (!db) {
        console.error('❌ Firebase not available after wait');
        return [];
      }

      const rawSearchTerm = query.trim();
      const searchTerm = normalizeArabicText(rawSearchTerm);
      
      console.log(`🔤 Search debugging:`);
      console.log(`  Raw search term: "${rawSearchTerm}"`);
      console.log(`  Normalized term: "${searchTerm}"`);
      console.log(`  Search length: ${searchTerm.length}`);

      const role = state.userProfile?.role || '';
      const profileWarehouses = state.userProfile?.allowed_warehouses || [];

      let canAccessAll = false;
      let allowedWarehouseIds = [];

      if (role === 'superadmin' || role === 'company_manager') {
        canAccessAll = true;
      } else if (role === 'warehouse_manager' && Array.isArray(profileWarehouses)) {
        if (profileWarehouses.includes('all')) {
          canAccessAll = true;
        } else {
          allowedWarehouseIds = profileWarehouses.filter(id => 
            typeof id === 'string' && id.trim() !== '' && id !== 'all'
          ).slice(0, 10);
        }
      }

      const firebaseFirestore = await import('firebase/firestore');
      const {
        collection,
        query: firestoreQuery,
        where,
        orderBy,
        limit: firestoreLimit,
        getDocs
      } = firebaseFirestore;

      const itemsRef = collection(db, 'items');
      let itemsQuery;
      let searchResults = [];

      if (canAccessAll) {
        if (warehouseId && warehouseId !== 'all') {
          itemsQuery = firestoreQuery(
            itemsRef,
            where('companyId', '==', companyId),   // NEW
            where('warehouse_id', '==', warehouseId),
            orderBy('updated_at', 'desc'),
            firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 150))
          );
        } else {
          itemsQuery = firestoreQuery(
            itemsRef,
            where('companyId', '==', companyId),   // NEW
            orderBy('updated_at', 'desc'),
            firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 150))
          );
        }
      } else if (allowedWarehouseIds.length > 0) {
        if (warehouseId && warehouseId !== 'all') {
          if (allowedWarehouseIds.includes(warehouseId)) {
            itemsQuery = firestoreQuery(
              itemsRef,
              where('companyId', '==', companyId),   // NEW
              where('warehouse_id', '==', warehouseId),
              orderBy('updated_at', 'desc'),
              firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 150))
            );
          } else {
            console.warn('Warehouse not in allowed list');
            return [];
          }
        } else {
          const validIds = allowedWarehouseIds.slice(0, 5);

          if (validIds.length === 1) {
            itemsQuery = firestoreQuery(
              itemsRef,
              where('companyId', '==', companyId),   // NEW
              where('warehouse_id', '==', validIds[0]),
              orderBy('updated_at', 'desc'),
              firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 150))
            );
          } else {
            try {
              itemsQuery = firestoreQuery(
                itemsRef,
                where('companyId', '==', companyId),   // NEW
                where('warehouse_id', 'in', validIds),
                orderBy('updated_at', 'desc'),
                firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 120))
              );
            } catch (inError) {
              console.warn('"in" query failed, using single warehouse:', inError);
              itemsQuery = firestoreQuery(
                itemsRef,
                where('companyId', '==', companyId),   // NEW
                where('warehouse_id', '==', validIds[0]),
                orderBy('updated_at', 'desc'),
                firestoreLimit(Math.min((limit || SPARK_CONFIG.MAX_RESULTS) * 3, 150))
              );
            }
          }
        }
      } else {
        console.log('⚠️ User has no accessible warehouses');
        return [];
      }

      let snapshot;
      try {
        snapshot = await getDocs(itemsQuery);
        console.log(`📊 SPARK Firebase query returned ${snapshot.size} documents`);
      } catch (queryError) {
        console.error('❌ SPARK Firestore query failed:', queryError);
        return [];
      }

      if (!snapshot || snapshot.empty) {
        console.log('📭 No items found in Firebase');
        return [];
      }

      const allItems = [];
      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          
          const item = ensureCompleteItemFields({
            ...data,
            id: doc.id
          });

          allItems.push(item);
        } catch (docError) {
          console.warn('⚠️ Error processing document:', docError);
        }
      });

      console.log(`✅ SPARK Processed ${allItems.length} COMPLETE items from Firebase`);

      if (allItems.length > 0 && searchTerm) {
        console.log('🔍 DEBUG: Checking Arabic text normalization:');
        for (let i = 0; i < Math.min(3, allItems.length); i++) {
          const item = allItems[i];
          const normalizedName = normalizeArabicText(item.name);
          const normalizedCode = normalizeArabicText(item.code);
          console.log(`  Item ${i} (${item.id}):`);
          console.log(`    Original Name: "${item.name}"`);
          console.log(`    Normalized Name: "${normalizedName}"`);
          console.log(`    Original Code: "${item.code}"`);
          console.log(`    Normalized Code: "${normalizedCode}"`);
          console.log(`    Cartons: ${item.cartons_count}, Singles: ${item.single_bottles_count}`);
          console.log(`    Search Term: "${searchTerm}"`);
          console.log(`    Name contains search: ${normalizedName.includes(searchTerm)}`);
          console.log(`    Code contains search: ${normalizedCode.includes(searchTerm)}`);
        }
      }

      searchResults = [];
      for (const item of allItems) {
        if (searchResults.length >= SPARK_CONFIG.MAX_RESULTS * 3) break;

        if (warehouseId && warehouseId !== 'all' && item.warehouse_id !== warehouseId) {
          continue;
        }

        let matched = false;
        let score = 0;

        if (item.code) {
          const normalizedCode = normalizeArabicText(item.code);
          if (normalizedCode === searchTerm) {
            score = 100;
            matched = true;
          } else if (normalizedCode.includes(searchTerm)) {
            score = 80;
            matched = true;
          } else if (searchTerm.includes(normalizedCode)) {
            score = 60;
            matched = true;
          }
        }

        if (!matched || score < 70) {
          if (item.name) {
            const normalizedName = normalizeArabicText(item.name);
            if (normalizedName === searchTerm) {
              score = Math.max(score, 90);
              matched = true;
            } else if (normalizedName.includes(searchTerm)) {
              score = Math.max(score, 70);
              matched = true;
            } else if (searchTerm.includes(normalizedName)) {
              score = Math.max(score, 50);
              matched = true;
            } else {
              const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 1);
              const nameWords = normalizedName.split(/\s+/);
              
              let wordMatches = 0;
              for (const searchWord of searchWords) {
                for (const nameWord of nameWords) {
                  if (nameWord.includes(searchWord)) {
                    wordMatches++;
                    break;
                  }
                }
              }
              
              if (wordMatches > 0) {
                const matchPercentage = wordMatches / searchWords.length;
                score = Math.max(score, Math.floor(30 + (matchPercentage * 40)));
                matched = true;
              }
            }
          }
        }

        if (!matched || score < 40) {
          const otherFields = ['color', 'supplier', 'item_location', 'notes', 'barcode', 'sku', 'category'];
          for (const field of otherFields) {
            const fieldValue = item[field];
            if (fieldValue) {
              const normalizedFieldValue = normalizeArabicText(fieldValue);
              if (normalizedFieldValue.includes(searchTerm)) {
                score = Math.max(score, 40);
                matched = true;
                break;
              }
            }
          }
        }

        if (matched && score > 15) {
          searchResults.push({ item, score });
        }
      }

      console.log(`🔍 SPARK Found ${searchResults.length} matching items`);

      searchResults.sort((a, b) => b.score - a.score);
      const finalResults = searchResults
        .slice(0, Math.min(limit || SPARK_CONFIG.MAX_RESULTS, SPARK_CONFIG.MAX_RESULTS))
        .map(scored => scored.item);

      console.log(`🎯 SPARK Returning ${finalResults.length} relevant items`);
      
      if (finalResults.length > 0) {
        console.log('📋 Results summary:');
        finalResults.forEach((item, index) => {
          const normalizedName = normalizeArabicText(item.name);
          const normalizedCode = normalizeArabicText(item.code);
          console.log(`  ${index + 1}. "${item.name}" -> "${normalizedName}" | "${item.code}" -> "${normalizedCode}"`);
          console.log(`     Cartons: ${item.cartons_count}, Singles: ${item.single_bottles_count}, Total: ${item.total_added}`);
        });
      }

      return finalResults;

    } catch (error) {
      console.error('❌ SPARK Firebase search error:', error);
      return [];
    }
  },

  async searchFirebaseSpark({ state }, { query, warehouseId, limit }) {
    return await this.searchFirebaseSparkEnhanced({ state }, { query, warehouseId, limit });
  },

  async searchInventorySmart({ dispatch }, params) {
    return await dispatch('searchInventorySpark', params);
  },

  async searchLocalInventorySpark({ dispatch }, params) {
    return await dispatch('searchLocalSpark', params);
  },

  async searchFirebaseInventorySpark({ dispatch }, params) {
    return await dispatch('searchFirebaseSpark', params);
  },

  async searchFirebaseInventorySmartLegacy({ dispatch }, params) {
    return await dispatch('searchFirebaseSpark', params);
  },

  async searchInventoryEnhanced({ dispatch }, params) {
    return await dispatch('searchInventorySpark', params);
  },

  async searchLocalInventory({ dispatch }, params) {
    return await dispatch('searchLocalSpark', params);
  },

  async searchFirebaseInventory({ dispatch }, params) {
    return await dispatch('searchFirebaseSpark', params);
  },

  async searchItemsForTransactions({ dispatch }, params) {
    return await dispatch('searchInventorySpark', {
      searchQuery: params.searchTerm,
      warehouseId: params.warehouseId,
      limit: params.limitResults || 20
    });
  },

  async searchItemsForTransactionsEnhanced({ dispatch }, params) {
    return await dispatch('searchInventorySpark', {
      searchQuery: params.searchTerm,
      warehouseId: params.warehouseId,
      limit: params.limitResults || 20
    });
  },

  async searchItems({ dispatch }, params) {
    return await dispatch('searchInventorySpark', {
      searchQuery: params.searchTerm,
      limit: params.limitResults || 5
    });
  },

  async searchInventoryDirect({ dispatch }, params) {
    return await dispatch('searchInventorySpark', {
      searchQuery: params.query || params.searchTerm,
      warehouseId: params.warehouseId,
      limit: params.limit || params.limitResults || SPARK_CONFIG.MAX_RESULTS
    });
  },

  async setWarehouseFilter({ commit, state, dispatch }, warehouseId) {
    commit('SET_WAREHOUSE_FILTER', warehouseId);

    if (state.search.query && state.search.query.length >= PERFORMANCE_CONFIG.MIN_SEARCH_CHARS) {
      await dispatch('searchInventorySpark', {
        searchQuery: state.search.query,
        warehouseId
      });
    }
  },

  async clearSearch({ commit }) {
    commit('CLEAR_SEARCH');
  },
};