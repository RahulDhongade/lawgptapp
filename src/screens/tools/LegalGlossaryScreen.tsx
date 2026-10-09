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
} from 'react-native';
import {
  ArrowLeft,
  Search,
  X,
  BookOpen,
  Info,
  Globe,
  Check,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Badge } from '../../components/ui/Badge';
import legalGlossaryData from '../../data/legalGlossary.json';

export interface LegalGlossaryScreenProps {
  onBack: () => void;
}

type LangMode = 'en' | 'hi' | 'mr';

const ALPHABET = ['ALL', 'A', 'B', 'C', 'D', 'F', 'H', 'I', 'J', 'L', 'N', 'P', 'Q', 'S', 'V', 'Z'];

export const LegalGlossaryScreen: React.FC<LegalGlossaryScreenProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [lang, setLang] = useState<LangMode>('en');

  const alphabet = ALPHABET;

  const filteredTerms = useMemo(() => {
    return legalGlossaryData.terms.filter((term) => {
      // Letter filter
      if (selectedLetter !== 'ALL' && term.letter !== selectedLetter) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTerm = term.term.toLowerCase().includes(q);
      const matchHi = term.hi.toLowerCase().includes(q);
      const matchMr = term.mr.toLowerCase().includes(q);
      const matchDef = term.definitionEn.toLowerCase().includes(q);
      return matchTerm || matchHi || matchMr || matchDef;
    });
  }, [searchQuery, selectedLetter]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Legal Glossary"
        showBack
        onBack={onBack}
        badgeText="Trilingual"
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
            <Text style={styles.reviewTitle}>Ministry of Law & Justice Dictionary</Text>
            <Text style={styles.reviewSubtitle}>
              Trilingual legal terminology. Status: UNREVIEWED (Sample dataset; advocate review pending).
            </Text>
          </View>
        </View>

        {/* Trilingual Language Selector */}
        <View style={styles.langSelectorRow}>
          <View style={styles.langLabelBox}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.langLabelText}>Explanation Language:</Text>
          </View>

          <View style={styles.langPills}>
            <TouchableOpacity
              style={[styles.langPill, lang === 'en' && styles.langPillActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.langPillText, lang === 'en' && styles.langPillTextActive]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPill, lang === 'hi' && styles.langPillActive]}
              onPress={() => setLang('hi')}
            >
              <Text style={[styles.langPillText, lang === 'hi' && styles.langPillTextActive]}>
                हिन्दी
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langPill, lang === 'mr' && styles.langPillActive]}
              onPress={() => setLang('mr')}
            >
              <Text style={[styles.langPillText, lang === 'mr' && styles.langPillTextActive]}>
                मराठी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search legal term (e.g. bail, FIR, affidavit)..."
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

        {/* A-Z Alphabet Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.alphabetScroll}
        >
          {alphabet.map((letter) => {
            const isSelected = selectedLetter === letter;
            return (
              <TouchableOpacity
                key={letter}
                style={[styles.letterPill, isSelected && styles.letterPillActive]}
                onPress={() => setSelectedLetter(letter)}
              >
                <Text
                  style={[
                    styles.letterPillText,
                    isSelected && styles.letterPillTextActive,
                  ]}
                >
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Terms List */}
        <View style={styles.termsList}>
          {filteredTerms.length > 0 ? (
            filteredTerms.map((t) => {
              const currentDefinition =
                lang === 'hi' ? t.definitionHi : lang === 'mr' ? t.definitionMr : t.definitionEn;

              return (
                <View key={t.id} style={styles.termCard}>
                  <View style={styles.termCardHeader}>
                    <View style={styles.termTitlesCol}>
                      <Text style={styles.englishTerm}>{t.term}</Text>
                      <View style={styles.translationsRow}>
                        <Text style={styles.hindiTranslation}>{t.hi}</Text>
                        <Text style={styles.translationDivider}>•</Text>
                        <Text style={styles.marathiTranslation}>{t.mr}</Text>
                      </View>
                    </View>
                    <Badge text={t.category} variant="primary" />
                  </View>

                  {/* Primary Language Definition */}
                  <View style={styles.definitionBox}>
                    <Text style={styles.definitionText}>{currentDefinition}</Text>
                  </View>

                  {/* Plain Language Summary */}
                  <View style={styles.plainSummaryBox}>
                    <Text style={styles.plainSummaryTitle}>Plain English Meaning:</Text>
                    <Text style={styles.plainSummaryText}>{t.plainExplanationEn}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <BookOpen size={36} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No terms found</Text>
              <Text style={styles.emptyDesc}>
                We couldn't find any terms matching "{searchQuery}". Try selecting "ALL" or searching for "FIR" or "Bail".
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedLetter('ALL');
                }}
              >
                <Text style={styles.resetBtnText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  langLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  langLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  langPills: {
    flexDirection: 'row',
    gap: 4,
  },
  langPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.elevated,
  },
  langPillActive: {
    backgroundColor: colors.primary,
  },
  langPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  langPillTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
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
  alphabetScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  letterPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  letterPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  letterPillTextActive: {
    color: colors.onPrimary,
  },
  termsList: {
    gap: spacing.md,
  },
  termCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  termCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  termTitlesCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  englishTerm: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  translationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  hindiTranslation: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  translationDivider: {
    color: colors.textSecondary,
  },
  marathiTranslation: {
    ...typography.bodySm,
    color: colors.verified,
    fontWeight: '600',
  },
  definitionBox: {
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.sm,
  },
  definitionText: {
    ...typography.bodySm,
    color: colors.text,
    lineHeight: 20,
  },
  plainSummaryBox: {
    paddingTop: spacing.xs,
  },
  plainSummaryTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  plainSummaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
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
