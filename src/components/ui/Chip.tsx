import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii, typography, spacing } from '../../theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  count?: number;
  pill?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  count,
  pill = true,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        pill ? styles.pill : styles.rounded,
        selected ? styles.chipSelected : styles.chipDefault,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelDefault,
          textStyle,
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.countBadge, selected && styles.countBadgeSelected]}>
          <Text
            style={[
              styles.countText,
              selected ? styles.countTextSelected : styles.countTextDefault,
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  pill: {
    borderRadius: radii.full,
  },
  rounded: {
    borderRadius: radii.md,
  },
  chipDefault: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.primary,
  },
  label: {
    ...typography.labelMd,
  },
  labelDefault: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  countBadgeSelected: {
    backgroundColor: colors.primary,
  },
  countText: {
    ...typography.labelSm,
    fontSize: 10,
  },
  countTextDefault: {
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
