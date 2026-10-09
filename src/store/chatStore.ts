import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StructuredAIChatResponse } from '../api/types';
import { firestoreSyncService } from '../services/firestoreSync';
import { useAuthStore } from './authStore';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  queryText?: string;
  structuredResponse?: StructuredAIChatResponse;
  rawTextFallback?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessageSnippet: string;
  updatedAt: string; // ISO date string
  messages: ChatMessage[];
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
  createConversation: (initialQuery: string, initialAnswer?: StructuredAIChatResponse) => Promise<string>;
  appendMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearAllConversations: () => Promise<void>;
}

const STORAGE_KEY = 'lawgpt_chat_conversations_v1';

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [
    {
      id: 'conv_seed_1',
      title: 'Arrest rights under BNSS 2023',
      lastMessageSnippet: 'Memorandum of arrest must be attested by a family member or respectable citizen.',
      updatedAt: new Date().toISOString(), // Today
      messages: [
        {
          id: 'msg_seed_1',
          sender: 'user',
          timestamp: '09:42 AM',
          queryText: 'What are my rights if I am arrested by police in India?',
        },
      ],
    },
    {
      id: 'conv_seed_2',
      title: 'Police verification guidelines',
      lastMessageSnippet: 'Checklist of verified documentation needed for tenant and employee verification.',
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // Yesterday
      messages: [
        {
          id: 'msg_seed_2',
          sender: 'user',
          timestamp: '04:15 PM',
          queryText: 'Police verification guidelines for tenants in Mumbai',
        },
      ],
    },
    {
      id: 'conv_seed_3',
      title: 'Cheating section in new law',
      lastMessageSnippet: 'Section 318 BNS replaces IPC 420 for cheating and dishonestly inducing property.',
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(), // Previous 7 days
      messages: [
        {
          id: 'msg_seed_3',
          sender: 'user',
          timestamp: '11:20 AM',
          queryText: 'Which section of BNS replaces 420 IPC?',
        },
      ],
    },
    {
      id: 'conv_seed_4',
      title: 'Cyber fraud UPI freeze protocol',
      lastMessageSnippet: 'Dial 1930 within the golden hour to freeze disputed funds in recipient bank.',
      updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(), // Older
      messages: [
        {
          id: 'msg_seed_4',
          sender: 'user',
          timestamp: '02:00 PM',
          queryText: 'How to report UPI fraud within 1 hour?',
        },
      ],
    },
  ],
  activeConversationId: null,
  isLoading: false,

  loadConversations: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ conversations: parsed });
        }
      }

      // If user is authenticated, sync with Cloud Firestore
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        const cloudConvs = await firestoreSyncService.fetchConversations(userId);
        if (cloudConvs.length > 0) {
          const map = new Map<string, ChatConversation>();
          get().conversations.forEach((c) => map.set(c.id, c));
          cloudConvs.forEach((c) => map.set(c.id, c));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          set({ conversations: merged });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      }

      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createConversation: async (initialQuery, initialAnswer) => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMessages: ChatMessage[] = [
      {
        id: `msg_${Date.now()}_u`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        queryText: initialQuery,
      },
    ];

    if (initialAnswer) {
      newMessages.push({
        id: `msg_${Date.now()}_a`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structuredResponse: initialAnswer,
      });
    }

    const newConv: ChatConversation = {
      id,
      title: initialQuery.length > 40 ? initialQuery.substring(0, 37) + '...' : initialQuery,
      lastMessageSnippet: initialAnswer?.summary || initialQuery,
      updatedAt: nowIso,
      messages: newMessages,
    };

    const updated = [newConv, ...get().conversations];
    set({ conversations: updated, activeConversationId: id });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.syncConversation(userId, newConv);
    }

    return id;
  },

  appendMessage: async (conversationId, message) => {
    let updatedConv: ChatConversation | undefined = undefined;

    const updated = get().conversations.map((conv) => {
      if (conv.id === conversationId) {
        updatedConv = {
          ...conv,
          updatedAt: new Date().toISOString(),
          lastMessageSnippet: message.queryText || message.structuredResponse?.summary || 'Message',
          messages: [...conv.messages, message],
        };
        return updatedConv;
      }
      return conv;
    });

    set({ conversations: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Sync to Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId && updatedConv) {
      firestoreSyncService.syncConversation(userId, updatedConv);
    }
  },

  deleteConversation: async (id) => {
    const updated = get().conversations.filter((c) => c.id !== id);
    set({ conversations: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Delete from Cloud Firestore if authenticated
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      firestoreSyncService.deleteConversation(userId, id);
    }
  },

  clearAllConversations: async () => {
    set({ conversations: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
