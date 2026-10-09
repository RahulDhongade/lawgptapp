import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Home as HomeIcon,
  Shield,
  ShoppingBag,
  Compass,
  FileText,
  Users,
  Lock,
  Scale,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Badge } from '../../components/ui/Badge';
import knowYourRightsData from '../../data/knowYourRights.json';

export interface KnowYourRightsScreenProps {
  onBack: () => void;
  initialCategoryId?: string;
}

export const KnowYourRightsScreen: React.FC<KnowYourRightsScreenProps> = ({
  onBack,
  initialCategoryId,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || knowYourRightsData.categories[0].id
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const categories = knowYourRightsData.categories;
  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert size={20} color={colors.primary} />;
      case 'Home':
        return <HomeIcon size={20} color={colors.primary} />;
      case 'Shield':
        return <Shield size={20} color={colors.verified} />;
      case 'ShoppingBag':
        return <ShoppingBag size={20} color={colors.primary} />;
      case 'Compass':
        return <Compass size={20} color={colors.primary} />;
      case 'FileText':
        return <FileText size={20} color={colors.primary} />;
      case 'Users':
        return <Users size={20} color={colors.primary} />;
      case 'Lock':
        return <Lock size={20} color={colors.primary} />;
      default:
        return <Scale size={20} color={colors.primary} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Know Your Rights"
        showBack
        onBack={onBack}
        badgeText="8 Categories"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Unreviewed Sample Dataset Banner */}
        <View style={styles.reviewBanner}>
          <Info size={16} color={colors.primary} />
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewTitle}>Statutory Rights Compendium</Text>
            <Text style={styles.reviewSubtitle}>
              Source: Constitution of India & Indian Acts. Status: UNREVIEWED (Lawyer review pending before public release).
            </Text>
          </View>
        </View>

        {/* 8 Categories Horizontal Chips / Tabs */}
        <Text style={styles.sectionHeaderTitle}>Select Rights Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setExpandedItemId(null);
                }}
                accessibilityRole="tab"
              >
                <View style={styles.catChipContent}>
                  {getIcon(cat.icon)}
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Category Header Card */}
        <View style={styles.activeCategoryHeaderCard}>
          <View style={styles.activeCatTitleRow}>
            {getIcon(activeCategory.icon)}
            <Text style={styles.activeCatTitle}>{activeCategory.title}</Text>
          </View>
          <Text style={styles.activeCatSummary}>{activeCategory.summary}</Text>
          <View style={styles.categoryItemCountBadge}>
            <Text style={styles.categoryItemCountText}>
              {activeCategory.items.length} Statutory Rights
            </Text>
          </View>
        </View>

        {/* Expandable Items List */}
        <View style={styles.itemsList}>
          {activeCategory.items.map((item) => {
            const isExpanded = expandedItemId === item.id;
            return (
              <View key={item.id} style={styles.itemCard}>
                <TouchableOpacity
                  style={styles.itemHeaderBtn}
                  onPress={() =>
                    setExpandedItemId(isExpanded ? null : item.id)
                  }
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.itemHeaderLeft}>
                    <Scale size={18} color={colors.primary} />
                    <Text style={styles.itemRightTitle}>{item.right}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {/* Always-visible short teaser */}
                <Text style={styles.itemTeaserText}>
                  {item.simpleExplanation}
                </Text>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.itemExpandedBody}>
                    {/* Legal Statutory Source Box */}
                    <View style={styles.sourceBox}>
                      <Text style={styles.sourceLabel}>Statutory Authority:</Text>
                      <Text style={styles.sourceText}>{item.legalSource}</Text>
                    </View>

                    {/* What You Can Do Action Points */}
                    <View style={styles.actionsSection}>
                      <Text style={styles.actionsHeader}>What you can do immediately:</Text>
                      {item.whatYouCanDo.map((action, idx) => (
                        <View key={idx} style={styles.actionRow}>
                          <CheckCircle2 size={16} color={colors.verified} />
                          <Text style={styles.actionText}>{action}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Timestamp & Metadata Footer */}
                    <View style={styles.itemFooter}>
                      <Text style={styles.footerDate}>
                        Last Verified: {item.lastUpdated}
                      </Text>
                      <Badge text="Statutory Right" variant="verified" />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
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
  sectionHeaderTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  categoryChipsScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    borderColor: colors.primary,
  },
  catChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeCategoryHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  activeCatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  activeCatTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  activeCatSummary: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  categoryItemCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryItemCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  itemHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemRightTitle: {
    ...typography.bodyMd,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  itemTeaserText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  itemExpandedBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceBox: {
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.md,
  },
  sourceLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  sourceText: {
    ...typography.bodySm,
    color: colors.text,
  },
  actionsSection: {
    marginBottom: spacing.md,
  },
  actionsHeader: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
