/**
 * ResultScreen — stunning shareable aura result card.
 * First-prize worthy: radial gradient card, dramatic photo glow, 88px vibe score,
 * animated progress bar, compatibility chart, watermark, rich share text.
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import CompatibilityChart from '../components/CompatibilityChart';
import { Storage } from '../lib/storage';

// Inject web-only card styles once
if (Platform.OS === 'web') {
  if (!document.getElementById('lumina-result-style')) {
    const s = document.createElement('style');
    s.id = 'lumina-result-style';
    s.textContent = `
      .lumina-card-web {
        box-sizing: border-box;
      }
      .lumina-copy-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.15);
      }
      .lumina-copy-btn {
        transition: transform 0.15s ease, filter 0.15s ease;
        cursor: pointer;
      }
    `;
    document.head.appendChild(s);
  }
}

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params || {};
  const [copied, setCopied] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

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
  const hexLight = hex + '25';
  const hexMid = hex + '80';
  const hexBorder = hex + '50';
  const hexGlow = hex + '30';

  const readingDateTime = result.timestamp
    ? new Date(result.timestamp).toLocaleString()
    : result.date || new Date().toLocaleDateString();

  useEffect(() => {
    saveReading();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
    ]).start();
    Animated.timing(barAnim, {
      toValue: result.vibe_score / 100,
      duration: 1500,
      delay: 600,
      useNativeDriver: false,
    }).start();

    // Vibe score counter animation: count up from 0 to actual score
    const target = result.vibe_score;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + 2, target);
      setDisplayScore(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  async function saveReading() {
    try {
      if (result.id) {
        console.log('saveReading: already saved with id', result.id, '— skipping');
        return;
      }
      const existing = await Storage.getItem('readings');
      const readings = existing ? JSON.parse(existing) : [];
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
      console.log('Saving reading:', newReading.color, newReading.vibe_score);
      readings.unshift(newReading);
      const serialized = JSON.stringify(readings.slice(0, 50));
      await Storage.setItem('readings', serialized);
      const saved = await Storage.getItem('readings');
      console.log('SAVED READINGS:', saved ? JSON.parse(saved).length + ' readings' : 'null');
    } catch (e) {
      console.error('saveReading error:', e);
    }
  }

  function buildShareText() {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://lumina-aura.vercel.app';
    return `🔮 My aura reading from Lumina: I'm ${result.archetype} with a ${result.color} aura and a vibe score of ${result.vibe_score}/100 ✨ Discover yours at ${url}`;
  }

  async function handleShare() {
    const shareText = buildShareText();
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

  // Web card uses inline styles for CSS-only properties (radial-gradient, box-shadow)
  const webCardStyle = Platform.OS === 'web' ? {
    background: `radial-gradient(ellipse at top, ${hex}25 0%, #0a0015 60%)`,
    boxShadow: `0 0 40px ${hex}30`,
    border: `1px solid ${hex}50`,
  } : {};

  const webPhotoRingStyle = Platform.OS === 'web' ? {
    boxShadow: `0 0 50px 15px ${hex}60`,
    border: `3px solid ${hex}`,
  } : {};

  const webScoreStyle = Platform.OS === 'web' ? {
    textShadow: `0 0 30px ${hex}`,
  } : {};

  const webBarStyle = Platform.OS === 'web' ? {
    boxShadow: `0 0 10px ${hex}`,
  } : {};

  return (
    <View style={[styles.container, Platform.OS === 'web' && { overflow: 'auto' }]}>
      <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.auraCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            Platform.OS !== 'web' && { borderColor: hexBorder, backgroundColor: '#0d0020' },
          ]}
        >
          {/* Web card gets radial gradient + box-shadow via inline style */}
          {Platform.OS === 'web' && (
            <div
              className="lumina-card-web result-card"
              style={{
                ...webCardStyle,
                position: 'absolute',
                inset: 0,
                borderRadius: 28,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Glow halo */}
          <View style={[styles.glowHalo, { backgroundColor: hex + '20', shadowColor: hex }]} />

          {/* Photo */}
          {imageUri && (
            <View
              style={[
                styles.imageRing,
                Platform.OS !== 'web' && { borderColor: hex, shadowColor: hex },
              ]}
            >
              {Platform.OS === 'web' ? (
                <div style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  overflow: 'hidden',
                  ...webPhotoRingStyle,
                }}>
                  <img src={imageUri} style={{ width: 160, height: 160, borderRadius: 80, objectFit: 'cover' }} alt="aura" />
                </div>
              ) : (
                <>
                  <Image source={{ uri: imageUri }} style={styles.photo} />
                  <View style={[styles.auraGlow, { backgroundColor: hex + '40' }]} />
                </>
              )}
            </View>
          )}

          {/* Mood indicator */}
          {result.mood && (
            <View style={styles.moodIndicator}>
              <Text style={styles.moodText}>Scanned while feeling {result.mood}</Text>
            </View>
          )}

          {/* Color badge */}
          <View style={[styles.colorBadge, { backgroundColor: hex, shadowColor: hex }]}>
            <Text style={styles.colorBadgeText}>{(result.color || '').toUpperCase()} AURA</Text>
          </View>

          {/* Cosmic title */}
          <Text style={styles.title}>{result.title}</Text>

          {/* Archetype */}
          <Text style={[styles.archetype, { color: hex }]}>{result.archetype}</Text>

          {/* Vibe score */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>VIBE SCORE</Text>
            <View style={styles.scoreRow}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: hex },
                  Platform.OS === 'web' && webScoreStyle,
                ]}
              >
                {displayScore}
              </Text>
              <Text style={[styles.scoreMax, { color: hexMid }]}>/100</Text>
            </View>
          </View>

          {/* Animated progress bar */}
          <View style={styles.scoreBarBg}>
            <Animated.View
              style={[
                styles.scoreBarFill,
                { width: barWidth, backgroundColor: hex },
                Platform.OS === 'web' && webBarStyle,
                Platform.OS !== 'web' && { shadowColor: hex },
              ]}
            />
          </View>

          {/* Energy badge */}
          <View style={[styles.energyBadge, { borderColor: hex, backgroundColor: hex + '15' }]}>
            <Text style={[styles.energyText, { color: hex }]}>⚡ {result.energy} Energy</Text>
          </View>

          {/* Breakdown */}
          <Text style={styles.breakdown}>{result.breakdown}</Text>

          {/* Strengths */}
          <Text style={[styles.sectionLabel, { color: hex }]}>✦ STRENGTHS</Text>
          <View style={styles.strengthsRow}>
            {result.strengths?.map((s, i) => (
              <View key={i} style={[styles.strengthBadge, { borderColor: hex + '60', backgroundColor: hex + '20' }]}>
                <Text style={[styles.strengthText, { color: hex }]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Shadow side */}
          {result.shadow_side && (
            <>
              <Text style={[styles.sectionLabel, { color: hex }]}>🌑 SHADOW SIDE</Text>
              <Text style={styles.shadowText}>{result.shadow_side}</Text>
            </>
          )}

          {/* Compatibility */}
          {result.compatibility && (
            <>
              <Text style={[styles.sectionLabel, { color: hex }]}>💫 COMPATIBILITY</Text>
              <Text style={[styles.compatText, { color: hex + 'cc' }]}>{result.compatibility}</Text>
            </>
          )}

          {/* Compatibility Chart */}
          <CompatibilityChart auraColor={result.color} auraHex={result.hex} />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: hexMid }]} />

          {/* Watermark */}
          <Text style={[styles.watermark, { color: hex + '80' }]}>✨ Lumina — AI Aura Reading</Text>
          <Text style={styles.readingDate}>{readingDateTime}</Text>

          {/* Copy Link button */}
          {Platform.OS === 'web' ? (
            <div
              className="lumina-copy-btn"
              onClick={handleShare}
              style={{
                width: '100%',
                background: hex,
                borderRadius: 30,
                padding: '14px 0',
                textAlign: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
                marginTop: 4,
                userSelect: 'none',
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </div>
          ) : (
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: hex }]}
              onPress={handleShare}
            >
              <Text style={styles.shareBtnText}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </Text>
            </TouchableOpacity>
          )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0015',
  },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingBottom: 80,
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorText: { color: '#fff', fontSize: 18, marginBottom: 20 },

  backBtn: { alignSelf: 'flex-start', marginBottom: 16, paddingVertical: 4 },
  backText: { color: '#a855f7', fontSize: 16 },

  auraCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // native shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
    overflow: 'hidden',
  },

  glowHalo: {
    position: 'absolute',
    top: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 60,
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
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
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
    marginBottom: 14,
  },
  moodText: { color: '#c084fc', fontSize: 13, fontStyle: 'italic' },

  colorBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  colorBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 2,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 1,
  },
  archetype: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  scoreSection: { alignItems: 'center', marginBottom: 10 },
  scoreLabel: {
    color: '#ffffff60',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: 88, fontWeight: '900', lineHeight: 96 },
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
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },

  energyBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  energyText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  breakdown: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 24,
    fontStyle: 'italic',
    color: '#d4c5f9',
    letterSpacing: 0.2,
  },

  sectionLabel: {
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
    alignSelf: 'flex-start',
    fontWeight: '700',
  },

  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  strengthBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  strengthText: { fontSize: 13, fontWeight: '600' },

  shadowText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
    color: '#888',
  },
  compatText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },

  divider: { width: '50%', height: 1, opacity: 0.25, marginBottom: 14, marginTop: 6 },

  watermark: {
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  readingDate: {
    color: '#555',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 18,
  },

  shareBtn: {
    borderRadius: 30,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },

  newScanBtn: {
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    maxWidth: 440,
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
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyBtnText: { color: '#a855f7', fontSize: 15 },
});
