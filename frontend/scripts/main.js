// frontend/scripts/main.js
// Purpose: Runs on page load. Each section fetches its own data
// independently — if one section fails, the others still work.

document.addEventListener('DOMContentLoaded', () => {
  loadHeroImage();
  loadTrending();
  loadLatest();
  loadCategories();
});

async function loadHeroImage() {
  try {
    const heroRecipe = await fetchRandomRecipe();
    const heroImg = document.getElementById('heroMainImage');
    if (heroImg) heroImg.src = heroRecipe.image_url;
  } catch (err) {
    console.error('Hero image failed to load:', err);
  }
}

async function loadTrending() {
  try {
    const trending = await fetchRecipes(8);
    renderCardGrid(trending, 'trendingGrid');
  } catch (err) {
    console.error('Trending recipes failed to load:', err);
  }
}

async function loadLatest() {
  try {
    const latest = await fetchRecipes(8);
    renderCardGrid(latest, 'latestGrid');
  } catch (err) {
    console.error('Latest recipes failed to load:', err);
  }
}

async function loadCategories() {
  try {
    const categories = await fetchCategories();
    const categoryContainer = document.getElementById('categoryButtons');
    categoryContainer.innerHTML = categories
      .map((cat) => `<button class="category-btn" data-category="${cat}">${cat.replace('-', ' ')}</button>`)
      .join('');
  } catch (err) {
    console.error('Categories failed to load:', err);
  }
}

// Hero search — pressing Enter or clicking Search
document.getElementById('heroSearchBtn')?.addEventListener('click', handleHeroSearch);
document.getElementById('heroSearchInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleHeroSearch();
});

function handleHeroSearch() {
  const query = document.getElementById('heroSearchInput').value.trim();
  if (query) {
    console.log('Searching for:', query);
  }
}