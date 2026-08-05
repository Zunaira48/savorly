# Savorly 🍳

A modern recipe discovery platform built with Node.js, Express, SQLite, and vanilla JavaScript.

## Status
🚧 Currently in active development.

## Tech Stack
- Frontend: HTML5, CSS3, Bootstrap 5, Vanilla JS
- Backend: Node.js, Express.js
- Database: SQLite (better-sqlite3)

## Setup
1. Clone this repo
2. `cd backend && npm install`
3. Download `RAW_recipes.csv` from [Kaggle](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions) into `backend/data/raw/`
4. `node data/import.js` to build the database
5. `node server.js` to start the API on port 5000