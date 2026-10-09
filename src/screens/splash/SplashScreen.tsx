import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, typography, spacing } from '../../theme';
import { ScaleOfJusticeLogo } from '../../components/ui/ScaleOfJusticeLogo';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useTranslation();
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const initSettings = useSettingsStore((s) => s.initSettings);

  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Securing legal intelligence...');

  useEffect(() => {
    let isMounted = true;

    const runStartupTasks = async () => {
      try {
        // Step 1: Initialize local environment, settings & assets
        if (!isMounted) return;
        setProgress(35);
        setStatusText(t('splash.loadingFonts'));
        await initSettings();
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 2: Check security token & restore session
        if (!isMounted) return;
        setProgress(65);
        setStatusText(t('splash.verifyingSession'));
        await restoreSession();
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Fetch app config & remote act updates
        if (!isMounted) return;
        setProgress(90);
        setStatusText(t('splash.securing'));
        await apiClient.fetchConfig();
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 4: Ready
        if (!isMounted) return;
        setProgress(100);
        setStatusText(t('splash.ready'));
        await new Promise((resolve) => setTimeout(resolve, 250));

        if (isMounted) {
          onFinish();
        }
      } catch {
        if (isMounted) {
          setProgress(100);
          onFinish();
        }
      }
    };

    runStartupTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Engine & Version Header */}
      <View style={styles.topHeader}>
        <View style={styles.engineBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.engineText}>Statutory Engine v2.4</Text>
        </View>
        <View style={styles.securitySeal}>
          <Text style={styles.securityText}>DIGITAL LEGAL REFERENCE</Text>
        </View>
      </View>

      {/* Center Hero & Scales of Justice Emblem */}
      <View style={styles.heroSection}>
        <View style={styles.logoCircleWrapper}>
          <View style={styles.glowUnderlay} />
          <View style={styles.logoCircle}>
            <ScaleOfJusticeLogo size={58} />
          </View>
        </View>

        <Text style={styles.appTitle}>LawGPT</Text>
        <Text style={styles.appTagline}>{t('common.appTagline')}</Text>

        <View style={styles.statutoryPill}>
          <Text style={styles.statutoryPillText}>
            Simplified Indian Law • BNS • BNSS • Constitution
          </Text>
        </View>

        {/* 3 Pillars Grid */}
        <View style={styles.pillarsGrid}>
          <View style={styles.pillarCard}>
            <Text style={styles.pillarTitle}>Bharatiya Nyaya</Text>
            <Text style={styles.pillarSubtitle}>Sanhita 2023</Text>
          </View>
          <View style={styles.pillarCard}>
            <Text style={styles.pillarTitle}>BNSS & BSA</Text>
            <Text style={styles.pillarSubtitle}>Procedural & Evidence</Text>
          </View>
          <View style={styles.pillarCard}>
            <Text style={styles.pillarTitle}>Apex Precedents</Text>
            <Text style={styles.pillarSubtitle}>Supreme Court Reports</Text>
          </View>
        </View>
      </View>

      {/* Bottom Real Startup Progress Section */}
      <View style={styles.bottomSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.disclaimerText}>
          General legal information, not a substitute for a lawyer.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.margin,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.verified,
    marginRight: 6,
  },
  engineText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    ...typography.labelSm,
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logoCircleWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowUnderlay: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(224, 169, 59, 0.20)',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  appTitle: {
    ...typography.headlineLg,
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    ...typography.labelLg,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  statutoryPill: {
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statutoryPillText: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pillarsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.lg,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  pillarTitle: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillarSubtitle: {
    ...typography.labelSm,
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: spacing.xl,
    width: '100%',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusText: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressPercent: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  disclaimerText: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
