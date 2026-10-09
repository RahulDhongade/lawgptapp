import { TextStyle } from 'react-native';

/**
 * Sovereign Legal Interface - Typography Scale
 * Standardized on Inter with Noto Sans Devanagari fallback
 */

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  devanagariRegular: 'NotoSansDevanagari_400Regular',
  devanagariMedium: 'NotoSansDevanagari_500Medium',
  devanagariBold: 'NotoSansDevanagari_700Bold',
};

export const typography: Record<string, TextStyle> = {
  headlineLg: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    fontWeight: '700',
  },
  headlineMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: '600',
  },
  headlineSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    fontWeight: '400',
  },
  labelLg: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: '600',
  },
  labelMd: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  labelSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    fontWeight: '600',
  },
};
