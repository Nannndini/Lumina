# Design Document: Lumina Production Features

## Overview

This document describes the technical design for 10 production-ready features added to the Lumina React Native Expo aura-scanning app. All features are implemented using the existing stack: React Native Animated, AsyncStorage, Platform, expo-linear-gradient, expo-image-picker, and react-native-web. No new dependencies are introduced.

The features span four categories:
- **Gamification**: Aura Evolution System (Req 2), Aura Streak Tracker (Req 4)
- **Visual Polish**: Animated Aura Ring (Req 5), Cosmic Loading Screen (Req 6), Polished Result Card (Req 7), HomeScreen Polish (Req 8), History Screen Polish (Req 9)
- **Mood-Aware Scanning**: Mood-Based Scan (Req 3)
- **Data Visualization**: Aura Compatibility Chart (Req 1)
- **Resilience**: Error Handling (Req 10)

---

## Architecture

The app follows a flat screen-based architecture with three screens (HomeScreen, ResultScreen, HistoryScreen) and a shared library (`app/lib/groq.js`). New features are implemented as:

1. **Inline components** within existing screen files (for small, screen-specific UI)
2. **Extracted component files** in `app/components/` (for reusable or complex UI)
3. **Utility functions** in `app/lib/` (for pure logic: level calculation, streak logic, prompt building)

```
app/
  components/
    CompatibilityChart.js     (Req 1)
    EvolutionBadge.js         (Req 2)
    MoodSelector.js           (Req 3)
    StreakBadge.js            (Req 4)
    PulsingRing.js            (Req 5)
    CosmicLoader.js           (Req 6)
  lib/
    groq.js                   (modified: mood injection, retry logic, timeout)
    evolution.js              (Req 2: level/progress pure functions)
    streak.js                 (Req 4: streak update pure functions)
  screens/
    HomeScreen.js             (modified: all HomeScreen features)
    ResultScreen.js           (modified: CompatibilityChart, polished card)
    HistoryScreen.js          (modified: tap-to-navigate, left border, sort, delete)
```

### Data Flow

```
AsyncStorage keys:
  readings      → Array<Reading>  (existing)
  lastScanDate  → string (dateString)  (existing)
  scanCount     → number  (new, Req 2)
  streakCount   → number  (new, Req 4)
  lastStreakDate → string (dateString)  (new, Req 4)
```

### Reading Object Shape (extended)

```js
{
  id: string,
  _saveId: string,
  color: string,
  hex: string,
  archetype: string,
  vibe_score: number,
  title: string,
  breakdown: string,
  strengths: string[],
  energy: string,
  shadow_side: string,
  compatibility: string,
  imageUri: string,
  date: string,           // existing: toLocaleDateString()
  timestamp: number,      // new: Date.now() for sort
  mood: string | null,    // new: Req 3
}
```

---

## Components and Interfaces

### CompatibilityChart (Req 1)

**File**: `app/components/CompatibilityChart.js`

**Props**: `{ auraColor: string, auraHex: string }`

**Behavior**:
- Derives 5 compatibility entries from a static `AURA_TYPES` map (see Data Models)
- The user's own aura type is always first with a score ≥ 90 (randomized 90–100)
- The remaining 4 types are randomly assigned scores 20–85, ensuring no duplicates
- On mount, animates each bar from 0% to target width using `Animated.timing` with 1000ms duration and 150ms stagger per bar
- Each bar is colored with the canonical hex for that aura type

**Interface**:
```js
<CompatibilityChart auraColor={result.color} auraHex={result.hex} />
```

---

### EvolutionBadge (Req 2)

**File**: `app/components/EvolutionBadge.js`

**Props**: `{ scanCount: number }`

**Behavior**:
- Calls `getLevelInfo(scanCount)` from `app/lib/evolution.js`
- Displays level name and progress bar (unless at max level "Cosmic Oracle")
- Progress bar shows `(scanCount - levelMin) / (levelMax - levelMin)`

**Interface**:
```js
<EvolutionBadge scanCount={scanCount} />
```

---

### MoodSelector (Req 3)

**File**: `app/components/MoodSelector.js`

**Props**: `{ selectedMood: string|null, onSelect: (mood) => void }`

**Behavior**:
- Renders 6 mood buttons: `[{emoji:'😊',label:'Happy'},{emoji:'😔',label:'Sad'},{emoji:'😤',label:'Angry'},{emoji:'😰',label:'Anxious'},{emoji:'🥰',label:'Loving'},{emoji:'🤔',label:'Curious'}]`
- Tapping a button calls `onSelect(mood)` and highlights the selected button
- Tapping the already-selected button deselects it (calls `onSelect(null)`)

