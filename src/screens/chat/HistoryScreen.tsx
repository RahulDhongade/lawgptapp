import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Search,
  Trash2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Input } from '../../components/ui/Input';
import { useChatStore, ChatConversation } from '../../store/chatStore';

export interface HistoryScreenProps {
  onResumeChat: (query: string, conversationId?: string) => void;
  onNewChat: () => void;
}

interface HistorySection {
  title: string;
  data: ChatConversation[];
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onResumeChat,
  onNewChat,
}) => {
  const { t } = useTranslation();
  const { conversations, deleteConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lower = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.lastMessageSnippet.toLowerCase().includes(lower)
    );
  }, [conversations, searchQuery]);

  // Group into Today / Yesterday / Previous 7 days / Older
  const sections: HistorySection[] = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfYesterday = startOfToday - oneDayMs;
    const startOf7Days = startOfToday - 6 * oneDayMs;

    const todayList: ChatConversation[] = [];
    const yesterdayList: ChatConversation[] = [];
    const prev7List: ChatConversation[] = [];
    const olderList: ChatConversation[] = [];

    filteredConversations.forEach((conv) => {
      const convTime = new Date(conv.updatedAt).getTime();
      if (convTime >= startOfToday) {
        todayList.push(conv);
      } else if (convTime >= startOfYesterday) {
        yesterdayList.push(conv);
      } else if (convTime >= startOf7Days) {
        prev7List.push(conv);
      } else {
        olderList.push(conv);
      }
    });

    const result: HistorySection[] = [];
    if (todayList.length > 0) result.push({ title: 'Today', data: todayList });
    if (yesterdayList.length > 0) result.push({ title: 'Yesterday', data: yesterdayList });
    if (prev7List.length > 0) result.push({ title: 'Previous 7 Days', data: prev7List });
    if (olderList.length > 0) result.push({ title: 'Older Consultations', data: olderList });

    return result;
  }, [filteredConversations]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Consultation History"
        badgeText="Encrypted"
        rightAction={{
          icon: <Sparkles size={18} color={colors.primary} />,
          onPress: onNewChat,
        }}
      />

      <View style={styles.searchWrapper}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search prior legal consultations..."
        />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Consultations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your prior legal questions, BNS citations, and advice will appear here automatically.
          </Text>
          <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat}>
            <Text style={styles.newChatBtnText}>Start New Consultation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convCard}
              onPress={() => onResumeChat(item.title, item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.convIcon}>
                <MessageSquare size={18} color={colors.primary} />
              </View>

              <View style={styles.convContent}>
                <Text style={styles.convTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.convSnippet} numberOfLines={2}>
                  {item.lastMessageSnippet}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.title)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 96,
  },
  sectionHeaderBox: {
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#11172A',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  convIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(224, 169, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convContent: {
    flex: 1,
  },
  convTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  convSnippet: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  deleteBtn: {
    padding: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  newChatBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
  },
  newChatBtnText: {
    ...typography.labelMd,
    color: colors.background,
    fontWeight: '700',
  },
});
