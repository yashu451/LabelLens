import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanItem {
  id: string;
  name: string;
  brand: string;
  status: string;
  statusType: 'success' | 'warning' | 'info';
  calories?: string;
  score?: number;
  date: string;
  timestamp: number;
}

const PREF_PREFIX = '@labellens_preferences_';
const SCANS_PREFIX = '@labellens_scans_';

/**
 * Loads dietary preferences for a specific Firebase user UID
 */
export async function getUserPreferences(uid: string): Promise<string[]> {
  if (!uid) return [];
  try {
    const raw = await AsyncStorage.getItem(`${PREF_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[Storage] Failed to load preferences for user ${uid}:`, error);
    return [];
  }
}

/**
 * Saves dietary preferences for a specific Firebase user UID
 */
export async function saveUserPreferences(uid: string, preferences: string[]): Promise<void> {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(`${PREF_PREFIX}${uid}`, JSON.stringify(preferences));
  } catch (error) {
    console.warn(`[Storage] Failed to save preferences for user ${uid}:`, error);
  }
}

/**
 * Loads scan history for a specific Firebase user UID
 */
export async function getUserScans(uid: string): Promise<ScanItem[]> {
  if (!uid) return [];
  try {
    const raw = await AsyncStorage.getItem(`${SCANS_PREFIX}${uid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[Storage] Failed to load scans for user ${uid}:`, error);
    return [];
  }
}

/**
 * Saves a new scan item to the user's history
 */
export async function addUserScan(uid: string, scan: Omit<ScanItem, 'id' | 'timestamp'>): Promise<ScanItem[]> {
  if (!uid) return [];
  try {
    const existing = await getUserScans(uid);
    const newScan: ScanItem = {
      ...scan,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [newScan, ...existing];
    await AsyncStorage.setItem(`${SCANS_PREFIX}${uid}`, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn(`[Storage] Failed to add scan for user ${uid}:`, error);
    return [];
  }
}

/**
 * Clears scan history for a specific Firebase user UID
 */
export async function clearUserScans(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await AsyncStorage.removeItem(`${SCANS_PREFIX}${uid}`);
  } catch (error) {
    console.warn(`[Storage] Failed to clear scans for user ${uid}:`, error);
  }
}
