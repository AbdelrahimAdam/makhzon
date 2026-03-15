<template>
  <div class="user-management" :class="{ 'dark-mode': isDarkMode }">
    <!-- Loading Overlay -->
    <div v-if="usersLoading && !authError" class="loading-overlay">
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="loading-text">جاري تحميل بيانات المستخدمين...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="authError && !usersLoading" class="error-container">
      <div class="error-card">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>حدث خطأ</h2>
        <p class="error-message">{{ authError }}</p>
        <div class="error-actions">
          <button @click="init" class="btn-primary">
            <i class="fas fa-redo"></i> إعادة المحاولة
          </button>
          <button @click="$router.push('/dashboard')" class="btn-secondary">
            <i class="fas fa-home"></i> العودة للرئيسية
          </button>
        </div>
      </div>
    </div>

    <!-- Permission Error -->
    <div v-if="!canManageUsers && !usersLoading" class="error-container">
      <div class="error-card">
        <div class="error-icon">
          <i class="fas fa-lock"></i>
        </div>
        <h2>صلاحية غير كافية</h2>
        <p class="error-message">
          ليس لديك صلاحية للوصول إلى إدارة المستخدمين. يرجى التواصل مع المشرف.
        </p>
        <div class="error-actions">
          <button @click="$router.push('/dashboard')" class="btn-primary">
            <i class="fas fa-arrow-right"></i> العودة للوحة التحكم
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="canManageUsers && !usersLoading && !authError" class="main-content">
      <!-- Header -->
      <div class="header-section">
        <div class="header-content">
          <div class="header-info">
            <h1 class="page-title">
              <i class="fas fa-users-cog"></i> إدارة المستخدمين
            </h1>
            <p class="page-subtitle">
              إدارة مستخدمي النظام، الصلاحيات، والمخازن
              <span v-if="userProfile" class="user-role-badge">
                <i :class="getRoleIcon(userProfile.role)"></i>
                {{ getRoleName(userProfile.role) }}
              </span>
            </p>
          </div>
          <div class="header-actions">
            <button @click="toggleTheme" class="theme-toggle" :title="isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'">
              <i :class="themeIcon"></i>
            </button>
            <button @click="exportUsers" class="btn-info" :disabled="exporting">
              <i class="fas" :class="exporting ? 'fa-spinner fa-spin' : 'fa-file-export'"></i>
              {{ exporting ? 'جاري التصدير...' : 'تصدير' }}
            </button>
            <button @click="openCreateModal" class="btn-success">
              <i class="fas fa-user-plus"></i> إضافة مستخدم جديد
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total-users">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h3>إجمالي المستخدمين</h3>
              <p class="stat-number">{{ stats.totalUsers }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon active-users">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-content">
              <h3>المستخدمين النشطين</h3>
              <p class="stat-number">{{ stats.activeUsers }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon inactive-users">
              <i class="fas fa-user-times"></i>
            </div>
            <div class="stat-content">
              <h3>المستخدمين المعطلين</h3>
              <p class="stat-number">{{ stats.inactiveUsers }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon superadmins">
              <i class="fas fa-crown"></i>
            </div>
            <div class="stat-content">
              <h3>المشرفين العامين</h3>
              <p class="stat-number">{{ stats.superadmins }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="filters-grid">
          <!-- Search -->
          <div class="filter-group">
            <label for="search">
              <i class="fas fa-search"></i> بحث
            </label>
            <div class="search-input">
              <input
                type="text"
                id="search"
                v-model="filters.search"
                placeholder="ابحث بالاسم، البريد، أو الدور..."
                @input="debouncedSearch"
              >
              <button v-if="filters.search" @click="clearSearch" class="clear-search">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Role Filter -->
          <div class="filter-group">
            <label for="roleFilter">
              <i class="fas fa-user-tag"></i> الدور
            </label>
            <select id="roleFilter" v-model="filters.role" @change="applyFilters">
              <option value="">جميع الأدوار</option>
              <option value="superadmin">مشرف عام</option>
              <option value="company_manager">مدير شركة</option>
              <option value="warehouse_manager">مدير مخزن</option>
              <option value="viewer">مشاهد</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <label for="statusFilter">
              <i class="fas fa-toggle-on"></i> الحالة
            </label>
            <select id="statusFilter" v-model="filters.status" @change="applyFilters">
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>

          <!-- Warehouse Filter -->
          <div class="filter-group">
            <label for="warehouseFilter">
              <i class="fas fa-warehouse"></i> المخزن
            </label>
            <select id="warehouseFilter" v-model="filters.warehouse" @change="applyFilters">
              <option value="">جميع المخازن</option>
              <option value="all">جميع المخازن</option>
              <option v-for="warehouse in accessibleWarehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name_ar || warehouse.name }}
              </option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="filter-group date-range">
            <label>
              <i class="fas fa-calendar-alt"></i> الفترة الزمنية
            </label>
            <div class="date-inputs">
              <input
                type="date"
                v-model="filters.startDate"
                :max="filters.endDate"
                @change="applyFilters"
                :title="'من ' + formatDateDisplay(filters.startDate)"
              >
              <span class="date-separator">إلى</span>
              <input
                type="date"
                v-model="filters.endDate"
                :min="filters.startDate"
                :max="today"
                @change="applyFilters"
                :title="'إلى ' + formatDateDisplay(filters.endDate)"
              >
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <div class="bulk-actions-container">
            <button @click="showBulkActions = !showBulkActions" class="btn-secondary">
              <i class="fas fa-bars"></i> إجراءات جماعية
            </button>

            <div v-if="showBulkActions" class="bulk-actions-dropdown">
              <button @click="bulkActivate" :disabled="selectedUsers.length === 0" class="bulk-action-btn">
                <i class="fas fa-check-circle"></i> تفعيل المحددين
              </button>
              <button @click="bulkDeactivate" :disabled="selectedUsers.length === 0" class="bulk-action-btn">
                <i class="fas fa-times-circle"></i> تعطيل المحددين
              </button>
              <button @click="bulkDelete" :disabled="selectedUsers.length === 0" class="bulk-action-btn danger">
                <i class="fas fa-trash-alt"></i> حذف المحددين
              </button>
              <button @click="exportSelected" :disabled="selectedUsers.length === 0" class="bulk-action-btn info">
                <i class="fas fa-file-export"></i> تصدير المحددين
              </button>
            </div>
          </div>

          <button @click="refreshData" :disabled="refreshing" class="btn-info">
            <i class="fas" :class="refreshing ? 'fa-spinner fa-spin' : 'fa-redo'"></i>
            {{ refreshing ? 'جاري التحديث...' : 'تحديث' }}
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <h3>
              <i class="fas fa-list"></i> قائمة المستخدمين
              <span class="table-count">({{ filteredUsers.length }} مستخدم)</span>
            </h3>
            <div class="selection-info" v-if="selectedUsers.length > 0">
              <i class="fas fa-check-circle"></i>
              تم تحديد {{ selectedUsers.length }} مستخدم
              <button @click="clearSelection" class="clear-selection">
                <i class="fas fa-times"></i> إلغاء التحديد
              </button>
            </div>
          </div>
          <div class="table-actions">
            <button @click="toggleAllSelection" class="select-all-btn">
              <i class="fas" :class="allSelected ? 'fa-check-square' : 'fa-square'"></i>
              {{ allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل' }}
            </button>
            <div class="view-options">
              <button @click="viewMode = 'grid'" :class="{ 'active': viewMode === 'grid' }" class="view-btn">
                <i class="fas fa-th-large"></i>
              </button>
              <button @click="viewMode = 'list'" :class="{ 'active': viewMode === 'list' }" class="view-btn">
                <i class="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Grid View -->
        <div v-if="viewMode === 'grid' && filteredUsers.length > 0" class="users-grid">
          <div
            v-for="user in paginatedUsers"
            :key="user.id"
            class="user-card"
            :class="{ 
              'selected': selectedUsers.includes(user.id),
              'inactive': !user.is_active
            }"
          >
            <!-- Card Header -->
            <div class="card-header">
              <div class="user-avatar-section">
                <div class="user-avatar" :style="getAvatarStyle(user)">
                  {{ getUserInitials(user) }}
                </div>
                <div class="user-status" :class="{ 'online': user.is_active, 'offline': !user.is_active }">
                  <i class="fas fa-circle"></i>
                </div>
              </div>
              <div class="user-actions">
                <button @click.stop="toggleUserSelection(user.id)" class="select-user-btn">
                  <i class="fas" :class="selectedUsers.includes(user.id) ? 'fa-check-square' : 'fa-square'"></i>
                </button>
                <div class="dropdown">
                  <button @click.stop="toggleDropdown(user.id)" class="dropdown-toggle">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div v-if="activeDropdown === user.id" class="dropdown-menu">
                    <button @click="editUser(user)" class="dropdown-item">
                      <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button @click="viewUserProfile(user)" class="dropdown-item">
                      <i class="fas fa-eye"></i> عرض التفاصيل
                    </button>
                    <button 
                      @click="toggleUserStatus(user)" 
                      :class="{ 'danger': user.is_active }" 
                      class="dropdown-item"
                    >
                      <i :class="user.is_active ? 'fas fa-user-times' : 'fas fa-user-check'"></i>
                      {{ user.is_active ? 'تعطيل' : 'تفعيل' }}
                    </button>
                    <button @click="openDeleteModal(user)" class="dropdown-item danger">
                      <i class="fas fa-trash-alt"></i> حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <div class="user-info">
                <h4 class="user-name">{{ user.name }}</h4>
                <p class="user-email">{{ user.email }}</p>

                <div class="user-meta">
                  <span class="user-role" :class="user.role">
                    <i :class="getRoleIcon(user.role)"></i>
                    {{ getRoleName(user.role) }}
                  </span>
                  <span class="user-date">
                    <i class="fas fa-calendar"></i>
                    {{ formatDate(user.created_at) }}
                  </span>
                </div>

                <div class="user-stats">
                  <div class="stat-item">
                    <i class="fas fa-warehouse"></i>
                    <span>{{ getUserWarehouseCount(user) }} مخزن</span>
                  </div>
                  <div class="stat-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>{{ getUserPermissionsCount(user) }} صلاحية</span>
                  </div>
                </div>

                <div v-if="user.allowed_warehouses" class="warehouses-preview">
                  <div class="warehouses-label">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>المخازن المسموحة:</span>
                  </div>
                  <div class="warehouses-list">
                    <span v-if="user.allowed_warehouses.includes('all')" class="warehouse-tag all">
                      جميع المخازن
                    </span>
                    <template v-else>
                      <span 
                        v-for="warehouseId in user.allowed_warehouses.slice(0, 2)" 
                        :key="warehouseId" 
                        class="warehouse-tag"
                      >
                        {{ getWarehouseName(warehouseId) }}
                      </span>
                      <span 
                        v-if="user.allowed_warehouses.length > 2" 
                        class="warehouse-tag more"
                      >
                        +{{ user.allowed_warehouses.length - 2 }} أخرى
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <button @click="impersonateUser(user)" class="btn-secondary btn-sm" :disabled="user.id === currentUserId">
                <i class="fas fa-user-secret"></i> الدخول كمستخدم
              </button>
              <button @click="resetPassword(user)" class="btn-info btn-sm">
                <i class="fas fa-key"></i> إعادة تعيين كلمة المرور
              </button>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div v-else-if="viewMode === 'list' && filteredUsers.length > 0" class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th class="select-column">
                  <input 
                    type="checkbox" 
                    :checked="allSelected" 
                    @change="toggleAllSelection"
                    class="select-checkbox"
                  >
                </th>
                <th class="user-column">المستخدم</th>
                <th class="role-column">الدور</th>
                <th class="warehouses-column">المخازن</th>
                <th class="status-column">الحالة</th>
                <th class="date-column">تاريخ الإنشاء</th>
                <th class="actions-column">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="user in paginatedUsers" 
                :key="user.id"
                :class="{ 
                  'selected': selectedUsers.includes(user.id),
                  'inactive': !user.is_active
                }"
              >
                <!-- Select Checkbox -->
                <td class="select-cell">
                  <input 
                    type="checkbox" 
                    :checked="selectedUsers.includes(user.id)" 
                    @change="toggleUserSelection(user.id)"
                    class="select-checkbox"
                  >
                </td>

                <!-- User Info -->
                <td class="user-cell">
                  <div class="user-info-row">
                    <div class="user-avatar-sm" :style="getAvatarStyle(user)">
                      {{ getUserInitials(user) }}
                    </div>
                    <div class="user-details">
                      <div class="user-name-row">
                        <h5 class="user-name">{{ user.name }}</h5>
                        <span v-if="user.id === currentUserId" class="current-user-badge">
                          <i class="fas fa-user"></i> أنت
                        </span>
                      </div>
                      <p class="user-email">{{ user.email }}</p>
                      <div class="user-meta-row">
                        <span class="last-login" v-if="user.last_login">
                          <i class="fas fa-sign-in-alt"></i>
                          آخر دخول: {{ formatTimeAgo(user.last_login) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Role -->
                <td class="role-cell">
                  <span class="role-badge" :class="user.role">
                    <i :class="getRoleIcon(user.role)"></i>
                    {{ getRoleName(user.role) }}
                  </span>
                  <div class="permissions-count" v-if="user.permissions">
                    <i class="fas fa-shield-alt"></i>
                    {{ user.permissions.length }} صلاحية
                  </div>
                </td>

                <!-- Warehouses -->
                <td class="warehouses-cell">
                  <div v-if="user.allowed_warehouses" class="warehouses-list-table">
                    <div v-if="user.allowed_warehouses.includes('all')" class="all-warehouses">
                      <i class="fas fa-check-circle"></i>
                      جميع المخازن
                    </div>
                    <template v-else>
                      <div class="warehouses-count">
                        <i class="fas fa-warehouse"></i>
                        {{ user.allowed_warehouses.length }} مخزن
                      </div>
                      <div class="warehouses-preview-table">
                        <span 
                          v-for="warehouseId in user.allowed_warehouses.slice(0, 3)" 
                          :key="warehouseId"
                          class="warehouse-tag-sm"
                        >
                          {{ getWarehouseName(warehouseId) }}
                        </span>
                        <span 
                          v-if="user.allowed_warehouses.length > 3" 
                          class="warehouse-more"
                        >
                          +{{ user.allowed_warehouses.length - 3 }}
                        </span>
                      </div>
                    </template>
                  </div>
                  <div v-else class="no-warehouses">
                    <i class="fas fa-exclamation-circle"></i>
                    لا توجد مخازن
                  </div>
                </td>

                <!-- Status -->
                <td class="status-cell">
                  <div class="status-indicator" :class="{ 'active': user.is_active }">
                    <i class="fas fa-circle"></i>
                    <span>{{ user.is_active ? 'نشط' : 'معطل' }}</span>
                  </div>
                  <button 
                    @click="toggleUserStatus(user)" 
                    class="status-toggle-btn btn-sm"
                    :class="{ 'danger': user.is_active, 'success': !user.is_active }"
                  >
                    <i :class="user.is_active ? 'fas fa-toggle-off' : 'fas fa-toggle-on'"></i>
                    {{ user.is_active ? 'تعطيل' : 'تفعيل' }}
                  </button>
                </td>

                <!-- Date -->
                <td class="date-cell">
                  <div class="date-display">
                    <i class="fas fa-calendar"></i>
                    {{ formatDate(user.created_at) }}
                  </div>
                  <div class="time-ago" v-if="user.created_at">
                    {{ formatTimeAgo(user.created_at) }}
                  </div>
                </td>

                <!-- Actions -->
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button @click="editUser(user)" class="action-btn edit" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="viewUserProfile(user)" class="action-btn view" title="عرض التفاصيل">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      @click="impersonateUser(user)" 
                      class="action-btn impersonate" 
                      title="الدخول كمستخدم"
                      :disabled="user.id === currentUserId"
                    >
                      <i class="fas fa-user-secret"></i>
                    </button>
                    <button @click="resetPassword(user)" class="action-btn reset" title="إعادة تعيين كلمة المرور">
                      <i class="fas fa-key"></i>
                    </button>
                    <button @click="openDeleteModal(user)" class="action-btn delete" title="حذف">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-users-slash"></i>
          </div>
          <h3>لا توجد نتائج</h3>
          <p>لا توجد مستخدمين تطابق معايير البحث</p>
          <button @click="clearFilters" class="btn-primary">
            <i class="fas fa-times"></i> مسح الفلاتر
          </button>
        </div>

        <!-- Pagination -->
        <div v-if="filteredUsers.length > 0" class="pagination-section">
          <div class="pagination-info">
            عرض {{ (currentPage - 1) * itemsPerPage + 1 }} إلى {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} من {{ filteredUsers.length }} مستخدم
          </div>

          <div class="pagination-controls">
            <select v-model="itemsPerPage" @change="itemsPerPage = parseInt($event.target.value)" class="page-size-select">
              <option value="10">10 لكل صفحة</option>
              <option value="25">25 لكل صفحة</option>
              <option value="50">50 لكل صفحة</option>
              <option value="100">100 لكل صفحة</option>
            </select>

            <button 
              @click="prevPage" 
              :disabled="currentPage === 1" 
              class="pagination-btn prev"
            >
              <i class="fas fa-chevron-right"></i>
            </button>

            <div class="page-numbers">
              <button 
                v-for="page in visiblePages" 
                :key="page"
                @click="goToPage(page)"
                :class="{ 'active': currentPage === page, 'disabled': page === '...' }"
                class="page-number"
              >
                {{ page }}
              </button>
            </div>

            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages" 
              class="pagination-btn next"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-container user-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>
              <i class="fas" :class="editingUser ? 'fa-user-edit' : 'fa-user-plus'"></i>
              {{ editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد' }}
            </h2>
            <button @click="closeUserModal" class="modal-close">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="saveUser" class="user-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="name">
                    <i class="fas fa-user"></i> الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    id="name"
                    v-model="userForm.name"
                    placeholder="أدخل الاسم الكامل"
                    required
                    :disabled="savingUser"
                  >
                  <span v-if="!userForm.name && formSubmitted" class="error-message">الاسم مطلوب</span>
                </div>

                <div class="form-group">
                  <label for="email">
                    <i class="fas fa-envelope"></i> البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    id="email"
                    v-model="userForm.email"
                    placeholder="user@example.com"
                    required
                    :disabled="savingUser"
                  >
                  <span v-if="!isValidEmail(userForm.email) && formSubmitted" class="error-message">
                    بريد إلكتروني غير صالح
                  </span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="role">
                    <i class="fas fa-user-tag"></i> الدور *
                  </label>
                  <select id="role" v-model="userForm.role" required :disabled="savingUser">
                    <option value="">اختر الدور</option>
                    <option value="superadmin">مشرف عام</option>
                    <option value="company_manager">مدير شركة</option>
                    <option value="warehouse_manager">مدير مخزن</option>
                    <option value="viewer">مشاهد</option>
                  </select>
                  <span v-if="!userForm.role && formSubmitted" class="error-message">الدور مطلوب</span>
                </div>

                <div v-if="!editingUser" class="form-group">
                  <label for="password">
                    <i class="fas fa-key"></i> كلمة المرور *
                  </label>
                  <div class="password-input">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      v-model="userForm.password"
                      placeholder="أدخل كلمة المرور"
                      required
                      minlength="8"
                      :disabled="savingUser"
                    >
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="password-toggle"
                      :title="showPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'"
                    >
                      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div v-if="!editingUser && userForm.password" class="password-strength" :class="passwordStrength.class">
                    <div class="strength-bar">
                      <div class="strength-fill" :style="{ width: passwordStrength.percentage + '%' }"></div>
                    </div>
                    <span>{{ passwordStrength.text }}</span>
                  </div>
                </div>
              </div>

              <!-- Warehouse Access -->
              <div class="form-group">
                <label>
                  <i class="fas fa-warehouse"></i> المخازن المسموحة
                </label>
                <div class="warehouse-selection">
                  <div class="warehouse-options">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="selectAllWarehouses" @change="toggleAllWarehouses">
                      <span class="checkbox-custom"></span>
                      <span class="checkbox-text">جميع المخازن</span>
                    </label>

                    <div class="warehouses-list">
                      <label v-for="warehouse in accessibleWarehouses" :key="warehouse.id" class="checkbox-label warehouse-item">
                        <input 
                          type="checkbox" 
                          :value="warehouse.id" 
                          v-model="userForm.allowed_warehouses"
                          :disabled="selectAllWarehouses || savingUser"
                        >
                        <span class="checkbox-custom"></span>
                        <span class="warehouse-name">{{ warehouse.name_ar || warehouse.name }}</span>
                        <span class="warehouse-type">{{ warehouse.type === 'dispatch' ? 'مخزن صرف' : 'مخزن رئيسي' }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Permissions -->
              <div class="form-group">
                <label>
                  <i class="fas fa-shield-alt"></i> الصلاحيات
                </label>
                <div class="permissions-grid">
                  <label v-for="permission in availablePermissions" :key="permission.value" class="checkbox-label permission-item">
                    <input 
                      type="checkbox" 
                      :value="permission.value" 
                      v-model="userForm.permissions"
                      :disabled="savingUser"
                    >
                    <span class="checkbox-custom"></span>
                    <div class="permission-info">
                      <i :class="permission.icon"></i>
                      <span>{{ permission.label }}</span>
                      <small>{{ permission.description }}</small>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Notes -->
              <div class="form-group">
                <label for="notes">
                  <i class="fas fa-sticky-note"></i> ملاحظات
                </label>
                <textarea
                  id="notes"
                  v-model="userForm.notes"
                  placeholder="ملاحظات إضافية عن المستخدم..."
                  rows="3"
                  :disabled="savingUser"
                ></textarea>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" @click="closeUserModal" class="btn-secondary" :disabled="savingUser">
                  <i class="fas fa-times"></i> إلغاء
                </button>
                <button type="submit" class="btn-primary" :disabled="savingUser">
                  <i class="fas" :class="savingUser ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ savingUser ? 'جاري الحفظ...' : (editingUser ? 'تحديث' : 'حفظ') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteModalVisible" class="modal-overlay" @click.self="cancelDelete">
      <div class="modal-container delete-modal">
        <div class="modal-content">
          <div class="modal-header danger">
            <h2><i class="fas fa-exclamation-triangle"></i> تأكيد الحذف</h2>
          </div>

          <div class="modal-body">
            <div class="delete-warning">
              <i class="fas fa-trash-alt"></i>
              <h3>هل أنت متأكد من حذف المستخدم؟</h3>
              <p v-if="userToDelete">
                هذا الإجراء سيحذف المستخدم <strong>{{ userToDelete.name }}</strong> (<strong>{{ userToDelete.email }}</strong>) نهائياً.
              </p>
              <p v-if="selectedUsers.length > 1 && !userToDelete" class="bulk-delete-warning">
                <i class="fas fa-exclamation-circle"></i>
                سيتم حذف <strong>{{ selectedUsers.length }}</strong> مستخدمين.
              </p>
              <div class="warning-list">
                <p><i class="fas fa-exclamation-circle"></i> لا يمكن التراجع عن هذا الإجراء</p>
                <p><i class="fas fa-history"></i> سيتم حفظ سجل الحذف في السجلات</p>
                <p><i class="fas fa-ban"></i> المستخدم لن يتمكن من تسجيل الدخول</p>
              </div>
            </div>

            <div class="delete-actions">
              <button @click="cancelDelete" class="btn-secondary">
                <i class="fas fa-times"></i> إلغاء
              </button>
              <button @click="confirmDelete" class="btn-danger" :disabled="deleting">
                <i class="fas" :class="deleting ? 'fa-spinner fa-spin' : 'fa-trash-alt'"></i>
                {{ deleting ? 'جاري الحذف...' : 'حذف' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetPasswordModal" class="modal-overlay" @click.self="cancelResetPassword">
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <h2><i class="fas fa-key"></i> إعادة تعيين كلمة المرور</h2>
            <button @click="cancelResetPassword" class="modal-close">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="reset-info">
              <i class="fas fa-user-shield"></i>
              <h3>إعادة تعيين كلمة المرور للمستخدم</h3>
              <p v-if="userToReset">
                ستقوم بإعادة تعيين كلمة مرور المستخدم <strong>{{ userToReset.name }}</strong> (<strong>{{ userToReset.email }}</strong>)
              </p>
            </div>

            <div class="reset-options">
              <div class="option-group">
                <label class="option-label">
                  <input
                    type="radio"
                    v-model="resetMethod"
                    value="auto"
                    :disabled="resetting"
                  >
                  <span class="radio-custom"></span>
                  <div class="option-content">
                    <h4><i class="fas fa-magic"></i> توليد تلقائي</h4>
                    <p>توليد كلمة مرور قوية عشوائية وإرسالها بالبريد</p>
                  </div>
                </label>

                <label class="option-label">
                  <input
                    type="radio"
                    v-model="resetMethod"
                    value="manual"
                    :disabled="resetting"
                  >
                  <span class="radio-custom"></span>
                  <div class="option-content">
                    <h4><i class="fas fa-keyboard"></i> تعيين يدوي</h4>
                    <p>تعيين كلمة مرور محددة</p>
                  </div>
                </label>
              </div>

              <div v-if="resetMethod === 'manual'" class="manual-password">
                <div class="form-group">
                  <label for="newPassword">
                    <i class="fas fa-key"></i> كلمة المرور الجديدة *
                  </label>
                  <div class="password-input">
                    <input
                      :type="showNewPassword ? 'text' : 'password'"
                      id="newPassword"
                      v-model="newPassword"
                      placeholder="أدخل كلمة المرور الجديدة"
                      required
                      minlength="8"
                      :disabled="resetting"
                    >
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="password-toggle"
                      :title="showNewPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'"
                    >
                      <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <div class="password-strength" :class="newPasswordStrength.class">
                    <div class="strength-bar">
                      <div class="strength-fill" :style="{ width: newPasswordStrength.percentage + '%' }"></div>
                    </div>
                    <span>{{ newPasswordStrength.text }}</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="confirmNewPassword">
                    <i class="fas fa-key"></i> تأكيد كلمة المرور *
                  </label>
                  <div class="password-input">
                    <input
                      :type="showConfirmNewPassword ? 'text' : 'password'"
                      id="confirmNewPassword"
                      v-model="confirmNewPassword"
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      required
                      :disabled="resetting"
                    >
                    <button
                      type="button"
                      @click="showConfirmNewPassword = !showConfirmNewPassword"
                      class="password-toggle"
                      :title="showConfirmNewPassword ? 'إخفاء كلمة المرور' : 'عرض كلمة المرور'"
                    >
                      <i :class="showConfirmNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <span v-if="passwordMatchError" class="error-message">{{ passwordMatchError }}</span>
                </div>
              </div>

              <div class="notification-option">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="sendResetNotification" :disabled="resetting">
                  <span class="checkbox-custom"></span>
                  <div class="checkbox-content">
                    <h4><i class="fas fa-envelope"></i> إرسال إشعار للمستخدم</h4>
                    <p>إرسال بريد إلكتروني للمستخدم يحتوي على كلمة المرور الجديدة</p>
                  </div>
                </label>
              </div>
            </div>

            <div class="reset-actions">
              <button @click="cancelResetPassword" class="btn-secondary" :disabled="resetting">
                <i class="fas fa-times"></i> إلغاء
              </button>
              <button @click="confirmResetPassword" class="btn-primary" :disabled="resetting || !canResetPassword">
                <i class="fas" :class="resetting ? 'fa-spinner fa-spin' : 'fa-key'"></i>
                {{ resetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toast.show" class="toast-container" :class="toast.type">
      <div class="toast-content">
        <i :class="toast.icon"></i>
        <p>{{ toast.message }}</p>
      </div>
      <button @click="hideToast" class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { auth, db } from '@/firebase/config'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore'

export default {
  name: 'UserManagement',
  
  data() {
    return {
      loading: true,
      localError: null,
      refreshing: false,
      exporting: false,
      deleting: false,
      resetting: false,
      savingUser: false,
      formSubmitted: false,
      
      // View Mode
      viewMode: 'grid',
      isDarkMode: false,
      
      // Filters
      filters: {
        search: '',
        role: '',
        status: '',
        warehouse: '',
        startDate: '',
        endDate: ''
      },
      
      // Selected Users
      selectedUsers: [],
      showBulkActions: false,
      activeDropdown: null,
      
      // Pagination
      currentPage: 1,
      itemsPerPage: 25,
      
      // Modals
      showUserModal: false,
      editingUser: null,
      userForm: {
        name: '',
        email: '',
        role: '',
        password: '',
        allowed_warehouses: [],
        permissions: ['view_reports'],
        notes: ''
      },
      deleteModalVisible: false,
      userToDelete: null,
      showResetPasswordModal: false,
      userToReset: null,
      
      // User Creation/Edit
      selectAllWarehouses: false,
      showPassword: false,
      
      // Reset Password
      resetMethod: 'auto',
      newPassword: '',
      confirmNewPassword: '',
      showNewPassword: false,
      showConfirmNewPassword: false,
      sendResetNotification: true,
      passwordMatchError: '',
      
      // Toast
      toast: {
        show: false,
        type: 'success',
        message: '',
        icon: 'fas fa-check-circle'
      },
      
      // Available permissions
      availablePermissions: [
        { value: 'full_access', label: 'صلاحية كاملة', icon: 'fas fa-crown', description: 'جميع الصلاحيات' },
        { value: 'view_items', label: 'عرض الأصناف', icon: 'fas fa-eye', description: 'عرض المخزون' },
        { value: 'add_items', label: 'إضافة أصناف', icon: 'fas fa-plus', description: 'إضافة أصناف جديدة' },
        { value: 'edit_items', label: 'تعديل الأصناف', icon: 'fas fa-edit', description: 'تعديل بيانات الأصناف' },
        { value: 'delete_items', label: 'حذف الأصناف', icon: 'fas fa-trash', description: 'حذف الأصناف' },
        { value: 'transfer_items', label: 'نقل الأصناف', icon: 'fas fa-exchange-alt', description: 'نقل بين المخازن' },
        { value: 'dispatch_items', label: 'صرف الأصناف', icon: 'fas fa-truck', description: 'صرف للأقسام/العملاء' },
        { value: 'view_reports', label: 'عرض التقارير', icon: 'fas fa-chart-bar', description: 'عرض الإحصائيات' },
        { value: 'view_users', label: 'عرض المستخدمين', icon: 'fas fa-users', description: 'عرض قائمة المستخدمين' },
        { value: 'manage_invoices', label: 'إدارة الفواتير', icon: 'fas fa-file-invoice', description: 'إنشاء وإدارة الفواتير' }
      ],
      
      // Debounce search
      searchTimeout: null
    }
  },
  
  computed: {
    ...mapState(['allUsers', 'warehouses', 'user', 'usersLoading', 'authError']),
    ...mapGetters([
      'userProfile',
      'canManageUsers',
      'accessibleWarehouses',
      'getWarehouseLabel'
    ]),
    
    // Current User ID
    currentUserId() {
      return this.user?.uid
    },
    
    // Theme
    themeIcon() {
      return this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon'
    },
    
    // Today's date for date picker max
    today() {
      return new Date().toISOString().split('T')[0]
    },
    
    // User Statistics
    stats() {
      const stats = {
        totalUsers: this.allUsers.length,
        activeUsers: 0,
        inactiveUsers: 0,
        superadmins: 0,
        companyManagers: 0,
        warehouseManagers: 0,
        employees: 0
      }
      
      this.allUsers.forEach(user => {
        if (user.is_active !== false) {
          stats.activeUsers++
        } else {
          stats.inactiveUsers++
        }
        
        switch (user.role) {
          case 'superadmin':
            stats.superadmins++
            break
          case 'company_manager':
            stats.companyManagers++
            break
          case 'warehouse_manager':
            stats.warehouseManagers++
            break
          case 'user':
          case 'viewer': // Handle legacy 'viewer' values
            stats.employees++
            break
        }
      })
      
      return stats
    },
    
    // Filtered Users
    filteredUsers() {
      let filtered = [...this.allUsers]
      
      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase()
        filtered = filtered.filter(user => 
          (user.name?.toLowerCase() || '').includes(searchTerm) ||
          (user.email?.toLowerCase() || '').includes(searchTerm) ||
          (this.getRoleName(user.role)?.toLowerCase() || '').includes(searchTerm)
        )
      }
      
      // Role filter
      if (this.filters.role) {
        filtered = filtered.filter(user => user.role === this.filters.role)
      }
      
      // Status filter
      if (this.filters.status) {
        const isActive = this.filters.status === 'active'
        filtered = filtered.filter(user => 
          (user.is_active !== false) === isActive
        )
      }
      
      // Warehouse filter
      if (this.filters.warehouse) {
        if (this.filters.warehouse === 'all') {
          filtered = filtered.filter(user => 
            user.allowed_warehouses?.includes('all')
          )
        } else {
          filtered = filtered.filter(user => 
            user.allowed_warehouses?.includes(this.filters.warehouse)
          )
        }
      }
      
      // Date filter
      if (this.filters.startDate) {
        const startDate = new Date(this.filters.startDate)
        filtered = filtered.filter(user => {
          if (!user.created_at) return false
          const userDate = user.created_at.toDate ? user.created_at.toDate() : new Date(user.created_at)
          return userDate >= startDate
        })
      }
      
      if (this.filters.endDate) {
        const endDate = new Date(this.filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(user => {
          if (!user.created_at) return false
          const userDate = user.created_at.toDate ? user.created_at.toDate() : new Date(user.created_at)
          return userDate <= endDate
        })
      }
      
      return filtered.sort((a, b) => {
        // Sort by creation date (newest first)
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0)
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0)
        return dateB - dateA
      })
    },
    
    // Pagination
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredUsers.slice(start, end)
    },
    
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage)
    },
    
    visiblePages() {
      const pages = []
      const maxVisible = 5
      
      if (this.totalPages <= maxVisible) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i)
        }
      } else {
        let start = Math.max(1, this.currentPage - 2)
        let end = Math.min(this.totalPages, start + maxVisible - 1)
        
        if (end - start + 1 < maxVisible) {
          start = end - maxVisible + 1
        }
        
        if (start > 1) {
          pages.push(1)
          if (start > 2) pages.push('...')
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        
        if (end < this.totalPages) {
          if (end < this.totalPages - 1) pages.push('...')
          pages.push(this.totalPages)
        }
      }
      
      return pages
    },
    
    // Selection
    allSelected() {
      return this.filteredUsers.length > 0 && 
             this.selectedUsers.length === this.filteredUsers.length
    },
    
    // Password Strength
    newPasswordStrength() {
      return this.calculatePasswordStrength(this.newPassword)
    },
    
    passwordStrength() {
      return this.calculatePasswordStrength(this.userForm.password)
    },
    
    // Check if reset password is allowed
    canResetPassword() {
      if (this.resetMethod === 'manual') {
        return this.newPassword && 
               this.confirmNewPassword && 
               this.newPassword === this.confirmNewPassword &&
               this.newPasswordStrength.class !== 'weak'
      }
      return true
    }
  },
  
  watch: {
    selectAllWarehouses(val) {
      if (val) {
        this.userForm.allowed_warehouses = ['all']
      } else if (this.userForm.allowed_warehouses.includes('all')) {
        this.userForm.allowed_warehouses = []
      }
    },
    
    'userForm.allowed_warehouses'(val) {
      if (val.includes('all')) {
        this.selectAllWarehouses = true
      } else {
        this.selectAllWarehouses = false
      }
    }
  },
  
  methods: {
    ...mapActions([
      'loadUsers',
      'showNotification',
      'loadWarehousesEnhanced',
      'initializeAuth'
    ]),
    
    // Initialization
    async init() {
      try {
        this.loading = true
        this.localError = null
        
        // التحقق من المصادقة
        if (!this.user) {
          await this.initializeAuth()
        }
        
        // التحقق من الصلاحيات
        if (!this.canManageUsers) {
          this.localError = 'ليس لديك صلاحية للوصول إلى إدارة المستخدمين'
          return
        }
        
        // تحميل المخازن
        await this.loadWarehousesEnhanced()
        
        // تحميل المستخدمين
        await this.loadUsers()
        
        // تحميل إعدادات السمة
        this.loadThemePreference()
        
        // تهيئة فلتر التاريخ (آخر 30 يوم)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        
        this.filters.endDate = endDate.toISOString().split('T')[0]
        this.filters.startDate = startDate.toISOString().split('T')[0]
        
      } catch (error) {
        console.error('Error initializing user management:', error)
        this.localError = 'فشل في تحميل بيانات المستخدمين. يرجى المحاولة مرة أخرى.'
        this.showToast('حدث خطأ في تحميل البيانات', 'error')
      } finally {
        this.loading = false
      }
    },
    
    // Theme Management
    loadThemePreference() {
      const savedTheme = localStorage.getItem('theme')
      this.isDarkMode = savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
      this.applyTheme()
    },
    
    toggleTheme() {
      this.isDarkMode = !this.isDarkMode
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light')
      this.applyTheme()
    },
    
    applyTheme() {
      if (this.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    },
    
    // Data Management
    async refreshData() {
      try {
        this.refreshing = true
        await this.loadUsers()
        this.showToast('تم تحديث البيانات بنجاح', 'success')
      } catch (error) {
        console.error('Error refreshing data:', error)
        this.showToast('فشل في تحديث البيانات', 'error')
      } finally {
        this.refreshing = false
      }
    },
    
    // User Display Helpers
    getUserInitials(user) {
      const name = user.name || user.email
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },
    
    getAvatarStyle(user) {
      const colors = [
        '#4CAF50', '#2196F3', '#FF9800', '#E91E63',
        '#9C27B0', '#673AB7', '#3F51B5', '#00BCD4'
      ]
      const name = user.name || user.email
      const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + acc
      }, 0)
      const colorIndex = hash % colors.length
      return {
        backgroundColor: colors[colorIndex],
        color: '#FFFFFF'
      }
    },
    
    getRoleName(role) {
      const roles = {
        'superadmin': 'مشرف عام',
        'company_manager': 'مدير شركة',
        'warehouse_manager': 'مدير مخزن',
        'user': 'مشاهد',
        'viewer': 'مشاهد' // Legacy support
      }
      return roles[role] || role
    },
    
    getRoleIcon(role) {
      const icons = {
        'superadmin': 'fas fa-crown',
        'company_manager': 'fas fa-user-tie',
        'warehouse_manager': 'fas fa-warehouse',
        'user': 'fas fa-eye',
        'viewer': 'fas fa-eye' // Legacy support
      }
      return icons[role] || 'fas fa-user'
    },
    
    getWarehouseName(warehouseId) {
      if (warehouseId === 'all') return 'جميع المخازن'
      return this.getWarehouseLabel(warehouseId)
    },
    
    getUserWarehouseCount(user) {
      if (!user.allowed_warehouses) return 0
      if (user.allowed_warehouses.includes('all')) return 'جميع'
      return user.allowed_warehouses.length
    },
    
    getUserPermissionsCount(user) {
      if (!user.permissions) return 0
      if (user.permissions.includes('full_access')) return 'كاملة'
      return user.permissions.length
    },
    
    // Formatting
    formatDate(date) {
      if (!date) return 'غير محدد'
      
      try {
        const dateObj = date.toDate ? date.toDate() : new Date(date)
        return new Intl.DateTimeFormat('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(dateObj)
      } catch {
        return 'غير محدد'
      }
    },
    
    formatDateDisplay(dateString) {
      if (!dateString) return 'غير محدد'
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('ar-SA').format(date)
    },
    
    formatTimeAgo(date) {
      if (!date) return 'غير معروف'
      
      try {
        const now = new Date()
        const past = date.toDate ? date.toDate() : new Date(date)
        const diffMs = now - past
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)
        
        if (diffDay > 30) return this.formatDate(date)
        if (diffDay > 0) return `قبل ${diffDay} يوم`
        if (diffHour > 0) return `قبل ${diffHour} ساعة`
        if (diffMin > 0) return `قبل ${diffMin} دقيقة`
        return 'الآن'
      } catch {
        return 'غير معروف'
      }
    },
    
    // Search and Filters
    debouncedSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.applyFilters()
      }, 300)
    },
    
    applyFilters() {
      this.currentPage = 1
    },
    
    clearSearch() {
      this.filters.search = ''
      this.applyFilters()
    },
    
    clearFilters() {
      this.filters = {
        search: '',
        role: '',
        status: '',
        warehouse: '',
        startDate: '',
        endDate: ''
      }
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      this.filters.endDate = endDate.toISOString().split('T')[0]
      this.filters.startDate = startDate.toISOString().split('T')[0]
      this.applyFilters()
    },
    
    // Selection Management
    toggleUserSelection(userId) {
      const index = this.selectedUsers.indexOf(userId)
      if (index === -1) {
        this.selectedUsers.push(userId)
      } else {
        this.selectedUsers.splice(index, 1)
      }
    },
    
    toggleAllSelection() {
      if (this.allSelected) {
        this.selectedUsers = []
      } else {
        this.selectedUsers = this.filteredUsers.map(user => user.id)
      }
    },
    
    clearSelection() {
      this.selectedUsers = []
    },
    
    // Dropdown Management
    toggleDropdown(userId) {
      this.activeDropdown = this.activeDropdown === userId ? null : userId
    },
    
    // User Actions
    openCreateModal() {
      this.editingUser = null
      this.resetUserForm()
      this.showUserModal = true
      this.activeDropdown = null
    },
    
    editUser(user) {
      // Map legacy role 'viewer' to 'user' for compatibility
      let role = user.role
      if (role === 'viewer') role = 'user'
      
      this.editingUser = user
      this.userForm = {
        name: user.name,
        email: user.email,
        role: role,
        password: '',
        allowed_warehouses: user.allowed_warehouses || [],
        permissions: user.permissions || ['view_reports'],
        notes: user.notes || ''
      }
      this.showUserModal = true
      this.activeDropdown = null
    },
    
    resetUserForm() {
      this.userForm = {
        name: '',
        email: '',
        role: '',
        password: '',
        allowed_warehouses: [],
        permissions: ['view_reports'],
        notes: ''
      }
      this.selectAllWarehouses = false
      this.showPassword = false
      this.formSubmitted = false
    },
    
    async saveUser() {
      this.formSubmitted = true
      
      // التحقق من النموذج
      if (!this.userForm.name || !this.userForm.email || !this.userForm.role) {
        this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error')
        return
      }
      
      if (!this.editingUser && !this.userForm.password) {
        this.showToast('يرجى إدخال كلمة المرور', 'error')
        return
      }
      
      if (!this.isValidEmail(this.userForm.email)) {
        this.showToast('يرجى إدخال بريد إلكتروني صحيح', 'error')
        return
      }
      
      if (!this.editingUser && this.passwordStrength.class === 'weak') {
        this.showToast('كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى', 'error')
        return
      }
      
      try {
        this.savingUser = true
        
        const userData = {
          name: this.userForm.name.trim(),
          email: this.userForm.email.trim(),
          role: this.userForm.role, // This will be one of the allowed roles
          allowed_warehouses: this.userForm.allowed_warehouses,
          permissions: this.userForm.permissions,
          notes: this.userForm.notes.trim(),
          is_active: true,
          profile_complete: true
        }
        
        if (this.editingUser) {
          // تحديث مستخدم موجود
          await this.updateUser(this.editingUser.id, userData)
          
          this.showToast('تم تحديث المستخدم بنجاح', 'success')
        } else {
          // إنشاء مستخدم جديد
          await this.createUser({
            ...userData,
            password: this.userForm.password
          })
          
          this.showToast('تم إنشاء المستخدم بنجاح', 'success')
        }
        
        this.closeUserModal()
        await this.refreshData()
        
      } catch (error) {
        console.error('Error saving user:', error)
        this.showToast(error.message || 'حدث خطأ أثناء حفظ المستخدم', 'error')
      } finally {
        this.savingUser = false
      }
    },
    
    // Custom methods for user operations
    async createUser(userData) {
      try {
        const { email, password, ...profileData } = userData

        // التحقق من وجود companyId للمستخدم الحالي
        if (!this.userProfile || !this.userProfile.companyId) {
          throw new Error('لم يتم العثور على معرف الشركة. يرجى تسجيل الدخول مرة أخرى.')
        }

        // إنشاء المستخدم في Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user

        // إنشاء وثيقة المستخدم في Firestore مع companyId
        const userDocData = {
          ...profileData,
          email: email,
          uid: newUser.uid,
          companyId: this.userProfile.companyId,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          created_by: this.user?.uid
        }

        await setDoc(doc(db, 'users', newUser.uid), userDocData)

        this.showNotification({
          type: 'success',
          message: `تم إنشاء المستخدم ${profileData.name} بنجاح`
        })

        return { success: true, userId: newUser.uid }

      } catch (error) {
        console.error('Error creating user:', error)

        let errorMessage = 'فشل في إنشاء المستخدم'
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'البريد الإلكتروني مستخدم بالفعل'
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'البريد الإلكتروني غير صالح'
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'كلمة المرور ضعيفة'
        }

        this.showNotification({
          type: 'error',
          message: errorMessage
        })

        throw new Error(errorMessage)
      }
    },
    
    async updateUser(userId, userData) {
      try {
        const userRef = doc(db, 'users', userId)
        
        // تحديث البيانات
        const updateData = {
          ...userData,
          updated_at: serverTimestamp(),
          updated_by: this.user?.uid
        }
        
        await updateDoc(userRef, updateData)
        
        this.showNotification({
          type: 'success',
          message: 'تم تحديث بيانات المستخدم بنجاح'
        })
        
        return { success: true }
        
      } catch (error) {
        console.error('Error updating user:', error)
        this.showNotification({
          type: 'error',
          message: 'فشل في تحديث بيانات المستخدم'
        })
        throw error
      }
    },
    
    async deleteUser(userId) {
      try {
        // منع حذف المستخدم الحالي
        if (userId === this.currentUserId) {
          throw new Error('لا يمكنك حذف حسابك الخاص')
        }
        
        // حذف من Firestore
        await deleteDoc(doc(db, 'users', userId))
        
        this.showNotification({
          type: 'success',
          message: 'تم حذف المستخدم بنجاح'
        })
        
        return { success: true }
        
      } catch (error) {
        console.error('Error deleting user:', error)
        this.showNotification({
          type: 'error',
          message: 'فشل في حذف المستخدم'
        })
        throw error
      }
    },
    
    async updateUserStatus(userId, isActive) {
      try {
        const userRef = doc(db, 'users', userId)
        
        await updateDoc(userRef, {
          is_active: isActive,
          updated_at: serverTimestamp(),
          updated_by: this.user?.uid
        })
        
        this.showNotification({
          type: 'success',
          message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`
        })
        
        return { success: true }
        
      } catch (error) {
        console.error('Error updating user status:', error)
        this.showNotification({
          type: 'error',
          message: 'فشل في تغيير حالة المستخدم'
        })
        throw error
      }
    },
    
    async bulkUpdateUsers(userIds, updates) {
      try {
        const batch = writeBatch(db)
        
        userIds.forEach(userId => {
          const userRef = doc(db, 'users', userId)
          batch.update(userRef, {
            ...updates,
            updated_at: serverTimestamp(),
            updated_by: this.user?.uid
          })
        })
        
        await batch.commit()
        
        this.showNotification({
          type: 'success',
          message: `تم تحديث ${userIds.length} مستخدم بنجاح`
        })
        
        return { success: true }
        
      } catch (error) {
        console.error('Error bulk updating users:', error)
        this.showNotification({
          type: 'error',
          message: 'فشل في التحديث الجماعي'
        })
        throw error
      }
    },
    
    closeUserModal() {
      this.showUserModal = false
      this.editingUser = null
      this.resetUserForm()
    },
    
    toggleAllWarehouses() {
      if (this.selectAllWarehouses) {
        this.userForm.allowed_warehouses = ['all']
      } else {
        this.userForm.allowed_warehouses = []
      }
    },
    
    viewUserProfile(user) {
      this.$router.push(`/profile/${user.id}`)
    },
    
    async toggleUserStatus(user) {
      try {
        const newStatus = !user.is_active
        const confirmMessage = newStatus 
          ? `هل تريد تفعيل المستخدم "${user.name}"؟`
          : `هل تريد تعطيل المستخدم "${user.name}"؟`
        
        if (!confirm(confirmMessage)) return
        
        await this.updateUserStatus(user.id, newStatus)
        
        // إعادة تحميل المستخدمين
        await this.loadUsers()
        
        this.showToast(
          `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`,
          'success'
        )
        
      } catch (error) {
        console.error('Error toggling user status:', error)
        this.showToast('فشل في تغيير حالة المستخدم', 'error')
      }
    },
    
    openDeleteModal(user = null) {
      const hasUserToDelete = user !== null
      const hasSelectedUsers = this.selectedUsers.length > 0
      
      if (!hasUserToDelete && !hasSelectedUsers) {
        return
      }
      
      if (!hasUserToDelete && hasSelectedUsers) {
        const selectedUserObjects = this.allUsers.filter(u => this.selectedUsers.includes(u.id))
        if (selectedUserObjects.length === 0) {
          return
        }
      }
      
      this.userToDelete = user
      this.deleteModalVisible = true
      this.activeDropdown = null
    },
    
    cancelDelete() {
      this.userToDelete = null
      this.deleteModalVisible = false
    },
    
    async confirmDelete() {
      try {
        this.deleting = true
        
        const usersToDelete = this.userToDelete 
          ? [this.userToDelete] 
          : this.allUsers.filter(user => this.selectedUsers.includes(user.id))
        
        if (usersToDelete.length === 0) {
          this.showToast('لم يتم تحديد مستخدمين للحذف', 'warning')
          return
        }
        
        // تأكيد الحذف
        const confirmMessage = usersToDelete.length === 1
          ? `هل أنت متأكد من حذف المستخدم "${usersToDelete[0].name}"؟`
          : `هل أنت متأكد من حذف ${usersToDelete.length} مستخدمين؟\n\n` +
            usersToDelete.slice(0, 3).map(u => `• ${u.name} (${u.email})`).join('\n') +
            (usersToDelete.length > 3 ? `\n• +${usersToDelete.length - 3} مستخدمين آخرين` : '')
        
        if (!confirm(confirmMessage)) {
          this.cancelDelete()
          return
        }
        
        // حذف المستخدمين
        const deletePromises = usersToDelete.map(user => 
          this.deleteUser(user.id).catch(error => {
            console.error(`Error deleting user ${user.id}:`, error)
            return { success: false, user, error }
          })
        )
        
        const results = await Promise.all(deletePromises)
        
        const failedDeletions = results.filter(r => !r.success)
        
        if (failedDeletions.length > 0) {
          const failedNames = failedDeletions.map(f => f.user.name).join(', ')
          this.showToast(`فشل حذف بعض المستخدمين: ${failedNames}`, 'error')
        } else {
          const message = usersToDelete.length === 1 
            ? `تم حذف المستخدم "${usersToDelete[0].name}" بنجاح`
            : `تم حذف ${usersToDelete.length} مستخدمين بنجاح`
          
          this.showToast(message, 'success')
        }
        
        // مسح التحديد
        this.selectedUsers = this.selectedUsers.filter(id => 
          !usersToDelete.some(user => user.id === id)
        )
        
        // إعادة تحميل المستخدمين
        await this.loadUsers()
        
      } catch (error) {
        console.error('Error confirming delete:', error)
        this.showToast('حدث خطأ أثناء حذف المستخدمين', 'error')
      } finally {
        this.deleting = false
        this.cancelDelete()
      }
    },
    
    // Bulk Actions
    async bulkActivate() {
      if (this.selectedUsers.length === 0) {
        this.showToast('لم يتم تحديد مستخدمين', 'warning')
        return
      }
      
      try {
        const confirmMessage = `هل تريد تفعيل ${this.selectedUsers.length} مستخدمين؟`
        if (!confirm(confirmMessage)) return
        
        await this.bulkUpdateUsers(this.selectedUsers, { is_active: true })
        
        // إعادة تحميل المستخدمين
        await this.loadUsers()
        
        this.showToast(
          `تم تفعيل ${this.selectedUsers.length} مستخدمين بنجاح`,
          'success'
        )
        
        this.clearSelection()
        
      } catch (error) {
        console.error('Error bulk activating users:', error)
        this.showToast('فشل في تفعيل المستخدمين', 'error')
      }
    },
    
    async bulkDeactivate() {
      if (this.selectedUsers.length === 0) {
        this.showToast('لم يتم تحديد مستخدمين', 'warning')
        return
      }
      
      try {
        const confirmMessage = `هل تريد تعطيل ${this.selectedUsers.length} مستخدمين؟`
        if (!confirm(confirmMessage)) return
        
        await this.bulkUpdateUsers(this.selectedUsers, { is_active: false })
        
        // إعادة تحميل المستخدمين
        await this.loadUsers()
        
        this.showToast(
          `تم تعطيل ${this.selectedUsers.length} مستخدمين بنجاح`,
          'success'
        )
        
        this.clearSelection()
        
      } catch (error) {
        console.error('Error bulk deactivating users:', error)
        this.showToast('فشل في تعطيل المستخدمين', 'error')
      }
    },
    
    bulkDelete() {
      if (this.selectedUsers.length === 0) {
        this.showToast('لم يتم تحديد مستخدمين', 'warning')
        return
      }
      
      this.userToDelete = null
      this.openDeleteModal()
    },
    
    // Reset Password
    resetPassword(user) {
      this.userToReset = user
      this.resetMethod = 'auto'
      this.newPassword = ''
      this.confirmNewPassword = ''
      this.showNewPassword = false
      this.showConfirmNewPassword = false
      this.sendResetNotification = true
      this.passwordMatchError = ''
      this.showResetPasswordModal = true
      this.activeDropdown = null
    },
    
    cancelResetPassword() {
      this.userToReset = null
      this.showResetPasswordModal = false
      this.passwordMatchError = ''
    },
    
    async confirmResetPassword() {
      try {
        // التحقق من كلمة المرور اليدوية
        if (this.resetMethod === 'manual') {
          if (!this.newPassword || !this.confirmNewPassword) {
            this.passwordMatchError = 'يجب إدخال كلمة المرور وتأكيدها'
            return
          }
          
          if (this.newPassword !== this.confirmNewPassword) {
            this.passwordMatchError = 'كلمات المرور غير متطابقة'
            return
          }
          
          if (this.newPasswordStrength.class === 'weak') {
            this.passwordMatchError = 'كلمة المرور ضعيفة جداً'
            return
          }
        }
        
        this.resetting = true
        
        if (this.resetMethod === 'auto') {
          // إرسال رابط إعادة تعيين كلمة المرور
          await sendPasswordResetEmail(auth, this.userToReset.email)
          
          this.showToast('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني', 'success')
          
        } else {
          // هنا يمكن إضافة Cloud Function لتغيير كلمة المرور يدوياً
          this.showToast('يجب استخدام Cloud Function لتغيير كلمة المرور يدوياً', 'info')
        }
        
        this.cancelResetPassword()
        
      } catch (error) {
        console.error('Error resetting password:', error)
        this.showToast('فشل في إعادة تعيين كلمة المرور', 'error')
      } finally {
        this.resetting = false
      }
    },
    
    generateRandomPassword() {
      const length = 12
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      let password = ''
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
      }
      return password
    },
    
    calculatePasswordStrength(password) {
      if (!password) return { class: 'weak', percentage: 0, text: 'ضعيفة' }
      
      let strength = 0
      if (password.length >= 8) strength += 25
      if (/[A-Z]/.test(password)) strength += 25
      if (/[0-9]/.test(password)) strength += 25
      if (/[^A-Za-z0-9]/.test(password)) strength += 25
      
      if (strength >= 75) return { class: 'strong', percentage: 100, text: 'قوية' }
      if (strength >= 50) return { class: 'medium', percentage: 66, text: 'متوسطة' }
      return { class: 'weak', percentage: 33, text: 'ضعيفة' }
    },
    
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },
    
    // Impersonation (simulated)
    impersonateUser(user) {
      if (user.id === this.currentUserId) {
        this.showToast('لا يمكنك الدخول كمستخدم نفسك', 'warning')
        return
      }
      
      this.showToast(`تم الدخول كمستخدم ${user.name} (ميزة تجريبية)`, 'info')
    },
    
    // Export
    async exportUsers() {
      try {
        this.exporting = true
        
        const exportData = this.filteredUsers.map(user => ({
          'الاسم': user.name,
          'البريد الإلكتروني': user.email,
          'الدور': this.getRoleName(user.role),
          'الحالة': user.is_active !== false ? 'نشط' : 'معطل',
          'المخازن المسموحة': user.allowed_warehouses?.includes('all') 
            ? 'جميع المخازن' 
            : (user.allowed_warehouses?.map(id => this.getWarehouseName(id)).join(', ') || 'لا توجد'),
          'الصلاحيات': user.permissions?.includes('full_access')
            ? 'صلاحية كاملة'
            : (user.permissions?.length || 0) + ' صلاحية',
          'تاريخ الإنشاء': this.formatDate(user.created_at),
          'آخر تحديث': user.updated_at ? this.formatDate(user.updated_at) : 'غير متاح',
          'آخر دخول': user.last_login ? this.formatDate(user.last_login) : 'غير متاح',
          'ملاحظات': user.notes || ''
        }))
        
        if (exportData.length === 0) {
          this.showToast('لا توجد بيانات للتصدير', 'warning')
          return
        }
        
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
          )
        ].join('\n')
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.showToast(`تم تصدير ${exportData.length} مستخدم`, 'success')
        
      } catch (error) {
        console.error('Error exporting users:', error)
        this.showToast('فشل في تصدير البيانات', 'error')
      } finally {
        this.exporting = false
      }
    },
    
    async exportSelected() {
      if (this.selectedUsers.length === 0) {
        this.showToast('لم يتم تحديد مستخدمين للتصدير', 'warning')
        return
      }
      
      const selectedData = this.allUsers
        .filter(user => this.selectedUsers.includes(user.id))
        .map(user => ({
          'الاسم': user.name,
          'البريد الإلكتروني': user.email,
          'الدور': this.getRoleName(user.role),
          'الحالة': user.is_active !== false ? 'نشط' : 'معطل',
          'المخازن المسموحة': user.allowed_warehouses?.includes('all') 
            ? 'جميع المخازن' 
            : (user.allowed_warehouses?.map(id => this.getWarehouseName(id)).join(', ') || 'لا توجد'),
          'الصلاحيات': user.permissions?.includes('full_access')
            ? 'صلاحية كاملة'
            : (user.permissions?.length || 0) + ' صلاحية',
          'تاريخ الإنشاء': this.formatDate(user.created_at),
          'ملاحظات': user.notes || ''
        }))
      
      const headers = Object.keys(selectedData[0])
      const csvContent = [
        headers.join(','),
        ...selectedData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `selected_users_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      this.showToast(`تم تصدير ${selectedData.length} مستخدم`, 'success')
    },
    
    // Pagination
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.scrollToTop()
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.scrollToTop()
      }
    },
    
    goToPage(page) {
      if (page !== '...') {
        this.currentPage = page
        this.scrollToTop()
      }
    },
    
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    
    // Toast Notifications
    showToast(message, type = 'success') {
      this.toast = {
        show: true,
        type,
        message,
        icon: type === 'success' ? 'fas fa-check-circle' : 
              type === 'error' ? 'fas fa-exclamation-circle' : 
              type === 'warning' ? 'fas fa-exclamation-triangle' :
              'fas fa-info-circle'
      }
      
      setTimeout(() => {
        this.hideToast()
      }, 5000)
    },
    
    hideToast() {
      this.toast.show = false
    }
  },
  
  created() {
    this.init()
  },
  
  mounted() {
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.dropdown')) {
        this.activeDropdown = null
      }
      if (!event.target.closest('.bulk-actions-container')) {
        this.showBulkActions = false
      }
    })
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.isDarkMode = e.matches
        this.applyTheme()
      }
    })
  },
  
  beforeDestroy() {
    this.closeUserModal()
    this.cancelDelete()
    this.cancelResetPassword()
  }
}
</script>
    
