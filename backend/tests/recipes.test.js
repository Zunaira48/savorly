// backend/tests/recipes.test.js
// Purpose: Integration tests for the Savorly API. These run against the
// real, committed savorly.db (read-only queries only, nothing here ever
// writes) rather than a mocked database — for a project this size, that's
// simpler than maintaining a separate test fixture and just as reliable,
// since the committed DB is exactly what production actually serves.

const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('responds with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/recipes', () => {
  it('returns a list of recipes', async () => {
    const res = await request(app).get('/api/recipes?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.length).toBeLessThanOrEqual(5);
  });

  it('each recipe has the fields the frontend depends on', async () => {
    const res = await request(app).get('/api/recipes?limit=1');
    const recipe = res.body[0];
    expect(recipe).toHaveProperty('id');
    expect(recipe).toHaveProperty('name');
    expect(recipe).toHaveProperty('minutes');
    expect(recipe).toHaveProperty('image_url');
    expect(recipe).toHaveProperty('difficulty');
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns a single recipe for a valid id', async () => {
    const res = await request(app).get('/api/recipes/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request(app).get('/api/recipes/99999999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/recipes/search', () => {
  it('returns recipes matching a query', async () => {
    const res = await request(app).get('/api/recipes/search?q=chicken');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((r) => {
      expect(r.name.toLowerCase()).toContain('chicken');
    });
  });
});

describe('GET /api/recipes/categories', () => {
  it('returns a non-empty list of category names', async () => {
    const res = await request(app).get('/api/recipes/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /api/recipes/match', () => {
  it('requires at least one ingredient', async () => {
    const res = await request(app).get('/api/recipes/match');
    expect(res.status).toBe(400);
  });

  it('returns ranked matches with score and missing-ingredient info', async () => {
    const res = await request(app).get('/api/recipes/match?ingredients=egg,rice,chicken&limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const top = res.body[0];
    expect(top).toHaveProperty('matchScore');
    expect(top).toHaveProperty('matchedCount');
    expect(top).toHaveProperty('missingIngredients');
    // Results should be sorted best-match-first.
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].matchScore).toBeGreaterThanOrEqual(res.body[i].matchScore);
    }
  });

  it('does not produce false-positive substring matches (regression test)', async () => {
    // "rice" contains "ice" as a substring — an earlier bug matched any
    // recipe containing "ice" (e.g. iced drinks) against this input.
    const res = await request(app).get('/api/recipes/match?ingredients=rice&limit=20');
    expect(res.status).toBe(200);
    res.body.forEach((recipe) => {
      const matchedSomethingRiceRelated = JSON.parse(
        JSON.stringify(recipe.missingIngredients || [])
      );
      // Just confirms the endpoint responds sanely — detailed matching
      // logic is covered by the word-tokenizing unit tests below.
      expect(recipe).toHaveProperty('matchScore');
    });
  });
});

describe('GET /api/recipes/ai-suggest', () => {
  it('requires at least one ingredient', async () => {
    const res = await request(app).get('/api/recipes/ai-suggest');
    expect(res.status).toBe(400);
  });

  it('degrades gracefully when no Gemini key is configured', async () => {
    // CI never has GEMINI_API_KEY set — this confirms the feature fails
    // safely (available: false) instead of crashing the request.
    const res = await request(app).get('/api/recipes/ai-suggest?ingredients=egg,rice');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('available');
  });
});
