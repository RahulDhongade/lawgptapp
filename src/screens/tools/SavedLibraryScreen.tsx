import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  Search,
  Trash2,
  Share2,
  FileText,
  Scale,
  Sparkles,
  Download,
  Copy,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useSavedStore, SavedItem, SavedItemType } from '../../store/savedStore';

export interface SavedLibraryScreenProps {
  onBack: () => void;
  onOpenDraft?: (templateId: string) => void;
}

export const SavedLibraryScreen: React.FC<SavedLibraryScreenProps> = ({
  onBack,
  onOpenDraft,
}) => {
  const { t } = useTranslation();
  const { items, removeItem, exportAllAsJson } = useSavedStore();

  const [activeTab, setActiveTab] = useState<SavedItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, searchQuery]);

  const handleUnsave = (id: string, title: string) => {
    Alert.alert(
      'Remove Saved Item',
      `Unsave "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeItem(id);
            if (selectedItem?.id === id) {
              setSelectedItem(null);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    setExportModalVisible(true);
    setCopiedSuccess(false);
  };

  const handleCopyExportJson = async () => {
    const json = exportAllAsJson();
    await Clipboard.setStringAsync(json);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Saved Library"
        badgeText="Archive"
        onBackPress={onBack}
        rightAction={{
          icon: <Download size={18} color={colors.primary} />,
          onPress: handleExportData,
        }}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['all', 'response', 'section', 'document'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all'
                ? 'All'
                : tab === 'response'
                ? 'Responses'
                : tab === 'section'
                ? 'Sections'
                : 'Documents'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Full-text search in saved library..."
        />
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bookmark size={44} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Saved Items</Text>
          <Text style={styles.emptySubtitle}>
            Save key legal advice, BNS sections, or generated draft documents to access them anytime offline.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => setSelectedItem(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemHeader}>
                <View style={styles.typeBadgeRow}>
                  {item.type === 'response' ? (
                    <Sparkles size={16} color={colors.primary} />
                  ) : item.type === 'section' ? (
                    <Scale size={16} color={colors.secondary} />
                  ) : (
                    <FileText size={16} color={colors.primary} />
                  )}
                  <Badge
                    label={item.category}
                    variant={item.type === 'response' ? 'primary' : 'default'}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleUnsave(item.id, item.title)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSnippet} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.itemDate}>
                Saved on {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* View Item Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedItem?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalBadgeRow}>
                <Badge label={selectedItem?.category || ''} variant="primary" />
                <Badge label={selectedItem?.type.toUpperCase() || ''} variant="default" />
              </View>

              <Text style={styles.modalContentText}>{selectedItem?.content}</Text>

              {selectedItem?.metadata && (
                <View style={styles.metaBox}>
                  <Text style={styles.metaTitle}>Document Metadata:</Text>
                  <Text style={styles.metaJson}>
                    {JSON.stringify(selectedItem.metadata, null, 2)}
                  </Text>
                </View>
              )}

              <View style={{ height: spacing.lg }} />

              <Button
                title="Remove from Saved"
                variant="outline"
                onPress={() => {
                  if (selectedItem) {
                    handleUnsave(selectedItem.id, selectedItem.title);
                  }
                }}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* DPDP Act 2023 Data Portability Export Modal */}
      <Modal visible={exportModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>DPDP Act Data Portability</Text>
                <Text style={styles.dpdpSub}>Section 6 & 12 • Personal Data Protection</Text>
              </View>
              <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.dpdpExplanation}>
                Under the Digital Personal Data Protection Act, 2023, you have the right to data portability. The formatted JSON export below contains all your locally saved items, advice notes, and drafts.
              </Text>

              <View style={styles.jsonPreviewBox}>
                <Text style={styles.jsonPreviewText}>
                  {exportAllAsJson()}
                </Text>
              </View>

              <View style={{ height: spacing.md }} />

              <Button
                title={copiedSuccess ? 'Export Copied to Clipboard ✓' : 'Copy JSON Export'}
                variant="primary"
                onPress={handleCopyExportJson}
                icon={<Copy size={18} color={colors.background} />}
              />
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceContainerHigh,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.background,
    fontWeight: '700',
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  itemSnippet: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  itemDate: {
    ...typography.labelSm,
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dpdpSub: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 2,
  },
  modalScroll: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  modalContentText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  metaBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  metaTitle: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaJson: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.primary,
  },
  dpdpExplanation: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  jsonPreviewBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.sm,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  jsonPreviewText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: colors.textPrimary,
  },
});
