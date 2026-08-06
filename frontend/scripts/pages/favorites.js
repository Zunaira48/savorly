// frontend/scripts/pages/favorites.js
// Purpose: Loads every recipe ID saved in localStorage, fetches each
// one's full data from the backend, and displays them as a grid.

document.addEventListener('DOMContentLoaded', async () => {
  const favoriteIds = getFavorites();

  if (favoriteIds.length === 0) {
    document.getElementById('emptyFavoritesMsg').style.display = 'block';
    return;
  }

  try {
    // Fetch all favorited recipes in parallel rather than one at a time —
    // much faster when there are several favorites.
    const recipes = await Promise.all(
      favoriteIds.map((id) =>
        fetch(`http://localhost:5000/api/recipes/${id}`).then((res) => res.json())
      )
    );

    renderCardGrid(recipes, 'favoritesGrid');
  } catch (err) {
    console.error('Failed to load favorites:', err);
  }
});