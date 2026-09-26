import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { Logo } from '@/components/ui/Logo';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48 - 16) / 2;

const UserIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const CameraIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const UploadIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="17 8 12 3 7 8" />
    <Line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);

const HistoryIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const SettingsIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const AlertTriangleIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Line x1="12" y1="9" x2="12" y2="13" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);

const PackageIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <Line x1="12" y1="22.08" x2="12" y2="12" />
  </Svg>
);

const ArrowRightIcon = ({ color, size=24 }: { color: string, size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

const MOCK_SCANS = [
  { id: '1', title: 'Chocolate Biscuit', detail: '2 ingredients flagged', date: 'Today', status: 'warning' as const },
  { id: '2', title: 'Milk', detail: 'No selected allergens', date: 'Yesterday', status: 'success' as const },
];

export default function HomeScreen() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <Logo size={24} />
            <Text style={styles.logoText}>LabelLens</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <UserIcon color={Colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Good morning, User 👋</Text>
          <Text style={styles.subtitle}>Let's understand your food better</Text>
        </View>

        {/* Main Scan Section */}
        <TouchableOpacity 
          style={styles.mainScanCard} 
          onPress={() => router.push('/scan')}
          activeOpacity={0.9}
        >
          <Text style={styles.mainScanTitle}>Scan Food Label</Text>
          
          <View style={styles.scanIconWrapper}>
            <Animated.View style={[styles.scanRing, animatedRingStyle]} />
            <View style={styles.scanCircle}>
              <CameraIcon color={Colors.primaryOrange} size={42} />
            </View>
          </View>
          
          <Text style={styles.mainScanDesc}>
            Point your camera at a food label to analyze it
          </Text>
          
          <View style={styles.scanButton}>
            <Text style={styles.scanButtonText}>Scan Now</Text>
            <ArrowRightIcon color="#FFFFFF" size={16} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/scan')} activeOpacity={0.7}>
            <CameraIcon color={Colors.primaryOrange} size={24} />
            <Text style={styles.quickActionText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/scan')} activeOpacity={0.7}>
            <UploadIcon color={Colors.primaryOrange} size={24} />
            <Text style={styles.quickActionText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/history')} activeOpacity={0.7}>
            <HistoryIcon color={Colors.primaryOrange} size={24} />
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/profile')} activeOpacity={0.7}>
            <SettingsIcon color={Colors.primaryOrange} size={24} />
            <Text style={styles.quickActionText}>Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Personalized Alert Section */}
        <Text style={styles.sectionTitle}>Your Alerts</Text>
        <TouchableOpacity style={styles.alertCard} onPress={() => {}} activeOpacity={0.8}>
          <View style={styles.alertIconWrapper}>
            <AlertTriangleIcon color={Colors.warning} size={24} />
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>2 ingredients to watch</Text>
            <Text style={styles.alertDesc}>Based on your preferences</Text>
          </View>
          <View style={styles.alertActionRow}>
            <Text style={styles.alertActionText}>View</Text>
            <ArrowRightIcon color={Colors.warning} size={14} />
          </View>
        </TouchableOpacity>

        {/* Recent Scans */}
        <View style={styles.recentScansHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentScansList}>
          {MOCK_SCANS.map((scan) => (
            <TouchableOpacity key={scan.id} style={styles.historyCard} activeOpacity={0.7}>
              <View style={[
                styles.historyIconWrapper,
                scan.status === 'warning' ? styles.bgWarningLight : styles.bgSuccessLight
              ]}>
                <PackageIcon color={scan.status === 'warning' ? Colors.warning : Colors.success} size={20} />
              </View>
              <View style={styles.historyCardContent}>
                <View style={styles.historyCardTopRow}>
                  <Text style={styles.historyTitle}>{scan.title}</Text>
                  <Text style={styles.historyDate}>{scan.date}</Text>
                </View>
                <Text style={[
                  styles.historyDetail, 
                  { color: scan.status === 'warning' ? Colors.warning : Colors.success }
                ]}>
                  {scan.detail}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMain,
    marginLeft: 8,
  },
  greetingSection: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  mainScanCard: {
    alignItems: 'center',
    backgroundColor: Colors.lightOrange, // Large rounded light-orange section
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  mainScanTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 32,
  },
  scanIconWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  scanRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.primaryOrange,
  },
  scanCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.veryLightOrange, // very light orange inside
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScanDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 240,
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryOrange,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 100,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
  },
  quickActionCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMain,
    marginTop: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightOrange, // light orange background for alerts
    borderRadius: 20,
    padding: 16,
    marginBottom: 40,
  },
  alertIconWrapper: {
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
    marginRight: 4,
  },
  recentScansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryOrange,
  },
  recentScansList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bgWarningLight: {
    backgroundColor: '#FEF3C7',
  },
  bgSuccessLight: {
    backgroundColor: '#DCFCE7',
  },
  historyCardContent: {
    flex: 1,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMain,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyDetail: {
    fontSize: 14,
    fontWeight: '500',
  }
});
