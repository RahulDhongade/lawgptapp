import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import * as Speech from 'expo-speech';
import {
  Gavel,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Copy,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Library,
  Check,
  FileCheck2,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { ScaleOfJusticeLogo } from '../ui/ScaleOfJusticeLogo';
import { StructuredAIChatResponse } from '../../api/types';

export interface StructuredAnswerCardProps {
  data: StructuredAIChatResponse;
  onExplainSimpler?: () => void;
}

export const StructuredAnswerCard: React.FC<StructuredAnswerCardProps> = ({
  data,
  onExplainSimpler,
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCitationsOpen, setIsCitationsOpen] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleBookmarkToggle = () => {
    setBookmarked(!bookmarked);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `LawGPT Advisory:\n\n${data.summary}\n\nCrucial Directive: ${data.crucialDirective}\n\nShared via LawGPT`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleToggleSpeech = () => {
    if (isPlayingAudio) {
      Speech.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const textToRead = `${data.summary}. Crucial Directive: ${data.crucialDirective}`;
      Speech.speak(textToRead, {
        language: 'en-IN',
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Card Header & Avatar */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarBox}>
          <ScaleOfJusticeLogo size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.engineLabel}>LawGPT</Text>
          <Text style={styles.assistantSubtitle}>AI Legal Advisory • Verified Core</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>Just now</Text>
        </View>
      </View>

      <View style={styles.mainCard}>
        {/* 1. Direct AI Answer */}
        <View style={styles.summaryBox}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.summaryHeaderTitle}>Direct AI Advisory</Text>
          </View>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>

        {/* 2. Relevant Statutory Law Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.relevantLawHeader}>
            <View style={styles.sectionHeaderRow}>
              <Gavel size={16} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>
                Relevant Statutory Law
              </Text>
            </View>
          </View>

          {data.relevantLaw.map((law, index) => (
            <View key={index} style={styles.lawItemBox}>
              <View style={styles.lawTitleRow}>
                <Text style={styles.lawActText}>{law.section}</Text>
                {/* Critical Rule 2: Shows Green ONLY when verified === true, else grey */}
                <VerifiedBadge verified={law.verified} />
              </View>
              <Text style={styles.lawBodyText}>{law.act}</Text>
              {law.text && <Text style={styles.lawSnippet}>{law.text}</Text>}
            </View>
          ))}
        </View>

        {/* 3. Procedural Explanation */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <BookOpen size={16} color={colors.primary} />
            <Text style={styles.sectionHeaderTitle}>Procedural Explanation</Text>
          </View>

          <View style={styles.stepsList}>
            {data.explanationSteps.map((step) => (
              <View key={step.step} style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. What You Can Do Immediately */}
        {data.whatYouCanDo.length > 0 && (
          <View style={styles.actionTacticsBox}>
            <View style={styles.sectionHeaderRow}>
              <CheckCircle size={16} color={colors.verified} />
              <Text style={styles.tacticsTitle}>
                What You Can Do Immediately
              </Text>
            </View>
            {data.whatYouCanDo.map((tactic, i) => (
              <Text key={i} style={styles.tacticItem}>
                • {tactic}
              </Text>
            ))}
          </View>
        )}

        {/* 5. Crucial Directive (Urgency Caution) */}
        {data.crucialDirective && (
          <View style={styles.directiveBox}>
            <AlertTriangle
              size={18}
              color={colors.emergency}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.directiveTitle}>Crucial Directive</Text>
              <Text style={styles.directiveText}>{data.crucialDirective}</Text>
            </View>
          </View>
        )}

        {/* 6. Response Action Deck */}
        <View style={styles.actionDeck}>
          <View style={styles.actionLeftRow}>
            <TouchableOpacity
              onPress={handleCopy}
              style={styles.iconActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Copy answer"
            >
              {copied ? (
                <Check size={16} color={colors.verified} />
              ) : (
                <Copy size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBookmarkToggle}
              style={styles.iconActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Bookmark answer"
            >
              <Bookmark
                size={16}
                color={bookmarked ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.iconActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Share answer"
            >
              <Share2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleSpeech}
              style={styles.audioActionBtn}
              accessibilityRole="button"
            >
              {isPlayingAudio ? (
                <VolumeX size={16} color={colors.emergency} />
              ) : (
                <Volume2 size={16} color={colors.textSecondary} />
              )}
              <Text
                style={[
                  styles.audioActionText,
                  isPlayingAudio && { color: colors.emergency },
                ]}
              >
                {isPlayingAudio ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          {onExplainSimpler && (
            <TouchableOpacity
              onPress={onExplainSimpler}
              style={styles.simplerBtn}
              accessibilityRole="button"
            >
              <Sparkles size={14} color={colors.primary} />
              <Text style={styles.simplerText}>Explain simpler</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 7. Collapsible Citations Section */}
        {data.citations && data.citations.length > 0 && (
          <View style={styles.citationsContainer}>
            <TouchableOpacity
              onPress={() => setIsCitationsOpen(!isCitationsOpen)}
              style={styles.citationsHeader}
              accessibilityRole="button"
            >
              <View style={styles.citationsTitleRow}>
                <Library size={16} color={colors.primary} />
                <Text style={styles.citationsTitle}>
                  Citations & Official Precedents
                </Text>
              </View>
              {isCitationsOpen ? (
                <ChevronUp size={18} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {isCitationsOpen && (
              <View style={styles.citationsBody}>
                {data.citations.map((cite, index) => (
                  <View key={index} style={styles.citationCard}>
                    <View style={styles.citationTopRow}>
                      <Text style={styles.citationCaseTitle}>
                        {cite.caseTitle}
                      </Text>
                      <View style={styles.citationBadge}>
                        <Text style={styles.citationBadgeText}>
                          {cite.citation}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.citationSnippet}>{cite.snippet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 8. Statutory Disclaimer Note */}
        <View style={styles.disclaimerNote}>
          <Text style={styles.disclaimerText}>{data.disclaimer}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 169, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 59, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineLabel: {
    ...typography.labelMd,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  assistantSubtitle: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.textSecondary,
  },
  timeBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timeText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.textSecondary,
  },
  mainCard: {
    backgroundColor: '#10162A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.22)',
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryBox: {
    backgroundColor: 'rgba(224, 169, 59, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.28)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  summaryHeaderTitle: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...typography.bodyMd,
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 23,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  relevantLawHeader: {
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    ...typography.labelMd,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lawItemBox: {
    backgroundColor: '#090E1D',
    borderRadius: 12,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
    marginBottom: 6,
  },
  lawTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  lawActText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.xs,
  },
  lawBodyText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  lawSnippet: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  stepsList: {
    gap: spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(37, 41, 58, 0.60)',
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stepDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  actionTacticsBox: {
    backgroundColor: 'rgba(63, 182, 139, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(63, 182, 139, 0.28)',
  },
  tacticsTitle: {
    ...typography.labelMd,
    color: colors.verified,
    fontWeight: '700',
  },
  tacticItem: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: 4,
  },
  directiveBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 72, 77, 0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.emergency,
    padding: spacing.md,
    gap: spacing.sm,
  },
  directiveTitle: {
    ...typography.labelMd,
    color: colors.emergency,
    fontWeight: '700',
    marginBottom: 2,
  },
  directiveText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  actionDeck: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  actionLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#151D33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#151D33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  audioActionText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  simplerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224, 169, 59, 0.12)',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  simplerText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  citationsContainer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  citationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm + 4,
  },
  citationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  citationsTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  citationsBody: {
    padding: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  citationCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  citationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  citationCaseTitle: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
    marginRight: 4,
  },
  citationBadge: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  citationBadgeText: {
    ...typography.labelSm,
    fontSize: 9,
    color: colors.textSecondary,
  },
  citationSnippet: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  disclaimerNote: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  disclaimerText: {
    ...typography.bodySm,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
