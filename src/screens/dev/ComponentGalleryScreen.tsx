import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Shield,
  Gavel,
  Search,
  BookOpen,
  ArrowRight,
  Eye,
  FileText,
  PhoneCall,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '../../theme';
import {
  Button,
  Input,
  Card,
  Chip,
  Badge,
  VerifiedBadge,
  CitationBadge,
  SectionHeader,
  FeatureCard,
  ListItem,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  OfflineBanner,
  LanguageSwitcher,
  ScaleOfJusticeLogo,
  AppHeader,
  TabBar,
  TabRoute,
} from '../../components/ui';

export const ComponentGalleryScreen: React.FC = () => {
  const [selectedChip, setSelectedChip] = useState<string>('criminal');
  const [inputText, setInputText] = useState<string>('');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabRoute>('home');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppHeader
        title="Design System"
        tag="Gallery"
        showBack={false}
        showLanguageSwitcher={true}
        showProfile={true}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Intro */}
        <View style={styles.section}>
          <View style={styles.logoRow}>
            <ScaleOfJusticeLogo size={48} />
            <View style={styles.titleCol}>
              <Text style={styles.galleryTitle}>LawGPT Sovereign UI</Text>
              <Text style={styles.gallerySubtitle}>
                Design Tokens & Component Library
              </Text>
            </View>
          </View>
        </View>

        {/* Offline Banner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Offline Banner</Text>
          <OfflineBanner />
        </View>

        {/* Buttons Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Buttons</Text>
          <View style={styles.row}>
            <Button
              title="Primary Action (CTA)"
              variant="primary"
              onPress={() => {}}
              rightIcon={<ArrowRight size={16} color={colors.onPrimary} />}
              style={styles.btnMargin}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="Secondary / Ghost"
              variant="ghost"
              onPress={() => {}}
              leftIcon={<Search size={16} color={colors.textPrimary} />}
              style={styles.btnMargin}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="Emergency (SOS Escalation)"
              variant="emergency"
              onPress={() => {}}
              leftIcon={<Shield size={16} color={colors.textPrimary} />}
              style={styles.btnMargin}
            />
          </View>
          <View style={styles.multiRow}>
            <Button
              title="Loading"
              loading={true}
              onPress={() => {}}
              style={styles.halfBtn}
            />
            <Button
              title="Disabled"
              disabled={true}
              onPress={() => {}}
              style={styles.halfBtn}
            />
          </View>
        </View>

        {/* Form Inputs Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Form Inputs</Text>
          <Input
            label="Default Input"
            placeholder="Search BNS sections or legal acts..."
            value={inputText}
            onChangeText={setInputText}
            leftIcon={<Search size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Password Input with Visibility Toggle"
            placeholder="••••••••••••"
            secureTextEntry
            leftIcon={<Shield size={18} color={colors.textSecondary} />}
            rightIcon={<Eye size={18} color={colors.textSecondary} />}
            onRightIconPress={() => {}}
          />
          <Input
            label="Error State Input"
            value="invalid_phone_number"
            error="Please enter a valid 10-digit Indian mobile number."
          />
        </View>

        {/* Chips & Filter Pills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Chips & Filters</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
          >
            <Chip
              label="All (12)"
              selected={selectedChip === 'all'}
              onPress={() => setSelectedChip('all')}
            />
            <Chip
              label="Criminal & Police"
              icon={<Gavel size={14} color={selectedChip === 'criminal' ? colors.primary : colors.textSecondary} />}
              selected={selectedChip === 'criminal'}
              onPress={() => setSelectedChip('criminal')}
            />
            <Chip
              label="Docs & Formats"
              count={5}
              selected={selectedChip === 'docs'}
              onPress={() => setSelectedChip('docs')}
            />
            <Chip
              label="Emergency Aid"
              selected={selectedChip === 'emergency'}
              onPress={() => setSelectedChip('emergency')}
            />
          </ScrollView>
        </View>

        {/* Badges & Verifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Badges & Citations</Text>
          <View style={styles.badgeRow}>
            <Badge label="New Act" variant="primary" />
            <Badge label="CrPC 1973" variant="default" />
            <Badge label="1930 SOS" variant="emergency" />
            <Badge label="Gazette 2024" variant="outline" />
          </View>

          <Text style={styles.subLabel}>Verified Source Logic (Rule 2):</Text>
          <View style={styles.badgeRow}>
            <VerifiedBadge verified={true} />
            <VerifiedBadge verified={false} />
          </View>

          <Text style={styles.subLabel}>Legal Citation Badges:</Text>
          <View style={styles.badgeRow}>
            <CitationBadge citation="AIR 1997 SC 610" />
            <CitationBadge citation="Sec 47 BNSS 2023" />
            <CitationBadge citation="(2017) 9 SCC 1" />
          </View>
        </View>

        {/* Cards & Layering */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cards & Elevation</Text>
          <Card variant="default" style={styles.cardMargin}>
            <Text style={styles.cardHeading}>Floor 1 Surface (#141A2E)</Text>
            <Text style={styles.cardBody}>
              Standard resting container for content modules, cards, and query outputs. 1px border #253052.
            </Text>
          </Card>

          <Card variant="elevated" highlighted={true} style={styles.cardMargin}>
            <Text style={styles.cardHeading}>Floor 2 Highlighted (#1C233D)</Text>
            <Text style={styles.cardBody}>
              Active statutory brief card with subtle amber border highlight (40% opacity).
            </Text>
          </Card>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Feature Cards</Text>
          <View style={styles.grid2}>
            <FeatureCard
              title="IPC to BNS"
              description="Map old IPC sections to new Bharatiya Nyaya Sanhita 2023."
              icon={<Gavel size={20} color={colors.primary} />}
              actionText="Instant convert"
              badge={<Badge label="NEW" variant="primary" />}
              onPress={() => {}}
              style={styles.gridItem}
            />
            <FeatureCard
              title="FIR Guide"
              description="Step-by-step FIR filing checklist & zero FIR procedure."
              icon={<BookOpen size={20} color={colors.primary} />}
              actionText="Checklist flow"
              badge={<VerifiedBadge verified={true} />}
              onPress={() => {}}
              style={styles.gridItem}
            />
          </View>
        </View>

        {/* List Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. List Items</Text>
          <Card variant="default">
            <ListItem
              title="Police verification guidelines"
              subtitle="Criminal procedure • Yesterday"
              meta="Section 35 BNSS"
              leftIcon={<FileText size={18} color={colors.primary} />}
              onPress={() => {}}
            />
            <ListItem
              title="Tenant security deposit refund notice"
              subtitle="Tenancy Law • 3 days ago"
              leftIcon={<FileText size={18} color={colors.primary} />}
              onPress={() => {}}
            />
            <ListItem
              title="Cyber financial fraud helpline 1930"
              subtitle="Emergency protocol • Golden Hour"
              leftIcon={<PhoneCall size={18} color={colors.emergency} />}
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Modals & Dialogs Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modals & Dialogs</Text>
          <View style={styles.multiRow}>
            <Button
              title="Open Bottom Sheet"
              variant="ghost"
              onPress={() => setIsSheetOpen(true)}
              style={styles.halfBtn}
            />
            <Button
              title="Open Confirm Dialog"
              variant="emergency"
              onPress={() => setIsConfirmOpen(true)}
              style={styles.halfBtn}
            />
          </View>
        </View>

        {/* Skeletons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Loading Skeletons</Text>
          <Skeleton height={20} width="60%" style={styles.skelMargin} />
          <Skeleton height={14} width="100%" style={styles.skelMargin} />
          <Skeleton height={14} width="85%" style={styles.skelMargin} />
        </View>

        {/* System Empty & Error States */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Empty & Error States</Text>
          <EmptyState
            title="No cases tracked yet"
            description="Add your court case CNR number or manual docket reminders."
            actionText="Add Case"
            onActionPress={() => {}}
          />
          <ErrorState
            title="Connection Timeout"
            message="LawGPT could not reach the legal intelligence service. Please check your network."
            onRetry={() => {}}
          />
        </View>
      </ScrollView>

      {/* Bottom Sheet Component Demo */}
      <BottomSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Statutory Reference Details"
      >
        <Text style={styles.sheetText}>
          Under Section 47 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, police officers are under mandatory obligation to notify the arrestee's nominated relative or friend immediately.
        </Text>
        <Button
          title="Understood"
          onPress={() => setIsSheetOpen(false)}
          style={{ marginTop: spacing.md }}
        />
      </BottomSheet>

      {/* Confirm Dialog Component Demo */}
      <ConfirmDialog
        visible={isConfirmOpen}
        title="Delete All Local Data?"
        message="This action will wipe your cached chat sessions, local bookmarks, and offline draft notes immediately."
        confirmText="Delete Everything"
        variant="emergency"
        onConfirm={() => setIsConfirmOpen(false)}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Persistent Tab Bar Demo */}
      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleCol: {
    flex: 1,
  },
  galleryTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  gallerySubtitle: {
    ...typography.bodySm,
    color: colors.primary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subLabel: {
    ...typography.labelSm,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  row: {
    marginBottom: spacing.sm,
  },
  btnMargin: {
    width: '100%',
  },
  multiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfBtn: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardMargin: {
    marginBottom: spacing.sm,
  },
  cardHeading: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  grid2: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
  },
  skelMargin: {
    marginBottom: spacing.xs,
  },
  sheetText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
