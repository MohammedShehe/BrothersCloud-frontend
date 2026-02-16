// js/passwords.js - Family Password Manager

class PasswordManager {
  constructor() {
    this.apiBase = "https://brotherscloud-1.onrender.com/api/passwords";
    this.token = localStorage.getItem('token');
    this.currentPage = 1;
    this.pageSize = 20;
    this.filters = {
      search: '',
      category: 'all',
      from: '',
      to: ''
    };
    this.editingId = null;
    this.categories = [];
    this.currentPassword = null;

    this.init();
  }

  async init() {
    if (!this.token) {
      window.location.href = 'index.html';
      return;
    }

    this.cacheElements();
    this.setupEventListeners();
    this.initializeDatePickers();
    await this.loadCategories();
    await this.loadStats();
    await this.loadPasswords();
  }

  cacheElements() {
    this.elements = {
      backBtn: document.getElementById('backBtn'),
      newPasswordBtn: document.getElementById('newPasswordBtn'),
      modeToggle: document.getElementById('modeToggle'),
      searchInput: document.getElementById('searchInput'),
      categoryFilter: document.getElementById('categoryFilter'),
      applyFilters: document.getElementById('applyFilters'),
      resetFilters: document.getElementById('resetFilters'),
      exportBtn: document.getElementById('exportBtn'),
      passwordsTable: document.getElementById('passwordsTable'),
      prevPage: document.getElementById('prevPage'),
      nextPage: document.getElementById('nextPage'),
      startRecord: document.getElementById('startRecord'),
      endRecord: document.getElementById('endRecord'),
      totalRecords: document.getElementById('totalRecords'),
      totalPasswords: document.getElementById('totalPasswords'),
      totalCategories: document.getElementById('totalCategories'),
      expiredPasswords: document.getElementById('expiredPasswords'),
      expiringSoon: document.getElementById('expiringSoon'),
      passwordModal: document.getElementById('passwordModal'),
      modalTitle: document.getElementById('modalTitle'),
      passwordForm: document.getElementById('passwordForm'),
      serviceName: document.getElementById('serviceName'),
      serviceUrl: document.getElementById('serviceUrl'),
      username: document.getElementById('username'),
      email: document.getElementById('email'),
      password: document.getElementById('password'),
      togglePassword: document.getElementById('togglePassword'),
      generatePassword: document.getElementById('generatePassword'),
      category: document.getElementById('category'),
      categorySuggestions: document.getElementById('categorySuggestions'),
      quickCategories: document.getElementById('quickCategories'),
      passwordDate: document.getElementById('passwordDate'),
      expiryDate: document.getElementById('expiryDate'),
      notes: document.getElementById('notes'),
      quickCategoriesMenu: document.getElementById('quickCategoriesMenu'),
      viewPasswordModal: document.getElementById('viewPasswordModal'),
      viewServiceName: document.getElementById('viewServiceName'),
      viewServiceUrl: document.getElementById('viewServiceUrl'),
      viewUsername: document.getElementById('viewUsername'),
      viewEmail: document.getElementById('viewEmail'),
      viewPassword: document.getElementById('viewPassword'),
      showPasswordBtn: document.getElementById('showPasswordBtn'),
      copyPasswordBtn: document.getElementById('copyPasswordBtn'),
      viewCategory: document.getElementById('viewCategory'),
      viewPasswordDate: document.getElementById('viewPasswordDate'),
      viewExpiryDate: document.getElementById('viewExpiryDate'),
      viewNotes: document.getElementById('viewNotes'),
      viewAddedBy: document.getElementById('viewAddedBy'),
      viewCreatedAt: document.getElementById('viewCreatedAt'),
      editFromViewBtn: document.getElementById('editFromViewBtn'),
      deleteFromViewBtn: document.getElementById('deleteFromViewBtn'),
      loader: document.getElementById('loader'),
      toastContainer: document.getElementById('toastContainer')
    };
  }

