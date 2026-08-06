// frontend/scripts/utils/mobileMenu.js
// Purpose: Toggles the mobile hamburger menu open/closed.

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');

  btn?.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
});