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
// Cooking words that add noise if matched literally (measurements, prep
// instructions) — never useful as a "you have this ingredient" signal.
const INGREDIENT_STOPWORDS = new Set([
  'of', 'and', 'or', 'to', 'taste', 'fresh', 'chopped', 'sliced', 'diced',
  'minced', 'large', 'small', 'medium', 'ground', 'plus', 'extra', 'virgin',
  'optional', 'cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon',
  'teaspoons', 'pound', 'pounds', 'ounce', 'ounces', 'can', 'cans',
]);

// Splits on any non-letter character (commas, spaces, punctuation all work
// the same way), drops short/noise words, and strips simple plurals so
// "eggs" and "egg" are treated as the same ingredient.
function tokenizeIngredientText(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !INGREDIENT_STOPWORDS.has(w))
    .map((w) => {
      if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'; // berries -> berry
      if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);        // tomatoes -> tomato
      if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);         // eggs -> egg
      return w;
    });
}

function matchByIngredients(req, res) {
  const rawInput = req.query.ingredients || '';
  const userTokens = new Set(tokenizeIngredientText(rawInput));

  if (userTokens.size === 0) {
    return res.status(400).json({ error: 'Provide at least one ingredient, e.g. ?ingredients=egg,rice' });
  }

  const limit = parseInt(req.query.limit, 10) || 12;
  const allRecipes = recipeModel.getAllRecipesForMatching();

  const scored = allRecipes
    .map((recipe) => {
      const recipeIngredients = JSON.parse(recipe.ingredients || '[]');
      if (recipeIngredients.length === 0) return null;

      const matched = recipeIngredients.filter((ri) => {
        const riTokens = tokenizeIngredientText(ri);
        return riTokens.some((rt) => userTokens.has(rt));
      });
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

const geminiService = require('../services/geminiService');

async function aiSuggestRecipe(req, res) {
  const ingredients = (req.query.ingredients || '').trim();
  if (!ingredients) {
    return res.status(400).json({ error: 'Provide ingredients, e.g. ?ingredients=egg,rice' });
  }

  const suggestion = await geminiService.suggestRecipeFromIngredients(ingredients);

  if (!suggestion) {
    // Not a server error — just "AI couldn't help this time". Frontend
    // treats this the same as "feature unavailable" and hides gracefully.
    return res.status(200).json({ available: false });
  }

  res.status(200).json({ available: true, recipe: suggestion });
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
  aiSuggestRecipe,
  // Exposed only for unit testing the ingredient-matching logic directly —
  // not part of the public API surface.
  __testing__: { tokenizeIngredientText },
};