/**
 * Canonical aura type → hex color mapping.
 * Used by CompatibilityChart, PulsingRing, and CosmicLoader.
 */
export const AURA_TYPES = {
  'Deep Violet':   '#7c3aed',
  'Golden Yellow': '#f59e0b',
  'Ocean Blue':    '#3b82f6',
  'Rose Pink':     '#ec4899',
  'Emerald Green': '#10b981',
  'Crimson Red':   '#ef4444',
  'Silver White':  '#e2e8f0',
  'Amber Orange':  '#f97316',
  'Teal Cyan':     '#06b6d4',
  'Indigo':        '#6366f1',
};

/**
 * Ordered palette used for cycling animations (CosmicLoader, PulsingRing).
 */
export const AURA_COLORS = [
  '#7c3aed',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#ef4444',
  '#06b6d4',
];

/**
 * Returns a random color from AURA_COLORS.
 */
export function randomAuraColor() {
  return AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)];
}

/**
 * Given an aura color name (possibly partial/fuzzy), returns the best-matching
 * canonical hex. Falls back to '#a855f7' if no match found.
 */
export function getHexForAuraType(colorName) {
  if (!colorName) return '#a855f7';
  // Exact match
  if (AURA_TYPES[colorName]) return AURA_TYPES[colorName];
  // Partial match (case-insensitive)
  const lower = colorName.toLowerCase();
  for (const [name, hex] of Object.entries(AURA_TYPES)) {
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      return hex;
    }
  }
  return '#a855f7';
}

/**
 * Generates compatibility data for the CompatibilityChart.
 * The user's own aura type is always first with percent >= 90.
 * Four other types are randomly selected with percents 20–85.
 *
 * @param {string} ownColorName - The user's aura color name
 * @param {string} ownHex - The user's aura hex color
 * @returns {Array<{name: string, hex: string, percent: number}>}
 */
export function generateCompatibilityData(ownColorName, ownHex) {
  const ownPercent = Math.floor(Math.random() * 11) + 90; // 90–100

  // Pick 4 other types (excluding own)
  const otherTypes = Object.entries(AURA_TYPES).filter(
    ([name]) => name !== ownColorName
  );

  // Shuffle and take 4
  const shuffled = otherTypes.sort(() => Math.random() - 0.5).slice(0, 4);

  // Assign random percents 20–85, ensuring they are distinct-ish
  const usedPercents = new Set([ownPercent]);
  const others = shuffled.map(([name, hex]) => {
    let percent;
    let attempts = 0;
    do {
      percent = Math.floor(Math.random() * 66) + 20; // 20–85
      attempts++;
    } while (usedPercents.has(percent) && attempts < 20);
    usedPercents.add(percent);
    return { name, hex, percent };
  });

  // Sort others descending
  others.sort((a, b) => b.percent - a.percent);

  return [
    { name: ownColorName, hex: ownHex || getHexForAuraType(ownColorName), percent: ownPercent },
    ...others,
  ];
}
