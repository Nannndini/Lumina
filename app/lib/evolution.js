/**
 * Aura Evolution System — level definitions and pure helper functions.
 * Feature: lumina-production-features, Requirement 2
 */

export const LEVELS = [
  { name: 'Aura Awakening', min: 1,  max: 4,        emoji: '🌱' },
  { name: 'Aura Adept',     min: 5,  max: 9,        emoji: '⚡' },
  { name: 'Aura Master',    min: 10, max: 24,       emoji: '🔮' },
  { name: 'Cosmic Oracle',  min: 25, max: Infinity, emoji: '🌌' },
];

/**
 * Returns level info for a given scan count.
 *
 * @param {number} scanCount - Total number of completed scans (>= 0)
 * @returns {{ name: string, emoji: string, progress: number, isMax: boolean, min: number, max: number }}
 *
 * Feature: lumina-production-features, Property 3: Level mapping is total and correct
 */
export function getLevelInfo(scanCount) {
  const count = Math.max(0, Math.floor(scanCount));

  for (const level of LEVELS) {
    if (count >= level.min && (level.max === Infinity || count <= level.max)) {
      const isMax = level.max === Infinity;
      let progress = 0;
      if (!isMax) {
        // progress within this level: 0.0 at min, 1.0 at max+1
        const range = level.max - level.min + 1;
        progress = Math.min(1, Math.max(0, (count - level.min) / range));
      }
      return {
        name: level.name,
        emoji: level.emoji,
        progress,
        isMax,
        min: level.min,
        max: level.max,
      };
    }
  }

  // count === 0: return first level with 0 progress
  return {
    name: LEVELS[0].name,
    emoji: LEVELS[0].emoji,
    progress: 0,
    isMax: false,
    min: LEVELS[0].min,
    max: LEVELS[0].max,
  };
}
