/**
 * HomeScreen — main screen for photo upload and aura scanning.
 * Features: Evolution (Req 2), Mood (Req 3), Streak (Req 4), PulsingRing (Req 5),
 *           CosmicLoader (Req 6), Polish (Req 8), Error Handling (Req 10)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Platform, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scanAura, getErrorMessage } from '../lib/groq';
import { computeNewStreak } from '../lib/streak';
import { randomAuraColor } from '../lib/auraTypes';
import EvolutionBadge from '../components/EvolutionBadge';
import StreakBadge from '../components/StreakBadge';
import MoodSelector from '../components/MoodSelector';
import PulsingRing from '../components/PulsingRing';
import CosmicLoader from '../components/CosmicLoader';
import { Storage } from '../lib/storage';
// Inject floating star CSS on web (Req 8.5, 8.6)
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatStar {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
    }
    @keyframes shimmerGradient {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .lumina-star {
      position: fixed;
      pointer-events: none;
      border-radius: 50%;
      background: white;
      animation: floatStar linear infinite;
      z-index: 0;
    }
    .lumina-title-shimmer {
      background: linear-gradient(90deg, #a855f7, #ec4899, #a855f7);
      background-size: 200% 200%;
      animation: shimmerGradient 3s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    #lumina-root { position: relative; z-index: 1; }
  `;
  document.head.appendChild(style);

  // Spawn 50 stars with 3 size tiers and 3 animation durations (Req 8.5, 8.6)
  const spawnStars = () => {
    const count = 50;
    const sizes = [2, 3, 5];
    const durations = [8, 12, 16];
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'lumina-star';
      const size = sizes[i % 3];
      const duration = durations[i % 3];
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.animationDuration = duration + 's';
      star.style.animationDelay = (Math.random() * 10) + 's';
      star.style.opacity = Math.random() * 0.7 + 0.3;
      document.body.appendChild(star);
    }
  };
  spawnStars();
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

  // Load data on mount and on focus (Req 9.1)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    startPulse();
  }, []);

  // Track elapsed time during loading (for CosmicLoader timeout message)
  useEffect(() => {
    if (loading) {
      setLoadingStartTime(Date.now());
      elapsedInterval.current = setInterval(() => {
        setLoadingElapsed(Date.now() - loadingStartTime);
      }, 500);
    } else {
      clearInterval(elapsedInterval.current);
      setLoadingElapsed(0);
    }
    return () => clearInterval(elapsedInterval.current);
  }, [loading, loadingStartTime]);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }

  async function loadData() {
    try {
      // Check today's reading
      const lastDate = await Storage.getItem('lastScanDate');
      if (lastDate === TODAY) {
        const data = await Storage.getItem('readings');
        const readings = data ? JSON.parse(data) : [];
        if (readings.length > 0) {
          setTodayReading(readings[0]);
        }
      }

      // Load scan count (Req 2)
      const countStr = await Storage.getItem('scanCount');
      setScanCount(countStr ? parseInt(countStr, 10) : 0);

      // Load streak count (Req 4)
      const streakStr = await Storage.getItem('streakCount');
      setStreakCount(streakStr ? parseInt(streakStr, 10) : 0);

      // Load last reading for welcome back (Req 8.1, 8.2)
      const readingsData = await Storage.getItem('readings');
      const readings = readingsData ? JSON.parse(readingsData) : [];
      if (readings.length > 0) {
        setLastReading(readings[0]);
      }
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
        setMood(null); // Reset mood on new photo
        setRingColor(randomAuraColor()); // New ring color (Req 5.4)
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

      // Save mood to result (Req 3.6, Property 7)
      if (mood) {
        result.mood = mood.emoji;
      }

      // Update scan count (Req 2.1, Property 4)
      const newCount = scanCount + 1;
      await Storage.setItem('scanCount', newCount.toString());
      setScanCount(newCount);

      // Update streak (Req 4.1, Property 8)
      const lastStreakDate = await Storage.getItem('lastStreakDate');
      const newStreak = computeNewStreak(lastStreakDate, TODAY, streakCount);
      await Storage.setItem('streakCount', newStreak.toString());
      await Storage.setItem('lastStreakDate', TODAY);
      setStreakCount(newStreak);

      // Mark today's scan
      await Storage.setItem('lastScanDate', TODAY);

      navigation.navigate('Result', { result, imageUri: image.uri });
    } catch (e) {
      console.error('scanMyAura error:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  function dismissError() {
    setError(null);
  }

  // Daily lock screen
  if (todayReading && !showOverride) {
    return (
      <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.appName}>✨ Lumina</Text>

          {/* Evolution + Streak badges (Req 2.5, 4.5) */}
          <EvolutionBadge scanCount={scanCount} />
          <StreakBadge streak={streakCount} />

          <View style={styles.lockCard}>
            <Text style={styles.lockEmoji}>🌙</Text>
            <Text style={styles.lockTitle}>Your aura was read today ✨</Text>
            <Text style={styles.lockSub}>Come back tomorrow for a new reading</Text>

            <View style={[styles.miniCard, { borderColor: todayReading.hex }]}>
              {todayReading.imageUri && (
                <Image
                  source={{ uri: todayReading.imageUri }}
                  style={[styles.miniPhoto, { borderColor: todayReading.hex }]}
                />
              )}
              <View style={[styles.miniColorDot, { backgroundColor: todayReading.hex }]} />
              <Text style={styles.miniColor}>{todayReading.color} Aura</Text>
              <Text style={[styles.miniScore, { color: todayReading.hex }]}>
                {todayReading.vibe_score}/100
              </Text>
              <Text style={styles.miniArchetype}>{todayReading.archetype}</Text>
            </View>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('History')}
            >
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

  // Ambient glow from last reading (Req 8.4, Property 4)
  const ambientGlow = lastReading?.hex || '#a855f7';

  return (
    <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
      {/* Ambient background glow (Req 8.4) */}
      {lastReading && (
        <View
          style={[
            styles.ambientGlow,
            { backgroundColor: ambientGlow + '15', shadowColor: ambientGlow },
          ]}
        />
      )}

      <View style={styles.content}>
        {/* Welcome back greeting (Req 8.1) */}
        {lastReading && (
          <Text style={styles.welcomeBack}>Welcome back ✨</Text>
        )}

        {/* Animated gradient title (Req 8.3) */}
        {Platform.OS === 'web' ? (
          <h1 className="lumina-title-shimmer" style={{ fontSize: 42, fontWeight: 'bold', margin: 0, marginBottom: 4 }}>
            ✨ Lumina
          </h1>
        ) : (
          <Text style={styles.appName}>✨ Lumina</Text>
        )}

        {/* Last reading summary (Req 8.2, Property 13) */}
        {lastReading && (
          <Text style={styles.lastReadingSummary}>
            Last reading: {lastReading.color} Aura — {lastReading.archetype}
          </Text>
        )}

        <Text style={styles.tagline}>Discover your cosmic energy</Text>

        {/* Evolution + Streak badges (Req 2.3, 4.2) */}
        <EvolutionBadge scanCount={scanCount} />
        <StreakBadge streak={streakCount} />

        {/* Photo picker with PulsingRing (Req 5) */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            <PulsingRing visible={!!image} color={ringColor} size={240}>
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
          </TouchableOpacity>
        </Animated.View>

        {image && (
          <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
            <Text style={styles.changeBtnText}>Change photo</Text>
          </TouchableOpacity>
        )}

        {/* MoodSelector (Req 3) */}
        {image && !loading && (
          <MoodSelector selectedMood={mood} onSelect={setMood} />
        )}

        {/* Error banner (Req 10, Property 17) */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
            <TouchableOpacity onPress={dismissError} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.scanBtn, (!image || loading) && styles.scanBtnDisabled]}
          onPress={scanMyAura}
          disabled={loading || !image}
        >
          <Text style={styles.scanBtnText}>✨ Scan My Aura</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyBtnText}>📜 Past Readings</Text>
        </TouchableOpacity>
      </View>

      {/* CosmicLoader overlay (Req 6) */}
      <CosmicLoader visible={loading} elapsed={loadingElapsed} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },

  ambientGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: '20%',
    left: '50%',
    marginLeft: -200,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },

  welcomeBack: {
    color: '#c084fc',
    fontSize: 14,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  appName: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  lastReadingSummary: {
    color: '#ffffff70',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: { fontSize: 16, color: '#c084fc', marginBottom: 20 },

  uploadBox: {
    marginBottom: 20,
  },
  previewImage: { width: 240, height: 240, borderRadius: 120 },
  uploadPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#ffffff10',
    borderWidth: 2,
    borderColor: '#a855f7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { fontSize: 48, marginBottom: 10 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  uploadSub: { color: '#a855f7', fontSize: 13, marginTop: 4 },

  changeBtn: { marginBottom: 16 },
  changeBtnText: { color: '#a855f7', fontSize: 14 },

  errorBanner: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  dismissBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dismissText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  scanBtn: {
    backgroundColor: '#7c3aed', paddingHorizontal: 50,
    paddingVertical: 16, borderRadius: 30, width: '100%',
    alignItems: 'center', marginBottom: 15,
  },
  scanBtnDisabled: { backgroundColor: '#7c3aed50' },
  scanBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  historyBtn: {
    borderWidth: 1, borderColor: '#a855f750',
    paddingHorizontal: 30, paddingVertical: 12,
    borderRadius: 20, width: '100%', alignItems: 'center',
  },
  historyBtnText: { color: '#a855f7', fontSize: 15 },

  // Daily lock styles
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
