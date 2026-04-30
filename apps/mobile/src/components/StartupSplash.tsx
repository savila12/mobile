import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

type StartupSplashProps = {
  subtitle?: string;
};

export const StartupSplash = ({ subtitle = 'Preparing your garage...' }: StartupSplashProps) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const accentWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(accentWidth, {
        toValue: 92,
        duration: 650,
        useNativeDriver: false,
      }),
    ]).start();
  }, [accentWidth, logoOpacity, logoScale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoBadge}>
          <Ionicons name="car-sport-outline" size={28} color="#0fb37f" />
        </View>
        <Text style={styles.title}>AutoTrack</Text>
        <Animated.View style={[styles.accentBar, { width: accentWidth }]} />
      </Animated.View>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111113',
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#f4f4f5',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  accentBar: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#0fb37f',
    marginTop: 10,
  },
  subtitle: {
    marginTop: 24,
    color: '#a1a1aa',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
