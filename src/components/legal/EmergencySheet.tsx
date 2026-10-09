import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { Phone, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { EMERGENCY_CONTACTS, EmergencyContact } from '../../constants/emergency';

export interface EmergencySheetProps {
  visible: boolean;
  onClose: () => void;
}

export const EmergencySheet: React.FC<EmergencySheetProps> = ({
  visible,
  onClose,
}) => {
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const getCategoryColor = (cat: EmergencyContact['category']) => {
    switch (cat) {
      case 'POLICE':
      case 'CYBER':
        return colors.emergency;
      case 'WOMEN':
      case 'CHILD':
        return colors.primary;
      case 'LEGAL_AID':
      default:
        return colors.verified;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Emergency Helplines (SOS)">
      <View style={styles.headerNotice}>
        <ShieldAlert size={20} color={colors.emergency} />
        <Text style={styles.noticeText}>
          Direct government emergency dispatches. Static & bundled. Zero network needed.
        </Text>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        {EMERGENCY_CONTACTS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleCall(item.number)}
            activeOpacity={0.8}
            style={styles.contactCard}
            accessibilityRole="button"
            accessibilityLabel={`Call ${item.name} on ${item.number}`}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sourceText}>{item.officialSource}</Text>
              </View>
              <View
                style={[
                  styles.dialBadge,
                  { backgroundColor: getCategoryColor(item.category) },
                ]}
              >
                <Phone size={14} color={colors.textPrimary} />
                <Text style={styles.dialText}>{item.number}</Text>
              </View>
            </View>

            <Text style={styles.desc}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.auditStamp}>
                <CheckCircle size={12} color={colors.verified} />
                <Text style={styles.auditText}>
                  Verified: {item.lastVerified}
                </Text>
              </View>
              <Text style={styles.tapToCall}>Tap to Call 📞</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  headerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emergencyBg,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.bodySm,
    color: colors.emergency,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  scrollList: {
    maxHeight: 460,
  },
  contactCard: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sourceText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 4,
  },
  dialText: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  desc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  auditStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  auditText: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.verified,
  },
  tapToCall: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },
});
