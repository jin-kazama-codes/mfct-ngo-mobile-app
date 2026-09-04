import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getDonations, updateDonationStatus } from '../../../src/services/donationService';
import { Donation } from '../../../src/types';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Image as ImageIcon,
  Tag,
  ShieldCheck,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateDonorName,
  translateCampaignTitle,
  translateCategory,
  translateCommunityName,
  translateStatus,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';
import { UtrDeskSkeleton } from '../../../src/components/SkeletonLoader';

const { width } = Dimensions.get('window');

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function UtrApprovedScreen() {
  const { currentRole, activeUser } = useAppState();
  const { colorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const isDark = colorScheme === 'dark';

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'all'>('pending');

  // Selected Donation for Details Modal
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

  // Confirmation Modal
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: 'verify' | 'reject';
    donorName: string;
    amountINR: number;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDonations = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const allDonations = await getDonations();
      let filtered = allDonations;

      const rawRole = (activeUser?.role || currentRole || '') as string;
      const isCommAdmin = rawRole.toLowerCase().includes('community');
      if (isCommAdmin && (activeUser?.communityName || activeUser?.communityId)) {
        filtered = allDonations.filter(
          (d) =>
            (activeUser.communityName && d.communityName?.toLowerCase() === activeUser.communityName?.toLowerCase()) ||
            (activeUser.communityId && (d as any).communityId === activeUser.communityId)
        );
      }

      setDonations(filtered);
    } catch (err: any) {
      console.error('Failed to fetch donations:', err);
      showToast(err?.message || 'Failed to load donations list.', 'error');
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [currentRole, activeUser]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonations(false);
  };

  const handleVerify = (donation: Donation) => {
    setConfirmAction({
      id: donation.id,
      type: 'verify',
      donorName: donation.donorName,
      amountINR: donation.amountINR,
    });
  };

  const handleReject = (donation: Donation) => {
    setConfirmAction({
      id: donation.id,
      type: 'reject',
      donorName: donation.donorName,
      amountINR: donation.amountINR,
    });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    const { id, type, donorName, amountINR } = confirmAction;
    setProcessingId(id);

    try {
      const newStatus = type === 'verify' ? 'verified' : 'rejected';
      await updateDonationStatus(id, newStatus);

      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );

      if (selectedDonation?.id === id) {
        setSelectedDonation((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showToast(
        type === 'verify'
          ? `Payment of ₹${amountINR.toLocaleString('en-IN')} from ${donorName} verified successfully!`
          : `Payment of ₹${amountINR.toLocaleString('en-IN')} from ${donorName} has been rejected.`,
        type === 'verify' ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Error updating donation status:', err);
      showToast(err?.message || `Failed to ${type} payment.`, 'error');
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const pendingDonations = useMemo(
    () => donations.filter((d) => d.status === 'pending_verification'),
    [donations]
  );

  const verifiedDonations = useMemo(
    () => donations.filter((d) => d.status === 'verified'),
    [donations]
  );

  const filteredDonations = useMemo(() => {
    let list = donations;
    if (activeTab === 'pending') {
      list = pendingDonations;
    } else if (activeTab === 'verified') {
      list = verifiedDonations;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        d.donorName?.toLowerCase().includes(query) ||
        d.utrNumber?.toLowerCase().includes(query) ||
        d.campaignTitle?.toLowerCase().includes(query) ||
        d.transactionId?.toLowerCase().includes(query) ||
        d.category?.toLowerCase().includes(query) ||
        d.receiptNumber?.toLowerCase().includes(query)
    );
  }, [donations, activeTab, pendingDonations, verifiedDonations, searchQuery]);

  const totalPendingAmount = useMemo(
    () => pendingDonations.reduce((sum, d) => sum + (d.amountINR || 0), 0),
    [pendingDonations]
  );

  const totalVerifiedAmount = useMemo(
    () => verifiedDonations.reduce((sum, d) => sum + (d.amountINR || 0), 0),
    [verifiedDonations]
  );

  const theme = {
    bg: isDark ? '#090d16' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    chipIdle: isDark ? '#131d2e' : '#f1f5f9',
    chipBorder: isDark ? '#1e293b' : '#e2e8f0',
    modalBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
    inputBg: isDark ? '#1e293b' : '#ffffff',
    inputBorder: isDark ? '#334155' : '#cbd5e1',
  };

  if (loading && !refreshing) {
    return <UtrDeskSkeleton isDark={isDark} />;
  }

  return (
    <View style={[s.screen, { backgroundColor: theme.bg }]}>
      {/* Toast Notification */}
      {toast && (
        <View
          style={[
            s.toastContainer,
            toast.type === 'success'
              ? s.toastSuccess
              : toast.type === 'error'
                ? s.toastError
                : s.toastInfo,
          ]}
        >
          {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
          {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
          {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
          <Text style={s.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >

        {/* Stats Summary Cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: '#f59e0b' }]}>
            <View style={s.statHeader}>
              <Clock color="#fff" size={18} />
              <Text style={s.statTag}>Needs Audit</Text>
            </View>
            <Text style={s.statCount}>{pendingDonations.length}</Text>
            <Text style={s.statLabel}>
              Pending (₹{totalPendingAmount.toLocaleString('en-IN')})
            </Text>
          </View>

          <View style={[s.statCard, { backgroundColor: '#10b981' }]}>
            <View style={s.statHeader}>
              <ShieldCheck color="#fff" size={18} />
              <Text style={s.statTag}>Audited</Text>
            </View>
            <Text style={s.statCount}>{verifiedDonations.length}</Text>
            <Text style={s.statLabel}>
              Verified (₹{totalVerifiedAmount.toLocaleString('en-IN')})
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[s.searchWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search color={theme.textSub} size={18} />
          <TextInput
            placeholder="Search UTR, Donor, Campaign, Txn ID..."
            placeholderTextColor={theme.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[s.searchInput, { color: theme.textMain }]}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={theme.textSub} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filters */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[
              s.tabBtn,
              activeTab === 'pending'
                ? s.tabBtnActivePending
                : { backgroundColor: theme.chipIdle, borderColor: theme.chipBorder },
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[
                s.tabBtnText,
                activeTab === 'pending' ? s.tabBtnTextActive : { color: theme.textSub },
              ]}
            >
              {t('admin.kyc_subtitle', 'Pending')} ({pendingDonations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.tabBtn,
              activeTab === 'verified'
                ? s.tabBtnActiveVerified
                : { backgroundColor: theme.chipIdle, borderColor: theme.chipBorder },
            ]}
            onPress={() => setActiveTab('verified')}
          >
            <Text
              style={[
                s.tabBtnText,
                activeTab === 'verified' ? s.tabBtnTextActive : { color: theme.textSub },
              ]}
            >
              {t('admin.statActiveMembers', 'Verified')} ({verifiedDonations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.tabBtn,
              activeTab === 'all'
                ? s.tabBtnActiveAll
                : { backgroundColor: theme.chipIdle, borderColor: theme.chipBorder },
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                s.tabBtnText,
                activeTab === 'all' ? s.tabBtnTextActive : { color: theme.textSub },
              ]}
            >
              {t('categories.all', 'All')} ({donations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Header */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: theme.textMain }]}>
            {activeTab === 'pending'
              ? `${t('admin.tabUtrAudit', 'Pending UTR Verifications')} (${filteredDonations.length})`
              : activeTab === 'verified'
                ? `${t('admin.auditTrail', 'Verified Payments History')} (${filteredDonations.length})`
                : `${t('admin.tabDonations', 'All Payment Records')} (${filteredDonations.length})`}
          </Text>
        </View>

        {/* Empty State */}
        {filteredDonations.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={s.emptyIconCircle}>
              {activeTab === 'pending' ? (
                <CheckCircle2 color="#10b981" size={32} />
              ) : (
                <FileText color="#94a3b8" size={32} />
              )}
            </View>
            <Text style={[s.emptyTitle, { color: theme.textMain }]}>
              {activeTab === 'pending' ? t('admin.all_caught_up', 'All Payments Verified!') : t('admin.no_pending_kyc', 'No Records Found')}
            </Text>
            <Text style={[s.emptySub, { color: theme.textSub }]}>
              {activeTab === 'pending'
                ? t('admin.no_pending_kyc', 'There are currently no pending UTR payments waiting for verification.')
                : t('admin.no_pending_kyc', 'No payment records match your selected filter or search keyword.')}
            </Text>
          </View>
        ) : (
          filteredDonations.map((donation) => {
            const isProcessing = processingId === donation.id;
            const isPending = donation.status === 'pending_verification';
            const isVerified = donation.status === 'verified';
            const isRejected = donation.status === 'rejected';

            const donorDisplayName = translateDonorName(donation.donorName || 'Anonymous Donor', lang);
            const campaignDisplayName = translateCampaignTitle(donation.campaignTitle || 'General Support Fund', lang);
            const categoryDisplayName = translateCategory(donation.category || 'General', lang);
            const communityDisplayName = translateCommunityName(donation.communityName || '', lang);
            const statusDisplayName = translateStatus(donation.status, lang);

            return (
              <View
                key={donation.id}
                style={[
                  s.donationCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: isPending ? '#f59e0b50' : theme.cardBorder,
                  },
                ]}
              >
                {/* Top Strip */}
                <View style={s.cardTopRow}>
                  <View
                    style={[
                      s.statusBadge,
                      isPending
                        ? s.statusBadgePending
                        : isVerified
                          ? s.statusBadgeVerified
                          : s.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        s.statusBadgeText,
                        isPending
                          ? s.statusTextPending
                          : isVerified
                            ? s.statusTextVerified
                            : s.statusTextRejected,
                      ]}
                    >
                      {statusDisplayName.toUpperCase()}
                    </Text>
                  </View>

                  <View style={s.dateRow}>
                    <Clock color={theme.textSub} size={12} />
                    <Text style={[s.dateText, { color: theme.textSub }]}>
                      {donation.date || 'Recent'}
                    </Text>
                  </View>
                </View>

                {/* Donor & Amount Row */}
                <View style={s.donorInfoRow}>
                  <View style={{ flex: 1 }}>
                    <DynamicText
                      text={donation.donorName || 'Anonymous Donor'}
                      style={[s.donorName, { color: theme.textMain }]}
                      numberOfLines={1}
                    />
                    <DynamicText
                      text={donation.campaignTitle || 'General Support Fund'}
                      style={[s.campaignTitle, { color: theme.textSub }]}
                      numberOfLines={1}
                    />
                    {donation.communityName && (
                      <View style={s.communityRow}>
                        <Building2 color={theme.textSub} size={12} />
                        <DynamicText
                          text={donation.communityName}
                          style={[s.communityText, { color: theme.textSub }]}
                        />
                      </View>
                    )}
                  </View>

                  <View style={s.amountBox}>
                    <Text style={s.amountText}>
                      ₹{(donation.amountINR || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[s.categoryChip, { color: theme.textSub }]}>
                      {categoryDisplayName}
                    </Text>
                  </View>
                </View>

                {/* Details Badges */}
                <View style={s.badgesRow}>
                  <View style={[s.badgeChip, { backgroundColor: isDark ? '#131d2e' : '#f1f5f9' }]}>
                    <CreditCard color="#3b82f6" size={12} />
                    <Text style={[s.badgeMonoText, { color: isDark ? '#93c5fd' : '#2563eb' }]}>
                      UTR: {donation.utrNumber || 'N/A'}
                    </Text>
                  </View>

                  {donation.paymentScreenshotUrl ? (
                    <TouchableOpacity
                      onPress={() => setSelectedDonation(donation)}
                      style={[s.badgeChip, { backgroundColor: '#10b98115' }]}
                    >
                      <ImageIcon color="#10b981" size={12} />
                      <Text style={[s.badgeChipText, { color: '#10b981' }]}>{t('admin.viewDetails', 'Receipt Image')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[s.badgeChip, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                      <Text style={[s.badgeChipText, { color: theme.textSub }]}>No Screenshot</Text>
                    </View>
                  )}

                  {donation.paymentMethod && (
                    <View style={[s.badgeChip, { backgroundColor: isDark ? '#131d2e' : '#f1f5f9' }]}>
                      <Tag color={theme.textSub} size={11} />
                      <Text style={[s.badgeChipText, { color: theme.textSub }]}>
                        {donation.paymentMethod}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions Footer */}
                <View style={[s.cardActions, { borderTopColor: theme.cardBorder }]}>
                  <TouchableOpacity
                    style={[s.viewBtn, { backgroundColor: theme.chipIdle }]}
                    onPress={() => setSelectedDonation(donation)}
                  >
                    <Eye color={theme.textSub} size={14} />
                    <Text style={[s.viewBtnText, { color: theme.textMain }]}>{t('btn.viewDetails', 'View Details')}</Text>
                  </TouchableOpacity>

                  {isPending && (
                    <>
                      <TouchableOpacity
                        style={s.verifyBtn}
                        onPress={() => handleVerify(donation)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <CheckCircle2 color="#fff" size={14} />
                            <Text style={s.verifyBtnText}>{t('btn.approve', 'Verify')}</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.rejectBtn}
                        onPress={() => handleReject(donation)}
                        disabled={isProcessing}
                      >
                        <XCircle color="#ef4444" size={14} />
                        <Text style={s.rejectBtnText}>{t('btn.reject', 'Reject')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Details & Screenshot Modal */}
      {selectedDonation && (
        <Modal
          visible={!!selectedDonation}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedDonation(null)}
        >
          <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg }]}>
            <View style={[s.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              {/* Modal Header */}
              <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                <View>
                  <Text style={[s.modalTitle, { color: theme.textMain }]}>Payment Audit Details</Text>
                  <Text style={[s.modalSubTitle, { color: theme.textSub }]}>
                    Review receipt & transaction metadata
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDonation(null)}
                  style={[s.modalCloseBtn, { backgroundColor: theme.chipIdle }]}
                >
                  <X color={theme.textSub} size={18} />
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                {/* Details Grid */}
                <View style={s.modalGrid}>
                  <View style={[s.modalGridItem, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <Text style={s.gridLabel}>DONOR NAME</Text>
                    <DynamicText
                      text={selectedDonation.donorName || 'Anonymous'}
                      style={[s.gridValue, { color: theme.textMain }]}
                      numberOfLines={1}
                    />
                  </View>

                  <View style={[s.modalGridItem, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <Text style={s.gridLabel}>AMOUNT</Text>
                    <Text style={[s.gridValueAmount, { color: '#10b981' }]}>
                      ₹{(selectedDonation.amountINR || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={[s.modalGridItem, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <Text style={s.gridLabel}>UTR NUMBER</Text>
                    <Text style={[s.gridValueMono, { color: isDark ? '#93c5fd' : '#2563eb' }]} numberOfLines={1}>
                      {selectedDonation.utrNumber || 'N/A'}
                    </Text>
                  </View>

                  <View style={[s.modalGridItem, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <Text style={s.gridLabel}>DATE & TIME</Text>
                    <Text style={[s.gridValue, { color: theme.textMain }]} numberOfLines={1}>
                      {selectedDonation.date || 'Recent'}
                    </Text>
                  </View>

                  <View style={[s.modalGridItemFull, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <Text style={s.gridLabel}>TARGET CAMPAIGN</Text>
                    <DynamicText
                      text={selectedDonation.campaignTitle || 'General Support Fund'}
                      style={[s.gridValue, { color: theme.textMain }]}
                    />
                    <Text style={[s.gridSub, { color: theme.textSub }]}>
                      Category: {translateCategory(selectedDonation.category || 'General', lang)}
                    </Text>
                  </View>

                  {selectedDonation.communityName && (
                    <View style={[s.modalGridItemFull, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                      <Text style={s.gridLabel}>COMMUNITY</Text>
                      <DynamicText
                        text={selectedDonation.communityName}
                        style={[s.gridValue, { color: theme.textMain }]}
                      />
                    </View>
                  )}

                  {selectedDonation.receiptNumber && (
                    <View style={[s.modalGridItemFull, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                      <Text style={s.gridLabel}>RECEIPT / TRANSACTION ID</Text>
                      <Text style={[s.gridValueMono, { color: theme.textSub }]}>
                        {selectedDonation.receiptNumber} {selectedDonation.transactionId ? `• ${selectedDonation.transactionId}` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Screenshot Preview */}
                <Text style={[s.modalSectionLabel, { color: theme.textMain }]}>
                  Payment Receipt Screenshot
                </Text>
                {selectedDonation.paymentScreenshotUrl ? (
                  <View style={[s.screenshotContainer, { borderColor: theme.cardBorder, backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
                    <Image
                      source={{ uri: selectedDonation.paymentScreenshotUrl }}
                      style={s.screenshotImg}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={[s.noDocBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                    <ImageIcon color={theme.textSub} size={32} />
                    <Text style={[s.noDocText, { color: theme.textSub }]}>
                      No payment screenshot provided by donor
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Actions Footer */}
              <View style={[s.modalFooter, { borderTopColor: theme.cardBorder }]}>
                {selectedDonation.status === 'pending_verification' ? (
                  <View style={s.modalBtnRow}>
                    <TouchableOpacity
                      style={s.modalRejectBtn}
                      onPress={() => {
                        const target = selectedDonation;
                        setSelectedDonation(null);
                        handleReject(target);
                      }}
                    >
                      <XCircle color="#ef4444" size={16} />
                      <Text style={s.modalRejectBtnText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.modalVerifyBtn}
                      onPress={() => {
                        const target = selectedDonation;
                        setSelectedDonation(null);
                        handleVerify(target);
                      }}
                    >
                      <CheckCircle2 color="#fff" size={16} />
                      <Text style={s.modalVerifyBtnText}>Verify Payment</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[s.modalCloseFullBtn, { backgroundColor: theme.chipIdle }]}
                    onPress={() => setSelectedDonation(null)}
                  >
                    <Text style={[s.modalCloseFullBtnText, { color: theme.textMain }]}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <Modal
          visible={!!confirmAction}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmAction(null)}
        >
          <View style={[s.confirmBackdrop, { backgroundColor: theme.modalBg }]}>
            <View style={[s.confirmCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View
                style={[
                  s.confirmIconCircle,
                  confirmAction.type === 'verify'
                    ? { backgroundColor: '#10b98120' }
                    : { backgroundColor: '#ef444420' },
                ]}
              >
                {confirmAction.type === 'verify' ? (
                  <CheckCircle2 color="#10b981" size={32} />
                ) : (
                  <AlertTriangle color="#ef4444" size={32} />
                )}
              </View>

              <Text style={[s.confirmTitle, { color: theme.textMain }]}>
                {confirmAction.type === 'verify' ? 'Verify UTR Payment?' : 'Reject UTR Payment?'}
              </Text>

              <Text style={[s.confirmDesc, { color: theme.textSub }]}>
                Are you sure you want to{' '}
                <Text style={{ fontWeight: '700', color: theme.textMain }}>
                  {confirmAction.type}
                </Text>{' '}
                this payment of{' '}
                <Text style={{ fontWeight: '700', color: '#10b981' }}>
                  ₹{confirmAction.amountINR.toLocaleString('en-IN')}
                </Text>{' '}
                from{' '}
                <Text style={{ fontWeight: '700', color: theme.textMain }}>
                  {confirmAction.donorName}
                </Text>
                ? This action cannot be undone.
              </Text>

              <View style={s.confirmBtnRow}>
                <TouchableOpacity
                  style={[s.confirmCancelBtn, { backgroundColor: theme.chipIdle }]}
                  onPress={() => setConfirmAction(null)}
                  disabled={!!processingId}
                >
                  <Text style={[s.confirmCancelText, { color: theme.textMain }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.confirmSubmitBtn,
                    confirmAction.type === 'verify'
                      ? { backgroundColor: '#10b981' }
                      : { backgroundColor: '#ef4444' },
                  ]}
                  onPress={executeAction}
                  disabled={!!processingId}
                >
                  {processingId ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.confirmSubmitText}>
                      Yes, {confirmAction.type === 'verify' ? 'Verify' : 'Reject'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  centerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTag: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statCount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabBtnActivePending: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  tabBtnActiveVerified: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  tabBtnActiveAll: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  donationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: '#f59e0b15',
    borderColor: '#f59e0b40',
  },
  statusBadgeVerified: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98140',
  },
  statusBadgeRejected: {
    backgroundColor: '#ef444415',
    borderColor: '#ef444440',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPending: { color: '#f59e0b' },
  statusTextVerified: { color: '#10b981' },
  statusTextRejected: { color: '#ef4444' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  donorInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  donorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  campaignTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  communityText: {
    fontSize: 11,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10b981',
  },
  categoryChip: {
    fontSize: 11,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  badgeMonoText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  badgeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef444415',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98115',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedTagText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef444415',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rejectedTagText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalGridItem: {
    width: (width - 64 - 8) / 2,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalGridItemFull: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridSub: {
    fontSize: 11,
    marginTop: 2,
  },
  gridValueAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  gridValueMono: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  screenshotContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  screenshotImg: {
    width: '100%',
    height: 280,
  },
  noDocBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  noDocText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  modalRejectBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  modalVerifyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },
  modalVerifyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCloseFullBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Confirm Modal
  confirmBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmSubmitBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Toast
  toastContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#dc2626',
  },
  toastInfo: {
    backgroundColor: '#7c3aed',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
