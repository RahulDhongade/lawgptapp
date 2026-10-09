import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, typography, spacing } from '../../theme';
import { SupportedLanguage } from '../../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as SupportedLanguage;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'अ' },
    { code: 'mr', label: 'म' },
  ];

  return (
    <View style={styles.container}>
      {languages.map((lang, index) => {
        const isSelected = currentLang.startsWith(lang.code);
        return (
          <React.Fragment key={lang.code}>
            <TouchableOpacity
              onPress={() => handleLanguageChange(lang.code)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Select language ${lang.label}`}
              style={[styles.btn, isSelected && styles.btnActive]}
            >
              <Text style={[styles.text, isSelected && styles.textActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
            {index < languages.length - 1 && (
              <Text style={styles.divider}>|</Text>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.full,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    minWidth: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  btnActive: {
    backgroundColor: colors.primary,
  },
  text: {
    ...typography.labelSm,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  divider: {
    color: colors.border,
    fontSize: 12,
    marginHorizontal: 1,
  },
});
