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
function filterRecipes(req, res) {
  const { q, category, difficulty, maxTime, limit, offset } = req.query;
  const results = recipeModel.filterRecipes({
    query: q,
    category,
    difficulty,
    maxTime: maxTime ? parseInt(maxTime, 10) : null,
    limit: limit ? parseInt(limit, 10) : 24,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.json(results.map(formatRecipe));
}

function related(req, res) {
  const recipe = recipeModel.getRecipeById(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  const relatedRecipes = recipeModel.getRelatedRecipes(recipe.category, recipe.id);
  res.json(relatedRecipes.map(formatRecipe));
}

// Smart ingredient matcher — no external API, pure JS scoring against
// what's already in the database. A recipe's score is the fraction of
// its own ingredient list the user already has ("coverage"), so a
// 3-ingredient recipe you can fully make ranks above a 10-ingredient
// recipe you're only half-stocked for.
function matchByIngredients(req, res) {
  const rawInput = req.query.ingredients || '';
  const userIngredients = rawInput
    .split(',')
    .map((i) => i.trim().toLowerCase())
    .filter(Boolean);

  if (userIngredients.length === 0) {
    return res.status(400).json({ error: 'Provide at least one ingredient, e.g. ?ingredients=egg,rice' });
  }

  const limit = parseInt(req.query.limit, 10) || 12;
  const allRecipes = recipeModel.getAllRecipesForMatching();

  const scored = allRecipes
    .map((recipe) => {
      const recipeIngredients = JSON.parse(recipe.ingredients || '[]');
      if (recipeIngredients.length === 0) return null;

      const matched = recipeIngredients.filter((ri) =>
        userIngredients.some((ui) => ri.toLowerCase().includes(ui) || ui.includes(ri.toLowerCase()))
      );
      if (matched.length === 0) return null;

      const missing = recipeIngredients.filter((ri) => !matched.includes(ri));

      return {
        id: recipe.id,
        name: recipe.name,
        minutes: recipe.minutes,
        calories: recipe.calories,
        category: recipe.category,
        difficulty: recipe.difficulty,
        image_url: recipe.image_url,
        matchedCount: matched.length,
        totalIngredients: recipeIngredients.length,
        matchScore: Math.round((matched.length / recipeIngredients.length) * 100) / 100,
        missingIngredients: missing,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore || b.matchedCount - a.matchedCount)
    .slice(0, limit);

  res.json(scored);
}

module.exports = {
  listRecipes,
  getRecipe,
  search,
  byCategory,
  random,
  categories,
  filterRecipes,
  related,
  matchByIngredients,
};