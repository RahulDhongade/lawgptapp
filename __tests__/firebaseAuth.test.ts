jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import {
  isFirebaseConfigured,
  mapFirebaseAuthError,
  firebaseConfig,
} from '../src/config/firebase';
import { useAuthStore } from '../src/store/authStore';

describe('Firebase Auth & Config Test Suite', () => {
  const originalApiKey = firebaseConfig.apiKey;
  const originalProjectId = firebaseConfig.projectId;

  afterEach(() => {
    firebaseConfig.apiKey = originalApiKey;
    firebaseConfig.projectId = originalProjectId;
  });

  describe('isFirebaseConfigured', () => {
    it('returns false when credentials are empty strings', () => {
      firebaseConfig.apiKey = '';
      firebaseConfig.projectId = '';
      expect(isFirebaseConfigured()).toBe(false);
    });

    it('returns false when placeholder strings are present', () => {
      firebaseConfig.apiKey = 'YOUR_API_KEY';
      firebaseConfig.projectId = 'YOUR_PROJECT_ID';
      expect(isFirebaseConfigured()).toBe(false);
    });

    it('returns true when valid credentials are provided', () => {
      firebaseConfig.apiKey = 'AIzaSyA_RealFirebaseKey123';
      firebaseConfig.projectId = 'lawgpt-production-app';
      expect(isFirebaseConfigured()).toBe(true);
    });
  });

  describe('mapFirebaseAuthError', () => {
    it('maps auth/invalid-email correctly', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/invalid-email' });
      expect(msg).toContain('invalid or poorly formatted');
    });

    it('maps auth/wrong-password correctly', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/wrong-password' });
      expect(msg).toContain('Incorrect email or password');
    });

    it('maps auth/user-not-found correctly', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/user-not-found' });
      expect(msg).toContain('No account exists');
    });

    it('maps auth/email-already-in-use correctly', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/email-already-in-use' });
      expect(msg).toContain('already exists');
    });

    it('maps auth/weak-password correctly', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/weak-password' });
      expect(msg).toContain('Password is too weak');
    });

    it('maps auth/operation-not-allowed with helpful instruction', () => {
      const msg = mapFirebaseAuthError({ code: 'auth/operation-not-allowed' });
      expect(msg).toContain('Firebase Console');
      expect(msg).toContain('Email/Password');
    });

    it('falls back to custom message or generic authentication error', () => {
      const msg = mapFirebaseAuthError({ message: 'Custom network glitch' });
      expect(msg).toBe('Custom network glitch');

      const fallback = mapFirebaseAuthError(null);
      expect(fallback).toBe('Authentication error. Please try again.');
    });
  });

  describe('useAuthStore Integration', () => {
    it('starts with expected guest session state', () => {
      const store = useAuthStore.getState();
      store.startGuestSession();

      const state = useAuthStore.getState();
      expect(state.isGuest).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('logs in successfully in demo mode when Firebase is not configured', async () => {
      firebaseConfig.apiKey = '';
      firebaseConfig.projectId = '';

      const store = useAuthStore.getState();
      await store.login({
        identifier: 'advocate@chambers.in',
        password: 'Password123!',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isGuest).toBe(false);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('advocate.rajesh@chambers.in');
    });

    it('logs out and clears session state cleanly', async () => {
      const store = useAuthStore.getState();
      await store.logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
