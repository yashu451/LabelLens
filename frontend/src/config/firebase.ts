import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  // @ts-expect-error getReactNativePersistence is available in React Native environment
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Avoid initializing Firebase more than once
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication with Expo Go / React Native persistence
let auth: Auth;

try {
  const persistence =
    Platform.OS === 'web'
      ? browserLocalPersistence
      : typeof getReactNativePersistence === 'function'
      ? getReactNativePersistence(AsyncStorage)
      : undefined;

  auth = initializeAuth(app, persistence ? { persistence } : undefined);
} catch {
  // If auth was already initialized (e.g. during Expo hot reload), retrieve existing instance
  auth = getAuth(app);
}

export { app, auth };

/**
 * Maps Firebase Auth error codes to helpful, user-friendly messages
 */
export function mapFirebaseAuthError(code: string, fallback?: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Firebase API key is missing or invalid in your .env configuration.';
    default:
      return fallback || 'Authentication failed. Please check your credentials and try again.';
  }
}

