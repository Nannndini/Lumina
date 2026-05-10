# Bugfix Requirements Document

## Introduction

Two bugs affect the Lumina aura-scanning app's ResultScreen:

1. **Photo Glow Ring** — The circular photo frame on ResultScreen renders without a visible colored glow. The `imageRing` container is missing a `boxShadow` CSS property (web) and the native shadow properties are insufficient to produce the intended colored halo effect.

2. **History Not Saving** — Aura readings scanned on ResultScreen do not appear in HistoryScreen. The `saveReading()` function in ResultScreen fails silently, so no readings are persisted to AsyncStorage. HistoryScreen's `loadReadings()` also lacks diagnostic logging to confirm whether data is present.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user views their aura result on ResultScreen THEN the system displays the circular photo without any visible colored glow ring around it

1.2 WHEN a user completes an aura scan and ResultScreen mounts THEN the system calls `saveReading()` but the reading is not persisted to AsyncStorage (fails silently with no console output on success)

1.3 WHEN a user navigates to HistoryScreen after scanning THEN the system shows an empty history list even though a reading was just completed

1.4 WHEN HistoryScreen loads readings from AsyncStorage THEN the system does not log the loaded data, making it impossible to diagnose storage issues

### Expected Behavior (Correct)

2.1 WHEN a user views their aura result on ResultScreen THEN the system SHALL display the circular photo with a visible colored glow ring using `boxShadow: 0 0 30px 10px ${result.hex}60` on the `imageRing` container, along with `borderColor: result.hex` and `borderWidth: 3`

2.2 WHEN a user completes an aura scan and ResultScreen mounts THEN the system SHALL successfully stringify and store the reading object in AsyncStorage under the key `'readings'` and SHALL log a confirmation message via `console.log` after saving

2.3 WHEN a user navigates to HistoryScreen after scanning THEN the system SHALL display the most recently saved reading at the top of the history list

2.4 WHEN HistoryScreen loads readings from AsyncStorage THEN the system SHALL log the raw loaded data via `console.log('loaded readings:', data)` to aid in diagnosing any storage issues

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user views ResultScreen with a valid result THEN the system SHALL CONTINUE TO display all aura data (color, archetype, vibe score, strengths, shadow side, compatibility)

3.2 WHEN a user has existing readings in history THEN the system SHALL CONTINUE TO display them in reverse-chronological order on HistoryScreen

3.3 WHEN a user taps "Clear" on HistoryScreen THEN the system SHALL CONTINUE TO remove all readings from AsyncStorage and update the UI to show the empty state

3.4 WHEN a user navigates back from ResultScreen without triggering a new scan THEN the system SHALL CONTINUE TO preserve all previously saved readings in AsyncStorage

3.5 WHEN the readings list already contains 10 entries THEN the system SHALL CONTINUE TO cap the stored list at 10 items (oldest entry dropped)

3.6 WHEN ResultScreen re-renders (e.g. due to state change) THEN the system SHALL CONTINUE TO avoid saving duplicate readings by checking the `_saveId` guard

---

## Bug Condition Pseudocode

### Bug 1 — Photo Glow Ring

```pascal
FUNCTION isBugCondition_GlowRing(screen)
  INPUT: screen of type ResultScreen render output
  OUTPUT: boolean

  RETURN imageRing.style does NOT contain boxShadow property
END FUNCTION

// Property: Fix Checking
FOR ALL screen WHERE isBugCondition_GlowRing(screen) DO
  ring ← screen.imageRing
  ASSERT ring.style.boxShadow = "0 0 30px 10px ${result.hex}60"
  ASSERT ring.style.borderColor = result.hex
  ASSERT ring.style.borderWidth = 3
END FOR

// Property: Preservation Checking
FOR ALL screen WHERE NOT isBugCondition_GlowRing(screen) DO
  ASSERT F(screen.imageRing) = F'(screen.imageRing)
END FOR
```

### Bug 2 — History Not Saving

```pascal
FUNCTION isBugCondition_HistorySave(call)
  INPUT: call of type saveReading() invocation
  OUTPUT: boolean

  RETURN AsyncStorage does NOT contain key 'readings' after saveReading() completes
END FUNCTION

// Property: Fix Checking
FOR ALL call WHERE isBugCondition_HistorySave(call) DO
  result ← saveReading'(call)
  stored ← AsyncStorage.getItem('readings')
  ASSERT stored IS NOT NULL
  ASSERT JSON.parse(stored)[0].id = call.saveId
  ASSERT console.log was called with confirmation message
END FOR

// Property: Preservation Checking
FOR ALL call WHERE NOT isBugCondition_HistorySave(call) DO
  ASSERT F(AsyncStorage state) = F'(AsyncStorage state)
END FOR
```