**Interface**:
```js
<MoodSelector selectedMood={mood} onSelect={setMood} />
```

---

### StreakBadge (Req 4)

**File**: `app/components/StreakBadge.js`

**Props**: `{ streak: number }`

**Behavior**:
- Returns `null` if `streak <= 0`
- Displays `"🔥 N day streak"` for streak 1–6
- Displays `"🌟 Cosmic Streak — N days!"` for streak ≥ 7

**Interface**:
```js
<StreakBadge streak={streakCount} />
```

---

### PulsingRing (Req 5)

**File**: `app/components/PulsingRing.js`

**Props**: `{ visible: boolean, color: string, children: ReactNode }`

**Behavior**:
- On web: injects CSS keyframe animation (`@keyframes pulseRing`, `@keyframes rotateRing`) and renders a `div` wrapper with the animated border
- On native: uses `Animated.loop` with `Animated.sequence` for scale oscillation; uses `LinearGradient` for the colored border ring
- Color is randomly selected from `AURA_COLORS` palette when a new photo is selected
- When `visible` is false, renders children without the ring

**Interface**:
```js
<PulsingRing visible={!!image} color={ringColor}>
  <Image ... />
</PulsingRing>
```

---

### CosmicLoader (Req 6)

**File**: `app/components/CosmicLoader.js`

**Props**: `{ visible: boolean, elapsed: number }` (elapsed in ms)

**Behavior**:
- Renders as `position: 'absolute'` overlay covering the full screen (zIndex 999)
- Cycles through 5 text messages every 2000ms using `setInterval` + `useState`
- Cycles through aura accent colors every 2000ms
- Shows "Taking longer than usual..." when `elapsed > 15000`
- Uses `Animated.loop` for the rotating ring animation
- Cleans up intervals on unmount

**Messages**: `["Reading your energy field...", "Scanning your aura frequency...", "Consulting the cosmos...", "Decoding your spiritual signature...", "Almost ready..."]`

**Interface**:
```js
<CosmicLoader visible={loading} elapsed={loadingElapsed} />
```

---

### evolution.js (Req 2)

**File**: `app/lib/evolution.js`

```js
export const LEVELS = [
  { name: 'Aura Awakening', min: 1, max: 4 },
  { name: 'Aura Adept',     min: 5, max: 9 },
  { name: 'Aura Master',    min: 10, max: 24 },
  { name: 'Cosmic Oracle',  min: 25, max: Infinity },
];

export function getLevelInfo(scanCount)
// Returns { name, progress, isMax }
// progress = (scanCount - min) / (max - min), clamped [0,1]
// isMax = true when name === 'Cosmic Oracle'
```

---

### streak.js (Req 4)

**File**: `app/lib/streak.js`

```js
export function computeNewStreak(lastStreakDate, currentDateString, currentStreak)
// Returns new streak count:
//   - If lastStreakDate is the day immediately before currentDateString: currentStreak + 1
//   - Otherwise: 1
// Uses date arithmetic only (no external calls)
```

---

### groq.js modifications (Req 3, 10)

**Mood injection**: `scanAura(base64Image, mood = null)` — when mood is provided, appends to the prompt: `\n\nIMPORTANT: The user is currently feeling ${mood.emoji} (${mood.label}). Let this mood subtly influence the reading's tone and insights.`

**Retry logic**: On JSON parse failure, automatically retries once before throwing.

**Timeout**: Uses `Promise.race` with a 15-second timeout that throws a specific timeout error.

**Error classification**: Throws typed errors (`OFFLINE`, `API_ERROR`, `PARSE_ERROR`, `TIMEOUT`) so HomeScreen can display the correct message.

---

## Data Models

### AURA_TYPES map

```js
export const AURA_TYPES = {
  'Deep Violet':    '#7c3aed',
  'Golden Yellow':  '#f59e0b',
  'Ocean Blue':     '#3b82f6',
  'Rose Pink':      '#ec4899',
  'Emerald Green':  '#10b981',
  'Crimson Red':    '#ef4444',
  'Silver White':   '#e2e8f0',
  'Amber Orange':   '#f97316',
  'Teal Cyan':      '#06b6d4',
  'Indigo':         '#6366f1',
};
```

### AURA_COLORS palette (for animations)

