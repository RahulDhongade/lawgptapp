import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ArrowLeft, User, Bell } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';
import { ScaleOfJusticeLogo } from './ScaleOfJusticeLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

export interface AppHeaderProps {
  title?: string;
  tag?: string;
  badgeText?: string;
  showBack?: boolean;
  onBack?: () => void;
  onBackPress?: () => void;
  showLanguageSwitcher?: boolean;
  showProfile?: boolean;
  onProfilePress?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  rightElement?: React.ReactNode;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'LawGPT',
  tag,
  badgeText,
  showBack,
  onBack,
  onBackPress,
  showLanguageSwitcher = true,
  showProfile = true,
  onProfilePress,
  showNotifications = false,
  onNotificationsPress,
  rightElement,
  rightAction,
  style,
}) => {
  const handleBack = onBackPress || onBack;
  const shouldShowBack = showBack !== undefined ? showBack : !!handleBack;
  const displayTag = tag || badgeText;

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <ScaleOfJusticeLogo size={28} />
          </View>
        )}
        <View style={styles.titleColumn}>
          <Text style={styles.title}>{title}</Text>
          {displayTag && <Text style={styles.tag}>{displayTag}</Text>}
        </View>
      </View>

      <View style={styles.rightContainer}>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.iconBtn}
            accessibilityRole="button"
          >
            {rightAction.icon}
          </TouchableOpacity>
        )}
        {rightElement}
        {showLanguageSwitcher && <LanguageSwitcher />}
        {showNotifications && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors.textSecondary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        )}
        {showProfile && (
          <TouchableOpacity
            onPress={onProfilePress}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel="User Profile"
          >
            <User size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.margin,
    backgroundColor: '#090D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 169, 59, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#151D33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  logoContainer: {
    marginRight: spacing.sm,
    padding: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(224, 169, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 169, 59, 0.28)',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  title: {
    ...typography.headlineSm,
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tag: {
    ...typography.labelSm,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#151D33',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emergency,
    borderWidth: 1.5,
    borderColor: '#090D1A',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(224, 169, 59, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
