// frontend/scripts/api/recipeApi.js
// Purpose: Centralizes every fetch call to our backend. If the API URL
// ever changes (e.g., moving to a deployed server), we only update it here.

const API_BASE_URL = 'http://localhost:5000/api';

async function fetchRecipes(limit = 8) {
  const res = await fetch(`${API_BASE_URL}/recipes?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE_URL}/recipes/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

async function fetchByCategory(category) {
  const res = await fetch(`${API_BASE_URL}/recipes/category/${category}`);
  if (!res.ok) throw new Error('Failed to fetch category recipes');
  return res.json();
}

async function searchRecipes(query) {
  const res = await fetch(`${API_BASE_URL}/recipes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}