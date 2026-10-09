import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'low';
  highlighted?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = 'default',
  highlighted = false,
  style,
  contentStyle,
}) => {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceContainerHigh;
      case 'low':
        return colors.surfaceContainerLow;
      case 'default':
      default:
        return colors.surfaceContainer;
    }
  };

  const containerStyles: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: getBackgroundColor() },
    highlighted && styles.highlighted,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={containerStyles}
        accessibilityRole="button"
      >
        <View style={contentStyle}>{children}</View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  highlighted: {
    borderColor: colors.borderHighlight,
  },
});
