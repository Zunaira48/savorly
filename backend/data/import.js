// backend/data/import.js
// Purpose: One-time script. Reads RAW_recipes.csv, cleans the messy data,
// and inserts a curated ~5,500 recipes into our SQLite database, assigning
// each one a real food photo from our pre-fetched Unsplash image pool.

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/database');

const CSV_PATH = path.join(__dirname, 'raw', 'RAW_recipes.csv');
const TARGET_COUNT = 5500;

// Load our pre-fetched pool of real food images (built by fetchImages.js).
const imagePool = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'imagePool.json'), 'utf-8')
);

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

function detectDifficulty(minutes, nSteps) {
  if (minutes <= 20 && nSteps <= 5) return 'Easy';
  if (minutes <= 60 && nSteps <= 12) return 'Medium';
  return 'Hard';
}

function parsePythonListString(rawString) {
  try {
    const cleaned = rawString
      .replace(/^\[|\]$/g, '')
      .split("', '")
      .map((item) => item.replace(/^'|'$/g, '').trim())
      .filter((item) => item.length > 0);
    return cleaned;
  } catch (err) {
    return [];
  }
}

function extractCalories(nutritionString) {
  try {
    const match = nutritionString.match(/\[([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
  } catch (err) {
    return null;
  }
}

// Picks a real food photo for this recipe, using its own ID to
// consistently land on the same image every time (not random per reload).
function getImageUrl(category, originalId) {
  const images = imagePool[category];
  if (!images || images.length === 0) {
    // Fallback to 'general' pool if a category's pool is empty for any reason.
    const fallbackImages = imagePool['general'];
    return fallbackImages[originalId % fallbackImages.length];
  }
  const index = originalId % images.length;
  return images[index];
}

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
        if (!row.name || !row.steps || !row.ingredients) return;

        const ingredientsArray = parsePythonListString(row.ingredients);
        const stepsArray = parsePythonListString(row.steps);

        if (ingredientsArray.length === 0 || stepsArray.length === 0) return;

        const category = detectCategory(row.tags || '');
        const minutes = parseInt(row.minutes, 10) || 0;
        const nSteps = parseInt(row.n_steps, 10) || stepsArray.length;
        const originalId = parseInt(row.id, 10) || 0;

        batch.push({
          original_id: originalId,
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
          image_url: getImageUrl(category, originalId),
        });

        insertedCount++;

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