  setupEventListeners() {
    // Navigation
    if (this.elements.backBtn) {
      this.elements.backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
      });
    }

    // Modal
    if (this.elements.newPasswordBtn) {
      this.elements.newPasswordBtn.addEventListener('click', () => this.openModal());
    }
    
    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
    
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (this.elements.passwordModal) {
      this.elements.passwordModal.addEventListener('click', (e) => {
        if (e.target === this.elements.passwordModal) this.closeModal();
      });
    }

    if (this.elements.viewPasswordModal) {
      this.elements.viewPasswordModal.addEventListener('click', (e) => {
        if (e.target === this.elements.viewPasswordModal) this.closeViewModal();
      });
    }

    // Form submission
    if (this.elements.passwordForm) {
      this.elements.passwordForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Password visibility toggle
    if (this.elements.togglePassword) {
      this.elements.togglePassword.addEventListener('click', () => {
        const type = this.elements.password.type === 'password' ? 'text' : 'password';
        this.elements.password.type = type;
        this.elements.togglePassword.innerHTML = type === 'password' ? 
          '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
      });
    }

    // Generate random password
    if (this.elements.generatePassword) {
      this.elements.generatePassword.addEventListener('click', () => {
        this.elements.password.value = this.generateRandomPassword();
      });
    }

    // Filters
    if (this.elements.applyFilters) {
      this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    }
    
    if (this.elements.resetFilters) {
      this.elements.resetFilters.addEventListener('click', () => this.resetFilters());
    }
    
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.applyFilters();
      });
    }

    // Export
    if (this.elements.exportBtn) {
      this.elements.exportBtn.addEventListener('click', () => this.exportData());
    }

    // Pagination
    if (this.elements.prevPage) {
      this.elements.prevPage.addEventListener('click', () => this.prevPage());
    }
    
    if (this.elements.nextPage) {
      this.elements.nextPage.addEventListener('click', () => this.nextPage());
    }

    // Quick categories
    if (this.elements.quickCategories) {
      this.elements.quickCategories.addEventListener('click', () => this.toggleQuickCategories());
    }
    
    const closeSmallBtn = document.querySelector('.btn-close-small');
    if (closeSmallBtn) {
      closeSmallBtn.addEventListener('click', () => this.toggleQuickCategories(false));
    }
    
    if (this.elements.quickCategoriesMenu) {
      this.elements.quickCategoriesMenu.addEventListener('click', (e) => {
        if (e.target === this.elements.quickCategoriesMenu) this.toggleQuickCategories(false);
      });
    }

    // Close modals on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeViewModal();
        this.toggleQuickCategories(false);
      }
    });
  }

  initializeDatePickers() {
    // Password date picker
    if (this.elements.passwordDate && typeof flatpickr !== 'undefined') {
      flatpickr(this.elements.passwordDate, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        defaultDate: "today",
        allowInput: true
      });
    }

    // Expiry date picker
    if (this.elements.expiryDate && typeof flatpickr !== 'undefined') {
      flatpickr(this.elements.expiryDate, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "F j, Y",
        allowInput: true,
        minDate: "today"
      });
    }
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBase}/categories`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.categories = await response.json();
        this.populateCategoryFilters();
        this.populateQuickCategories();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  populateCategoryFilters() {
    if (!this.elements.categoryFilter) return;
    
    const categoryFilter = this.elements.categoryFilter;
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  populateQuickCategories() {
    if (!this.elements.categorySuggestions) return;
    
    const suggestions = this.elements.categorySuggestions;
    suggestions.innerHTML = '';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      suggestions.appendChild(option);
    });

    const dropdownContent = document.querySelector('.dropdown-content');
    if (!dropdownContent) return;
    
    dropdownContent.innerHTML = '';
    
    // Add common categories if none exist
    const commonCategories = ['social', 'banking', 'email', 'work', 'entertainment', 'shopping', 'education', 'other'];
    
    commonCategories.forEach(category => {
      if (!this.categories.includes(category)) {
        this.categories.push(category);
        const option = document.createElement('option');
        option.value = category;
        suggestions.appendChild(option);
      }
    });

    this.categories.slice(0, 15).forEach(category => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = category;
      item.addEventListener('click', () => {
        if (this.elements.category) {
          this.elements.category.value = category;
        }
        this.toggleQuickCategories(false);
      });
      dropdownContent.appendChild(item);
    });
  }

  toggleQuickCategories(show = true) {
    const menu = this.elements.quickCategoriesMenu;
    if (!menu) return;
    
    if (show) {
      menu.classList.add('active');
    } else {
      menu.classList.remove('active');
    }
  }

  generateRandomPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const stats = await response.json();
        this.updateStatsDisplay(stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  updateStatsDisplay(stats) {
    if (this.elements.totalPasswords) {
      this.elements.totalPasswords.textContent = stats.total_passwords || 0;
    }
    if (this.elements.totalCategories) {
      this.elements.totalCategories.textContent = stats.total_categories || 0;
    }
    if (this.elements.expiredPasswords) {
      this.elements.expiredPasswords.textContent = stats.expired_passwords || 0;
    }
    if (this.elements.expiringSoon) {
      this.elements.expiringSoon.textContent = stats.expiring_soon || 0;
    }
  }

  async loadPasswords() {
    this.showLoader();
    
    try {
      const queryParams = new URLSearchParams({
        ...this.filters,
        limit: this.pageSize,
        offset: (this.currentPage - 1) * this.pageSize
      });

      const response = await fetch(`${this.apiBase}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayPasswords(data.passwords || []);
        this.updatePagination(data.pagination || {});
      } else {
        this.showToast('Error loading passwords', 'error');
      }
    } catch (error) {
      console.error('Error loading passwords:', error);
      this.showToast('Failed to load passwords', 'error');
    } finally {
      this.hideLoader();
    }
  }

  displayPasswords(passwords) {
    if (!this.elements.passwordsTable) return;
    
    const tbody = this.elements.passwordsTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (passwords.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 3rem; color: var(--gray-600);">
          <i class="fas fa-key" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem;"></i>
          <p>No passwords found</p>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    passwords.forEach(password => {
      const row = document.createElement('tr');
      
      // Check expiry status
      let expiryClass = '';
      let expiryText = password.formatted_expiry_date || '-';
      
      if (password.expiry_date) {
        const expiryDate = new Date(password.expiry_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          expiryClass = 'expired';
          expiryText = 'Expired';
        } else if (diffDays <= 7) {
          expiryClass = 'expiring-soon';
          expiryText = `${diffDays} days left`;
        }
      }

      row.innerHTML = `
        <td><strong>${this.escapeHtml(password.service_name)}</strong></td>
        <td>
          ${password.service_url ? 
            `<a href="${this.escapeHtml(password.service_url)}" target="_blank" rel="noopener noreferrer">
              <i class="fas fa-external-link-alt"></i>
            </a>` : '-'}
        </td>
        <td>${this.escapeHtml(password.username || password.email || '-')}</td>
        <td><span class="password-blurred">••••••••</span></td>
        <td><span class="category-badge">${this.escapeHtml(password.category || 'general')}</span></td>
        <td>${this.formatDate(password.password_date)}</td>
        <td class="${expiryClass}">${expiryText}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-view" data-id="${password.password_id}">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn-action btn-edit" data-id="${password.password_id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-action btn-delete" data-id="${password.password_id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners to action buttons
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.viewPassword(btn.dataset.id);
      });
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editPassword(btn.dataset.id);
      });
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePassword(btn.dataset.id);
      });
    });
  }

  async viewPassword(id) {
    this.showLoader();
    
    try {
      const response = await fetch(`${this.apiBase}/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.currentPassword = await response.json();
        
        // Populate view modal
        if (this.elements.viewServiceName) {
          this.elements.viewServiceName.textContent = this.currentPassword.service_name;
        }
        
        if (this.elements.viewServiceUrl) {
          this.elements.viewServiceUrl.href = this.currentPassword.service_url || '#';
          this.elements.viewServiceUrl.textContent = this.currentPassword.service_url || '-';
        }
        
        if (this.elements.viewUsername) {
          this.elements.viewUsername.textContent = this.currentPassword.username || '-';
        }
        
        if (this.elements.viewEmail) {
          this.elements.viewEmail.textContent = this.currentPassword.email || '-';
        }
        
        if (this.elements.viewPassword) {
          this.elements.viewPassword.textContent = '••••••••';
        }
        
        if (this.elements.viewCategory) {
          this.elements.viewCategory.textContent = this.currentPassword.category || 'general';
        }
        
        if (this.elements.viewPasswordDate) {
          this.elements.viewPasswordDate.textContent = this.formatDate(this.currentPassword.password_date);
        }
        
        if (this.elements.viewExpiryDate) {
          this.elements.viewExpiryDate.textContent = this.currentPassword.formatted_expiry_date || '-';
        }
        
        if (this.elements.viewNotes) {
          this.elements.viewNotes.textContent = this.currentPassword.notes || '-';
        }
        
        if (this.elements.viewAddedBy) {
          this.elements.viewAddedBy.textContent = `${this.currentPassword.first_name || 'Unknown'} ${this.currentPassword.last_name || ''}`;
        }
        
        if (this.elements.viewCreatedAt) {
          this.elements.viewCreatedAt.textContent = new Date(this.currentPassword.created_at).toLocaleString();
        }

        // Reset password visibility
        if (this.elements.showPasswordBtn) {
          this.elements.showPasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
        
        if (this.elements.viewPassword) {
          this.elements.viewPassword.classList.remove('password-revealed');
          this.elements.viewPassword.dataset.decrypted = '';
        }

        // Show modal
        if (this.elements.viewPasswordModal) {
          this.elements.viewPasswordModal.classList.add('active');
        }
      }
    } catch (error) {
      console.error('Error loading password:', error);
      this.showToast('Error loading password details', 'error');
    } finally {
      this.hideLoader();
    }

    // Setup view modal buttons
    if (this.elements.showPasswordBtn) {
      this.elements.showPasswordBtn.onclick = () => this.togglePasswordVisibility();
    }
    
    if (this.elements.copyPasswordBtn) {
      this.elements.copyPasswordBtn.onclick = () => this.copyPasswordToClipboard();
    }
    
    if (this.elements.editFromViewBtn) {
      this.elements.editFromViewBtn.onclick = () => {
        this.closeViewModal();
        this.editPassword(this.currentPassword.password_id);
      };
    }
    
    if (this.elements.deleteFromViewBtn) {
      this.elements.deleteFromViewBtn.onclick = () => {
        this.closeViewModal();
        this.deletePassword(this.currentPassword.password_id);
      };
    }
  }

  async togglePasswordVisibility() {
    if (!this.currentPassword) return;

    const passwordSpan = this.elements.viewPassword;
    if (!passwordSpan) return;
    
    if (passwordSpan.classList.contains('password-revealed')) {
      // Hide password
      passwordSpan.textContent = '••••••••';
      passwordSpan.classList.remove('password-revealed');
      if (this.elements.showPasswordBtn) {
        this.elements.showPasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    } else {
      // Show password (decrypt)
      if (!passwordSpan.dataset.decrypted) {
        try {
          const response = await fetch(`${this.apiBase}/${this.currentPassword.password_id}/decrypt`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            passwordSpan.dataset.decrypted = data.decrypted_password;
          } else {
            this.showToast('Failed to decrypt password', 'error');
            return;
          }
        } catch (error) {
          console.error('Error decrypting password:', error);
          this.showToast('Failed to decrypt password', 'error');
          return;
        }
      }
      
      passwordSpan.textContent = passwordSpan.dataset.decrypted;
      passwordSpan.classList.add('password-revealed');
      if (this.elements.showPasswordBtn) {
        this.elements.showPasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      }
    }
  }

  async copyPasswordToClipboard() {
    if (!this.currentPassword) return;

    let passwordToCopy = this.elements.viewPassword ? this.elements.viewPassword.dataset.decrypted : null;
    
    if (!passwordToCopy) {
      // Need to decrypt first
      try {
        const response = await fetch(`${this.apiBase}/${this.currentPassword.password_id}/decrypt`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          passwordToCopy = data.decrypted_password;
          if (this.elements.viewPassword) {
            this.elements.viewPassword.dataset.decrypted = passwordToCopy;
          }
        } else {
          this.showToast('Failed to decrypt password', 'error');
          return;
        }
      } catch (error) {
        console.error('Error decrypting password:', error);
        this.showToast('Failed to decrypt password', 'error');
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(passwordToCopy);
      this.showToast('Password copied to clipboard!', 'success');
    } catch (err) {
      this.showToast('Failed to copy password', 'error');
    }
  }

  closeViewModal() {
    if (this.elements.viewPasswordModal) {
      this.elements.viewPasswordModal.classList.remove('active');
    }
    this.currentPassword = null;
  }

  async editPassword(id) {
    try {
      const response = await fetch(`${this.apiBase}/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const password = await response.json();
        this.editingId = id;
        this.openModal(password);
      }
    } catch (error) {
      console.error('Error loading password:', error);
      this.showToast('Error loading password', 'error');
    }
  }

  async deletePassword(id) {
    if (!confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.showToast('Password deleted successfully', 'success');
        await this.loadPasswords();
        await this.loadStats();
      } else {
        const error = await response.json();
        this.showToast(error.message || 'Error deleting password', 'error');
      }
    } catch (error) {
      console.error('Error deleting password:', error);
      this.showToast('Failed to delete password', 'error');
    }
  }

  updatePagination(pagination) {
    const { total = 0, limit = this.pageSize, offset = 0 } = pagination;
    
    const start = offset + 1;
    const end = Math.min(offset + limit, total);
    
    if (this.elements.startRecord) {
      this.elements.startRecord.textContent = start;
    }
    
    if (this.elements.endRecord) {
      this.elements.endRecord.textContent = end;
    }
    
    if (this.elements.totalRecords) {
      this.elements.totalRecords.textContent = total;
    }

    if (this.elements.prevPage) {
      this.elements.prevPage.disabled = this.currentPage === 1;
    }
    
    if (this.elements.nextPage) {
      this.elements.nextPage.disabled = end >= total;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPasswords();
    }
  }

  nextPage() {
    this.currentPage++;
    this.loadPasswords();
  }

  applyFilters() {
    if (this.elements.searchInput) {
      this.filters.search = this.elements.searchInput.value.trim();
    }
    
    if (this.elements.categoryFilter) {
      this.filters.category = this.elements.categoryFilter.value;
    }
    
    this.currentPage = 1;
    this.loadPasswords();
    this.loadStats();
  }

  resetFilters() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.value = 'all';
    }
    
    this.filters = {
      search: '',
      category: 'all',
      from: '',
      to: ''
    };
    this.currentPage = 1;
    this.loadPasswords();
    this.loadStats();
  }

  openModal(password = null) {
    const modal = this.elements.passwordModal;
    if (!modal) return;
    
    if (password) {
      if (this.elements.modalTitle) {
        this.elements.modalTitle.textContent = 'Edit Password';
      }
      
      if (this.elements.serviceName) {
        this.elements.serviceName.value = password.service_name || '';
      }
      
      if (this.elements.serviceUrl) {
        this.elements.serviceUrl.value = password.service_url || '';
      }
      
      if (this.elements.username) {
        this.elements.username.value = password.username || '';
      }
      
      if (this.elements.email) {
        this.elements.email.value = password.email || '';
      }
      
      if (this.elements.password) {
        this.elements.password.value = ''; // Don't populate password for security
      }
      
      if (this.elements.category) {
        this.elements.category.value = password.category || 'general';
      }
      
      // Set dates
      if (password.password_date && this.elements.passwordDate && this.elements.passwordDate._flatpickr) {
        this.elements.passwordDate._flatpickr.setDate(password.password_date);
      }
      
      if (password.expiry_date && this.elements.expiryDate && this.elements.expiryDate._flatpickr) {
        this.elements.expiryDate._flatpickr.setDate(password.expiry_date);
      }
      
      if (this.elements.notes) {
        this.elements.notes.value = password.notes || '';
      }
      
      this.editingId = password.password_id;
    } else {
      if (this.elements.modalTitle) {
        this.elements.modalTitle.textContent = 'Add New Password';
      }
      
      if (this.elements.passwordForm) {
        this.elements.passwordForm.reset();
      }
      
      if (this.elements.passwordDate && this.elements.passwordDate._flatpickr) {
        this.elements.passwordDate._flatpickr.setDate('today');
      }
      
      this.editingId = null;
    }
    
    modal.classList.add('active');
    if (this.elements.serviceName) {
      this.elements.serviceName.focus();
    }
  }

  closeModal() {
    if (this.elements.passwordModal) {
      this.elements.passwordModal.classList.remove('active');
    }
    
    if (this.elements.passwordForm) {
      this.elements.passwordForm.reset();
    }
    
    this.editingId = null;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const passwordData = {
      service_name: this.elements.serviceName ? this.elements.serviceName.value.trim() : '',
      service_url: this.elements.serviceUrl ? this.elements.serviceUrl.value.trim() || null : null,
      username: this.elements.username ? this.elements.username.value.trim() || null : null,
      email: this.elements.email ? this.elements.email.value.trim() || null : null,
      password: this.elements.password ? this.elements.password.value.trim() : '',
      category: this.elements.category ? this.elements.category.value.trim() || 'general' : 'general',
      password_date: this.elements.passwordDate ? this.elements.passwordDate.value : '',
      expiry_date: this.elements.expiryDate ? this.elements.expiryDate.value || null : null,
      notes: this.elements.notes ? this.elements.notes.value.trim() || null : null
    };

    // Validation
    if (!passwordData.service_name) {
      this.showToast('Service name is required', 'warning');
      return;
    }

    if (!passwordData.password && !this.editingId) {
      this.showToast('Password is required', 'warning');
      return;
    }

    if (!passwordData.password_date) {
      this.showToast('Password date is required', 'warning');
      return;
    }

    this.showLoader();

    try {
      const url = this.editingId
        ? `${this.apiBase}/${this.editingId}`
        : this.apiBase;
      
      const method = this.editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        this.showToast(
          this.editingId ? 'Password updated successfully' : 'Password saved successfully',
          'success'
        );
        
        this.closeModal();
        await this.loadPasswords();
        await this.loadStats();
        
        // Add new category to list if not already there
        if (passwordData.category && !this.categories.includes(passwordData.category)) {
          this.categories.push(passwordData.category);
          this.populateCategoryFilters();
          this.populateQuickCategories();
        }
      } else {
        const error = await response.json();
        this.showToast(error.message || 'Error saving password', 'error');
      }
    } catch (error) {
      console.error('Error saving password:', error);
      this.showToast('Failed to save password', 'error');
    } finally {
      this.hideLoader();
    }
  }

  async exportData() {
    try {
      const queryParams = new URLSearchParams(this.filters);
      const response = await fetch(`${this.apiBase}?${queryParams}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const passwords = data.passwords || [];
        
        if (passwords.length === 0) {
          this.showToast('No data to export', 'warning');
          return;
        }

        // Convert to CSV (without decrypted passwords)
        const headers = ['Service', 'URL', 'Username', 'Email', 'Category', 'Date', 'Expiry', 'Notes'];
        const csvRows = [
          headers.join(','),
          ...passwords.map(p => [
            `"${p.service_name}"`,
            `"${p.service_url || ''}"`,
            `"${p.username || ''}"`,
            `"${p.email || ''}"`,
            `"${p.category || 'general'}"`,
            p.password_date,
            p.expiry_date || '',
            `"${p.notes || ''}"`
          ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `passwords-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Export completed', 'success');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  // Utility methods
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showLoader() {
    if (this.elements.loader) {
      this.elements.loader.style.display = 'flex';
    }
  }

  hideLoader() {
    if (this.elements.loader) {
      this.elements.loader.style.display = 'none';
    }
  }

  showToast(message, type = 'info') {
    if (!this.elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-message">${this.escapeHtml(message)}</div>
      <button class="toast-close">&times;</button>
    `;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }, 100);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
  }
}

// Initialize Password Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PasswordManager();
});