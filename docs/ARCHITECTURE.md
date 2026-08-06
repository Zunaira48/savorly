# Architecture

## Overview
Savorly follows a decoupled frontend/backend architecture. The frontend
is a static multi-page application; the backend is a REST API. They
communicate exclusively over HTTP — the frontend has no direct database
access.

## Backend Layers
- **Routes** — map URLs to controller functions, no logic
- **Controllers** — handle request/response, call models, format output
- **Models** — contain all raw SQL, the only layer touching the database

This separation means the database could be swapped (e.g. to PostgreSQL)
by only rewriting the models layer — routes and controllers stay untouched.

## Why SQLite
Chosen for zero-setup portability — anyone cloning this repo can run it
immediately without provisioning a database server. At 5,500 rows, it
comfortably handles the read-heavy query patterns this app needs.

## Data Flow Example: Loading the Homepage
1. `main.js` fires on `DOMContentLoaded`
2. Calls `fetchRecipes()`, `fetchCategories()`, `fetchRandomRecipe()` in `recipeApi.js`
3. Each hits a corresponding Express route
4. Controller calls the model, model runs a prepared SQL statement
5. JSON response flows back, `recipeCard.js` renders it into the DOM