import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Platform, ActivityIndicator, Alert, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scanAura } from '../lib/groq';

// Inject floating star CSS on web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatStar {
      0%   { transform: translateY(100vh) scale(0); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
    }
    .lumina-star {
      position: fixed;
      pointer-events: none;
      border-radius: 50%;
      background: white;
      animation: floatStar linear infinite;
      z-index: 0;
    }
    #lumina-root { position: relative; z-index: 1; }
  `;
  document.head.appendChild(style);

  // Spawn stars
  const spawnStars = () => {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'lumina-star';
      const size = Math.random() * 4 + 1;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.animationDuration = (Math.random() * 8 + 6) + 's';
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
  const [todayReading, setTodayReading] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkTodayReading();
    startPulse();
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }

  async function checkTodayReading() {
    try {
      const lastDate = await AsyncStorage.getItem('lastScanDate');
      if (lastDate === TODAY) {
        const data = await AsyncStorage.getItem('readings');
        const readings = data ? JSON.parse(data) : [];
        if (readings.length > 0) {
          setTodayReading(readings[0]);
        }
      }
    } catch (e) {
      console.error('checkTodayReading error:', e);
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
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker. Please try again.');
      console.error(e);
    }
  }

  async function scanMyAura() {
    if (!image) return Alert.alert('Upload a photo first!');
    setLoading(true);
    try {
      const result = await scanAura(image.base64);
      await AsyncStorage.setItem('lastScanDate', TODAY);
      navigation.navigate('Result', { result, imageUri: image.uri });
    } catch (e) {
      Alert.alert('Error', 'Could not read your aura. Check your connection and try again!');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Daily lock screen
  if (todayReading && !showOverride) {
    return (
      <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.appName}>✨ Lumina</Text>
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

  return (
    <LinearGradient colors={['#0a0015', '#1a0030', '#0d001a']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>✨ Lumina</Text>
        <Text style={styles.tagline}>Discover your cosmic energy</Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>🌟</Text>
                <Text style={styles.uploadText}>Upload your photo</Text>
                <Text style={styles.uploadSub}>or take a selfie</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {image && (
          <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
            <Text style={styles.changeBtnText}>Change photo</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.scanBtn, (!image || loading) && styles.scanBtnDisabled]}
          onPress={scanMyAura}
          disabled={loading || !image}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>  Reading your aura...</Text>
            </View>
          ) : (
            <Text style={styles.scanBtnText}>✨ Scan My Aura</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyBtnText}>📜 Past Readings</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  appName: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  tagline: { fontSize: 16, color: '#c084fc', marginBottom: 40 },

  uploadBox: {
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#ffffff10', borderWidth: 2,
    borderColor: '#a855f7', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
  },
  previewImage: { width: 240, height: 240, borderRadius: 120 },
  uploadPlaceholder: { alignItems: 'center' },
  uploadIcon: { fontSize: 48, marginBottom: 10 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  uploadSub: { color: '#a855f7', fontSize: 13, marginTop: 4 },

  changeBtn: { marginBottom: 20 },
  changeBtnText: { color: '#a855f7', fontSize: 14 },

  scanBtn: {
    backgroundColor: '#7c3aed', paddingHorizontal: 50,
    paddingVertical: 16, borderRadius: 30, width: '100%',
    alignItems: 'center', marginBottom: 15,
  },
  scanBtnDisabled: { backgroundColor: '#7c3aed50' },
  scanBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },

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
