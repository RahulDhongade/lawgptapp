import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { Button } from '../../components/ui/Button';

export interface ConsentModalProps {
  visible: boolean;
  onAccept: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  onAccept,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Statutory Terms & Privacy Consent</Text>

          <ScrollView style={styles.scrollArea}>
            <Text style={styles.bodyText}>
              Welcome to <Text style={styles.highlight}>LawGPT – India's AI Legal Assistant</Text>. Before accessing statutory guidance, please review and accept our operating parameters:
            </Text>

            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Information, Not Legal Advice:</Text> LawGPT provides general statutory orientations and procedural summaries based on Indian bare acts (BNS, BNSS, BSA, Constitution). Outputs do not create an advocate-client relationship.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Independent Verification:</Text> In any active judicial proceeding, police inquiry, or trial, always verify statutory clauses with an enrolled Bar Council advocate.
              </Text>
            </View>

            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Data Protection & Privacy:</Text> Queries are transmitted securely. You retain the right to clear your conversation history and execute a complete data purge at any time in Profile Settings.
              </Text>
            </View>
          </ScrollView>

          <Button
            title="I Understand & Agree"
            onPress={onAccept}
            style={styles.btn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scrollArea: {
    maxHeight: 260,
    marginVertical: spacing.xs,
  },
  bodyText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  highlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bullet: {
    color: colors.primary,
    fontSize: 16,
    marginRight: spacing.xs,
  },
  bulletText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bold: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  btn: {
    marginTop: spacing.md,
  },
});
