import { create } from 'zustand';
import { apiClient } from '../api/client';

interface GuestState {
  remainingQueries: number;
  maxQueries: number;
  isLimitReached: boolean;
  deviceId: string;
  checkQuota: () => Promise<void>;
  consumeQuery: () => Promise<boolean>; // Returns true if allowed, false if limit reached
  resetQuota: () => void;
}

const DEFAULT_DEVICE_ID = 'dev_lawgpt_mobile_guest';

export const useGuestStore = create<GuestState>((set, get) => ({
  remainingQueries: 3,
  maxQueries: 3,
  isLimitReached: false,
  deviceId: DEFAULT_DEVICE_ID,

  checkQuota: async () => {
    try {
      const res = await apiClient.getGuestQuota(get().deviceId);
      set({
        remainingQueries: res.remainingQueries,
        maxQueries: res.maxQueries,
        isLimitReached: res.isLimitReached,
      });
    } catch {
      // Fallback
    }
  },

  consumeQuery: async () => {
    try {
      const current = get().remainingQueries;
      if (current <= 0) {
        set({ isLimitReached: true });
        return false;
      }

      const res = await apiClient.useGuestQuery(get().deviceId);
      set({
        remainingQueries: res.remainingQueries,
        isLimitReached: res.isLimitReached,
      });
      return true;
    } catch {
      return false;
    }
  },

  resetQuota: () => {
    apiClient.resetGuestQuota(get().deviceId);
    set({
      remainingQueries: 3,
      isLimitReached: false,
    });
  },
}));
