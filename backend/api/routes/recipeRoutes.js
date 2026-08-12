const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

router.get('/', recipeController.listRecipes);
router.get('/random', recipeController.random);
router.get('/search', recipeController.search);
router.get('/filter', recipeController.filterRecipes);
router.get('/categories', recipeController.categories);
router.get('/match', recipeController.matchByIngredients);
router.get('/ai-suggest', recipeController.aiSuggestRecipe);
router.get('/category/:category', recipeController.byCategory);
router.get('/:id/related', recipeController.related);
router.get('/:id', recipeController.getRecipe);

module.exports = router;