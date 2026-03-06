/* ============================
   Upload Page JS - With Multi-file Support
============================ */

// DOM Elements
const uploadType = document.getElementById('uploadType');
const singleFileGroup = document.getElementById('singleFileGroup');
const multiFileGroup = document.getElementById('multiFileGroup');
const multiFileToggle = document.getElementById('multiFileToggle');
const multiFileCheckbox = document.getElementById('multiFileCheckbox');
const fileInput = document.getElementById('fileInput');
const multiFileInput = document.getElementById('multiFileInput');
const eventGroup = document.querySelector('.event-group');
const backBtn = document.getElementById('backBtn');
const uploadForm = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');
const eventsList = document.getElementById('eventsList');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const fileCountInfo = document.getElementById('fileCountInfo');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressPercentage = document.getElementById('progressPercentage');
const progressStatus = document.getElementById('progressStatus');
const successCount = document.getElementById('successCount');
const errorCount = document.getElementById('errorCount');
const submitBtn = document.getElementById('submitBtn');
const nameHint = document.getElementById('nameHint');

// Allowed file extensions
const allowedExtensions = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
  video: ['mp4', 'mkv', 'avi', 'webm', 'mov', 'wmv', 'mpeg']
};

// Store selected files for multi-upload
let selectedFiles = [];

// Utility functions
const utils = {
  showToast: (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 100);
  },

  handleError: (error) => {
    console.error("Error:", error);
    utils.showToast(
      error.message || error.error || "An error occurred",
      "error"
    );
  },

  showLoader: () => {
    let loader = document.getElementById("loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "loader";
      loader.innerHTML = `<div class="spinner"></div>`;
      document.body.appendChild(loader);
    }
    loader.style.display = "flex";
  },

  hideLoader: () => {
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
  },

  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon: (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) return '🎬';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📽️';
    if (['txt'].includes(ext)) return '📃';
    return '📁';
  }
};

/* ============================
   SHOW/HIDE INPUT FIELDS
============================ */
if (uploadType) {
  uploadType.addEventListener('change', () => {
    const type = uploadType.value;
    
    // Reset visibility
    singleFileGroup.style.display = 'block';
    multiFileToggle.style.display = 'none';
    multiFileGroup.style.display = 'none';
    eventGroup.style.display = 'none';
    multiFileCheckbox.checked = false;
    selectedFiles = [];
    updateFilePreview();
    
    if (type === 'event') {
      singleFileGroup.style.display = 'none';
      multiFileToggle.style.display = 'none';
      eventGroup.style.display = 'block';
      fileInput.value = '';
      nameHint.textContent = 'Enter event name';
    } else if (type === 'password') {
      window.location.href = 'passwords.html';
    } else {
      singleFileGroup.style.display = 'block';
      multiFileToggle.style.display = 'block';
      fileInput.setAttribute('accept', allowedExtensions[type]?.map(ext => '.' + ext).join(',') || '*/*');
      multiFileInput.setAttribute('accept', allowedExtensions[type]?.map(ext => '.' + ext).join(',') || '*/*');
      nameHint.textContent = type === 'image' ? 'Image title' : type === 'video' ? 'Video title' : 'Document title';
    }
  });
}

/* ============================
   MULTI-FILE TOGGLE
============================ */
if (multiFileCheckbox) {
  multiFileCheckbox.addEventListener('change', (e) => {
    const isMulti = e.target.checked;
    singleFileGroup.style.display = isMulti ? 'none' : 'block';
    multiFileGroup.style.display = isMulti ? 'block' : 'none';
    
    // Clear selections
    fileInput.value = '';
    multiFileInput.value = '';
    selectedFiles = [];
    updateFilePreview();
  });
}

/* ============================
   MULTI-FILE SELECTION
============================ */
if (multiFileInput) {
  multiFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const type = uploadType.value;
    
    // Filter by allowed extensions
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return allowedExtensions[type]?.includes(ext);
    });
    
    const invalidCount = files.length - validFiles.length;
    if (invalidCount > 0) {
      utils.showToast(`${invalidCount} file(s) skipped due to invalid type`, 'warning');
    }
    
    selectedFiles = validFiles.slice(0, 20); // Max 20 files
    updateFilePreview();
    
    if (validFiles.length > 20) {
      utils.showToast('Maximum 20 files allowed. Extra files were skipped.', 'warning');
    }
  });
}

