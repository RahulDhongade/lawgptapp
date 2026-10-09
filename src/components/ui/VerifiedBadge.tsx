import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, Sparkles } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';

export interface VerifiedBadgeProps {
  verified: boolean;
  style?: ViewStyle;
}

/**
 * VerifiedBadge enforces Critical Rule 2:
 * - Green "Verified Source" with CheckCircle ONLY when verified === true
 * - Grey "AI Explanation" with Sparkles when verified === false
 * - Never defaults to verified
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified,
  style,
}) => {
  if (verified) {
    return (
      <View style={[styles.badge, styles.verifiedContainer, style]}>
        <CheckCircle2
          size={12}
          color={colors.verified}
          style={styles.icon}
        />
        <Text style={[styles.text, styles.verifiedText]}>Verified Source</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.unverifiedContainer, style]}>
      <Sparkles
        size={12}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[styles.text, styles.unverifiedText]}>AI Explanation</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  verifiedContainer: {
    backgroundColor: colors.verifiedBg,
    borderColor: colors.verified,
  },
  unverifiedContainer: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.labelSm,
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedText: {
    color: colors.verified,
  },
  unverifiedText: {
    color: colors.textSecondary,
  },
});
