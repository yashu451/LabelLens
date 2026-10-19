import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Easing,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';

const { width } = Dimensions.get('window');

const MOTIVATIONAL_MESSAGES = [
  'Every ingredient tells a story.',
  'Know what goes into your body.',
  'Small choices. Healthier habits.',
  'Making food labels easier to understand.',
  'Your journey to smarter food choices starts here.',
];

/**
 * Floating Botanical Particle Component
 */
const FloatingParticle: React.FC<{
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  isLeaf?: boolean;
}> = ({ initialX, initialY, size, color, duration, delay, isLeaf }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.85, 0.35],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: isLeaf ? ['-15deg', '15deg'] : ['0deg', '0deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: initialX,
          top: initialY,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    >
      {isLeaf ? (
        <Svg width={size * 1.6} height={size * 1.6} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C12 2 6 8 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 8 12 2 12 2Z"
            fill={color}
          />
          <Path d="M12 20V8" stroke="#FAF9F6" strokeWidth="1.2" strokeLinecap="round" />
        </Svg>
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          }}
        />
      )}
    </Animated.View>
  );
};

export default function SplashScreen() {
  const router = useRouter();

  // 3D Visual Floating and Rotation Drivers
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Motivational Message Rotation State & Animation Drivers
  const [messageIndex, setMessageIndex] = useState(0);
  const messageFadeAnim = useRef(new Animated.Value(1)).current;
  const messageSlideAnim = useRef(new Animated.Value(0)).current;

  // Three-dot loader animation drivers
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    // 1. Gentle 3D floating sinusoidal oscillation
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatingLoop.start();

    // 2. Three-dot pulse loader animation
    const createDotAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, 720 - delay)),
        ])
      );
    };

    const anim1 = createDotAnimation(dot1Anim, 0);
    const anim2 = createDotAnimation(dot2Anim, 180);
    const anim3 = createDotAnimation(dot3Anim, 360);

    anim1.start();
    anim2.start();
    anim3.start();

    // 3. Motivational message transition interval (cycles while startup is active)
    const messageInterval = setInterval(() => {
      if (!isMounted) return;

      Animated.parallel([
        Animated.timing(messageFadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(messageSlideAnim, {
          toValue: -6,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;
        setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL_MESSAGES.length);
        messageSlideAnim.setValue(8);
        Animated.parallel([
          Animated.timing(messageFadeAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(messageSlideAnim, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2400);

    // 4. Genuine App Startup & Initialization
    async function initializeApp() {
      try {
        // Preload actual icon font resources used across the app
        // along with the initial startup presentation phase
        await Promise.all([
          Feather.loadFont(),
          Ionicons.loadFont(),
          new Promise((resolve) => setTimeout(resolve, 2200)),
        ]);
      } catch (error) {
        // Handle initialization errors without freezing the screen
        console.warn('App startup warning:', error);
      } finally {
        if (isMounted) {
          router.replace('/login');
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
      clearInterval(messageInterval);
      floatingLoop.stop();
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  // 3D Perspective Transformations
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const rotateX = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['3deg', '-2deg', '3deg'],
  });

  const rotateY = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '4deg', '-5deg'],
  });

  // Dynamic Depth Shadow (inversely tracks float elevation)
  const shadowScale = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.14, 0.88],
  });

  const shadowOpacity = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.10],
  });

  // Loader Dot Renderer
  const renderDot = (anim: Animated.Value) => {
    const dotTranslateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });

    const opacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    });

    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1.15],
    });

    return (
      <Animated.View
        style={[
          styles.dot,
          {
            opacity,
            transform: [{ translateY: dotTranslateY }, { scale }],
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* Top Brand Identity */}
        <View style={styles.brandHeader}>
          <LeafLogo size={42} color={Colors.forestGreen} />
          <Text style={styles.brandTitle}>LabelLens</Text>
        </View>

        {/* Central 3D-Inspired Food & Botanical Visual Stage */}
        <View style={styles.visualStage}>
          {/* Subtle Ambient Botanical Particles */}
          <FloatingParticle
            initialX={25}
            initialY={20}
            size={10}
            color="#2D6A4F"
            duration={2800}
            delay={0}
            isLeaf
          />
          <FloatingParticle
            initialX={width * 0.72}
            initialY={15}
            size={6}
            color="#52B788"
            duration={2400}
            delay={400}
          />
          <FloatingParticle
            initialX={width * 0.78}
            initialY={120}
            size={11}
            color="#40916C"
            duration={3100}
            delay={200}
            isLeaf
          />
          <FloatingParticle
            initialX={20}
            initialY={150}
            size={7}
            color="#95D5B2"
            duration={2600}
            delay={600}
          />
          <FloatingParticle
            initialX={width * 0.45}
            initialY={5}
            size={5}
            color="#D8E2DC"
            duration={2200}
            delay={800}
          />

          {/* 3D Floating Glass Food Jar & Nutritional Label */}
          <Animated.View
            style={[
              styles.floating3DCard,
              {
                transform: [
                  { perspective: 1000 },
                  { translateY },
                  { rotateX },
                  { rotateY },
                ],
              },
            ]}
          >
            <Svg width={230} height={250} viewBox="0 0 230 250" fill="none">
              <Defs>
                {/* Radial Botanical Glow */}
                <RadialGradient
                  id="botanicalGlow"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#2D6A4F" stopOpacity={0.16} />
                  <Stop offset="65%" stopColor="#52B788" stopOpacity={0.06} />
                  <Stop offset="100%" stopColor="#FAF9F6" stopOpacity={0} />
                </RadialGradient>

                {/* Cork Stopper Gradients */}
                <LinearGradient id="corkGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#C99765" />
                  <Stop offset="50%" stopColor="#DFB286" />
                  <Stop offset="100%" stopColor="#A27144" />
                </LinearGradient>
                <LinearGradient id="corkTopGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#DFB286" />
                  <Stop offset="100%" stopColor="#8C5C32" />
                </LinearGradient>

                {/* Glass Jar Surface Gradients */}
                <LinearGradient id="glassBodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.75} />
                  <Stop offset="25%" stopColor="#EAF5EE" stopOpacity={0.35} />
                  <Stop offset="70%" stopColor="#D4EAD9" stopOpacity={0.45} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.65} />
                </LinearGradient>
                <LinearGradient id="glassRimGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
                  <Stop offset="50%" stopColor="#D0E6D8" stopOpacity={0.6} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.8} />
                </LinearGradient>

                {/* Botanical Leaves Gradients */}
                <LinearGradient id="leafGradBack1" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#40916C" />
                  <Stop offset="100%" stopColor="#1B4332" />
                </LinearGradient>
                <LinearGradient id="leafGradBack2" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#74C69D" />
                  <Stop offset="100%" stopColor="#2D6A4F" />
                </LinearGradient>
                <LinearGradient id="leafGradFront1" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#52B788" />
                  <Stop offset="100%" stopColor="#1B4332" />
                </LinearGradient>
                <LinearGradient id="leafGradFront2" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#95D5B2" />
                  <Stop offset="100%" stopColor="#2D6A4F" />
                </LinearGradient>

                {/* Label Card Gradients */}
                <LinearGradient id="labelCardGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFFFFF" />
                  <Stop offset="100%" stopColor="#F7FAF8" />
                </LinearGradient>
                <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#74C69D" stopOpacity={0.25} />
                  <Stop offset="100%" stopColor="#1B4332" stopOpacity={0.45} />
                </LinearGradient>
              </Defs>

              {/* Ambient Glow */}
              <Circle cx="115" cy="130" r="95" fill="url(#botanicalGlow)" />

              {/* Back Botanical Leaves (Emerging gracefully behind shoulders) */}
              <G>
                {/* Left Flourishing Leaf */}
                <Path
                  d="M95 75 C70 42 42 48 30 68 C42 88 70 88 90 84 Z"
                  fill="url(#leafGradBack1)"
                />
                <Path
                  d="M90 84 Q62 65 30 68"
                  stroke="#A7C4A0"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />

                {/* Right Accent Leaf */}
                <Path
                  d="M135 70 C160 38 190 45 200 64 C188 84 160 84 140 80 Z"
                  fill="url(#leafGradBack2)"
                />
                <Path
                  d="M140 80 Q175 62 200 64"
                  stroke="#D8E2DC"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              </G>

              {/* Cork Stopper with Realistic Depth */}
              <G>
                <Rect
                  x="95"
                  y="26"
                  width="40"
                  height="16"
                  rx="3"
                  fill="url(#corkGrad)"
                />
                <Rect
                  x="91"
                  y="22"
                  width="48"
                  height="8"
                  rx="3"
                  fill="url(#corkTopGrad)"
                />
              </G>

              {/* Glass Neck & Lip */}
              <Rect
                x="89"
                y="40"
                width="52"
                height="10"
                rx="5"
                fill="url(#glassRimGrad)"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.2"
              />
              <Rect
                x="97"
                y="48"
                width="36"
                height="14"
                fill="#E8F4EC"
                fillOpacity={0.6}
              />

              {/* Main Translucent Glass Body */}
              <Path
                d="M97 62 C85 67 64 77 64 97 L64 186 C64 197 73 206 84 206 L146 206 C157 206 166 197 166 186 L166 97 C166 77 145 67 133 62 Z"
                fill="url(#glassBodyGrad)"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1.6"
              />

              {/* Translucent Botanical Liquid / Pure Infusion */}
              <Path
                d="M70 120 C70 120 90 116 115 116 C140 116 160 120 160 120 L160 186 C160 194 154 200 146 200 L84 200 C76 200 70 194 70 186 Z"
                fill="url(#liquidGrad)"
              />

              {/* Tactile 3D Food Nutrition Label */}
              <G>
                <Rect
                  x="73"
                  y="112"
                  width="84"
                  height="72"
                  rx="8"
                  fill="url(#labelCardGrad)"
                  stroke="rgba(27,67,50,0.14)"
                  strokeWidth="1"
                />

                {/* Leaf Icon Emblem on Label */}
                <Path
                  d="M115 120 C112 118 109 120 110 124 C111 127 115 129 115 129 C115 129 119 127 120 124 C121 120 118 118 115 120 Z"
                  fill="#1B4332"
                />

                <SvgText
                  x="115"
                  y="136"
                  textAnchor="middle"
                  fontSize="6.5"
                  fontWeight="bold"
                  fill="#1B4332"
                  letterSpacing="0.8"
                >
                  LABEL LENS
                </SvgText>

                <SvgText
                  x="115"
                  y="144"
                  textAnchor="middle"
                  fontSize="4.8"
                  fontWeight="600"
                  fill="#52B788"
                  letterSpacing="0.4"
                >
                  100% ORGANIC
                </SvgText>

                <Line
                  x1="83"
                  y1="148"
                  x2="147"
                  y2="148"
                  stroke="rgba(27,67,50,0.1)"
                  strokeWidth="0.8"
                />

                {/* Health Score Pill Badge */}
                <Rect
                  x="89"
                  y="153"
                  width="52"
                  height="12"
                  rx="6"
                  fill="#E8F5E9"
                />
                <SvgText
                  x="115"
                  y="161.5"
                  textAnchor="middle"
                  fontSize="5.2"
                  fontWeight="bold"
                  fill="#1B4332"
                >
                  HEALTH SCORE 98
                </SvgText>

                <SvgText
                  x="115"
                  y="173"
                  textAnchor="middle"
                  fontSize="4.2"
                  fontWeight="500"
                  fill="#6B7280"
                >
                  ZERO ADDITIVES • PURE
                </SvgText>
              </G>

              {/* Glass Specular Gloss & Reflections */}
              <Path
                d="M69 98 L69 186 C69 189 70 192 72 194 L72 96 C70 96 69 97 69 98 Z"
                fill="rgba(255,255,255,0.8)"
              />
              <Path
                d="M75 96 L75 190 L77 190 L77 96 Z"
                fill="rgba(255,255,255,0.3)"
              />
              <Path
                d="M161 98 L161 186"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.2"
              />

              {/* Front Overlapping Botanical Leaves */}
              <G>
                {/* Lower Right Fresh Leaf */}
                <Path
                  d="M152 182 C172 170 192 178 198 198 C179 201 163 192 152 182 Z"
                  fill="url(#leafGradFront1)"
                />
                <Path
                  d="M152 182 Q177 190 198 198"
                  stroke="#FAF9F6"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />

                {/* Lower Left Delicate Leaf */}
                <Path
                  d="M76 192 C56 184 42 192 38 208 C54 212 68 204 76 192 Z"
                  fill="url(#leafGradFront2)"
                />
                <Path
                  d="M76 192 Q56 202 38 208"
                  stroke="#FAF9F6"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              </G>
            </Svg>
          </Animated.View>

          {/* Dynamic 3D Depth Shadow */}
          <Animated.View
            style={[
              styles.depthShadow,
              {
                transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
                opacity: shadowOpacity,
              },
            ]}
          />
        </View>

        {/* Motivational Messages with Smooth Slide/Fade */}
        <View style={styles.messageContainer}>
          <Animated.View
            style={{
              opacity: messageFadeAnim,
              transform: [{ translateY: messageSlideAnim }],
            }}
          >
            <Text style={styles.motivationalMessage}>
              {MOTIVATIONAL_MESSAGES[messageIndex]}
            </Text>
          </Animated.View>
        </View>

        {/* Subtle Animated Loading Indicator */}
        <View style={styles.loaderContainer}>
          {renderDot(dot1Anim)}
          {renderDot(dot2Anim)}
          {renderDot(dot3Anim)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.5,
  },
  visualStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 270,
  },
  floating3DCard: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  depthShadow: {
    width: 140,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1B4332',
    marginTop: 8,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    zIndex: 3,
  },
  messageContainer: {
    marginTop: 26,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  motivationalMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.forestGreen,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.forestGreen,
  },
});

