// frontend/scripts/components/recipeCard.js
// Purpose: Renders a recipe card with a clickable link to the detail
// page, plus a favorite heart button that doesn't trigger navigation.

function renderRecipeCard(recipe) {
  const favorited = isFavorite(recipe.id);

  return `
    <div class="recipe-card" data-id="${recipe.id}">
      <button class="favorite-heart ${favorited ? 'is-favorited' : ''}" data-id="${recipe.id}" aria-label="Toggle favorite">
        <i class="bi ${favorited ? 'bi-heart-fill' : 'bi-heart'}"></i>
      </button>
      <span class="difficulty-badge difficulty-${recipe.difficulty}">${recipe.difficulty}</span>
      <a href="recipe.html?id=${recipe.id}" class="recipe-card-link">
        <img
          class="recipe-card-image"
          src="${recipe.image_url}"
          alt="${recipe.name}"
          loading="lazy"
        >
        <div class="recipe-card-overlay">
          <h3 class="recipe-card-title">${recipe.name}</h3>
          <div class="recipe-card-meta">
            <span><i class="bi bi-clock"></i> ${recipe.minutes} min</span>
            <span><i class="bi bi-list-check"></i> ${recipe.n_ingredients} ingr.</span>
          </div>
        </div>
      </a>
    </div>
  `;
}

function renderCardGrid(recipes, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = recipes.map(renderRecipeCard).join('');
  attachFavoriteHandlers(container);
}

// Wires up every heart button inside a container — called after
// rendering any grid of cards, on any page.
function attachFavoriteHandlers(container) {
  container.querySelectorAll('.favorite-heart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();   // don't follow the card's link
      e.stopPropagation();  // don't bubble up to the card link
      const id = parseInt(btn.dataset.id, 10);
      const nowFavorited = toggleFavorite(id);
      btn.classList.toggle('is-favorited', nowFavorited);
      btn.querySelector('i').className = nowFavorited ? 'bi bi-heart-fill' : 'bi bi-heart';
    });
  });
}