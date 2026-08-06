// frontend/scripts/utils/favorites.js
// Purpose: Manages the user's favorited recipes using browser localStorage.
// No backend/account needed — favorites persist on this device only,
// which is a completely normal pattern for a portfolio-scale project.

const FAVORITES_KEY = 'savorly_favorites';

function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function isFavorite(recipeId) {
  return getFavorites().includes(recipeId);
}

function toggleFavorite(recipeId) {
  const favorites = getFavorites();
  const index = favorites.indexOf(recipeId);

  if (index === -1) {
    favorites.push(recipeId);
  } else {
    favorites.splice(index, 1);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites.includes(recipeId); // returns new favorited state
}