/* ============================
   FILE PREVIEW
============================ */
function updateFilePreview() {
  if (!filePreviewContainer || !fileCountInfo) return;
  
  if (selectedFiles.length === 0) {
    filePreviewContainer.innerHTML = '';
    fileCountInfo.textContent = 'No files selected';
    return;
  }
  
  fileCountInfo.textContent = `${selectedFiles.length} file(s) selected (max 20)`;
  
  filePreviewContainer.innerHTML = selectedFiles.map((file, index) => {
    const fileIcon = utils.getFileIcon(file.name);
    const fileSize = utils.formatFileSize(file.size);
    const isImage = file.type.startsWith('image/');
    
    return `
      <div class="file-preview-item" data-index="${index}">
        ${isImage ? 
          `<img src="${URL.createObjectURL(file)}" alt="${file.name}">` : 
          `<div class="file-icon">${fileIcon}</div>`
        }
        <div class="file-info">
          <div class="file-name">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</div>
          <div class="file-size">${fileSize}</div>
        </div>
        <button type="button" class="remove-file" onclick="removeFile(${index})">×</button>
      </div>
    `;
  }).join('');
}

// Make removeFile function global
window.removeFile = (index) => {
  selectedFiles.splice(index, 1);
  updateFilePreview();
  
  // Reset file input
  if (multiFileInput) {
    multiFileInput.value = '';
  }
};

/* ============================
   NAVIGATION
============================ */
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}

