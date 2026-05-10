import { useState, useEffect, useCallback } from 'react';
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
      if (data) {
        setReadings(JSON.parse(data));
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

        {readings.map((r) => (
          <View key={r.id} style={[styles.card, { borderColor: r.hex || '#a855f7' }]}>
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
        ))}
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

  card: {
    backgroundColor: '#ffffff08',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
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
  cardColor: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
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
});
