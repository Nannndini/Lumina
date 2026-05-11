/**
 * CosmicLoader — full-screen animated overlay displayed during aura scanning.
 * Feature: lumina-production-features, Requirement 6
 */

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { AURA_COLORS } from '../lib/auraTypes';

const MESSAGES = [
  'Reading your energy field...',
  'Scanning your aura frequency...',
  'Consulting the cosmos...',
  'Decoding your spiritual signature...',
  'Almost ready...',
];

// Inject CSS for web rotation animation (once)
if (Platform.OS === 'web') {
  if (!document.getElementById('lumina-cosmic-loader-style')) {
    const style = document.createElement('style');
    style.id = 'lumina-cosmic-loader-style';
    style.textContent = `
      @keyframes cosmicSpin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .lumina-cosmic-spinner {
        animation: cosmicSpin 1.5s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * @param {{ visible: boolean, elapsed: number }} props
 * elapsed: milliseconds since scan started (for 15s timeout message)
 *
 * Feature: lumina-production-features, Property 10: Cosmic loader message cycling is sequential
 */
export default function CosmicLoader({ visible, elapsed }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateLoop = useRef(null);
  const msgInterval = useRef(null);

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

      // Rotation loop (native only — web uses CSS)
      if (Platform.OS !== 'web') {
        rotateLoop.current = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        );
        rotateLoop.current.start();
      }

      // Message + color cycling every 2000ms
      setMsgIndex(0);
      setColorIndex(0);
      msgInterval.current = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        setColorIndex((prev) => (prev + 1) % AURA_COLORS.length);
      }, 2000);
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      rotateLoop.current?.stop();
      rotateAnim.setValue(0);
      clearInterval(msgInterval.current);
    }

    return () => {
      rotateLoop.current?.stop();
      clearInterval(msgInterval.current);
    };
  }, [visible]);

  if (!visible) return null;

  const accentColor = AURA_COLORS[colorIndex];
  const showSlowMessage = elapsed > 15000;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = 80;
  const borderWidth = 5;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Background glow */}
      <View style={[styles.bgGlow, { backgroundColor: accentColor + '20' }]} />

      {/* Spinner */}
      {Platform.OS === 'web' ? (
        <div
          className="lumina-cosmic-spinner"
          style={{
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            border: `${borderWidth}px solid ${accentColor}30`,
            borderTopColor: accentColor,
            borderRightColor: '#a855f7',
            marginBottom: 32,
          }}
        />
      ) : (
        <Animated.View
          style={[
            styles.spinner,
            {
              width: spinnerSize,
              height: spinnerSize,
              borderRadius: spinnerSize / 2,
              borderTopColor: accentColor,
              borderRightColor: '#a855f7',
              transform: [{ rotate }],
            },
          ]}
        />
      )}

      {/* Cycling message */}
      <Text style={[styles.message, { color: accentColor }]}>
        {MESSAGES[msgIndex]}
      </Text>

      {/* Slow message (> 15s) */}
      {showSlowMessage && (
        <Text style={styles.slowMessage}>Taking longer than usual...</Text>
      )}

      {/* Decorative stars */}
      <Text style={styles.stars}>✦ ✧ ✦ ✧ ✦</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0015f0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  bgGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '30%',
  },
  spinner: {
    borderWidth: 5,
    borderColor: '#ffffff15',
    marginBottom: 32,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 30,
    marginBottom: 12,
  },
  slowMessage: {
    color: '#ffffff60',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  stars: {
    color: '#ffffff30',
    fontSize: 16,
    letterSpacing: 6,
    marginTop: 8,
  },
});
