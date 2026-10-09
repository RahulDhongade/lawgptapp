import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, typography, spacing } from '../../theme';

export interface CitationBadgeProps {
  citation: string;
  style?: ViewStyle;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  citation,
  style,
}) => {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{citation}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.labelSm,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
