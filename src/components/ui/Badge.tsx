import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, typography, spacing } from '../../theme';

export interface BadgeProps {
  label?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'verified' | 'emergency' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  text,
  variant = 'default',
  style,
  textStyle,
  icon,
}) => {
  const displayText = label || text || '';

  const getBadgeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: 'rgba(224, 169, 59, 0.15)',
            borderColor: 'rgba(224, 169, 59, 0.30)',
          },
          text: { color: colors.primary },
        };
      case 'secondary':
      case 'verified':
        return {
          container: {
            backgroundColor: colors.verifiedBg,
            borderColor: colors.verified,
          },
          text: { color: colors.verified },
        };
      case 'emergency':
        return {
          container: {
            backgroundColor: colors.emergencyBg,
            borderColor: colors.emergency,
          },
          text: { color: colors.emergency },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: colors.border,
          },
          text: { color: colors.textSecondary },
        };
      case 'default':
      default:
        return {
          container: {
            backgroundColor: colors.surfaceContainerHigh,
            borderColor: colors.border,
          },
          text: { color: colors.textSecondary },
        };
    }
  };

  const current = getBadgeStyle();

  return (
    <View style={[styles.badge, current.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, current.text, textStyle]}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.labelSm,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
