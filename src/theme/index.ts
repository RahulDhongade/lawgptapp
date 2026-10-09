import { colors } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, touchTarget } from './spacing';
import { radii } from './radii';

export const theme = {
  colors,
  typography,
  fontFamilies,
  spacing,
  touchTarget,
  radii,
  borderWidth: 1, // Strict 1px border discipline on cards, containers, inputs
} as const;

export type Theme = typeof theme;
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
