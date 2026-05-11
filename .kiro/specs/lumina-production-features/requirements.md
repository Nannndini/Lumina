# Requirements Document

## Introduction

This document defines requirements for 10 production-ready features to be added to the Lumina React Native Expo aura-scanning app. Lumina uses the Groq vision API to generate mystical aura readings from user photos. The 10 features span visual polish, gamification, mood-aware scanning, error resilience, and sharing improvements — all implemented using the existing stack (React Native Animated, AsyncStorage, Platform, CSS injection on web) with no new dependencies.

## Glossary

- **App**: The Lumina React Native Expo aura-scanning application.
- **AuraCard**: The styled result card displayed on ResultScreen containing the full aura reading.
- **CompatibilityChart**: The visual bar chart showing compatibility percentages with 5 aura types.
- **CosmicLoader**: The full-screen animated overlay displayed during the Groq API scan.
- **EvolutionSystem**: The scan-count-based leveling system that tracks user progression.
- **EvolutionBadge**: The UI badge on HomeScreen showing the user's current evolution level and progress.
- **GroqAPI**: The Groq llama-4-scout-17b-16e-instruct vision API used to generate aura readings.
- **HistoryScreen**: The screen displaying all past aura readings stored in AsyncStorage.
- **HomeScreen**: The main screen where users upload photos and initiate scans.
- **MoodSelector**: The pre-scan UI component presenting 6 emoji mood buttons.
- **PulsingRing**: The animated gradient ring displayed around the selected photo on HomeScreen.
- **ResultScreen**: The screen displaying the full aura reading result after a scan.
- **Reading**: A single aura scan result object stored in AsyncStorage under the key `readings`.
- **Streak**: The count of consecutive calendar days on which the user has completed at least one scan.
- **StreakBadge**: The UI element on HomeScreen displaying the current streak count.
- **AsyncStorage**: The persistent key-value storage used by the App for readings, scan dates, and scan counts.

---

## Requirements

### Requirement 1: Aura Compatibility Chart

**User Story:** As a user, I want to see a visual compatibility chart after my aura reading, so that I can understand which aura types resonate most with my energy.

#### Acceptance Criteria

1. WHEN a ResultScreen is displayed with a valid aura result, THE CompatibilityChart SHALL render below the compatibility text section.
2. THE CompatibilityChart SHALL display exactly 5 aura type rows, each containing the aura type name, a percentage value, and a filled bar.
3. THE CompatibilityChart SHALL color each bar using the canonical hex color associated with that aura type.
4. WHEN the ResultScreen mounts, THE CompatibilityChart SHALL animate each bar from 0% width to its target percentage width over a duration of 1000ms with a staggered delay of 150ms per bar.
5. THE CompatibilityChart SHALL display percentage values between 0 and 100 inclusive for each aura type.
6. THE CompatibilityChart SHALL include the user's own aura type as the highest-compatibility entry (≥ 90%).

---

### Requirement 2: Aura Evolution System

**User Story:** As a user, I want to track my scanning history and earn evolution levels, so that I feel rewarded for returning to the App regularly.

#### Acceptance Criteria

1. WHEN a scan completes successfully, THE EvolutionSystem SHALL increment the total scan count stored in AsyncStorage under the key `scanCount`.
2. THE EvolutionSystem SHALL map scan counts to levels as follows: count 1–4 → "Aura Awakening", count 5–9 → "Aura Adept", count 10–24 → "Aura Master", count ≥ 25 → "Cosmic Oracle".
3. WHEN HomeScreen mounts or gains focus, THE EvolutionBadge SHALL display the user's current level name and a progress bar showing scans completed toward the next level threshold.
4. WHEN the user has reached "Cosmic Oracle" (count ≥ 25), THE EvolutionBadge SHALL display the level name without a progress bar.
5. THE EvolutionBadge SHALL be visible on HomeScreen in both the normal scan state and the daily-lock state.

---

### Requirement 3: Mood-Based Scan

**User Story:** As a user, I want to indicate my current mood before scanning, so that my aura reading reflects how I am feeling right now.

#### Acceptance Criteria

1. WHEN a user has selected a photo and has not yet initiated a scan, THE MoodSelector SHALL be displayed on HomeScreen showing 6 mood buttons: 😊 😔 😤 😰 🥰 🤔.
2. WHEN a user taps a mood button, THE MoodSelector SHALL visually highlight the selected mood and deselect any previously selected mood.
3. WHEN a scan is initiated with a mood selected, THE App SHALL include the selected mood emoji and its label in the Groq prompt so the aura reading is influenced by the user's current mood.
4. WHEN a scan is initiated without a mood selected, THE App SHALL proceed with the standard Groq prompt without mood context.
5. WHEN a ResultScreen is displayed for a reading that included a mood, THE AuraCard SHALL show the mood indicator text in the format "Scanned while feeling [emoji]".
6. WHEN a mood-tagged reading is saved to AsyncStorage, THE Reading SHALL include a `mood` field containing the selected mood emoji.

---

### Requirement 4: Aura Streak Tracker

**User Story:** As a user, I want to see my consecutive daily scan streak, so that I am motivated to scan every day.

#### Acceptance Criteria

1. WHEN a scan completes successfully on a new calendar day, THE App SHALL update the streak count in AsyncStorage by incrementing it if the previous scan was on the immediately preceding calendar day, or resetting it to 1 otherwise.
2. WHEN HomeScreen mounts or gains focus, THE StreakBadge SHALL display the current streak count in the format "🔥 [N] day streak".
3. WHEN the streak count is 7 or greater, THE StreakBadge SHALL display "🌟 Cosmic Streak — [N] days!" instead of the standard format.
4. WHEN the streak count is 0 or no streak data exists, THE StreakBadge SHALL not be displayed on HomeScreen.
5. THE StreakBadge SHALL be visible on HomeScreen in both the normal scan state and the daily-lock state.