```js
export const AURA_COLORS = [
  '#7c3aed', '#a855f7', '#ec4899', '#f59e0b',
  '#3b82f6', '#10b981', '#ef4444', '#06b6d4',
];
```

### Compatibility Entry

```js
{
  name: string,    // aura type name
  hex: string,     // canonical hex color
  percent: number, // 0–100
}
```

### Level Info

```js
{
  name: string,      // level name
  progress: number,  // 0.0–1.0
  isMax: boolean,
}
```

### Mood

```js
{
  emoji: string,  // e.g. '😊'
  label: string,  // e.g. 'Happy'
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Compatibility chart always has exactly 5 entries with valid percentages

*For any* valid aura color and hex, the `generateCompatibilityData` function SHALL return exactly 5 entries, each with a `percent` value in the range [0, 100] inclusive, and the entry matching the user's own aura type SHALL have `percent >= 90`.

**Validates: Requirements 1.2, 1.5, 1.6**

---

### Property 2: Compatibility bar colors match canonical aura hex

*For any* compatibility entry generated by `generateCompatibilityData`, the `hex` field SHALL equal the canonical hex value for that aura type name as defined in `AURA_TYPES`.

**Validates: Requirements 1.3**

---

### Property 3: Level mapping is total and correct

*For any* scan count N ≥ 1, `getLevelInfo(N)` SHALL return a level name that satisfies: N in [1,4] → "Aura Awakening", N in [5,9] → "Aura Adept", N in [10,24] → "Aura Master", N ≥ 25 → "Cosmic Oracle". The `progress` value SHALL be in [0, 1] for non-max levels, and `isMax` SHALL be true if and only if N ≥ 25.

**Validates: Requirements 2.2, 2.3, 2.4**

---

### Property 4: Scan count increments by exactly 1 per scan

*For any* initial scan count N stored in AsyncStorage, after one successful scan completes, the stored scan count SHALL equal N + 1.

**Validates: Requirements 2.1**

---

### Property 5: Mood selection is mutually exclusive

*For any* sequence of mood button taps, at most one mood SHALL be selected at any point in time. Tapping the currently selected mood SHALL result in no mood being selected.

**Validates: Requirements 3.2**

---

### Property 6: Mood is reflected in Groq prompt

*For any* mood from the 6 available options, the prompt string generated by `buildPrompt(mood)` SHALL contain both the mood's emoji and its label string.

**Validates: Requirements 3.3**

---

### Property 7: Mood is persisted in saved reading

*For any* mood value M (or null), the reading object saved to AsyncStorage SHALL have a `mood` field equal to M.

**Validates: Requirements 3.6**

---

### Property 8: Streak logic is correct for all date pairs

*For any* pair of date strings (lastDate, currentDate), `computeNewStreak(lastDate, currentDate, N)` SHALL return N+1 if currentDate is exactly one calendar day after lastDate, and SHALL return 1 otherwise.

**Validates: Requirements 4.1**

---

### Property 9: Streak badge format is correct for all counts

*For any* streak count N ≥ 1, the StreakBadge SHALL display text matching `"🔥 N day streak"` when N < 7, and `"🌟 Cosmic Streak — N days!"` when N ≥ 7.

**Validates: Requirements 4.2, 4.3**

---

### Property 10: Cosmic loader message cycling is sequential

*For any* message index i in [0, 4], after one 2000ms interval, the displayed message index SHALL be (i + 1) % 5.

**Validates: Requirements 6.3**

---

### Property 11: Result card always contains watermark and date

*For any* aura result object, the rendered AuraCard SHALL contain the text "✨ Lumina — AI Aura Reading" and a non-empty date/time string.

**Validates: Requirements 7.2, 7.3**

---

### Property 12: Clipboard copy contains required fields

*For any* aura result with color C, archetype A, and vibe_score V, the text copied to clipboard by `handleShare()` SHALL contain C, A, the string representation of V, and the word "Lumina".

**Validates: Requirements 7.5**

---

### Property 13: Last reading summary reflects most recent reading

*For any* non-empty readings array where the most recent reading has color C and archetype A, the HomeScreen summary line SHALL contain both C and A.

**Validates: Requirements 8.2**

---

### Property 14: History readings are sorted newest-first

*For any* array of readings with distinct timestamps, the HistoryScreen SHALL display them in descending timestamp order (newest first).

**Validates: Requirements 9.3**

---

### Property 15: Individual reading deletion preserves all other readings

*For any* readings array of length N and any reading with ID X in that array, after deleting reading X, the stored readings array SHALL have length N-1 and SHALL NOT contain any reading with ID X, while all other readings SHALL remain unchanged.

**Validates: Requirements 9.6**

---

### Property 16: JSON parse retry fires exactly once on first failure

*For any* scenario where the first Groq API call returns unparseable JSON, the `scanAura` function SHALL make exactly 2 total API calls before either succeeding or throwing a parse error.

**Validates: Requirements 10.3**

---

### Property 17: Every error state has a dismiss or retry action

*For any* error condition (API error, offline, parse error, timeout), the HomeScreen SHALL render a visible button or touchable element that allows the user to dismiss the error or retry the scan.

**Validates: Requirements 10.6**

---

## Error Handling

### Error Classification in groq.js

The `scanAura` function throws typed error objects:

```js
class LuminaError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type; // 'OFFLINE' | 'API_ERROR' | 'PARSE_ERROR' | 'TIMEOUT'
  }
}
```

### HomeScreen Error Mapping

```js
function getErrorMessage(error) {
  if (error.type === 'OFFLINE')      return "You appear to be offline. Check your connection and try again.";
  if (error.type === 'API_ERROR')    return "The cosmos are busy right now. Try again in a moment.";
  if (error.type === 'PARSE_ERROR')  return "Could not read your aura. Please try again.";
  if (error.type === 'TIMEOUT')      return "The cosmos are busy right now. Try again in a moment.";
  return "Could not read your aura. Please try again.";
}
```

### Offline Detection

Before making the API call, check `navigator.onLine` on web. On native, catch `TypeError: Network request failed` and map to `OFFLINE`.

### Retry Logic

```
attempt 1 → if JSON parse fails → attempt 2 → if fails → throw PARSE_ERROR
```

### Timeout

```js
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new LuminaError('TIMEOUT', '...')), 15000)
);
const result = await Promise.race([apiCall(), timeoutPromise]);
```

### Error UI

HomeScreen displays an error banner with the friendly message and a "Try Again" button that clears the error and re-enables the scan button.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure functions:

- `getLevelInfo`: test boundary values (0, 1, 4, 5, 9, 10, 24, 25, 100)
- `computeNewStreak`: test consecutive days, non-consecutive days, same day, null lastDate
- `generateCompatibilityData`: test that own aura is ≥ 90%, all 5 entries present, all percents in [0,100]
- `buildPrompt`: test with mood and without mood
- `getErrorMessage`: test all error types
- `StreakBadge`: test render output for streak 0, 1, 6, 7, 100
- `EvolutionBadge`: test render for each level boundary

### Property-Based Tests

Property-based testing is appropriate for this feature because several components involve pure functions with large input spaces (scan counts, date pairs, aura colors, mood values) where universal properties must hold.

**Library**: `fast-check` (already available as a dev dependency pattern; if not installed, use manual property loops with random inputs)

Each property test runs a minimum of 100 iterations.

**Tag format**: `// Feature: lumina-production-features, Property N: <property_text>`

