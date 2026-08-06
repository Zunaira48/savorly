// backend/api/models/recipeModel.js
// Purpose: Contains all raw SQL queries related to recipes.
// Controllers call these functions instead of writing SQL themselves —
// keeps database logic in one predictable place.

const db = require('../../config/database');

function getAllRecipes({ limit = 20, offset = 0 }) {
  const stmt = db.prepare(`SELECT * FROM recipes LIMIT ? OFFSET ?`);
  return stmt.all(limit, offset);
}

function getRecipeById(id) {
  const stmt = db.prepare(`SELECT * FROM recipes WHERE id = ?`);
  return stmt.get(id);
}

function searchRecipes(query, limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM recipes
    WHERE name LIKE ?
    LIMIT ?
  `);
  return stmt.all(`%${query}%`, limit);
}

function getRecipesByCategory(category, limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM recipes WHERE category = ? LIMIT ?
  `);
  return stmt.all(category, limit);
}

function getRandomRecipe() {
  const stmt = db.prepare(`SELECT * FROM recipes ORDER BY RANDOM() LIMIT 1`);
  return stmt.get();
}

function getAllCategories() {
  const stmt = db.prepare(`SELECT DISTINCT category FROM recipes`);
  return stmt.all().map((row) => row.category);
}
// Builds a dynamic SQL query based on whichever filters are actually
// provided — this single function replaces needing separate endpoints
// for "search", "by category", "by difficulty", etc.
function filterRecipes({ query, category, difficulty, maxTime, limit = 24, offset = 0 }) {
  const conditions = [];
  const params = [];

  if (query) {
    conditions.push('name LIKE ?');
    params.push(`%${query}%`);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (difficulty) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }
  if (maxTime) {
    conditions.push('minutes <= ?');
    params.push(maxTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `SELECT * FROM recipes ${whereClause} ORDER BY id LIMIT ? OFFSET ?`;
  const stmt = db.prepare(sql);
  return stmt.all(...params, limit, offset);
}

// Gets a few recipes from the same category as the given recipe,
// excluding itself — used for the "Related Recipes" section.
function getRelatedRecipes(category, excludeId, limit = 4) {
  const stmt = db.prepare(`
    SELECT * FROM recipes
    WHERE category = ? AND id != ?
    ORDER BY RANDOM()
    LIMIT ?
  `);
  return stmt.all(category, excludeId, limit);
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  searchRecipes,
  getRecipesByCategory,
  getRandomRecipe,
  getAllCategories,
  filterRecipes,
  getRelatedRecipes,
};