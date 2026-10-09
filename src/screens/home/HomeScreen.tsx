import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  ArrowRight,
  Shield,
  Gavel,
  BookOpen,
  FileText,
  FileCheck,
  ChevronRight,
  Share2,
  ExternalLink,
  Lock,
  ShoppingBag,
  Home as HomeIcon,
  Users,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { EmergencySheet } from '../../components/legal/EmergencySheet';
import { QuickRightsModal } from '../../components/legal/QuickRightsModal';
import lawOfTheDayData from '../../data/lawOfTheDay.json';

const POPULAR_TOPICS = [
  { id: 'criminal', label: 'Criminal Law (BNS)', icon: Gavel },
  { id: 'cyber', label: 'Cyber Crime & UPI', icon: Lock },
  { id: 'consumer', label: 'Consumer Rights', icon: ShoppingBag },
  { id: 'property', label: 'Property & Rent', icon: HomeIcon },
  { id: 'family', label: 'Family Law', icon: Users },
  { id: 'constitution', label: 'Constitutional Rights', icon: BookOpen },
];

const RECENT_CONVERSATIONS = [
  {
    id: 'rc_1',
    title: 'Police verification guidelines',
    subtitle: 'Criminal procedure • Yesterday',
  },
  {
    id: 'rc_2',
    title: 'Tenant security deposit refund notice',
    subtitle: 'Tenancy Law • 3 days ago',
  },
  {
    id: 'rc_3',
    title: 'RTI application format for municipal office',
    subtitle: 'Public Records • 5 days ago',
  },
];

