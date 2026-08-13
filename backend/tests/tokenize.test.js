// backend/tests/tokenize.test.js
// Purpose: Unit tests for the ingredient-matching tokenizer in isolation
// (no HTTP, no database) — fast checks of the exact word-matching rules.

const { tokenizeIngredientText } = require('../api/controllers/recipeController').__testing__;

describe('tokenizeIngredientText', () => {
  it('splits on commas and spaces equally', () => {
    expect(tokenizeIngredientText('egg,rice,onion')).toEqual(['egg', 'rice', 'onion']);
    expect(tokenizeIngredientText('egg rice onion')).toEqual(['egg', 'rice', 'onion']);
  });

  it('does NOT extract "ice" from "rice" (regression test)', () => {
    // The original bug used raw substring matching, so "eggs rice chicken"
    // spuriously matched any recipe containing the ingredient "ice".
    const tokens = tokenizeIngredientText('rice');
    expect(tokens).not.toContain('ice');
    expect(tokens).toEqual(['rice']);
  });

  it('strips simple plurals so "eggs" and "egg" are the same token', () => {
    expect(tokenizeIngredientText('eggs')).toEqual(['egg']);
    expect(tokenizeIngredientText('tomatoes')).toEqual(['tomato']);
  });

  it('drops noise words (measurements, prep instructions)', () => {
    const tokens = tokenizeIngredientText('2 cups fresh chopped onion');
    expect(tokens).toContain('onion');
    expect(tokens).not.toContain('fresh');
    expect(tokens).not.toContain('chopped');
    expect(tokens).not.toContain('cups');
  });

  it('drops short/noise tokens under 3 characters', () => {
    const tokens = tokenizeIngredientText('1 oz soy sauce');
    expect(tokens).not.toContain('oz');
  });
});
