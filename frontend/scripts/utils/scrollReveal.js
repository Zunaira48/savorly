// frontend/scripts/utils/scrollReveal.js
// Purpose: Fades and slides elements into view as they scroll into
// the viewport, using the efficient IntersectionObserver API (no
// scroll-event listeners, which would hurt performance).

function initScrollReveal(selector = '.recipe-card, .section-header') {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add('reveal-hidden');
    observer.observe(el);
  });
}

// Call this again any time new cards get injected into the DOM
// (e.g. after a fetch completes), since the observer only sees
// elements that exist at the time it's called.
function refreshScrollReveal(selector) {
  initScrollReveal(selector);
}