/**
 * CompatibilityChart — displays 5 aura type compatibility bars with staggered animation.
 * Feature: lumina-production-features, Requirement 1
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { generateCompatibilityData } from '../lib/auraTypes';

/**
 * @param {{ auraColor: string, auraHex: string }} props
 *
 * Feature: lumina-production-features, Property 1: Compatibility chart always has exactly 5 entries with valid percentages
 * Feature: lumina-production-features, Property 2: Compatibility bar colors match canonical aura hex
 */
export default function CompatibilityChart({ auraColor, auraHex }) {
  const data = generateCompatibilityData(auraColor, auraHex);
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered animation: 150ms delay per bar, 1000ms duration
    const animations = animValues.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: i * 150,
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💫 Compatibility Chart</Text>
      {data.map((entry, i) => {
        const barWidth = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${entry.percent}%`],
        });
        return (
          <View key={entry.name} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.name}>{entry.name}</Text>
              <Text style={[styles.percent, { color: entry.hex }]}>{entry.percent}%</Text>
            </View>
            <View style={styles.barBg}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    width: barWidth,
                    backgroundColor: entry.hex,
                    shadowColor: entry.hex,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    color: '#ffffff80',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  percent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#ffffff15',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
});