export interface HomeScreenProps {
  onNavigateChat: (initialQuery?: string) => void;
  onNavigateTools: (toolId?: string) => void;
  onOpenProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateChat,
  onNavigateTools,
  onOpenProfile,
}) => {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showQuickRights, setShowQuickRights] = useState(false);
  const [showEmergencySheet, setShowEmergencySheet] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('criminal');

  const handleMicToggle = () => {
    setIsListening(!isListening);
  };

  const handleAskLawGPT = () => {
    if (query.trim()) {
      onNavigateChat(query.trim());
    } else {
      onNavigateChat();
    }
  };

  const handleShareLawOfDay = async () => {
    try {
      await Share.share({
        message: `${lawOfTheDayData.section}: ${lawOfTheDayData.title}\n\n${lawOfTheDayData.summary}\n\nShared via LawGPT – India's AI Legal Assistant`,
      });
} catch {
      // User cancelled
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Main Top App Header */}
      <AppHeader
        title="LawGPT"
        tag="Home"
        showBack={false}
        showLanguageSwitcher={true}
        showProfile={true}
        onProfilePress={onOpenProfile}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {/* Greeting Header */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>
              {t('home.hello')} <Text style={styles.wave}>👋</Text>
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusPillText}>{t('home.bnsLive')}</Text>
            </View>
          </View>
          <Text style={styles.headlineText}>{t('home.headline')}</Text>
        </View>

        {/* Prominent Legal Query Search Card */}
        <View style={styles.searchCard}>
          <View style={styles.ambientGlow} />
          <View style={styles.searchCardHeader}>
            <Text style={styles.searchLabel}>{t('home.queryInputLabel')}</Text>
            <Text style={styles.aiTag}>{t('home.multiLingual')}</Text>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              multiline
              numberOfLines={2}
              placeholder={
                isListening
                  ? 'Listening in Hindi, Marathi or English...'
                  : t('home.queryPlaceholder')
              }
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              style={[styles.textArea, isListening && styles.textAreaListening]}
            />
            <TouchableOpacity
              onPress={handleMicToggle}
              style={[styles.micBtn, isListening && styles.micBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Voice input"
            >
              <Mic
                size={20}
                color={isListening ? colors.verified : colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.searchFooter}>
            <View style={styles.confidentialRow}>
              <ShieldCheck size={16} color={colors.verified} />
              <Text style={styles.confidentialText}>
                {t('home.confidential')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAskLawGPT}
              style={styles.askBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.askBtnText}>{t('home.askButton')}</Text>
              <ArrowRight size={16} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2x2 Quick Action Cards Grid */}
        <View style={styles.grid2x2}>
          {/* Card 1: AI Chat */}
          <TouchableOpacity
            onPress={() => onNavigateChat()}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(224, 169, 59, 0.16)' }]}>
                <Gavel size={22} color={colors.primary} />
              </View>
              <ChevronRight size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>AI Legal Chat</Text>
              <Text style={styles.actionSubtitle}>Instant conversational clarity</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: FIR Guide */}
          <TouchableOpacity
            onPress={() => onNavigateTools('fir')}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(63, 182, 139, 0.16)' }]}>
                <BookOpen size={22} color={colors.verified} />
              </View>
              <ChevronRight size={16} color={colors.verified} />
            </View>
            <View>
              <Text style={styles.actionTitle}>{t('home.firGuide')}</Text>
              <Text style={styles.actionSubtitle}>{t('home.firGuideDesc')}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Know Your Rights */}
          <TouchableOpacity
            onPress={() => setShowQuickRights(true)}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(63, 182, 139, 0.16)' }]}>
                <ShieldCheck size={22} color={colors.verified} />
              </View>
              <ChevronRight size={16} color={colors.verified} />
            </View>
            <View>
              <Text style={styles.actionTitle}>{t('home.knowRights')}</Text>
              <Text style={styles.actionSubtitle}>{t('home.knowRightsDesc')}</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Legal Documents */}
          <TouchableOpacity
            onPress={() => onNavigateTools('docs')}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(224, 169, 59, 0.16)' }]}>
                <FileText size={22} color={colors.primary} />
              </View>
              <ChevronRight size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>{t('home.legalDocs')}</Text>
              <Text style={styles.actionSubtitle}>{t('home.legalDocsDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Offline Quick Rights Emergency Shortcut */}
        <TouchableOpacity
          onPress={() => setShowQuickRights(true)}
          style={styles.offlineRightsCard}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.offlineCardTop}>
            <View style={styles.offlineLeft}>
              <Shield size={20} color={colors.primary} />
              <Text style={styles.offlineTitle}>
                {t('home.policeStopCardTitle')}
              </Text>
            </View>
            <View style={styles.offlineTag}>
              <Text style={styles.offlineTagText}>⚡ Works offline</Text>
            </View>
          </View>
          <View style={styles.offlineCardBottom}>
            <Text style={styles.offlineDesc}>
              {t('home.policeStopCardDesc')}
            </Text>
            <View style={styles.noNetRow}>
              <Text style={styles.noNetText}>
                {t('home.policeStopCardAction')}
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Law of the Day Featured Banner */}
        <View style={styles.lawOfDayCard}>
          <View style={styles.goldLeftStripe} />
          <View style={styles.lawOfDayHeader}>
            <View style={styles.lawOfDayBadgeRow}>
              <Gavel size={18} color={colors.primary} />
              <Text style={styles.lawOfDayLabel}>{t('home.lawOfDay')}</Text>
            </View>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>
                {lawOfTheDayData.section}
              </Text>
            </View>
          </View>
          <Text style={styles.lawOfDayTitle}>{lawOfTheDayData.title}</Text>
          <Text style={styles.lawOfDaySummary}>{lawOfTheDayData.summary}</Text>
          <View style={styles.lawOfDayActions}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  lawOfTheDayData.section,
                  `${lawOfTheDayData.fullProvision}\n\nSource: ${lawOfTheDayData.source}`
                )
              }
              style={styles.readFullBtn}
              accessibilityRole="button"
            >
              <Text style={styles.readFullText}>
                {t('home.readFullProvision')}
              </Text>
              <ExternalLink size={14} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareLawOfDay}
              style={styles.shareBtn}
              accessibilityRole="button"
            >
              <Share2 size={16} color={colors.textSecondary} />
              <Text style={styles.shareText}>{t('common.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Topics Horizontal Scroll */}
        <View style={styles.topicsSection}>
          <View style={styles.topicsHeader}>
            <Text style={styles.topicsTitle}>{t('home.popularTopics')}</Text>
            <Text style={styles.topicsSubtitle}>Tap to explore</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topicsScroll}
          >
            {POPULAR_TOPICS.map((topic) => {
              const IconComp = topic.icon;
              const isSelected = selectedTopic === topic.id;
              return (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => {
                    setSelectedTopic(topic.id);
                    onNavigateChat(`Tell me about ${topic.label}`);
                  }}
                  style={[
                    styles.topicChip,
                    isSelected && styles.topicChipSelected,
                  ]}
                  accessibilityRole="button"
                >
                  <IconComp
                    size={16}
                    color={isSelected ? colors.onPrimary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.topicChipText,
                      isSelected && styles.topicChipTextSelected,
                    ]}
                  >
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Conversations */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>
              {t('home.recentConversations')}
            </Text>
            <TouchableOpacity onPress={() => onNavigateChat()}>
              <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentList}>
            {RECENT_CONVERSATIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onNavigateChat(item.title)}
                style={styles.recentItem}
                accessibilityRole="button"
              >
                <View style={styles.recentLeft}>
                  <View style={styles.recentIconBox}>
                    <FileCheck size={16} color={colors.primary} />
                  </View>
                  <View style={styles.recentTextCol}>
                    <Text style={styles.recentItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.recentItemSub}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statutory Regulatory Disclaimer */}
        <View style={styles.disclaimerBanner}>
          <Text style={styles.scalesIcon}>⚖️</Text>
          <Text style={styles.disclaimerText}>{t('common.disclaimer')}</Text>
        </View>
      </ScrollView>

      {/* Emergency Sheet & Quick Rights Modals */}
      <EmergencySheet
        visible={showEmergencySheet}
        onClose={() => setShowEmergencySheet(false)}
      />
      <QuickRightsModal
        visible={showQuickRights}
        onClose={() => setShowQuickRights(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.sm,
    paddingBottom: 96,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  greetingSection: {
    marginVertical: spacing.sm,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  greetingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  wave: {
    fontSize: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.verified,
  },
  statusPillText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  headlineText: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  searchCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(224, 169, 59, 0.10)',
  },
  searchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  searchLabel: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  aiTag: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    marginVertical: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    paddingRight: 44,
    color: colors.textPrimary,
    ...typography.bodyMd,
    minHeight: 64,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textAreaListening: {
    borderColor: colors.verified,
  },
  micBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  searchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  confidentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidentialText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontSize: 11,
  },
  askBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.md,
    gap: 6,
  },
  askBtnText: {
    ...typography.labelLg,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#11172A',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    minHeight: 114,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actionSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  offlineRightsCard: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  offlineTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  offlineTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  offlineTagText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  offlineCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 18,
  },
  noNetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noNetText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  lawOfDayCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing.md,
    position: 'relative',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goldLeftStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
  },
  lawOfDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lawOfDayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lawOfDayLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  sectionPill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  sectionPillText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  lawOfDayTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  lawOfDaySummary: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  lawOfDayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  readFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readFullText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  topicsSection: {
    marginVertical: spacing.sm,
  },
  topicsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topicsTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topicsSubtitle: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  topicsScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    marginRight: spacing.xs,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topicChipText: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  topicChipTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  recentSection: {
    marginVertical: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recentTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  viewAllText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  recentList: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  recentIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTextCol: {
    flex: 1,
  },
  recentItemTitle: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  recentItemSub: {
    ...typography.labelSm,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  scalesIcon: {
    fontSize: 16,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