---

### Requirement 5: Animated Aura Ring on HomeScreen

**User Story:** As a user, I want to see a magical animated ring around my selected photo, so that the scan feels immersive and exciting before results appear.

#### Acceptance Criteria

1. WHEN a user selects a photo on HomeScreen, THE PulsingRing SHALL appear around the photo preview circle.
2. THE PulsingRing SHALL animate with a continuous pulse (scale oscillation) and a rotating gradient border using a randomly selected aura color.
3. WHEN no photo is selected, THE PulsingRing SHALL not be visible.
4. WHEN a new photo is selected, THE PulsingRing SHALL restart its animation with a newly randomized aura color.
5. THE PulsingRing SHALL use CSS keyframe animations on web and React Native Animated on native platforms.

---

### Requirement 6: Cosmic Loading Screen

**User Story:** As a user, I want to see an immersive cosmic animation while my aura is being scanned, so that the wait feels magical rather than empty.

#### Acceptance Criteria

1. WHEN a scan is in progress (loading state is true), THE CosmicLoader SHALL render as a full-screen overlay above all other HomeScreen content.
2. THE CosmicLoader SHALL display a rotating circular animation using aura colors that cycle through a predefined palette.
3. THE CosmicLoader SHALL cycle through the following text messages every 2000ms in order: "Reading your energy field...", "Scanning your aura frequency...", "Consulting the cosmos...", "Decoding your spiritual signature...", "Almost ready...".
4. THE CosmicLoader SHALL cycle background accent colors through a predefined aura color palette during the loading state.
5. WHEN the loading state ends, THE CosmicLoader SHALL be removed from the display.
6. WHEN a scan has been in progress for more than 15000ms, THE CosmicLoader SHALL display the additional message "Taking longer than usual..." below the cycling text.

---

### Requirement 7: Polished Shareable Result Card

**User Story:** As a user, I want my result card to look polished and shareable, so that I can screenshot and share my aura reading on social media.

#### Acceptance Criteria

1. THE AuraCard SHALL be visually bounded by a white border (1–2px, semi-transparent) to define it as a distinct shareable region.
2. THE AuraCard SHALL display a watermark text "✨ Lumina — AI Aura Reading" at the bottom of the card.
3. THE AuraCard SHALL display the date and time of the reading in a human-readable format below the watermark.
4. THE AuraCard SHALL have a maximum width of 500px and be horizontally centered on screens wider than 500px.
5. WHEN the user taps the "Copy Link" button, THE App SHALL copy a rich text summary to the clipboard containing the aura color, archetype, vibe score, and a Lumina attribution line.
6. THE AuraCard SHALL maintain its visual polish at all common mobile screen widths (320px–428px) and on web at widths up to 1200px.

---

### Requirement 8: HomeScreen Polish

**User Story:** As a user, I want the HomeScreen to feel personalized and visually stunning, so that opening the App is a delightful experience.

#### Acceptance Criteria

1. WHEN the user has at least one saved reading, THE HomeScreen SHALL display a "Welcome back" greeting above the app title.
2. WHEN the user has at least one saved reading, THE HomeScreen SHALL display a "Last reading: [color] Aura — [archetype]" summary line below the greeting.
3. THE HomeScreen SHALL render the app title "✨ Lumina" with an animated gradient shimmer cycling from purple to pink.
4. WHEN the user has at least one saved reading, THE HomeScreen SHALL apply a subtle ambient background glow using the hex color of the most recent reading.
5. THE HomeScreen SHALL spawn 50 floating star particles (up from 30) on web, with sizes varying across at least 3 distinct size tiers.
6. THE HomeScreen star particles SHALL include at least 3 distinct animation durations to create visual depth.

---

### Requirement 9: History Screen Polish

**User Story:** As a user, I want my history screen to be interactive and informative, so that I can easily review and manage my past readings.

#### Acceptance Criteria

1. WHEN a user taps a reading card on HistoryScreen, THE App SHALL navigate to ResultScreen passing the saved reading data and imageUri as route params.
2. THE HistoryScreen SHALL display each reading card with a colored left-border accent using the reading's hex color.
3. THE HistoryScreen SHALL display readings sorted by date with the most recent reading first.
4. THE HistoryScreen SHALL display the total scan count and current streak at the top of the reading list.
5. WHEN a user long-presses a reading card, THE App SHALL present a confirmation dialog offering to delete that individual reading.
6. WHEN a reading is deleted via long-press, THE App SHALL remove only that reading from AsyncStorage and refresh the displayed list.

---

### Requirement 10: Error Handling

**User Story:** As a user, I want clear and friendly error messages when something goes wrong, so that I understand what happened and know what to do next.

#### Acceptance Criteria

1. WHEN the Groq API returns a non-2xx HTTP status, THE App SHALL display the message "The cosmos are busy right now. Try again in a moment." to the user.
2. WHEN a network request fails due to no internet connectivity, THE App SHALL display an offline message: "You appear to be offline. Check your connection and try again."
3. WHEN JSON parsing of the Groq API response fails on the first attempt, THE App SHALL automatically retry the scan request once before displaying an error to the user.
4. WHEN the automatic retry also fails to produce valid JSON, THE App SHALL display the message "Could not read your aura. Please try again." to the user.
5. WHEN a scan has been in progress for more than 15000ms without a response, THE CosmicLoader SHALL display the supplemental message "Taking longer than usual..." (satisfies Requirement 6.6).
6. IF an error message is displayed, THEN THE App SHALL provide a visible action to dismiss the error or retry the scan.
