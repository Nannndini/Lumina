/**
 * Groq API integration for Lumina aura scanning.
 * Features: mood injection (Req 3), retry logic (Req 10), timeout (Req 6/10), typed errors (Req 10)
 */

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const TIMEOUT_MS = 15000;

/**
 * Typed error class for Lumina API errors.
 * type: 'OFFLINE' | 'API_ERROR' | 'PARSE_ERROR' | 'TIMEOUT'
 */
export class LuminaError extends Error {
  constructor(type, message) {
    super(message);
    this.name = 'LuminaError';
    this.type = type;
  }
}

/**
 * Returns a human-friendly error message for display in the UI.
 * Feature: lumina-production-features, Property 17
 */
export function getErrorMessage(error) {
  if (error instanceof LuminaError) {
    switch (error.type) {
      case 'OFFLINE':
        return 'You appear to be offline. Check your connection and try again.';
      case 'API_ERROR':
        return 'The cosmos are busy right now. Try again in a moment.';
      case 'PARSE_ERROR':
        return 'Could not read your aura. Please try again.';
      case 'TIMEOUT':
        return 'The cosmos are busy right now. Try again in a moment.';
      default:
        return 'Could not read your aura. Please try again.';
    }
  }
  // Network errors
  if (
    error.message?.includes('Network request failed') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError')
  ) {
    return 'You appear to be offline. Check your connection and try again.';
  }
  return 'Could not read your aura. Please try again.';
}

/**
 * Builds the Groq prompt string, optionally injecting mood context.
 *
 * @param {object|null} mood - { emoji: string, label: string } or null
 * @returns {string}
 *
 * Feature: lumina-production-features, Property 6: Mood is reflected in Groq prompt
 */
export function buildPrompt(mood) {
  const base = `You are a mystical aura reader. Analyze this person's energy and return ONLY a valid JSON object with no extra text, no markdown, no code fences:
{
  "color": "color name (e.g. Deep Violet, Golden Yellow, Ocean Blue)",
  "hex": "#hexcode matching the color",
  "archetype": "one of: The Mystic, The Warrior, The Healer, The Creator, The Sage, The Rebel, The Lover, The Explorer, The Guardian, The Visionary",
  "vibe_score": number between 0-100,
  "title": "a short cosmic title for this person (3-5 words)",
  "breakdown": "3-4 sentence cosmic personality reading, mystical and poetic tone",
  "strengths": ["strength1", "strength2", "strength3"],
  "energy": "one word energy descriptor (e.g. Radiant, Grounded, Electric, Flowing)",
  "shadow_side": "1-2 sentences about their shadow or challenge to grow through",
  "compatibility": "Best compatible with: [aura color] — [one sentence why]"
}`;

  if (mood && mood.emoji && mood.label) {
    return `${base}\n\nIMPORTANT: The user is currently feeling ${mood.emoji} (${mood.label}). Let this mood subtly influence the reading's tone and insights.`;
  }
  return base;
}

/**
 * Makes a single Groq API call and returns the parsed JSON result.
 * Throws LuminaError on failure.
 *
 * @param {string} base64Image
 * @param {object|null} mood
 * @returns {Promise<object>}
 */
async function callGroqAPI(base64Image, mood) {
  if (!GROQ_API_KEY) {
    throw new LuminaError('API_ERROR', 'EXPO_PUBLIC_GROQ_API_KEY is not set. Check your .env file.');
  }

  // Offline detection (web)
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new LuminaError('OFFLINE', 'No internet connection.');
  }

  const prompt = buildPrompt(mood);

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
        max_tokens: 700,
        temperature: 0.8,
      }),
    });
  } catch (networkErr) {
    // Network-level failure (offline, DNS, etc.)
    if (
      networkErr.message?.includes('Network request failed') ||
      networkErr.message?.includes('Failed to fetch') ||
      networkErr.message?.includes('NetworkError')
    ) {
      throw new LuminaError('OFFLINE', networkErr.message);
    }
    throw new LuminaError('API_ERROR', networkErr.message);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new LuminaError('API_ERROR', `Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new LuminaError('API_ERROR', 'Unexpected response format from Groq API');
  }

  const text = data.choices[0].message.content;

  // Robust JSON extraction: strip markdown fences and find the JSON object
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new LuminaError('PARSE_ERROR', 'No JSON object found in Groq response: ' + text);
  }
  clean = clean.slice(start, end + 1);

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    throw new LuminaError('PARSE_ERROR', 'Failed to parse aura JSON: ' + parseErr.message);
  }
}

/**
 * Scans an aura image using the Groq API.
 * Includes mood injection, 15s timeout, and automatic retry on PARSE_ERROR.
 *
 * @param {string} base64Image - Base64-encoded JPEG image
 * @param {object|null} mood   - { emoji, label } or null
 * @returns {Promise<object>}  - Parsed aura result object
 *
 * Feature: lumina-production-features, Property 16: JSON parse retry fires exactly once on first failure
 */
export async function scanAura(base64Image, mood = null) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new LuminaError('TIMEOUT', 'Scan timed out after 15 seconds')),
      TIMEOUT_MS
    )
  );

  // Attempt 1
  try {
    const result = await Promise.race([callGroqAPI(base64Image, mood), timeoutPromise]);
    return result;
  } catch (err) {
    // Only retry on PARSE_ERROR; propagate all other errors immediately
    if (!(err instanceof LuminaError) || err.type !== 'PARSE_ERROR') {
      throw err;
    }
    // Attempt 2 (retry)
    try {
      const result = await Promise.race([callGroqAPI(base64Image, mood), timeoutPromise]);
      return result;
    } catch (retryErr) {
      // If retry also fails with PARSE_ERROR, throw PARSE_ERROR
      if (retryErr instanceof LuminaError && retryErr.type === 'PARSE_ERROR') {
        throw new LuminaError('PARSE_ERROR', 'Could not parse aura after retry.');
      }
      throw retryErr;
    }
  }
}
