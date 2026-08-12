// backend/api/services/geminiService.js
// Purpose: Thin wrapper around Google's Gemini API (free tier). Used only
// as an optional "no exact match found" fallback for the ingredient
// matcher — generates a simple original recipe idea from a raw ingredient
// list. Every failure mode (no key configured, network error, bad
// response) is caught and turned into a null return rather than a thrown
// error, so the rest of the app never breaks because of this feature.

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function suggestRecipeFromIngredients(ingredientsText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — AI suggestion skipped');
    return null;
  }

  const prompt = `You are a home cooking assistant. A user has these ingredients available: ${ingredientsText}.
Suggest ONE simple, realistic recipe they could make, using mostly what they have (a couple of common pantry staples like salt, oil, or water are fine to assume).
Respond ONLY with valid JSON, no markdown fences, no extra text, in exactly this shape:
{
  "name": "Recipe name",
  "minutes": 20,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2", "step 3"]
}`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          // Gemini 3.x models "think" before answering, and those thinking
          // tokens are deducted from maxOutputTokens by default — with a
          // simple task like this, that was eating the whole budget and
          // truncating the JSON before it finished. Keeping thinking low
          // leaves enough room for the actual answer.
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    // Model sometimes wraps JSON in ```json fences despite instructions — strip them.
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Gemini returned non-JSON or truncated output:', parseErr.message);
      console.error('Raw response (first 300 chars):', cleaned.slice(0, 300));
      return null;
    }

    if (!parsed.name || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.steps)) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('Gemini suggestion failed:', err.message);
    return null;
  }
}

module.exports = { suggestRecipeFromIngredients };