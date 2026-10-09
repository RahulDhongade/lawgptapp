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

import { firestoreSyncService } from '../src/services/firestoreSync';
import { ChatConversation } from '../src/store/chatStore';
import { TrackedCase } from '../src/store/caseStore';
import { SavedItem } from '../src/store/savedStore';

describe('Firestore Sync Service Suite', () => {
  describe('Offline & Unconfigured Fallback Gracefulness', () => {
    it('handles syncConversation gracefully when database is unconfigured', async () => {
      const mockConvo: ChatConversation = {
        id: 'test_conv_1',
        title: 'BNS 103 Murder queries',
        lastMessageSnippet: 'Life imprisonment or death penalty',
        updatedAt: new Date().toISOString(),
        messages: [],
      };

      await expect(
        firestoreSyncService.syncConversation('test_user_id', mockConvo)
      ).resolves.not.toThrow();
    });

    it('returns empty array on fetchConversations when unconfigured', async () => {
      const result = await firestoreSyncService.fetchConversations('test_user_id');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('handles deleteConversation gracefully when unconfigured', async () => {
      await expect(
        firestoreSyncService.deleteConversation('test_user_id', 'test_conv_1')
      ).resolves.not.toThrow();
    });

    it('handles syncCase gracefully when unconfigured', async () => {
      const mockCase: TrackedCase = {
        id: 'case_test_1',
        caseName: 'State v. Rahul',
        caseNumber: 'FIR 102/2024',
        court: 'Patiala House Court',
        nextDate: '2025-10-15',
        status: 'HEARING',
        reminderEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(
        firestoreSyncService.syncCase('test_user_id', mockCase)
      ).resolves.not.toThrow();
    });

    it('returns empty array on fetchCases when unconfigured', async () => {
      const result = await firestoreSyncService.fetchCases('test_user_id');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('handles syncSavedItem gracefully when unconfigured', async () => {
      const mockItem: SavedItem = {
        id: 'saved_test_1',
        type: 'response',
        title: 'Anticipatory Bail rules BNSS 482',
        category: 'Criminal',
        content: 'Bail conditions under Section 482 BNSS',
        createdAt: new Date().toISOString(),
      };

      await expect(
        firestoreSyncService.syncSavedItem('test_user_id', mockItem)
      ).resolves.not.toThrow();
    });

    it('returns empty array on fetchSavedItems when unconfigured', async () => {
      const result = await firestoreSyncService.fetchSavedItems('test_user_id');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('handles empty or missing userId gracefully without error', async () => {
      await expect(
        firestoreSyncService.fetchConversations('')
      ).resolves.toEqual([]);
      await expect(
        firestoreSyncService.fetchCases('')
      ).resolves.toEqual([]);
      await expect(
        firestoreSyncService.fetchSavedItems('')
      ).resolves.toEqual([]);
    });
  });
});
