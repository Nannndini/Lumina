# Tasks

## Task List

- [x] 1. Create shared constants and utility libraries
  - [x] 1.1 Create `app/lib/auraTypes.js` with AURA_TYPES map and AURA_COLORS palette
  - [x] 1.2 Create `app/lib/evolution.js` with getLevelInfo pure function
  - [x] 1.3 Create `app/lib/streak.js` with computeNewStreak pure function
  - [x] 1.4 Update `app/lib/groq.js` with mood injection, retry logic, timeout, and typed errors

- [x] 2. Build CompatibilityChart component (Req 1)
  - [x] 2.1 Create `app/components/CompatibilityChart.js` with generateCompatibilityData and animated bars

- [x] 3. Build EvolutionBadge component (Req 2)
  - [x] 3.1 Create `app/components/EvolutionBadge.js` with level display and progress bar

- [x] 4. Build MoodSelector component (Req 3)
  - [x] 4.1 Create `app/components/MoodSelector.js` with 6 mood buttons and selection state

- [x] 5. Build StreakBadge component (Req 4)
  - [x] 5.1 Create `app/components/StreakBadge.js` with conditional format logic

- [x] 6. Build PulsingRing component (Req 5)
  - [x] 6.1 Create `app/components/PulsingRing.js` with web CSS and native Animated implementations

- [x] 7. Build CosmicLoader component (Req 6)
  - [x] 7.1 Create `app/components/CosmicLoader.js` with rotating animation, cycling text, and timeout message

- [x] 8. Update ResultScreen (Req 1, 7)
  - [x] 8.1 Add CompatibilityChart below compatibility text section
  - [x] 8.2 Add white border, watermark, date/time, max-width 500px, and rich clipboard copy to AuraCard
  - [x] 8.3 Display mood indicator "Scanned while feeling [emoji]" when result has mood field

- [x] 9. Update HomeScreen (Req 2, 3, 4, 5, 6, 8)
  - [x] 9.1 Add useFocusEffect to reload scanCount, streakCount, and last reading on focus
  - [x] 9.2 Integrate EvolutionBadge and StreakBadge into both normal and daily-lock states
  - [x] 9.3 Integrate MoodSelector below photo picker when image is selected
  - [x] 9.4 Replace photo preview with PulsingRing wrapper
  - [x] 9.5 Replace ActivityIndicator loading with CosmicLoader overlay; track elapsed time
  - [x] 9.6 Add welcome back greeting, last reading summary, animated gradient title, ambient glow
  - [x] 9.7 Update star spawning to 50 stars with 3 size tiers and 3 animation durations
  - [x] 9.8 Wire mood into scanAura call; update streak and scanCount on successful scan
  - [x] 9.9 Add error state with friendly messages and retry/dismiss button

- [x] 10. Update HistoryScreen (Req 9)
  - [x] 10.1 Add tap-to-navigate: tapping a reading card navigates to ResultScreen with reading data
  - [x] 10.2 Add colored left-border accent to each reading card using reading's hex color
  - [x] 10.3 Sort readings by timestamp descending (newest first) before rendering
  - [x] 10.4 Add streak header showing total scan count and current streak
  - [x] 10.5 Add long-press delete with confirmation dialog for individual readings
