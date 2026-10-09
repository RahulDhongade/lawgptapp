import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { firestoreSyncService } from '../services/firestoreSync';
import { useAuthStore } from './authStore';

export type CaseStatus = 'PENDING' | 'HEARING' | 'DISPOSED' | 'EVIDENCE' | 'ARGUMENTS';

export interface TrackedCase {
  id: string;
  caseName: string;
  caseNumber: string;
  cnr?: string; // Manual entry only, no eCourts sync
  court: string;
  filingDate?: string;
  nextDate: string;
  status: CaseStatus;
  notes?: string;
  reminderEnabled: boolean;
  notificationId?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CaseState {
  cases: TrackedCase[];
  isLoading: boolean;
  loadCases: () => Promise<void>;
  addCase: (data: Omit<TrackedCase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCase: (id: string, updates: Partial<TrackedCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  scheduleReminder: (c: TrackedCase) => Promise<string | undefined>;
  cancelReminder: (notificationId?: string) => Promise<void>;
  clearAllCases: () => Promise<void>;
}

const STORAGE_KEY = 'lawgpt_case_diary_v1';

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [
    {
      id: 'case_seed_1',
      caseName: 'Ramesh Sharma v. State of Delhi',
      caseNumber: 'CRL.M.C. 1420/2024',
      cnr: 'DLHC010048292024',
      court: 'High Court of Delhi, New Delhi',
      filingDate: '2024-03-12',
      nextDate: '2025-05-18',
      status: 'HEARING',
      notes: 'Matter listed before Court No. 24 for final arguments on Section 482 BNSS petition.',
      reminderEnabled: true,
      isPinned: true,
      createdAt: '2024-03-12T10:00:00.000Z',
      updatedAt: '2024-07-01T10:00:00.000Z',
    },
    {
      id: 'case_seed_2',
      caseName: 'TechVibe Pvt Ltd v. Apex Logistics',
      caseNumber: 'ARB.A. 48/2023',
      cnr: '',
      court: 'District Commercial Court, Saket',
      filingDate: '2023-11-05',
      nextDate: '2025-06-22',
      status: 'EVIDENCE',
      notes: 'Cross-examination of claimant witness PW-1. File additional affidavits.',
      reminderEnabled: false,
      isPinned: false,
      createdAt: '2023-11-05T10:00:00.000Z',
      updatedAt: '2024-05-20T10:00:00.000Z',
    },
  ],
  isLoading: false,

  loadCases: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ cases: parsed });
        }
      }

      // If user is authenticated, sync with Cloud Firestore
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        const cloudCases = await firestoreSyncService.fetchCases(userId);
        if (cloudCases.length > 0) {
          const map = new Map<string, TrackedCase>();
          get().cases.forEach((c) => map.set(c.id, c));
          cloudCases.forEach((c) => map.set(c.id, c));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          set({ cases: merged });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      }

      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  scheduleReminder: async (c: TrackedCase): Promise<string | undefined> => {
    try {
      if (Platform.OS === 'web') return undefined;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return undefined;
      }

      // Schedule notification 24 hours before nextDate if valid date
      const targetDate = new Date(c.nextDate);
      const reminderTime = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
      const now = new Date();

      // If scheduled time is in future
      const triggerSeconds = Math.max(10, Math.floor((reminderTime.getTime() - now.getTime()) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Hearing Reminder: ${c.caseName}`,
          body: `Listed tomorrow at ${c.court} (Case: ${c.caseNumber})`,
          sound: true,
        },
        trigger: {
          seconds: triggerSeconds,
        } as any,
      });

      return notificationId;
    } catch {
      return undefined;
    }
  },

  cancelReminder: async (notificationId?: string) => {
    if (!notificationId || Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // ignore
    }
  },

  addCase: async (data) => {
    const newId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    let notificationId: string | undefined = undefined;
    if (data.reminderEnabled) {
      notificationId = await get().scheduleReminder({
        ...data,
        id: newId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    const created: TrackedCase = {
      ...data,
      id: newId,
      notificationId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updated = [created, ...get().cases];
    set({ cases: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.syncCase(userId, created);
    }

    return newId;
  },

  updateCase: async (id, updates) => {
    const existing = get().cases.find((c) => c.id === id);
    if (!existing) return;

    if (updates.reminderEnabled === false && existing.notificationId) {
      await get().cancelReminder(existing.notificationId);
      updates.notificationId = undefined;
    } else if (updates.reminderEnabled === true && !existing.reminderEnabled) {
      const scheduledId = await get().scheduleReminder({ ...existing, ...updates });
      updates.notificationId = scheduledId;
    }

    let updatedCase: TrackedCase | undefined = undefined;
    const updated = get().cases.map((c) => {
      if (c.id === id) {
        updatedCase = { ...c, ...updates, updatedAt: new Date().toISOString() };
        return updatedCase;
      }
      return c;
    });

    set({ cases: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId && updatedCase) {
      firestoreSyncService.syncCase(userId, updatedCase);
    }
  },

  deleteCase: async (id) => {
    const existing = get().cases.find((c) => c.id === id);
    if (existing?.notificationId) {
      await get().cancelReminder(existing.notificationId);
    }
    const updated = get().cases.filter((c) => c.id !== id);
    set({ cases: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Delete from Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.deleteCase(userId, id);
    }
  },

  togglePin: async (id) => {
    let updatedCase: TrackedCase | undefined = undefined;
    const updated = get().cases.map((c) => {
      if (c.id === id) {
        updatedCase = { ...c, isPinned: !c.isPinned, updatedAt: new Date().toISOString() };
        return updatedCase;
      }
      return c;
    });

    set({ cases: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId && updatedCase) {
      firestoreSyncService.syncCase(userId, updatedCase);
    }
  },

  clearAllCases: async () => {
    for (const c of get().cases) {
      if (c.notificationId) {
        await get().cancelReminder(c.notificationId);
      }
    }
    set({ cases: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
