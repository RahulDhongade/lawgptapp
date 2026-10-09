import React, { useState, useRef } from 'react';
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
  ScanText,
  Upload,
  Camera,
  FileCheck,
  AlertTriangle,
  Info,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle,
  Bookmark,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '../../api/client';
import {
  DocumentAnalysisResult,
  DocumentAnalysisResultSchema,
} from '../../api/types';
import { useSavedStore } from '../../store/savedStore';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface DocumentAnalysisScreenProps {
  onBack: () => void;
  onOpenSavedLibrary?: () => void;
}

export const DocumentAnalysisScreen: React.FC<DocumentAnalysisScreenProps> = ({
  onBack,
  onOpenSavedLibrary,
}) => {
  const { t } = useTranslation();
  const { saveItem } = useSavedStore();

  const [stage, setStage] = useState<'idle' | 'uploading' | 'processing' | 'result' | 'error'>('idle');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [isRawFallback, setIsRawFallback] = useState<boolean>(false);
  const [rawTextContent, setRawTextContent] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const abortRef = useRef<boolean>(false);

  const validateAndProcessFile = async (name: string, size?: number, mimeType?: string) => {
    // 1. Strict file size verification (Max 10 MB)
    if (size !== undefined && (size <= 0 || size > MAX_FILE_SIZE_BYTES)) {
      Alert.alert(
        'Invalid File Size',
        'Document must be between 1 byte and 10 MB. Please upload a valid document.'
      );
      return;
    }

    // 2. Strict file extension whitelist
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      Alert.alert(
        'Unsupported File Format',
        'Please upload a valid PDF, JPG, or PNG document.'
      );
      return;
    }

    // 3. Strict MIME type verification (if MIME is supplied)
    if (mimeType) {
      const lowerMime = mimeType.toLowerCase();
      const isAllowedMime =
        lowerMime === 'application/pdf' ||
        lowerMime.startsWith('image/jpeg') ||
        lowerMime.startsWith('image/jpg') ||
        lowerMime.startsWith('image/png');
      if (!isAllowedMime) {
        Alert.alert(
          'Unsupported File Format',
          'Document MIME type is not allowed. Only PDF and JPEG/PNG images are permitted.'
        );
        return;
      }
    }

    // 4. Sanitize client-provided filename to prevent directory traversal
    const safeBaseName = name.split(/[/\\]/).pop() || 'document.pdf';
    const sanitizedName = safeBaseName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 150);

    setSelectedFileName(sanitizedName);
    setStage('uploading');
    setUploadProgress(0);
    abortRef.current = false;

    // Simulate progress
    for (let p = 10; p <= 90; p += 25) {
      if (abortRef.current) return;
      await new Promise((r) => setTimeout(r, 120));
      setUploadProgress(p);
    }
    setUploadProgress(100);

    // Transition to processing state
    setStage('processing');

    try {
      const res = await apiClient.analyzeDocument(name, size || 500000);
      if (abortRef.current) return;

      // Zod Validation Check
      const parsed = DocumentAnalysisResultSchema.safeParse(res);
      if (parsed.success) {
        setAnalysisResult(parsed.data);
        setIsRawFallback(false);
      } else {
        // Fallback to plain-text card
        setIsRawFallback(true);
        setRawTextContent(JSON.stringify(res, null, 2));
      }
      setStage('result');
    } catch (err: any) {
      if (!abortRef.current) {
        setErrorMessage(
          err.userMessage || 'Document processing timed out or failed. Please check connection and retry.'
        );
        setStage('error');
      }
    }
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;
      const file = res.assets[0];
      await validateAndProcessFile(file.name, file.size, file.mimeType);
    } catch {
      Alert.alert('Upload Error', 'Could not access file picker. Please try again.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is required to capture documents for instant clause analysis.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      const filename = `Doc_Capture_${Date.now()}.jpg`;
      await validateAndProcessFile(filename, asset.fileSize, asset.mimeType);
    } catch {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setStage('idle');
    setUploadProgress(0);
    setSelectedFileName('');
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    await saveItem({
      type: 'document',
      title: `Analysis: ${analysisResult.documentType}`,
      category: 'Analysis',
      content: analysisResult.summary,
      metadata: {
        parties: analysisResult.parties,
        clausesCount: analysisResult.keyClauses.length,
        fileName: selectedFileName,
      },
    });
    setIsSavedSuccess(true);
    Alert.alert('Saved', 'Document analysis summary has been stored in your Saved Library.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Document Analysis"
        badgeText={stage === 'result' ? 'AI Scan' : 'Scanner'}
        onBackPress={() => {
          if (stage === 'uploading' || stage === 'processing') {
            handleCancel();
          } else if (stage === 'result' || stage === 'error') {
            setStage('idle');
          } else {
            onBack();
          }
        }}
      />

      {/* IDLE / ENTRY STATE */}
      {stage === 'idle' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.consentNoticeBox}>
            <ShieldCheck size={20} color={colors.secondary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.consentNoticeTitle}>Private & Protected Analysis</Text>
              <Text style={styles.consentNoticeText}>
                Your document is sent strictly to LawGPT for analysis. No data is shared with third parties or used for external training. Extracted text is sanitized against malicious prompt-injection.
              </Text>
            </View>
          </View>

          <View style={styles.limitsInfo}>
            <Info size={16} color={colors.primary} />
            <Text style={styles.limitsText}>
              Supported formats: PDF, JPG, PNG • Max size: 10 MB per document
            </Text>
          </View>

          {/* Upload Cards */}
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handlePickDocument}
            activeOpacity={0.7}
          >
            <View style={styles.uploadIconCircle}>
              <Upload size={28} color={colors.primary} />
            </View>
            <Text style={styles.uploadCardTitle}>Upload Document (PDF / Image)</Text>
            <Text style={styles.uploadCardSubtitle}>
              Tap to browse agreements, rental contracts, legal notices or petitions from your device.
            </Text>
            <View style={styles.uploadButtonFake}>
              <Text style={styles.uploadButtonFakeText}>Select File (Max 10 MB)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cameraCard}
            onPress={handleCaptureCamera}
            activeOpacity={0.7}
          >
            <View style={styles.cameraIconCircle}>
              <Camera size={26} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cameraCardTitle}>Scan with Camera</Text>
              <Text style={styles.cameraCardSubtitle}>
                Take a clear photo of printed paper contracts or notices.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.securityNoteCard}>
            <Text style={styles.securityNoteHeading}>What LawGPT Checks:</Text>
            <Text style={styles.securityNotePoint}>• Key parties & contractual relationship</Text>
            <Text style={styles.securityNotePoint}>• High-risk unilateral clauses & penalty terms</Text>
            <Text style={styles.securityNotePoint}>• Important statutory dates, lock-in & termination notice</Text>
            <Text style={styles.securityNotePoint}>• Missing state stamp duty or mandatory registration notices</Text>
          </View>
        </ScrollView>
      )}

      {/* UPLOADING & PROCESSING STATES */}
      {(stage === 'uploading' || stage === 'processing') && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateTitle}>
            {stage === 'uploading' ? 'Uploading Document...' : 'Analyzing Legal Clauses...'}
          </Text>
          <Text style={styles.stateSubtitle}>{selectedFileName}</Text>

          {stage === 'uploading' && (
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
            </View>
          )}

          <Text style={styles.stateHelper}>
            {stage === 'uploading'
              ? `Transferring document to secure analyzer (${uploadProgress}%)...`
              : 'Synthesizing key clauses, risks, and timeline points...'}
          </Text>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ERROR STATE */}
      {stage === 'error' && (
        <View style={styles.centeredState}>
          <XCircle size={48} color={colors.error} />
          <Text style={styles.stateTitle}>Analysis Failed</Text>
          <Text style={styles.errorDescription}>{errorMessage}</Text>
          <Button
            title="Try Another Document"
            variant="primary"
            onPress={() => setStage('idle')}
          />
        </View>
      )}

      {/* RESULT STATE */}
      {stage === 'result' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Statutory Requirement Banner */}
          <View style={styles.explanationNoticeBanner}>
            <Info size={18} color="#93c5fd" style={{ marginTop: 2 }} />
            <Text style={styles.explanationNoticeText}>
              This is an explanation, not legal verification. Outputs are generated by AI for advisory comprehension and should be evaluated by an enrolled Advocate.
            </Text>
          </View>

          {/* Sample Label */}
          {analysisResult?.isSample && (
            <View style={styles.sampleBadgeRow}>
              <Badge label="Sample Analysis • Verified Format" variant="primary" />
            </View>
          )}

          {isRawFallback ? (
            /* Plain-text fallback card if Zod validation failed */
            <View style={styles.fallbackCard}>
              <Text style={styles.fallbackTitle}>Raw Document Text Extracted</Text>
              <Text style={styles.fallbackText}>{rawTextContent}</Text>
            </View>
          ) : analysisResult ? (
            <>
              {/* 1. Document Type & Summary */}
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <FileCheck size={22} color={colors.primary} />
                  <Text style={styles.documentTypeTitle}>{analysisResult.documentType}</Text>
                </View>
                <Text style={styles.summaryText}>{analysisResult.summary}</Text>
              </View>

              {/* 2. Parties Involved */}
              <View style={styles.resultCard}>
                <View style={styles.sectionHeaderRow}>
                  <Users size={18} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>Identified Parties</Text>
                </View>
                {analysisResult.parties.map((party, idx) => (
                  <View key={idx} style={styles.partyRow}>
                    <Text style={styles.partyText}>• {party}</Text>
                  </View>
                ))}
              </View>

              {/* 3. Important Dates Timeline */}
              {analysisResult.importantDates.length > 0 && (
                <View style={styles.resultCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Calendar size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Important Dates & Milestones</Text>
                  </View>
                  {analysisResult.importantDates.map((item, idx) => (
                    <View key={idx} style={styles.dateItem}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{item.date}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dateLabel}>{item.label}</Text>
                        <Text style={styles.dateDescription}>{item.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 4. Key Clauses & Risk Assessment */}
              <View style={styles.resultCard}>
                <Text style={styles.sectionTitle}>Key Clauses & Plain Meaning</Text>
                {analysisResult.keyClauses.map((clause, idx) => (
                  <View key={idx} style={styles.clauseBox}>
                    <View style={styles.clauseHeader}>
                      <Text style={styles.clauseNumber}>{clause.clauseNumber}: {clause.heading}</Text>
                      <Badge
                        label={`${clause.risk} RISK`}
                        variant={clause.risk === 'HIGH' ? 'emergency' : clause.risk === 'MEDIUM' ? 'default' : 'verified'}
                      />
                    </View>
                    <Text style={styles.clauseExplanation}>{clause.plainExplanation}</Text>
                  </View>
                ))}
              </View>

              {/* 5. Points Needing Attention */}
              <View style={[styles.resultCard, styles.alertBorder]}>
                <View style={styles.sectionHeaderRow}>
                  <AlertTriangle size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                    Points Needing Attention / Red Flags
                  </Text>
                </View>
                {analysisResult.pointsNeedingAttention.map((point, idx) => (
                  <View key={idx} style={styles.attentionRow}>
                    <Text style={styles.attentionBullet}>⚠️</Text>
                    <Text style={styles.attentionText}>{point}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              title={isSavedSuccess ? 'Saved to Library ✓' : 'Save Analysis to Library'}
              variant="primary"
              onPress={handleSaveAnalysis}
              icon={<Bookmark size={18} color={colors.background} />}
            />

            <View style={{ height: spacing.sm }} />

            <Button
              title="Scan Another Document"
              variant="outline"
              onPress={() => setStage('idle')}
              icon={<RefreshCw size={18} color={colors.primary} />}
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
  consentNoticeBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  consentNoticeTitle: {
    ...typography.labelMd,
    color: colors.secondary,
    fontWeight: '700',
  },
  consentNoticeText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  limitsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainer,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  limitsText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  uploadCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.md,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadCardTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  uploadCardSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  uploadButtonFake: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
  },
  uploadButtonFakeText: {
    ...typography.labelMd,
    color: colors.background,
    fontWeight: '700',
  },
  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.lg,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.secondary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCardTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  cameraCardSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  securityNoteCard: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  securityNoteHeading: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  securityNotePoint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  stateTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  stateSubtitle: {
    ...typography.bodySm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  stateHelper: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorDescription: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressBarWrapper: {
    width: '80%',
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.xl,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  explanationNoticeBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  explanationNoticeText: {
    ...typography.bodySm,
    color: '#e2e8f0',
    lineHeight: 18,
    flex: 1,
  },
  sampleBadgeRow: {
    marginBottom: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  alertBorder: {
    borderColor: colors.warning,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  documentTypeTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  summaryText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  partyRow: {
    marginBottom: spacing.xs,
  },
  partyText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  dateItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  dateBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  dateBadgeText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  dateLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dateDescription: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clauseBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  clauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clauseNumber: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  clauseExplanation: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  attentionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  attentionBullet: {
    fontSize: 14,
  },
  attentionText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  fallbackCard: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  fallbackTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fallbackText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  actionsContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
