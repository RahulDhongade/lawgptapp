import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { geminiClient } from '../../api/client';
import {
  User,
  Shield,
  Fingerprint,
  Languages,
  Download,
  Trash2,
  FileText,
  Lock,
  ChevronRight,
  LogOut,
  Moon,
  Info,
  Scale,
  Sparkles,
  X,
  Copy,
  ShieldCheck,
  Database,
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFirebaseConfigured } from '../../config/firebase';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatStore } from '../../store/chatStore';
import { useSavedStore } from '../../store/savedStore';
import { useCaseStore } from '../../store/caseStore';
import privacyPolicyData from '../../data/legal/privacyPolicy.json';
import termsOfServiceData from '../../data/legal/termsOfService.json';

export interface ProfileScreenProps {
  onNavigateAdmin?: () => void;
  onNavigateLogin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateAdmin,
  onNavigateLogin,
}) => {
  const { t } = useTranslation();
  const { user, isGuest, logout } = useAuthStore();
  const {
    language,
    setLanguage,
    biometricLockEnabled,
    setBiometricLock,
  } = useSettingsStore();

  const { conversations, clearAllConversations } = useChatStore();
  const { items, clearAll: clearSavedItems } = useSavedStore();
  const { cases, clearAllCases } = useCaseStore();

  const [purgeModalVisible, setPurgeModalVisible] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    geminiClient.getApiKey().then((key) => {
      setHasGeminiKey(!!key);
      if (key) setGeminiApiKeyInput(key);
    });
  }, []);

  const handleSaveGeminiKey = async () => {
    await geminiClient.setApiKey(geminiApiKeyInput);
    const active = !!geminiApiKeyInput.trim();
    setHasGeminiKey(active);
    setApiKeyModalVisible(false);
    Alert.alert(
      active ? 'Gemini AI Connected' : 'Key Removed',
      active
        ? 'LawGPT will now use live Google Gemini AI to answer any question dynamically just like ChatGPT!'
        : 'Reverted to built-in sovereign statutory intelligence engine.'
    );
  };

  const isAdminUser = user?.role === 'admin' || (user as any)?.role === 'sub-admin';

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometrics Unavailable',
            'Your device does not have biometric hardware or enrolled fingerprint/face recognition.'
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric app lock',
        });

        if (result.success) {
          setBiometricLock(true);
          Alert.alert('Lock Enabled', 'Biometric authentication will be required when unlocking LawGPT.');
        }
      } catch (err: any) {
        Alert.alert('Authentication Error', err.message || 'Could not verify biometrics.');
      }
    } else {
      setBiometricLock(false);
    }
  };

  const handleExportAllData = () => {
    setExportModalVisible(true);
    setExportCopied(false);
  };

  const getFullDataExportJson = () => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        framework: 'DPDP Act 2023 Statutory Export',
        user: user || { mode: 'Guest' },
        chatConversations: conversations,
        savedLibrary: items,
        caseDocket: cases,
      },
      null,
      2
    );
  };

  const handleCopyFullExport = async () => {
    await Clipboard.setStringAsync(getFullDataExportJson());
    setExportCopied(true);
    Alert.alert(
      'Export Copied to Clipboard',
      'Confidential profile, conversation history, and case docket have been copied to your clipboard. Please paste securely.'
    );
    setTimeout(() => setExportCopied(false), 3000);
  };

  const handleHardPurge = async () => {
    try {
      // Clear stores
      await clearAllConversations();
      await clearSavedItems();
      await clearCases();
      // Clear async storage completely
      await AsyncStorage.clear();
      // Logout and clear tokens
      await logout();
      setPurgeModalVisible(false);
      if (onNavigateLogin) {
        onNavigateLogin();
      }
    } catch {
      Alert.alert('Error', 'Could not complete data purge.');
    }
  };

  const clearCases = async () => {
    await clearAllCases();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Profile & Sovereign Settings"
        badgeText={isGuest ? 'Guest' : user?.role === 'advocate' ? 'Advocate' : user?.role === 'admin' ? 'Admin' : 'Citizen'}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.userNameRow}>
              <Text style={styles.userNameText}>
                {isGuest ? 'Guest Citizen' : user?.fullName || 'Litigant'}
              </Text>
              <Badge
                label={
                  isGuest
                    ? 'Guest'
                    : user?.role === 'advocate'
                    ? 'Advocate'
                    : user?.role === 'admin'
                    ? 'Admin'
                    : 'User'
                }
                variant={isAdminUser ? 'primary' : user?.role === 'advocate' ? 'verified' : 'default'}
              />
            </View>
            <Text style={styles.userSubText}>
              {isGuest ? 'Temporary Session • 3 Free Queries' : user?.email || user?.mobile}
            </Text>
            {user?.barCouncilNumber ? (
              <Text style={styles.barCouncilText}>
                Bar Council: {user.barCouncilNumber}
              </Text>
            ) : null}
            <Text style={styles.memberSinceText}>
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Today'}
            </Text>
          </View>
        </View>

        {/* Admin Portal Gateway (Role-gated) */}
        {isAdminUser && onNavigateAdmin && (
          <TouchableOpacity
            style={styles.adminPortalCard}
            onPress={onNavigateAdmin}
            activeOpacity={0.8}
          >
            <View style={styles.adminIconBox}>
              <Shield size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.adminTagRow}>
                <Text style={styles.adminCardTitle}>Enter Admin Portal</Text>
                <Badge label="Staff Access" variant="primary" />
              </View>
              <Text style={styles.adminCardDesc}>
                Overview metrics, priority queries queue, statutory corpus health & compliance logs.
              </Text>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Section 1: Preferences & Language */}
        <Text style={styles.sectionHeader}>Preferences & Localization</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <Languages size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Display Language</Text>
              <Text style={styles.settingSub}>English, हिंदी, or मराठी</Text>
            </View>
            <LanguageSwitcher />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <Moon size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Theme Mode</Text>
              <Text style={styles.settingSub}>Dark-first sovereign theme (Default)</Text>
            </View>
            <Badge label="Dark Sovereign" variant="verified" />
          </View>
        </View>

        {/* Section: Live AI Intelligence (ChatGPT & Gemini Engine) */}
        <Text style={styles.sectionHeader}>Live AI Engine (ChatGPT Mode)</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.clickableItem}
            onPress={() => setApiKeyModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.settingIconCircle}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Google Gemini Generative AI</Text>
              <Text style={styles.settingSub}>
                {hasGeminiKey
                  ? 'Connected • Live ChatGPT-Level AI Active'
                  : 'Connect free Google AI Key for dynamic answers to ANY question'}
              </Text>
            </View>
            <Badge
              label={hasGeminiKey ? 'Live AI Active' : 'Setup Free'}
              variant={hasGeminiKey ? 'verified' : 'primary'}
            />
          </TouchableOpacity>
        </View>

        {/* Section 2: Security & App Lock */}
        <Text style={styles.sectionHeader}>Security & Authentication</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <Fingerprint size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Biometric App Lock</Text>
              <Text style={styles.settingSub}>Require fingerprint/Face ID on open</Text>
            </View>
            <Switch
              value={biometricLockEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <Lock size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Token Encryption</Text>
              <Text style={styles.settingSub}>Hardware-backed expo-secure-store</Text>
            </View>
            <Badge label="Encrypted" variant="verified" />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <ShieldCheck size={18} color={isFirebaseConfigured() ? colors.verified : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>User Cloud Authentication</Text>
              <Text style={styles.settingSub}>
                {isFirebaseConfigured()
                  ? 'Firebase Auth Active • Multi-device cloud sync'
                  : 'Demo Auth Mode • Set Firebase keys in .env for cloud sync'}
              </Text>
            </View>
            <Badge
              label={isFirebaseConfigured() ? 'Firebase Live' : 'Demo Mode'}
              variant={isFirebaseConfigured() ? 'verified' : 'default'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconCircle}>
              <Database size={18} color={isFirebaseConfigured() ? colors.verified : colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Cloud Database (Firestore)</Text>
              <Text style={styles.settingSub}>
                {isFirebaseConfigured()
                  ? 'Cloud Sync Active • Chats, cases & library synced'
                  : 'Local Storage Mode • Connect Firebase keys for cloud backup'}
              </Text>
            </View>
            <Badge
              label={isFirebaseConfigured() ? 'Cloud Live' : 'Local Only'}
              variant={isFirebaseConfigured() ? 'verified' : 'default'}
            />
          </View>
        </View>

        {/* Section 3: Privacy & DPDP Act Data Management */}
        <Text style={styles.sectionHeader}>Privacy & DPDP Act 2023</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.clickableItem} onPress={handleExportAllData}>
            <View style={styles.settingIconCircle}>
              <Download size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Export My Data</Text>
              <Text style={styles.settingSub}>Machine-readable JSON export of chats, saved items & cases</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableItem}
            onPress={() => setPurgeModalVisible(true)}
          >
            <View style={[styles.settingIconCircle, { backgroundColor: `${colors.error}15` }]}>
              <Trash2 size={18} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.error }]}>Delete All My Data</Text>
              <Text style={styles.settingSub}>Hard purge: wipe local storage, cache, and sign out</Text>
            </View>
            <ChevronRight size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Section 4: Legal & Statutory Terms */}
        <Text style={styles.sectionHeader}>Legal & Governance</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.clickableItem}
            onPress={() => setLegalModal('privacy')}
          >
            <View style={styles.settingIconCircle}>
              <Shield size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Privacy Policy (Offline)</Text>
              <Text style={styles.settingSub}>DPDP Act 2023 compliance specifications</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableItem}
            onPress={() => setLegalModal('terms')}
          >
            <View style={styles.settingIconCircle}>
              <Scale size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Terms of Service & Disclaimer</Text>
              <Text style={styles.settingSub}>Advocates Act, 1961 statutory notices</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Section 5: App Information */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>LawGPT Mobile • Made for India with AI</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 (Build 520) • Expo SDK 52</Text>
          <Text style={styles.aboutDisclaimer}>
            Statutory legal information engine demystifying the Bharatiya Nyaya Sanhita (BNS), BNSS, and Indian Constitutional law. Not a law firm.
          </Text>
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={isGuest ? 'Exit Guest Session' : 'Sign Out'}
            variant="outline"
            onPress={() => {
              logout();
              if (onNavigateLogin) onNavigateLogin();
            }}
            icon={<LogOut size={18} color={colors.error} />}
          />
        </View>
      </ScrollView>

      {/* Irreversible Delete Confirmation Modal */}
      <Modal visible={purgeModalVisible} animationType="fade" transparent>
        <View style={styles.purgeModalOverlay}>
          <View style={styles.purgeModalBox}>
            <View style={styles.purgeIconBox}>
              <Trash2 size={32} color={colors.error} />
            </View>
            <Text style={styles.purgeTitle}>Delete All Data?</Text>
            {/* EXACT TEXT REQUIREMENT */}
            <Text style={styles.purgeExactText}>
              This will permanently delete your chats, saved items, and cases from this device. This cannot be undone.
            </Text>

            <View style={styles.purgeBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setPurgeModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.xs }}
              />
              <Button
                title="Delete Permanently"
                variant="emergency"
                onPress={handleHardPurge}
                style={{ flex: 1, marginLeft: spacing.xs }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal Data Modal (Privacy Policy / Terms) */}
      <Modal visible={!!legalModal} animationType="slide" transparent>
        <SafeAreaView style={styles.legalModalOverlay}>
          <View style={styles.legalModalContent}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>
                {legalModal === 'privacy'
                  ? privacyPolicyData.title
                  : termsOfServiceData.title}
              </Text>
              <TouchableOpacity onPress={() => setLegalModal(null)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.legalModalScroll}>
              <Text style={styles.legalFramework}>
                Framework: {legalModal === 'privacy' ? privacyPolicyData.statutoryFramework : termsOfServiceData.statutoryFramework}
              </Text>

              {(legalModal === 'privacy'
                ? privacyPolicyData.sections
                : termsOfServiceData.sections
              ).map((sec, idx) => (
                <View key={idx} style={styles.legalSectionBox}>
                  <Text style={styles.legalSectionHeading}>{sec.heading}</Text>
                  <Text style={styles.legalSectionBody}>{sec.body}</Text>
                </View>
              ))}

              <View style={{ height: spacing.xl }} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* DPDP Full Export Modal */}
      <Modal visible={exportModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.legalModalOverlay}>
          <View style={styles.legalModalContent}>
            <View style={styles.legalModalHeader}>
              <View>
                <Text style={styles.legalModalTitle}>Export Full User Data</Text>
                <Text style={styles.legalFramework}>DPDP Act 2023 Statutory Export</Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.legalModalScroll}>
              <View style={styles.exportJsonBox}>
                <Text style={styles.exportJsonText}>{getFullDataExportJson()}</Text>
              </View>

              <View style={{ height: spacing.md }} />

              <Button
                title={exportCopied ? 'Export Copied to Clipboard ✓' : 'Copy All Data JSON'}
                variant="primary"
                onPress={handleCopyFullExport}
                icon={<Copy size={18} color={colors.background} />}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Gemini API Key Configuration Modal */}
      <Modal visible={apiKeyModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.legalModalOverlay}>
          <View style={styles.legalModalContent}>
            <View style={styles.legalModalHeader}>
              <View>
                <Text style={styles.legalModalTitle}>Live AI Engine Setup</Text>
                <Text style={styles.legalFramework}>Google Gemini Generative AI (Free)</Text>
              </View>
              <TouchableOpacity onPress={() => setApiKeyModalVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.legalModalScroll}>
              <Text style={styles.apiKeyInfoText}>
                Connect your Google Gemini API key to allow LawGPT to answer ANY legal or general question conversationally, just like ChatGPT.
              </Text>
              <Text style={styles.apiKeySubInfoText}>
                • Completely free with no credit card required at aistudio.google.com{'\n'}
                • If no key is set, LawGPT uses its built-in Indian statutory knowledge base.
              </Text>

              <TextInput
                placeholder="Paste your Gemini API key (AIzaSy...)"
                placeholderTextColor={colors.textSecondary}
                value={geminiApiKeyInput}
                onChangeText={setGeminiApiKeyInput}
                style={styles.apiKeyInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.apiKeyBtnRow}>
                <Button
                  title="Clear Key"
                  variant="outline"
                  onPress={() => {
                    setGeminiApiKeyInput('');
                    geminiClient.setApiKey('');
                    setHasGeminiKey(false);
                    setApiKeyModalVisible(false);
                    Alert.alert('Key Removed', 'Reverted to built-in sovereign statutory intelligence engine.');
                  }}
                  style={{ flex: 1, marginRight: spacing.xs }}
                />
                <Button
                  title="Save & Connect"
                  variant="primary"
                  onPress={handleSaveGeminiKey}
                  style={{ flex: 1, marginLeft: spacing.xs }}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 96,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#10162B',
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userNameText: {
    ...typography.headlineSm,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  userSubText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barCouncilText: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  memberSinceText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  adminPortalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1a1f30',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adminCardTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  adminCardDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    ...typography.labelSm,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  settingsGroup: {
    backgroundColor: '#11172A',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  clickableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  settingIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  settingSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  aboutCard: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  aboutHeading: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  aboutVersion: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 2,
  },
  aboutDisclaimer: {
    ...typography.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  purgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  purgeModalBox: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error,
    maxWidth: 360,
  },
  purgeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  purgeTitle: {
    ...typography.headlineSm,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  purgeExactText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  purgeBtnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  legalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  legalModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    padding: spacing.md,
  },
  legalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  legalModalTitle: {
    ...typography.headlineSm,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  legalFramework: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 4,
  },
  legalModalScroll: {
    paddingVertical: spacing.md,
  },
  legalSectionBox: {
    marginBottom: spacing.md,
  },
  legalSectionHeading: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  legalSectionBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exportJsonBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    maxHeight: 250,
  },
  exportJsonText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.textPrimary,
  },
  apiKeyInfoText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  apiKeySubInfoText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  apiKeyInput: {
    backgroundColor: colors.surfaceContainerHighest,
    color: colors.textPrimary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.bodyMd,
    marginBottom: spacing.md,
  },
  apiKeyBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
});
