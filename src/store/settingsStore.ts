import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage } from '../i18n';
import i18n from '../i18n';

interface SettingsState {
  language: SupportedLanguage;
  hasSeenOnboarding: boolean;
  hasAcceptedConsent: boolean;
  biometricLockEnabled: boolean;
  isAppLocked: boolean;
  initSettings: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  setOnboardingDone: () => Promise<void>;
  setConsentAccepted: () => Promise<void>;
  setBiometricLock: (enabled: boolean) => Promise<void>;
  unlockApp: () => void;
  lockApp: () => void;
  resetAllSettings: () => Promise<void>;
}

const SETTINGS_STORAGE_KEY = 'lawgpt_settings_v1';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  hasSeenOnboarding: false,
  hasAcceptedConsent: false,
  biometricLockEnabled: false,
  isAppLocked: false,

  initSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.language) {
          i18n.changeLanguage(parsed.language);
        }
        set({
          language: parsed.language || 'en',
          hasSeenOnboarding: !!parsed.hasSeenOnboarding,
          hasAcceptedConsent: !!parsed.hasAcceptedConsent,
          biometricLockEnabled: !!parsed.biometricLockEnabled,
          isAppLocked: !!parsed.biometricLockEnabled,
        });
      }
    } catch {
      // ignore
    }
  },

  setLanguage: async (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    set({ language: lang });
    try {
      const current = get();
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          language: lang,
          hasSeenOnboarding: current.hasSeenOnboarding,
          hasAcceptedConsent: current.hasAcceptedConsent,
          biometricLockEnabled: current.biometricLockEnabled,
        })
      );
    } catch {
      // ignore
    }
  },

  setOnboardingDone: async () => {
    set({ hasSeenOnboarding: true });
    try {
      const current = get();
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          language: current.language,
          hasSeenOnboarding: true,
          hasAcceptedConsent: current.hasAcceptedConsent,
          biometricLockEnabled: current.biometricLockEnabled,
        })
      );
    } catch {
      // ignore
    }
  },

  setConsentAccepted: async () => {
    set({ hasAcceptedConsent: true });
    try {
      const current = get();
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          language: current.language,
          hasSeenOnboarding: current.hasSeenOnboarding,
          hasAcceptedConsent: true,
          biometricLockEnabled: current.biometricLockEnabled,
        })
      );
    } catch {
      // ignore
    }
  },

  setBiometricLock: async (enabled: boolean) => {
    set({ biometricLockEnabled: enabled });
    try {
      const current = get();
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          language: current.language,
          hasSeenOnboarding: current.hasSeenOnboarding,
          hasAcceptedConsent: current.hasAcceptedConsent,
          biometricLockEnabled: enabled,
        })
      );
    } catch {
      // ignore
    }
  },

  unlockApp: () => {
    set({ isAppLocked: false });
  },

  lockApp: () => {
    if (get().biometricLockEnabled) {
      set({ isAppLocked: true });
    }
  },

  resetAllSettings: async () => {
    set({
      language: 'en',
      hasSeenOnboarding: false,
      hasAcceptedConsent: false,
      biometricLockEnabled: false,
      isAppLocked: false,
    });
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
