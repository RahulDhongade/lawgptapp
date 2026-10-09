import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Sparkles, ArrowRight, UserPlus } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { Button } from '../../components/ui/Button';

export interface GuestLimitModalProps {
  visible: boolean;
  onSignUp: () => void;
  onLogin: () => void;
  onClose: () => void;
  onResetDemo?: () => void;
}

export const GuestLimitModal: React.FC<GuestLimitModalProps> = ({
  visible,
  onSignUp,
  onLogin,
  onClose,
  onResetDemo,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <View style={styles.iconCircle}>
                <Sparkles size={28} color={colors.primary} />
              </View>

              <Text style={styles.title}>Free Consultation Limit Reached</Text>
              <Text style={styles.message}>
                You have used your 3 complimentary guest queries. Create a free LawGPT account to continue asking legal questions, save consultations, and access BNS conversion tools.
              </Text>

              {onResetDemo && (
                <Button
                  title="Reset Demo (3 Free Queries)"
                  variant="outline"
                  onPress={onResetDemo}
                  leftIcon={<Sparkles size={16} color={colors.primary} />}
                  style={styles.actionBtn}
                />
              )}

              <Button
                title="Create Free Account"
                variant="primary"
                onPress={onSignUp}
                leftIcon={<UserPlus size={16} color={colors.onPrimary} />}
                style={styles.actionBtn}
              />

              <Button
                title="Sign In to Existing Account"
                variant="ghost"
                onPress={onLogin}
                rightIcon={<ArrowRight size={16} color={colors.textPrimary} />}
                style={styles.actionBtn}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
});
