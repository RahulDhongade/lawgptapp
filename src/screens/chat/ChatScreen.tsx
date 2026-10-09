import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ShieldAlert,
  MoreVertical,
  Paperclip,
  Mic,
  ArrowUp,
  Shield,
  RotateCcw,
  Sparkles,
  CheckCheck,
  Clock,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { ScaleOfJusticeLogo } from '../../components/ui/ScaleOfJusticeLogo';
import { StructuredAnswerCard } from '../../components/chat/StructuredAnswerCard';
import { EmergencySheet } from '../../components/legal/EmergencySheet';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useChatStore } from '../../store/chatStore';
import { apiClient } from '../../api/client';
import {
  StructuredAIChatResponse,
  StructuredAIChatResponseSchema,
} from '../../api/types';
import { useGuestStore } from '../../store/guestStore';
import { useAuthStore } from '../../store/authStore';

export interface ChatScreenProps {
  initialQuery?: string;
  onBack?: () => void;
  onOpenGuestLimitModal?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  queryText?: string;
  structuredResponse?: StructuredAIChatResponse;
  rawTextFallback?: string;
  status?: 'sent' | 'queued' | 'error';
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  initialQuery,
  onBack,
  onOpenGuestLimitModal,
}) => {
  const { t } = useTranslation();
  const { isGuest } = useAuthStore();
  const { consumeQuery, remainingQueries, resetQuota } = useGuestStore();
  const { isOffline, isConnected } = useNetworkStatus();
  const { appendMessage, createConversation, activeConversationId } = useChatStore();

  const [mode, setMode] = useState<'std' | 'plain'>('std');
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [showSosSheet, setShowSosSheet] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [queuedQueries, setQueuedQueries] = useState<{ id: string; text: string }[]>([]);

  const abortControllerRef = useRef<{ aborted: boolean }>({ aborted: false });
  const scrollViewRef = useRef<ScrollView>(null);
  const prevOfflineRef = useRef(isOffline);
  const prevInitialQueryRef = useRef<string | undefined>(initialQuery);

  // Default seed conversation matching Stitch design
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'seed_msg_user',
      sender: 'user',
      timestamp: '09:42 AM',
      queryText: initialQuery || 'What are my rights if I am arrested by police in India?',
      status: 'sent',
    },
  ]);

  // Load initial response on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialAnswer = async () => {
      try {
        const answer = await apiClient.askLegalQuestion(
          initialQuery || 'What are my rights if I am arrested by police in India?',
          mode
        );
        if (isMounted) {
          setMessages((prev) => [
            ...prev,
            {
              id: 'seed_msg_assistant',
              sender: 'assistant',
              timestamp: '09:42 AM',
              structuredResponse: answer,
              status: 'sent',
            },
          ]);
        }
      } catch {
        // Handled
      }
    };

    loadInitialAnswer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for initialQuery updates if user navigates again from HomeScreen or History
  useEffect(() => {
    if (initialQuery && initialQuery !== prevInitialQueryRef.current) {
      prevInitialQueryRef.current = initialQuery;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Safe auto-retry queued questions when reconnected without duplicates
  useEffect(() => {
    if (prevOfflineRef.current && isConnected && queuedQueries.length > 0 && !isStreaming) {
      const nextItem = queuedQueries[0];
      setQueuedQueries((prev) => prev.slice(1));
      setMessages((prev) =>
        prev.map((m) => (m.id === nextItem.id ? { ...m, status: 'sent' } : m))
      );
      executeStreamingQuery(nextItem.text, nextItem.id);
    }
    prevOfflineRef.current = isOffline;
  }, [isConnected, isOffline, queuedQueries, isStreaming]);

  const executeStreamingQuery = async (text: string, existingMsgId?: string) => {
    if (!existingMsgId) {
      const userMsg: Message = {
        id: `msg_u_${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        queryText: text,
        status: 'sent',
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setIsStreaming(true);
    setStreamedText('');
    abortControllerRef.current = { aborted: false };
    scrollViewRef.current?.scrollToEnd({ animated: true });

    let lastScrollTime = 0;
    try {
      await apiClient.streamLegalQuestion(
        text,
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
          const now = Date.now();
          if (now - lastScrollTime > 250) {
            lastScrollTime = now;
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
        },
        (finalResponse) => {
          setIsStreaming(false);
          setStreamedText('');
          scrollViewRef.current?.scrollToEnd({ animated: true });

          // Critical Rule 3: Validated response
          try {
            const validated = StructuredAIChatResponseSchema.parse(finalResponse);
            const aiMsg: Message = {
              id: `msg_a_${Date.now()}`,
              sender: 'assistant',
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              structuredResponse: validated,
              status: 'sent',
            };
            setMessages((prev) => [...prev, aiMsg]);

            // Persist to chat store for offline retention
            if (activeConversationId) {
              appendMessage(activeConversationId, {
                id: aiMsg.id,
                sender: 'assistant',
                timestamp: aiMsg.timestamp,
                structuredResponse: validated,
              });
            } else {
              createConversation(text, validated);
            }
          } catch {
            // Rule 3 Fallback to plain text card
            const fallbackMsg: Message = {
              id: `msg_fallback_${Date.now()}`,
              sender: 'assistant',
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              rawTextFallback: finalResponse.summary,
              status: 'sent',
            };
            setMessages((prev) => [...prev, fallbackMsg]);
          }
          scrollViewRef.current?.scrollToEnd({ animated: true });
        },
        abortControllerRef.current
      );
    } catch (err: any) {
      setIsStreaming(false);
      Alert.alert('Error', err.userMessage || 'Could not reach LawGPT advisory.');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputText;
    const text = (rawText || '').trim();
    if (!text || isStreaming) return;

    // Enforce reasonable input bound to prevent API abuse and DoS
    if (text.length > 4000) {
      Alert.alert(
        'Query Too Long',
        'Please limit your legal query to under 4,000 characters for optimal processing.'
      );
      return;
    }

    // Guest Mode Quota Check (Critical Rule 7)
    if (isGuest) {
      const allowed = await consumeQuery();
      if (!allowed) {
        if (onOpenGuestLimitModal) {
          onOpenGuestLimitModal();
        } else {
          Alert.alert(
            'Guest Limit Reached',
            'You have used all 3 free questions for guest mode. Please sign in or register to continue consultation.'
          );
        }
        return;
      }
    }

    setInputText('');

    // Offline Handling: Only block and queue if running in live server mode and offline
    const isMockMode = process.env.EXPO_PUBLIC_API_MODE !== 'live';
    if (!isMockMode && isOffline) {
      const userMsg: Message = {
        id: `msg_u_${Date.now()}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        queryText: text,
        status: 'queued',
      };
      setMessages((prev) => [...prev, userMsg]);
      setQueuedQueries((prev) => [...prev, { id: userMsg.id, text }]);
      Alert.alert(
        'Offline – Question Queued',
        'Generating new AI legal answers requires an active internet connection. Your question has been queued as "Waiting for connection" and will automatically process when connection is restored.'
      );
      return;
    }

    await executeStreamingQuery(text);
  };

  const handleCancelStream = () => {
    abortControllerRef.current.aborted = true;
    setIsStreaming(false);
    setStreamedText('');
  };

  /**
   * Critical Rule 9: Quick Exit button clears screen to a neutral state
   */
  const handleQuickExit = () => {
    setMessages([]);
    setInputText('');
    setIsStreaming(false);
    setStreamedText('');
    Alert.alert('Screen Cleared', 'Active consultation has been wiped from the display.');
  };

  const handleExplainSimpler = async () => {
    setMode('plain');
    await handleSendMessage('Please explain my arrest rights in much simpler terms.');
  };

  const suggestedPrompts = [
    '⚖️ What is Anticipatory Bail?',
    '📜 How to lodge a Zero FIR?',
    '👮 Can police seize my smartphone?',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Header & SOS Trigger */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.headerLogoContainer}>
            <ScaleOfJusticeLogo size={28} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>LawGPT AI</Text>
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.headerSubtitle}>
              Live AI & BNS Statutory Engine
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowSosSheet(true)}
            style={styles.sosBtn}
            accessibilityRole="button"
            accessibilityLabel="SOS Emergency Assistance"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ShieldAlert size={15} color={colors.emergency} />
            <Text style={styles.sosText}>SOS Help</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert('Chat Options', 'Session is end-to-end encrypted.')}
            style={styles.optionsBtn}
            accessibilityRole="button"
            accessibilityLabel="Chat options"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Alert Banner */}
      <OfflineBanner
        message="You are offline. New AI answers require internet. Queued questions will auto-send on reconnect."
      />
      {/* Mode Selector Pills */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          onPress={() => setMode('std')}
          style={[styles.modePill, mode === 'std' && styles.modePillActive]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.modePillText,
              mode === 'std' && styles.modePillTextActive,
            ]}
          >
            Standard Legal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('plain')}
          style={[styles.modePill, mode === 'plain' && styles.modePillActive]}
          accessibilityRole="button"
        >
          <Sparkles
            size={14}
            color={mode === 'plain' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.modePillText,
              mode === 'plain' && styles.modePillTextActive,
            ]}
          >
            Plain Explanation (सरल)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guest Mode Quota Status Bar */}
      {isGuest && (
        <View style={styles.guestNoticeBar}>
          <Text style={styles.guestNoticeText}>
            Guest Consultation • {remainingQueries} free question{remainingQueries === 1 ? '' : 's'} remaining
          </Text>
          {remainingQueries <= 0 && (
            <TouchableOpacity
              onPress={resetQuota}
              style={styles.resetQuotaPill}
              accessibilityRole="button"
            >
              <RotateCcw size={12} color={colors.primary} />
              <Text style={styles.resetQuotaText}>Reset Demo (3 Free)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Message Stream */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <View key={msg.id} style={styles.userBubbleContainer}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{msg.queryText}</Text>
                </View>
                {msg.status === 'queued' ? (
                  <View style={styles.queuedBadge}>
                    <Clock size={12} color={colors.warning} />
                    <Text style={styles.queuedBadgeText}>Waiting for connection</Text>
                  </View>
                ) : (
                  <View style={styles.timestampRow}>
                    <Text style={styles.timestampText}>{msg.timestamp}</Text>
                    <CheckCheck size={14} color={colors.primary} />
                  </View>
                )}
              </View>
            );
          }

          if (msg.structuredResponse) {
            return (
              <StructuredAnswerCard
                key={msg.id}
                data={msg.structuredResponse}
                onExplainSimpler={handleExplainSimpler}
              />
            );
          }

          // Plain text fallback (Critical Rule 3)
          return (
            <View key={msg.id} style={styles.fallbackCard}>
              <Text style={styles.fallbackTitle}>AI Legal Explanation</Text>
              <Text style={styles.fallbackBody}>{msg.rawTextFallback}</Text>
            </View>
          );
        })}

        {/* Live Streaming Chunk / Typing Indicator */}
        {isStreaming && (
          <View style={styles.streamingBox}>
            <View style={styles.streamingHeader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.streamingLabel}>
                Synthesizing statutory guidance...
              </Text>
              <TouchableOpacity
                onPress={handleCancelStream}
                style={styles.cancelBtn}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {streamedText ? (
              <Text style={styles.streamedText}>{streamedText}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts Horizontal Bar */}
      <View style={styles.promptsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsContent}
        >
          {suggestedPrompts.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSendMessage(p)}
              style={styles.promptChip}
              accessibilityRole="button"
            >
              <Text style={styles.promptChipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Docked Chat Composer Bar */}
      <View style={styles.composerWrapper}>
        <View style={styles.composerCard}>
          <TouchableOpacity
            onPress={() => Alert.alert('Attachment', 'Attach FIR copy or legal contract.')}
            style={styles.attachBtn}
            accessibilityRole="button"
            accessibilityLabel="Attach Document"
          >
            <Paperclip size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            placeholder="Ask about FIR, bail, BNSS clauses..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            onSubmitEditing={() => handleSendMessage()}
          />

          <TouchableOpacity
            onPress={() => setIsMicActive(!isMicActive)}
            style={styles.micBtn}
            accessibilityRole="button"
            accessibilityLabel="Voice Input"
          >
            <Mic
              size={20}
              color={isMicActive ? colors.verified : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            style={styles.sendBtn}
            accessibilityRole="button"
            accessibilityLabel="Send Query"
          >
            <ArrowUp size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Safe Exit Pill (Rule 9) */}
        <TouchableOpacity
          onPress={handleQuickExit}
          style={styles.quickExitBtn}
          accessibilityRole="button"
        >
          <Shield size={12} color={colors.textSecondary} />
          <Text style={styles.quickExitText}>Quick Exit (Clear screen)</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency SOS Bottom Sheet */}
      <EmergencySheet
        visible={showSosSheet}
        onClose={() => setShowSosSheet(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.margin,
    backgroundColor: '#090D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 169, 59, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  headerLogoContainer: {
    marginRight: 8,
    padding: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(224, 169, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 59, 0.28)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#151D33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    ...typography.headlineSm,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.verified,
  },
  headerSubtitle: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emergencyBg,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.emergency,
  },
  sosText: {
    ...typography.labelSm,
    color: colors.emergency,
    fontWeight: '700',
  },
  optionsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    padding: 4,
    borderRadius: radii.md,
    marginHorizontal: spacing.margin,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modePill: {
    flex: 1,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  modePillActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.primary,
  },
  modePillText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.margin,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
  },
  userBubble: {
    backgroundColor: '#16213B',
    borderRadius: 20,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.40)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubbleText: {
    ...typography.bodyMd,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 22,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginRight: 4,
  },
  timestampText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.textSecondary,
  },
  queuedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginRight: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  queuedBadgeText: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  fallbackCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  fallbackTitle: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  fallbackBody: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  streamingBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  streamingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streamingLabel: {
    ...typography.labelSm,
    color: colors.primary,
    flex: 1,
  },
  cancelBtn: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cancelText: {
    ...typography.labelSm,
    color: colors.emergency,
    fontWeight: '600',
  },
  streamedText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  promptsRow: {
    height: 48,
    backgroundColor: 'transparent',
  },
  promptsContent: {
    paddingHorizontal: spacing.margin,
    gap: spacing.xs,
  },
  promptChip: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  composerWrapper: {
    paddingHorizontal: spacing.margin,
    paddingBottom: 76,
    backgroundColor: colors.background,
  },
  composerCard: {
    minHeight: 56,
    backgroundColor: '#0F162A',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    color: colors.textPrimary,
    ...typography.bodyMd,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickExitBtn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    opacity: 0.8,
  },
  quickExitText: {
    ...typography.labelSm,
    fontSize: 11,
    color: colors.textSecondary,
  },
  guestNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.margin,
    paddingVertical: 6,
    backgroundColor: 'rgba(224, 169, 59, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 169, 59, 0.2)',
  },
  guestNoticeText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '500',
  },
  resetQuotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetQuotaText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
});