/* ============================
   LOAD USER EVENTS
============================ */
async function loadEvents() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.user_id;

  if (!token || !userId) {
    if (eventsList) eventsList.innerHTML = '<p>User not authenticated. Please log in.</p>';
    return;
  }

  try {
    const res = await fetch(`https://brotherscloud-1.onrender.com/api/events?user_id=${userId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();

    if (res.ok) {
      if (!eventsList) return;
      if (data.length === 0) {
        eventsList.innerHTML = '<h2>Upcoming Events</h2><p>No events yet.</p>';
        return;
      }
      
      // Sort by date and take only upcoming events
      const today = new Date();
      const upcomingEvents = data
        .filter(ev => new Date(ev.event_date) >= today)
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5);
      
      if (upcomingEvents.length === 0) {
        eventsList.innerHTML = '<h2>Upcoming Events</h2><p>No upcoming events.</p>';
        return;
      }
      
      eventsList.innerHTML = `
        <h2>Upcoming Events</h2>
        ${upcomingEvents.map(ev => `
          <div class="event-item">
            <strong>${escapeHtml(ev.event_name)}</strong> 
            <span class="event-date">${formatDate(ev.event_date)}</span>
            <p>${escapeHtml(ev.event_description || '')}</p>
            <small>${ev.repetition === 'yearly' ? '🎂 Repeats yearly' : '📅 One-time event'}</small>
          </div>
        `).join('')}
      `;
    } else {
      if (eventsList) eventsList.innerHTML = `<h2>Upcoming Events</h2><p>Error loading events: ${data.message || 'Unknown error'}</p>`;
    }
  } catch (err) {
    console.error(err);
    if (eventsList) eventsList.innerHTML = '<h2>Upcoming Events</h2><p>Server error while loading events.</p>';
  }
}

function formatDate(dateString) {
  if (!dateString) return "Unknown Date";
  const date = new Date(dateString);
  return isNaN(date)
    ? "Unknown Date"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ============================
   UPDATE PROGRESS BAR
============================ */
function updateProgress(loaded, total, success, failed) {
  const percentage = Math.round((loaded * 100) / total);
  progressBar.style.width = percentage + '%';
  progressPercentage.textContent = percentage + '%';
  
  if (successCount) successCount.textContent = `${success} uploaded`;
  if (errorCount) errorCount.textContent = `${failed} failed`;
  
  if (loaded === total) {
    progressStatus.textContent = 'Upload complete!';
    setTimeout(() => {
      uploadProgress.style.display = 'none';
    }, 3000);
  }
}

/* ============================
   INITIALIZATION
============================ */
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();

  // Initialize Flatpickr for event date
  if (document.getElementById('eventDate') && typeof flatpickr !== 'undefined') {
    flatpickr("#eventDate", {
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "F j, Y",
      minDate: "today",
      allowInput: true
    });
  }
});

/* ============================
   UPLOAD FORM SUBMISSION
============================ */
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (messageDiv) messageDiv.textContent = '';

    const type = uploadType.value;
    const itemName = document.getElementById('itemName').value.trim();
    const itemDesc = document.getElementById('itemDesc').value.trim();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.user_id;
    const isMulti = multiFileCheckbox?.checked || false;

    if (!token || !userId) {
      utils.showToast('User not authenticated. Please log in.', 'error');
      return;
    }

    if (!type || !itemName) {
      utils.showToast('Please fill all required fields.', 'error');
      return;
    }

    // Handle event upload
    if (type === 'event') {
      const eventDate = document.getElementById('eventDate').value;
      const eventRepetition = document.getElementById('eventRepetition').value;

      if (!eventDate) {
        utils.showToast('Please select a date for the event.', 'error');
        return;
      }

      utils.showLoader();

      try {
        const res = await fetch('https://brotherscloud-1.onrender.com/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            user_id: userId,
            event_name: itemName,
            event_description: itemDesc,
            event_date: eventDate,
            repetition: eventRepetition
          })
        });

        const data = await res.json();

        if (res.ok) {
          utils.showToast('Event created successfully!', 'success');
          uploadForm.reset();
          eventGroup.style.display = 'none';
          uploadType.value = '';
          loadEvents();
        } else {
          utils.showToast(data.message || 'Failed to create event', 'error');
        }
      } catch (err) {
        console.error(err);
        utils.showToast('Server error', 'error');
      } finally {
        utils.hideLoader();
      }
      return;
    }

    // Handle password redirect
    if (type === 'password') {
      window.location.href = 'passwords.html';
      return;
    }

    // Handle file uploads
    if (isMulti) {
      // Multi-file upload
      if (selectedFiles.length === 0) {
        utils.showToast('Please select files to upload.', 'error');
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('file_type', type);
      formData.append('file_description', itemDesc);

      // Show progress bar
      uploadProgress.style.display = 'block';
      submitBtn.disabled = true;

      try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.style.width = percentComplete + '%';
            progressPercentage.textContent = Math.round(percentComplete) + '%';
          }
        });

        xhr.onload = async function() {
          if (xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            utils.showToast(`Uploaded ${response.total_uploaded} of ${selectedFiles.length} files`, 'success');
            
            // Update stats
            if (successCount) successCount.textContent = `${response.total_uploaded} uploaded`;
            if (errorCount) errorCount.textContent = `${response.total_failed} failed`;
            
            // Reset form
            uploadForm.reset();
            selectedFiles = [];
            updateFilePreview();
            singleFileGroup.style.display = 'block';
            multiFileGroup.style.display = 'none';
            multiFileCheckbox.checked = false;
            
            // Show detailed results
            if (response.errors && response.errors.length > 0) {
              console.log('Failed uploads:', response.errors);
            }
          } else {
            const error = JSON.parse(xhr.responseText);
            utils.showToast(error.message || 'Upload failed', 'error');
          }
          
          setTimeout(() => {
            uploadProgress.style.display = 'none';
            submitBtn.disabled = false;
            progressBar.style.width = '0%';
            progressPercentage.textContent = '0%';
          }, 3000);
        };

        xhr.onerror = function() {
          utils.showToast('Upload failed', 'error');
          uploadProgress.style.display = 'none';
          submitBtn.disabled = false;
        };

        xhr.open('POST', 'https://brotherscloud-1.onrender.com/api/files/multiple', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.send(formData);

      } catch (err) {
        console.error(err);
        utils.showToast('Upload failed', 'error');
        uploadProgress.style.display = 'none';
        submitBtn.disabled = false;
      }

    } else {
      // Single file upload
      const file = fileInput.files[0];
      if (!file) {
        utils.showToast('Please select a file.', 'error');
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions[type]?.includes(ext)) {
        utils.showToast(`Invalid file type. Allowed: ${allowedExtensions[type]?.join(', ')}`, 'error');
        return;
      }

      utils.showLoader();

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('file_type', type);
      formData.append('file_name', itemName);
      formData.append('file_description', itemDesc);
      formData.append('file', file);

      try {
        const res = await fetch('https://brotherscloud-1.onrender.com/api/files', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });

        const data = await res.json();

        if (res.ok) {
          utils.showToast('Upload successful!', 'success');
          uploadForm.reset();
          fileInput.value = '';
          if (messageDiv) messageDiv.textContent = '';
        } else {
          utils.showToast(data.message || 'Upload failed', 'error');
        }
      } catch (err) {
        console.error(err);
        utils.showToast('Server error', 'error');
      } finally {
        utils.hideLoader();
      }
    }
  });
}