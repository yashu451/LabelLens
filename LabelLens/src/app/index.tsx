import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { Logo } from '@/components/ui/Logo';

const CIRCLE_RADIUS = 40;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const STROKE_WIDTH = 6;
const SVG_SIZE = (CIRCLE_RADIUS + STROKE_WIDTH) * 2;

export default function SplashScreenComponent() {
  const [progressText, setProgressText] = useState(0);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const progress = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    
    progress.value = withDelay(
      500,
      withTiming(100, { duration: 2500, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(navigateToHome)();
        }
      })
    );
  }, [opacity, scale, progress]);

  const navigateToHome = () => {
    setTimeout(() => {
      router.replace('/login');
    }, 200);
  };

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setProgressText)(current);
      }
    }
  );

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const currentStrokeDashoffset = CIRCLE_CIRCUMFERENCE - (progressText / 100) * CIRCLE_CIRCUMFERENCE;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <Logo />
        </Animated.View>

        <Animated.View style={[styles.textContainer, animatedTextStyle]}>
          <Text style={styles.appName}>
            <Text style={styles.appNameLabel}>Label</Text>
            <Text style={styles.appNameLens}>Lens</Text>
          </Text>
          <Text style={styles.tagline}>Understand your food labels easily</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.progressContainer, animatedTextStyle]}>
        <View style={styles.circleWrapper}>
          <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={CIRCLE_RADIUS}
              stroke={Colors.lightOrange}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={SVG_SIZE / 2}
              cy={SVG_SIZE / 2}
              r={CIRCLE_RADIUS}
              stroke={Colors.primaryOrange}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_CIRCUMFERENCE}
              strokeDashoffset={currentStrokeDashoffset}
              rotation="-90"
              origin={`${SVG_SIZE / 2}, ${SVG_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{progressText}%</Text>
          </View>
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 30,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  appNameLabel: {
    color: Colors.textMain,
  },
  appNameLens: {
    color: Colors.primaryOrange,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circleWrapper: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryOrange,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
