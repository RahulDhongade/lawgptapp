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
import {
  User,
  Gavel,
  Lock,
  Mail,
  BadgeAlert,
  ArrowRight,
  Bolt,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { ScaleOfJusticeLogo } from '../../components/ui/ScaleOfJusticeLogo';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../api/types';

export interface SignUpScreenProps {
  onNavigateLogin: () => void;
  onExploreGuest: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateLogin,
  onExploreGuest,
}) => {
  const { t } = useTranslation();
  const { signUp } = useAuthStore();

  const [role, setRole] = useState<UserRole>('citizen');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [barCouncil, setBarCouncil] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);

  const [otpDispatched, setOtpDispatched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Strength calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;

  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setOtpDispatched(true);
  };

  const handleCreateAccount = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await signUp({
        fullName,
        email,
        mobile,
        password,
        role,
        barCouncilNumber: role === 'advocate' ? barCouncil : null,
        agreedToTerms: agreedTerms,
      });
    } catch (err: any) {
      setErrorMessage(err.message || err.userMessage || 'Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
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
        {/* Law Scales Emblem & Title */}
        <View style={styles.heroSection}>
          <View style={styles.heroEmblem}>
            <ScaleOfJusticeLogo size={36} />
            <View style={styles.verifiedPin}>
              <CheckCircle size={10} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{t('auth.createAccount')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('auth.createAccountDesc')}
          </Text>
        </View>

        {/* Role Toggle Segment */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            onPress={() => setRole('citizen')}
            style={[
              styles.roleBtn,
              role === 'citizen' && styles.roleBtnActive,
            ]}
            accessibilityRole="button"
          >
            <User
              size={18}
              color={role === 'citizen' ? colors.onPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.roleText,
                role === 'citizen' && styles.roleTextActive,
              ]}
            >
              {t('auth.roleCitizen')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole('advocate')}
            style={[
              styles.roleBtn,
              role === 'advocate' && styles.roleBtnActive,
            ]}
            accessibilityRole="button"
          >
            <Gavel
              size={18}
              color={role === 'advocate' ? colors.onPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.roleText,
                role === 'advocate' && styles.roleTextActive,
              ]}
            >
              {t('auth.roleAdvocate')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Registration Card Form */}
        <View style={styles.formCard}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <BadgeAlert size={16} color={colors.emergency} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Full Name */}
          <Input
            label={t('auth.fullName')}
            placeholder={
              role === 'advocate' ? 'e.g. Adv. Rajesh Kumar' : 'e.g. Priya Sharma'
            }
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<User size={18} color={colors.textSecondary} />}
          />

          {/* Mobile Number with OTP Action */}
          <View style={styles.mobileRowWrapper}>
            <View style={styles.mobileInputFlex}>
              <Input
                label={t('auth.mobileNumber')}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                leftIcon={
                  <Text style={styles.countryCode}>+91</Text>
                }
              />
            </View>
            <TouchableOpacity
              onPress={handleSendOtp}
              style={styles.sendOtpBtn}
              accessibilityRole="button"
            >
              <Text style={styles.sendOtpText}>{t('auth.sendOtp')}</Text>
            </TouchableOpacity>
          </View>

          {otpDispatched && (
            <View style={styles.otpStatusRow}>
              <CheckCircle size={14} color={colors.verified} />
              <Text style={styles.otpStatusText}>{t('auth.otpSent')}</Text>
            </View>
          )}

          {/* Email Address */}
          <Input
            label={t('auth.officialEmail')}
            placeholder="counsel@chambers.in"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />

          {/* Password & Security Meter */}
          <View style={styles.passwordSection}>
            <Input
              label={t('auth.createPassword')}
              placeholder={t('auth.passwordRules')}
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

            {/* Visual Strength Bars */}
            <View style={styles.strengthBarRow}>
              <View
                style={[
                  styles.strengthBar,
                  hasMinLength && styles.strengthBarActive,
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  hasUppercase && styles.strengthBarActive,
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  hasNumber && styles.strengthBarActive,
                ]}
              />
            </View>

            <View style={styles.rulesList}>
              <Text
                style={[
                  styles.ruleText,
                  hasMinLength && styles.ruleTextMet,
                ]}
              >
                ● 8+ Chars
              </Text>
              <Text
                style={[
                  styles.ruleText,
                  hasUppercase && styles.ruleTextMet,
                ]}
              >
                ● 1 Uppercase
              </Text>
              <Text
                style={[
                  styles.ruleText,
                  hasNumber && styles.ruleTextMet,
                ]}
              >
                ● 1 Number
              </Text>
            </View>
          </View>

          {/* Dynamic Advocate Bar Council Enrolment Field */}
          {role === 'advocate' && (
            <View style={styles.barCouncilWrapper}>
              <Input
                label={t('auth.barCouncil')}
                placeholder={t('auth.barCouncilPlaceholder')}
                autoCapitalize="characters"
                value={barCouncil}
                onChangeText={setBarCouncil}
                leftIcon={<ShieldCheck size={18} color={colors.primary} />}
                hint={t('auth.barCouncilHint')}
              />
            </View>
          )}

          {/* Statutory Terms Checkbox */}
          <TouchableOpacity
            onPress={() => setAgreedTerms(!agreedTerms)}
            style={styles.termsRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreedTerms }}
          >
            <View
              style={[
                styles.checkbox,
                agreedTerms && styles.checkboxChecked,
              ]}
            >
              {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              {t('auth.agreeTerms')}
            </Text>
          </TouchableOpacity>

          {/* Submit Action */}
          <Button
            title={t('auth.createAccountBtn')}
            onPress={handleCreateAccount}
            loading={isLoading}
            rightIcon={<ArrowRight size={18} color={colors.onPrimary} />}
            style={styles.submitBtn}
          />
        </View>

        {/* Secondary Guest Consultation Banner */}
        <TouchableOpacity
          onPress={onExploreGuest}
          activeOpacity={0.8}
          style={styles.guestBanner}
          accessibilityRole="button"
        >
          <View style={styles.guestBannerLeft}>
            <View style={styles.boltCircle}>
              <Bolt size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.guestBannerTitle}>Quick Law Consultation</Text>
              <Text style={styles.guestBannerSubtitle}>3 Free Legal Queries Available</Text>
            </View>
          </View>
          <View style={styles.skipRow}>
            <Text style={styles.skipText}>{t('common.skip')}</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Sign In Footer Link */}
        <View style={styles.signInRow}>
          <Text style={styles.alreadyText}>{t('auth.alreadyHaveAccount')}</Text>
          <TouchableOpacity
            onPress={onNavigateLogin}
            accessibilityRole="button"
          >
            <Text style={styles.signInLinkText}>{t('auth.signInBtn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroEmblem: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  verifiedPin: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    maxWidth: 320,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBtn: {
    flex: 1,
    height: 40,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
  },
  roleText: {
    ...typography.labelMd,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  roleTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
  mobileRowWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  mobileInputFlex: {
    flex: 1,
  },
  countryCode: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  sendOtpBtn: {
    height: 48,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sendOtpText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  otpStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  otpStatusText: {
    ...typography.labelSm,
    color: colors.verified,
  },
  passwordSection: {
    marginVertical: spacing.xs,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
  strengthBarActive: {
    backgroundColor: colors.verified,
  },
  rulesList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ruleText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontSize: 10,
  },
  ruleTextMet: {
    color: colors.verified,
    fontWeight: '600',
  },
  barCouncilWrapper: {
    marginTop: spacing.xs,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  termsText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  guestBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  guestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  boltCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  guestBannerSubtitle: {
    ...typography.labelSm,
    color: colors.verified,
    marginTop: 1,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  skipText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  alreadyText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  signInLinkText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
  },
});
