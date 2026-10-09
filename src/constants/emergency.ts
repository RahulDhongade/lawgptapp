/**
 * National Legal & Emergency Helpline Contacts
 * CRITICAL RULE 4: Emergency is NOT AI.
 * Fully static, bundled, works 100% offline, zero model dependency.
 *
 * NOTE: VERIFY BEFORE RELEASE.
 * Last Verified Date: 2024-07-01
 * Source: Ministry of Home Affairs & NALSA, Government of India
 */

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'POLICE' | 'CYBER' | 'WOMEN' | 'CHILD' | 'LEGAL_AID';
  description: string;
  lastVerified: string;
  officialSource: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'emg_112',
    name: 'National Emergency Helpline',
    number: '112',
    category: 'POLICE',
    description: 'All-in-one emergency number for police, fire, and medical ambulance dispatch across all Indian States.',
    lastVerified: '2024-07-01',
    officialSource: 'Ministry of Home Affairs, Government of India',
  },
  {
    id: 'emg_1930',
    name: 'National Cyber Financial Fraud Helpline',
    number: '1930',
    category: 'CYBER',
    description: 'Immediate reporting of unauthorized UPI, net-banking, and credit card debit scams. Call within the Golden Hour to freeze fund transfers.',
    lastVerified: '2024-07-01',
    officialSource: 'Indian Cyber Crime Coordination Centre (I4C)',
  },
  {
    id: 'emg_1091',
    name: 'Women in Distress Police Helpline',
    number: '1091',
    category: 'WOMEN',
    description: '24x7 dedicated emergency police assistance for women facing harassment, assault, or threats.',
    lastVerified: '2024-07-01',
    officialSource: 'State Police Departments & National Commission for Women',
  },
  {
    id: 'emg_181',
    name: 'National Women Helpline (One Stop Centre)',
    number: '181',
    category: 'WOMEN',
    description: 'Toll-free 24-hour emergency counseling, medical aid, legal aid, and shelter referral for women affected by violence.',
    lastVerified: '2024-07-01',
    officialSource: 'Ministry of Women and Child Development',
  },
  {
    id: 'emg_1098',
    name: 'Childline Emergency Helpline',
    number: '1098',
    category: 'CHILD',
    description: 'National 24-hour emergency service for children in need of care, protection, and legal intervention.',
    lastVerified: '2024-07-01',
    officialSource: 'Ministry of Women and Child Development',
  },
  {
    id: 'emg_15100',
    name: 'NALSA Legal Aid National Toll-Free',
    number: '15100',
    category: 'LEGAL_AID',
    description: 'National Legal Services Authority helpline providing free legal counseling and government-appointed advocates.',
    lastVerified: '2024-07-01',
    officialSource: 'National Legal Services Authority (NALSA)',
  },
];
