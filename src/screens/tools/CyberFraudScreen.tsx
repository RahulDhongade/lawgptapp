import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  AlertOctagon,
  PhoneCall,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Badge } from '../../components/ui/Badge';
import cyberFraudData from '../../data/cyberFraud.json';

export interface CyberFraudScreenProps {
  onBack: () => void;
}

export const CyberFraudScreen: React.FC<CyberFraudScreenProps> = ({ onBack }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    cyberFraudData.scenarios[0].id
  );

  const handleDial1930 = () => {
    Linking.openURL('tel:1930').catch(() => {
      Alert.alert('Emergency Helpline', 'Please dial 1930 from your phone keypad immediately.');
    });
  };

  const handleOpenPortal = () => {
    Linking.openURL(cyberFraudData.portalUrl).catch(() => {
      Alert.alert('Portal Link', 'Please visit https://cybercrime.gov.in to report cyber crime.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Cyber Fraud Help"
        showBack
        onBack={onBack}
        badgeText="1930 Helpline"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Golden Hour Emergency Action Banner */}
        <View style={styles.goldenHourBanner}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerTagRow}>
              <Clock size={16} color={colors.emergency} />
              <Text style={styles.bannerTagText}>GOLDEN HOUR PROTOCOL</Text>
            </View>
            <Badge text="Critical" variant="emergency" />
          </View>

          <Text style={styles.bannerHeading}>
            Dial 1930 within 2 hours to freeze stolen money
          </Text>
          <Text style={styles.bannerDescription}>
            The National Cyber Financial Fraud Reporting System connects directly to 200+ partner banks to freeze scammer accounts in real-time.
          </Text>

          <View style={styles.bannerActionsRow}>
            <TouchableOpacity
              style={styles.dialBtn}
              onPress={handleDial1930}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <PhoneCall size={18} color="#FFFFFF" />
              <Text style={styles.dialBtnText}>Call 1930 Immediately</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.portalBtn}
              onPress={handleOpenPortal}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <ExternalLink size={16} color={colors.text} />
              <Text style={styles.portalBtnText}>cybercrime.gov.in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Source & Vetting Metadata Banner */}
        <View style={styles.reviewBanner}>
          <Info size={16} color={colors.primary} />
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewTitle}>Indian Cyber Crime Coordination Centre (I4C)</Text>
            <Text style={styles.reviewSubtitle}>
              Guidelines sourced from Ministry of Home Affairs & RBI Circulars. Status: UNREVIEWED (Lawyer review pending).
            </Text>
          </View>
        </View>

        {/* 4-Step Action Checklist */}
        <Text style={styles.sectionHeaderTitle}>Standard 4-Step Fraud Checklist</Text>
        <View style={styles.checklistCard}>
          {cyberFraudData.checklist.map((item) => (
            <View key={item.stage} style={styles.checklistItem}>
              <View style={styles.stageNumberCircle}>
                <Text style={styles.stageNumberText}>{item.stage}</Text>
              </View>
              <View style={styles.checklistTextCol}>
                <Text style={styles.stageName}>{item.name}</Text>
                <Text style={styles.stageAction}>{item.action}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scenarios Section */}
        <Text style={styles.sectionHeaderTitle}>Specific Scam Scenarios</Text>
        <View style={styles.scenariosList}>
          {cyberFraudData.scenarios.map((scenario) => {
            const isExpanded = selectedScenarioId === scenario.id;
            return (
              <View key={scenario.id} style={styles.scenarioCard}>
                <TouchableOpacity
                  style={styles.scenarioHeaderBtn}
                  onPress={() =>
                    setSelectedScenarioId(isExpanded ? null : scenario.id)
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.scenarioHeaderLeft}>
                    <AlertOctagon size={18} color={colors.primary} />
                    <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                <Text style={styles.scenarioDesc}>{scenario.description}</Text>

                {isExpanded && (
                  <View style={styles.scenarioExpandedBody}>
                    {/* Critical Alert Warning */}
                    <View style={styles.criticalAlertBox}>
                      <ShieldAlert size={16} color={colors.emergency} />
                      <Text style={styles.criticalAlertText}>
                        {scenario.criticalAlert}
                      </Text>
                    </View>

                    {/* Immediate Action Steps */}
                    <Text style={styles.immediateStepsTitle}>
                      What to do right now:
                    </Text>
                    {scenario.immediateActions.map((action, idx) => (
                      <View key={idx} style={styles.actionRow}>
                        <CheckCircle2 size={16} color={colors.verified} />
                        <Text style={styles.actionItemText}>{action}</Text>
                      </View>
                    ))}
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
  goldenHourBanner: {
    backgroundColor: 'rgba(229, 72, 77, 0.1)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.emergency,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerTagText: {
    ...typography.caption,
    color: colors.emergency,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerHeading: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  bannerDescription: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  bannerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emergency,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    minHeight: 48,
  },
  dialBtnText: {
    ...typography.bodySm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
    minHeight: 48,
  },
  portalBtnText: {
    ...typography.bodySm,
    color: colors.text,
    fontWeight: '600',
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
  checklistCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stageNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  checklistTextCol: {
    flex: 1,
  },
  stageName: {
    ...typography.bodySm,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  stageAction: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scenariosList: {
    gap: spacing.md,
  },
  scenarioCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  scenarioHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scenarioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    paddingRight: spacing.sm,
  },
  scenarioTitle: {
    ...typography.bodyMd,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  scenarioDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scenarioExpandedBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  criticalAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(229, 72, 77, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.emergency,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  criticalAlertText: {
    ...typography.bodySm,
    color: '#FF8A8A',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  immediateStepsTitle: {
    ...typography.bodySm,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionItemText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
