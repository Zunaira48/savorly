// backend/api/index.js
// Purpose: Vercel auto-detects files inside /api as serverless functions.
// This file simply re-exports our existing Express app so Vercel can
// invoke it per-request.

const app = require('../server');
module.exports = app;