Property tests to implement:

| Property | Function Under Test | Generator |
|----------|--------------------|-----------| 
| P1 | `generateCompatibilityData` | arbitrary aura color from AURA_TYPES keys |
| P2 | `generateCompatibilityData` | arbitrary aura color |
| P3 | `getLevelInfo` | integer N in [1, 200] |
| P4 | `incrementScanCount` | integer N in [0, 1000] |
| P5 | `MoodSelector` state | sequence of mood indices |
| P6 | `buildPrompt` | mood from MOODS array |
| P7 | `saveReading` | mood value (string or null) |
| P8 | `computeNewStreak` | date pairs (consecutive and non-consecutive) |
| P9 | `StreakBadge` | integer N in [1, 365] |
| P10 | `CosmicLoader` message cycling | index in [0, 4] |
| P11 | `ResultScreen` render | arbitrary aura result |
| P12 | `buildShareText` | arbitrary aura result |
| P13 | `HomeScreen` summary | non-empty readings array |
| P14 | `sortReadings` | array of readings with timestamps |
| P15 | `deleteReading` | readings array + target ID |
| P16 | `scanAura` with mock | first-call parse failure scenario |
| P17 | HomeScreen error state | error type from error type enum |

### Integration Tests

- End-to-end scan flow: pick image → scan → result saved to AsyncStorage
- History navigation: tap reading card → ResultScreen receives correct params
- Streak persistence: scan on day 1, simulate day 2, verify streak = 2
