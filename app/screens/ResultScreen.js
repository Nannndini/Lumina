/**
 * ResultScreen — displays the full aura reading result.
 * Features: CompatibilityChart (Req 1), Polished AuraCard (Req 7), Mood indicator (Req 3)
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import CompatibilityChart from '../components/CompatibilityChart';
import { Storage } from '../lib/storage';

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params || {};
  const [copied, setCopied] = useState(false);
  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // Fallback if result is missing
  if (!result) {
    return (
      <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No aura data found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const hex = result.hex || '#a855f7';
  const hexLight = hex + '40';
  const hexMid = hex + '80';

  // Human-readable date/time for the card
  const readingDateTime = result.timestamp
    ? new Date(result.timestamp).toLocaleString()
    : result.date || new Date().toLocaleDateString();

  useEffect(() => {
    saveReading();
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    // Progress bar animation
    Animated.timing(barAnim, {
      toValue: result.vibe_score / 100,
      duration: 1200,
      delay: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  async function saveReading() {
    try {
      // If result already has an id, it was saved in HomeScreen before navigation — skip duplicate save
      if (result.id) {
        console.log('saveReading: reading already saved with id', result.id, '— skipping duplicate');
        return;
      }
      const existing = await Storage.getItem('readings');
      const readings = existing ? JSON.parse(existing) : [];
      // Avoid duplicate saves on re-render
      if (readings[0]?.id === result._saveId) return;
      const saveId = Date.now().toString();
      const newReading = {
        ...result,
        _saveId: saveId,
        imageUri,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        id: saveId,
      };
      console.log('Saving reading:', newReading);
      readings.unshift(newReading);
      const serialized = JSON.stringify(readings.slice(0, 50));
      await Storage.setItem('readings', serialized);
      // Verify the save succeeded (debug)
      const saved = await Storage.getItem('readings');
      console.log('SAVED READINGS:', saved ? JSON.parse(saved).length + ' readings' : 'null');
      console.log('saveReading: saved reading id', saveId, '— total stored:', readings.slice(0, 50).length);
    } catch (e) {
      console.error('saveReading error:', e);
    }
  }

  /**
   * Builds the rich clipboard share text.
   * Feature: lumina-production-features, Property 12: Clipboard copy contains required fields
   */
  function buildShareText() {
    return `✨ My Lumina Aura Reading ✨\n\nAura Color: ${result.color}\nArchetype: ${result.archetype}\nVibe Score: ${result.vibe_score}/100\nEnergy: ${result.energy}\n\n"${result.title}"\n\n${result.breakdown}\n\n— Scanned with Lumina AI Aura Reading`;
  }

  async function handleShare() {
    const shareText = buildShareText();
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        window.prompt('Copy this text:', shareText);
      }
    } else {
      try {
        const { Share } = require('react-native');
        await Share.share({ message: shareText });
      } catch (e) {
        console.error('Share error:', e);
      }
    }
  }

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#0a0015', '#1a0030', '#0d001a']}
      style={[styles.container, Platform.OS === 'web' && { overflow: 'auto' }]}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* AuraCard — max-width 500px, white border, polished */}
        <Animated.View
          style={[
            styles.auraCard,
            { borderColor: hex, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Glow halo behind photo */}
          <View style={[styles.glowHalo, { backgroundColor: hexLight, shadowColor: hex }]} />

          {/* Photo in circular frame */}
          {imageUri && (
            <View style={[styles.imageRing, { borderColor: hex, shadowColor: hex }]}>
              <Image source={{ uri: imageUri }} style={styles.photo} />
              <View style={[styles.auraGlow, { backgroundColor: hexLight }]} />
            </View>
          )}

          {/* Mood indicator */}
          {result.mood && (
            <View style={styles.moodIndicator}>
              <Text style={styles.moodText}>Scanned while feeling {result.mood}</Text>
            </View>
          )}

          {/* Large color badge */}
          <View style={[styles.colorBadge, { backgroundColor: hex, shadowColor: hex }]}>
            <Text style={styles.colorBadgeText}>🌈 {result.color} Aura</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{result.title}</Text>
          <Text style={[styles.archetype, { color: hex }]}>{result.archetype}</Text>

          {/* Huge vibe score */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Vibe Score</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: hex }]}>{result.vibe_score}</Text>
              <Text style={[styles.scoreMax, { color: hexMid }]}>/100</Text>
            </View>
          </View>

          {/* Animated progress bar */}
          <View style={styles.scoreBarBg}>
            <Animated.View
              style={[styles.scoreBarFill, { width: barWidth, backgroundColor: hex, shadowColor: hex }]}
            />
          </View>

          {/* Energy */}
          <View style={[styles.energyBadge, { borderColor: hexMid, backgroundColor: hexLight }]}>
            <Text style={[styles.energyText, { color: hex }]}>⚡ {result.energy} Energy</Text>
          </View>

          {/* Breakdown */}
          <Text style={[styles.breakdown, { color: '#e9d5ff' }]}>{result.breakdown}</Text>

          {/* Strengths */}
          <Text style={styles.sectionLabel}>✦ Strengths</Text>
          <View style={styles.strengthsRow}>
            {result.strengths?.map((s, i) => (
              <View key={i} style={[styles.strengthBadge, { borderColor: hex, backgroundColor: hexLight }]}>
                <Text style={[styles.strengthText, { color: hex }]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Shadow side */}
          {result.shadow_side && (
            <>
              <Text style={styles.sectionLabel}>🌑 Shadow Side</Text>
              <Text style={[styles.shadowText, { color: '#d4c5f9' }]}>{result.shadow_side}</Text>
            </>
          )}

          {/* Compatibility text */}
          {result.compatibility && (
            <>
              <Text style={styles.sectionLabel}>💫 Compatibility</Text>
              <Text style={[styles.compatText, { color: hex }]}>{result.compatibility}</Text>
            </>
          )}

          {/* Compatibility Chart (Req 1) */}
          <CompatibilityChart auraColor={result.color} auraHex={result.hex} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: hexMid }]} />

          {/* Watermark (Req 7) */}
          <Text style={styles.watermark}>✨ Lumina — AI Aura Reading</Text>
          <Text style={styles.readingDate}>{readingDateTime}</Text>

          {/* Share button */}
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: hex, backgroundColor: hexLight }]}
            onPress={handleShare}
          >
            <Text style={[styles.shareBtnText, { color: hex }]}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Scan Again */}
        <TouchableOpacity
          style={[styles.newScanBtn, { backgroundColor: hex, shadowColor: hex }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.newScanText}>✨ Scan Again</Text>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyBtnText}>📜 View History</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, alignItems: 'center', paddingBottom: 60 },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 20 },

  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { color: '#a855f7', fontSize: 16 },

  auraCard: {
    backgroundColor: '#0d0020',
    borderRadius: 28,
    // White semi-transparent border (Req 7.1)
    borderWidth: 1.5,
    padding: 28,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },

  glowHalo: {
    position: 'absolute',
    top: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },

  imageRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  photo: { width: 160, height: 160, borderRadius: 80 },
  auraGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
  },

  moodIndicator: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  moodText: {
    color: '#c084fc',
    fontSize: 13,
    fontStyle: 'italic',
  },

  colorBadge: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  colorBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.5 },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  archetype: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  scoreSection: { alignItems: 'center', marginBottom: 8 },
  scoreLabel: { color: '#ffffff80', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 72, fontWeight: 'bold', lineHeight: 80 },
  scoreMax: { fontSize: 22, marginLeft: 4, fontWeight: '600' },

  scoreBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: '#ffffff15',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  energyBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 20,
  },
  energyText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  breakdown: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },

  sectionLabel: {
    color: '#ffffff60',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  strengthBadge: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  strengthText: { fontSize: 13, fontWeight: '700' },

  shadowText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  compatText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },

  divider: { width: '60%', height: 1, opacity: 0.3, marginBottom: 16, marginTop: 8 },

  // Watermark (Req 7.2)
  watermark: {
    color: '#ffffff40',
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  // Date/time (Req 7.3)
  readingDate: {
    color: '#ffffff30',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 16,
  },

  shareBtn: {
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  newScanBtn: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  newScanText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  historyBtn: {
    borderWidth: 1,
    borderColor: '#a855f750',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyBtnText: { color: '#a855f7', fontSize: 15 },
});
