/**
 * HistoryScreen — displays all past aura readings.
 * Features: tap-to-navigate (Req 9.1), colored left border (Req 9.2),
 *           newest-first sort (Req 9.3), streak header (Req 9.4),
 *           long-press delete (Req 9.5, 9.6)
 */

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen({ navigation }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  // Reload every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [])
  );

  async function loadReadings() {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('readings');
      const countStr = await AsyncStorage.getItem('scanCount');
      const streakStr = await AsyncStorage.getItem('streakCount');

      setScanCount(countStr ? parseInt(countStr, 10) : 0);
      setStreakCount(streakStr ? parseInt(streakStr, 10) : 0);

      if (data) {
        const parsed = JSON.parse(data);
        // Sort newest-first by timestamp, falling back to id (Req 9.3, Property 14)
        const sorted = [...parsed].sort((a, b) => {
          const tA = a.timestamp || parseInt(a.id, 10) || 0;
          const tB = b.timestamp || parseInt(b.id, 10) || 0;
          return tB - tA;
        });
        setReadings(sorted);
      } else {
        setReadings([]);
      }
    } catch (e) {
      console.error('loadReadings error:', e);
      Alert.alert('Error', 'Could not load reading history.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes a single reading by ID (Req 9.5, 9.6, Property 15)
   */
  async function deleteReading(id) {
    try {
      const data = await AsyncStorage.getItem('readings');
      const all = data ? JSON.parse(data) : [];
      const updated = all.filter((r) => r.id !== id);
      await AsyncStorage.setItem('readings', JSON.stringify(updated));
      // Re-sort after deletion
      const sorted = [...updated].sort((a, b) => {
        const tA = a.timestamp || parseInt(a.id, 10) || 0;
        const tB = b.timestamp || parseInt(b.id, 10) || 0;
        return tB - tA;
      });
      setReadings(sorted);
    } catch (e) {
      console.error('deleteReading error:', e);
      Alert.alert('Error', 'Could not delete reading.');
    }
  }

  function handleLongPress(reading) {
    Alert.alert(
      'Delete Reading',
      `Delete your ${reading.color} Aura reading from ${reading.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReading(reading.id),
        },
      ]
    );
  }

  async function clearHistory() {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all past readings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('readings');
              await AsyncStorage.removeItem('lastScanDate');
              setReadings([]);
            } catch (e) {
              console.error('clearHistory error:', e);
            }
          },
        },
      ]
    );
  }

  return (
    <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📜 Past Readings</Text>
        {readings.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <Text style={styles.loadingText}>Loading your cosmic history...</Text>
        )}

        {!loading && readings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌌</Text>
            <Text style={styles.empty}>No readings yet.</Text>
            <Text style={styles.emptySub}>Scan your aura to begin your cosmic journey!</Text>
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.scanNowText}>✨ Scan Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Streak header (Req 9.4) */}
        {!loading && readings.length > 0 && (
          <View style={styles.statsHeader}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scanCount}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakCount > 0 ? `🔥 ${streakCount}` : '—'}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{readings.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>
        )}

        {readings.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => navigation.navigate('Result', { result: r, imageUri: r.imageUri })}
            onLongPress={() => handleLongPress(r)}
            delayLongPress={500}
            activeOpacity={0.75}
          >
            {/* Card with colored left border (Req 9.2, Property 9) */}
            <View style={styles.cardWrapper}>
              <View style={[styles.leftBorder, { backgroundColor: r.hex || '#a855f7' }]} />
              <View style={[styles.card, { borderColor: (r.hex || '#a855f7') + '40' }]}>
                {/* Left: photo */}
                <View style={styles.cardLeft}>
                  {r.imageUri ? (
                    <Image
                      source={{ uri: r.imageUri }}
                      style={[styles.thumb, { borderColor: r.hex || '#a855f7' }]}
                    />
                  ) : (
                    <View style={[styles.thumbPlaceholder, { borderColor: r.hex || '#a855f7', backgroundColor: (r.hex || '#a855f7') + '30' }]}>
                      <Text style={styles.thumbEmoji}>🌟</Text>
                    </View>
                  )}
                </View>

                {/* Right: info */}
                <View style={styles.cardRight}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.dot, { backgroundColor: r.hex || '#a855f7' }]} />
                    <Text style={styles.cardColor}>{r.color} Aura</Text>
                    {r.mood && <Text style={styles.cardMood}>{r.mood}</Text>}
                  </View>
                  <Text style={styles.cardArchetype}>{r.archetype}</Text>
                  <Text style={[styles.cardScore, { color: r.hex || '#a855f7' }]}>
                    {r.vibe_score}/100
                  </Text>
                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <Text style={styles.cardDate}>📅 {r.date}</Text>
                </View>

                {/* Score bar */}
                <View style={styles.cardBarBg}>
                  <View
                    style={[
                      styles.cardBarFill,
                      { height: `${r.vibe_score}%`, backgroundColor: r.hex || '#a855f7' },
                    ]}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {readings.length > 0 && (
          <Text style={styles.longPressHint}>Long-press a reading to delete it</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  back: { color: '#a855f7', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  clearBtn: { color: '#ef4444', fontSize: 14 },

  content: { padding: 20, paddingBottom: 40 },

  loadingText: { color: '#a855f7', textAlign: 'center', marginTop: 50, fontSize: 15 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  empty: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#c084fc', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  scanNowBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scanNowText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Stats header (Req 9.4)
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff08',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#a855f730',
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { color: '#ffffff60', fontSize: 11, letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: '#ffffff20' },

  // Card with left border
  cardWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  leftBorder: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff08',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderLeftWidth: 0,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  cardLeft: { justifyContent: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
  thumbPlaceholder: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 28 },

  cardRight: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardColor: { color: '#fff', fontWeight: 'bold', fontSize: 15, flex: 1 },
  cardMood: { fontSize: 16 },
  cardArchetype: { color: '#c084fc', fontSize: 13, marginBottom: 4 },
  cardScore: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  cardTitle: { color: '#ffffff80', fontSize: 12, marginBottom: 4 },
  cardDate: { color: '#666', fontSize: 12 },

  cardBarBg: {
    width: 6,
    height: 64,
    backgroundColor: '#ffffff15',
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cardBarFill: { width: 6, borderRadius: 3 },

  longPressHint: {
    color: '#ffffff30',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
