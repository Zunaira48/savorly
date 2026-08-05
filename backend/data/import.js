// backend/data/import.js
// Purpose: One-time script. Reads RAW_recipes.csv, cleans the messy data,
// and inserts a curated ~5,500 recipes into our SQLite database.
// Run this manually whenever you want to (re)build the database — it is NOT
// part of the live server.

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/database');

const CSV_PATH = path.join(__dirname, 'raw', 'RAW_recipes.csv');
const TARGET_COUNT = 5500;

// Category keywords — we scan each recipe's tags to guess a clean category.
// This turns messy raw tags into something our UI can filter by.
const CATEGORY_MAP = {
  breakfast: ['breakfast', 'brunch'],
  dessert: ['dessert', 'cake', 'cookie', 'sweet'],
  vegan: ['vegan'],
  vegetarian: ['vegetarian'],
  seafood: ['seafood', 'fish'],
  'quick-meals': ['15-minutes-or-less', '30-minutes-or-less'],
  soup: ['soups-stews', 'soup'],
  salad: ['salad', 'salads'],
  main: ['main-dish', 'main-course'],
};

function detectCategory(tags) {
  const lowerTags = tags.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((keyword) => lowerTags.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

// The raw data stores time in minutes only — we translate that into
// a difficulty label our cards can display.
function detectDifficulty(minutes, nSteps) {
  if (minutes <= 20 && nSteps <= 5) return 'Easy';
  if (minutes <= 60 && nSteps <= 12) return 'Medium';
  return 'Hard';
}

// The raw 'ingredients' and 'steps' columns look like Python list strings,
// e.g. "['flour', 'sugar', 'eggs']" — this converts that text into a real
// JavaScript array so we can store it as clean JSON.
function parsePythonListString(rawString) {
  try {
    const cleaned = rawString
      .replace(/^\[|\]$/g, '')       // remove outer brackets
      .split("', '")                  // split items apart
      .map((item) => item.replace(/^'|'$/g, '').trim())
      .filter((item) => item.length > 0);
    return cleaned;
  } catch (err) {
    return [];
  }
}

// The 'nutrition' column looks like "[calories, fat, sugar, sodium, protein, ...]"
// We only need calories for the card display, so we grab the first number.
function extractCalories(nutritionString) {
  try {
    const match = nutritionString.match(/\[([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  } catch (err) {
    return null;
  }
}

// Simple placeholder image assignment based on category —
// avoids having to match every single recipe to a literal photo.
const IMAGE_BY_CATEGORY = {
  breakfast: 'https://source.unsplash.com/800x600/?breakfast,food',
  dessert: 'https://source.unsplash.com/800x600/?dessert,cake',
  vegan: 'https://source.unsplash.com/800x600/?vegan,food',
  vegetarian: 'https://source.unsplash.com/800x600/?vegetarian,food',
  seafood: 'https://source.unsplash.com/800x600/?seafood,fish',
  'quick-meals': 'https://source.unsplash.com/800x600/?quickmeal,food',
  soup: 'https://source.unsplash.com/800x600/?soup,food',
  salad: 'https://source.unsplash.com/800x600/?salad,food',
  main: 'https://source.unsplash.com/800x600/?dinner,food',
  general: 'https://source.unsplash.com/800x600/?food,cooking',
};

async function runImport() {
  console.log('Starting import... this will take a minute for a 287MB file.');

  const insertStmt = db.prepare(`
    INSERT INTO recipes
      (original_id, name, description, minutes, n_steps, steps, ingredients,
       n_ingredients, calories, tags, category, difficulty, image_url)
    VALUES
      (@original_id, @name, @description, @minutes, @n_steps, @steps, @ingredients,
       @n_ingredients, @calories, @tags, @category, @difficulty, @image_url)
  `);

  // Wrapping all inserts in a single transaction makes this dramatically
  // faster — thousands of individual inserts vs. one batched commit.
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insertStmt.run(row);
  });

  let insertedCount = 0;
  const batch = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        if (insertedCount >= TARGET_COUNT) return;

        // Skip incomplete rows — no name, no steps, or no ingredients means
        // we can't build a usable recipe card/detail page from it.
        if (!row.name || !row.steps || !row.ingredients) return;

        const ingredientsArray = parsePythonListString(row.ingredients);
        const stepsArray = parsePythonListString(row.steps);

        if (ingredientsArray.length === 0 || stepsArray.length === 0) return;

        const category = detectCategory(row.tags || '');
        const minutes = parseInt(row.minutes, 10) || 0;
        const nSteps = parseInt(row.n_steps, 10) || stepsArray.length;

        batch.push({
          original_id: parseInt(row.id, 10) || null,
          name: row.name.trim(),
          description: (row.description || '').trim().slice(0, 500),
          minutes,
          n_steps: nSteps,
          steps: JSON.stringify(stepsArray),
          ingredients: JSON.stringify(ingredientsArray),
          n_ingredients: ingredientsArray.length,
          calories: extractCalories(row.nutrition || ''),
          tags: row.tags || '',
          category,
          difficulty: detectDifficulty(minutes, nSteps),
          image_url: IMAGE_BY_CATEGORY[category],
        });

        insertedCount++;

        // Insert in chunks of 500 to keep memory usage reasonable.
        if (batch.length >= 500) {
          insertMany(batch.splice(0, batch.length));
          console.log(`Inserted ${insertedCount} recipes so far...`);
        }
      })
      .on('end', () => {
        if (batch.length > 0) insertMany(batch);
        console.log(`✅ Import complete. Total recipes inserted: ${insertedCount}`);
        resolve();
      })
      .on('error', (err) => reject(err));
  });
}

runImport().catch((err) => {
  console.error('❌ Import failed:', err);
});