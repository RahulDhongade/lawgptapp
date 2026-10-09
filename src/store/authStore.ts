import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, LoginPayload, SignUpPayload } from '../api/types';
import { apiClient } from '../api/client';
import { useGuestStore } from './guestStore';
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignOut,
  firebaseSendPasswordReset,
  mapFirebaseAuthError,
} from '../config/firebase';

const USER_PROFILE_STORAGE_KEY = '@lawgpt_user_profile';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
  isFirebaseMode: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  startGuestSession: () => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  error: null,
  isFirebaseMode: isFirebaseConfigured(),

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      // 1. If Firebase is configured and user provides email/password, authenticate with Firebase
      if (isFirebaseConfigured() && payload.identifier.includes('@') && payload.password) {
        const credential = await firebaseSignIn(payload.identifier.trim(), payload.password);
        const fbUser = credential.user;
        const token = await fbUser.getIdToken();

        // Retrieve local profile metadata (role, barCouncilNumber) if previously stored
        let cachedProfile: Partial<UserProfile> = {};
        try {
          const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.id === fbUser.uid || parsed.email === fbUser.email) {
              cachedProfile = parsed;
            }
          }
        } catch {
          // ignore cache read failure
        }

        const userProfile: UserProfile = {
          id: fbUser.uid,
          fullName: fbUser.displayName || cachedProfile.fullName || 'LawGPT Member',
          email: fbUser.email || payload.identifier,
          mobile: cachedProfile.mobile || '',
          role: cachedProfile.role || 'citizen',
          barCouncilNumber: cachedProfile.barCouncilNumber || null,
          createdAt: cachedProfile.createdAt || new Date().toISOString(),
        };

        await apiClient.saveTokens(token, '');
        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userProfile));

        set({
          user: userProfile,
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
          isFirebaseMode: true,
        });
        return;
      }

      // 2. Fallback to sovereign mock / local demo client
      const res = await apiClient.login(payload);
      set({
        user: res.user,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        isFirebaseMode: isFirebaseConfigured(),
      });
    } catch (err: any) {
      const errorMsg = isFirebaseConfigured() && payload.identifier.includes('@')
        ? mapFirebaseAuthError(err)
        : (err.userMessage || 'Login failed');
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  signUp: async (payload: SignUpPayload) => {
    set({ isLoading: true, error: null });
    try {
      // 1. If Firebase is configured and email/password provided, register in Firebase Auth
      if (isFirebaseConfigured() && payload.email && payload.password) {
        const credential = await firebaseSignUp(
          payload.email.trim(),
          payload.password,
          payload.fullName
        );
        const fbUser = credential.user;
        const token = await fbUser.getIdToken();

        const userProfile: UserProfile = {
          id: fbUser.uid,
          fullName: payload.fullName || fbUser.displayName || 'Legal Professional',
          email: fbUser.email || payload.email,
          mobile: payload.mobile || '',
          role: payload.role || 'citizen',
          barCouncilNumber: payload.role === 'advocate' ? payload.barCouncilNumber : null,
          createdAt: new Date().toISOString(),
        };

        await apiClient.saveTokens(token, '');
        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userProfile));

        set({
          user: userProfile,
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
          isFirebaseMode: true,
        });
        return;
      }

      // 2. Fallback to mock / demo client
      const res = await apiClient.signUp(payload);
      set({
        user: res.user,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        isFirebaseMode: isFirebaseConfigured(),
      });
    } catch (err: any) {
      const errorMsg = isFirebaseConfigured()
        ? mapFirebaseAuthError(err)
        : (err.userMessage || 'Sign up failed');
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      if (isFirebaseConfigured()) {
        await firebaseSendPasswordReset(email.trim());
      }
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = isFirebaseConfigured()
        ? mapFirebaseAuthError(err)
        : 'Password reset request failed.';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  startGuestSession: () => {
    useGuestStore.getState().resetQuota();
    set({
      user: null,
      isAuthenticated: false,
      isGuest: true,
      isLoading: false,
      error: null,
    });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (isFirebaseConfigured()) {
        await firebaseSignOut();
      }
    } catch {
      // Non-fatal logout error
    }
    await apiClient.clearTokens();
    await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    set({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      // 1. If Firebase is configured, check if current active Firebase user exists
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth();
        if (auth?.currentUser) {
          const fbUser = auth.currentUser;
          let cachedProfile: Partial<UserProfile> = {};
          try {
            const raw = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
            if (raw) cachedProfile = JSON.parse(raw);
          } catch {
            // ignore
          }

          set({
            user: {
              id: fbUser.uid,
              fullName: fbUser.displayName || cachedProfile.fullName || 'LawGPT Member',
              email: fbUser.email || '',
              mobile: cachedProfile.mobile || '',
              role: cachedProfile.role || 'citizen',
              barCouncilNumber: cachedProfile.barCouncilNumber || null,
              createdAt: cachedProfile.createdAt || new Date().toISOString(),
            },
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
            isFirebaseMode: true,
          });
          return;
        }
      }

      // 2. Check token from SecureStore (for demo / mock persistence)
      const token = await apiClient.getAccessToken();
      if (token) {
        set({
          user: {
            id: 'usr_restored',
            fullName: 'Adv. Rajesh Kumar',
            email: 'advocate.rajesh@chambers.in',
            mobile: '9876543211',
            role: 'advocate',
            barCouncilNumber: 'MAH/1482/2019',
            createdAt: '2023-11-20T14:30:00.000Z',
          },
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
          isFirebaseMode: isFirebaseConfigured(),
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
