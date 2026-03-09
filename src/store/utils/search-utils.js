import { SPARK_CONFIG } from './constants';

// ============================================
// ENHANCED ARABIC TEXT NORMALIZATION FUNCTION
// ============================================
export function normalizeArabicText(text) {
  if (!text || typeof text !== 'string') return '';

  // Convert to string and trim
  text = String(text).trim();

  // Normalize Unicode to combine characters
  text = text.normalize('NFC');

  // Remove all diacritics and special characters
  const diacriticsRegex = /[\u064B-\u065F\u0670\u0640\u0652\u0651\u064E\u064F\u064D\u0650\u0657\u0656\u0653\u0654\u0655]/g;
  text = text.replace(diacriticsRegex, '');

  // Comprehensive Arabic character normalization
  const arabicNormalizationMap = {
    // Alif variations
    'إ': 'ا', 'أ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ٲ': 'ا', 'ٳ': 'ا',
    // Ya variations
    'ى': 'ي', 'ئ': 'ي', 'ۍ': 'ي', 'ێ': 'ي', 'ې': 'ي', 'ۑ': 'ي',
    // Ta marbuta
    'ة': 'ه',
    // Waw variations
    'ؤ': 'و', 'ۄ': 'و', 'ۅ': 'و', 'ۆ': 'و', 'ۇ': 'و', 'ۈ': 'و', 'ۉ': 'و', 'ۊ': 'و', 'ۋ': 'و',
    // Kaf variations
    'ك': 'ك', 'ڪ': 'ك', 'ګ': 'ك', 'ڬ': 'ك', 'ڭ': 'ك', 'ڮ': 'ك',
    // Hamza variations
    'ء': '', 'ٔ': '', 'ٕ': '', 'ٖ': '', 'ٗ': '',
    // Tatweel (kashida)
    'ـ': '',
    // Persian characters
    'گ': 'ك', 'چ': 'ج', 'پ': 'ب', 'ژ': 'ز',
    // Other Arabic variations
    'ڀ': 'ب', 'ٻ': 'ب', 'ڃ': 'ج', 'ڄ': 'ج', 'څ': 'ج', 'چ': 'ج', 'ڇ': 'ج',
    'ډ': 'د', 'ڊ': 'د', 'ڋ': 'د', 'ڌ': 'د', 'ڍ': 'د', 'ڎ': 'د', 'ڏ': 'د', 'ڐ': 'د',
    'ڑ': 'ر', 'ڒ': 'ر', 'ړ': 'ر', 'ڔ': 'ر', 'ڕ': 'ر', 'ږ': 'ر', 'ڗ': 'ر', 'ژ': 'ر',
    'ڙ': 'ر', 'ښ': 'س', 'ڛ': 'س', 'ڜ': 'س', 'ڝ': 'ص', 'ڞ': 'ص',
    'ڟ': 'ط', 'ڠ': 'ع', 'ڡ': 'ف', 'ڢ': 'ف', 'ڣ': 'ف', 'ڤ': 'ف', 'ڥ': 'ف', 'ڦ': 'ف',
    'ڧ': 'ق', 'ڨ': 'ق', 'ک': 'ك', 'ڪ': 'ك', 'ګ': 'ك', 'ڬ': 'ك', 'ڭ': 'ك', 'ڮ': 'ك',
    'ڰ': 'ل', 'ڱ': 'ل', 'ڲ': 'ل', 'ڳ': 'ل', 'ڴ': 'ل',
    'ڵ': 'ل', 'ڶ': 'ل', 'ڷ': 'ل', 'ڸ': 'ل', 'ڹ': 'ن', 'ں': 'ن', 'ڻ': 'ن', 'ڼ': 'ن',
    'ڽ': 'ن', 'ھ': 'ه', 'ۀ': 'ه', 'ہ': 'ه', 'ۂ': 'ه', 'ۃ': 'ه', 'ۄ': 'و', 'ۅ': 'و',
    'ۆ': 'و', 'ۇ': 'و', 'ۈ': 'و', 'ۉ': 'و', 'ۊ': 'و', 'ۋ': 'و', 'ی': 'ي', 'ۍ': 'ي',
    'ێ': 'ي', 'ې': 'ي', 'ۑ': 'ي'
  };

  // Apply character replacements
  Object.keys(arabicNormalizationMap).forEach(key => {
    const regex = new RegExp(key, 'g');
    text = text.replace(regex, arabicNormalizationMap[key]);
  });

  // Remove any remaining non-Arabic characters (keep spaces and numbers)
  text = text.replace(/[^\u0621-\u064A\u0660-\u0669\u0671-\u06D3\s0-9]/g, '');

  // Remove extra spaces and normalize
  text = text.replace(/\s+/g, ' ').trim().toLowerCase();

  return text;
}

