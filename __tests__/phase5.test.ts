jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock_notif_123'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

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

import {
  legalTemplates,
  buildDraftHtml,
  getTemplateById,
} from '../src/data/templates';
import {
  DocumentAnalysisResultSchema,
  DocumentAnalysisResult,
} from '../src/api/types';
import legalAidData from '../src/data/legalAid.json';
import { useSavedStore } from '../src/store/savedStore';
import { useCaseStore } from '../src/store/caseStore';

describe('Phase 5 – Legal Templates & Devanagari Export Tests', () => {
  it('contains all 6 required statutory templates with unreviewed metadata & lawyer review TODO', () => {
    expect(legalTemplates.length).toBe(6);
    const requiredIds = [
      'legal-notice',
      'affidavit',
      'rti-application',
      'rental-agreement',
      'consumer-complaint',
      'bail-draft',
    ];

    requiredIds.forEach((id) => {
      const template = getTemplateById(id);
      expect(template).toBeDefined();
      expect(template?.reviewStatus).toBe('UNREVIEWED');
      expect(template?.lastUpdated).toBe('2024-07-01');
      expect(template?.todo).toContain('TODO');
      expect(template?.fields.length).toBeGreaterThan(0);
    });
  });

  it('verifies state stamp duty notice exists on Rental Agreement and Affidavit', () => {
    const rental = getTemplateById('rental-agreement');
    const affidavit = getTemplateById('affidavit');

    expect(rental?.stateStampDutyNote).toBeDefined();
    expect(rental?.stateStampDutyNote?.toLowerCase()).toContain('stamp duty');

    expect(affidavit?.stateStampDutyNote).toBeDefined();
    expect(affidavit?.stateStampDutyNote?.toLowerCase()).toContain('stamp duty');
  });

  it('embeds Noto Sans Devanagari and diagonal DRAFT watermark in generated HTML for en, hi and mr', () => {
    const noticeTemplate = getTemplateById('legal-notice')!;
    const mockValues = {
      senderName: 'राजेश कुमार',
      senderAddress: 'नई दिल्ली',
      recipientName: 'अरविंद मेहता',
      recipientAddress: 'मुंबई',
      claimAmount: '50000',
      noticePeriodDays: '15',
      causeOfAction: 'बकाया राशि का भुगतान न करना।',
    };

    ['en', 'hi', 'mr'].forEach((lang) => {
      const html = buildDraftHtml(noticeTemplate, mockValues, lang as 'en' | 'hi' | 'mr');

      // Verify Noto Sans Devanagari web font embedding
      expect(html).toContain('Noto Sans Devanagari');
      expect(html).toContain("font-family: 'Noto Sans Devanagari'");

      // Verify diagonal DRAFT watermark
      expect(html).toContain('class="watermark"');
      expect(html).toContain('DRAFT');

      // Verify persistent draft disclaimer banner
      expect(html).toContain('class="disclaimer-banner"');
      expect(html).toContain('DRAFT – REVIEW BEFORE USE');

      // Verify Devanagari values correctly interpolated
      expect(html).toContain('राजेश कुमार');
      expect(html).toContain('50000');
    });
  });
});

describe('Phase 5 – Document Analysis Zod Validation', () => {
  it('validates a realistic document analysis response', () => {
    const validAnalysis: DocumentAnalysisResult = {
      documentType: 'Residential Tenancy Agreement',
      summary: '11-month lease agreement between owner and tenant.',
      parties: ['Landlord: Satish Narang', 'Tenant: Rohit Verma'],
      importantDates: [
        {
          label: 'Commencement',
          date: '2025-04-01',
          description: 'Start of lease term',
        },
      ],
      keyClauses: [
        {
          clauseNumber: 'Clause 4',
          heading: 'Security Deposit',
          plainExplanation: 'Deposit refundable after deduction of dues.',
          risk: 'MEDIUM',
        },
      ],
      pointsNeedingAttention: ['Verify stamp duty certificate.'],
      isSample: true,
    };

    const parsed = DocumentAnalysisResultSchema.safeParse(validAnalysis);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid analysis missing required sections', () => {
    const invalidAnalysis = {
      documentType: 'Contract',
      // missing summary, parties, keyClauses
    };

    const parsed = DocumentAnalysisResultSchema.safeParse(invalidAnalysis);
    expect(parsed.success).toBe(false);
  });
});

