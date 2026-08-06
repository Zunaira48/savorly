// frontend/scripts/utils/toast.js
// Purpose: Shows a small temporary notification in the corner of the
// screen. Uses "savorly-toast" (not "toast") to avoid colliding with
// Bootstrap's own built-in .toast component, which defaults to
// display:none and was silently hiding ours.

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'savorly-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `savorly-toast savorly-toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('savorly-toast-visible'));

  setTimeout(() => {
    toast.classList.remove('savorly-toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}