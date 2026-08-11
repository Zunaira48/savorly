// frontend/scripts/pages/ingredientMatcher.js
// Purpose: Wires up the "Cook With What You Have" section on the homepage.
// Sends the user's ingredient list to the backend's scoring endpoint and
// renders the ranked results using the same card component as everywhere
// else on the site (renderRecipeCard detects match fields automatically).

document.getElementById('matcherBtn')?.addEventListener('click', runIngredientMatch);
document.getElementById('matcherInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') runIngredientMatch();
});

async function runIngredientMatch() {
  const input = document.getElementById('matcherInput');
  const grid = document.getElementById('matcherGrid');
  const emptyMsg = document.getElementById('matcherEmptyMsg');
  const ingredients = input.value.trim();

  if (!ingredients) {
    showToast('Type at least one ingredient first');
    return;
  }

  emptyMsg.style.display = 'none';
  renderSkeletons('matcherGrid', 4);

  try {
    const results = await matchByIngredients(ingredients, 8);
    if (results.length === 0) {
      grid.innerHTML = '';
      emptyMsg.style.display = 'block';
      return;
    }
    renderCardGrid(results, 'matcherGrid');
  } catch (err) {
    console.error('Ingredient match failed:', err);
    grid.innerHTML = '';
    emptyMsg.textContent = 'Something went wrong — please try again in a moment.';
    emptyMsg.style.display = 'block';
    showToast('Could not fetch matches right now');
  }
}
