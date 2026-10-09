import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';

export interface TabPlaceholderProps {
  title: string;
  tag?: string;
}

export const TabPlaceholder: React.FC<TabPlaceholderProps> = ({ title, tag }) => {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="LawGPT" tag={tag || title} />
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Active Sovereign Interface tab. Ready for Phase 3 deep interaction.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
});
