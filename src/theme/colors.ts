/**
 * Sovereign Legal Interface - Color Tokens
 * Source of Truth: /design/stitch_lawgpt_mobile_ui_design_system/sovereign_legal_interface/DESIGN.md
 */

export const colors = {
  // Canvas & Surfaces
  background: '#0B1020', // Abyssal navy-black canvas
  surface: '#0E1323',
  surfaceContainerLowest: '#080D1D',
  surfaceContainerLow: '#161B2B',
  surfaceContainer: '#141A2E', // Floor 1: Default card background
  surfaceContainerHigh: '#1C233D', // Floor 2: Elevated cards, modals, active touch targets
  surfaceContainerHighest: '#2F3446',
  surfaceBright: '#34394A',

  // Structural Borders (1px on all cards/inputs)
  border: '#253052',
  borderHighlight: 'rgba(224, 169, 59, 0.40)', // Amber 40% for active/focused cards
  outline: '#9C8F7C',
  outlineVariant: '#4F4535',

  // Primary Operational Accent (Juridical Amber-Gold)
  primary: '#E0A93B',
  primaryHover: '#C9942D',
  primaryFixed: '#FFC454',
  primaryLight: '#FFDEA8',
  onPrimary: '#0B1020', // Text on primary amber buttons

  // Verified State (Statutory Emerald) - SEMANTIC ONLY
  verified: '#3FB68B',
  verifiedBg: 'rgba(63, 182, 139, 0.15)', // 15% fill for verification seals
  onVerified: '#003827',

  // Emergency & Hazard (Urgency Crimson) - SEMANTIC ONLY
  emergency: '#E5484D',
  emergencyBg: 'rgba(229, 72, 77, 0.20)', // 20% fill for emergency banners
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  // Typographic Tones
  textPrimary: '#FFFFFF', // High-contrast headline and body text
  textSecondary: '#A8B0C4', // Legal metadata, timestamps, placeholders
  textTertiary: '#94A3B8', // WCAG AA compliant muted captions (>= 4.5:1 on dark canvas)
  textMuted: '#94A3B8',
  textInverse: '#0B1020',

  // Ergonomic Design System Aliases
  secondary: '#3FB68B', // Statutory emerald secondary
  warning: '#F59E0B', // Amber warning tone
  error: '#E5484D', // Crimson error tone
  card: '#141A2E', // Floor 1 surfaceContainer
  elevated: '#1C233D', // Floor 2 surfaceContainerHigh
  text: '#FFFFFF', // Text primary
} as const;

export type ColorToken = keyof typeof colors;
