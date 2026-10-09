import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  ArrowLeft,
  Download,
  Share2,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  PenTool,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  legalTemplates,
  LegalTemplateSchema,
  buildDraftHtml,
} from '../../data/templates';
import { useSavedStore } from '../../store/savedStore';
import { useSettingsStore } from '../../store/settingsStore';

export interface LegalDocumentsScreenProps {
  onBack: () => void;
  onOpenSavedLibrary?: () => void;
}

export const LegalDocumentsScreen: React.FC<LegalDocumentsScreenProps> = ({
  onBack,
  onOpenSavedLibrary,
}) => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const { saveItem, isSaved } = useSavedStore();

  const [activeTemplate, setActiveTemplate] = useState<LegalTemplateSchema | null>(null);
  const [viewState, setViewState] = useState<'browse' | 'form' | 'preview'>('browse');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const activeLang = (['en', 'hi', 'mr'].includes(language) ? language : 'en') as 'en' | 'hi' | 'mr';

  const handleSelectTemplate = (template: LegalTemplateSchema) => {
    setActiveTemplate(template);
    // Initialize default form values
    const initial: Record<string, string> = {};
    template.fields.forEach((f) => {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        initial[f.id] = f.options[0].value;
      } else {
        initial[f.id] = '';
      }
    });
    setFormValues(initial);
    setFormErrors({});
    setIsSavedSuccess(false);
    setViewState('form');
  };

  const handleFieldChange = (fieldId: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: val }));
    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!activeTemplate) return false;

    const schemaShape: Record<string, z.ZodTypeAny> = {};
    activeTemplate.fields.forEach((field) => {
      let fieldSchema: z.ZodString = z.string();
      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.label[activeLang]} is required`);
      }
      if (field.validation?.minLength) {
        fieldSchema = fieldSchema.min(
          field.validation.minLength,
          `Minimum ${field.validation.minLength} characters required`
        );
      }
      if (field.validation?.maxLength) {
        fieldSchema = fieldSchema.max(
          field.validation.maxLength,
          `Maximum ${field.validation.maxLength} characters allowed`
        );
      }
      schemaShape[field.id] = fieldSchema;
    });

    const validator = z.object(schemaShape);
    const result = validator.safeParse(formValues);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldKey = err.path[0] as string;
        errors[fieldKey] = err.message;
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleGenerateDraft = () => {
    if (validateForm()) {
      setViewState('preview');
    }
  };

  const handleSaveToLibrary = async () => {
    if (!activeTemplate) return;
    const title = activeTemplate.title[activeLang];
    const previewSummary = `Draft generated for ${title} on ${new Date().toLocaleDateString('en-IN')}`;

    await saveItem({
      type: 'document',
      title: `${title} (Draft)`,
      category: activeTemplate.category,
      content: previewSummary,
      metadata: {
        templateId: activeTemplate.id,
        formValues,
        source: activeTemplate.source,
      },
    });
    setIsSavedSuccess(true);
    Alert.alert('Draft Saved', 'Your legal document draft has been saved to your Saved Library.');
  };

  const handleExportPdf = async () => {
    if (!activeTemplate) return;
    try {
      setIsExporting(true);
      const html = buildDraftHtml(activeTemplate, formValues, activeLang);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Export ${activeTemplate.title[activeLang]}`,
        });
      } else {
        Alert.alert('PDF Created', `File saved at: ${uri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not generate PDF document.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <AppHeader
        title={
          viewState === 'browse'
            ? 'Legal Documents'
            : viewState === 'form'
            ? 'Fill Document Details'
            : 'Draft Preview'
        }
        badgeText={viewState === 'browse' ? 'Curated Drafts' : 'Draft'}
        onBackPress={() => {
          if (viewState === 'preview') {
            setViewState('form');
          } else if (viewState === 'form') {
            setViewState('browse');
          } else {
            onBack();
          }
        }}
      />

      {/* 1. BROWSE TEMPLATES STATE */}
      {viewState === 'browse' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoBox}>
            <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>
              Select a statutory template below. Dynamic forms validate fields and generate exportable A4 PDFs with Noto Sans Devanagari typography.
            </Text>
          </View>

          <Text style={styles.sectionHeader}>Available Formats ({legalTemplates.length})</Text>

          {legalTemplates.map((template) => {
            const title = template.title[activeLang] || template.title.en;
            const description = template.description[activeLang] || template.description.en;

            return (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleSelectTemplate(template)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircle}>
                    <FileText size={20} color={colors.primary} />
                  </View>
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.templateTitle}>{title}</Text>
                    <Text style={styles.templateCategory}>{template.category}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </View>

                <Text style={styles.templateDescription}>{description}</Text>

                <View style={styles.badgeRow}>
                  <Badge label="Curated" variant="primary" />
                  <Badge label="Unreviewed" variant="default" />
                  {template.stateStampDutyNote && (
                    <Badge label="State Stamp Duty" variant="emergency" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 2. DYNAMIC FORM STATE */}
      {viewState === 'form' && activeTemplate && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.templateBanner}>
            <Text style={styles.bannerTitle}>{activeTemplate.title[activeLang]}</Text>
            <Text style={styles.bannerSubtitle}>{activeTemplate.category} • {activeTemplate.source}</Text>
          </View>

          {activeTemplate.stateStampDutyNote && (
            <View style={styles.stampDutyAlert}>
              <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stampDutyTitle}>State Stamp Duty & Registration Variation:</Text>
                <Text style={styles.stampDutyText}>{activeTemplate.stateStampDutyNote}</Text>
              </View>
            </View>
          )}

          <Text style={styles.formSectionTitle}>Required Details</Text>

          {activeTemplate.fields.map((field) => {
            const label = field.label[activeLang] || field.label.en;
            const placeholder = field.placeholder[activeLang] || field.placeholder.en;
            const helper = field.helperText[activeLang] || field.helperText.en;
            const error = formErrors[field.id];
            const value = formValues[field.id] || '';

            return (
              <View key={field.id} style={styles.formGroup}>
                <Text style={styles.fieldLabel}>
                  {label} {field.required && <Text style={{ color: colors.error }}>*</Text>}
                </Text>
                <Input
                  value={value}
                  onChangeText={(val) => handleFieldChange(field.id, val)}
                  placeholder={placeholder}
                  multiline={field.type === 'textarea'}
                  numberOfLines={field.type === 'textarea' ? 4 : 1}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  style={field.type === 'textarea' ? styles.textAreaInput : undefined}
                />
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <Text style={styles.helperText}>{helper}</Text>
                )}
              </View>
            );
          })}

          <View style={styles.buttonContainer}>
            <Button
              title="Generate & Preview Draft"
              variant="primary"
              onPress={handleGenerateDraft}
              icon={<PenTool size={18} color={colors.background} />}
            />
          </View>
        </ScrollView>
      )}

      {/* 3. PREVIEW & EXPORT STATE */}
      {viewState === 'preview' && activeTemplate && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Persistent Banner Requirement */}
          <View style={styles.previewAlertBanner}>
            <AlertTriangle size={20} color="#b45309" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewAlertTitle}>Draft – Review Before Use</Text>
              <Text style={styles.previewAlertText}>
                This draft was compiled locally for review. Stamp duty, jurisdictional formats, and court presentation vary. Confirm all clauses with a qualified advocate before execution.
              </Text>
            </View>
          </View>

          {activeTemplate.stateStampDutyNote && (
            <View style={styles.stampDutyAlert}>
              <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stampDutyTitle}>Stamp Duty Reminder:</Text>
                <Text style={styles.stampDutyText}>{activeTemplate.stateStampDutyNote}</Text>
              </View>
            </View>
          )}

          {/* Draft Preview Paper Box */}
          <View style={styles.paperBox}>
            <View style={styles.watermarkTag}>
              <Text style={styles.watermarkTagText}>DRAFT WATERMARK EMBEDDED</Text>
            </View>

            <Text style={styles.paperTitle}>{activeTemplate.title[activeLang].toUpperCase()}</Text>
            <View style={styles.divider} />

            {activeTemplate.fields.map((field) => (
              <View key={field.id} style={styles.previewRow}>
                <Text style={styles.previewFieldLabel}>{field.label[activeLang]}:</Text>
                <Text style={styles.previewFieldValue}>{formValues[field.id] || '—'}</Text>
              </View>
            ))}

            <View style={styles.statutoryFooter}>
              <Text style={styles.statutoryFooterText}>
                Template Source: {activeTemplate.source} • Status: {activeTemplate.reviewStatus}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.previewActions}>
            <Button
              title={isExporting ? 'Generating PDF...' : 'Export PDF (Devanagari Embedded)'}
              variant="primary"
              onPress={handleExportPdf}
              disabled={isExporting}
              icon={<Download size={18} color={colors.background} />}
            />

            <View style={{ height: spacing.sm }} />

            <Button
              title={isSavedSuccess ? 'Saved in Library ✓' : 'Save Draft to Library'}
              variant="secondary"
              onPress={handleSaveToLibrary}
              icon={<Bookmark size={18} color={colors.primary} />}
            />

            <View style={{ height: spacing.sm }} />

            <Button
              title="Edit Form"
              variant="outline"
              onPress={() => setViewState('form')}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  infoText: {
    flex: 1,
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    ...typography.labelLg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  templateCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
  },
  templateTitle: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  templateCategory: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  templateDescription: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  templateBanner: {
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  bannerTitle: {
    ...typography.headlineSm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 2,
  },
  stampDutyAlert: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  stampDutyTitle: {
    ...typography.labelSm,
    fontWeight: '700',
    color: colors.warning,
  },
  stampDutyText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  formSectionTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  textAreaInput: {
    height: 96,
    textAlignVertical: 'top',
  },
  helperText: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.labelSm,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  previewAlertBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  previewAlertTitle: {
    ...typography.labelLg,
    color: '#92400e',
    fontWeight: '700',
  },
  previewAlertText: {
    ...typography.bodySm,
    color: '#78350f',
    marginTop: 2,
    lineHeight: 18,
  },
  paperBox: {
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  watermarkTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  watermarkTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  previewRow: {
    marginBottom: 12,
  },
  previewFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  previewFieldValue: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 2,
    lineHeight: 20,
  },
  statutoryFooter: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statutoryFooterText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  previewActions: {
    marginBottom: spacing.xl,
  },
});
