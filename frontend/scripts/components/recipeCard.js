// frontend/scripts/components/recipeCard.js
// Purpose: Renders a Pinterest-style image-forward card with an
// overlay gradient instead of a separate text block below the image.

function renderRecipeCard(recipe) {
  return `
    <div class="recipe-card" data-id="${recipe.id}">
      <span class="difficulty-badge difficulty-${recipe.difficulty}">${recipe.difficulty}</span>
      <img
        class="recipe-card-image"
        src="${recipe.image_url}"
        alt="${recipe.name}"
        loading="lazy"
        onerror="this.src='https://picsum.photos/seed/fallback${recipe.id}/800/600'"
      >
      <div class="recipe-card-overlay">
        <h3 class="recipe-card-title">${recipe.name}</h3>
        <div class="recipe-card-meta">
          <span><i class="bi bi-clock"></i> ${recipe.minutes} min</span>
          <span><i class="bi bi-list-check"></i> ${recipe.n_ingredients} ingr.</span>
        </div>
      </div>
    </div>
  `;
}

function renderCardGrid(recipes, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = recipes.map(renderRecipeCard).join('');
}