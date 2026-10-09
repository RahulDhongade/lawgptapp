import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestoreSyncService } from '../services/firestoreSync';
import { useAuthStore } from './authStore';

export type SavedItemType = 'response' | 'section' | 'document';

export interface SavedItem {
  id: string;
  type: SavedItemType;
  title: string;
  category: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface SavedState {
  items: SavedItem[];
  isLoading: boolean;
  saveItem: (item: Omit<SavedItem, 'id' | 'createdAt'>) => Promise<string>;
  removeItem: (id: string) => Promise<void>;
  isSaved: (titleOrId: string) => boolean;
  exportAllAsJson: () => string;
  clearAll: () => Promise<void>;
  loadSavedItems: () => Promise<void>;
}

const STORAGE_KEY = 'lawgpt_saved_library_v1';

export const useSavedStore = create<SavedState>((set, get) => ({
  items: [
    {
      id: 'seed_saved_1',
      type: 'response',
      title: 'Arrest Rights under Section 47 & 50 BNSS',
      category: 'Criminal',
      content: 'Police must inform arrested person of full particulars of the offence and right to bail. Memorandum of arrest must be attested by a family member or respectable citizen.',
      metadata: { act: 'BNSS 2023', verified: true },
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'seed_saved_2',
      type: 'section',
      title: 'Section 318 BNS (Cheating)',
      category: 'BNS Section',
      content: 'Replaces IPC 420. Dishonestly inducing delivery of property punishable with imprisonment up to 7 years and fine.',
      metadata: { act: 'BNS 2023', ipcRef: 'IPC 420' },
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  isLoading: false,

  loadSavedItems: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ items: parsed });
        }
      }

      // If user is authenticated, sync with Cloud Firestore
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        const cloudItems = await firestoreSyncService.fetchSavedItems(userId);
        if (cloudItems.length > 0) {
          const map = new Map<string, SavedItem>();
          get().items.forEach((i) => map.set(i.id, i));
          cloudItems.forEach((i) => map.set(i.id, i));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          set({ items: merged });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      }

      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  saveItem: async (newItemData) => {
    const newItem: SavedItem = {
      ...newItemData,
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...get().items];
    set({ items: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage failure
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.syncSavedItem(userId, newItem);
    }

    return newItem.id;
  },

  removeItem: async (id: string) => {
    const updated = get().items.filter((item) => item.id !== id);
    set({ items: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Delete from Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.deleteSavedItem(userId, id);
    }
  },

  isSaved: (titleOrId: string) => {
    return get().items.some(
      (item) => item.id === titleOrId || item.title.toLowerCase() === titleOrId.toLowerCase()
    );
  },

  exportAllAsJson: () => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        standard: 'DPDP Act 2023 Data Portability Specification',
        appName: 'LawGPT India',
        totalItems: get().items.length,
        items: get().items,
      },
      null,
      2
    );
  },

  clearAll: async () => {
    set({ items: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
