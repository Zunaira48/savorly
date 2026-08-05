// frontend/scripts/main.js
// Purpose: Runs on page load. Fetches real data from our backend
// and populates the homepage sections.

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Trending section — just showing latest 8 for now, refine later
    const trending = await fetchRecipes(8);
    renderCardGrid(trending, 'trendingGrid');

    // Latest recipes — next 8 different ones
    const latest = await fetchRecipes(8);
    renderCardGrid(latest, 'latestGrid');

    // Categories
    const categories = await fetchCategories();
    const categoryContainer = document.getElementById('categoryButtons');
    categoryContainer.innerHTML = categories
      .map((cat) => `<button class="category-btn" data-category="${cat}">${cat.replace('-', ' ')}</button>`)
      .join('');

  } catch (err) {
    console.error('Error loading homepage data:', err);
  }
});

// Hero search — pressing Enter or clicking Search
document.getElementById('heroSearchBtn').addEventListener('click', handleHeroSearch);
document.getElementById('heroSearchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleHeroSearch();
});

function handleHeroSearch() {
  const query = document.getElementById('heroSearchInput').value.trim();
  if (query) {
    // We'll build the actual search results page in Chat 5 — for now, log it
    console.log('Searching for:', query);
  }
}