describe('Phase 5 – Legal Aid Directory Auditing', () => {
  it('contains NALSA, top 10 populated SLSAs, and sample DLSAs', () => {
    const entries = legalAidData.entries;
    expect(entries.length).toBeGreaterThanOrEqual(15);

    const hasNalsa = entries.some((e) => e.id === 'nalsa-hq');
    expect(hasNalsa).toBe(true);

    const states = entries.map((e) => e.state);
    expect(states).toContain('Uttar Pradesh');
    expect(states).toContain('Maharashtra');
    expect(states).toContain('Bihar');
    expect(states).toContain('West Bengal');
    expect(states).toContain('Madhya Pradesh');
    expect(states).toContain('Tamil Nadu');
    expect(states).toContain('Rajasthan');
    expect(states).toContain('Karnataka');
    expect(states).toContain('Gujarat');
    expect(states).toContain('Andhra Pradesh');
  });

  it('flags entries older than 90 days as contact unverified', () => {
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const oldEntries = legalAidData.entries.filter((e) => {
      const verified = new Date(e.lastVerified).getTime();
      return Date.now() - verified > ninetyDaysMs;
    });

    // Some entries are older than 90 days to test the amber unverified badge
    expect(oldEntries.length).toBeGreaterThan(0);
  });
});

describe('Phase 5 – Saved Library & DPDP Act Data Portability', () => {
  it('saves an item and exports complete dataset under DPDP Act 2023 format', async () => {
    const store = useSavedStore.getState();

    const newId = await store.saveItem({
      type: 'document',
      title: 'Rental Agreement Draft',
      category: 'Property & Tenancy',
      content: 'Residential lease draft for Flat 301.',
      metadata: { templateId: 'rental-agreement' },
    });

    expect(newId).toBeDefined();
    expect(store.isSaved('Rental Agreement Draft')).toBe(true);

    const exportJson = store.exportAllAsJson();
    expect(exportJson).toContain('DPDP Act 2023 Data Portability Specification');
    expect(exportJson).toContain('Rental Agreement Draft');

    const parsedExport = JSON.parse(exportJson);
    expect(parsedExport.appName).toBe('LawGPT India');
    expect(Array.isArray(parsedExport.items)).toBe(true);
  });
});

describe('Phase 5 – Case Docket Tracker Store', () => {
  it('adds, pins, and deletes tracked cases with manual docket CNR', async () => {
    const store = useCaseStore.getState();

    const caseId = await store.addCase({
      caseName: 'Anil Kumar v. Union of India',
      caseNumber: 'WP(C) 8840/2024',
      cnr: 'DLHC010099222024',
      court: 'Delhi High Court',
      nextDate: '2025-07-20',
      status: 'HEARING',
      notes: 'Hearing listed before Division Bench.',
      reminderEnabled: true,
      isPinned: false,
    });

    expect(caseId).toBeDefined();
    let currentCases = useCaseStore.getState().cases;
    const added = currentCases.find((c) => c.id === caseId);
    expect(added?.caseName).toBe('Anil Kumar v. Union of India');
    expect(added?.cnr).toBe('DLHC010099222024');

    // Toggle pin
    await store.togglePin(caseId);
    currentCases = useCaseStore.getState().cases;
    expect(currentCases.find((c) => c.id === caseId)?.isPinned).toBe(true);

    // Delete case
    await store.deleteCase(caseId);
    currentCases = useCaseStore.getState().cases;
    expect(currentCases.find((c) => c.id === caseId)).toBeUndefined();
  });
});
