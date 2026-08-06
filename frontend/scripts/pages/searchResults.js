// frontend/scripts/pages/searchResults.js
// Purpose: Reads filter values from the URL on load, populates the
// filter controls to match, fetches matching recipes, and re-fetches
// whenever the user changes a filter.

document.addEventListener('DOMContentLoaded', async () => {
  await populateCategoryOptions();
  applyFiltersFromUrl();
  await runSearch();

  document.getElementById('applyFiltersBtn').addEventListener('click', () => {
    updateUrlFromFilters();
    runSearch();
  });

  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      updateUrlFromFilters();
      runSearch();
    }
  });
});

async function populateCategoryOptions() {
  try {
    const categories = await fetchCategories();
    const select = document.getElementById('categoryFilter');
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.replace('-', ' ');
      option.style.textTransform = 'capitalize';
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load category options:', err);
  }
}

// Reads ?q=, ?category=, ?difficulty=, ?maxTime= from the URL and sets
// the filter controls to match — so links from the homepage work correctly.
function applyFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('q')) document.getElementById('searchInput').value = params.get('q');
  if (params.get('category')) document.getElementById('categoryFilter').value = params.get('category');
  if (params.get('difficulty')) document.getElementById('difficultyFilter').value = params.get('difficulty');
  if (params.get('maxTime')) document.getElementById('timeFilter').value = params.get('maxTime');

  updateHeading();
}

function updateUrlFromFilters() {
  const params = new URLSearchParams();
  const q = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const difficulty = document.getElementById('difficultyFilter').value;
  const maxTime = document.getElementById('timeFilter').value;

  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (difficulty) params.set('difficulty', difficulty);
  if (maxTime) params.set('maxTime', maxTime);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
  updateHeading();
}

function updateHeading() {
  const category = document.getElementById('categoryFilter').value;
  const q = document.getElementById('searchInput').value.trim();

  if (q) {
    document.getElementById('resultsHeading').textContent = `Results for "${q}"`;
  } else if (category) {
    document.getElementById('resultsHeading').textContent = category.replace('-', ' ');
  } else {
    document.getElementById('resultsHeading').textContent = 'Browse Recipes';
  }
}

async function runSearch() {
  const q = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const difficulty = document.getElementById('difficultyFilter').value;
  const maxTime = document.getElementById('timeFilter').value;

  try {
    const paramsObj = { limit: 24 };
    if (q) paramsObj.q = q;
    if (category) paramsObj.category = category;
    if (difficulty) paramsObj.difficulty = difficulty;
    if (maxTime) paramsObj.maxTime = maxTime;

    const queryString = new URLSearchParams(paramsObj).toString();
    const res = await fetch(`http://localhost:5000/api/recipes/filter?${queryString}`);
    if (!res.ok) throw new Error('Search failed');
    const results = await res.json();

    const grid = document.getElementById('resultsGrid');
    const noResultsMsg = document.getElementById('noResultsMsg');

    if (results.length === 0) {
      grid.innerHTML = '';
      noResultsMsg.style.display = 'block';
    } else {
      noResultsMsg.style.display = 'none';
      renderCardGrid(results, 'resultsGrid');
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
}