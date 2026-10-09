import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  RefreshCw,
  Shield,
  Scale,
  FileText,
  AlertOctagon,
  Compass,
  BookOpen,
  Calendar,
  Handshake,
  ScanText,
  Bookmark,
  ChevronRight,
  Info,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { OfflineBanner } from '../../components/ui/OfflineBanner';

export interface ToolsScreenProps {
  onSelectTool: (toolId: string) => void;
  onOpenProfile?: () => void;
}

interface ToolItem {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  actionText: string;
  category: 'criminal' | 'docs' | 'emergency';
  icon: any;
  badge?: { text: string; variant: 'primary' | 'verified' | 'emergency' | 'default' };
  keywords: string[];
}

const ALL_TOOLS: ToolItem[] = [
  {
    id: 'ipc-bns',
      title: 'IPC to BNS Converter',
      shortTitle: 'IPC to BNS',
      description: 'Map old IPC sections to new Bharatiya Nyaya Sanhita 2023.',
      actionText: 'Instant convert',
      category: 'criminal',
      icon: RefreshCw,
      badge: { text: 'New', variant: 'primary' },
      keywords: ['ipc', 'bns', 'converter', 'sections', 'penal', '420', '302', '376'],
    },
    {
      id: 'fir-guide',
      title: 'FIR Guide',
      shortTitle: 'FIR Guide',
      description: 'Step-by-step FIR filing checklist & zero FIR procedures.',
      actionText: 'Checklist flow',
      category: 'criminal',
      icon: ShieldAlert,
      badge: { text: 'Verified', variant: 'verified' },
      keywords: ['fir', 'police', 'zero fir', 'complaint', 'thana', 'cognizable'],
    },
    {
      id: 'know-rights',
      title: 'Know Your Rights',
      shortTitle: 'Know Your Rights',
      description: 'Citizens rights: police, tenant, women & consumer laws.',
      actionText: 'View handbook',
      category: 'criminal',
      icon: Scale,
      keywords: ['rights', 'police', 'arrest', 'tenant', 'women', 'consumer', 'constitution'],
    },
    {
      id: 'legal-documents',
      title: 'Legal Documents',
      shortTitle: 'Legal Documents',
      description: 'Ready-to-fill notices, affidavits & RTI formats.',
      actionText: 'Browse drafts',
      category: 'docs',
      icon: FileText,
      badge: { text: 'Curated Drafts', variant: 'primary' }, // Neutralized badge (Rule 1)
      keywords: ['documents', 'notices', 'affidavit', 'rti', 'rent', 'draft'],
    },
    {
      id: 'cyber-fraud',
      title: 'Cyber Fraud Help',
      shortTitle: 'Cyber Fraud Help',
      description: 'Emergency steps for UPI & bank account scams.',
      actionText: 'Golden hour protocol',
      category: 'emergency',
      icon: AlertOctagon,
      badge: { text: '1930 SOS', variant: 'emergency' },
      keywords: ['cyber', 'fraud', 'upi', '1930', 'scam', 'bank', 'freeze'],
    },
    {
      id: 'scenario-guides',
      title: 'Scenario Guides',
      shortTitle: 'Scenario Guides',
      description: 'Action plans: accident, arrest, or unpaid salary disputes.',
      actionText: 'Interactive triage',
      category: 'emergency',
      icon: Compass,
      keywords: ['scenario', 'accident', 'arrest', 'wage', 'salary', 'dispute'],
    },
    {
      id: 'legal-search',
      title: 'Legal Search',
      shortTitle: 'Legal Search',
      description: 'Search BNS, BNSS, BSA & Constitution bare acts.',
      actionText: 'Lookup acts',
      category: 'criminal',
      icon: Search,
      keywords: ['search', 'bare acts', 'bnss', 'bsa', 'constitution'],
    },
    {
      id: 'legal-glossary',
      title: 'Legal Glossary',
      shortTitle: 'Legal Glossary',
      description: 'A-Z Indian legal terminology explained in simple words.',
      actionText: 'A–Z Terms', // Neutralized badge (Rule 1)
      category: 'docs',
      icon: BookOpen,
      badge: { text: 'A–Z Terms', variant: 'default' },
      keywords: ['glossary', 'terms', 'vakalatnama', 'bail', 'cognizance', 'meaning'],
    },
    {
      id: 'case-tracker',
      title: 'Case Tracker',
      shortTitle: 'Case Tracker',
      description: 'Track hearing dates & live case status alerts via CNR.',
      actionText: 'Manual Diary', // Neutralized badge (Rule 1)
      category: 'emergency',
      icon: Calendar,
      badge: { text: 'Manual Diary', variant: 'default' },
      keywords: ['case', 'tracker', 'cnr', 'hearing', 'dates', 'diary'],
    },
    {
      id: 'legal-aid',
      title: 'Free Legal Aid (NALSA)',
      shortTitle: 'Legal Aid (NALSA)',
      description: 'Find government free legal service authorities near you.',
      actionText: 'Find DLSA center',
      category: 'emergency',
      icon: Handshake,
      badge: { text: 'Free', variant: 'primary' },
      keywords: ['legal aid', 'nalsa', 'dlsa', 'free', 'lawyer', 'pro bono'],
    },
    {
      id: 'doc-analysis',
      title: 'Document Analysis',
      shortTitle: 'Doc Analysis',
      description: 'Scan agreements & identify red flags or hidden clauses.',
      actionText: 'Upload & scan',
      category: 'docs',
      icon: ScanText,
      badge: { text: 'AI Scan', variant: 'primary' },
      keywords: ['document analysis', 'scanner', 'agreement', 'contract', 'lease'],
    },
    {
      id: 'saved-library',
      title: 'Saved Library',
      shortTitle: 'Saved Library',
      description: 'Your saved advice, bookmarked sections & draft notices.',
      actionText: 'Open archive',
      category: 'docs',
      icon: Bookmark,
      badge: { text: 'Archive', variant: 'default' },
      keywords: ['saved', 'bookmarks', 'library', 'archive', 'pinned'],
    },
  ];

