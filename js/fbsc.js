class FBSCManager {
  constructor() {
    this.apiBase = "https://brotherscloud-1.onrender.com/api/fbsc";
    this.token = localStorage.getItem('token');
    this.currentPage = 1;
    this.pageSize = 20;
    this.filters = {
      search: '',
      product: 'all',
      from: '',
      to: '',
      user_id: localStorage.getItem('user_id')
    };
    this.editingId = null;
    this.products = [];

    this.init();
  }

  async init() {
    if (!this.token) {
      window.location.href = 'index.html';
      return;
    }

    this.cacheElements();
    this.setupEventListeners();
    this.initializeDatePicker();
    await this.loadProducts();
    await this.loadStats();
    await this.loadRecords();
  }

  cacheElements() {
    this.elements = {
      backBtn: document.getElementById('backBtn'),
      newRecordBtn: document.getElementById('newRecordBtn'),
      modeToggle: document.getElementById('modeToggle'),
      searchInput: document.getElementById('searchInput'),
      productFilter: document.getElementById('productFilter'),
      dateRange: document.getElementById('dateRange'),
      applyFilters: document.getElementById('applyFilters'),
      resetFilters: document.getElementById('resetFilters'),
      exportBtn: document.getElementById('exportBtn'),
      recordsTable: document.getElementById('recordsTable'),
      prevPage: document.getElementById('prevPage'),
      nextPage: document.getElementById('nextPage'),
      startRecord: document.getElementById('startRecord'),
      endRecord: document.getElementById('endRecord'),
      totalRecords: document.getElementById('totalRecords'),
      totalOrders: document.getElementById('totalOrders'),
      totalRevenue: document.getElementById('totalRevenue'),
      avgOrder: document.getElementById('avgOrder'),
      recentOrders: document.getElementById('recentOrders'),
      recordModal: document.getElementById('recordModal'),
      modalTitle: document.getElementById('modalTitle'),
      recordForm: document.getElementById('recordForm'),
      customerName: document.getElementById('customerName'),
      productName: document.getElementById('productName'),
      productSuggestions: document.getElementById('productSuggestions'),
      quickProducts: document.getElementById('quickProducts'),
      pairCount: document.getElementById('pairCount'),
      price: document.getElementById('price'),
      recordDate: document.getElementById('recordDate'),
      notes: document.getElementById('notes'),
      quickProductsMenu: document.getElementById('quickProductsMenu'),
      loader: document.getElementById('loader'),
      toastContainer: document.getElementById('toastContainer')
    };
  }

  setupEventListeners() {
    // Navigation
    this.elements.backBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });

    // Modal
    this.elements.newRecordBtn.addEventListener('click', () => this.openModal());
    document.querySelector('.btn-close').addEventListener('click', () => this.closeModal());
    document.querySelector('.btn-cancel').addEventListener('click', () => this.closeModal());
    this.elements.recordModal.addEventListener('click', (e) => {
      if (e.target === this.elements.recordModal) this.closeModal();
    });

    // Form submission
    this.elements.recordForm.addEventListener('submit', (e) => this.handleSubmit(e));

    // Filters
    this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    this.elements.resetFilters.addEventListener('click', () => this.resetFilters());
    this.elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.applyFilters();
    });

    // Export
    this.elements.exportBtn.addEventListener('click', () => this.exportData());

    // Pagination
    this.elements.prevPage.addEventListener('click', () => this.prevPage());
    this.elements.nextPage.addEventListener('click', () => this.nextPage());

    // Quick products
    this.elements.quickProducts.addEventListener('click', () => this.toggleQuickProducts());
    document.querySelector('.btn-close-small').addEventListener('click', () => this.toggleQuickProducts());
    this.elements.quickProductsMenu.addEventListener('click', (e) => {
      if (e.target === this.elements.quickProductsMenu) this.toggleQuickProducts();
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.toggleQuickProducts(false);
      }
    });
  }

  initializeDatePicker() {
    // Date range picker
    flatpickr(this.elements.dateRange, {
      mode: "range",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "M j, Y",
      allowInput: true,
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          this.filters.from = selectedDates[0].toISOString().split('T')[0];
          this.filters.to = selectedDates[1].toISOString().split('T')[0];
        }
      }
    });

    // Single date picker for record form
    flatpickr(this.elements.recordDate, {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      defaultDate: "today",
      allowInput: true
    });
  }

  async loadProducts() {
    try {
      const response = await fetch(`${this.apiBase}/products`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.products = await response.json();
        this.populateProductFilters();
        this.populateQuickProducts();
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  populateProductFilters() {
    const productFilter = this.elements.productFilter;
    productFilter.innerHTML = '<option value="all">All Products</option>';
    
    this.products.forEach(product => {
      const option = document.createElement('option');
      option.value = product;
      option.textContent = product;
      productFilter.appendChild(option);
    });
  }

  populateQuickProducts() {
    const suggestions = this.elements.productSuggestions;
    suggestions.innerHTML = '';
    
    this.products.forEach(product => {
      const option = document.createElement('option');
      option.value = product;
      suggestions.appendChild(option);
    });

    const dropdownContent = document.querySelector('.dropdown-content');
    dropdownContent.innerHTML = '';
    
    // Add common products
    const commonProducts = ['Sports Shoes', 'T-Shirts', 'Track Pants', 'Socks', 'Caps', 'Water Bottles'];
    
    commonProducts.forEach(product => {
      if (!this.products.includes(product)) {
        this.products.push(product);
        const option = document.createElement('option');
        option.value = product;
        suggestions.appendChild(option);
      }
    });

    this.products.slice(0, 15).forEach(product => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.textContent = product;
      item.addEventListener('click', () => {
        this.elements.productName.value = product;
        this.toggleQuickProducts(false);
      });
      dropdownContent.appendChild(item);
    });
  }

  toggleQuickProducts(show = true) {
    const menu = this.elements.quickProductsMenu;
    if (show) {
      menu.classList.add('active');
    } else {
      menu.classList.remove('active');
    }
  }

  async loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${this.apiBase}/stats?from=${today}`, {
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
    const revenue = stats.revenue || {};
    
    this.elements.totalOrders.textContent = revenue.total_orders || 0;
    this.elements.totalRevenue.textContent = `$${this.formatCurrency(revenue.total_revenue || 0)}`;
    this.elements.avgOrder.textContent = `$${this.formatCurrency(revenue.avg_order_value || 0)}`;
    
    // For recent orders (today), we'll need to load separately
    this.loadTodayOrders();
  }

  async loadTodayOrders() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${this.apiBase}/records?from=${today}&to=${today}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.elements.recentOrders.textContent = data.pagination?.total || 0;
      }
    } catch (error) {
      console.error('Error loading today orders:', error);
    }
  }

  async loadRecords() {
    this.showLoader();
    
    try {
      const queryParams = new URLSearchParams({
        ...this.filters,
        limit: this.pageSize,
        offset: (this.currentPage - 1) * this.pageSize
      });

      const response = await fetch(`${this.apiBase}/records?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.displayRecords(data.records || []);
        this.updatePagination(data.pagination || {});
      } else {
        this.showToast('Error loading records', 'error');
      }
    } catch (error) {
      console.error('Error loading records:', error);
      this.showToast('Failed to load records', 'error');
    } finally {
      this.hideLoader();
    }
  }

  displayRecords(records) {
    const tbody = this.elements.recordsTable.querySelector('tbody');
    tbody.innerHTML = '';

    if (records.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 3rem; color: var(--gray-600);">
          <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem;"></i>
          <p>No records found</p>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    records.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${this.formatDate(record.record_date)}</td>
        <td><strong>${record.customer_name}</strong></td>
        <td>${record.product}</td>
        <td>${record.pair || 1}</td>
        <td class="price-cell">$${this.formatCurrency(record.price)}</td>
        <td>${record.first_name || 'User'}</td>
        <td>${record.notes || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action btn-edit" data-id="${record.record_id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-action btn-delete" data-id="${record.record_id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add event listeners to action buttons
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editRecord(btn.dataset.id);
      });
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteRecord(btn.dataset.id);
      });
    });
  }

  async editRecord(id) {
    try {
      const response = await fetch(`${this.apiBase}/records/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const record = await response.json();
        this.editingId = id;
        this.openModal(record);
      }
    } catch (error) {
      console.error('Error loading record:', error);
      this.showToast('Error loading record', 'error');
    }
  }

  async deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.showToast('Record deleted successfully', 'success');
        await this.loadRecords();
        await this.loadStats();
      } else {
        const error = await response.json();
        this.showToast(error.message || 'Error deleting record', 'error');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      this.showToast('Failed to delete record', 'error');
    }
  }

  updatePagination(pagination) {
    const { total = 0, limit = this.pageSize, offset = 0 } = pagination;
    
    const start = offset + 1;
    const end = Math.min(offset + limit, total);
    
    this.elements.startRecord.textContent = start;
    this.elements.endRecord.textContent = end;
    this.elements.totalRecords.textContent = total;

    this.elements.prevPage.disabled = this.currentPage === 1;
    this.elements.nextPage.disabled = end >= total;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRecords();
    }
  }

  nextPage() {
    this.currentPage++;
    this.loadRecords();
  }

  applyFilters() {
    this.filters.search = this.elements.searchInput.value.trim();
    this.filters.product = this.elements.productFilter.value;
    this.currentPage = 1;
    this.loadRecords();
    this.loadStats();
  }

  resetFilters() {
    this.elements.searchInput.value = '';
    this.elements.productFilter.value = 'all';
    this.elements.dateRange._flatpickr.clear();
    this.filters = {
      search: '',
      product: 'all',
      from: '',
      to: '',
      user_id: localStorage.getItem('user_id')
    };
    this.currentPage = 1;
    this.loadRecords();
    this.loadStats();
  }

  openModal(record = null) {
    const modal = this.elements.recordModal;
    const form = this.elements.recordForm;
    
    if (record) {
      this.elements.modalTitle.textContent = 'Edit Record';
      this.elements.customerName.value = record.customer_name;
      this.elements.productName.value = record.product;
      this.elements.pairCount.value = record.pair || 1;
      this.elements.price.value = record.price;
      this.elements.recordDate._flatpickr.setDate(record.record_date);
      this.elements.notes.value = record.notes || '';
      this.editingId = record.record_id;
    } else {
      this.elements.modalTitle.textContent = 'Add New Record';
      form.reset();
      this.elements.recordDate._flatpickr.setDate('today');
      this.editingId = null;
    }
    
    modal.classList.add('active');
    this.elements.customerName.focus();
  }

  closeModal() {
    this.elements.recordModal.classList.remove('active');
    this.elements.recordForm.reset();
    this.editingId = null;
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const record = {
      customer_name: this.elements.customerName.value.trim(),
      product: this.elements.productName.value.trim(),
      pair: parseInt(this.elements.pairCount.value) || 1,
      price: parseFloat(this.elements.price.value),
      record_date: this.elements.recordDate.value,
      notes: this.elements.notes.value.trim()
    };

    // Validation
    if (!record.customer_name || !record.product || !record.price || !record.record_date) {
      this.showToast('Please fill all required fields', 'warning');
      return;
    }

    if (record.price <= 0) {
      this.showToast('Price must be greater than 0', 'warning');
      return;
    }

    this.showLoader();

    try {
      const url = this.editingId 
        ? `${this.apiBase}/records/${this.editingId}`
        : `${this.apiBase}/records`;
      
      const method = this.editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        this.showToast(
          this.editingId ? 'Record updated successfully' : 'Record created successfully',
          'success'
        );
        
        this.closeModal();
        await this.loadRecords();
        await this.loadStats();
        
        // Add new product to list if not already there
        if (!this.products.includes(record.product)) {
          this.products.push(record.product);
          this.populateProductFilters();
          this.populateQuickProducts();
        }
      } else {
        const error = await response.json();
        this.showToast(error.message || 'Error saving record', 'error');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      this.showToast('Failed to save record', 'error');
    } finally {
      this.hideLoader();
    }
  }

  async exportData() {
    try {
      const queryParams = new URLSearchParams(this.filters);
      const response = await fetch(`${this.apiBase}/records?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.records || [];
        
        if (records.length === 0) {
          this.showToast('No data to export', 'warning');
          return;
        }

        // Convert to CSV
        const headers = ['Date', 'Customer', 'Product', 'Pair', 'Price', 'Added By', 'Notes'];
        const csvRows = [
          headers.join(','),
          ...records.map(record => [
            record.record_date,
            `"${record.customer_name}"`,
            `"${record.product}"`,
            record.pair || 1,
            record.price,
            `"${record.first_name || ''} ${record.last_name || ''}"`.trim(),
            `"${record.notes || ''}"`
          ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fbsc-records-${new Date().toISOString().split('T')[0]}.csv`;
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

  formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
  }

  showLoader() {
    this.elements.loader.style.display = 'flex';
  }

  hideLoader() {
    this.elements.loader.style.display = 'none';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-message">${message}</div>
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

// Initialize FBSC Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FBSCManager();
});