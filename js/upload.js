/* ============================
   Upload Page JS
============================ */

// DOM Elements
const uploadType = document.getElementById('uploadType');
const fileGroup = document.querySelector('.file-group');
const fileInput = document.getElementById('fileInput');
const eventGroup = document.querySelector('.event-group');
const backBtn = document.getElementById('backBtn');
const uploadForm = document.getElementById('uploadForm');
const messageDiv = document.getElementById('message');
const eventsList = document.getElementById('eventsList');

// Allowed file extensions
const allowedExtensions = {
  image: ['jpg','jpeg','png','gif','webp'],
  document: ['pdf','doc','docx'],
  video: ['mp4','mkv','avi','webm']
};

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
  }
};

/* ============================
   SHOW/HIDE INPUT FIELDS
============================ */
if (uploadType) {
  uploadType.addEventListener('change', () => {
    const type = uploadType.value;
    if (type === 'event') {
      fileGroup.style.display = 'none';
      eventGroup.style.display = 'block';
      fileInput.value = '';
    } else if (type === 'password') {
      window.location.href = 'passwords.html';
    } else {
      fileGroup.style.display = 'block';
      eventGroup.style.display = 'none';
      fileInput.value = '';
      fileInput.setAttribute('accept', allowedExtensions[type]?.map(ext => '.' + ext).join(',') || '');
    }
  });
}

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
  const userId = JSON.parse(localStorage.getItem('user'))?.user_id || localStorage.getItem('user_id');

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
        eventsList.innerHTML = '<p>No events yet.</p>';
        return;
      }
      eventsList.innerHTML = data.map(ev => `
        <div class="event-item">
          <strong>${escapeHtml(ev.event_name)}</strong> (${formatDate(ev.event_date)})
          <p>${escapeHtml(ev.event_description || '')}</p>
          <small>Repetition: ${ev.repetition}</small>
        </div>
      `).join('');
    } else {
      if (eventsList) eventsList.innerHTML = `<p>Error loading events: ${data.message || 'Unknown error'}</p>`;
    }
  } catch (err) {
    console.error(err);
    if (eventsList) eventsList.innerHTML = '<p>Server error while loading events.</p>';
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

    if (!token || !userId) {
      if (messageDiv) messageDiv.textContent = 'User not authenticated. Please log in.';
      return;
    }

    if (!type || !itemName) {
      if (messageDiv) messageDiv.textContent = 'Please fill all required fields.';
      return;
    }

    utils.showLoader();

    try {
      let res, data;

      if (type === 'event') {
        const eventDate = document.getElementById('eventDate').value;
        const eventRepetition = document.getElementById('eventRepetition').value;

        if (!eventDate) {
          if (messageDiv) messageDiv.textContent = 'Please select a date for the event.';
          utils.hideLoader();
          return;
        }

        res = await fetch('https://brotherscloud-1.onrender.com/api/events', {
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

      } else {
        const file = fileInput.files[0];
        if (!file) {
          if (messageDiv) messageDiv.textContent = 'Please select a file.';
          utils.hideLoader();
          return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions[type].includes(ext)) {
          if (messageDiv) messageDiv.textContent = `Invalid file type. Allowed: ${allowedExtensions[type].join(', ')}`;
          utils.hideLoader();
          return;
        }

        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('file_type', type);
        formData.append('file_name', itemName);
        formData.append('file_description', itemDesc);
        formData.append('file', file);

        res = await fetch('https://brotherscloud-1.onrender.com/api/files', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
      }

      data = await res.json();

      if (res.ok) {
        utils.showToast('Upload successful!', 'success');
        if (messageDiv) messageDiv.textContent = 'Upload successful!';
        uploadForm.reset();
        fileGroup.style.display = 'block';
        eventGroup.style.display = 'none';
        if (type === 'event') loadEvents();
      } else {
        utils.showToast(data.message || 'Upload failed', 'error');
        if (messageDiv) messageDiv.textContent = data.message || 'Upload failed';
      }

    } catch (err) {
      console.error(err);
      utils.showToast('Server error', 'error');
      if (messageDiv) messageDiv.textContent = 'Server error';
    } finally {
      utils.hideLoader();
    }
  });
}