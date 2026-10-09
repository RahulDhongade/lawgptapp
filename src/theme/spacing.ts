/**
 * Sovereign Legal Interface - Spacing Scale (4px/8px Incremental Scale)
 */

export const spacing = {
  xs: 4,      // Micro-spacing (icon to text, badge internal padding)
  sm: 8,      // Compact gaps (chips, list title to subtitle)
  md: 16,     // Standard component padding & stacked card separation
  lg: 24,     // Inter-section thematic breaks & major blocks
  xl: 32,     // Major scroll clearance & terminal sections
  xxl: 40,    // Deep clearance
  margin: 16, // Fixed screen horizontal canvas margin
  gutter: 16, // Multi-column horizontal gutter
} as const;

export const touchTarget = {
  minWidth: 48,
  minHeight: 48,
} as const;
