// frontend/scripts/utils/scrollUtils.js
// Purpose: Powers the top scroll-progress bar and the back-to-top button.

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (backToTopBtn) backToTopBtn.classList.toggle('visible', scrollTop > 400);
  });

  backToTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});