<style scoped>
/* ===== BASE STYLES ===== */
.user-management {
  min-height: 100vh;
  background: var(--bg-primary, #f5f5f5);
  color: var(--text-primary, #333);
  transition: all 0.3s ease;
  font-family: 'Tajawal', 'Segoe UI', sans-serif;
  direction: rtl;
  padding-bottom: 2rem;
}

.user-management.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-card: #2d2d2d;
  --bg-input: #3d3d3d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #888888;
  --border-color: #404040;
  --shadow-color: rgba(0, 0, 0, 0.3);
  --success-color: #4CAF50;
  --warning-color: #FF9800;
  --error-color: #f44336;
  --info-color: #2196F3;
  --primary-color: #2196F3;
  --secondary-color: #FF9800;
}

/* ===== LOADING & ERROR STATES ===== */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner-container {
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  font-size: 1.125rem;
  font-weight: 500;
}

.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.error-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 20px var(--shadow-color);
}

.error-icon {
  font-size: 3rem;
  color: var(--error-color);
  margin-bottom: 1rem;
}

.error-card h2 {
  margin: 0 0 1rem;
  color: var(--text-primary);
}

.error-message {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ===== MAIN CONTENT ===== */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .main-content {
    padding: 1.5rem;
  }
}

/* ===== HEADER SECTION ===== */
.header-section {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}

