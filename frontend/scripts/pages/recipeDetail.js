// frontend/scripts/pages/recipeDetail.js
// Purpose: Reads the recipe ID from the URL, fetches its full data,
// and renders the complete detail page — ingredients, steps, nutrition,
// plus related recipes.

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('id');

  if (!recipeId) {
    document.getElementById('recipeContent').innerHTML = '<p class="error-text">No recipe specified.</p>';
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/recipes/${recipeId}`);
    if (!res.ok) throw new Error('Recipe not found');
    const recipe = await res.json();

    renderRecipe(recipe);
    loadRelated(recipeId);
  } catch (err) {
    console.error(err);
    document.getElementById('recipeContent').innerHTML = '<p class="error-text">Sorry, this recipe could not be loaded.</p>';
  }
});

function renderRecipe(recipe) {
  const favorited = isFavorite(recipe.id);

  document.title = `${recipe.name} — Savorly`;

  document.getElementById('recipeContent').innerHTML = `
    <div class="recipe-hero">
      <img src="${recipe.image_url}" alt="${recipe.name}" class="recipe-hero-image">
      <button id="detailFavoriteBtn" class="favorite-heart-large ${favorited ? 'is-favorited' : ''}" data-id="${recipe.id}">
        <i class="bi ${favorited ? 'bi-heart-fill' : 'bi-heart'}"></i>
      </button>
    </div>

    <div class="recipe-info">
      <span class="difficulty-badge difficulty-${recipe.difficulty}">${recipe.difficulty}</span>
      <h1 class="recipe-title">${recipe.name}</h1>
      <p class="recipe-description">${recipe.description || 'A delicious recipe from the Savorly collection.'}</p>

      <div class="recipe-stats-row">
        <div class="recipe-stat"><i class="bi bi-clock"></i> ${recipe.minutes} min</div>
        <div class="recipe-stat"><i class="bi bi-list-check"></i> ${recipe.n_ingredients} ingredients</div>
        <div class="recipe-stat"><i class="bi bi-bar-chart"></i> ${recipe.n_steps} steps</div>
        ${recipe.calories ? `<div class="recipe-stat"><i class="bi bi-fire"></i> ${Math.round(recipe.calories)} cal</div>` : ''}
      </div>

      <div class="recipe-actions">
        <button id="printBtn" class="btn-outline-ghost"><i class="bi bi-printer"></i> Print</button>
        <button id="shareBtn" class="btn-outline-ghost"><i class="bi bi-share"></i> Share</button>
      </div>

      <div class="recipe-columns">
        <div class="recipe-ingredients">
          <h2>Ingredients</h2>
          <ul>
            ${recipe.ingredients.map((ing) => `<li>${ing}</li>`).join('')}
          </ul>
        </div>

        <div class="recipe-steps">
          <h2>Instructions</h2>
          <ol>
            ${recipe.steps.map((step) => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      </div>
    </div>
  `;

  // Favorite button on the detail page itself
  document.getElementById('detailFavoriteBtn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const nowFavorited = toggleFavorite(recipe.id);
    btn.classList.toggle('is-favorited', nowFavorited);
    btn.querySelector('i').className = nowFavorited ? 'bi bi-heart-fill' : 'bi bi-heart';
  });

  // Print — just uses the browser's native print, styled cleanly via CSS
  document.getElementById('printBtn').addEventListener('click', () => window.print());

  // Share — uses native share sheet on mobile, falls back to copying the link
  document.getElementById('shareBtn').addEventListener('click', async () => {
    const shareData = { title: recipe.name, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { /* user cancelled, ignore */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  });
}

async function loadRelated(recipeId) {
  try {
    const res = await fetch(`http://localhost:5000/api/recipes/${recipeId}/related`);
    if (!res.ok) throw new Error('Failed to load related recipes');
    const related = await res.json();
    renderCardGrid(related, 'relatedGrid');
  } catch (err) {
    console.error('Related recipes failed to load:', err);
  }
}