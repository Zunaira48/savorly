// frontend/scripts/components/recipeCard.js
// Purpose: Takes a recipe object and returns the HTML string for a card.
// Used everywhere we display recipes, so the markup only lives in one place.

function renderRecipeCard(recipe) {
  return `
    <div class="recipe-card" data-id="${recipe.id}">
      <span class="difficulty-badge difficulty-${recipe.difficulty}">${recipe.difficulty}</span>
      <img class="recipe-card-image" src="${recipe.image_url}" alt="${recipe.name}" loading="lazy">
      <div class="recipe-card-body">
        <h3 class="recipe-card-title">${recipe.name}</h3>
        <div class="recipe-card-meta">
          <span><i class="bi bi-clock"></i> ${recipe.minutes} min</span>
          <span><i class="bi bi-list-check"></i> ${recipe.n_ingredients} ingredients</span>
        </div>
      </div>
    </div>
  `;
}

function renderCardGrid(recipes, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = recipes.map(renderRecipeCard).join('');
}