// ============================================
// ENHANCED ARABIC MATCHING WITH SCORING
// ============================================
export function matchArabicTextWithScore(item, searchTerm, fields) {
  if (!searchTerm || !item) return { matched: false, score: 0 };

  const preparedSearchTerm = normalizeArabicText(searchTerm);
  let bestScore = 0;
  let matched = false;

  // Define all possible searchable fields
  const allSearchFields = [
    'name', 'code', 'color', 'supplier', 'item_location',
    'warehouse_id', 'notes', 'barcode', 'sku', 'category'
  ];

  // Use provided fields or all search fields
  const searchFields = fields && fields.length > 0 ? fields : allSearchFields;

  for (const field of searchFields) {
    const fieldValue = item[field];
    if (!fieldValue) continue;

    const preparedFieldValue = normalizeArabicText(fieldValue.toString());
    let fieldScore = 0;

    // 1. EXACT MATCH (highest score: 100)
    if (preparedFieldValue === preparedSearchTerm) {
      fieldScore = 100;
      matched = true;
    }

    // 2. STARTS WITH (score: 80-95 based on field importance)
    else if (preparedFieldValue.startsWith(preparedSearchTerm)) {
      fieldScore = 85;
      // Bonus for important fields
      if (field === 'code') fieldScore = 95;
      if (field === 'name') fieldScore = 90;
      matched = true;
    }

    // 3. CONTAINS (score: 60-85)
    else if (preparedFieldValue.includes(preparedSearchTerm)) {
      fieldScore = 70;
      // Bonus for important fields
      if (field === 'name') fieldScore = 85;
      if (field === 'code') fieldScore = 80;
      if (field === 'supplier') fieldScore = 75;
      matched = true;
    }

    // 4. WORD-BY-WORD MATCHING (for multi-word searches)
    else if (preparedSearchTerm.includes(' ')) {
      const searchWords = preparedSearchTerm.split(/\s+/);
      const fieldWords = preparedFieldValue.split(/\s+/);

      let matchedWords = 0;
      for (const searchWord of searchWords) {
        for (const fieldWord of fieldWords) {
          if (fieldWord.includes(searchWord)) {
            matchedWords++;
            break;
          }
        }
      }

      // Score based on percentage of words matched
      if (matchedWords > 0) {
        const matchRatio = matchedWords / searchWords.length;
        fieldScore = Math.floor(40 + (matchRatio * 40)); // 40-80 range
        if (field === 'name') fieldScore += 10;
        matched = true;
      }
    }

    // 5. PARTIAL WORD MATCHING (fuzzy)
    else if (preparedSearchTerm.length >= 2) {
      // Check if search term appears within words
      const fieldWords = preparedFieldValue.split(/\s+/);
      for (const fieldWord of fieldWords) {
        if (fieldWord.includes(preparedSearchTerm)) {
          fieldScore = 50;
          if (field === 'name') fieldScore = 60;
          matched = true;
          break;
        }
      }

      // Character-by-character similarity for short terms
      if (!matched && preparedSearchTerm.length >= 3) {
        const similarity = calculateArabicSimilarity(preparedFieldValue, preparedSearchTerm);
        if (similarity > 0.7) {
          fieldScore = Math.floor(similarity * 60); // 42-60 range
          if (field === 'name') fieldScore += 10;
          matched = true;
        }
      }
    }

    // Update best score if this field scored higher
    if (fieldScore > bestScore) {
      bestScore = fieldScore;
    }
  }

  // Apply bonuses
  if (matched) {
    // Bonus for quantity availability
    const quantity = item.remaining_quantity || 0;
    if (quantity > 0) {
      bestScore += Math.min(quantity / 10, 5); // Up to 5 points for quantity
    }

    // Bonus for recent updates
    if (item.updated_at) {
      const updateDate = item.updated_at.toDate ? item.updated_at.toDate() : new Date(item.updated_at);
      const daysAgo = (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) {
        bestScore += 5; // Recent items get bonus
      }
    }

    // Bonus for exact code match
    if (item.code && normalizeArabicText(item.code) === preparedSearchTerm) {
      bestScore += 15;
    }
  }

  return { matched, score: bestScore };
}

// ============================================
// IMPROVED ARABIC SIMILARITY CALCULATION
// ============================================
export function calculateArabicSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const prep1 = normalizeArabicText(str1);
  const prep2 = normalizeArabicText(str2);

  // Quick checks
  if (prep1 === prep2) return 1.0;
  if (prep1.includes(prep2) || prep2.includes(prep1)) return 0.9;

  // Calculate Levenshtein-like similarity for Arabic
  const len1 = prep1.length;
  const len2 = prep2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1.0;

  // Count matching characters in order
  let matches = 0;
  let i = 0, j = 0;

  while (i < len1 && j < len2) {
    if (prep1[i] === prep2[j]) {
      matches++;
      i++;
      j++;
    } else if (len1 > len2) {
      i++;
    } else {
      j++;
    }
  }

  // Calculate similarity ratio
  return matches / maxLen;
}

