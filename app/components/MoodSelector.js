/**
 * MoodSelector — 6 emoji mood buttons for pre-scan mood selection.
 * Feature: lumina-production-features, Requirement 3
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🥰', label: 'Loving' },
  { emoji: '🤔', label: 'Curious' },
];

/**
 * @param {{
 *   selectedMood: { emoji: string, label: string } | null,
 *   onSelect: (mood: { emoji: string, label: string } | null) => void
 * }} props
 *
 * Feature: lumina-production-features, Property 5: Mood selection is mutually exclusive
 */
export default function MoodSelector({ selectedMood, onSelect }) {
  function handlePress(mood) {
    // Tapping the already-selected mood deselects it
    if (selectedMood && selectedMood.emoji === mood.emoji) {
      onSelect(null);
    } else {
      onSelect(mood);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.grid}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood?.emoji === mood.emoji;
          return (
            <TouchableOpacity
              key={mood.emoji}
              style={[styles.btn, isSelected && styles.btnSelected]}
              onPress={() => handlePress(mood)}
              accessibilityLabel={`Mood: ${mood.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#c084fc',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  btn: {
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a855f730',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 64,
  },
  btnSelected: {
    backgroundColor: '#a855f730',
    borderColor: '#a855f7',
  },
  emoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  moodLabel: {
    color: '#ffffff60',
    fontSize: 10,
    fontWeight: '600',
  },
  moodLabelSelected: {
    color: '#c084fc',
  },
});
