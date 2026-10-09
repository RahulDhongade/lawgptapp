import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  AlertCircle,
  Gavel,
  Info,
  Clock,
  Shield,
  CheckCircle,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useCaseStore, TrackedCase, CaseStatus } from '../../store/caseStore';

export interface CaseTrackerScreenProps {
  onBack: () => void;
}

export const CaseTrackerScreen: React.FC<CaseTrackerScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const {
    cases,
    loadCases,
    addCase,
    updateCase,
    deleteCase,
    togglePin,
  } = useCaseStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Form State
  const [caseName, setCaseName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [cnr, setCnr] = useState('');
  const [court, setCourt] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [status, setStatus] = useState<CaseStatus>('HEARING');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const openAddModal = () => {
    setEditingCaseId(null);
    setCaseName('');
    setCaseNumber('');
    setCnr('');
    setCourt('');
    setNextDate('');
    setStatus('HEARING');
    setNotes('');
    setReminderEnabled(true);
    setModalVisible(true);
  };

  const openEditModal = (c: TrackedCase) => {
    setEditingCaseId(c.id);
    setCaseName(c.caseName);
    setCaseNumber(c.caseNumber);
    setCnr(c.cnr || '');
    setCourt(c.court);
    setNextDate(c.nextDate);
    setStatus(c.status);
    setNotes(c.notes || '');
    setReminderEnabled(c.reminderEnabled);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!caseName.trim() || !caseNumber.trim() || !court.trim() || !nextDate.trim()) {
      Alert.alert('Missing Fields', 'Please provide Case Name, Case Number, Court, and Next Date.');
      return;
    }

    if (editingCaseId) {
      await updateCase(editingCaseId, {
        caseName,
        caseNumber,
        cnr,
        court,
        nextDate,
        status,
        notes,
        reminderEnabled,
      });
    } else {
      await addCase({
        caseName,
        caseNumber,
        cnr,
        court,
        nextDate,
        status,
        notes,
        reminderEnabled,
        isPinned: false,
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Case',
      `Are you sure you want to remove "${name}" from your case diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCase(id);
          },
        },
      ]
    );
  };

  const sortedCases = [...cases].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.nextDate.localeCompare(b.nextDate);
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Case Diary & Tracker"
        badgeText="Manual Diary"
        onBackPress={onBack}
        rightAction={{
          icon: <Plus size={20} color={colors.primary} />,
          onPress: openAddModal,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Prominent Statutory Label */}
        <View style={styles.disclaimerBox}>
          <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>Personal Case Diary – Manual Entry Only</Text>
            <Text style={styles.disclaimerText}>
              LawGPT does not sync with eCourts or any official government portal. This is a private diary for your hearings and reminders.
            </Text>
          </View>
        </View>

        {/* Battery optimization notification advisory */}
        <View style={styles.batteryNotice}>
          <Bell size={14} color={colors.textSecondary} />
          <Text style={styles.batteryNoticeText}>
            Notification reminders (24h prior) depend on device battery optimisation settings.
          </Text>
        </View>

        {/* Empty State */}
        {cases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Gavel size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Cases in Diary</Text>
            <Text style={styles.emptySubtitle}>
              Keep track of your case dates, courtroom proceedings, and private hearing notes securely on your device.
            </Text>
            <Button
              title="Add Your First Case"
              variant="primary"
              onPress={openAddModal}
              icon={<Plus size={18} color={colors.background} />}
            />
          </View>
        ) : (
          /* Cases List */
          <View style={styles.casesList}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionHeading}>My Case Docket ({cases.length})</Text>
              <TouchableOpacity onPress={openAddModal} style={styles.addSmallBtn}>
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addSmallBtnText}>Add Case</Text>
              </TouchableOpacity>
            </View>

            {sortedCases.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.caseCard,
                  item.isPinned && styles.pinnedCardBorder, // Amber 40% border from DESIGN.md
                ]}
              >
                {/* Top card row: Pin & Name */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.caseName}>{item.caseName}</Text>
                      {item.isPinned && (
                        <View style={styles.pinnedBadge}>
                          <Pin size={12} color={colors.primary} />
                          <Text style={styles.pinnedText}>Pinned</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.caseNumber}>{item.caseNumber}</Text>
                  </View>

                  <Badge
                    label={item.status}
                    variant={
                      item.status === 'HEARING'
                        ? 'primary'
                        : item.status === 'DISPOSED'
                        ? 'verified'
                        : 'default'
                    }
                  />
                </View>

                {/* Details */}
                <View style={styles.detailRow}>
                  <Gavel size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{item.court}</Text>
                </View>

                {item.cnr ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.cnrLabel}>CNR:</Text>
                    <Text style={styles.cnrValue}>{item.cnr}</Text>
                  </View>
                ) : null}

                <View style={styles.dateRow}>
                  <Calendar size={14} color={colors.primary} />
                  <Text style={styles.dateLabel}>Next Hearing:</Text>
                  <Text style={styles.dateValue}>{item.nextDate}</Text>
                  {item.reminderEnabled ? (
                    <View style={styles.reminderTag}>
                      <Bell size={12} color={colors.secondary} />
                      <Text style={styles.reminderTagText}>24h Alert On</Text>
                    </View>
                  ) : null}
                </View>

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => togglePin(item.id)}
                  >
                    <Pin
                      size={16}
                      color={item.isPinned ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.actionBtnText}>
                      {item.isPinned ? 'Unpin' : 'Pin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Edit2 size={16} color={colors.textSecondary} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id, item.caseName)}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCaseId ? 'Edit Case Entry' : 'Add New Case Diary'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Case Title / Parties *</Text>
                <Input
                  value={caseName}
                  onChangeText={setCaseName}
                  placeholder="e.g. Ramesh Kumar v. State of Delhi"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Case Number / Year *</Text>
                <Input
                  value={caseNumber}
                  onChangeText={setCaseNumber}
                  placeholder="e.g. CRL.M.C. 1420/2024 or OS 55/2023"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CNR Number (Optional)</Text>
                <Input
                  value={cnr}
                  onChangeText={setCnr}
                  placeholder="e.g. DLHC010048292024"
                />
                <Text style={styles.inputHint}>
                  Manual identifier only. LawGPT does not fetch data from eCourts.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Court / Forum *</Text>
                <Input
                  value={court}
                  onChangeText={setCourt}
                  placeholder="e.g. Delhi High Court / District Court Saket"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Next Hearing Date (YYYY-MM-DD) *</Text>
                <Input
                  value={nextDate}
                  onChangeText={setNextDate}
                  placeholder="YYYY-MM-DD (e.g. 2025-05-18)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Status</Text>
                <View style={styles.statusPillsRow}>
                  {(['HEARING', 'ARGUMENTS', 'EVIDENCE', 'PENDING', 'DISPOSED'] as CaseStatus[]).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusPill,
                        status === st && styles.statusPillActive,
                      ]}
                      onPress={() => setStatus(st)}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          status === st && styles.statusPillTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Private Hearing Notes</Text>
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. File evidence affidavit, advocate fee paid, summons unserved..."
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>24-Hour Hearing Reminder</Text>
                  <Text style={styles.switchDesc}>
                    Schedule local device notification one day before court date.
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                />
              </View>

              <View style={{ height: spacing.lg }} />

              <Button
                title={editingCaseId ? 'Update Case' : 'Save to Diary'}
                variant="primary"
                onPress={handleSave}
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  disclaimerTitle: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  batteryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  batteryNoticeText: {
    ...typography.labelSm,
    color: colors.textTertiary,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginTop: spacing.md,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  casesList: {
    marginTop: spacing.xs,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addSmallBtnText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  caseCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pinnedCardBorder: {
    borderColor: 'rgba(255, 196, 84, 0.40)', // Amber 40% border from DESIGN.md
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  caseName: {
    ...typography.headlineSm,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinnedText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },
  caseNumber: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  detailText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
  },
  cnrLabel: {
    ...typography.labelSm,
    color: colors.textTertiary,
  },
  cnrValue: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  dateLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  dateValue: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  reminderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  reminderTagText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
  },
  notesText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    ...typography.labelSm,
    color: colors.textSecondary,
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
  modalCloseText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  modalScroll: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputHint: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginTop: 4,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusPill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  statusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusPillText: {
    ...typography.labelSm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  switchTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  switchDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
});
