/**
 * StreakBadge — displays the user's consecutive daily scan streak.
 * Feature: lumina-production-features, Requirement 4
 */

import { View, Text, StyleSheet } from 'react-native';
import { getStreakText } from '../lib/streak';

/**
 * @param {{ streak: number }} props
 * Returns null if streak <= 0.
 *
 * Feature: lumina-production-features, Property 9: Streak badge format is correct for all counts
 */
export default function StreakBadge({ streak }) {
  const text = getStreakText(streak);
  if (!text) return null;

  const isCosmic = streak >= 7;

  return (
    <View style={[styles.container, isCosmic && styles.containerCosmic]}>
      <Text style={[styles.text, isCosmic && styles.textCosmic]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff0a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'center',
    marginBottom: 10,
  },
  containerCosmic: {
    borderColor: '#f59e0b',
    backgroundColor: '#f59e0b15',
  },
  text: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textCosmic: {
    color: '#f59e0b',
  },
});
