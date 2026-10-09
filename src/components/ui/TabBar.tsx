import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Home,
  MessageSquare,
  LayoutGrid,
  History,
  User,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';

export type TabRoute = 'home' | 'chat' | 'tools' | 'history' | 'profile';

export interface TabBarProps {
  activeTab: TabRoute;
  onTabPress: (tab: TabRoute) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: {
    key: TabRoute;
    label: string;
    icon: (active: boolean) => React.ReactNode;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      icon: (active) => <Home size={20} color={active ? colors.primary : colors.textSecondary} strokeWidth={active ? 2.5 : 1.8} />,
    },
    {
      key: 'chat',
      label: 'AI Chat',
      icon: (active) => <MessageSquare size={20} color={active ? colors.primary : colors.textSecondary} strokeWidth={active ? 2.5 : 1.8} />,
    },
    {
      key: 'tools',
      label: 'Tools',
      icon: (active) => <LayoutGrid size={20} color={active ? colors.primary : colors.textSecondary} strokeWidth={active ? 2.5 : 1.8} />,
    },
    {
      key: 'history',
      label: 'History',
      icon: (active) => <History size={20} color={active ? colors.primary : colors.textSecondary} strokeWidth={active ? 2.5 : 1.8} />,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: (active) => <User size={20} color={active ? colors.primary : colors.textSecondary} strokeWidth={active ? 2.5 : 1.8} />,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                {tab.icon(isActive)}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'transparent',
  },
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F162A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 169, 59, 0.22)',
    paddingHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(224, 169, 59, 0.10)',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    ...typography.labelSm,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
