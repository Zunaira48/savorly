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
  renderSkeletons('trendingGrid', 8);
  try {
    const trending = await fetchRecipes(8);
    renderCardGrid(trending, 'trendingGrid');
  } catch (err) {
    console.error('Trending recipes failed to load:', err);
  }
}

async function loadLatest() {
  renderSkeletons('latestGrid', 8);
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

// Category buttons — clicking one navigates to the browse page filtered
// by that category.
document.getElementById('categoryButtons')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.category-btn');
  if (btn) {
    window.location.href = `search.html?category=${btn.dataset.category}`;
  }
});

// "Explore Recipes" — browse everything, no filters
document.querySelector('.btn-primary-glow')?.addEventListener('click', () => {
  window.location.href = 'search.html';
});

// "Surprise Me" — fetch one random recipe and jump straight to its detail page
document.getElementById('surpriseMeBtn')?.addEventListener('click', async () => {
  try {
    const recipe = await fetchRandomRecipe();
    window.location.href = `recipe.html?id=${recipe.id}`;
  } catch (err) {
    console.error('Surprise Me failed:', err);
  }
});

function handleHeroSearch() {
  const query = document.getElementById('heroSearchInput').value.trim();
  if (query) {
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  }
}