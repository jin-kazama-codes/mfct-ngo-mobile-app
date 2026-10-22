import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Linking,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { getDonations } from '../../../src/services/donationService';
import { getUsers } from '../../../src/services/userService';
import { Donation, User } from '../../../src/types';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  Search,
  TrendingUp,
  IndianRupee,
  UserCheck,
  FileText,
  FileCheck,
  ExternalLink,
  X,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Image as ImageIcon,
  Clock,
  Tag,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { FinancialAnalyticsSkeleton } from '../../../src/components/SkeletonLoader';
import {
  getLanguageCode,
  translateCategory,
  translateStatus,
  translateRole,
  translateRoleResponsibility,
  translateCommunityName,
  translateDonorName,
  translateCity,
  translateState,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';
import { PaginationControl } from '../../../src/components/PaginationControl';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 10;

export default function FinancialAnalyticsScreen() {
  const { activeUser, currentRole } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = useCallback((hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  }, [lang]);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [registrationPayments, setRegistrationPayments] = useState<User[]>([]);
  const [registrationPaymentsError, setRegistrationPaymentsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Active Tab (mirroring website FinancialAnalyticsTab)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'donations' | 'registrations'>('donations');

  // View Display Mode: 'table' (Tabular Table with horizontal scroll) or 'cards'
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');

  // Image Preview Modal
  const [previewProof, setPreviewProof] = useState<{ url: string; title: string } | null>(null);

  // Pagination states (mirroring website FinancialAnalyticsTab)
  const [donationsPage, setDonationsPage] = useState<number>(1);
  const [registrationsPage, setRegistrationsPage] = useState<number>(1);

  const fetchFinancialData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const allDonations = await getDonations();
      let filteredDon = allDonations;

      // Scoping matching website FinancialAnalyticsTab
      if (currentRole === 'community_admin' && activeUser?.communityName) {
        filteredDon = allDonations.filter((d) => d.communityName === activeUser.communityName);
      }
      setDonations(filteredDon);

      try {
        const allUsers = await getUsers();
        let eligibleUsers = allUsers.filter(
          (user) => user.status === 'approved' && Boolean(user.paymentUtr?.trim())
        );

        if (currentRole === 'community_admin' && activeUser?.communityName) {
          eligibleUsers = eligibleUsers.filter((u) => u.communityName === activeUser.communityName);
        } else if (activeUser?.district && currentRole?.startsWith('district_')) {
          eligibleUsers = eligibleUsers.filter(
            (u) => u.district === activeUser.district || u.city === activeUser.district
          );
        }

        setRegistrationPayments(eligibleUsers);
        setRegistrationPaymentsError(false);
      } catch (err) {
        console.error('Failed to fetch registration payments:', err);
        setRegistrationPaymentsError(true);
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [activeUser?.communityName, activeUser?.district, currentRole]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinancialData(false);
  };

  // Reset page to 1 when search query changes
  useEffect(() => {
    setDonationsPage(1);
    setRegistrationsPage(1);
  }, [searchQuery]);

  // Filtered collections based on search query (mirroring website)
  const query = searchQuery.trim().toLowerCase();

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      if (!query) return true;
      return (
        (d.donorName && d.donorName.toLowerCase().includes(query)) ||
        (d.utrNumber && d.utrNumber.toLowerCase().includes(query)) ||
        (d.campaignTitle && d.campaignTitle.toLowerCase().includes(query)) ||
        (d.communityName && d.communityName.toLowerCase().includes(query)) ||
        (d.paymentMethod && d.paymentMethod.toLowerCase().includes(query))
      );
    });
  }, [donations, query]);

  const filteredRegistrationPayments = useMemo(() => {
    return registrationPayments.filter((u) => {
      if (!query) return true;
      return (
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.membershipId && u.membershipId.toLowerCase().includes(query)) ||
        (u.paymentUtr && u.paymentUtr.toLowerCase().includes(query)) ||
        (u.phone && u.phone.toLowerCase().includes(query)) ||
        (u.communityName && u.communityName.toLowerCase().includes(query)) ||
        (u.district && u.district.toLowerCase().includes(query)) ||
        (u.city && u.city.toLowerCase().includes(query))
      );
    });
  }, [registrationPayments, query]);

  // Overall Financial Calculations (mirroring website)
  const totalDonationAmount = useMemo(
    () => filteredDonations.reduce((sum, d) => sum + (Number(d.amountINR) || 0), 0),
    [filteredDonations]
  );
  const totalRegistrationAmount = useMemo(
    () =>
      filteredRegistrationPayments.reduce(
        (sum, u) => sum + (Number(u.membershipFee) || 100),
        0
      ),
    [filteredRegistrationPayments]
  );
  const grandTotal = totalDonationAmount + totalRegistrationAmount;

  // Pagination calculations for Donations
  const totalDonationItems = filteredDonations.length;
  const totalDonationPages = Math.max(1, Math.ceil(totalDonationItems / PAGE_SIZE));
  const validDonationsPage = Math.min(donationsPage, totalDonationPages);
  const startDonationIdx = (validDonationsPage - 1) * PAGE_SIZE;
  const paginatedDonations = useMemo(() => {
    return filteredDonations.slice(startDonationIdx, startDonationIdx + PAGE_SIZE);
  }, [filteredDonations, startDonationIdx]);

  // Pagination calculations for Registrations
  const totalRegistrationItems = filteredRegistrationPayments.length;
  const totalRegistrationPages = Math.max(1, Math.ceil(totalRegistrationItems / PAGE_SIZE));
  const validRegistrationsPage = Math.min(registrationsPage, totalRegistrationPages);
  const startRegistrationIdx = (validRegistrationsPage - 1) * PAGE_SIZE;
  const paginatedRegistrations = useMemo(() => {
    return filteredRegistrationPayments.slice(
      startRegistrationIdx,
      startRegistrationIdx + PAGE_SIZE
    );
  }, [filteredRegistrationPayments, startRegistrationIdx]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: tr('सत्यापित', 'تصدیق شدہ', 'Verified'),
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800',
        };
      case 'pending_verification':
      case 'pending':
        return {
          label: tr('सत्यापन लंबित', 'زیر التواء تصدیق', 'Pending Verification'),
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          label: tr('अस्वीकृत', 'مسترد', 'Rejected'),
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-200 dark:border-rose-800',
        };
    }
  };

  const getPaymentMethodLabel = (pm?: string) => {
    if (!pm) return 'UPI';
    if (pm === 'Bank Transfer') return tr('बैंक ट्रांसफर', 'بینک ٹرانسفر', 'Bank Transfer');
    if (pm === 'QR Code') return tr('क्यूआर कोड', 'کیو آر کوڈ', 'QR Code');
    if (pm === 'Card') return tr('कार्ड', 'کارڈ', 'Card');
    if (pm === 'Cash') return tr('नकद', 'نقد', 'Cash');
    return pm;
  };

  if (loading && !refreshing) {
    return (
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <FinancialAnalyticsSkeleton isDark={isDark} />
      </ScrollView>
    );
  }

  const isDistrictFinanceCoord =
    currentRole === 'district_finance_coord' ||
    (activeUser?.districtRole && activeUser.districtRole.includes('finance'));

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Header & Title */}
        <View className="mb-4">
          <Text className="text-xl font-black text-slate-900 dark:text-white">
            {tr('वित्तीय विश्लेषण', 'مالیاتی تجزیات', 'Financial Analytics')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {tr(
              'दान एवं पंजीकरण शुल्क लेन-देन और वित्तीय मैट्रिक्स का संपूर्ण अवलोकन।',
              'عطیات اور رجسٹریشن فیس کے لین دین اور مالیاتی میٹرکس کا مکمل جائزہ۔',
              'Overview of donation and registration fee transactions and financial metrics.'
            )}
          </Text>
        </View>

        {/* Search Input with Clear Button */}
        <View className="relative mb-4">
          <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 shadow-sm">
            <Search size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'donations'
                  ? tr('दानदाता, यूटीआर या अभियान खोजें...', 'عطیہ دہندہ، UTR یا مہم تلاش کریں...', 'Search donor, UTR, campaign...')
                  : tr('सदस्य, सदस्यता आईडी या यूटीआर खोजें...', 'رکن، رکنیت ID یا UTR تلاش کریں...', 'Search member, ID, UTR...')
              }
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              className="flex-1 ml-2 text-xs font-semibold text-slate-900 dark:text-white p-0"
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <X size={15} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Official Responsibilities Banner (for District Finance Coordinator) */}
        {isDistrictFinanceCoord && (
          <View className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-amber-500 items-center justify-center">
                  <FileCheck color="#fff" size={18} />
                </View>
                <View>
                  <Text className="text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                    {translateRole('district_finance_coord', lang)}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {tr('आधिकारिक कार्यक्षेत्र एवं दायित्व', 'سرکاری ورک اسپیس اور ذمہ داری', 'Official Mandate & Responsibilities')}
                  </Text>
                </View>
              </View>
              <View className="bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                <Text className="text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                  {tr('दस्तावेजी सत्यापन', 'دستاویزی تصدیق', 'Documentary Audit')}
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-amber-200 dark:border-amber-900/50">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {tr('प्रमुख जिम्मेदारी:', 'اہم ذمہ داری:', 'Key Responsibility:')}
              </Text>
              <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-5">
                {translateRoleResponsibility('district_finance_coord', lang)}
              </Text>
            </View>
          </View>
        )}

        {/* Top 3 Analytics Cards (Clickable Tabs mirroring website) */}
        <View className="gap-3 mb-4">
          {/* Card 1: Total Donations */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('donations');
              setDonationsPage(1);
            }}
            className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl flex-row items-center justify-between shadow-sm ${
              activeTab === 'donations'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                <IndianRupee size={22} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {tr('कुल दान', 'کل عطیات', 'Total Donations')}
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{totalDonationAmount.toLocaleString('en-IN')}
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredDonations.length} {tr('दान प्रविष्टियाँ', 'عطیات کے اندراجات', 'donations')}
                </Text>
              </View>
            </View>
            {activeTab === 'donations' && (
              <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  {tr('सक्रिय', 'فعال', 'Active')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Card 2: Registration Fees */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('registrations');
              setRegistrationsPage(1);
            }}
            className={`bg-white dark:bg-slate-900 border p-4 rounded-2xl flex-row items-center justify-between shadow-sm ${
              activeTab === 'registrations'
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                <UserCheck size={22} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {tr('पंजीकरण शुल्क', 'رجسٹریشن فیس', 'Registration Fees')}
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{totalRegistrationAmount.toLocaleString('en-IN')}
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {filteredRegistrationPayments.length} {tr('पंजीकृत सदस्य', 'رجسٹرڈ ارکان', 'members')}
                </Text>
              </View>
            </View>
            {activeTab === 'registrations' && (
              <View className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-300">
                  {tr('सक्रिय', 'فعال', 'Active')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Card 3: Grand Total */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-row items-center justify-between shadow-sm">
            <View className="flex-row items-center gap-3.5 flex-1">
              <View className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl">
                <TrendingUp size={22} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {tr('कुल योग', 'کل میزان', 'Total Collection')}
                </Text>
                <Text className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {tr('दान + पंजीकरण शुल्क', 'عطیات + رجسٹریشن فیس', 'Donations + Reg. Fees')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Two-Tab Navigation Pill Bar */}
        <View className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex-row items-center gap-1.5 mb-3 border border-slate-200/60 dark:border-slate-700/60">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('donations');
              setDonationsPage(1);
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
              activeTab === 'donations'
                ? 'bg-white dark:bg-slate-900 shadow-xs'
                : ''
            }`}
          >
            <IndianRupee size={15} color={activeTab === 'donations' ? '#059669' : '#64748b'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'donations'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tr('दान विवरण', 'عطیات کی تفصیلات', 'Donations')}
            </Text>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeTab === 'donations'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <Text
                className={`text-[10px] font-black ${
                  activeTab === 'donations'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {filteredDonations.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('registrations');
              setRegistrationsPage(1);
            }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
              activeTab === 'registrations'
                ? 'bg-white dark:bg-slate-900 shadow-xs'
                : ''
            }`}
          >
            <UserCheck size={15} color={activeTab === 'registrations' ? '#2563eb' : '#64748b'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'registrations'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tr('पंजीकरण शुल्क', 'رجسٹریشن فیس', 'Registration Fees')}
            </Text>
            <View
              className={`px-1.5 py-0.2 rounded-full ${
                activeTab === 'registrations'
                  ? 'bg-blue-100 dark:bg-blue-950/80'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <Text
                className={`text-[10px] font-black ${
                  activeTab === 'registrations'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {filteredRegistrationPayments.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sub-Header Total Indicator & View Mode Switcher (Table vs Cards) */}
        <View className="flex-row items-center justify-between px-1 mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {activeTab === 'donations'
                ? tr('कुल प्राप्त दान:', 'کل وصول شدہ عطیات:', 'Total Received Donations:')
                : tr('कुल प्राप्त पंजीकरण शुल्क:', 'کل وصول شدہ رجسٹریشن فیس:', 'Total Received Registration Fees:')}
            </Text>
            <Text
              className={`text-xs font-black ${
                activeTab === 'donations'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              ₹
              {(activeTab === 'donations'
                ? totalDonationAmount
                : totalRegistrationAmount
              ).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* View Mode Toggle: Table 📑 vs Cards 🗂️ */}
          <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDisplayMode('table')}
              className={`px-2.5 py-1 rounded-lg flex-row items-center gap-1 ${
                displayMode === 'table'
                  ? 'bg-white dark:bg-slate-900 shadow-xs'
                  : ''
              }`}
            >
              <FileSpreadsheetIcon size={12} color={displayMode === 'table' ? '#059669' : '#64748b'} />
              <Text
                className={`text-[11px] font-bold ${
                  displayMode === 'table'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tr('तालिका', 'جدول', 'Table')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDisplayMode('cards')}
              className={`px-2.5 py-1 rounded-lg flex-row items-center gap-1 ${
                displayMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 shadow-xs'
                  : ''
              }`}
            >
              <CreditCard size={12} color={displayMode === 'cards' ? '#059669' : '#64748b'} />
              <Text
                className={`text-[11px] font-bold ${
                  displayMode === 'cards'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tr('कार्ड', 'کارڈز', 'Cards')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swipe Hint for Table Mode */}
        {displayMode === 'table' && (
          <View className="flex-row items-center justify-center gap-1 mb-2">
            <ChevronLeft size={11} color="#94a3b8" />
            <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {tr('सभी कॉलम देखने के लिए दाईं ओर स्क्रॉल करें', 'تمام کالم دیکھنے کے لیے اسکرول کریں', 'Swipe horizontally to view all columns')}
            </Text>
            <ChevronRight size={11} color="#94a3b8" />
          </View>
        )}

        {/* TAB 1: DONATIONS CONTENT */}
        {activeTab === 'donations' ? (
          filteredDonations.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 items-center justify-center shadow-sm my-2">
              <FileText size={42} color={isDark ? '#475569' : '#94a3b8'} />
              <Text className="text-sm font-bold text-slate-900 dark:text-white mt-3 text-center">
                {tr('कोई दान लेनदेन नहीं मिला', 'کوئی عطیہ لین دین نہیں ملا', 'No Donations Found')}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                {tr('आपके मानदंडों से मेल खाने वाला कोई दान नहीं है।', 'آپ کے معیار سے مماثل کوئی عطیہ نہیں ہے۔', 'There are no donations matching your criteria.')}
              </Text>
            </View>
          ) : displayMode === 'table' ? (
            /* TABULAR FORM LIKE WEBSITE (DONATIONS) */
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ minWidth: 640 }}>
                  {/* Table Header Row matching website */}
                  <View className="flex-row bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                    <Text className="w-48 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('दानदाता विवरण', 'عطیہ دہندہ کی تفصیلات', 'Donor Details')}
                    </Text>
                    <Text className="w-36 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('राशि एवं स्थिति', 'رقم اور حیثیت', 'Amount & Status')}
                    </Text>
                    <Text className="w-48 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('अभियान एवं समुदाय', 'مہم اور برادری', 'Campaign & Community')}
                    </Text>
                    <Text className="w-40 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('भुगतान विधि', 'ادائیگی کا طریقہ', 'Payment Method')}
                    </Text>
                  </View>

                  {/* Table Data Rows */}
                  {paginatedDonations.map((d, index) => {
                    const statusBadge = getStatusBadge(d.status);
                    const displayCommunity = translateCommunityName(d.communityName || '', lang);
                    const formattedDate = d.date ? new Date(d.date).toLocaleString() : 'Recent';

                    return (
                      <View
                        key={d.id}
                        className={`flex-row items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/70 ${
                          index % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        {/* Cell 1: Donor Details */}
                        <View className="w-48 pr-3">
                          <DynamicText
                            text={d.donorName || tr('गुमनाम समर्थक', 'گمنام مددگار', 'Anonymous Supporter')}
                            className="font-bold text-slate-900 dark:text-white text-xs"
                            numberOfLines={1}
                          />
                          <Text className="text-[10px] text-slate-500 font-mono mt-0.5" numberOfLines={1}>
                            {formattedDate}
                          </Text>
                        </View>

                        {/* Cell 2: Amount & Status */}
                        <View className="w-36 pr-3">
                          <View className="self-start bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-lg">
                            <Text className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              ₹{(d.amountINR || 0).toLocaleString('en-IN')}
                            </Text>
                          </View>
                          <View className="mt-1 self-start">
                            <View className={`px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}>
                              <Text className={`text-[9px] font-bold uppercase ${statusBadge.text}`}>
                                {statusBadge.label}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Cell 3: Campaign & Community */}
                        <View className="w-48 pr-3">
                          <DynamicText
                            text={d.campaignTitle || tr('सामान्य दान', 'عام عطیہ', 'General Donation')}
                            className="text-xs font-semibold text-slate-900 dark:text-white"
                            numberOfLines={1}
                          />
                          <Text className="text-[10px] text-slate-500 mt-0.5" numberOfLines={1}>
                            {displayCommunity || tr('लागू नहीं', 'غیر معقول', 'N/A')}
                          </Text>
                        </View>

                        {/* Cell 4: Payment Method, UTR & Action */}
                        <View className="w-40 pr-2">
                          <Text className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            {getPaymentMethodLabel(d.paymentMethod)}
                          </Text>
                          {d.utrNumber ? (
                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5" numberOfLines={1}>
                              UTR: {d.utrNumber}
                            </Text>
                          ) : (
                            <Text className="text-[10px] text-slate-400 italic mt-0.5">
                              {tr('यूटीआर नहीं', 'کوئی UTR नहीं', 'No UTR')}
                            </Text>
                          )}
                          {d.paymentScreenshotUrl && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() =>
                                setPreviewProof({
                                  url: d.paymentScreenshotUrl!,
                                  title: `${d.donorName || 'Donor'} - ₹${d.amountINR}`,
                                })
                              }
                              className="flex-row items-center gap-1 mt-1"
                            >
                              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                {tr('रसीद देखें', 'رسید دیکھیں', 'View Receipt')}
                              </Text>
                              <ExternalLink size={11} color="#059669" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Pagination Controls */}
              <PaginationControl
                currentPage={validDonationsPage}
                totalPages={totalDonationPages}
                totalItems={totalDonationItems}
                pageSize={PAGE_SIZE}
                onPageChange={setDonationsPage}
                lang={lang}
              />
            </View>
          ) : (
            /* CARDS FORM (DONATIONS) */
            <View className="gap-3">
              {paginatedDonations.map((d) => {
                const statusBadge = getStatusBadge(d.status);
                const displayCommunity = translateCommunityName(d.communityName || '', lang);
                const formattedDate = d.date ? new Date(d.date).toLocaleString() : 'Recent';

                return (
                  <View
                    key={d.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between gap-2 mb-2.5">
                      <View className="flex-1">
                        <DynamicText
                          text={d.donorName || tr('गुमनाम समर्थक', 'گمنام مددگار', 'Anonymous Supporter')}
                          className="font-bold text-slate-900 dark:text-white text-sm"
                          numberOfLines={1}
                        />
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <Clock size={11} color={isDark ? '#64748b' : '#94a3b8'} />
                          <Text className="text-[11px] text-slate-400 font-mono">
                            {formattedDate}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                          <Text className="font-mono text-emerald-700 dark:text-emerald-300 font-black text-sm">
                            ₹{(d.amountINR || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View
                          className={`mt-1 px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.border}`}
                        >
                          <Text className={`text-[9px] font-bold uppercase tracking-wider ${statusBadge.text}`}>
                            {statusBadge.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl mb-3 border border-slate-100 dark:border-slate-800 gap-1">
                      <DynamicText
                        text={d.campaignTitle || tr('सामान्य दान', 'عام عطیہ', 'General Donation')}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200"
                        numberOfLines={1}
                      />
                      {Boolean(displayCommunity) && (
                        <View className="flex-row items-center gap-1">
                          <Building2 size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                            {displayCommunity}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {getPaymentMethodLabel(d.paymentMethod)}
                          </Text>
                        </View>
                        {d.utrNumber ? (
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-mono" numberOfLines={1}>
                            UTR: {d.utrNumber}
                          </Text>
                        ) : (
                          <Text className="text-[11px] text-slate-400 italic">
                            {tr('यूटीआर नहीं', 'کوئی UTR नहीं', 'No UTR')}
                          </Text>
                        )}
                      </View>

                      {d.paymentScreenshotUrl && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            setPreviewProof({
                              url: d.paymentScreenshotUrl!,
                              title: `${d.donorName || 'Donor'} - ₹${d.amountINR}`,
                            })
                          }
                          className="flex-row items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800"
                        >
                          <ImageIcon size={12} color="#059669" />
                          <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {tr('रसीद देखें', 'رسید देखें', 'View Receipt')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              <PaginationControl
                currentPage={validDonationsPage}
                totalPages={totalDonationPages}
                totalItems={totalDonationItems}
                pageSize={PAGE_SIZE}
                onPageChange={setDonationsPage}
                lang={lang}
              />
            </View>
          )
        ) : (
          /* TAB 2: REGISTRATION FEES CONTENT */
          registrationPaymentsError ? (
            <View className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl">
              <Text className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                {tr(
                  'पंजीकरण भुगतान डेटा लोड नहीं किया जा सका। कृपया बाद में पुनः प्रयास करें।',
                  'رجسٹریشن کی ادائیگی کا ڈیٹا لوڈ نہیں ہو سکا۔ براہ کرم بعد میں دوبارہ کوشش کریں۔',
                  'Registration payments could not be loaded. Please try again later.'
                )}
              </Text>
            </View>
          ) : filteredRegistrationPayments.length === 0 ? (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 items-center justify-center shadow-sm my-2">
              <UserCheck size={42} color={isDark ? '#475569' : '#94a3b8'} />
              <Text className="text-sm font-bold text-slate-900 dark:text-white mt-3 text-center">
                {tr('कोई पंजीकरण शुल्क नहीं मिला', 'کوئی رجسٹریشن فیس نہیں ملی', 'No Registration Payments Found')}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                {tr(
                  'रिकॉर्ड किए गए यूटीआर के साथ कोई अनुमोदित पंजीकरण नहीं मिला।',
                  'ریکارڈ شدہ UTR کے ساتھ کوئی منظور شدہ رجسٹریشن نہیں ملی۔',
                  'No approved registrations with a recorded UTR found matching your criteria.'
                )}
              </Text>
            </View>
          ) : displayMode === 'table' ? (
            /* TABULAR FORM LIKE WEBSITE (REGISTRATIONS) */
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ minWidth: 640 }}>
                  {/* Table Header Row matching website */}
                  <View className="flex-row bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                    <Text className="w-48 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('सदस्य विवरण', 'رکن کی تفصیلات', 'Member Details')}
                    </Text>
                    <Text className="w-36 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('शुल्क एवं स्थिति', 'فیس اور حیثیت', 'Fee & Status')}
                    </Text>
                    <Text className="w-48 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('समुदाय एवं जिला', 'برادری اور ضلع', 'Community & District')}
                    </Text>
                    <Text className="w-44 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {tr('भुगतान विधि एवं प्रमाण', 'ادائیگی کا طریقہ اور ثبوت', 'Payment & Reference')}
                    </Text>
                  </View>

                  {/* Table Data Rows */}
                  {paginatedRegistrations.map((member, index) => {
                    const feeAmount = Number(member.membershipFee) || 100;
                    const displayCommunity = translateCommunityName(member.communityName || '', lang);
                    const displayDistrict = member.district || member.city || tr('लागू नहीं', 'غیر معقول', 'N/A');

                    return (
                      <View
                        key={member.id}
                        className={`flex-row items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/70 ${
                          index % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'bg-white dark:bg-slate-900'
                        }`}
                      >
                        {/* Cell 1: Member Details */}
                        <View className="w-48 pr-3">
                          <DynamicText
                            text={member.name || tr('अज्ञात सदस्य', 'نامعلوم رکن', 'Unknown Member')}
                            className="font-bold text-slate-900 dark:text-white text-xs"
                            numberOfLines={1}
                          />
                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                              {member.membershipId || tr('आईडी नहीं', 'کوئی ID नहीं', 'No ID')}
                            </Text>
                            {member.phone && (
                              <Text className="text-[10px] text-slate-400 font-mono" numberOfLines={1}>
                                • {member.phone}
                              </Text>
                            )}
                          </View>
                          {member.joinDate && (
                            <Text className="text-[10px] text-slate-400 mt-0.5">
                              {tr('शामिल तिथि:', 'شمولیت کی تاریخ:', 'Joined:')} {member.joinDate}
                            </Text>
                          )}
                        </View>

                        {/* Cell 2: Fee & Status */}
                        <View className="w-36 pr-3">
                          <View className="self-start bg-blue-50 dark:bg-blue-400/10 px-2 py-0.5 rounded-lg">
                            <Text className="font-mono text-blue-600 dark:text-blue-400 font-bold text-xs">
                              ₹{feeAmount.toLocaleString('en-IN')}
                            </Text>
                          </View>
                          <View className="mt-1 self-start">
                            <View className="px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800">
                              <Text className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                                {tr('सत्यापित पंजीकरण', 'تصدیق شدہ رجسٹریشن', 'Verified Registration')}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Cell 3: Community & District */}
                        <View className="w-48 pr-3">
                          <Text className="text-xs font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
                            {displayCommunity || tr('सामान्य समुदाय', 'عام برادری', 'General Community')}
                          </Text>
                          <Text className="text-[10px] text-slate-500 mt-0.5" numberOfLines={1}>
                            {displayDistrict}
                          </Text>
                        </View>

                        {/* Cell 4: Payment Method, UTR & Action */}
                        <View className="w-44 pr-2">
                          <Text className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                            {getPaymentMethodLabel(member.paymentMethod)}
                          </Text>
                          {member.paymentUtr ? (
                            <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5" numberOfLines={1}>
                              UTR: {member.paymentUtr}
                            </Text>
                          ) : (
                            <Text className="text-[10px] text-slate-400 italic mt-0.5">
                              {tr('यूटीआर उपलब्ध नहीं', 'UTR دستیاب نہیں', 'No UTR')}
                            </Text>
                          )}
                          {member.paymentScreenshotUrl && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() =>
                                setPreviewProof({
                                  url: member.paymentScreenshotUrl!,
                                  title: `${member.name} - ${member.membershipId}`,
                                })
                              }
                              className="flex-row items-center gap-1 mt-1"
                            >
                              <Text className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                {tr('भुगतान रसीद देखें', 'ادائیگی کی رسید دیکھیں', 'View Payment Proof')}
                              </Text>
                              <ExternalLink size={11} color="#2563eb" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Pagination Controls */}
              <PaginationControl
                currentPage={validRegistrationsPage}
                totalPages={totalRegistrationPages}
                totalItems={totalRegistrationItems}
                pageSize={PAGE_SIZE}
                onPageChange={setRegistrationsPage}
                lang={lang}
              />
            </View>
          ) : (
            /* CARDS FORM (REGISTRATIONS) */
            <View className="gap-3">
              {paginatedRegistrations.map((member) => {
                const feeAmount = Number(member.membershipFee) || 100;
                const displayCommunity = translateCommunityName(member.communityName || '', lang);
                const displayDistrict = member.district || member.city || '';

                return (
                  <View
                    key={member.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between gap-2 mb-2.5">
                      <View className="flex-1">
                        <DynamicText
                          text={member.name || tr('अज्ञात सदस्य', 'نامعلوم رکن', 'Unknown Member')}
                          className="font-bold text-slate-900 dark:text-white text-sm"
                          numberOfLines={1}
                        />
                        <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                          <Text className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                            {member.membershipId || tr('आईडी नहीं', 'کوئی ID नहीं', 'No ID')}
                          </Text>
                          {member.phone && (
                            <Text className="text-[11px] text-slate-400 font-mono">
                              • {member.phone}
                            </Text>
                          )}
                        </View>
                        {member.joinDate && (
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <Calendar size={10} color={isDark ? '#64748b' : '#94a3b8'} />
                            <Text className="text-[10px] text-slate-400">
                              {tr('शामिल तिथि:', 'شمولیت کی تاریخ:', 'Joined:')} {member.joinDate}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="items-end">
                        <View className="bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800/60">
                          <Text className="font-mono text-blue-700 dark:text-blue-300 font-black text-sm">
                            ₹{feeAmount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View className="mt-1 px-2 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800">
                          <Text className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            {tr('सत्यापित पंजीकरण', 'تصدیق شدہ رجسٹریشن', 'Verified Registration')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl mb-3 border border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1 flex-1 mr-2">
                        <Building2 size={12} color="#059669" />
                        <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200" numberOfLines={1}>
                          {displayCommunity || tr('सामान्य समुदाय', 'عام برادری', 'General Community')}
                        </Text>
                      </View>
                      {Boolean(displayDistrict) && (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={11} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                            {displayDistrict}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <View className="flex-row items-center gap-2 flex-1 mr-2">
                        <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          <Text className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {getPaymentMethodLabel(member.paymentMethod)}
                          </Text>
                        </View>
                        {member.paymentUtr ? (
                          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-mono" numberOfLines={1}>
                            UTR: {member.paymentUtr}
                          </Text>
                        ) : (
                          <Text className="text-[11px] text-slate-400 italic">
                            {tr('यूटीआर उपलब्ध नहीं', 'UTR دستیاب नहीं', 'No UTR')}
                          </Text>
                        )}
                      </View>

                      {member.paymentScreenshotUrl && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            setPreviewProof({
                              url: member.paymentScreenshotUrl!,
                              title: `${member.name} - ${member.membershipId}`,
                            })
                          }
                          className="flex-row items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800"
                        >
                          <ImageIcon size={12} color="#2563eb" />
                          <Text className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {tr('भुगतान रसीद देखें', 'ادائیگی کی رسید دیکھیں', 'View Payment Proof')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              <PaginationControl
                currentPage={validRegistrationsPage}
                totalPages={totalRegistrationPages}
                totalItems={totalRegistrationItems}
                pageSize={PAGE_SIZE}
                onPageChange={setRegistrationsPage}
                lang={lang}
              />
            </View>
          )
        )}
      </ScrollView>

      {/* Proof Lightbox Modal (Mirroring website lightbox) */}
      {previewProof && (
        <Modal
          visible={!!previewProof}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewProof(null)}
        >
          <View className="flex-1 bg-black/85 items-center justify-center p-4">
            <View className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <Text
                  className="font-bold text-slate-900 dark:text-white text-sm flex-1 mr-2"
                  numberOfLines={1}
                >
                  {previewProof.title}
                </Text>
                <TouchableOpacity
                  onPress={() => setPreviewProof(null)}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  <X size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
              </View>

              {/* Image Preview Container */}
              <View className="p-4 bg-slate-100 dark:bg-slate-950 items-center justify-center min-h-[260px] max-h-[400px]">
                <Image
                  source={{ uri: previewProof.url }}
                  className="w-full h-72 rounded-xl"
                  resizeMode="contain"
                />
              </View>

              {/* Modal Footer */}
              <View className="p-4 flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {tr('भुगतान रसीद प्रमाण', 'ادائیگی کی رسید کا ثبوت', 'Payment Receipt Proof')}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (previewProof?.url) {
                      Linking.openURL(previewProof.url).catch((err) =>
                        console.error('Could not open image in browser:', err)
                      );
                    }
                  }}
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 shadow-xs"
                >
                  <Text className="text-white text-xs font-bold">
                    {tr('नई विंडो में खोलें', 'نئی ونڈو میں کھولیں', 'Open Full Image')}
                  </Text>
                  <ExternalLink size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function FileSpreadsheetIcon({ size, color }: { size: number; color: string }) {
  return <FileText size={size} color={color} />;
}
