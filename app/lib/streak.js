/**
 * Aura Streak Tracker — pure streak computation helpers.
 * Feature: lumina-production-features, Requirement 4
 */

/**
 * Computes the new streak count given the last streak date and the current date.
 *
 * Rules:
 *  - If lastStreakDate is null/undefined → return 1 (first scan ever)
 *  - If currentDateString === lastStreakDate → return currentStreak (same day, no change)
 *  - If currentDateString is exactly 1 calendar day after lastStreakDate → return currentStreak + 1
 *  - Otherwise → return 1 (streak broken)
 *
 * @param {string|null} lastStreakDate - Date string from Date.toDateString() of last scan
 * @param {string} currentDateString  - Date string from Date.toDateString() of current scan
 * @param {number} currentStreak      - Current streak count (>= 0)
 * @returns {number} New streak count
 *
 * Feature: lumina-production-features, Property 8: Streak logic is correct for all date pairs
 */
export function computeNewStreak(lastStreakDate, currentDateString, currentStreak) {
  if (!lastStreakDate) return 1;

  const last = new Date(lastStreakDate);
  const current = new Date(currentDateString);

  // Normalize to midnight to compare calendar days only
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return currentStreak;       // same day
  if (diffDays === 1) return currentStreak + 1;   // consecutive day
  return 1;                                        // streak broken
}

/**
 * Returns the streak badge text for a given streak count.
 *
 * @param {number} streak
 * @returns {string|null} Badge text, or null if streak <= 0
 *
 * Feature: lumina-production-features, Property 9: Streak badge format is correct for all counts
 */
export function getStreakText(streak) {
  if (!streak || streak <= 0) return null;
  if (streak >= 7) return `🌟 Cosmic Streak — ${streak} days!`;
  return `🔥 ${streak} day streak`;
}
