import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Info,
  CheckCircle,
  FileText,
  AlertTriangle,
  Scale,
  Building2,
  Lock,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import firGuideData from '../../data/firGuide.json';

export interface FirGuideScreenProps {
  onBack: () => void;
}

export const FirGuideScreen: React.FC<FirGuideScreenProps> = ({ onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = firGuideData.steps;
  const activeStep = steps[currentStepIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Statutory FIR Guide"
        showBack
        onBack={onBack}
        badgeText="BNSS 173"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent Mandatory Statutory Disclaimer (Critical Rule 1 & Phase 4) */}
        <View style={styles.disclaimerCard}>
          <AlertTriangle size={18} color={colors.primary} />
          <View style={styles.disclaimerTextContainer}>
            <Text style={styles.disclaimerTitle}>Informational Guidance Only</Text>
            <Text style={styles.disclaimerBody}>
              {firGuideData.disclaimer}
            </Text>
          </View>
        </View>

        {/* 4-Step Stepper Header */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {steps.map((s, idx) => {
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <React.Fragment key={s.step}>
                  <TouchableOpacity
                    style={[
                      styles.stepCircle,
                      isCurrent && styles.stepCircleActive,
                      isPassed && styles.stepCirclePassed,
                    ]}
                    onPress={() => setCurrentStepIndex(idx)}
                    accessibilityRole="tab"
                  >
                    {isPassed ? (
                      <CheckCircle size={16} color={colors.verified} />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumberText,
                          isCurrent && styles.stepNumberTextActive,
                        ]}
                      >
                        {s.step}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {idx < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepConnector,
                        idx < currentStepIndex && styles.stepConnectorActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <View style={styles.stepLabelsRow}>
            <Text style={styles.stepProgressText}>
              Step {activeStep.step} of 4: {activeStep.title}
            </Text>
          </View>
        </View>

        {/* Active Step Content Card */}
        <View style={styles.stepContentCard}>
          <View style={styles.stepTitleBox}>
            <Badge text={`Stage ${activeStep.step}`} variant="primary" />
            <Text style={styles.stepHeading}>{activeStep.title}</Text>
            <Text style={styles.stepSubtitle}>{activeStep.subtitle}</Text>
          </View>

          {/* Key Concept Banner */}
          <View style={styles.conceptBanner}>
            <Scale size={18} color={colors.verified} />
            <Text style={styles.conceptText}>{activeStep.keyConcept}</Text>
          </View>

          {/* Sectional Content Breakdowns */}
          <View style={styles.sectionsList}>
            {activeStep.content.map((sec, idx) => (
              <View key={idx} style={styles.sectionItem}>
                <View style={styles.sectionIconRow}>
                  <FileText size={16} color={colors.primary} />
                  <Text style={styles.sectionHeading}>{sec.heading}</Text>
                </View>
                <Text style={styles.sectionBody}>{sec.text}</Text>
              </View>
            ))}
          </View>

          {/* Statutory Law Note Box */}
          <View style={styles.lawNoteBox}>
            <View style={styles.lawNoteHeader}>
              <ShieldAlert size={16} color={colors.primary} />
              <Text style={styles.lawNoteTitle}>Statutory Benchmark & Precedent</Text>
            </View>
            <Text style={styles.lawNoteText}>{activeStep.lawNote}</Text>
          </View>
        </View>

        {/* Stepper Navigation Buttons */}
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              currentStepIndex === 0 && styles.navBtnDisabled,
            ]}
            disabled={currentStepIndex === 0}
            onPress={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft
              size={18}
              color={currentStepIndex === 0 ? colors.textSecondary : colors.text}
            />
            <Text
              style={[
                styles.navBtnText,
                currentStepIndex === 0 && styles.navBtnTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          {currentStepIndex < steps.length - 1 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={() =>
                setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
              }
            >
              <Text style={styles.navBtnPrimaryText}>Next Step</Text>
              <ChevronRight size={18} color={colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnFinish]}
              onPress={onBack}
            >
              <CheckCircle size={18} color={colors.onPrimary} />
              <Text style={styles.navBtnPrimaryText}>Done / Back to Hub</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(224, 169, 59, 0.08)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  disclaimerBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  stepperContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepCircleActive: {
    backgroundColor: 'rgba(224, 169, 59, 0.2)',
    borderColor: colors.primary,
  },
  stepCirclePassed: {
    backgroundColor: 'rgba(63, 182, 139, 0.1)',
    borderColor: colors.verified,
  },
  stepNumberText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  stepNumberTextActive: {
    color: colors.primary,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    backgroundColor: colors.verified,
  },
  stepLabelsRow: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  stepProgressText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  stepContentCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  stepTitleBox: {
    marginBottom: spacing.md,
  },
  stepHeading: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  stepSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  conceptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 182, 139, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.verified,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  conceptText: {
    ...typography.bodySm,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionsList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionItem: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  sectionHeading: {
    ...typography.bodyMd,
    color: colors.text,
    fontWeight: '700',
  },
  sectionBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lawNoteBox: {
    backgroundColor: 'rgba(224, 169, 59, 0.06)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 59, 0.3)',
    padding: spacing.md,
  },
  lawNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  lawNoteTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lawNoteText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    minHeight: 48,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    ...typography.bodySm,
    color: colors.text,
    fontWeight: '600',
  },
  navBtnTextDisabled: {
    color: colors.textSecondary,
  },
  navBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navBtnFinish: {
    backgroundColor: colors.verified,
    borderColor: colors.verified,
  },
  navBtnPrimaryText: {
    ...typography.bodySm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
