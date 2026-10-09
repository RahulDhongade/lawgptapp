import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { StructuredAIChatResponse, StructuredAIChatResponseSchema } from './types';

const STORAGE_KEY_GEMINI_KEY = 'lawgpt_gemini_api_key';

export const geminiClient = {
  /**
   * Retrieves the configured Gemini API key from environment variable or hardware-backed SecureStore
   */
  async getApiKey(): Promise<string | null> {
    const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }
    try {
      // 1. Primary: hardware-backed SecureStore
      const secureKey = await SecureStore.getItemAsync(STORAGE_KEY_GEMINI_KEY);
      if (secureKey && secureKey.trim().length > 0) {
        return secureKey.trim();
      }

      // 2. Migration fallback: check legacy AsyncStorage and migrate if found
      const legacyKey = await AsyncStorage.getItem(STORAGE_KEY_GEMINI_KEY);
      if (legacyKey && legacyKey.trim().length > 0) {
        await SecureStore.setItemAsync(STORAGE_KEY_GEMINI_KEY, legacyKey.trim());
        await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
        return legacyKey.trim();
      }
      return null;
    } catch {
      // Graceful fallback for non-native test environments
      try {
        const fallback = await AsyncStorage.getItem(STORAGE_KEY_GEMINI_KEY);
        return fallback && fallback.trim().length > 0 ? fallback.trim() : null;
      } catch {
        return null;
      }
    }
  },

  /**
   * Saves a user-provided Gemini API key to hardware-backed SecureStore
   */
  async setApiKey(key: string): Promise<void> {
    const trimmed = key.trim();
    try {
      if (!trimmed) {
        await SecureStore.deleteItemAsync(STORAGE_KEY_GEMINI_KEY);
        await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY_GEMINI_KEY, trimmed);
        await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      }
    } catch {
      // Fallback for non-native test environments
      try {
        if (!trimmed) {
          await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
        } else {
          await AsyncStorage.setItem(STORAGE_KEY_GEMINI_KEY, trimmed);
        }
      } catch {
        // ignore
      }
    }
  },

  /**
   * Generates a conversational, structured legal response using Google Gemini API
   */
  async generateLegalAnswer(
    query: string,
    mode: 'std' | 'plain' = 'std'
  ): Promise<StructuredAIChatResponse | null> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const systemPrompt = `You are LawGPT, an authoritative, helpful, and empathetic AI Legal Assistant specializing in Indian Law.
Your goal is to answer the user's question directly, clearly, and conversationally (like ChatGPT), while providing accurate Indian statutory references (including the new Bharatiya Nyaya Sanhita 2023, Bharatiya Nagarik Suraksha Sanhita 2023, Bharatiya Sakshya Adhiniyam 2023, Constitution of India, and relevant central/state acts).

Tone: ${mode === 'plain' ? 'Simple, easy-to-understand layman terms in plain language' : 'Professional, balanced, statutory legal guidance'}.

Respond strictly in valid JSON matching this exact schema:
{
  "summary": "A comprehensive, direct, conversational explanation answering the user's specific question in 2-4 sentences (speak directly to the user as LawGPT)",
  "relevantLaw": [
    {
      "act": "Name of Statute (e.g. Bharatiya Nyaya Sanhita, 2023)",
      "section": "Section number (e.g. Section 318)",
      "text": "Brief verbatim summary of the statutory rule",
      "verified": true
    }
  ],
  "explanationSteps": [
    {
      "step": 1,
      "title": "Clear step title",
      "description": "Practical explanation of this step"
    }
  ],
  "whatYouCanDo": [
    "Immediate practical action 1",
    "Immediate practical action 2"
  ],
  "crucialDirective": "Most critical warning, legal pitfall to avoid, or urgent directive",
  "citations": [
    {
      "caseTitle": "Landmark Supreme Court / High Court case title",
      "citation": "AIR / SCC citation",
      "snippet": "Core legal principle established"
    }
  ],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "disclaimer": "General legal intelligence under Indian law. Does not constitute formal attorney-client representation."
}
Only output pure JSON. Do not wrap in markdown quotes or extra text.`;

    const sanitizedQuery = (query || '').trim().slice(0, 4000);
    if (!sanitizedQuery) {
      return null;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: sanitizedQuery }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed = JSON.parse(rawText);
      const validated = StructuredAIChatResponseSchema.parse(parsed);
      return validated;
    } catch {
      return null;
    }
  },
};
