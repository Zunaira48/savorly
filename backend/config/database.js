// backend/config/database.js
// Purpose: Creates and exports a single shared connection to our SQLite database.
// Every other backend file imports this instead of creating its own connection.

const Database = require('better-sqlite3');
const path = require('path');

// The .db file will live inside backend/data/ — this is our entire database, one file.
const dbPath = path.join(__dirname, '..', 'data', 'savorly.db');
const db = new Database(dbPath);

// Improves write performance — safe default for a project like this.
db.pragma('journal_mode = WAL');

// Create the recipes table if it doesn't already exist.
// This only runs once — SQLite skips it silently on future startups.
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    minutes INTEGER,
    n_steps INTEGER,
    steps TEXT,
    ingredients TEXT,
    n_ingredients INTEGER,
    calories REAL,
    tags TEXT,
    category TEXT,
    difficulty TEXT,
    image_url TEXT
  )
`);

// An index speeds up searching by name later — important once we have 5000+ rows.
db.exec(`CREATE INDEX IF NOT EXISTS idx_recipe_name ON recipes(name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_recipe_category ON recipes(category)`);

module.exports = db;