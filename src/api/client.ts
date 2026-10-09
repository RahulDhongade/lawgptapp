import * as SecureStore from 'expo-secure-store';
import {
  AuthResponse,
  LoginPayload,
  SignUpPayload,
  GuestQuotaResponse,
  StructuredAIChatResponse,
  AppConfig,
} from './types';
import { mockClient } from './mock/mockClient';
import { geminiClient } from './geminiClient';
import { mapApiError } from './errors';

const TOKEN_KEY = 'lawgpt_jwt_access_token';
const REFRESH_KEY = 'lawgpt_jwt_refresh_token';

const isMockMode = process.env.EXPO_PUBLIC_API_MODE !== 'live';

export const apiClient = {
  // Token management strictly in SecureStore (Rule 8)
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    } catch {
      // In web fallback, SecureStore may not be natively supported
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, accessToken);
        window.localStorage.setItem(REFRESH_KEY, refreshToken);
      }
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_KEY);
      }
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      if (isMockMode) {
        const res = await mockClient.login(payload);
        await this.saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
        return res;
      }
      throw new Error('Live backend not configured');
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    try {
      if (isMockMode) {
        const res = await mockClient.signUp(payload);
        await this.saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
        return res;
      }
      throw new Error('Live backend not configured');
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async sendOtp(mobile: string): Promise<{ success: boolean; message: string }> {
    try {
      return await mockClient.sendOtp(mobile);
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async verifyOtp(mobile: string, otp: string): Promise<AuthResponse> {
    try {
      const res = await mockClient.verifyOtp(mobile, otp);
      await this.saveTokens(res.tokens.accessToken, res.tokens.refreshToken);
      return res;
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async getGuestQuota(deviceId: string): Promise<GuestQuotaResponse> {
    try {
      return await mockClient.getGuestQuota(deviceId);
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async useGuestQuery(deviceId: string): Promise<GuestQuotaResponse> {
    try {
      return await mockClient.useGuestQuery(deviceId);
    } catch (err) {
      throw mapApiError(err);
    }
  },

  resetGuestQuota(deviceId?: string): void {
    mockClient.resetGuestQuota(deviceId);
  },

  async fetchConfig(): Promise<AppConfig> {
    try {
      return await mockClient.fetchConfig();
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async askLegalQuestion(
    query: string,
    mode: 'std' | 'plain' = 'std'
  ): Promise<StructuredAIChatResponse> {
    try {
      // 1. Check Gemini generative AI if API key is provided
      const geminiAnswer = await geminiClient.generateLegalAnswer(query, mode);
      if (geminiAnswer) {
        return geminiAnswer;
      }
      return await mockClient.askLegalQuestion(query, mode);
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async streamLegalQuestion(
    query: string,
    onChunk: (chunk: string) => void,
    onComplete: (response: StructuredAIChatResponse) => void,
    signal?: { aborted: boolean }
  ): Promise<void> {
    try {
      const fullResponse = await this.askLegalQuestion(query);
      const words = fullResponse.summary.split(' ');

      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) {
          return;
        }
        await new Promise((r) => setTimeout(r, 20));
        onChunk(words[i] + ' ');
      }

      if (!signal?.aborted) {
        onComplete(fullResponse);
      }
    } catch (err) {
      throw mapApiError(err);
    }
  },

  async analyzeDocument(
    fileName: string,
    fileSize: number
  ): Promise<import('./types').DocumentAnalysisResult> {
    try {
      return await mockClient.analyzeDocument(fileName, fileSize);
    } catch (err) {
      throw mapApiError(err);
    }
  },
};

export * from './types';
export * from './errors';
export { geminiClient } from './geminiClient';
