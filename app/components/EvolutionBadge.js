/**
 * EvolutionBadge — displays the user's current aura evolution level and progress.
 * Feature: lumina-production-features, Requirement 2
 */

import { View, Text, StyleSheet } from 'react-native';
import { getLevelInfo } from '../lib/evolution';

/**
 * @param {{ scanCount: number }} props
 *
 * Feature: lumina-production-features, Property 3: Level mapping is total and correct
 */
export default function EvolutionBadge({ scanCount }) {
  const level = getLevelInfo(scanCount || 0);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{level.emoji}</Text>
        <Text style={styles.name}>{level.name}</Text>
        {!level.isMax && (
          <Text style={styles.count}>{scanCount || 0} scans</Text>
        )}
        {level.isMax && (
          <Text style={styles.maxBadge}>✨ MAX</Text>
        )}
      </View>
      {!level.isMax && (
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(level.progress * 100)}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a855f730',
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  name: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  count: {
    color: '#ffffff50',
    fontSize: 11,
  },
  maxBadge: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#ffffff15',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#a855f7',
    borderRadius: 2,
  },
});
