const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export async function scanAura(base64Image) {
  if (!GROQ_API_KEY) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set. Check your .env file.');
  }

  const prompt = `You are a mystical aura reader. Analyze this person's energy and return ONLY a valid JSON object with no extra text, no markdown, no code fences:
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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Unexpected response format from Groq API');
  }

  const text = data.choices[0].message.content;

  // Robust JSON extraction: strip markdown fences and find the JSON object
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the first { and last } to extract just the JSON object
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in Groq response: ' + text);
  }
  clean = clean.slice(start, end + 1);

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    throw new Error('Failed to parse aura JSON: ' + parseErr.message + '\nRaw: ' + clean);
  }
}
