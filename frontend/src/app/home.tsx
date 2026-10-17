import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'compare' | 'profile'>('home');

  const recentScans = [
    {
      id: '1',
      name: 'Organic Granola',
      brand: "Nature's Path",
      status: 'Good Choice',
      statusType: 'success',
      calories: '250 kcal',
      date: 'Today, 9:24 AM',
    },
    {
      id: '2',
      name: 'Greek Yogurt',
      brand: 'Chobani',
      status: 'High Protein',
      statusType: 'success',
      calories: '130 kcal',
      date: 'Yesterday, 4:12 PM',
    },
  ];

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
            <Text style={styles.greetingSmall}>Good morning,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>Sarah</Text>
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
            <Image
              source={require('../../assets/images/avatar-sarah.jpg')}
              style={styles.avatarImage}
            />
            <View style={styles.avatarOnlineDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or scan..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Card: Scan Food Label */}
        <TouchableOpacity
          style={styles.scanHeroCard}
          activeOpacity={0.9}
          onPress={() => {
            // Placeholder for Scan camera in next milestone
          }}
        >
          <View style={styles.cameraIconBox}>
            <Feather name="camera" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.scanCardTextContainer}>
            <Text style={styles.scanCardTitle}>Scan Food Label</Text>
            <Text style={styles.scanCardSubtitle}>Use camera or upload image</Text>
          </View>
          <View style={styles.chevronBox}>
            <Feather name="chevron-right" size={22} color="rgba(255, 255, 255, 0.7)" />
          </View>
        </TouchableOpacity>

        {/* Quick Actions: 3 Feature Cards */}
        <View style={styles.quickActionsRow}>
          {/* Card 1: Scan History */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => setActiveTab('history')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="clock" size={18} color="#D97706" />
            </View>
            <Text style={styles.actionCardTitle}>Scan History</Text>
            <Text style={styles.actionCardSubtitle}>View past 24 scans</Text>
          </TouchableOpacity>

          {/* Card 2: Compare Products */}
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

          {/* Card 3: Dietary Preferences */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => setActiveTab('profile')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="sliders" size={18} color="#0284C7" />
            </View>
            <Text style={styles.actionCardTitle}>Dietary Preferences</Text>
            <Text style={styles.actionCardSubtitle}>Set your needs</Text>
          </TouchableOpacity>
        </View>

        {/* Motivational Card */}
        <View style={styles.motivationalCard}>
          <View style={styles.motivationalTextContainer}>
            <Text style={styles.motivationalHeading}>
              Small changes make a big difference
            </Text>
            <Text style={styles.motivationalSubtext}>
              Choose food that chooses you back.
            </Text>
          </View>
          <View style={styles.motivationalImageFrame}>
            <Image
              source={require('../../assets/images/home-wellness-card.jpg')}
              style={styles.motivationalImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Recent Scans Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => setActiveTab('history')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentScans.map((item) => (
          <View key={item.id} style={styles.recentItemCard}>
            <View style={styles.recentItemThumb}>
              <Feather name="package" size={20} color={Colors.forestGreen} />
            </View>
            <View style={styles.recentItemInfo}>
              <Text style={styles.recentItemName}>{item.name}</Text>
              <Text style={styles.recentItemBrand}>{item.brand} • {item.date}</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>
        ))}

        {/* Development Milestone Indicator */}
        <View style={styles.devTagContainer}>
          <Feather name="check" size={14} color={Colors.forestGreen} />
          <Text style={styles.devTagText}>
            Development Session: Logged in directly to Home Dashboard
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Dock */}
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
    marginBottom: 20,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scanHeroCard: {
    backgroundColor: Colors.forestGreen,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  cameraIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCardTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  scanCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scanCardSubtitle: {
    fontSize: 13,
    color: Colors.sageLight,
    marginTop: 3,
  },
  chevronBox: {
    paddingLeft: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
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
  motivationalCard: {
    backgroundColor: '#EBF3ED',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.06)',
  },
  motivationalTextContainer: {
    flex: 1.2,
    paddingRight: 10,
  },
  motivationalHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.forestGreen,
    lineHeight: 20,
  },
  motivationalSubtext: {
    fontSize: 12,
    color: '#496A58',
    marginTop: 6,
    lineHeight: 16,
  },
  motivationalImageFrame: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  motivationalImage: {
    width: '100%',
    height: '100%',
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
});
