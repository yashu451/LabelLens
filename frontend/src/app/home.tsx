import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebase';
import {
  getUserPreferences,
  saveUserPreferences,
  getUserScans,
  ScanItem,
  clearUserScans,
} from '@/services/storage';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Ellipse,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';

const CAROUSEL_MESSAGES = [
  {
    heading: 'Small changes make a big difference.',
    subtext: 'Choose food that chooses you back.',
    tag: 'Habits',
    type: 'avocado_berries' as const,
    source: require('../../assets/images/home-wellness-card.jpg'),
  },
  {
    heading: 'Every ingredient tells a story.',
    subtext: 'Fresh ingredients, clean flavors, honest origins.',
    tag: 'Clarity',
    type: 'herbs_ingredients' as const,
    source: require('../../assets/images/splash-wellness.jpg'),
  },
  {
    heading: 'Know what goes into your body.',
    subtext: 'Look closer at the labels that shape your health.',
    tag: 'Transparency',
    type: 'label_magnifier' as const,
  },
  {
    heading: 'Choose smarter. Feel better.',
    subtext: 'Fill your day with vibrant, fresh produce.',
    tag: 'Nutrition',
    type: 'colorful_produce' as const,
  },
  {
    heading: 'Your health starts with everyday choices.',
    subtext: 'Nourish your body with wholesome goodness.',
    tag: 'Wellness',
    type: 'nourishing_bowl' as const,
  },
];

const DIETARY_OPTIONS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Low Sugar',
  'Keto',
  'Organic Only',
  'Halal',
  'Kosher',
];

