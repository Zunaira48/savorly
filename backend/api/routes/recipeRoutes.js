// backend/api/routes/recipeRoutes.js
// Purpose: Defines which URL triggers which controller function.
// This file has zero logic — it's purely a map.

const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

router.get('/', recipeController.listRecipes);              // GET /api/recipes
router.get('/random', recipeController.random);             // GET /api/recipes/random
router.get('/search', recipeController.search);             // GET /api/recipes/search?q=
router.get('/categories', recipeController.categories);     // GET /api/recipes/categories
router.get('/category/:category', recipeController.byCategory); // GET /api/recipes/category/dessert
router.get('/:id', recipeController.getRecipe);              // GET /api/recipes/5

module.exports = router;