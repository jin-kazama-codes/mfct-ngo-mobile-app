import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getDonations } from '../../../src/services/donationService';
import { Donation, Language } from '../../../src/types';
import { MyDonationsListSkeleton } from '../../../src/components/SkeletonLoader';
import {
  CreditCard,
  FileText,
  X,
  Share2,
  Heart,
  ShieldCheck,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import {
  getLanguageCode,
  translateCampaignTitle,
  translateCommunityName,
  translateCategory,
  translateDonorName,
} from '../../../src/lib/translateEntity';
import {
  shareReceiptPdf,
  downloadDonationPaymentSlipPdf,
} from '../../../src/services/receiptPdfService';
import { PaginationControl } from '../../../src/components/PaginationControl';
import { DynamicText } from '../../../src/components/DynamicText';

const PAGE_SIZE = 6;

export default function MyDonationsScreen() {
  const { activeUser } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language) as Language;
  const router = useRouter();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Donation | null>(null);
  const [downloadingSlipId, setDownloadingSlipId] = useState<string | null>(null);
  const [isModalSlipDownloading, setIsModalSlipDownloading] = useState(false);
  const [isModalSharing, setIsModalSharing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      if (activeUser?.id) {
        const data = await getDonations(activeUser.id);
        setDonations(data || []);
      } else {
        const data = await getDonations();
        setDonations(data || []);
      }
    } catch (err) {
      console.warn('Error loading my donations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadData();
  };

  const totalVerified = donations
    .filter((d) => d.status === 'verified')
    .reduce((acc, curr) => acc + (curr.amountINR || 0), 0);

  const totalPages = Math.max(1, Math.ceil(donations.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, donations.length);
  const paginatedDonations = donations.slice(startIndex, endIndex);



  // Handle direct donation payment slip (पर्ची) download
  const handleDownloadDonationSlip = async (don: Donation) => {
    if (downloadingSlipId) return;

    try {
      setDownloadingSlipId(don.id);
      const result = await downloadDonationPaymentSlipPdf(don);
      Alert.alert(
        lang === 'hi' ? 'भुगतान पर्ची तैयार है' : lang === 'ur' ? 'ادائیگی سلپ تیار ہے' : 'Payment Slip Ready',
        `${lang === 'hi' ? 'दान भुगतान पर्ची डाउनलोड हो गई है:' : lang === 'ur' ? 'عطیہ ادائیگی سلپ ڈاؤن لوڈ ہو گئی ہے:' : 'Donation payment slip downloaded:'}\n${result.filename}`
      );
    } catch (error) {
      console.error('Error downloading donation payment slip:', error);
      Alert.alert(
        lang === 'hi' ? 'डाउनलोड विफल' : lang === 'ur' ? 'ڈاؤن لوڈ ناکام' : 'Download Error',
        error instanceof Error ? error.message : 'Could not generate payment slip. Please try again.'
      );
    } finally {
      setDownloadingSlipId(null);
    }
  };

  // Handle Modal Share PDF
  const handleModalShare = async (don: Donation) => {
    if (isModalSharing) return;

    try {
      setIsModalSharing(true);
      await shareReceiptPdf(don, activeUser, lang);
    } catch (error) {
      console.error('Modal PDF share error:', error);
    } finally {
      setIsModalSharing(false);
    }
  };

  // Handle Modal Payment Slip (पर्ची) Download
  const handleModalSlipDownload = async (don: Donation) => {
    if (isModalSlipDownloading) return;

    try {
      setIsModalSlipDownloading(true);
      const result = await downloadDonationPaymentSlipPdf(don);
      Alert.alert(
        lang === 'hi' ? 'भुगतान पर्ची तैयार है' : lang === 'ur' ? 'ادائیگی سلپ تیار ہے' : 'Payment Slip Ready',
        `${lang === 'hi' ? 'दान भुगतान पर्ची डाउनलोड हो गई है:' : lang === 'ur' ? 'عطیہ ادائیگی سلپ ڈاؤن لوڈ ہو گئی ہے:' : 'Donation payment slip downloaded:'}\n${result.filename}`
      );
    } catch (error) {
      console.error('Modal payment slip download error:', error);
      Alert.alert(
        lang === 'hi' ? 'डाउनलोड विफल' : lang === 'ur' ? 'ڈاؤن لوڈ ناکام' : 'Download Error',
        error instanceof Error ? error.message : 'Could not generate payment slip. Please try again.'
      );
    } finally {
      setIsModalSlipDownloading(false);
    }
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (loading) {
    return <MyDonationsListSkeleton isDark={isDark} />;
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Header Summary Card */}
        <View className="bg-emerald-700 dark:bg-emerald-900 rounded-3xl p-6 mb-5 shadow-sm border border-emerald-600/50">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                <CreditCard color="#ffffff" size={20} />
              </View>
              <View>
                <Text className="text-emerald-100 text-xs font-bold uppercase tracking-wider">
                  {t('admin.giving_ledger', 'My Giving Ledger')}
                </Text>
                <Text className="text-white text-xs opacity-80">
                  {t('admin.giving_ledger_desc', 'Verified 80G Tax Exemption Receipts')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(stacks)/donation')}
              activeOpacity={0.8}
              className="bg-amber-400 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            >
              <Heart color="#064e3b" size={14} fill="#064e3b" />
              <Text className="text-emerald-950 font-extrabold text-xs">
                {t('home.donate_now', '+ Donate Now')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="pt-2 border-t border-white/10">
            <Text className="text-emerald-100 text-xs font-medium">
              {t('admin.total_verified_donated', 'Total Verified Donations')}
            </Text>
            <Text className="text-white text-3xl font-black mt-1">
              ₹{totalVerified.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Transactions Section Header */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            {t('admin.all_transactions', 'All Transactions')} ({donations.length})
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t('admin.receipt_ready', 'Instant Digital Receipts')}
          </Text>
        </View>

        {/* Transactions List */}
        {donations.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-8 items-center justify-center border border-slate-200 dark:border-slate-800 my-4">
            <FileText color="#94a3b8" size={44} />
            <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-3">
              {t('admin.no_donations_yet', "You haven't made any donations yet.")}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1 mb-4">
              {t(
                'admin.make_first_donation_desc',
                'Choose a verified cause or emergency campaign to support families in need.'
              )}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(stacks)/donation')}
              className="bg-emerald-600 px-5 py-2.5 rounded-xl flex-row items-center gap-2"
            >
              <Heart color="#ffffff" size={14} fill="#ffffff" />
              <Text className="text-white font-bold text-xs">
                {t('admin.make_first_donation', 'Make Your First Donation')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {paginatedDonations.map((don) => {
              const displayTitle = translateCampaignTitle(don.campaignTitle || 'General Support', lang);
              const displayComm = translateCommunityName(
                don.communityName || 'MFCT Community',
                lang
              );
              const displayCat = translateCategory(don.category || 'General', lang);

              const isVerified = don.status === 'verified';
              const isPending = don.status === 'pending_verification';
              const isRejected = don.status === 'rejected';
              const rejectionReason = don.rejectionReason || (don as any).rejection_reason;
              const isReasonExpanded = expandedReasonId === don.id;

              // Clean display date
              let displayDate = don.date || 'Recent';
              const dmyMatch = displayDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
              if (dmyMatch) {
                displayDate = `${dmyMatch[1].padStart(2, '0')}/${dmyMatch[2].padStart(2, '0')}/${dmyMatch[3]}`;
              } else {
                const parsed = new Date(displayDate);
                if (!isNaN(parsed.getTime())) {
                  displayDate = parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                }
              }

              return (
                <View
                  key={don.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-3 shadow-sm"
                >
                  {/* Top Statement Row: Icon + Cause + Amount & Status */}
                  <View className="flex-row items-start justify-between gap-3 mb-2.5">
                    <View className="flex-row items-start gap-3 flex-1">
                      {/* Avatar / Icon Badge */}
                      <View
                        className={`w-10 h-10 rounded-2xl items-center justify-center shrink-0 border ${
                          isVerified
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 size={18} color="#059669" />
                        ) : isPending ? (
                          <Clock size={18} color="#d97706" />
                        ) : (
                          <AlertCircle size={18} color="#e11d48" />
                        )}
                      </View>

                      {/* Cause & Metadata */}
                      <View className="flex-1 pr-1">
                        <DynamicText
                          text={don.campaignTitle || 'General Support'}
                          className="text-sm font-bold text-slate-900 dark:text-white"
                          numberOfLines={2}
                        />
                        <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                          <DynamicText
                            text={don.communityName || 'MFCT Community'}
                            className="text-[11px] text-slate-500 dark:text-slate-400 font-medium"
                          />
                          <Text className="text-[11px] text-slate-400 dark:text-slate-500">•</Text>
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {displayCat}
                          </Text>
                        </View>
                        <Text className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {displayDate} {don.utrNumber ? `• UTR: ${don.utrNumber}` : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Right Amount & Status Badge */}
                    <View className="items-end shrink-0">
                      <Text className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                        ₹{(don.amountINR || 0).toLocaleString('en-IN')}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full mt-1 border ${
                          isVerified
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                            : isPending
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
                            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700'
                        }`}
                      >
                        <Text
                          className={`text-[9.5px] font-extrabold ${
                            isVerified
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : isPending
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isVerified
                            ? (lang === 'hi' ? '✓ सत्यापित' : lang === 'ur' ? '✓ تصدیق شدہ' : '✓ Verified')
                            : isPending
                            ? (lang === 'hi' ? '⏳ लंबित' : lang === 'ur' ? '⏳ زیر التواء' : '⏳ Pending')
                            : (lang === 'hi' ? '❌ अस्वीकृत' : lang === 'ur' ? '❌ مسترد' : '❌ Rejected')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Rejection Reason (Inline expandable callout like website) */}
                  {isReasonExpanded && rejectionReason && (
                    <View className="mt-2 mb-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <AlertCircle size={13} color="#e11d48" />
                        <Text className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                          {lang === 'hi' ? 'अस्वीकृति का कारण:' : lang === 'ur' ? 'مسترد کرنے کی وجہ:' : 'Rejection Reason:'}
                        </Text>
                      </View>
                      <Text className="text-xs text-rose-700 dark:text-rose-200 font-medium leading-relaxed">
                        {rejectionReason}
                      </Text>
                    </View>
                  )}

                  {/* Bottom Action Bar */}
                  <View className="flex-row items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <Text className="text-[11px] text-slate-400 font-mono">
                      {don.receiptNumber || 'RCP-' + don.id.slice(0, 8).toUpperCase()}
                    </Text>

                    <View className="flex-row items-center gap-1.5 flex-wrap justify-end">
                      {/* Reason Button for rejected donations */}
                      {isRejected && rejectionReason && (
                        <TouchableOpacity
                          onPress={() => setExpandedReasonId((prev) => (prev === don.id ? null : don.id))}
                          activeOpacity={0.7}
                          className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1"
                        >
                          {isReasonExpanded ? <ChevronUp size={12} color="#e11d48" /> : <ChevronDown size={12} color="#e11d48" />}
                          <Text className="text-rose-700 dark:text-rose-300 font-bold text-xs">
                            {lang === 'hi' ? 'कारण' : lang === 'ur' ? 'وجہ' : 'Reason'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Payslip (पर्ची) Button for verified donations matching website */}
                      {isVerified && (
                        <TouchableOpacity
                          onPress={() => handleDownloadDonationSlip(don)}
                          disabled={!!downloadingSlipId}
                          activeOpacity={0.7}
                          className="bg-amber-400 dark:bg-amber-500 border border-amber-500 dark:border-amber-400 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
                        >
                          {downloadingSlipId === don.id ? (
                            <ActivityIndicator size="small" color="#064e3b" />
                          ) : (
                            <Download color="#064e3b" size={13} />
                          )}
                          <Text className="text-emerald-950 font-extrabold text-xs">
                            {downloadingSlipId === don.id
                              ? (lang === 'hi' ? 'तैयार...' : lang === 'ur' ? 'تیار...' : 'Loading...')
                              : (lang === 'hi' ? 'पर्ची / Payslip' : lang === 'ur' ? 'پرچی / Payslip' : 'Payslip')}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* View Details Modal Button */}
                      <TouchableOpacity
                        onPress={() => setSelectedReceipt(don)}
                        activeOpacity={0.8}
                        className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl flex-row items-center gap-1 border border-slate-200 dark:border-slate-700"
                      >
                        <FileText color="#64748b" size={13} />
                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {lang === 'hi' ? 'विवरण' : lang === 'ur' ? 'تفصیلات' : 'Details'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Pagination Controls */}
            <PaginationControl
              currentPage={validCurrentPage}
              totalPages={totalPages}
              totalItems={donations.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              lang={lang}
            />
          </>
        )}
      </ScrollView>

      {/* Official 80G Donation Receipt Modal */}
      <Modal
        visible={!!selectedReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View className="flex-1 bg-black/80 justify-center p-4">
          {selectedReceipt && (() => {
            const don = selectedReceipt;
            const displayTitle = translateCampaignTitle(don.campaignTitle || 'General Support', lang);
            const displayComm = translateCommunityName(
              don.communityName || 'MFCT Community',
              lang
            );
            const displayCat = translateCategory(don.category || 'General', lang);
            const displayDonorName = translateDonorName(don.donorName || activeUser?.name || 'Verified Donor', lang);

            return (
              <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90%] shadow-2xl">
                {/* Modal Close Button */}
                <TouchableOpacity
                  onPress={() => setSelectedReceipt(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 z-10"
                >
                  <X color="#64748b" size={18} />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  {/* Official Header */}
                  <View className="flex-row items-center gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 pr-8">
                    <View className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center border border-amber-400 shadow-sm">
                      <Text className="text-white font-black text-xl">M</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-extrabold text-base text-slate-900 dark:text-white">
                        Mohammad Faeem Charitable Trust
                      </Text>
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Section 8 Regd NGO | 80G Tax Exempted
                      </Text>
                    </View>
                  </View>

                  {/* Receipt Badge */}
                  <View className="flex-row items-center justify-between bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-4">
                    <View>
                      <Text className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                        {lang === 'hi' ? 'दान भुगतान पर्ची' : lang === 'ur' ? 'عطیہ ادائیگی سلپ' : 'Donation Payment Slip'}
                      </Text>
                      <Text className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-200 mt-0.5">
                        {don.receiptNumber || 'RCP-' + don.id.slice(0, 8).toUpperCase()}
                      </Text>
                    </View>
                    <View className="bg-emerald-600 px-2.5 py-1 rounded-lg">
                      <Text className="text-white text-[10px] font-extrabold">✓ Donation Recorded</Text>
                    </View>
                  </View>

                  {/* Summary Breakdown Table */}
                  <View className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-2.5 mb-4">
                    <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('modal.donor_name', 'Donor Name:')}
                      </Text>
                      <DynamicText
                        text={don.donorName || activeUser?.name || 'Anonymous Donor'}
                        className="text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </View>

                    <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('modal.campaign_cause', 'Campaign / Cause:')}
                      </Text>
                      <DynamicText
                        text={don.campaignTitle || 'General Support'}
                        className="text-xs font-bold text-slate-900 dark:text-white max-w-[200px] text-right"
                        numberOfLines={2}
                      />
                    </View>

                    <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('modal.community', 'Community Hub:')}
                      </Text>
                      <DynamicText
                        text={don.communityName || 'MFCT Community'}
                        className="text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </View>

                    <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('modal.category', 'Donation Category:')}
                      </Text>
                      <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {displayCat}
                      </Text>
                    </View>

                    {don.utrNumber ? (
                      <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          {t('modal.bank_utr', 'Bank UTR Number:')}
                        </Text>
                        <Text className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {don.utrNumber}
                        </Text>
                      </View>
                    ) : null}

                    {don.transactionId ? (
                      <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                          {t('modal.transaction_id', 'Transaction ID:')}
                        </Text>
                        <Text className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {don.transactionId}
                        </Text>
                      </View>
                    ) : null}

                    <View className="flex-row justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/40">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('modal.payment_date', 'Payment Date:')}
                      </Text>
                      <Text className="text-xs text-slate-900 dark:text-white font-medium">
                        {don.date}
                      </Text>
                    </View>

                    <View className="flex-row justify-between pt-2 items-center">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {t('modal.total_donated', 'Total Donated Amount:')}
                      </Text>
                      <Text className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{(don.amountINR || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Verification Audit Stamp */}
                  <View className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-3.5 border border-amber-200 dark:border-amber-800/60 mb-5 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <ShieldCheck color="#d97706" size={22} />
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-amber-950 dark:text-amber-300">
                          {t('modal.audit_verified', 'Audit & Verification Complete')}
                        </Text>
                        <Text className="text-[10px] text-amber-800/80 dark:text-amber-400">
                          Verified by Executive Team & Bank Escrow
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                        MFCT Audit Seal
                      </Text>
                      <Text className="text-[9px] text-slate-500 dark:text-slate-400">
                        Digitally Signed
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="space-y-2.5">
                    {/* Download Donation Payment Slip (पर्ची) */}
                    <TouchableOpacity
                      onPress={() => handleModalSlipDownload(don)}
                      disabled={isModalSlipDownloading}
                      activeOpacity={0.8}
                      className="bg-amber-400 dark:bg-amber-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-sm mb-2"
                    >
                      {isModalSlipDownloading ? (
                        <ActivityIndicator color="#064e3b" size="small" />
                      ) : (
                        <Download color="#064e3b" size={16} />
                      )}
                      <Text className="text-emerald-950 font-extrabold text-xs">
                        {isModalSlipDownloading
                          ? (lang === 'hi' ? 'पर्ची तैयार हो रही है...' : lang === 'ur' ? 'سلپ تیار ہو رہی ہے...' : 'Generating Payment Slip...')
                          : (lang === 'hi' ? 'भुगतान पर्ची डाउनलोड करें (Payslip)' : lang === 'ur' ? 'ادائیگی سلپ ڈاؤن لوڈ کریں' : 'Download Payment Slip (Payslip)')}
                      </Text>
                    </TouchableOpacity>


                    {/* Share PDF Button */}
                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        onPress={() => handleModalShare(don)}
                        disabled={isModalSharing}
                        activeOpacity={0.8}
                        className="flex-1 py-3 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-row items-center justify-center gap-1.5"
                      >
                        {isModalSharing ? (
                          <ActivityIndicator color="#047857" size="small" />
                        ) : (
                          <Share2 color="#047857" size={14} />
                        )}
                        <Text className="text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                          {t('modal.share_pdf', 'Share PDF')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setSelectedReceipt(null)}
                        className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {t('modal.close', 'Close')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}
