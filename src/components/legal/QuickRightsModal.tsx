import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Shield, X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import quickRightsData from '../../data/quickRights.json';

export interface QuickRightsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickRightsModal: React.FC<QuickRightsModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>Police Stop & Arrest Rights</Text>
              <View style={styles.offlinePill}>
                <Text style={styles.offlineText}>⚡ 100% Offline Handbook</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Directive Warning Box */}
          <View style={styles.directiveCard}>
            <AlertTriangle size={20} color={colors.emergency} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.directiveTitle}>Crucial Arrest Directive</Text>
              <Text style={styles.directiveText}>
                Remain calm and courteous. You have the constitutional right to remain silent until consulting a lawyer. Never sign blank papers under duress.
              </Text>
            </View>
          </View>

          {/* Sourced Rights List */}
          {quickRightsData.rights.map((item) => (
            <View key={item.id} style={styles.rightCard}>
              <View style={styles.rightHeader}>
                <Text style={styles.rightTitle}>{item.title}</Text>
                <View style={styles.actBadge}>
                  <Text style={styles.actText}>{item.act}</Text>
                </View>
              </View>

              <Text style={styles.summaryText}>{item.summary}</Text>

              <View style={styles.actionBox}>
                <View style={styles.actionHeader}>
                  <CheckCircle2 size={14} color={colors.verified} />
                  <Text style={styles.actionLabel}>What you can do immediately:</Text>
                </View>
                <Text style={styles.actionText}>{item.whatYouCanDo}</Text>
              </View>
            </View>
          ))}

          {/* Legal Disclaimer & Source Note */}
          <View style={styles.footerNote}>
            <Text style={styles.footerSource}>
              Source: {quickRightsData.source} (Last Verified: {quickRightsData.lastUpdated})
            </Text>
            <Text style={styles.footerDisclaimer}>
              General statutory guidance. In active custody, consult an enrolled advocate immediately.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.margin,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  offlineText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.margin,
    paddingBottom: spacing.xl,
  },
  directiveCard: {
    flexDirection: 'row',
    backgroundColor: colors.emergencyBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.emergency,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  directiveTitle: {
    ...typography.labelMd,
    color: colors.emergency,
    fontWeight: '700',
    marginBottom: 2,
  },
  directiveText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  rightCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rightHeader: {
    marginBottom: spacing.xs,
  },
  rightTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  actText: {
    ...typography.labelSm,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  summaryText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
    marginVertical: spacing.xs,
  },
  actionBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  actionLabel: {
    ...typography.labelSm,
    color: colors.verified,
    fontWeight: '700',
  },
  actionText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  footerSource: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  footerDisclaimer: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
