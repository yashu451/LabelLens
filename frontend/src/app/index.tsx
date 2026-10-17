import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';
import { OrganicHeaderDecoration } from '@/components/ui/OrganicHeaderDecoration';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(imageScaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate to Login after 2.6 seconds
    const timer = setTimeout(() => {
      handleNavigateToLogin();
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigateToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <OrganicHeaderDecoration />

      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={1}
        onPress={handleNavigateToLogin}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoWrapper}>
              <LeafLogo size={52} color={Colors.forestGreen} />
            </View>
            <Text style={styles.brandTitle}>LabelLens</Text>
            <View style={styles.taglineContainer}>
              <Text style={styles.taglinePrimary}>See what's inside.</Text>
              <Text style={styles.taglineSecondary}>Make healthier choices.</Text>
            </View>
          </View>

          {/* Premium Wellness Imagery */}
          <Animated.View
            style={[
              styles.imageCardContainer,
              {
                transform: [{ scale: imageScaleAnim }],
              },
            ]}
          >
            <View style={styles.imageFrame}>
              <Image
                source={require('../../assets/images/splash-wellness.jpg')}
                style={styles.wellnessImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          {/* Minimalist Progress Indicator */}
          <View style={styles.footer}>
            <View style={styles.dotContainer}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <Text style={styles.tapNotice}>Tap anywhere to continue</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  touchableArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoWrapper: {
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  taglinePrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  taglineSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  imageCardContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginVertical: 20,
  },
  imageFrame: {
    width: Math.min(width * 0.85, 340),
    height: Math.min(height * 0.45, 340),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
  },
  wellnessImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  activeDot: {
    width: 20,
    backgroundColor: Colors.forestGreen,
  },
  tapNotice: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
