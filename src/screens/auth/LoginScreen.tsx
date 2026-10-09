import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Sparkles,
  ChevronRight,
  Gavel,
  Smartphone,
  BadgeAlert,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { ScaleOfJusticeLogo } from '../../components/ui/ScaleOfJusticeLogo';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export interface LoginScreenProps {
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
  onExploreGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateSignUp,
  onNavigateForgotPassword,
  onExploreGuest,
}) => {
  const { t } = useTranslation();
  const { login, startGuestSession } = useAuthStore();

  const [identifier, setIdentifier] = useState('advocate@chambers.in');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login({ identifier, password, rememberMe });
    } catch (err: any) {
      setErrorMessage(err.message || err.userMessage || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await login({ identifier: 'google_user@gmail.com' });
    } catch {
      setErrorMessage('Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileOtpSignIn = () => {
    Alert.prompt
      ? Alert.prompt('Mobile OTP', 'Enter your 10-digit mobile number:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send OTP',
            onPress: async (mob) => {
              if (mob) {
                await login({ identifier: mob });
              }
            },
          },
        ])
      : login({ identifier: '9876543210' });
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for emulator / devices without biometrics
        await login({ identifier: 'advocate.rajesh@chambers.in' });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with LawGPT Biometric Fast Pass',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        await login({ identifier: 'advocate.rajesh@chambers.in' });
      }
    } catch {
      await login({ identifier: 'advocate.rajesh@chambers.in' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ScaleOfJusticeLogo size={28} />
          <Text style={styles.brandTitle}>LawGPT</Text>
        </View>
        <LanguageSwitcher />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest Consultation Teaser Card */}
        <TouchableOpacity
          onPress={onExploreGuest}
          activeOpacity={0.85}
          style={styles.guestCard}
          accessibilityRole="button"
        >
          <View style={styles.guestLeft}>
            <View style={styles.guestIconCircle}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={styles.guestTextCol}>
              <Text style={styles.guestTag}>
                {t('auth.guestTeaserTitle')}
              </Text>
              <Text style={styles.guestTitle}>
                {t('auth.guestTeaserDesc')}
              </Text>
            </View>
          </View>
          <View style={styles.guestAction}>
            <Text style={styles.guestActionText}>{t('auth.guestAction')}</Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Hero Title */}
        <View style={styles.heroSection}>
          <View style={styles.heroEmblem}>
            <ScaleOfJusticeLogo size={36} />
          </View>
          <Text style={styles.heroTitle}>LawGPT Juris AI</Text>
          <Text style={styles.heroSubtitle}>{t('auth.welcomeBack')}</Text>
        </View>

        {/* Main Auth Form Container */}
        <View style={styles.formContainer}>
          {/* Quick Access Social / Mobile Stack */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            style={styles.socialButton}
            accessibilityRole="button"
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialText}>{t('auth.continueGoogle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMobileOtpSignIn}
            activeOpacity={0.8}
            style={styles.socialButton}
            accessibilityRole="button"
          >
            <Smartphone size={20} color={colors.verified} />
            <Text style={styles.socialText}>{t('auth.continueMobile')}</Text>
          </TouchableOpacity>

          {/* Tonal Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.orEmail')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Error Message Alert */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <BadgeAlert size={16} color={colors.emergency} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <Input
            label={t('auth.emailOrMobile')}
            placeholder={t('auth.emailOrMobilePlaceholder')}
            value={identifier}
            onChangeText={setIdentifier}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
          />

          <Input
            label={t('auth.password')}
            placeholder="••••••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              showPassword ? (
                <EyeOff size={18} color={colors.textSecondary} />
              ) : (
                <Eye size={18} color={colors.textSecondary} />
              )
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberMeRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>
                {t('auth.rememberDevice')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateForgotPassword}
              accessibilityRole="button"
            >
              <Text style={styles.forgotText}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Sign In CTA */}
          <Button
            title={t('auth.signInBtn')}
            onPress={handleSignIn}
            loading={isLoading}
            rightIcon={<Gavel size={18} color={colors.onPrimary} />}
            style={styles.submitBtn}
          />

          {/* Biometric Fast Pass Shortcut */}
          <TouchableOpacity
            onPress={handleBiometricAuth}
            activeOpacity={0.8}
            style={styles.biometricBtn}
            accessibilityRole="button"
          >
            <Fingerprint size={18} color={colors.verified} />
            <Text style={styles.biometricText}>
              {t('auth.biometricFastPass')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Redirect */}
        <View style={styles.signUpRedirectRow}>
          <Text style={styles.noAccountText}>{t('auth.noAccount')}</Text>
          <TouchableOpacity
            onPress={onNavigateSignUp}
            accessibilityRole="button"
          >
            <Text style={styles.signUpLinkText}>{t('auth.signUpLink')}</Text>
          </TouchableOpacity>
        </View>

        {/* Security & Bar Council Notice */}
        <View style={styles.securityNotice}>
          <View style={styles.securityBadge}>
            <ShieldCheck size={16} color={colors.verified} />
            <Text style={styles.securityBadgeText}>
              Encrypted Connection • Client Data Protected
            </Text>
          </View>
          <Text style={styles.disclaimerSmall}>
            {t('common.disclaimer')}
          </Text>
        </View>
      </ScrollView>

      {/* Footer Explore as Guest */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onExploreGuest}
          style={styles.exploreGuestBtn}
          accessibilityRole="button"
        >
          <Text style={styles.exploreGuestText}>{t('auth.exploreGuest')}</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
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
    gap: spacing.xs,
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  guestCard: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  guestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  guestIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextCol: {
    flex: 1,
  },
  guestTag: {
    ...typography.labelSm,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guestTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
    marginTop: 1,
  },
  guestAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  guestActionText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroEmblem: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  socialButton: {
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  googleIcon: {
    color: '#EA4335',
    fontWeight: '900',
    fontSize: 18,
  },
  socialText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
    textTransform: 'uppercase',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emergencyBg,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.emergency,
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  rememberText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  forgotText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  biometricBtn: {
    height: 40,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  biometricText: {
    ...typography.labelSm,
    color: colors.verified,
    fontWeight: '600',
  },
  signUpRedirectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  noAccountText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  signUpLinkText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
  },
  securityNotice: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  securityBadgeText: {
    ...typography.labelSm,
    color: colors.verified,
    fontWeight: '600',
  },
  disclaimerSmall: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exploreGuestText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
});
