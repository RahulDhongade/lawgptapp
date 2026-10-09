import {
  StructuredAIChatResponseSchema,
  StructuredAIChatResponse,
} from '../src/api/types';
import { EMERGENCY_CONTACTS } from '../src/constants/emergency';

describe('StructuredAIChatResponseSchema (Phase 3 Zod Validation)', () => {
  const validMockData: StructuredAIChatResponse = {
    summary: 'Under Indian law, an arrest without a warrant can only occur for cognizable offenses.',
    relevantLaw: [
      {
        act: 'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
        section: 'Section 35',
        text: 'When police may arrest without warrant: (1) Any police officer may without an order from a Magistrate...',
        verified: true,
      },
      {
        act: 'Constitution of India',
        section: 'Article 22(1)',
        text: 'No person who is arrested shall be detained in custody without being informed of grounds.',
        verified: true,
      },
    ],
    explanationSteps: [
      {
        step: 1,
        title: 'Right to know grounds',
        description: 'Police must immediately inform you of the exact offense and reasons.',
      },
      {
        step: 2,
        title: 'Right to legal counsel',
        description: 'You have the constitutional right to consult an advocate of your choice.',
      },
    ],
    whatYouCanDo: [
      'Demand to inspect the police officer’s identification badge.',
      'Ask whether the alleged offense is bailable or non-bailable.',
      'Request the arrest memo to be signed by a local witness or family member.',
    ],
    crucialDirective: 'Do not resist physically, but state clearly that you wish to consult your advocate before making any statement.',
    citations: [
      {
        caseTitle: 'D.K. Basu v. State of West Bengal',
        citation: 'AIR 1997 SC 610',
        snippet: 'Guidelines laid down regarding arrest and detention to prevent custodial torture.',
      },
    ],
    riskLevel: 'HIGH',
    disclaimer: 'LawGPT provides informational guidance based on statutory legal texts. It does not constitute formal legal counsel.',
  };

  it('validates a complete, verified legal response', () => {
    const parseResult = StructuredAIChatResponseSchema.safeParse(validMockData);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.relevantLaw[0].verified).toBe(true);
      expect(parseResult.data.riskLevel).toBe('HIGH');
    }
  });

  it('validates an unverified legal response with AI explanation fallback', () => {
    const unverifiedData = {
      ...validMockData,
      relevantLaw: [
        {
          act: 'Local State Regulation',
          section: 'Clause 4',
          text: 'Unindexed clause text',
          verified: false,
        },
      ],
    };

    const parseResult = StructuredAIChatResponseSchema.safeParse(unverifiedData);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      expect(parseResult.data.relevantLaw[0].verified).toBe(false);
    }
  });

  it('rejects a response missing the crucialDirective field', () => {
    const invalidData = { ...validMockData };
    // @ts-expect-error Testing schema failure
    delete invalidData.crucialDirective;

    const parseResult = StructuredAIChatResponseSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('rejects a response with invalid riskLevel enum', () => {
    const invalidData = {
      ...validMockData,
      riskLevel: 'CRITICAL_URGENT', // not in LOW | MEDIUM | HIGH | EMERGENCY
    };

    const parseResult = StructuredAIChatResponseSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });

  it('rejects responses missing summary or relevantLaw array', () => {
    expect(StructuredAIChatResponseSchema.safeParse({}).success).toBe(false);
    expect(
      StructuredAIChatResponseSchema.safeParse({
        summary: 'Just text',
      }).success
    ).toBe(false);
  });
});

describe('Emergency Contacts Contract (Critical Rule 4: Emergency is NOT AI)', () => {
  it('contains all core statutory and emergency hotlines', () => {
    const numbers = EMERGENCY_CONTACTS.map((c) => c.number);
    expect(numbers).toContain('112'); // National Emergency
    expect(numbers).toContain('1930'); // National Cyber Fraud
    expect(numbers).toContain('1091'); // Women Distress Police
    expect(numbers).toContain('181'); // National Women Helpline
    expect(numbers).toContain('1098'); // Childline
    expect(numbers).toContain('15100'); // NALSA Free Legal Aid
  });

  it('every contact has officialSource and lastVerified date', () => {
    for (const contact of EMERGENCY_CONTACTS) {
      expect(contact.officialSource.length).toBeGreaterThan(0);
      expect(contact.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(contact.description.length).toBeGreaterThan(10);
    }
  });
});
