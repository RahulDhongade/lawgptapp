import {
  UserProfile,
  AuthResponse,
  GuestQuotaResponse,
  StructuredAIChatResponse,
  AppConfig,
} from '../types';

export const mockUsers: Record<string, UserProfile> = {
  citizen: {
    id: 'usr_cit_101',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    mobile: '9876543210',
    role: 'citizen',
    barCouncilNumber: null,
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  advocate: {
    id: 'usr_adv_202',
    fullName: 'Adv. Rajesh Kumar',
    email: 'advocate.rajesh@chambers.in',
    mobile: '9876543211',
    role: 'advocate',
    barCouncilNumber: 'MAH/1482/2019',
    createdAt: '2023-11-20T14:30:00.000Z',
  },
  admin: {
    id: 'usr_adm_999',
    fullName: 'LawGPT Systems Admin',
    email: 'admin@lawgpt.in',
    mobile: '9876543212',
    role: 'admin',
    barCouncilNumber: 'D/892/2012',
    createdAt: '2023-01-01T00:00:00.000Z',
  },
};

export const mockAppConfig: AppConfig = {
  bnsActVersion: '2023.2-Amended',
  bnsStatus: 'Bare Acts Live',
  minAppVersion: '1.0.0',
  maintenanceMode: false,
  guestMaxQueries: 3,
  emergencyNumbersVerifiedDate: '2024-07-01',
};

/**
 * Stitch Screen Match: AI Legal Chat Screen Response
 * Has verified: true on Section 47 & 50 BNSS 2023
 */
export const mockArrestRightsResponse: StructuredAIChatResponse = {
  summary:
    'Under Indian Law (BNSS 2023 & Article 22), police must inform you of the grounds of arrest, allow you to contact a lawyer or family, and mandatorily present you before a Judicial Magistrate within 24 hours.',
  relevantLaw: [
    {
      act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
      section: 'Section 47 & 50 BNSS 2023 (replacing Sec 50 & 57 CrPC)',
      text: 'Mandatory obligation on police to notify nominated family member and present arrestee to magistrate within 24 hours.',
      verified: true, // TRIGGERS GREEN VERIFIED SOURCE BADGE
    },
    {
      act: 'Constitution of India',
      section: 'Article 22(1) & (2)',
      text: 'Protection against arrest and detention in certain cases; right to consult legal practitioner.',
      verified: true, // TRIGGERS GREEN VERIFIED SOURCE BADGE
    },
  ],
  explanationSteps: [
    {
      step: 1,
      title: 'Right to Know Grounds',
      description:
        'Must be informed immediately of specific allegations and whether the offense is bailable.',
    },
    {
      step: 2,
      title: 'Right to Counsel',
      description:
        'Allowed to consult and be defended by a legal practitioner of your choice during interrogation.',
    },
    {
      step: 3,
      title: 'Free Legal Aid',
      description:
        'State-mandated legal representation if indigent or unable to engage a private attorney.',
    },
    {
      step: 4,
      title: 'Protection for Women',
      description:
        'No female can be arrested after sunset and before sunrise except with prior Judicial Magistrate sanction and a female officer.',
    },
  ],
  whatYouCanDo: [
    'Demand an Arrest Memo recording exact time, location, and signed by at least one respectable local witness or family member.',
    'Request an immediate statutory medical examination under Section 53 BNSS to record physical state.',
  ],
  crucialDirective:
    'Do not sign blank papers under duress. Maintain composure and insist on your right to telephone your family or an advocate immediately.',
  citations: [
    {
      caseTitle: 'D.K. Basu v. State of West Bengal',
      citation: 'AIR 1997 SC 610',
      snippet:
        'Constitutional guidelines on arrest memos, custody inspections, and mandatory medical examination.',
    },
    {
      caseTitle: 'Sec 47, Bharatiya Nagarik Suraksha Sanhita',
      citation: 'BNSS Act 2023',
      snippet:
        'Replaces Section 50 CrPC; imperative obligation on police to notify family or nominee upon arrest.',
    },
  ],
  riskLevel: 'HIGH',
  disclaimer:
    'General legal reference intelligence. Does not establish an attorney-client relationship. In an active trial or arrest, consult an advocate immediately.',
};

/**
 * Test case for unverified citation (verified: false)
 * Shows grey "AI explanation" badge according to Critical Rule 2!
 */
export const mockUnverifiedResponse: StructuredAIChatResponse = {
  summary:
    'Anticipatory bail is a pre-arrest directive granting bail in anticipation of an arrest on accusation of having committed a non-bailable offence.',
  relevantLaw: [
    {
      act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
      section: 'Section 482 BNSS 2023 (formerly Sec 438 CrPC)',
      text: 'Direction for grant of bail to person apprehending arrest.',
      verified: false, // CRITICAL RULE 2: SHOWS GREY "AI EXPLANATION" BADGE
    },
  ],
  explanationSteps: [
    {
      step: 1,
      title: 'Filing in Sessions Court or High Court',
      description:
        'Application can be moved before the Court of Session or the High Court.',
    },
    {
      step: 2,
      title: 'Interim Protection',
      description:
        'Court may issue notice to the Public Prosecutor while granting interim bail protection.',
    },
  ],
  whatYouCanDo: [
    'Engage a defense advocate to draft an anticipatory bail petition.',
    'Keep proof of false implication or bona fide circumstances ready.',
  ],
  crucialDirective:
    'Do not evade police summons without a protective court order.',
  citations: [
    {
      caseTitle: 'Sushila Aggarwal v. State (NCT of Delhi)',
      citation: '(2020) 5 SCC 1',
      snippet:
        'Constitution Bench ruling on the scope and longevity of anticipatory bail orders.',
    },
  ],
  riskLevel: 'MEDIUM',
  disclaimer:
    'LawGPT provides general statutory information. It is not a substitute for advice from a qualified legal professional.',
};
