import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface OfflineBannerProps {
  message?: string;
  forceVisible?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = 'You are currently offline. Local legal handbooks & emergency numbers remain active. New AI queries require an active connection.',
  forceVisible = false,
}) => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline && !forceVisible) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <WifiOff size={16} color={colors.primary} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.borderHighlight,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
});
