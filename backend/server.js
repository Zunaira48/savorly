// backend/server.js
// Purpose: Entry point for our backend. Starts the Express server,
// applies middleware, and wires up our API routes.

const express = require('express');
const cors = require('cors');
const recipeRoutes = require('./api/routes/recipeRoutes');

const app = express();
const PORT = 5000;

app.use(cors());          // Allows frontend (different port) to call this API
app.use(express.json());  // Parses incoming JSON request bodies

// All recipe-related endpoints live under /api/recipes
app.use('/api/recipes', recipeRoutes);

// Simple health check — useful to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Savorly API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Savorly API running at http://localhost:${PORT}`);
});