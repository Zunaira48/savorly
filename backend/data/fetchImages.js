// backend/data/fetchImages.js
// Purpose: One-time script. Calls the official Unsplash API to collect
// real food photo URLs, grouped by category, saved locally so we never
// need to call an external service again during actual site use.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!ACCESS_KEY) {
  console.error('❌ Missing UNSPLASH_ACCESS_KEY in backend/.env — see Chat 4 setup steps.');
  process.exit(1);
}

// Search terms mapped to our own recipe categories.
const CATEGORY_SEARCH_TERMS = {
  breakfast: 'breakfast food plate',
  dessert: 'dessert cake sweet',
  vegan: 'vegan food bowl',
  vegetarian: 'vegetarian pasta dish',
  seafood: 'seafood fish dish',
  'quick-meals': 'quick meal food',
  soup: 'soup bowl food',
  salad: 'salad fresh food',
  main: 'dinner plate food',
  general: 'delicious food dish',
};

const IMAGES_PER_CATEGORY = 15;

async function fetchImagesForCategory(searchTerm) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=${IMAGES_PER_CATEGORY}&client_id=${ACCESS_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Unsplash request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // regular size (~1080px) is a good balance of quality and load speed
  return data.results.map((photo) => photo.urls.regular);
}

async function buildPool() {
  const pool = {};

  for (const [category, searchTerm] of Object.entries(CATEGORY_SEARCH_TERMS)) {
    console.log(`Fetching images for: ${category} ("${searchTerm}")`);
    try {
      pool[category] = await fetchImagesForCategory(searchTerm);
      console.log(`  ✅ Got ${pool[category].length} images`);
    } catch (err) {
      console.log(`  ❌ Failed for ${category}: ${err.message}`);
      pool[category] = [];
    }
  }

  const outputPath = path.join(__dirname, 'imagePool.json');
  fs.writeFileSync(outputPath, JSON.stringify(pool, null, 2));
  console.log(`✅ Image pool saved to ${outputPath}`);
}

buildPool();