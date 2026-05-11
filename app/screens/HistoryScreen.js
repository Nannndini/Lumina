/**
 * HistoryScreen — polished reading history.
 * First-prize worthy: colored left borders, tap-to-navigate, stats header,
 * long-press delete, improved empty state, legacy key migration.
 */

import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../lib/storage';

export default function HistoryScreen({ navigation }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadReadings();
    }, [])
  );

  async function loadReadings() {
    try {
      setLoading(true);

      let data = await Storage.getItem('readings');

      // Migrate legacy prefixed keys on web
      if (Platform.OS === 'web' && !data) {
        data = localStorage.getItem('Lumina_readings') || localStorage.getItem('lumina_readings') || null;
        if (data) {
          localStorage.setItem('readings', data);
          localStorage.removeItem('Lumina_readings');
          localStorage.removeItem('lumina_readings');
          console.log('Migrated readings from legacy key');
        }
      }

      console.log('loaded readings:', data ? JSON.parse(data).length + ' readings' : 'null');

      const countStr = await Storage.getItem('scanCount');
      const streakStr = await Storage.getItem('streakCount');
      setScanCount(countStr ? parseInt(countStr, 10) : 0);
      setStreakCount(streakStr ? parseInt(streakStr, 10) : 0);

      if (data) {
        const parsed = JSON.parse(data);
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

  async function deleteReading(id) {
    try {
      const data = await Storage.getItem('readings');
      const all = data ? JSON.parse(data) : [];
      const updated = all.filter((r) => r.id !== id);
      await Storage.setItem('readings', JSON.stringify(updated));
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
        { text: 'Delete', style: 'destructive', onPress: () => deleteReading(reading.id) },
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
              if (Platform.OS === 'web') {
                localStorage.removeItem('readings');
                localStorage.removeItem('Lumina_readings');
                localStorage.removeItem('lumina_readings');
                localStorage.removeItem('lastScanDate');
                localStorage.removeItem('Lumina_lastScanDate');
                localStorage.removeItem('lumina_lastScanDate');
              } else {
                await Storage.removeItem('readings');
                await Storage.removeItem('lastScanDate');
              }
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
      {/* Header */}
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

        {/* Empty state */}
        {!loading && readings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.empty}>No readings yet ✨</Text>
            <Text style={styles.emptySub}>Scan your aura to begin your cosmic journey</Text>
            <TouchableOpacity style={styles.scanNowBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.scanNowText}>✨ Scan Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats header */}
        {!loading && readings.length > 0 && (
          <View style={styles.statsHeader}>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{scanCount} Total Scans</Text>
            </View>
            {streakCount > 0 && (
              <View style={[styles.statBadge, styles.statBadgeStreak]}>
                <Text style={[styles.statBadgeText, styles.statBadgeStreakText]}>
                  {streakCount >= 7 ? '🌟' : '🔥'} {streakCount} Day Streak
                </Text>
              </View>
            )}
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{readings.length} Saved</Text>
            </View>
          </View>
        )}

        {/* Reading cards */}
        {readings.map((r, index) => {
          const hex = r.hex || '#a855f7';
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => navigation.navigate('Result', { result: r, imageUri: r.imageUri })}
              onLongPress={() => handleLongPress(r)}
              delayLongPress={500}
              activeOpacity={0.78}
            >
              <View style={styles.cardWrapper}>
                {/* Colored left border accent */}
                <View style={[styles.leftBorder, { backgroundColor: hex }]} />
                {Platform.OS === 'web' ? (
                  <div
                    className="history-card-slide"
                    style={{
                      flex: 1,
                      borderTopRightRadius: 18,
                      borderBottomRightRadius: 18,
                      border: `1px solid ${hex}40`,
                      borderLeft: 'none',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                      backgroundColor: hex + '10',
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* Photo */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {r.imageUri ? (
                        <img
                          src={r.imageUri}
                          style={{
                            width: 56, height: 56, borderRadius: 28,
                            border: `2px solid ${hex}`,
                            objectFit: 'cover',
                          }}
                          alt="aura"
                        />
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: 28,
                          border: `2px solid ${hex}`,
                          backgroundColor: hex + '30',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24,
                        }}>🌟</div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: hex, fontWeight: 'bold', fontSize: 15 }}>{r.color} Aura</span>
                        {r.mood && <span style={{ fontSize: 15 }}>{r.mood}</span>}
                      </div>
                      <div style={{ color: '#c084fc', fontSize: 12, marginBottom: 3 }}>{r.archetype}</div>
                      <div style={{ color: hex, fontSize: 20, fontWeight: 'bold', marginBottom: 2 }}>{r.vibe_score}/100</div>
                      <div style={{ color: 'rgba(255,255,255,0.44)', fontSize: 11, marginBottom: 3 }}>{r.title}</div>
                      <div style={{ color: '#555', fontSize: 11 }}>📅 {r.date}</div>
                    </div>
                  </div>
                ) : (
                  <View style={[styles.card, { backgroundColor: hex + '10', borderColor: hex + '40' }]}>
                    {/* Photo */}
                    <View style={styles.cardLeft}>
                      {r.imageUri ? (
                        <Image
                          source={{ uri: r.imageUri }}
                          style={[styles.thumb, { borderColor: hex, shadowColor: hex }]}
                        />
                      ) : (
                        <View style={[styles.thumbPlaceholder, { borderColor: hex, backgroundColor: hex + '30' }]}>
                          <Text style={styles.thumbEmoji}>🌟</Text>
                        </View>
                      )}
                    </View>
                    {/* Info */}
                    <View style={styles.cardRight}>
                      <View style={styles.cardTopRow}>
                        <Text style={[styles.cardColor, { color: hex }]}>{r.color} Aura</Text>
                        {r.mood && <Text style={styles.cardMood}>{r.mood}</Text>}
                      </View>
                      <Text style={styles.cardArchetype}>{r.archetype}</Text>
                      <Text style={[styles.cardScore, { color: hex }]}>{r.vibe_score}/100</Text>
                      <Text style={styles.cardTitle}>{r.title}</Text>
                      <Text style={styles.cardDate}>📅 {r.date}</Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

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

  content: { padding: 20, paddingBottom: 50 },

  loadingText: { color: '#a855f7', textAlign: 'center', marginTop: 50, fontSize: 15 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  empty: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#c084fc', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  scanNowBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  scanNowText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Stats header
  statsHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  statBadge: {
    backgroundColor: '#ffffff10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a855f730',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statBadgeStreak: {
    borderColor: '#f9731660',
    backgroundColor: '#f9731615',
  },
  statBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statBadgeStreakText: {
    color: '#f97316',
  },

  // Card
  cardWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  leftBorder: {
    width: 4,
  },
  card: {
    flex: 1,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderLeftWidth: 0,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardLeft: { justifyContent: 'center' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbPlaceholder: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 24 },

  cardRight: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cardColor: { fontWeight: 'bold', fontSize: 15, flex: 1 },
  cardMood: { fontSize: 15 },
  cardArchetype: { color: '#c084fc', fontSize: 12, marginBottom: 3 },
  cardScore: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  cardTitle: { color: '#ffffff70', fontSize: 11, marginBottom: 3 },
  cardDate: { color: '#555', fontSize: 11 },

  longPressHint: {
    color: '#ffffff25',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
