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
  Share,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  X,
  Share2,
  Copy,
  BookOpen,
  Info,
  Scale,
  Check,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import legalSearchData from '../../data/legalSearchData.json';

export interface LegalSearchScreenProps {
  onBack: () => void;
  initialQuery?: string;
}

const SEARCH_FILTERS = [
  { label: 'All Acts', key: 'ALL' },
  { label: 'BNS 2023', key: 'BNS' },
  { label: 'BNSS 2023', key: 'BNSS' },
  { label: 'BSA 2023', key: 'BSA' },
  { label: 'Constitution', key: 'Constitution' },
  { label: 'Consumer Act', key: 'Consumer Protection Act' },
];

export const LegalSearchScreen: React.FC<LegalSearchScreenProps> = ({
  onBack,
  initialQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filters = SEARCH_FILTERS;

  const filteredSections = useMemo(() => {
    return legalSearchData.sections.filter((sec) => {
      // Filter by Act
      if (activeFilter !== 'ALL' && sec.act !== activeFilter) {
        return false;
      }
      // Search matching
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSection = sec.section.toLowerCase().includes(q);
      const matchText = sec.text.toLowerCase().includes(q);
      const matchKeyword = sec.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSection || matchText || matchKeyword;
    });
  }, [searchQuery, activeFilter]);

  const handleCopy = async (id: string, text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (title: string, section: string, text: string) => {
    try {
      await Share.share({
        message: `${section} - ${title}\n\n${text}\n\nShared via LawGPT`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Bare Acts Search"
        showBack
        onBack={onBack}
        badgeText="Statutory Texts"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {/* Unreviewed Sample Dataset Banner */}
        <View style={styles.reviewBanner}>
          <Info size={16} color={colors.primary} />
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewTitle}>Direct Bare Act Clauses</Text>
            <Text style={styles.reviewSubtitle}>
              Official legislative text. Status: UNREVIEWED (Sample dataset of foundational provisions; advocate review pending).
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by section, title, or topic (e.g. 103, arrest, bail)..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {filters.map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(f.key)}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Counter */}
        <View style={styles.resultsCounterRow}>
          <Text style={styles.counterText}>
            Showing {filteredSections.length} statutory {filteredSections.length === 1 ? 'clause' : 'clauses'}
          </Text>
        </View>

        {/* Section Cards */}
        {filteredSections.length > 0 ? (
          <View style={styles.resultsList}>
            {filteredSections.map((sec) => (
              <View key={sec.id} style={styles.resultCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.sectionBadge}>{sec.section}</Text>
                    <VerifiedBadge verified={sec.verified} />
                  </View>
                  <Text style={styles.actTag}>{sec.act}</Text>
                </View>

                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.actFullName}>{sec.actFullName}</Text>

                {/* Section Bare Act Quote */}
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>{sec.text}</Text>
                </View>

                {/* Keywords Chips */}
                <View style={styles.keywordsRow}>
                  {sec.keywords.slice(0, 4).map((kw, idx) => (
                    <View key={idx} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>#{kw}</Text>
                    </View>
                  ))}
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleCopy(sec.id, `${sec.section}: ${sec.text}`)}
                  >
                    {copiedId === sec.id ? (
                      <Check size={16} color={colors.verified} />
                    ) : (
                      <Copy size={16} color={colors.textSecondary} />
                    )}
                    <Text
                      style={[
                        styles.actionBtnText,
                        copiedId === sec.id && styles.actionBtnTextSuccess,
                      ]}
                    >
                      {copiedId === sec.id ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShare(sec.title, sec.section, sec.text)}
                  >
                    <Share2 size={16} color={colors.textSecondary} />
                    <Text style={styles.actionBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Empty / No Results State */
          <View style={styles.emptyState}>
            <Scale size={36} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No matching clauses found</Text>
            <Text style={styles.emptyDesc}>
              No bare act sections matched "{searchQuery}" under the selected filter. Try searching for common terms like "arrest", "theft", or "liberty".
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
            >
              <Text style={styles.resetBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    ...typography.bodyMd,
    marginHorizontal: spacing.sm,
  },
  filterChipsRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  resultsCounterRow: {
    marginBottom: spacing.sm,
  },
  counterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  resultsList: {
    gap: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionBadge: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  actTag: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.bodyMd,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  actFullName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quoteBox: {
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  quoteText: {
    ...typography.bodySm,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  keywordBadge: {
    backgroundColor: colors.elevated,
    paddingHorizontal: spacing.xs + 4,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  keywordText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionBtnTextSuccess: {
    color: colors.verified,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptyDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resetBtnText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
});
