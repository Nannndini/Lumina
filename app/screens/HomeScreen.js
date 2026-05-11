/**
 * HomeScreen — premium magical home screen.
 * First-prize worthy: shimmer title, 60 stars, ambient glow, pulsing ring,
 * mood selector, evolution badge, streak badge, cosmic loader, gradient scan button.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Platform, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { scanAura, getErrorMessage } from '../lib/groq';
import { computeNewStreak } from '../lib/streak';
import { randomAuraColor } from '../lib/auraTypes';
import { Storage } from '../lib/storage';
import EvolutionBadge from '../components/EvolutionBadge';
import StreakBadge from '../components/StreakBadge';
import MoodSelector from '../components/MoodSelector';
import PulsingRing from '../components/PulsingRing';
import CosmicLoader from '../components/CosmicLoader';

// Inject web-only CSS once
if (Platform.OS === 'web') {
  if (!document.getElementById('lumina-home-style')) {
    const style = document.createElement('style');
    style.id = 'lumina-home-style';
    style.textContent = `
      @keyframes floatStar {
        0%   { transform: translateY(100vh) scale(0); opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 0.8; }
        100% { transform: translateY(-10vh) scale(1.3); opacity: 0; }
      }
      @keyframes shimmer {
        0%   { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      .lumina-star {
        position: fixed;
        pointer-events: none;
        border-radius: 50%;
        background: white;
        animation: floatStar linear infinite;
        z-index: 0;
      }
      .lumina-title {
        background: linear-gradient(90deg, #c084fc, #f472b6, #c084fc);
        background-size: 200% auto;
        animation: shimmer 3s linear infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 46px;
        font-weight: 900;
        margin: 0 0 4px 0;
        letter-spacing: 1px;
      }
      .lumina-scan-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.15);
        box-shadow: 0 8px 30px #7c3aed80 !important;
      }
      .lumina-scan-btn {
        transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease;
        cursor: pointer;
      }
      #lumina-root { position: relative; z-index: 1; }
    `;
    document.head.appendChild(style);

    // Spawn 60 stars — 4 size tiers, 4 speeds, varying opacity, with twinkle
    const sizes = [2, 3, 4, 6];
    const durations = [7, 10, 14, 18];
    const twinkleDurations = [2, 2.5, 3, 3.5, 4];
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'lumina-star';
      const tier = i % 4;
      const size = sizes[tier];
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + 'vw';
      // Combine float + twinkle animations
      const floatDur = durations[tier] + 's';
      const twinkleDur = twinkleDurations[Math.floor(Math.random() * twinkleDurations.length)] + 's';
      const twinkleDelay = (Math.random() * 3).toFixed(2) + 's';
      star.style.animation = `floatStar ${floatDur} linear infinite, twinkle ${twinkleDur} ease ${twinkleDelay} infinite`;
      star.style.animationDelay = (Math.random() * 12) + 's, ' + twinkleDelay;
      star.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
      document.body.appendChild(star);
    }
  }
}

const TODAY = new Date().toDateString();

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState(0);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [todayReading, setTodayReading] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [lastReading, setLastReading] = useState(null);
  const [mood, setMood] = useState(null);
  const [ringColor, setRingColor] = useState(randomAuraColor());
  const [error, setError] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const elapsedInterval = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    startPulse();
  }, []);

  useEffect(() => {
    if (loading) {
      const start = Date.now();
      setLoadingStartTime(start);
      elapsedInterval.current = setInterval(() => {
        setLoadingElapsed(Date.now() - start);
      }, 500);
    } else {
      clearInterval(elapsedInterval.current);
      setLoadingElapsed(0);
    }
    return () => clearInterval(elapsedInterval.current);
  }, [loading]);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }

  async function loadData() {
    try {
      const lastDate = await Storage.getItem('lastScanDate');
      if (lastDate === TODAY) {
        const data = await Storage.getItem('readings');
        const readings = data ? JSON.parse(data) : [];
        if (readings.length > 0) setTodayReading(readings[0]);
      }
      const countStr = await Storage.getItem('scanCount');
      setScanCount(countStr ? parseInt(countStr, 10) : 0);
      const streakStr = await Storage.getItem('streakCount');
      setStreakCount(streakStr ? parseInt(streakStr, 10) : 0);
      const readingsData = await Storage.getItem('readings');
      const readings = readingsData ? JSON.parse(readingsData) : [];
      if (readings.length > 0) setLastReading(readings[0]);
    } catch (e) {
      console.error('loadData error:', e);
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        setImage(result.assets[0]);
        setMood(null);
        setRingColor(randomAuraColor());
        setError(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker. Please try again.');
      console.error(e);
    }
  }

  async function scanMyAura() {
    if (!image) return Alert.alert('Upload a photo first!');
    setLoading(true);
    setError(null);
    try {
      const result = await scanAura(image.base64, mood);
      if (mood) result.mood = mood.emoji;

      const newCount = scanCount + 1;
      await Storage.setItem('scanCount', newCount.toString());
      setScanCount(newCount);

      const lastStreakDate = await Storage.getItem('lastStreakDate');
      const newStreak = computeNewStreak(lastStreakDate, TODAY, streakCount);
      await Storage.setItem('streakCount', newStreak.toString());
      await Storage.setItem('lastStreakDate', TODAY);
      setStreakCount(newStreak);

      await Storage.setItem('lastScanDate', TODAY);

      // Save reading before navigating
      const saveId = Date.now().toString();
      const newReading = {
        ...result,
        _saveId: saveId,
        imageUri: image.uri,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        id: saveId,
      };
      try {
        const existing = await Storage.getItem('readings');
        const readings = existing ? JSON.parse(existing) : [];
        readings.unshift(newReading);
        console.log('Saving reading:', newReading.color, newReading.vibe_score);
        await Storage.setItem('readings', JSON.stringify(readings.slice(0, 50)));
        const saved = await Storage.getItem('readings');
        console.log('SAVED READINGS count:', saved ? JSON.parse(saved).length : 0);
      } catch (saveErr) {
        console.error('Failed to save reading:', saveErr);
      }

      navigation.navigate('Result', { result: newReading, imageUri: image.uri });
    } catch (e) {
      console.error('scanMyAura error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function dismissError() { setError(null); }

  const ambientHex = lastReading?.hex || '#a855f7';

  // Daily lock screen
  if (todayReading && !showOverride) {
    return (
      <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
        <View style={styles.content}>
          {Platform.OS === 'web' ? (
            <h1 className="shimmer-text">✨ Lumina</h1>
          ) : (
            <Text style={styles.appName}>✨ Lumina</Text>
          )}
          <EvolutionBadge scanCount={scanCount} />
          <StreakBadge streak={streakCount} />
          <View style={styles.lockCard}>
            <Text style={styles.lockEmoji}>🌙</Text>
            <Text style={styles.lockTitle}>Your aura was read today ✨</Text>
            <Text style={styles.lockSub}>Come back tomorrow for a new reading</Text>
            <View style={[styles.miniCard, { borderColor: todayReading.hex }]}>
              {todayReading.imageUri && (
                <Image source={{ uri: todayReading.imageUri }} style={[styles.miniPhoto, { borderColor: todayReading.hex }]} />
              )}
              <View style={[styles.miniColorDot, { backgroundColor: todayReading.hex }]} />
              <Text style={styles.miniColor}>{todayReading.color} Aura</Text>
              <Text style={[styles.miniScore, { color: todayReading.hex }]}>{todayReading.vibe_score}/100</Text>
              <Text style={styles.miniArchetype}>{todayReading.archetype}</Text>
            </View>
            <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
              <Text style={styles.historyBtnText}>📜 View All Readings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowOverride(true)}>
              <Text style={styles.overrideLink}>Scan anyway →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0a0015', '#1a0030', '#0d001a']}
      style={styles.container}
      {...(Platform.OS === 'web' ? { className: 'aurora-bg' } : {})}
    >
      {/* Ambient glow from last reading */}
      {lastReading && (
        <View style={[styles.ambientGlow, { backgroundColor: ambientHex + '15', shadowColor: ambientHex }]} />
      )}

      <View style={styles.content}>
        {/* Welcome back */}
        {lastReading && (
          <Text style={[styles.welcomeBack, { color: ambientHex }]}>Welcome back ✨</Text>
        )}

        {/* Shimmer title */}
        {Platform.OS === 'web' ? (
          <h1 className="shimmer-text">✨ Lumina</h1>
        ) : (
          <Text style={styles.appName}>✨ Lumina</Text>
        )}

        {/* Last reading summary */}
        {lastReading && (
          <Text style={styles.lastReadingSummary}>
            Last: {lastReading.color} Aura — {lastReading.archetype}
          </Text>
        )}

        <Text style={styles.tagline}>Discover your cosmic energy</Text>

        <EvolutionBadge scanCount={scanCount} />
        <StreakBadge streak={streakCount} />

        {/* Upload circle with pulsing ring + orbit rings on web */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <PulsingRing visible={!!image} color={ringColor} size={220}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>🌟</Text>
                  <Text style={styles.uploadText}>Upload your photo</Text>
                  <Text style={styles.uploadSub}>or take a selfie</Text>
                </View>
              )}
            </PulsingRing>
            {/* Orbit rings — web only, shown when photo selected */}
            {Platform.OS === 'web' && image && (
              <div className="ring-container">
                <div className="ring ring1" />
                <div className="ring ring2" />
                <div className="ring ring3" />
              </div>
            )}
          </TouchableOpacity>
        </Animated.View>

        {image && (
          <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
            <Text style={styles.changeBtnText}>Change photo</Text>
          </TouchableOpacity>
        )}

        {/* Mood selector */}
        {image && !loading && (
          <MoodSelector selectedMood={mood} onSelect={setMood} />
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
            <TouchableOpacity onPress={dismissError} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan button */}
        {Platform.OS === 'web' ? (
          <div
            className={(!image || loading) ? 'lumina-scan-btn' : 'lumina-scan-btn scan-btn-pulse'}
            onClick={(!image || loading) ? undefined : scanMyAura}
            style={{
              width: '100%',
              background: (!image || loading)
                ? 'rgba(124,58,237,0.35)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              borderRadius: 30,
              padding: '16px 0',
              textAlign: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 15,
              boxShadow: (!image || loading) ? 'none' : '0 4px 20px #7c3aed60',
              cursor: (!image || loading) ? 'default' : 'pointer',
              userSelect: 'none',
            }}
          >
            ✨ Scan My Aura
          </div>
        ) : (
          <TouchableOpacity
            style={[styles.scanBtn, (!image || loading) && styles.scanBtnDisabled]}
            onPress={scanMyAura}
            disabled={loading || !image}
          >
            <Text style={styles.scanBtnText}>✨ Scan My Aura</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
          <Text style={styles.historyBtnText}>📜 Past Readings</Text>
        </TouchableOpacity>
      </View>

      <CosmicLoader visible={loading} elapsed={loadingElapsed} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },

  ambientGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    top: '15%',
    left: '50%',
    marginLeft: -210,
    opacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 100,
  },

  welcomeBack: { fontSize: 14, marginBottom: 4, letterSpacing: 0.5 },
  appName: { fontSize: 46, fontWeight: '900', color: '#fff', marginBottom: 4, letterSpacing: 1 },
  lastReadingSummary: { color: '#ffffff60', fontSize: 13, marginBottom: 6, textAlign: 'center' },
  tagline: { fontSize: 15, color: '#c084fc', marginBottom: 16 },

  uploadBox: { marginBottom: 16 },
  previewImage: { width: 220, height: 220, borderRadius: 110 },
  uploadPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: '#a855f7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { fontSize: 44, marginBottom: 8 },
  uploadText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  uploadSub: { color: '#a855f7', fontSize: 12, marginTop: 4 },

  changeBtn: { marginBottom: 14 },
  changeBtnText: { color: '#a855f7', fontSize: 13 },

  errorBanner: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 14,
    alignItems: 'center',
  },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  dismissBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 12 },
  dismissText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  scanBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  scanBtnDisabled: { backgroundColor: '#7c3aed38', shadowOpacity: 0 },
  scanBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  historyBtn: {
    borderWidth: 1,
    borderColor: '#a855f750',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  historyBtnText: { color: '#a855f7', fontSize: 15 },

  // Daily lock
  lockCard: {
    backgroundColor: '#ffffff08', borderRadius: 24,
    borderWidth: 1, borderColor: '#a855f740',
    padding: 28, width: '100%', alignItems: 'center',
  },
  lockEmoji: { fontSize: 48, marginBottom: 12 },
  lockTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  lockSub: { color: '#c084fc', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  miniCard: {
    borderWidth: 1, borderRadius: 16, padding: 16,
    alignItems: 'center', width: '100%', marginBottom: 20,
    backgroundColor: '#ffffff06',
  },
  miniPhoto: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, marginBottom: 10 },
  miniColorDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 6 },
  miniColor: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  miniScore: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  miniArchetype: { color: '#c084fc', fontSize: 13 },
  overrideLink: { color: '#a855f780', fontSize: 13, marginTop: 12, textDecorationLine: 'underline' },
});