// ============================================
// ENHANCED RELEVANCE SCORE CALCULATION
// ============================================
export function calculateRelevanceScore(item, searchTerm) {
  let score = 0;
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  const weights = SPARK_CONFIG.RELEVANCE_WEIGHTS;

  // Code exact match (highest priority)
  if (item.code && normalizeArabicText(item.code) === normalizedSearchTerm) {
    score += weights.CODE_EXACT;
  }

  // Code starts with search term
  if (item.code && normalizeArabicText(item.code).startsWith(normalizedSearchTerm)) {
    score += weights.CODE_STARTS;
  }

  // Name exact match
  if (item.name && normalizeArabicText(item.name) === normalizedSearchTerm) {
    score += weights.NAME_EXACT;
  }

  // Name starts with search term
  if (item.name && normalizeArabicText(item.name).startsWith(normalizedSearchTerm)) {
    score += weights.NAME_STARTS;
  }

  // Name contains search term
  if (item.name && normalizeArabicText(item.name).includes(normalizedSearchTerm)) {
    score += weights.NAME_CONTAINS;
  }

  // Other fields contain search term
  const otherFields = [
    'color', 'supplier', 'item_location', 'warehouse_id', 
    'notes', 'category', 'barcode', 'sku'
  ];

  otherFields.forEach(field => {
    if (item[field] && normalizeArabicText(item[field]).includes(normalizedSearchTerm)) {
      score += weights.OTHER_FIELDS;
    }
  });

  // Bonus for items with higher quantity (better availability)
  const quantity = item.remaining_quantity || 0;
  if (quantity > 0) {
    score += Math.min(quantity, weights.QUANTITY_BONUS);
  }

  // Bonus for recently updated items
  if (item.updated_at) {
    const updateDate = item.updated_at.toDate ? item.updated_at.toDate() : new Date(item.updated_at);
    const daysSinceUpdate = (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      score += weights.RECENCY_BONUS;
    }
  }

  // Additional weight for search term length
  if (searchTerm.length >= 4) {
    score += 25; // Increased bonus for longer searches
  }

  // Bonus for exact matches in any field
  const allFields = ['name', 'code', 'color', 'supplier', 'item_location'];
  const hasExactMatch = allFields.some(field => 
    item[field] && normalizeArabicText(item[field]) === normalizedSearchTerm
  );

  if (hasExactMatch) {
    score += 30;
  }

  return score;
}

// ============================================
// ENHANCED RESULT MERGING AND DEDUPLICATION
// ============================================
export function removeDuplicatesAndSortByRelevance(items, searchTerm, limit) {
  const seen = new Set();
  const uniqueItems = [];

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      uniqueItems.push(item);
    }
  }

  // Sort by relevance score (descending)
  uniqueItems.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, searchTerm);
    const scoreB = calculateRelevanceScore(b, searchTerm);
    return scoreB - scoreA;
  });

  return uniqueItems.slice(0, limit);
}

// ============================================
// SMART RESULT MERGING FUNCTION
// ============================================
export function mergeSearchResults(localResults, firebaseResults, searchTerm, limit) {
  const allResults = new Map();
  const maxAge = Date.now() - (60 * 60 * 1000); // 1 hour

  // Add Firebase results first (more current)
  firebaseResults.forEach(item => {
    if (item.updated_at) {
      const updated = item.updated_at.toDate ? item.updated_at.toDate() : new Date(item.updated_at);
      if (updated.getTime() > maxAge) {
        item._freshness = 1.0;
      } else {
        item._freshness = 0.5;
      }
    } else {
      item._freshness = 0.3;
    }

    item._source = 'firebase';
    allResults.set(item.id, item);
  });

  // Add/update with local results
  localResults.forEach(item => {
    const existing = allResults.get(item.id);
    if (existing) {
      // Update if local is more recent or has more data
      if (item.remaining_quantity !== undefined && existing.remaining_quantity === undefined) {
        existing.remaining_quantity = item.remaining_quantity;
      }
      existing._hasLocal = true;
    } else {
      item._source = 'local';
      item._freshness = 0.2;
      allResults.set(item.id, item);
    }
  });

  // Calculate final relevance
  const finalResults = Array.from(allResults.values())
    .map(item => ({
      ...item,
      _finalScore: calculateRelevanceScore(item, searchTerm) * (item._freshness || 0.5)
    }))
    .sort((a, b) => b._finalScore - a._finalScore)
    .slice(0, limit)
    .map(item => {
      // Remove internal scoring fields
      const { _relevance, _freshness, _source, _hasLocal, _finalScore, ...cleanItem } = item;
      return cleanItem;
    });

  return finalResults;
}

// ============================================
// ENHANCED FUZZY LOCAL SEARCH
// ============================================
export function fuzzyLocalSearch(items, searchTerm, warehouseId, limit) {
  const normalizedTerm = normalizeArabicText(searchTerm);
  const terms = normalizedTerm.split(' ');

  const scoredItems = [];

  for (const item of items) {
    // Check warehouse filter
    if (warehouseId && warehouseId !== 'all' && item.warehouse_id !== warehouseId) {
      continue;
    }

    // Get match score using enhanced matching
    const { matched, score } = matchArabicTextWithScore(item, searchTerm, [
      'name', 'code', 'color', 'supplier', 'item_location'
    ]);

    if (matched && score > 30) { // Minimum score threshold
      scoredItems.push({ item, score });
    }
  }

  // Sort by score and limit
  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, limit).map(scored => scored.item);
}