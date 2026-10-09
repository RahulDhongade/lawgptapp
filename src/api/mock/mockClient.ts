import {
  AuthResponse,
  LoginPayload,
  SignUpPayload,
  GuestQuotaResponse,
  StructuredAIChatResponse,
  AppConfig,
  StructuredAIChatResponseSchema,
  DocumentAnalysisResult,
  DocumentAnalysisResultSchema,
} from '../types';
import {
  mockUsers,
  mockAppConfig,
  mockArrestRightsResponse,
  mockUnverifiedResponse,
} from './fixtures';
import { getCategorizedLegalResponse } from './qaEngine';

// In-memory guest quota tracker keyed by deviceId
const guestQuotaMap = new Map<string, number>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockClient = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    await delay(500);

    const isAdvocate =
      payload.identifier.toLowerCase().includes('adv') ||
      payload.identifier.toLowerCase().includes('rajesh');
    const isAdmin = payload.identifier.toLowerCase().includes('admin');

    const selectedUser = isAdmin
      ? mockUsers.admin
      : isAdvocate
      ? mockUsers.advocate
      : mockUsers.citizen;

    return {
      tokens: {
        accessToken: `mock_jwt_access_${Date.now()}`,
        refreshToken: `mock_jwt_refresh_${Date.now()}`,
      },
      user: selectedUser,
    };
  },

  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    await delay(600);

    const newUser = {
      id: `usr_${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      mobile: payload.mobile,
      role: payload.role,
      barCouncilNumber: payload.barCouncilNumber || null,
      createdAt: new Date().toISOString(),
    };

    return {
      tokens: {
        accessToken: `mock_jwt_access_${Date.now()}`,
        refreshToken: `mock_jwt_refresh_${Date.now()}`,
      },
      user: newUser,
    };
  },

  async sendOtp(mobile: string): Promise<{ success: boolean; message: string }> {
    await delay(400);
    return {
      success: true,
      message: `OTP dispatched to +91 ${mobile}`,
    };
  },

  async verifyOtp(mobile: string, otp: string): Promise<AuthResponse> {
    await delay(500);
    return {
      tokens: {
        accessToken: `mock_jwt_access_otp_${Date.now()}`,
        refreshToken: `mock_jwt_refresh_otp_${Date.now()}`,
      },
      user: mockUsers.citizen,
    };
  },

  async getGuestQuota(deviceId: string): Promise<GuestQuotaResponse> {
    await delay(200);
    if (!guestQuotaMap.has(deviceId)) {
      guestQuotaMap.set(deviceId, 3);
    }
    const remaining = guestQuotaMap.get(deviceId)!;

    return {
      remainingQueries: remaining,
      maxQueries: 3,
      isLimitReached: remaining <= 0,
      deviceId,
    };
  },

  async useGuestQuery(deviceId: string): Promise<GuestQuotaResponse> {
    await delay(300);
    if (!guestQuotaMap.has(deviceId)) {
      guestQuotaMap.set(deviceId, 3);
    }
    let remaining = guestQuotaMap.get(deviceId)!;
    if (remaining > 0) {
      remaining -= 1;
      guestQuotaMap.set(deviceId, remaining);
    }

    return {
      remainingQueries: remaining,
      maxQueries: 3,
      isLimitReached: remaining <= 0,
      deviceId,
    };
  },

  resetGuestQuota(deviceId?: string): void {
    if (deviceId) {
      guestQuotaMap.set(deviceId, 3);
    } else {
      guestQuotaMap.clear();
    }
  },

  async fetchConfig(): Promise<AppConfig> {
    await delay(200);
    return mockAppConfig;
  },

  async askLegalQuestion(
    query: string,
    mode: 'std' | 'plain' = 'std'
  ): Promise<StructuredAIChatResponse> {
    await delay(200);

    const rawResponse = getCategorizedLegalResponse(query, mode);

    // Critical Rule 3: Validate with Zod before returning
    const parsed = StructuredAIChatResponseSchema.parse(rawResponse);
    return parsed;
  },

  /**
   * SSE / Chunked streaming simulation with cancellation support
   */
  async streamLegalQuestion(
    query: string,
    onChunk: (chunk: string) => void,
    onComplete: (response: StructuredAIChatResponse) => void,
    signal?: { aborted: boolean }
  ): Promise<void> {
    const fullResponse = await this.askLegalQuestion(query);
    const words = fullResponse.summary.split(' ');

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) {
        return;
      }
      await delay(25);
      onChunk(words[i] + ' ');
    }

    if (!signal?.aborted) {
      onComplete(fullResponse);
    }
  },

  async analyzeDocument(fileName: string, fileSize: number): Promise<import('../types').DocumentAnalysisResult> {
    await delay(1200);

    const isLease =
      fileName.toLowerCase().includes('rent') ||
      fileName.toLowerCase().includes('lease') ||
      fileName.toLowerCase().includes('agree');

    const sampleResult: import('../types').DocumentAnalysisResult = {
      documentType: isLease
        ? 'Residential Tenancy Agreement (11 Months)'
        : 'Commercial Service Agreement & NDA',
      summary: isLease
        ? 'Standard residential leave and license agreement between Landlord and Tenant with 11-month tenure, security deposit, and lock-in covenants.'
        : 'Service delivery contract with confidentiality covenants, unilateral termination rights, and penalty clauses for delayed deliverables.',
      parties: isLease
        ? ['First Party / Licensor: Sh. Satish Narang', 'Second Party / Licensee: Sh. Rohit Verma']
        : ['Party A: Horizon Digital Solutions Pvt. Ltd.', 'Party B: Apex Vendor Services'],
      importantDates: [
        {
          label: 'Commencement Date',
          date: '01 April 2025',
          description: 'Effective date for rights and obligations to begin.',
        },
        {
          label: 'Lock-in Expiry Date',
          date: '30 September 2025',
          description: 'Minimum duration of 6 months during which premature termination incurs forfeiture.',
        },
        {
          label: 'Agreement Expiry Date',
          date: '28 February 2026',
          description: 'Formal termination of the 11-month term unless renewed in writing.',
        },
      ],
      keyClauses: [
        {
          clauseNumber: 'Clause 4',
          heading: 'Security Deposit & Deductions',
          plainExplanation:
            'Security deposit of ₹1,00,000 is interest-free and refundable within 15 days of handover, subject to deductions for painting and electricity arrears.',
          risk: 'MEDIUM',
        },
        {
          clauseNumber: 'Clause 7',
          heading: 'Unilateral Rent Escalation',
          plainExplanation:
            'The agreement gives the first party right to revise terms with 15 days notice rather than mutual consent.',
          risk: 'HIGH',
        },
        {
          clauseNumber: 'Clause 12',
          heading: 'Jurisdiction & Dispute Resolution',
          plainExplanation:
            'Courts at Bengaluru/Mumbai have exclusive jurisdiction. Arbitration seated at local district forum.',
          risk: 'LOW',
        },
      ],
      pointsNeedingAttention: [
        'Notice Period Asymmetry: Clause 9 allows First Party to terminate with 15 days notice, but requires Second Party to serve 60 days notice.',
        'Stamp Duty Status: Document does not indicate registration number or e-stamp certificate details. Verify mandatory state registration requirements.',
        'Maintenance Responsibility: Structural repairs are undefined; ensure clarification on landlord vs tenant liability for water seepage.',
      ],
      isSample: true,
    };

    return DocumentAnalysisResultSchema.parse(sampleResult);
  },
};
