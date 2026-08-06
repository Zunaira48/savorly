// frontend/scripts/utils/themeToggle.js
// Purpose: Switches between dark and light theme, persisting the
// choice in localStorage so it survives page reloads and navigation.

const THEME_KEY = 'savorly_theme';

function applyStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    updateToggleIcon('light');
  }
}

function updateToggleIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (!icon) return;
  icon.className = theme === 'light' ? 'bi bi-sun' : 'bi bi-moon-stars';
}

document.addEventListener('DOMContentLoaded', () => {
  applyStoredTheme();

  const toggleBtn = document.getElementById('themeToggle');
  toggleBtn?.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';

    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    localStorage.setItem(THEME_KEY, newTheme);
    updateToggleIcon(newTheme);
  });
});