const PRESET_AVATARS = [
  { label: 'Sarah', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80' },
  { label: 'Alex', uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80' },
  { label: 'Maya', uri: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80' },
  { label: 'Jordan', uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&q=80' },
];

/**
 * Distinct Food & Botanical Visual for Each Flash Card
 */
const CarouselVisual: React.FC<{ item: (typeof CAROUSEL_MESSAGES)[number] }> = ({ item }) => {
  // Card 1: Avocado and berries
  if (item.type === 'avocado_berries' && item.source) {
    return (
      <Image
        source={item.source}
        style={styles.carouselImage}
        resizeMode="cover"
      />
    );
  }

  // Card 2: Fresh ingredients and herbs
  if (item.type === 'herbs_ingredients' && item.source) {
    return (
      <Image
        source={item.source}
        style={styles.carouselImage}
        resizeMode="cover"
      />
    );
  }

  // Card 3: Packaged food label and magnifying glass
  if (item.type === 'label_magnifier') {
    return (
      <Svg width={92} height={92} viewBox="0 0 92 92" fill="none">
        <Defs>
          <LinearGradient id="magGlassGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#E2F0D9" stopOpacity={0.4} />
          </LinearGradient>
          <LinearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#2D6A4F" />
            <Stop offset="100%" stopColor="#1B4332" />
          </LinearGradient>
        </Defs>
        <Rect width={92} height={92} rx="20" fill="#F4F8F5" />
        {/* Packaged food box / label in background */}
        <Rect x="16" y="16" width="46" height="58" rx="8" fill="#FFFFFF" stroke="#D1E3D7" strokeWidth="1.2" />
        {/* Barcode & label lines */}
        <Line x1="24" y1="26" x2="44" y2="26" stroke="#1B4332" strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="24" y1="33" x2="52" y2="33" stroke="#85A390" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="24" y1="39" x2="48" y2="39" stroke="#A7C4A0" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="24" y1="45" x2="40" y2="45" stroke="#A7C4A0" strokeWidth="1.5" strokeLinecap="round" />
        {/* Checkmark badge on label */}
        <Circle cx="48" cy="58" r="7" fill="#E8F5E9" />
        <Path d="M45 58 L47 60 L51 56" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Magnifying Glass focusing over the label */}
        <Circle cx="52" cy="42" r="20" fill="url(#magGlassGrad)" stroke="#1B4332" strokeWidth="2.8" />
        <Circle cx="52" cy="42" r="16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
        {/* Specular gleam on lens */}
        <Path d="M42 34 C44 30 50 28 54 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        {/* Handle */}
        <Line x1="66" y1="56" x2="80" y2="70" stroke="url(#handleGrad)" strokeWidth="5.5" strokeLinecap="round" />
        <Circle cx="80" cy="70" r="2.8" fill="#143326" />
      </Svg>
    );
  }

  // Card 4: Colorful fresh produce
  if (item.type === 'colorful_produce') {
    return (
      <Svg width={92} height={92} viewBox="0 0 92 92" fill="none">
        <Defs>
          <LinearGradient id="orangeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FBBF24" />
            <Stop offset="100%" stopColor="#F97316" />
          </LinearGradient>
          <LinearGradient id="berryGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#6366F1" />
          </LinearGradient>
          <LinearGradient id="leafGradProd" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#4ADE80" />
            <Stop offset="100%" stopColor="#166534" />
          </LinearGradient>
          <LinearGradient id="appleGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#EF4444" />
            <Stop offset="100%" stopColor="#B91C1C" />
          </LinearGradient>
        </Defs>
        <Rect width={92} height={92} rx="20" fill="#FEFDF9" />
        {/* Background lush green leaves */}
        <Path d="M46 16 C34 12 28 26 38 38 C50 34 52 22 46 16 Z" fill="url(#leafGradProd)" />
        <Path d="M52 20 C64 16 70 30 60 40 C48 36 46 26 52 20 Z" fill="#22C55E" />
        {/* Red Crisp Apple */}
        <Circle cx="36" cy="52" r="18" fill="url(#appleGrad)" />
        <Path d="M36 34 Q38 28 35 24" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        <Path d="M26 44 C24 48 26 54 28 56" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
        {/* Vibrant Sunkissed Orange */}
        <Circle cx="56" cy="56" r="16" fill="url(#orangeGrad)" />
        <Circle cx="56" cy="56" r="3" fill="#FED7AA" />
        {/* Fresh Blueberries cluster */}
        <Circle cx="44" cy="68" r="7" fill="url(#berryGrad)" />
        <Circle cx="44" cy="68" r="2" fill="#C7D2FE" />
        <Circle cx="33" cy="67" r="5.5" fill="#4F46E5" />
        <Circle cx="64" cy="46" r="5" fill="#4338CA" />
      </Svg>
    );
  }

  // Card 5: A bowl of nourishing food
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92" fill="none">
      <Defs>
        <LinearGradient id="bowlCeramic" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FAF9F6" />
          <Stop offset="100%" stopColor="#D5DFD8" />
        </LinearGradient>
        <LinearGradient id="avocadoFlesh" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#A3E635" />
          <Stop offset="100%" stopColor="#65A30D" />
        </LinearGradient>
        <LinearGradient id="grainGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Rect width={92} height={92} rx="20" fill="#F6FAF7" />
      {/* Ceramic Bowl */}
      <Path d="M16 46 C16 46 20 74 46 74 C72 74 76 46 76 46 Z" fill="url(#bowlCeramic)" stroke="#B8C9BD" strokeWidth="1.5" />
      {/* Bowl inner rim */}
      <Ellipse cx="46" cy="46" rx="30" ry="11" fill="#E8F1EC" stroke="#CBDDD1" strokeWidth="1.2" />
      {/* Nourishing Grain bed */}
      <Path d="M22 47 C25 44 34 42 46 42 C58 42 67 44 70 47 C65 52 56 55 46 55 C36 55 27 52 22 47 Z" fill="url(#grainGrad)" />
      {/* Sliced Avocado fan */}
      <Path d="M26 44 C26 36 34 34 38 40 C34 46 28 48 26 44 Z" fill="url(#avocadoFlesh)" stroke="#365314" strokeWidth="0.8" />
      <Path d="M32 42 C32 35 40 33 44 39 C40 45 34 46 32 42 Z" fill="#BEF264" stroke="#365314" strokeWidth="0.8" />
      <Path d="M38 41 C38 34 46 33 50 38 C46 44 40 45 38 41 Z" fill="#D9F99D" stroke="#365314" strokeWidth="0.8" />
      {/* Vibrant Green edamame / peas / seeds */}
      <Circle cx="54" cy="44" r="3.2" fill="#22C55E" />
      <Circle cx="60" cy="46" r="3" fill="#16A34A" />
      <Circle cx="57" cy="50" r="2.8" fill="#15803D" />
      <Circle cx="48" cy="49" r="2.5" fill="#4ADE80" />
      {/* Little radish slice / tomato accent */}
      <Circle cx="44" cy="52" r="3.5" fill="#F43F5E" />
      <Circle cx="44" cy="52" r="2" fill="#FFF1F2" />
      {/* Fresh herb garnish on top */}
      <Path d="M46 34 C44 28 49 26 52 30 C50 34 47 35 46 34 Z" fill="#15803D" />
      <Path d="M46 34 C49 32 54 36 50 38 Z" fill="#22C55E" />
    </Svg>
  );
};

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'compare' | 'profile'>('home');

  // Firebase Authenticated User & Scoped Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [userScans, setUserScans] = useState<ScanItem[]>([]);

  // Profile Editor State
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Motivational Carousel State & Animation Drivers
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselFadeAnim = useRef(new Animated.Value(1)).current;
  const carouselSlideAnim = useRef(new Animated.Value(0)).current;

  // Circular Scan Button Pulse Driver
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 1. Firebase Authentication State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setEditDisplayName(user.displayName || '');
        setEditPhotoURL(user.photoURL || '');

        // Load isolated user data scoped to this specific Firebase UID
        try {
          const [prefs, scans] = await Promise.all([
            getUserPreferences(user.uid),
            getUserScans(user.uid),
          ]);
          setUserPreferences(prefs);
          setUserScans(scans);
        } catch (e) {
          console.warn('Error loading user-scoped data:', e);
        }
      } else {
        // Clear all user-specific state on sign out
        setUserPreferences([]);
        setUserScans([]);
        setEditDisplayName('');
        setEditPhotoURL('');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Carousel & Scanner Pulse Animations
  useEffect(() => {
    const carouselInterval = setInterval(() => {
      Animated.parallel([
        Animated.timing(carouselFadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(carouselSlideAnim, {
          toValue: -14,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setCarouselIndex((prev) => (prev + 1) % CAROUSEL_MESSAGES.length);
        carouselSlideAnim.setValue(14);
        Animated.parallel([
          Animated.timing(carouselFadeAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(carouselSlideAnim, {
            toValue: 0,
            duration: 320,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      });
    }, 4000);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      clearInterval(carouselInterval);
      pulseLoop.stop();
    };
  }, [carouselFadeAnim, carouselSlideAnim, pulseAnim]);

  // Profile Save Handler
  const handleSaveProfile = async (customPhoto?: string) => {
    if (!auth.currentUser) return;
    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const newName = editDisplayName.trim();
      const newPhoto = (customPhoto !== undefined ? customPhoto : editPhotoURL).trim();

      await updateProfile(auth.currentUser, {
        displayName: newName || null,
        photoURL: newPhoto || null,
      });

      if (customPhoto !== undefined) {
        setEditPhotoURL(newPhoto);
      }

      setCurrentUser({ ...auth.currentUser });
      setProfileFeedback('Profile updated successfully!');
      setTimeout(() => setProfileFeedback(null), 3000);
    } catch (err: any) {
      setProfileFeedback(err?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Dietary Preferences Toggle Handler
  const handleTogglePreference = async (pref: string) => {
    if (!currentUser) return;
    const exists = userPreferences.includes(pref);
    const updated = exists
      ? userPreferences.filter((p) => p !== pref)
      : [...userPreferences, pref];
    setUserPreferences(updated);
    await saveUserPreferences(currentUser.uid, updated);
  };

  // Scan History Clear Handler
  const handleClearHistory = async () => {
    if (!currentUser) return;
    await clearUserScans(currentUser.uid);
    setUserScans([]);
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserPreferences([]);
      setUserScans([]);
      router.replace('/login');
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Android activity destruction recovery on Home:
   * Recovers photo if Android killed the app while camera was open
   */
  useEffect(() => {
    (async () => {
      try {
        const pendingResult = await ImagePicker.getPendingResultAsync();
        if (
          pendingResult &&
          'canceled' in pendingResult &&
          !pendingResult.canceled &&
          pendingResult.assets &&
          pendingResult.assets.length > 0
        ) {
          router.push({
            pathname: '/scan',
            params: { imageUri: pendingResult.assets[0].uri, source: 'camera' },
          });
        }
      } catch (err) {
        console.warn('Pending image picker result check on Home:', err);
      }
    })();
  }, []);

  /**
   * Main Scan Icon Handler:
   * Immediately opens the scanning experience (Google Lens style camera screen).
   */
  const handleMainScan = () => {
    router.push('/scan');
  };

  // Greeting and Display Name calculation
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
  const rawName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Friend';
  const initialLetter = (displayName ? displayName[0] : 'U').toUpperCase();

  // Loading State
  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.authLoadingContainer}>
          <ActivityIndicator size="large" color={Colors.forestGreen} />
          <Text style={styles.authLoadingText}>Connecting to LabelLens...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Signed-out State
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.signedOutCard}>
            <View style={styles.signedOutLogoContainer}>
              <LeafLogo size={52} color={Colors.forestGreen} />
            </View>
            <Text style={styles.signedOutTitle}>Welcome to LabelLens</Text>
            <Text style={styles.signedOutSubtext}>
              Sign in to view your personalized nutritional ratings, dietary preferences, and scan history.
            </Text>
            <TouchableOpacity
              style={styles.signedOutButtonPrimary}
              activeOpacity={0.85}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.signedOutButtonPrimaryText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signedOutButtonSecondary}
              activeOpacity={0.8}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.signedOutButtonSecondaryText}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Greeting & Profile Avatar */}
        <View style={styles.topHeader}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSmall}>{greetingTime}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.leafIconBadge}>
                <LeafLogo size={20} color={Colors.forestGreen} />
              </View>
            </View>
            <Text style={styles.greetingTagline}>Better food. Brighter you.</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
            accessibilityLabel="View Profile"
          >
            {currentUser.photoURL ? (
              <Image
                source={{ uri: currentUser.photoURL }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initialLetter}</Text>
              </View>
            )}
            <View style={styles.avatarOnlineDot} />
          </TouchableOpacity>
        </View>

        {/* TAB 1: Home Dashboard */}
        {activeTab === 'home' && (
          <>
            {/* 1. Motivational Flash-Card Stack (Auto-rotating every 4s, no movement indicators) */}
            <View style={styles.carouselContainer} pointerEvents="none">
              <View style={styles.cardStackLayer2} />
              <View style={styles.cardStackLayer1} />
              <View style={styles.carouselCard}>
                <Animated.View
                  style={[
                    styles.carouselContentRow,
                    {
                      opacity: carouselFadeAnim,
                      transform: [{ translateX: carouselSlideAnim }],
                    },
                  ]}
                >
                  <View style={styles.carouselTextContainer}>
                    <View style={styles.carouselTagBadge}>
                      <Text style={styles.carouselTagText}>
                        {CAROUSEL_MESSAGES[carouselIndex].tag}
                      </Text>
                    </View>
                    <Text style={styles.carouselHeading}>
                      {CAROUSEL_MESSAGES[carouselIndex].heading}
                    </Text>
                    <Text style={styles.carouselSubtext}>
                      {CAROUSEL_MESSAGES[carouselIndex].subtext}
                    </Text>
                  </View>

                  <View style={styles.carouselImageFrame}>
                    <CarouselVisual item={CAROUSEL_MESSAGES[carouselIndex]} />
                  </View>
                </Animated.View>
              </View>
            </View>

            {/* 2. Prominent Circular Scan Button */}
            <View style={styles.circularScanSection}>
              <TouchableOpacity
                style={styles.circularScanTouchTarget}
                activeOpacity={0.85}
                onPress={handleMainScan}
                accessibilityLabel="Scan Food Label"
              >
                <Animated.View
                  style={[
                    styles.scanPulseRingOuter,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <View style={styles.scanPulseRingInner} />
                <View style={styles.scanCircleButton}>
                  <Ionicons name="scan-outline" size={38} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.scanLabel}>Scan Food Label</Text>
            </View>

            {/* 3. Three Feature Shortcuts */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.85}
                onPress={() => setActiveTab('history')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="clock" size={18} color="#D97706" />
                </View>
                <Text style={styles.actionCardTitle}>Scan History</Text>
                <Text style={styles.actionCardSubtitle}>
                  {userScans.length > 0 ? `${userScans.length} saved scans` : 'No scans yet'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.85}
                onPress={() => setActiveTab('compare')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: Colors.leafGreen }]}>
                  <Feather name="columns" size={18} color={Colors.forestGreen} />
                </View>
                <Text style={styles.actionCardTitle}>Compare Products</Text>
                <Text style={styles.actionCardSubtitle}>Check side by side</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.85}
                onPress={() => setActiveTab('profile')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Feather name="sliders" size={18} color="#0284C7" />
                </View>
                <Text style={styles.actionCardTitle}>Dietary Preferences</Text>
                <Text style={styles.actionCardSubtitle}>
                  {userPreferences.length > 0 ? `${userPreferences.length} active` : 'Set your needs'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. Recent Scans Section with Sensible Empty State */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {userScans.length > 0 && (
                <TouchableOpacity onPress={() => setActiveTab('history')}>
                  <Text style={styles.seeAllText}>See all ({userScans.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {userScans.length > 0 ? (
              userScans.slice(0, 4).map((item) => (
                <View key={item.id} style={styles.recentItemCard}>
                  <View style={styles.recentItemThumb}>
                    <Feather name="package" size={20} color={Colors.forestGreen} />
                  </View>
                  <View style={styles.recentItemInfo}>
                    <Text style={styles.recentItemName}>{item.name}</Text>
                    <Text style={styles.recentItemBrand}>
                      {item.brand} • {item.date}
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyScansContainer}>
                <View style={styles.emptyScansIconCircle}>
                  <Feather name="camera" size={26} color={Colors.forestGreen} />
                </View>
                <Text style={styles.emptyScansTitle}>No scans yet</Text>
                <Text style={styles.emptyScansSubtitle}>
                  Tap the circular scanner above to scan your first product label and inspect ingredients!
                </Text>
              </View>
            )}
          </>
        )}

        {/* TAB 2: Scan History */}
        {activeTab === 'history' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.tabHeading}>Scan History</Text>
              {userScans.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
                  <Text style={styles.clearHistoryText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {userScans.length > 0 ? (
              userScans.map((item) => (
                <View key={item.id} style={styles.recentItemCard}>
                  <View style={styles.recentItemThumb}>
                    <Feather name="package" size={20} color={Colors.forestGreen} />
                  </View>
                  <View style={styles.recentItemInfo}>
                    <Text style={styles.recentItemName}>{item.name}</Text>
                    <Text style={styles.recentItemBrand}>
                      {item.brand} • {item.date} {item.calories ? `• ${item.calories}` : ''}
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyScansContainer}>
                <View style={styles.emptyScansIconCircle}>
                  <Feather name="clock" size={26} color={Colors.forestGreen} />
                </View>
                <Text style={styles.emptyScansTitle}>Your scan history is empty</Text>
                <Text style={styles.emptyScansSubtitle}>
                  Every food label you scan will be securely saved under your account so you can track healthier choices.
                </Text>
                <TouchableOpacity
                  style={styles.tabActionBtn}
                  onPress={handleMainScan}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tabActionBtnText}>Scan a Food Label</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: Compare Products */}
        {activeTab === 'compare' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.tabHeading}>Compare Products</Text>
            </View>

            <View style={styles.compareCard}>
              <View style={styles.compareIconCircle}>
                <Feather name="columns" size={28} color={Colors.forestGreen} />
              </View>
              <Text style={styles.compareTitle}>Side-by-Side Comparison</Text>
              <Text style={styles.compareSubtext}>
                Scan or select two packaged food items to evaluate additives, sodium, organic status, and sugar content.
              </Text>
              <TouchableOpacity
                style={styles.tabActionBtn}
                onPress={() => router.push('/scan')}
                activeOpacity={0.85}
              >
                <Text style={styles.tabActionBtnText}>Scan First Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 4: Profile & Preferences */}
        {activeTab === 'profile' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.tabHeaderRow}>
              <Text style={styles.tabHeading}>Profile & Preferences</Text>
            </View>

            {/* Profile Overview Card */}
            <View style={styles.profileBadgeCard}>
              <View style={styles.profileBadgeAvatar}>
                {currentUser.photoURL ? (
                  <Image source={{ uri: currentUser.photoURL }} style={styles.profileBadgeAvatarImg} />
                ) : (
                  <View style={styles.profileBadgeAvatarFallback}>
                    <Text style={styles.profileBadgeAvatarFallbackText}>{initialLetter}</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileBadgeInfo}>
                <Text style={styles.profileBadgeName}>{displayName}</Text>
                <Text style={styles.profileBadgeEmail}>{currentUser.email || 'No email attached'}</Text>
                <View style={styles.profileFirebasePill}>
                  <Feather name="shield" size={12} color={Colors.forestGreen} />
                  <Text style={styles.profileFirebasePillText}>Firebase Authenticated</Text>
                </View>
              </View>
            </View>

            {/* Feedback notification */}
            {profileFeedback && (
              <View style={styles.profileFeedbackBanner}>
                <Feather name="check-circle" size={15} color="#15803D" />
                <Text style={styles.profileFeedbackText}>{profileFeedback}</Text>
              </View>
            )}

            {/* 1. Edit Display Name */}
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>Display Name</Text>
              <Text style={styles.profileSectionSubtitle}>
                This name appears on your dashboard greeting and recommendations.
              </Text>
              <View style={styles.profileInputRow}>
                <TextInput
                  style={styles.profileTextInput}
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity
                  style={styles.profileSaveBtn}
                  onPress={() => handleSaveProfile()}
                  disabled={isSavingProfile}
                  activeOpacity={0.85}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.profileSaveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Profile Photo / Avatars */}
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>Profile Photo</Text>
              <Text style={styles.profileSectionSubtitle}>
                Select a preset avatar or paste an image URL.
              </Text>

              {/* Preset Avatars */}
              <View style={styles.presetsRow}>
                {PRESET_AVATARS.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.presetAvatarBtn,
                      currentUser.photoURL === p.uri && styles.presetAvatarBtnActive,
                    ]}
                    onPress={() => handleSaveProfile(p.uri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: p.uri }} style={styles.presetAvatarImg} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.profileInputRow}>
                <TextInput
                  style={styles.profileTextInput}
                  value={editPhotoURL}
                  onChangeText={setEditPhotoURL}
                  placeholder="Paste image URL (https://...)"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.profileSaveBtn}
                  onPress={() => handleSaveProfile()}
                  disabled={isSavingProfile}
                  activeOpacity={0.85}
                >
                  <Text style={styles.profileSaveBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Dietary Preferences (Isolated per User UID) */}
            <View style={styles.profileSectionCard}>
              <View style={styles.profileSectionHeaderRow}>
                <Text style={styles.profileSectionTitle}>Dietary Preferences</Text>
                <Text style={styles.prefCountBadge}>{userPreferences.length} Selected</Text>
              </View>
              <Text style={styles.profileSectionSubtitle}>
                LabelLens highlights flags and badges that match your lifestyle. Tap any tag to toggle.
              </Text>

              <View style={styles.dietaryChipsGrid}>
                {DIETARY_OPTIONS.map((option) => {
                  const isSelected = userPreferences.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dietaryChip,
                        isSelected && styles.dietaryChipActive,
                      ]}
                      onPress={() => handleTogglePreference(option)}
                      activeOpacity={0.75}
                    >
                      {isSelected && (
                        <Feather name="check" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.dietaryChipText,
                          isSelected && styles.dietaryChipTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Account Actions & Logout */}
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>Account & Session</Text>
              <Text style={styles.profileSectionSubtitle}>
                Signed in as {currentUser.email}
              </Text>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                disabled={isSigningOut}
                activeOpacity={0.85}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.signOutBtnText}>Log Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Development Session Indicator */}
        <View style={styles.devTagContainer}>
          <Feather name="check" size={14} color={Colors.forestGreen} />
          <Text style={styles.devTagText}>
            User Session: {currentUser.email}
          </Text>
        </View>
      </ScrollView>

      {/* 5. Bottom Navigation Dock */}
      <View style={styles.bottomNavDock}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Feather
            name="home"
            size={22}
            color={activeTab === 'home' ? Colors.forestGreen : Colors.textMuted}
          />
          <Text
            style={[
              styles.navItemLabel,
              activeTab === 'home' && styles.navItemLabelActive,
            ]}
          >
            Home
          </Text>
          {activeTab === 'home' && <View style={styles.navIndicatorDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Feather
            name="clock"
            size={22}
            color={activeTab === 'history' ? Colors.forestGreen : Colors.textMuted}
          />
          <Text
            style={[
              styles.navItemLabel,
              activeTab === 'history' && styles.navItemLabelActive,
            ]}
          >
            History
          </Text>
          {activeTab === 'history' && <View style={styles.navIndicatorDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('compare')}
          activeOpacity={0.7}
        >
          <Feather
            name="columns"
            size={22}
            color={activeTab === 'compare' ? Colors.forestGreen : Colors.textMuted}
          />
          <Text
            style={[
              styles.navItemLabel,
              activeTab === 'compare' && styles.navItemLabelActive,
            ]}
          >
            Compare
          </Text>
          {activeTab === 'compare' && <View style={styles.navIndicatorDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Feather
            name="user"
            size={22}
            color={activeTab === 'profile' ? Colors.forestGreen : Colors.textMuted}
          />
          <Text
            style={[
              styles.navItemLabel,
              activeTab === 'profile' && styles.navItemLabelActive,
            ]}
          >
            Profile
          </Text>
          {activeTab === 'profile' && <View style={styles.navIndicatorDot} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.4,
  },
  leafIconBadge: {
    marginLeft: 2,
  },
  greetingTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.sageGreen,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 20,
    paddingTop: 8,
  },
  cardStackLayer2: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: '100%',
    backgroundColor: '#D7E7DB',
    borderRadius: 24,
    opacity: 0.55,
    transform: [{ scaleX: 0.92 }, { translateY: -6 }],
  },
  cardStackLayer1: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: '100%',
    backgroundColor: '#E2EFE5',
    borderRadius: 24,
    opacity: 0.8,
    transform: [{ scaleX: 0.96 }, { translateY: -3 }],
  },
  carouselCard: {
    backgroundColor: '#EBF3ED',
    borderRadius: 24,
    padding: 18,
    minHeight: 142,
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(27, 67, 50, 0.1)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  carouselContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselTextContainer: {
    flex: 1,
    paddingRight: 14,
  },
  carouselTagBadge: {
    backgroundColor: 'rgba(27, 67, 50, 0.09)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  carouselTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.forestGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  carouselHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.forestGreen,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  carouselSubtext: {
    fontSize: 12.5,
    color: '#496A58',
    marginTop: 4,
    lineHeight: 17,
  },
  carouselImageFrame: {
    width: 92,
    height: 92,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(27, 67, 50, 0.1)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  circularScanSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  circularScanTouchTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
    position: 'relative',
  },
  scanPulseRingOuter: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(27, 67, 50, 0.08)',
  },
  scanPulseRingInner: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(45, 106, 79, 0.12)',
  },
  scanCircleButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  scanLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.forestGreen,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  scanSupportingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  galleryShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.leafGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
  },
  galleryShortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.forestGreen,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.forestGreen,
    textAlign: 'center',
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.forestGreen,
  },
  recentItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentItemThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  recentItemBrand: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: Colors.leafGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.forestGreen,
  },
  devTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.leafGreenMuted,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  devTagText: {
    fontSize: 12,
    color: Colors.forestGreen,
    fontWeight: '500',
  },
  bottomNavDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  navItemLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  navItemLabelActive: {
    color: Colors.forestGreen,
    fontWeight: '700',
  },
  navIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.forestGreen,
    marginTop: 2,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.sageGreen,
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 400,
  },
  authLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 14,
    fontWeight: '500',
  },
  signedOutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.1)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  signedOutLogoContainer: {
    marginBottom: 16,
  },
  signedOutTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.forestGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  signedOutSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signedOutButtonPrimary: {
    backgroundColor: Colors.forestGreen,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  signedOutButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  signedOutButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.forestGreen,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  signedOutButtonSecondaryText: {
    color: Colors.forestGreen,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyScansContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.08)',
    marginBottom: 14,
  },
  emptyScansIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyScansTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.forestGreen,
    marginBottom: 4,
  },
  emptyScansSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  tabContentContainer: {
    marginBottom: 20,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  tabHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.3,
  },
  clearHistoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  tabActionBtn: {
    backgroundColor: Colors.forestGreen,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 16,
  },
  tabActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  compareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.08)',
  },
  compareIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  compareTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.forestGreen,
    marginBottom: 6,
  },
  compareSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  profileBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.08)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileBadgeAvatar: {
    marginRight: 14,
  },
  profileBadgeAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.sageGreen,
  },
  profileBadgeAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.sageGreen,
  },
  profileBadgeAvatarFallbackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileBadgeInfo: {
    flex: 1,
  },
  profileBadgeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.3,
  },
  profileBadgeEmail: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileFirebasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.leafGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  profileFirebasePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  profileFeedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  profileFeedbackText: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
  },
  profileSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.08)',
  },
  profileSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.forestGreen,
    marginBottom: 3,
  },
  profileSectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  profileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileTextInput: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  profileSaveBtn: {
    backgroundColor: Colors.forestGreen,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  presetAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetAvatarBtnActive: {
    borderColor: Colors.forestGreen,
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  prefCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.forestGreen,
    backgroundColor: Colors.leafGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dietaryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dietaryChipActive: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  dietaryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  dietaryChipTextActive: {
    color: '#FFFFFF',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

