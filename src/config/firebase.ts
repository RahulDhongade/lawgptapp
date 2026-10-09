import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  Auth,
  User,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Project Configuration
 * These values are injected via Expo environment variables (EXPO_PUBLIC_FIREBASE_*).
 * The user can provide their own credentials in the .env file.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Validates whether real Firebase credentials are provided.
 * Gracefully returns false if placeholders or empty keys are present,
 * enabling seamless offline / mock demo mode without runtime crashes.
 */
export const isFirebaseConfigured = (): boolean => {
  const apiKey = firebaseConfig.apiKey.trim();
  const projectId = firebaseConfig.projectId.trim();

  if (!apiKey || !projectId) {
    return false;
  }

  // Detect unreplaced template placeholders
  if (apiKey.includes('YOUR_') || projectId.includes('YOUR_')) {
    return false;
  }

  return true;
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

/**
 * Safely initializes or retrieves the singleton Firebase App instance.
 */
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!appInstance) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      appInstance = existingApps[0];
    } else {
      appInstance = initializeApp(firebaseConfig);
    }
  }

  return appInstance;
};

/**
 * Safely initializes or retrieves the singleton Firebase Auth instance
 * with AsyncStorage persistence for React Native / mobile sessions.
 */
export const getFirebaseAuth = (): Auth | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!authInstance) {
    const app = getFirebaseApp();
    if (!app) return null;

    try {
      let persistence: any = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const authPkg = require('firebase/auth');
        if (typeof authPkg.getReactNativePersistence === 'function') {
          persistence = authPkg.getReactNativePersistence(AsyncStorage);
        }
      } catch {
        // Fallback gracefully
      }

      if (persistence) {
        authInstance = initializeAuth(app, { persistence });
      } else {
        authInstance = getAuth(app);
      }
    } catch {
      // In case of Fast Refresh or re-initialization
      authInstance = getAuth(app);
    }
  }

  return authInstance;
};

let firestoreInstance: Firestore | null = null;

/**
 * Safely initializes or retrieves the singleton Cloud Firestore instance.
 */
export const getFirestoreDb = (): Firestore | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!firestoreInstance) {
    const app = getFirebaseApp();
    if (!app) return null;

    try {
      firestoreInstance = getFirestore(app);
    } catch {
      // In case of Fast Refresh or re-initialization
      firestoreInstance = null;
    }
  }

  return firestoreInstance;
};

/**
 * Human-friendly error translation for Firebase Authentication error codes.
 */
export const mapFirebaseAuthError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid or poorly formatted.';
    case 'auth/user-disabled':
      return 'This user account has been deactivated. Please contact support.';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please provide at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Go to Authentication > Sign-in method and enable Email/Password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access has been temporarily throttled. Please try again later.';
    default:
      return error?.message || 'Authentication error. Please try again.';
  }
};

/**
 * Sign in existing user with email and password via Firebase Auth.
 */
export const firebaseSignIn = async (
  email: string,
  pass: string
): Promise<UserCredential> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please check your .env credentials.');
  }
  return await signInWithEmailAndPassword(auth, email, pass);
};

/**
 * Create a new user with email, password and display name via Firebase Auth.
 */
export const firebaseSignUp = async (
  email: string,
  pass: string,
  displayName?: string
): Promise<UserCredential> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please check your .env credentials.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && credential.user) {
    try {
      await updateProfile(credential.user, { displayName });
    } catch {
      // Non-fatal, profile can be updated later
    }
  }
  return credential;
};

/**
 * Sign out current user from Firebase Auth.
 */
export const firebaseSignOut = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
};

/**
 * Send password reset email via Firebase Auth.
 */
export const firebaseSendPasswordReset = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please check your .env credentials.');
  }
  await sendPasswordResetEmail(auth, email);
};

/**
 * Subscribe to Firebase Auth state changes.
 */
export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
