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

module.exports = {
  getAllRecipes,
  getRecipeById,
  searchRecipes,
  getRecipesByCategory,
  getRandomRecipe,
  getAllCategories,
};