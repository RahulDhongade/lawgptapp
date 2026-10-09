import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, radii, typography, spacing } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'emergency' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  icon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const effectiveLeftIcon = leftIcon || icon;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'emergency':
        return {
          backgroundColor: colors.emergency,
          borderColor: colors.emergency,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surfaceContainerHigh,
          borderColor: colors.outlineVariant,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'emergency':
      case 'ghost':
      case 'outline':
      case 'secondary':
        return colors.textPrimary;
      case 'primary':
      default:
        return colors.onPrimary; // Contrast text on gold
    }
  };

  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      case 'md':
      default:
        return 48; // Standard 48px touch target
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.base,
        getContainerStyle(),
        { height: getHeight() },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <View style={styles.contentRow}>
          {effectiveLeftIcon && <View style={styles.leftIcon}>{effectiveLeftIcon}</View>}
          <Text
            style={[
              styles.text,
              { color: getTextColor() },
              size === 'sm' && typography.labelMd,
              size === 'md' && typography.labelLg,
              size === 'lg' && typography.headlineSm,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  text: {
    ...typography.labelLg,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
