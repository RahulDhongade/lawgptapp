import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, Scale, Sparkles } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { Button } from '../../components/ui/Button';
import { ScaleOfJusticeLogo } from '../../components/ui/ScaleOfJusticeLogo';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <Scale size={48} color={colors.primary} />,
      title: t('onboarding.slide1Title'),
      desc: t('onboarding.slide1Desc'),
      tag: 'Constitutional Core & BNS',
    },
    {
      icon: <Sparkles size={48} color={colors.primary} />,
      title: t('onboarding.slide2Title'),
      desc: t('onboarding.slide2Desc'),
      tag: 'Structured AI Advisory',
    },
    {
      icon: <BookOpen size={48} color={colors.primary} />,
      title: t('onboarding.slide3Title'),
      desc: t('onboarding.slide3Desc'),
      tag: 'Everyday Legal Utilities',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentSlide];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Bar with Logo and Language Toggle */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <ScaleOfJusticeLogo size={28} />
          <Text style={styles.logoText}>LawGPT</Text>
        </View>
        <LanguageSwitcher />
      </View>

      {/* Main Slide Card */}
      <View style={styles.slideContainer}>
        <View style={styles.iconCircleWrapper}>
          <View style={styles.glow} />
          <View style={styles.iconCircle}>{slide.icon}</View>
        </View>

        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{slide.tag}</Text>
        </View>

        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.desc}</Text>

        {/* Slide Indicators */}
        <View style={styles.indicators}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentSlide === i && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {currentSlide < slides.length - 1 ? (
            <>
              <TouchableOpacity
                onPress={onComplete}
                style={styles.skipBtn}
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>{t('common.skip')}</Text>
              </TouchableOpacity>
              <Button
                title={t('common.next')}
                onPress={handleNext}
                style={styles.nextBtn}
              />
            </>
          ) : (
            <Button
              title={t('common.getStarted')}
              onPress={onComplete}
              style={styles.fullBtn}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircleWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  tagText: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  slideDesc: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHighest,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.margin,
    paddingBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skipBtn: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.labelLg,
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
  },
  fullBtn: {
    width: '100%',
  },
});
