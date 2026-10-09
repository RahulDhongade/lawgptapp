import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Handshake,
  Phone,
  Mail,
  Globe,
  MapPin,
  AlertTriangle,
  Info,
  CheckCircle,
  Search,
  Filter,
} from 'lucide-react-native';
import { colors, radii, typography, spacing } from '../../theme';
import { AppHeader } from '../../components/ui/AppHeader';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import legalAidData from '../../data/legalAid.json';

export interface LegalAidScreenProps {
  onBack: () => void;
}

export const LegalAidScreen: React.FC<LegalAidScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<string>('All');

  const states = useMemo(() => {
    const list = Array.from(new Set(legalAidData.entries.map((e) => e.state)));
    return ['All', ...list];
  }, []);

  const services = useMemo(() => {
    const list = Array.from(new Set(legalAidData.entries.map((e) => e.serviceType)));
    return ['All', ...list];
  }, []);

  const isUnverified = (dateStr: string): boolean => {
    try {
      const verifiedTime = new Date(dateStr).getTime();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      return Date.now() - verifiedTime > ninetyDaysMs;
    } catch {
      return true;
    }
  };

  const filteredEntries = useMemo(() => {
    return legalAidData.entries.filter((entry) => {
      if (selectedState !== 'All' && entry.state !== selectedState) return false;
      if (selectedService !== 'All' && entry.serviceType !== selectedService) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.jurisdiction.toLowerCase().includes(q) ||
        entry.address.toLowerCase().includes(q) ||
        entry.serviceType.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedState, selectedService]);

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Unable to Call', `Could not initiate call to ${phoneNumber}`);
    });
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`).catch(() => {
      Alert.alert('Unable to Email', `Could not open mail client for ${emailAddress}`);
    });
  };

  const handleWebsite = (url: string) => {
    const trimmed = (url || '').trim();
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      Alert.alert('Invalid URL', 'Only secure web links (HTTP/HTTPS) can be opened.');
      return;
    }
    Linking.openURL(trimmed).catch(() => {
      Alert.alert('Unable to Open Webpage', `Could not navigate to ${url}`);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <AppHeader
        title="Legal Aid Directory"
        badgeText="NALSA / DLSA"
        onBackPress={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Statutory Notice Banner */}
        <View style={styles.noticeBanner}>
          <Info size={20} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Statutory Legal Aid Services</Text>
            <Text style={styles.noticeText}>
              Official legal aid services provided under the Legal Services Authorities Act, 1987. Free legal aid is available to eligible persons (women, children, SC/ST, custody, low income). LawGPT is not affiliated with NALSA.
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search state, district, or authority name..."
          />
        </View>

        {/* Filter Chips - States */}
        <Text style={styles.filterLabel}>Filter by State:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {states.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, selectedState === st && styles.filterChipActive]}
              onPress={() => setSelectedState(st)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedState === st && styles.filterChipTextActive,
                ]}
              >
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Chips - Services */}
        <Text style={styles.filterLabel}>Filter by Service:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {services.map((svc) => (
            <TouchableOpacity
              key={svc}
              style={[styles.filterChip, selectedService === svc && styles.filterChipActive]}
              onPress={() => setSelectedService(svc)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedService === svc && styles.filterChipTextActive,
                ]}
              >
                {svc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Directory Listing */}
        <View style={styles.listingSection}>
          <Text style={styles.resultsCount}>
            Official Authorities Found: {filteredEntries.length}
          </Text>

          {filteredEntries.map((item) => {
            const contactUnverified = isUnverified(item.lastVerified);

            return (
              <View key={item.id} style={styles.authorityCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.authorityName}>{item.name}</Text>
                    <Text style={styles.jurisdictionText}>
                      {item.jurisdiction} • {item.serviceType}
                    </Text>
                  </View>

                  {/* Verification Status Badge */}
                  {contactUnverified ? (
                    <View style={styles.unverifiedBadge}>
                      <AlertTriangle size={12} color="#f59e0b" />
                      <Text style={styles.unverifiedBadgeText}>
                        Contact unverified – confirm before visiting
                      </Text>
                    </View>
                  ) : (
                    <Badge label="Verified Official" variant="verified" />
                  )}
                </View>

                {/* Address */}
                <View style={styles.addressRow}>
                  <MapPin size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
                  <Text style={styles.addressText}>{item.address}</Text>
                </View>

                {/* Eligibility note */}
                <View style={styles.eligibilityBox}>
                  <Text style={styles.eligibilityText}>
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Eligibility: </Text>
                    {item.eligibility}
                  </Text>
                </View>

                {/* Interactive Contact Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleCall(item.phone)}
                  >
                    <Phone size={15} color={colors.primary} />
                    <Text style={styles.contactBtnText}>Call {item.phone}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleEmail(item.email)}
                  >
                    <Mail size={15} color={colors.secondary} />
                    <Text style={styles.contactBtnText}>Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleWebsite(item.website)}
                  >
                    <Globe size={15} color={colors.textSecondary} />
                    <Text style={styles.contactBtnText}>Portal</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.verifiedDateFooter}>
                  <Text style={styles.verifiedDateText}>
                    Last records audit: {item.lastVerified}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  noticeBanner: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  noticeTitle: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
  },
  noticeText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  searchWrapper: {
    marginBottom: spacing.xs,
  },
  filterLabel: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.labelSm,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '700',
  },
  listingSection: {
    marginTop: spacing.sm,
  },
  resultsCount: {
    ...typography.labelSm,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  authorityCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  authorityName: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  jurisdictionText: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 2,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: 150,
  },
  unverifiedBadgeText: {
    ...typography.labelSm,
    fontSize: 9.5,
    color: '#f59e0b',
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  addressText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  eligibilityBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
  },
  eligibilityText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
  },
  contactBtnText: {
    ...typography.labelSm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  verifiedDateFooter: {
    marginTop: spacing.sm,
  },
  verifiedDateText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});
