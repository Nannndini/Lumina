/**
 * PulsingRing — animated gradient ring around the selected photo.
 * Uses CSS keyframes on web and React Native Animated on native.
 * Feature: lumina-production-features, Requirement 5
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Inject CSS keyframes on web (once)
if (Platform.OS === 'web') {
  if (!document.getElementById('lumina-pulsing-ring-style')) {
    const style = document.createElement('style');
    style.id = 'lumina-pulsing-ring-style';
    style.textContent = `
      @keyframes pulseRingScale {
        0%   { transform: scale(1); }
        50%  { transform: scale(1.06); }
        100% { transform: scale(1); }
      }
      @keyframes rotateRingGradient {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .lumina-pulsing-ring-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        animation: pulseRingScale 2s ease-in-out infinite;
      }
      .lumina-pulsing-ring-border {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        animation: rotateRingGradient 3s linear infinite;
        z-index: 0;
      }
      .lumina-pulsing-ring-inner {
        position: relative;
        z-index: 1;
        border-radius: 50%;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * @param {{
 *   visible: boolean,
 *   color: string,
 *   size?: number,
 *   children: React.ReactNode
 * }} props
 *
 * Feature: lumina-production-features, Property 4 (implicit): Ring color is from aura palette
 */
export default function PulsingRing({ visible, color, size = 240, children }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleLoop = useRef(null);
  const rotateLoop = useRef(null);

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      // Scale pulse
      scaleLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      scaleLoop.current.start();

      // Rotation
      rotateLoop.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      rotateLoop.current.start();
    } else {
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }

    return () => {
      scaleLoop.current?.stop();
      rotateLoop.current?.stop();
    };
  }, [visible, color]);

  if (!visible) {
    return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>{children}</View>;
  }

  // Web implementation
  if (Platform.OS === 'web') {
    const ringStyle = {
      background: `conic-gradient(from 0deg, ${color}, #a855f7, #ec4899, ${color})`,
    };
    return (
      <div className="lumina-pulsing-ring-wrapper" style={{ width: size, height: size }}>
        <div
          className="lumina-pulsing-ring-border"
          style={{ ...ringStyle, width: size + 8, height: size + 8, top: -4, left: -4 }}
        />
        <div className="lumina-pulsing-ring-inner" style={{ width: size, height: size }}>
          {children}
        </div>
      </div>
    );
  }

  // Native implementation
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const ringSize = size + 12;
  const ringOffset = -6;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: size, height: size }}>
      {/* Rotating gradient ring */}
      <Animated.View
        style={[
          styles.ringWrapper,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            top: ringOffset,
            left: ringOffset,
            transform: [{ rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={[color, '#a855f7', '#ec4899', color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          }}
        />
      </Animated.View>
      {/* Inner content */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: '#0a0015',
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ringWrapper: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
