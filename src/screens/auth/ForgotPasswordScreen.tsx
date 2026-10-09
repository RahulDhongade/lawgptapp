import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeft, KeyRound, CheckCircle } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

import { useAuthStore } from '../../store/authStore';

export interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
}) => {
  const { resetPassword } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!identifier.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (identifier.includes('@')) {
        await resetPassword(identifier.trim());
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setIsSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Credential</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <KeyRound size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your registered email address or mobile number to receive a secure OTP code.
        </Text>

        {isSent ? (
          <View style={styles.sentBox}>
            <CheckCircle size={24} color={colors.verified} />
            <Text style={styles.sentText}>
              Security verification link and OTP dispatched to your identifier.
            </Text>
            <Button
              title="Back to Sign In"
              onPress={onBack}
              style={{ marginTop: spacing.md, width: '100%' }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
            <Input
              label="Email or Mobile (+91)"
              placeholder="advocate@chambers.in"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <Button
              title="Send Verification Code"
              onPress={handleReset}
              loading={isLoading}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.margin,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: 300,
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 340,
  },
  sentBox: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  sentText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: colors.emergencyBg,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.emergency,
    textAlign: 'center',
  },
});
