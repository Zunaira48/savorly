// frontend/scripts/pages/dailyPick.js
// Purpose: Shows a "Recipe of the Day" — the SAME recipe for every visitor
// on a given calendar day, without any new backend endpoint. We hash
// today's date into a recipe ID and fetch it with the existing
// GET /recipes/:id endpoint. The ID changes deterministically at midnight.

// Recipes are imported with sequential auto-increment IDs — the handover
// doc confirms ~5,500 rows. We stay safely under that so every generated
// ID is always a real recipe.
const APPROX_MAX_RECIPE_ID = 5400;

function getTodaysSeedId() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));

  // Multiplicative hash (Knuth's constant) spreads consecutive days across
  // very different IDs, so the pick doesn't just creep up by 1 each day.
  const hashed = (dayOfYear * 2654435761) % APPROX_MAX_RECIPE_ID;
  return Math.abs(hashed) + 1;
}

async function loadDailyPick() {
  const container = document.getElementById('dailyPickContent');
  if (!container) return;

  try {
    const recipe = await fetchRecipeById(getTodaysSeedId());
    renderDailyPick(recipe);
  } catch (err) {
    // Rare (only if a specific ID happens to be a gap in the table) —
    // today's random endpoint is a perfectly good fallback.
    console.warn('Daily pick ID unavailable, falling back to random:', err.message);
    try {
      const fallback = await fetchRandomRecipe();
      renderDailyPick(fallback);
    } catch (fallbackErr) {
      console.error('Recipe of the Day failed entirely:', fallbackErr);
      container.parentElement.style.display = 'none';
    }
  }
}

function renderDailyPick(recipe) {
  const container = document.getElementById('dailyPickContent');
  container.innerHTML = `
    <img class="daily-pick-image" src="${recipe.image_url}" alt="${recipe.name}">
    <div class="daily-pick-overlay">
      <span class="daily-pick-tag">🗓️ Recipe of the Day</span>
      <h3>${recipe.name}</h3>
      <div class="daily-pick-meta">
        <span><i class="bi bi-clock"></i> ${recipe.minutes} min</span>
        <span><i class="bi bi-bar-chart"></i> ${recipe.difficulty}</span>
      </div>
      <a href="recipe.html?id=${recipe.id}" class="btn-primary-glow">View Full Recipe</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', loadDailyPick);