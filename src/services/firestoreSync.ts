import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFirestoreDb } from '../config/firebase';
import { ChatConversation } from '../store/chatStore';
import { TrackedCase } from '../store/caseStore';
import { SavedItem } from '../store/savedStore';

/**
 * Strips undefined properties from objects to prevent Firestore rejection.
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export const firestoreSyncService = {
  // ==========================================
  // Chat Conversations
  // ==========================================

  async syncConversation(userId: string, conversation: ChatConversation): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'conversations', conversation.id);
      const data = sanitizeForFirestore(conversation);
      await setDoc(docRef, data, { merge: true });
    } catch {
      // Non-fatal, offline storage preserves message locally
    }
  },

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'conversations', conversationId);
      await deleteDoc(docRef);
    } catch {
      // Non-fatal
    }
  },

  async fetchConversations(userId: string): Promise<ChatConversation[]> {
    const db = getFirestoreDb();
    if (!db || !userId) return [];

    try {
      const colRef = collection(db, 'users', userId, 'conversations');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: ChatConversation[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as ChatConversation);
      });
      return items;
    } catch {
      return [];
    }
  },

  // ==========================================
  // Tracked Legal Cases
  // ==========================================

  async syncCase(userId: string, caseData: TrackedCase): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'cases', caseData.id);
      const data = sanitizeForFirestore(caseData);
      await setDoc(docRef, data, { merge: true });
    } catch {
      // Non-fatal
    }
  },

  async deleteCase(userId: string, caseId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'cases', caseId);
      await deleteDoc(docRef);
    } catch {
      // Non-fatal
    }
  },

  async fetchCases(userId: string): Promise<TrackedCase[]> {
    const db = getFirestoreDb();
    if (!db || !userId) return [];

    try {
      const colRef = collection(db, 'users', userId, 'cases');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: TrackedCase[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as TrackedCase);
      });
      return items;
    } catch {
      return [];
    }
  },

  // ==========================================
  // Saved Library & Bookmarks
  // ==========================================

  async syncSavedItem(userId: string, item: SavedItem): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'savedItems', item.id);
      const data = sanitizeForFirestore(item);
      await setDoc(docRef, data, { merge: true });
    } catch {
      // Non-fatal
    }
  },

  async deleteSavedItem(userId: string, itemId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !userId) return;

    try {
      const docRef = doc(db, 'users', userId, 'savedItems', itemId);
      await deleteDoc(docRef);
    } catch {
      // Non-fatal
    }
  },

  async fetchSavedItems(userId: string): Promise<SavedItem[]> {
    const db = getFirestoreDb();
    if (!db || !userId) return [];

    try {
      const colRef = collection(db, 'users', userId, 'savedItems');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: SavedItem[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as SavedItem);
      });
      return items;
    } catch {
      return [];
    }
  },
};
