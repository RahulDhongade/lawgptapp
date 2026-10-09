import { z } from 'zod';

// ==========================================
// Authentication & User Types
// ==========================================

export type UserRole = 'citizen' | 'advocate' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  barCouncilNumber?: string | null;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export interface LoginPayload {
  identifier: string; // Email or 10-digit mobile
  password?: string;
  otp?: string;
  rememberMe?: boolean;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  mobile: string;
  password?: string;
  role: UserRole;
  barCouncilNumber?: string | null;
  agreedToTerms: boolean;
}

export interface GuestQuotaResponse {
  remainingQueries: number;
  maxQueries: number;
  isLimitReached: boolean;
  deviceId: string;
}

// ==========================================
// Structured AI Legal Chat Response (Zod)
// ==========================================

export const RelevantLawItemSchema = z.object({
  act: z.string().min(1),
  section: z.string().min(1),
  text: z.string().min(1),
  verified: z.boolean().default(false), // Enforcing Critical Rule 2: Never default to true
});

export const ExplanationStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const CitationItemSchema = z.object({
  caseTitle: z.string().min(1),
  citation: z.string().min(1),
  snippet: z.string().min(1),
});

export const StructuredAIChatResponseSchema = z.object({
  summary: z.string().min(1),
  relevantLaw: z.array(RelevantLawItemSchema).min(1),
  explanationSteps: z.array(ExplanationStepSchema).min(1),
  whatYouCanDo: z.array(z.string()).min(1),
  crucialDirective: z.string().min(1),
  citations: z.array(CitationItemSchema).default([]),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('LOW'),
  disclaimer: z.string().default(
    'LawGPT provides general statutory information. It is not a substitute for advice from a qualified legal professional.'
  ),
});

export type RelevantLawItem = z.infer<typeof RelevantLawItemSchema>;
export type ExplanationStep = z.infer<typeof ExplanationStepSchema>;
export type CitationItem = z.infer<typeof CitationItemSchema>;
export type StructuredAIChatResponse = z.infer<typeof StructuredAIChatResponseSchema>;

// ==========================================
// App Configuration
// ==========================================

export interface AppConfig {
  bnsActVersion: string;
  bnsStatus: string;
  minAppVersion: string;
  maintenanceMode: boolean;
  guestMaxQueries: number;
  emergencyNumbersVerifiedDate: string;
}

// ==========================================
// Document Analysis Schemas (Zod)
// ==========================================

export const ImportantDateItemSchema = z.object({
  label: z.string(),
  date: z.string(),
  description: z.string(),
});

export const KeyClauseItemSchema = z.object({
  clauseNumber: z.string(),
  heading: z.string(),
  plainExplanation: z.string(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export const DocumentAnalysisResultSchema = z.object({
  documentType: z.string().min(1),
  summary: z.string().min(1),
  parties: z.array(z.string()).min(1),
  importantDates: z.array(ImportantDateItemSchema).default([]),
  keyClauses: z.array(KeyClauseItemSchema).min(1),
  pointsNeedingAttention: z.array(z.string()).min(1),
  isSample: z.boolean().default(true),
});

export type ImportantDateItem = z.infer<typeof ImportantDateItemSchema>;
export type KeyClauseItem = z.infer<typeof KeyClauseItemSchema>;
export type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;
