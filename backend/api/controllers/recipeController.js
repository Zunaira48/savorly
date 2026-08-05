// backend/api/controllers/recipeController.js
// Purpose: Receives HTTP requests, calls the model for data,
// formats and sends back the JSON response. No SQL lives here.

const recipeModel = require('../models/recipeModel');

// Helper: our steps/ingredients are stored as JSON strings — parse them
// back into arrays before sending to the frontend.
function formatRecipe(recipe) {
  if (!recipe) return null;
  return {
    ...recipe,
    steps: JSON.parse(recipe.steps || '[]'),
    ingredients: JSON.parse(recipe.ingredients || '[]'),
  };
}

function listRecipes(req, res) {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const recipes = recipeModel.getAllRecipes({ limit, offset });
  res.json(recipes.map(formatRecipe));
}

function getRecipe(req, res) {
  const recipe = recipeModel.getRecipeById(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(formatRecipe(recipe));
}

function search(req, res) {
  const query = req.query.q || '';
  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  const results = recipeModel.searchRecipes(query);
  res.json(results.map(formatRecipe));
}

function byCategory(req, res) {
  const recipes = recipeModel.getRecipesByCategory(req.params.category);
  res.json(recipes.map(formatRecipe));
}

function random(req, res) {
  const recipe = recipeModel.getRandomRecipe();
  res.json(formatRecipe(recipe));
}

function categories(req, res) {
  res.json(recipeModel.getAllCategories());
}

module.exports = {
  listRecipes,
  getRecipe,
  search,
  byCategory,
  random,
  categories,
};