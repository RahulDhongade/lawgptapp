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
  Compass,
  ChevronRight,
  ShieldAlert,
  Home as HomeIcon,
  Briefcase,
  ShoppingBag,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Badge } from '../../components/ui/Badge';
import scenarioGuidesData from '../../data/scenarioGuides.json';

export interface ScenarioGuidesScreenProps {
  onBack: () => void;
  initialScenarioId?: string;
}

export const ScenarioGuidesScreen: React.FC<ScenarioGuidesScreenProps> = ({
  onBack,
  initialScenarioId,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    initialScenarioId || scenarioGuidesData.scenarios[0].id
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const activeScenario =
    scenarioGuidesData.scenarios.find((s) => s.id === selectedScenarioId) ||
    scenarioGuidesData.scenarios[0];

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'scenario_police_stop':
        return <ShieldAlert size={20} color={colors.primary} />;
      case 'scenario_deposit_dispute':
        return <HomeIcon size={20} color={colors.primary} />;
      case 'scenario_salary_unpaid':
        return <Briefcase size={20} color={colors.primary} />;
      case 'scenario_defective_product':
        return <ShoppingBag size={20} color={colors.primary} />;
      default:
        return <Compass size={20} color={colors.primary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Guided Dispute Triage"
        showBack
        onBack={onBack}
        badgeText="4 Scenarios"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unreviewed Sample Dataset Banner */}
        <View style={styles.reviewBanner}>
          <Info size={16} color={colors.primary} />
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewTitle}>Interactive Situational Playbooks</Text>
            <Text style={styles.reviewSubtitle}>
              Procedural guidance trees. Status: UNREVIEWED (Lawyer review pending before public release).
            </Text>
          </View>
        </View>

        {/* Scenarios Carousel / Selection Chips */}
        <Text style={styles.sectionHeaderTitle}>Select Dispute Scenario</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {scenarioGuidesData.scenarios.map((scen) => {
            const isSelected = scen.id === selectedScenarioId;
            return (
              <TouchableOpacity
                key={scen.id}
                style={[styles.scenarioChip, isSelected && styles.scenarioChipActive]}
                onPress={() => {
                  setSelectedScenarioId(scen.id);
                  setActiveStepIndex(0);
                }}
                accessibilityRole="tab"
              >
                <View style={styles.chipContent}>
                  {getScenarioIcon(scen.id)}
                  <Text
                    style={[
                      styles.scenarioChipText,
                      isSelected && styles.scenarioChipTextActive,
                    ]}
                  >
                    {scen.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Scenario Card */}
        <View style={styles.activeScenarioHeaderCard}>
          <View style={styles.scenarioCategoryRow}>
            <Badge text={activeScenario.category} variant="primary" />
            <Text style={styles.stepProgressText}>
              Step {activeStepIndex + 1} of {activeScenario.flow.length}
            </Text>
          </View>
          <Text style={styles.activeScenarioTitle}>{activeScenario.title}</Text>
          <Text style={styles.activeScenarioSubtitle}>{activeScenario.subtitle}</Text>
        </View>

        {/* Step Triage Flow */}
        <View style={styles.flowCard}>
          {activeScenario.flow.map((stepItem, idx) => {
            const isCurrent = idx === activeStepIndex;
            return (
              <View
                key={stepItem.step}
                style={[
                  styles.stepCard,
                  isCurrent && styles.stepCardActive,
                ]}
              >
                <TouchableOpacity
                  style={styles.stepHeaderRow}
                  onPress={() => setActiveStepIndex(idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {stepItem.step}</Text>
                  </View>
                  <Text style={styles.stepQuestionText} numberOfLines={2}>
                    {stepItem.question}
                  </Text>
                </TouchableOpacity>

                {isCurrent && (
                  <View style={styles.stepExpandedContent}>
                    {/* Legal Guidance Box */}
                    <View style={styles.guidanceBox}>
                      <View style={styles.guidanceHeader}>
                        <HelpCircle size={16} color={colors.primary} />
                        <Text style={styles.guidanceTitle}>Statutory Guidance</Text>
                      </View>
                      <Text style={styles.guidanceText}>{stepItem.guidance}</Text>
                    </View>

                    {/* Actionable Directives */}
                    <Text style={styles.optionsTitle}>Recommended Next Actions:</Text>
                    <View style={styles.optionsList}>
                      {stepItem.options.map((opt, optIdx) => (
                        <View key={optIdx} style={styles.optionRow}>
                          <CheckCircle2 size={16} color={colors.verified} />
                          <Text style={styles.optionText}>{opt}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Stepper Navigation */}
                    {idx < activeScenario.flow.length - 1 && (
                      <TouchableOpacity
                        style={styles.nextStepBtn}
                        onPress={() => setActiveStepIndex(idx + 1)}
                      >
                        <Text style={styles.nextStepBtnText}>Next Step</Text>
                        <ChevronRight size={16} color={colors.onPrimary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
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
  reviewBanner: {
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
  reviewTextContainer: {
    flex: 1,
  },
  reviewTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  scenarioChip: {
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scenarioChipActive: {
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    borderColor: colors.primary,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scenarioChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  scenarioChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeScenarioHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  scenarioCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepProgressText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  activeScenarioTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeScenarioSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  flowCard: {
    gap: spacing.md,
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stepCardActive: {
    borderColor: colors.primary,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
  },
  stepBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  stepQuestionText: {
    ...typography.bodyMd,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  stepExpandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  guidanceBox: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  guidanceTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  guidanceText: {
    ...typography.bodySm,
    color: colors.text,
    lineHeight: 20,
  },
  optionsTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionsList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  optionText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  nextStepBtnText: {
    ...typography.bodySm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
