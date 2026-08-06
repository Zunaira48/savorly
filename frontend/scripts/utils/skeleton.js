// frontend/scripts/utils/skeleton.js
// Purpose: Renders placeholder skeleton cards into a container while
// real data is being fetched.

function renderSkeletons(containerId, count = 8) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array(count)
    .fill('')
    .map(
      () => `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    `
    )
    .join('');
}