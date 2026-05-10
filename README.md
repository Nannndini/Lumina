# ✨ Lumina — AI Aura Scanner

Lumina is a mystical AI-powered aura reading app built with React Native + Expo. Upload a photo, and Lumina uses Groq's vision AI to analyze your energy and reveal your cosmic aura profile.

---

## Features

- **AI Aura Scanning** — Sends your photo to Groq's `llama-4-scout-17b-16e-instruct` vision model and receives a full aura reading in JSON
- **Stunning Result Card** — Circular photo frame with colored glow, huge vibe score, animated progress bar, strength pill badges, shadow side, and compatibility
- **Daily Re-Scan Lock** — Stores last scan date in AsyncStorage; shows today's result with a "Scan anyway" override link
- **Reading History** — Saves up to 10 past readings with thumbnails, scores, and dates; reload on focus
- **Share Button** — Copies a shareable aura summary to clipboard on web; uses native Share API on mobile
- **Floating Star Particles** — CSS `@keyframes` star animation injected on web via `Platform.OS === 'web'`
- **Error Handling** — All screens handle API errors, missing data, and edge cases gracefully

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Navigation | React Navigation v7 (Stack) |
| AI Vision | Groq API — `llama-4-scout-17b-16e-instruct` |
| Storage | `@react-native-async-storage/async-storage` |
| Gradients | `expo-linear-gradient` |
| Image Picker | `expo-image-picker` |
| Web | `react-native-web` + Expo web export |
| Deployment | Vercel (via `vercel.json`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Groq API key](https://console.groq.com)

### Setup

```bash
git clone https://github.com/your-username/lumina.git
cd lumina
npm install --legacy-peer-deps
```

Create a `.env` file in the root:

```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

### Run

```bash
# Mobile (Expo Go)
npm start

# Web
npm run web

# iOS simulator
npm run ios

# Android emulator
npm run android
```

### Deploy to Vercel

```bash
vercel --prod
```

The `vercel.json` is pre-configured to run `npx expo export --platform web` and serve from `dist/`.

---

## Project Structure

```
lumina/
├── App.js                    # Navigation setup
├── app/
│   ├── screens/
│   │   ├── HomeScreen.js     # Photo upload, daily lock, floating stars
│   │   ├── ResultScreen.js   # Stunning aura card + share button
│   │   └── HistoryScreen.js  # Past readings from AsyncStorage
│   └── lib/
│       └── groq.js           # Groq vision API call + JSON parsing
├── assets/                   # App icons and splash
├── vercel.json               # Vercel deployment config
└── .env                      # EXPO_PUBLIC_GROQ_API_KEY (not committed)
```

---

## Aura Reading Fields

The Groq API returns:

| Field | Description |
|---|---|
| `color` | Aura color name (e.g. "Deep Violet") |
| `hex` | Hex color code for UI theming |
| `archetype` | Cosmic archetype (e.g. "The Mystic") |
| `vibe_score` | 0–100 energy score |
| `title` | Short cosmic title |
| `breakdown` | 3–4 sentence mystical reading |
| `strengths` | Array of 3 strength tags |
| `energy` | One-word energy descriptor |
| `shadow_side` | Growth challenge |
| `compatibility` | Compatible aura color + reason |

---

## License

MIT