.page-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .page-subtitle {
    font-size: 1.125rem;
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.theme-toggle {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  transition: all 0.3s;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--primary-color);
  color: white;
  transform: rotate(15deg);
}

/* ===== STATS GRID ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: transform 0.3s;
  min-width: 0;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

@media (min-width: 768px) {
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 1.75rem;
  }
}

.total-users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.active-users { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); }
.inactive-users { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); }
.superadmins { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-content h3 {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

@media (min-width: 768px) {
  .stat-content h3 {
    font-size: 0.875rem;
  }
}

.stat-number {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

@media (min-width: 768px) {
  .stat-number {
    font-size: 2rem;
  }
}

/* ===== FILTERS SECTION ===== */
.filters-section {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group input,
.filter-group select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.3s;
  width: 100%;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

/* Search Input */
.search-input {
  position: relative;
  width: 100%;
}

.search-input input {
  width: 100%;
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.search-input::before {
  content: '\f002';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.clear-search {
  position: absolute;
  left: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
}

/* Date Range */
.date-range .date-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-inputs input {
  flex: 1;
  min-width: 0;
}

.date-separator {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (min-width: 640px) {
  .quick-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.bulk-actions-container {
  position: relative;
}

.bulk-actions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 200px;
  box-shadow: 0 4px 12px var(--shadow-color);
  z-index: 100;
  margin-top: 0.5rem;
}

.bulk-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  text-align: right;
  font-size: 0.875rem;
}

.bulk-action-btn:hover:not(:disabled) {
  background: var(--bg-input);
}

.bulk-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-action-btn.danger {
  color: var(--error-color);
}

.bulk-action-btn.info {
  color: var(--info-color);
}

/* ===== BUTTONS ===== */
button {
  font-family: 'Tajawal', 'Segoe UI', sans-serif;
}

.btn-primary,
.btn-secondary,
.btn-success,
.btn-danger,
.btn-warning,
.btn-info {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
  transform: translateY(-2px);
}

.btn-success {
  background: var(--success-color);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #388e3c;
  transform: translateY(-2px);
}

.btn-danger {
  background: var(--error-color);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
  transform: translateY(-2px);
}

.btn-warning {
  background: var(--warning-color);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #f57c00;
  transform: translateY(-2px);
}

.btn-info {
  background: var(--info-color);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #1976d2;
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

/* ===== TABLE SECTION ===== */
.table-section {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.table-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .table-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.table-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .table-info {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.table-info h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 20px;
  color: var(--info-color);
  font-size: 0.75rem;
}

.clear-selection {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.clear-selection:hover {
  color: var(--text-primary);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-all-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .select-all-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

.select-all-btn:hover {
  background: var(--bg-input);
}

.view-options {
  display: flex;
  background: var(--bg-input);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.view-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
}

.view-btn.active {
  background: var(--primary-color);
  color: white;
}

/* ===== GRID VIEW ===== */
.users-grid {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  min-height: 300px;
}

@media (max-width: 480px) {
  .users-grid {
    grid-template-columns: 1fr;
  }
}

.user-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
  border-color: var(--primary-color);
}

.user-card.selected {
  border-color: var(--info-color);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
}

.user-card.inactive {
  opacity: 0.7;
}

.user-card.inactive:hover {
  opacity: 1;
}

.card-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
}

.user-avatar-section {
  position: relative;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
}

.user-status {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 14px;
  height: 14px;
  background: var(--bg-card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-status .fa-circle {
  font-size: 8px;
}

.user-status.online .fa-circle {
  color: var(--success-color);
}

.user-status.offline .fa-circle {
  color: var(--error-color);
}

.user-actions {
  display: flex;
  gap: 0.25rem;
}

.select-user-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-user-btn:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}

.dropdown {
  position: relative;
}

.dropdown-toggle {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-toggle:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 150px;
  box-shadow: 0 4px 12px var(--shadow-color);
  z-index: 100;
  margin-top: 0.25rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
  text-align: right;
  font-size: 0.75rem;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--bg-input);
}

.dropdown-item.danger {
  color: var(--error-color);
}

.card-body {
  padding: 1rem;
  flex: 1;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-name {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.user-email {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
  direction: ltr;
  text-align: right;
  word-break: break-all;
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

.user-role,
.user-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-input);
}

.user-role.superadmin {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.user-role.company_manager {
  background: rgba(33, 150, 243, 0.1);
  color: var(--info-color);
}

.user-role.warehouse_manager {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.user-role.employee {
  background: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.user-stats {
  display: flex;
  gap: 1rem;
  margin: 0.25rem 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.warehouses-preview {
  margin-top: 0.5rem;
}

.warehouses-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.warehouses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.warehouse-tag {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  background: var(--bg-input);
  border-radius: 4px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.warehouse-tag.all {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.warehouse-tag.more {
  background: rgba(33, 150, 243, 0.1);
  color: var(--info-color);
}

.card-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ===== TABLE VIEW ===== */
.users-table-container {
  overflow-x: auto;
  padding: 0 1rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.users-table thead {
  background: var(--bg-input);
}

.users-table th {
  padding: 0.75rem;
  text-align: right;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .users-table th {
    padding: 1rem;
    font-size: 0.875rem;
  }
}

.users-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.users-table tbody tr:hover {
  background: var(--bg-input);
}

.users-table tbody tr.selected {
  background: rgba(33, 150, 243, 0.05);
}

.users-table tbody tr.inactive {
  opacity: 0.7;
}

.users-table tbody tr.inactive:hover {
  opacity: 1;
}

.users-table td {
  padding: 0.75rem;
  vertical-align: middle;
}

@media (min-width: 768px) {
  .users-table td {
    padding: 1rem;
  }
}

.select-column,
.select-cell {
  width: 40px;
}

.select-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.user-column {
  min-width: 250px;
}

.user-info-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.user-avatar-sm {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.75rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.user-name {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.current-user-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  background: rgba(33, 150, 243, 0.1);
  color: var(--info-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.user-email {
  margin: 0 0 0.25rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  direction: ltr;
  text-align: right;
  word-break: break-all;
}

.user-meta-row {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.last-login {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.role-column {
  min-width: 120px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.role-badge.superadmin {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.role-badge.company_manager {
  background: rgba(33, 150, 243, 0.1);
  color: var(--info-color);
}

.role-badge.warehouse_manager {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.role-badge.employee {
  background: rgba(158, 158, 158, 0.1);
  color: #9e9e9e;
}

.permissions-count {
  font-size: 0.6875rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.warehouses-column {
  min-width: 150px;
}

.warehouses-list-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.all-warehouses {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--success-color);
}

.warehouses-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-primary);
}

.warehouses-preview-table {
  display: flex;
  flex-wrap: wrap;
  gap: 0.125rem;
}

.warehouse-tag-sm {
  font-size: 0.6875rem;
  padding: 0.125rem 0.25rem;
  background: var(--bg-input);
  border-radius: 4px;
  color: var(--text-primary);
  white-space: nowrap;
}

.warehouse-more {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.no-warehouses {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.status-column {
  min-width: 120px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.status-indicator.active .fa-circle {
  color: var(--success-color);
}

.status-indicator:not(.active) .fa-circle {
  color: var(--error-color);
}

.status-toggle-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.status-toggle-btn.success {
  background: var(--success-color);
  color: white;
}

.date-column {
  min-width: 140px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
}

.time-ago {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.actions-column {
  min-width: 180px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.action-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.edit:hover {
  background: var(--info-color);
  color: white;
}

.action-btn.view:hover {
  background: var(--primary-color);
  color: white;
}

.action-btn.impersonate:hover:not(:disabled) {
  background: var(--warning-color);
  color: white;
}

.action-btn.reset:hover {
  background: var(--success-color);
  color: white;
}

.action-btn.delete:hover {
  background: var(--error-color);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ===== EMPTY STATE ===== */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state-icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0 0 1.5rem;
  font-size: 0.875rem;
}

/* ===== PAGINATION ===== */
.pagination-section {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .pagination-section {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

@media (min-width: 768px) {
  .page-size-select {
    font-size: 0.875rem;
    margin-left: 1rem;
  }
}

.page-size-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-number:hover:not(.disabled) {
  background: var(--primary-color);
  color: white;
}

.page-number.active {
  background: var(--primary-color);
  color: white;
}

.page-number.disabled {
  background: none;
  cursor: default;
}

/* ===== MODALS ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: var(--bg-card);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-container.delete-modal {
  max-width: 450px;
}

.modal-container.user-modal {
  max-width: 600px;
}

.modal-content {
  padding: 0;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 768px) {
  .modal-header {
    padding: 1.5rem;
  }
}

.modal-header h2 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .modal-header h2 {
    font-size: 1.25rem;
  }
}

.modal-header.danger {
  background: rgba(244, 67, 54, 0.1);
  border-color: var(--error-color);
}

.modal-header.warning {
  background: rgba(255, 152, 0, 0.1);
  border-color: var(--warning-color);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--bg-input);
  color: var(--text-primary);
}

.modal-body {
  padding: 1rem;
}

@media (min-width: 768px) {
  .modal-body {
    padding: 1.5rem;
  }
}

/* Delete Modal */
.delete-warning {
  text-align: center;
  margin-bottom: 1.5rem;
}

.delete-warning .fa-trash-alt {
  font-size: 2.5rem;
  color: var(--error-color);
  margin-bottom: 1rem;
}

.delete-warning h3 {
  margin: 0 0 1rem;
  color: var(--text-primary);
  font-size: 1.125rem;
}

.delete-warning p {
  margin: 0 0 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.875rem;
}

.bulk-delete-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  color: var(--warning-color);
  font-weight: 600;
  font-size: 0.875rem;
}

.warning-list {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 0.75rem;
  margin: 1rem 0;
  text-align: right;
}

.warning-list p {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.delete-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .delete-actions {
    gap: 1rem;
  }
}

/* User Form Modal */
.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
  width: 100%;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: var(--error-color);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.password-input {
  position: relative;
}

.password-input input {
  width: 100%;
  padding-left: 2.5rem;
  padding-right: 0.75rem;
}

.password-toggle {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
}

.password-strength {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s;
}

.password-strength.weak .strength-fill {
  background: var(--error-color);
}

.password-strength.medium .strength-fill {
  background: var(--warning-color);
}

.password-strength.strong .strength-fill {
  background: var(--success-color);
}

.password-strength.weak {
  color: var(--error-color);
}

.password-strength.medium {
  color: var(--warning-color);
}

.password-strength.strong {
  color: var(--success-color);
}

/* Warehouse Selection */
.warehouse-selection {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  background: var(--bg-input);
}

.warehouse-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  margin-top: 0.125rem;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.checkbox-custom::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.75rem;
  opacity: 0;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  opacity: 1;
}

.checkbox-text {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.warehouses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding-left: 0.5rem;
  border-left: 2px solid var(--border-color);
}

.warehouse-item {
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.warehouse-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.warehouse-name {
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
}

.warehouse-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(158, 158, 158, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

/* Permissions Grid */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
}

@media (max-width: 480px) {
  .permissions-grid {
    grid-template-columns: 1fr;
  }
}

.permission-item {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.permission-item:hover {
  border-color: var(--primary-color);
  background: rgba(33, 150, 243, 0.05);
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.permission-info i {
  color: var(--info-color);
  font-size: 1rem;
}

.permission-info span {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 600;
}

.permission-info small {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (min-width: 768px) {
  .form-actions {
    gap: 1rem;
  }
}

/* Reset Password Modal */
.reset-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.reset-info .fa-user-shield {
  font-size: 2.5rem;
  color: var(--info-color);
  margin-bottom: 1rem;
}

.reset-info h3 {
  margin: 0 0 0.5rem;
  color: var(--text-primary);
  font-size: 1.125rem;
}

.reset-info p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 0.875rem;
}

.reset-options {
  margin-bottom: 1.5rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.option-label:hover {
  border-color: var(--primary-color);
  background: rgba(33, 150, 243, 0.05);
}

.option-label input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  margin-top: 0.125rem;
  position: relative;
  transition: all 0.2s;
}

.option-label input[type="radio"]:checked + .radio-custom {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  opacity: 0;
}

.option-label input[type="radio"]:checked + .radio-custom::after {
  opacity: 1;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-content p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.manual-password {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.notification-option {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.checkbox-content h4 {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-content p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.reset-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .reset-actions {
    gap: 1rem;
  }
}

/* ===== TOAST NOTIFICATIONS ===== */
.toast-container {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  background: var(--bg-card);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px var(--shadow-color);
  z-index: 1001;
  animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 4.7s forwards;
  max-width: 400px;
  margin: 0 auto;
  border: 1px solid var(--border-color);
}

@media (min-width: 768px) {
  .toast-container {
    left: auto;
    right: 2rem;
    bottom: 2rem;
    margin: 0;
  }
}

.toast-container.success {
  border-left: 4px solid var(--success-color);
}

.toast-container.error {
  border-left: 4px solid var(--error-color);
}

.toast-container.warning {
  border-left: 4px solid var(--warning-color);
}

.toast-container.info {
  border-left: 4px solid var(--info-color);
}

.toast-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-content i {
  font-size: 1.125rem;
}

.toast-container.success .toast-content i {
  color: var(--success-color);
}

.toast-container.error .toast-content i {
  color: var(--error-color);
}

.toast-container.warning .toast-content i {
  color: var(--warning-color);
}

.toast-container.info .toast-content i {
  color: var(--info-color);
}

.toast-content p {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--text-primary);
  background: var(--bg-input);
}

/* ===== ANIMATIONS ===== */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* ===== ACCESSIBILITY ===== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus Styles */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-input);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Selection */
::selection {
  background: var(--primary-color);
  color: white;
}

/* Print Styles */
@media print {
  .loading-overlay,
  .error-container,
  .modal-overlay,
  .toast-container,
  button,
  .header-actions,
  .filters-section,
  .table-actions,
  .card-footer,
  .action-buttons,
  .pagination-section {
    display: none !important;
  }

  .main-content {
    padding: 0;
  }

  .user-management {
    background: white !important;
    color: black !important;
  }

  .table-section {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }

  .users-table {
    border-collapse: collapse;
  }

  .users-table th,
  .users-table td {
    border: 1px solid #ddd !important;
    color: black !important;
    background: white !important;
  }
}
</style>