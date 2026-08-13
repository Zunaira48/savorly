// frontend/scripts/pages/ingredientMatcher.js
// Purpose: Wires up the "Cook With What You Have" section on the homepage.
// Sends the user's ingredient list to the backend's scoring endpoint and
// renders the ranked results using the same card component as everywhere
// else on the site (renderRecipeCard detects match fields automatically).
// Also handles: voice input (Web Speech API), a "/" keyboard shortcut to
// jump to the matcher, and a shareable link that pre-fills + auto-runs
// a search for whoever opens it.

document.getElementById('matcherBtn')?.addEventListener('click', runIngredientMatch);
document.getElementById('matcherInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') runIngredientMatch();
});
document.getElementById('aiSuggestBtn')?.addEventListener('click', runAiSuggestion);
document.getElementById('shareMatchBtn')?.addEventListener('click', shareCurrentMatch);

// ===== Keyboard shortcut: "/" jumps straight to the ingredient input =====
// Standard convention (Gmail, GitHub, etc.) — skipped while the user is
// already typing somewhere else, so it never hijacks normal typing.
document.addEventListener('keydown', (e) => {
  const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    const input = document.getElementById('matcherInput');
    if (!input) return;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
  }
});

// ===== Voice input (Web Speech API) =====
// Only shown if the browser actually supports it — most desktop Firefox
// and some older browsers don't, so we keep the button hidden by default
// (see index.html) and only reveal it here once we've confirmed support.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceBtn = document.getElementById('matcherVoiceBtn');

if (SpeechRecognitionAPI && voiceBtn) {
  voiceBtn.style.display = 'inline-flex';

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isListening = false;

  voiceBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      // start() throws if called while already running (rare double-click) — safe to ignore.
    }
  });

  recognition.addEventListener('start', () => {
    isListening = true;
    voiceBtn.classList.add('is-listening');
  });

  recognition.addEventListener('end', () => {
    isListening = false;
    voiceBtn.classList.remove('is-listening');
  });

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (!transcript) return;
    const input = document.getElementById('matcherInput');
    // Spoken lists usually come through as "eggs, rice and chicken" —
    // turning " and " into a comma keeps it consistent with typed input.
    input.value = transcript.replace(/\s+and\s+/gi, ', ');
    showToast(`Heard: "${transcript}"`);
    runIngredientMatch();
  });

  recognition.addEventListener('error', (event) => {
    isListening = false;
    voiceBtn.classList.remove('is-listening');
    if (event.error === 'not-allowed') {
      showToast('Microphone access denied', 'error');
    } else if (event.error !== 'aborted') {
      showToast("Didn't catch that — try again", 'error');
    }
  });
}

// ===== Shareable match links =====
// Encodes the current ingredient list into the URL so whoever opens the
// link sees the same search auto-run — no backend storage needed, the
// URL itself is the whole state.
async function shareCurrentMatch() {
  const input = document.getElementById('matcherInput');
  const ingredients = input.value.trim();
  if (!ingredients) return;

  const url = new URL(window.location.href);
  url.hash = '';
  url.search = `?ingredients=${encodeURIComponent(ingredients)}`;
  url.hash = 'matcher';
  const shareUrl = url.toString();

  // Native share sheet on mobile; clipboard copy everywhere else.
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Savorly recipe match', url: shareUrl });
      return;
    } catch (err) {
      // User cancelled the share sheet — not an error, just stop here.
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard!');
  } catch (err) {
    showToast('Could not copy link', 'error');
  }
}

// ===== Auto-run a search if the page was opened via a shared link =====
(function loadFromSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const sharedIngredients = params.get('ingredients');
  if (!sharedIngredients) return;

  const input = document.getElementById('matcherInput');
  if (!input) return;
  input.value = sharedIngredients;
  runIngredientMatch();
  document.getElementById('matcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
})();

async function runIngredientMatch() {
  const input = document.getElementById('matcherInput');
  const grid = document.getElementById('matcherGrid');
  const emptyMsg = document.getElementById('matcherEmptyMsg');
  const actionsRow = document.getElementById('matcherActionsRow');
  const aiResult = document.getElementById('aiSuggestResult');
  const ingredients = input.value.trim();

  if (!ingredients) {
    showToast('Type at least one ingredient first');
    return;
  }

  emptyMsg.style.display = 'none';
  actionsRow.style.display = 'none';
  aiResult.innerHTML = '';
  renderSkeletons('matcherGrid', 4);

  try {
    const results = await matchByIngredients(ingredients, 8);
    if (results.length === 0) {
      grid.innerHTML = '';
      emptyMsg.style.display = 'block';
    } else {
      renderCardGrid(results, 'matcherGrid');
    }
    // Offer AI + share after every search, whether matches were found or
    // not — sometimes a fresh AI idea beats browsing the list, and a
    // search with zero matches is still worth sharing as "what I have".
    actionsRow.style.display = 'flex';
  } catch (err) {
    console.error('Ingredient match failed:', err);
    grid.innerHTML = '';
    emptyMsg.textContent = 'Something went wrong — please try again in a moment.';
    emptyMsg.style.display = 'block';
    showToast('Could not fetch matches right now');
  }
}

async function runAiSuggestion() {
  const input = document.getElementById('matcherInput');
  const aiResult = document.getElementById('aiSuggestResult');
  const aiBtn = document.getElementById('aiSuggestBtn');
  const ingredients = input.value.trim();
  if (!ingredients) return;

  aiBtn.disabled = true;
  aiBtn.textContent = 'Thinking…';
  aiResult.innerHTML = '';

  try {
    const data = await fetchAiSuggestion(ingredients);

    if (!data.available) {
      aiResult.innerHTML = `<p class="matcher-hint">AI suggestions aren't available right now — try the matches above instead.</p>`;
      return;
    }

    const r = data.recipe;
    aiResult.innerHTML = `
      <div class="ai-suggest-card">
        <span class="ai-suggest-tag">✨ AI-GENERATED IDEA — not from our recipe database</span>
        <h3>${r.name}</h3>
        <p class="ai-meta"><i class="bi bi-clock"></i> ${r.minutes} min</p>
        <strong>Ingredients</strong>
        <ul>${r.ingredients.map((i) => `<li>${i}</li>`).join('')}</ul>
        <strong>Steps</strong>
        <ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p class="ai-suggest-disclaimer">Generated by AI — double-check quantities and cook times before relying on it.</p>
      </div>
    `;
  } catch (err) {
    console.error('AI suggestion failed:', err);
    aiResult.innerHTML = `<p class="matcher-hint">Couldn't reach the AI service right now — please try again shortly.</p>`;
  } finally {
    aiBtn.disabled = false;
    aiBtn.textContent = '✨ Ask AI for a recipe idea instead';
  }
}