export const ToolsScreen: React.FC<ToolsScreenProps> = ({
  onSelectTool,
  onOpenProfile,
}) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'criminal' | 'docs' | 'emergency'>('all');

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      // Category check
      if (activeFilter !== 'all' && tool.category !== activeFilter) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = tool.title.toLowerCase().includes(query);
        const matchesDesc = tool.description.toLowerCase().includes(query);
        const matchesKeyword = tool.keywords.some((k) => k.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesKeyword;
      }
      return true;
    });
  }, [searchQuery, activeFilter]);

  const handleToolPress = (tool: ToolItem) => {
    onSelectTool(tool.id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="LawGPT"
        tag="Legal Tools"
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
        {/* Intro Header */}
        <View style={styles.introHeader}>
          <View style={styles.introRow}>
            <Text style={styles.headerTitle}>{t('tools.title')}</Text>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveBadgeText}>2024 Acts Live</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{t('tools.subtitle')}</Text>

          {/* Interactive Search Bar */}
          <View style={styles.searchBar}>
            <Search size={20} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              placeholder={t('tools.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear Search"
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              style={[
                styles.filterChip,
                activeFilter === 'all' && styles.filterChipActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'all' && styles.filterTextActive,
                ]}
              >
                All (12)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('criminal')}
              style={[
                styles.filterChip,
                activeFilter === 'criminal' && styles.filterChipActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'criminal' && styles.filterTextActive,
                ]}
              >
                {t('tools.criminal')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('docs')}
              style={[
                styles.filterChip,
                activeFilter === 'docs' && styles.filterChipActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'docs' && styles.filterTextActive,
                ]}
              >
                {t('tools.docs')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('emergency')}
              style={[
                styles.filterChip,
                activeFilter === 'emergency' && styles.filterChipActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === 'emergency' && styles.filterTextActive,
                ]}
              >
                {t('tools.emergency')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 2-Column Tools Grid */}
        {filteredTools.length > 0 ? (
          <View style={styles.toolsGrid}>
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <TouchableOpacity
                  key={tool.id}
                  onPress={() => handleToolPress(tool)}
                  style={styles.toolCard}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.iconBox,
                        tool.category === 'emergency' && styles.iconBoxEmergency,
                      ]}
                    >
                      <IconComponent
                        size={22}
                        color={
                          tool.category === 'emergency'
                            ? colors.emergency
                            : colors.primary
                        }
                      />
                    </View>
                    {tool.badge && (
                      <View
                        style={[
                          styles.badge,
                          tool.badge.variant === 'primary' && styles.badgePrimary,
                          tool.badge.variant === 'verified' && styles.badgeVerified,
                          tool.badge.variant === 'emergency' && styles.badgeEmergency,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            tool.badge.variant === 'primary' && styles.badgeTextPrimary,
                            tool.badge.variant === 'verified' && styles.badgeTextVerified,
                            tool.badge.variant === 'emergency' && styles.badgeTextEmergency,
                          ]}
                        >
                          {tool.badge.text}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {tool.shortTitle}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {tool.description}
                  </Text>

                  <View style={styles.cardActionRow}>
                    <Text
                      style={[
                        styles.cardActionText,
                        tool.category === 'emergency' && styles.cardActionTextEmergency,
                      ]}
                    >
                      {tool.actionText}
                    </Text>
                    <ChevronRight
                      size={14}
                      color={
                        tool.category === 'emergency'
                          ? colors.emergency
                          : colors.primary
                      }
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Empty Search State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Search size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No legal tools found</Text>
            <Text style={styles.emptyDesc}>
              We couldn't match any tools to your query. Try keywords like "BNS", "FIR", or "Affidavit".
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.resetBtn}
              accessibilityRole="button"
            >
              <Text style={styles.resetText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Regulatory Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Info size={20} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>Statutory Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              LawGPT utilities provide automated algorithmic orientation based on Indian statutes. These tools do not constitute advocate-client privilege or formal legal counsel under the Advocates Act, 1961. Consult an enrolled advocate for judicial filings.
            </Text>
          </View>
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
  introHeader: {
    marginBottom: spacing.md,
  },
  introRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.verified,
  },
  liveBadgeText: {
    ...typography.labelSm,
    color: colors.verified,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    height: 48,
    backgroundColor: '#0F162A',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    ...typography.bodyMd,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  filterScroll: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.labelMd,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  toolCard: {
    width: '48.5%',
    backgroundColor: '#11172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 146,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxEmergency: {
    backgroundColor: colors.emergencyBg,
  },
  badge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgePrimary: {
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
  },
  badgeVerified: {
    backgroundColor: colors.verifiedBg,
  },
  badgeEmergency: {
    backgroundColor: colors.emergencyBg,
  },
  badgeText: {
    ...typography.labelSm,
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  badgeTextPrimary: {
    color: colors.primary,
  },
  badgeTextVerified: {
    color: colors.verified,
  },
  badgeTextEmergency: {
    color: colors.emergency,
  },
  cardTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cardDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
  cardActionText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
  cardActionTextEmergency: {
    color: colors.emergency,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyDesc: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    maxWidth: 280,
  },
  resetBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  resetText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  disclaimerTitle: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  disclaimerText: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
