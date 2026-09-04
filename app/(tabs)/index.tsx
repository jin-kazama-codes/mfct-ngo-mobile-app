import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Share,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../src/context/AppStateProvider';
import { getCampaigns, getEmergencyCampaigns } from '../../src/services/campaignService';
import { getTestimonials } from '../../src/services/testimonialService';
import { getCommunityStories } from '../../src/services/storiesService';
import { getRecentDonations } from '../../src/services/donationService';
import { getCommunities } from '../../src/services/communityService';
import { getUsers } from '../../src/services/userService';
import { getAccountDetails } from '../../src/services/adminService';
import { submitContactMessage } from '../../src/services/contactService';
import {
  Campaign,
  Testimonial,
  CommunityStory,
  Donation,
  Community,
  AccountDetails,
} from '../../src/types';
import {
  Heart,
  UserPlus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  QrCode,
  CheckCircle2,
  Users,
  Building2,
  Phone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  BookOpen,
  Send,
  MessageSquare,
  MapPin,
  Flame,
  Share2,
  Calculator,
  Copy,
  Clock,
  Check,
  X,
} from 'lucide-react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, activeUser } = useAppState();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [realTotalMembers, setRealTotalMembers] = useState(0);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

  // UI Interactive states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Zakat Calculator Modal state
  const [isZakatModalOpen, setIsZakatModalOpen] = useState(false);
  const [zakatGold, setZakatGold] = useState('');
  const [zakatSilver, setZakatSilver] = useState('');
  const [zakatCash, setZakatCash] = useState('');
  const [zakatInvestments, setZakatInvestments] = useState('');
  const [zakatLiabilities, setZakatLiabilities] = useState('');

  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cData, eData, tData, sData, dData, commData, uData, accData] = await Promise.all([
        getCampaigns(),
        getEmergencyCampaigns(),
        getTestimonials(),
        getCommunityStories(),
        getRecentDonations(5),
        getCommunities(),
        getUsers(),
        getAccountDetails(),
      ]);

      const allCamps = [...(cData || []), ...(eData || [])];
      setCampaigns(allCamps);
      setTestimonials(tData || []);
      setStories(sData || []);
      setRecentDonations(dData || []);
      setCommunities(commData || []);
      setRealTotalMembers(uData?.length || 0);
      if (accData && accData.length > 0) {
        setAccountDetails(accData[0]);
      }
    } catch (err) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Calculations
  const totalMembers =
    realTotalMembers > 0
      ? realTotalMembers
      : (communities || []).reduce((sum, c) => sum + (c.totalMembers || 0), 0);
  const totalRaised = (communities || []).reduce(
    (sum, c) => sum + (c.totalRaisedINR || 0),
    (campaigns || []).reduce((sum, c) => sum + (c.raisedINR || 0), 0)
  );
  const avgHealth = (communities || []).length
    ? Math.round(
      communities.reduce((sum, c) => sum + (c.healthScore || 0), 0) / communities.length
    )
    : 92;

  // Filtered campaigns
  const filteredCampaigns = (campaigns || []).filter((c) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Urgent') return c.isUrgent;
    if (selectedCategory === 'Zakat') return c.isZakatEligible;
    return c.category === selectedCategory;
  });

  const myCommunityCampaigns =
    isAuthenticated && activeUser?.communityId
      ? (campaigns || []).filter((c) => c.communityId === activeUser.communityId)
      : [];

  const categoriesList = [
    {
      id: 'Medical',
      label: t('home.cat_medical'),
      icon: Activity,
      count: (campaigns || []).filter((c) => c.category === 'Medical').length,
      desc: t('home.cat_medical_desc'),
    },
    {
      id: 'Education',
      label: t('home.cat_education'),
      icon: BookOpen,
      count: (campaigns || []).filter((c) => c.category === 'Education').length,
      desc: t('home.cat_education_desc'),
    },
    {
      id: 'Marriage',
      label: t('home.cat_marriage'),
      icon: Heart,
      count: (campaigns || []).filter((c) => c.category === 'Marriage').length,
      desc: t('home.cat_marriage_desc'),
    },
    {
      id: 'Janazah',
      label: t('home.cat_janazah'),
      icon: Building2,
      count: (campaigns || []).filter((c) => c.category === 'Janazah').length,
      desc: t('home.cat_janazah_desc'),
    },
    {
      id: 'Food',
      label: t('home.cat_food'),
      icon: Flame,
      count: (campaigns || []).filter((c) => c.category === 'Food').length,
      desc: t('home.cat_food_desc'),
    },
    {
      id: 'Zakat',
      label: t('home.cat_zakat'),
      icon: ShieldCheck,
      count: (campaigns || []).filter((c) => c.isZakatEligible).length,
      desc: t('home.cat_zakat_desc'),
    },
  ];

  const faqs = [
    { q: t('home.faq1_q'), a: t('home.faq1_a') },
    { q: t('home.faq2_q'), a: t('home.faq2_a') },
    { q: t('home.faq3_q'), a: t('home.faq3_a') },
    { q: t('home.faq4_q'), a: t('home.faq4_a') },
  ];

  // UPI Copy Handler
  const handleCopyUpi = () => {
    const upi = accountDetails?.upi_id || 'mfct@okicici';
    setCopiedUpi(true);
    Alert.alert(t('home.copy_upi'), `${upi}\n\n${t('home.upi_copied')}`);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  // Share Campaign Handler
  const handleShareCampaign = async (camp: Campaign) => {
    try {
      await Share.share({
        message: `Support ${camp.title} on MFCT - Muslim Family Care Trust: Goal ₹${camp.goalINR.toLocaleString(
          'en-IN'
        )}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Contact Submit Handler
  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactMsg.trim()) {
      Alert.alert(t('common.error'), t('campaigns.validation'));
      return;
    }
    setContactSubmitting(true);
    try {
      await submitContactMessage({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        message: contactMsg.trim(),
      });
      setContactSubmitted(true);
      setContactName('');
      setContactPhone('');
      setContactMsg('');
    } catch (err) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setContactSubmitting(false);
    }
  };

  // Zakat Computation
  const goldVal = parseFloat(zakatGold) || 0;
  const silverVal = parseFloat(zakatSilver) || 0;
  const cashVal = parseFloat(zakatCash) || 0;
  const invVal = parseFloat(zakatInvestments) || 0;
  const liabVal = parseFloat(zakatLiabilities) || 0;
  const netWealth = Math.max(0, goldVal + silverVal + cashVal + invVal - liabVal);
  const zakatPayable = Math.round(netWealth * 0.025);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
    >
      {/* 1. HERO SECTION */}
      <View className="pt-5 pb-8 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <View className="flex-row items-center self-start bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-full mb-4">
          <MapPin color="#059669" size={14} />
          <Text className="text-emerald-800 dark:text-emerald-300 text-[11px] font-bold ml-1.5 flex-shrink">
            {t('home.headquartered')}
          </Text>
        </View>

        <Text className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-8 sm:leading-10 mb-3">
          {t('home.hero_title_prefix')}{' '}
          <Text className="text-emerald-600 dark:text-emerald-400 underline">
            {t('home.hero_title_highlight')}
          </Text>{' '}
          {t('home.hero_title_suffix')}
        </Text>

        <Text className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-5 mb-5 font-normal">
          {t('home.hero_desc')}
        </Text>

        <View className="flex-row flex-wrap gap-2.5 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            className="flex-row items-center bg-slate-900 dark:bg-slate-800 py-3 px-4 rounded-xl shadow-sm"
          >
            <UserPlus color="#ffffff" size={16} />
            <Text className="text-white font-bold text-xs ml-2">{t('home.become_member')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(stacks)/donation')}
            className="flex-row items-center bg-emerald-600 dark:bg-emerald-600 py-3 px-4 rounded-xl shadow-sm"
          >
            <Heart color="#ffffff" size={16} fill="#ffffff" />
            <Text className="text-white font-bold text-xs ml-2">{t('home.donate_now')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsZakatModalOpen(true)}
            className="flex-row items-center bg-amber-400 dark:bg-amber-500 py-3 px-4 rounded-xl shadow-sm"
          >
            <Calculator color="#78350f" size={16} />
            <Text className="text-amber-950 font-extrabold text-xs ml-2">{t('home.zakat_calc')}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <View className="flex-1 pr-1">
            <Text className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}+
            </Text>
            <Text className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('home.verified_members')}
            </Text>
          </View>

          <View className="flex-1 px-1">
            <Text className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalRaised > 0 ? totalRaised.toLocaleString('en-IN') : '0'}+
            </Text>
            <Text className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('home.funds_disbursed')}
            </Text>
          </View>

          <View className="flex-1 pl-1">
            <Text className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">100%</Text>
            <Text className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('home.audit_receipts')}
            </Text>
          </View>
        </View>

        <View className="mt-6 rounded-2xl overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Sparkles color="#34d399" size={16} />
              <Text className="text-emerald-400 font-bold text-xs uppercase tracking-wider ml-1.5">
                Direct Donation UPI
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyUpi}
              className="flex-row items-center bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30"
            >
              {copiedUpi ? <Check color="#34d399" size={12} /> : <Copy color="#34d399" size={12} />}
              <Text className="text-emerald-300 font-bold text-[10px] ml-1">
                {copiedUpi ? t('home.upi_copied') : t('home.copy_upi')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="bg-white p-2 rounded-xl">
              {accountDetails?.qr_code_url ? (
                <Image
                  source={{ uri: accountDetails.qr_code_url }}
                  className="w-20 h-20"
                  resizeMode="contain"
                />
              ) : (
                <QrCode color="#0f172a" size={80} />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-white font-mono font-bold text-base select-all">
                {accountDetails?.upi_id || 'mfct@okicici'}
              </Text>
              <Text className="text-emerald-400 text-[10px] font-medium mt-1">
                {t('home.scan_upi')}
              </Text>
              <Text className="text-slate-400 text-[9px] mt-0.5">
                {accountDetails?.bank_name ? `Bank: ${accountDetails.bank_name}` : '100% Direct Hospital & Aid Escrow'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. TARGETED GIVING / DONATION CATEGORIES */}
      <View className="py-6 px-4">
        <View className="mb-4">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            {t('home.targeted_giving')}
          </Text>
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('home.explore_categories')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('home.category_subtitle')}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2.5">
          {categoriesList.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? 'All' : cat.id)}
                className={`w-[48%] p-3.5 rounded-2xl border ${isSelected
                  ? 'bg-emerald-600 border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className={`w-8 h-8 rounded-xl items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-emerald-50 dark:bg-emerald-950/80'
                      }`}
                  >
                    <IconComp color={isSelected ? '#ffffff' : '#059669'} size={16} />
                  </View>
                  <Text
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {cat.count}
                  </Text>
                </View>
                <Text
                  className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                >
                  {cat.label}
                </Text>
                <Text
                  numberOfLines={1}
                  className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                  {cat.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. YOUR COMMUNITY CAMPAIGNS (LOGGED IN USER) */}
      {isAuthenticated && activeUser && myCommunityCampaigns.length > 0 && (
        <View className="py-6 px-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-y border-emerald-100 dark:border-emerald-900/40">
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
              {t('home.your_community')}
            </Text>
            <Text className="text-lg font-extrabold text-slate-900 dark:text-white">
              {t('home.community_campaigns_title', { community: activeUser.communityName || 'Your Area' })}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('home.community_campaigns_desc')}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {myCommunityCampaigns.slice(0, 4).map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: c.id } })}
                className="w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <Image source={{ uri: c.mainImage }} className="w-full h-32" resizeMode="cover" />
                <View className="p-3">
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {c.category} • {c.city}
                  </Text>
                  <Text className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 mb-2" numberOfLines={2}>
                    {c.title}
                  </Text>
                  <View className="bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-1.5">
                    <View
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((c.raisedINR / c.goalINR) * 100, 100)}%` }}
                    />
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{c.raisedINR.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(stacks)/donation',
                          params: { campaignId: c.id, initialCategory: c.category },
                        })
                      }
                      className="bg-emerald-600 px-2.5 py-1 rounded-lg"
                    >
                      <Text className="text-white text-[10px] font-bold">{t('home.donate_now')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 5. FEATURED CAMPAIGNS WITH CATEGORY FILTER */}
      <View className="py-6 px-4">
        <View className="mb-3">

          <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('home.featured_title')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('home.featured_desc')}
          </Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {['All', 'Urgent', 'Zakat', 'Medical', 'Education', 'Food', 'Marriage', 'Janazah'].map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl border ${isCatActive
                  ? 'bg-slate-900 dark:bg-emerald-600 border-slate-900 dark:border-emerald-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
              >
                <Text
                  className={`text-xs font-bold ${isCatActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                  {cat === 'All'
                    ? t('home.cat_all')
                    : cat === 'Urgent'
                      ? t('home.cat_urgent')
                      : cat === 'Zakat'
                        ? t('home.cat_zakat')
                        : cat === 'Medical'
                          ? t('home.cat_medical')
                          : cat === 'Education'
                            ? t('home.cat_education')
                            : cat === 'Food'
                              ? t('home.cat_food')
                              : cat === 'Marriage'
                                ? t('home.cat_marriage')
                                : cat === 'Janazah'
                                  ? t('home.cat_janazah')
                                  : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Campaigns List */}
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#10b981" size="large" />
          </View>
        ) : filteredCampaigns.length > 0 ? (
          <View className="gap-4">
            {filteredCampaigns.slice(0, 6).map((camp) => (
              <View
                key={camp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: camp.id } })}
                  className="relative"
                >
                  <Image source={{ uri: camp.mainImage }} className="w-full h-40" resizeMode="cover" />
                  <View className="absolute top-2.5 left-2.5 flex-row gap-1.5">
                    {camp.isUrgent && (
                      <View className="bg-red-600 px-2 py-0.5 rounded-md flex-row items-center">
                        <Flame color="#ffffff" size={10} />
                        <Text className="text-white text-[9px] font-black uppercase ml-1">
                          {t('campaigns.urgent')}
                        </Text>
                      </View>
                    )}
                    {camp.isZakatEligible && (
                      <View className="bg-emerald-700 px-2 py-0.5 rounded-md flex-row items-center">
                        <ShieldCheck color="#ffffff" size={10} />
                        <Text className="text-white text-[9px] font-black uppercase ml-1">
                          {t('campaigns.zakat')}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {camp.category} • {camp.city}
                    </Text>
                    <View className="flex-row items-center">
                      <Clock color="#94a3b8" size={12} />
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                        {camp.daysLeft} {t('campaigns.days_left')}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: camp.id } })}
                  >
                    <Text className="font-bold text-slate-900 dark:text-white text-base leading-5 mb-1.5" numberOfLines={2}>
                      {camp.title}
                    </Text>
                  </TouchableOpacity>

                  <Text className="text-slate-500 dark:text-slate-400 text-xs leading-4 mb-3" numberOfLines={2}>
                    {camp.story}
                  </Text>

                  {/* Progress bar */}
                  <View className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
                    <View
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((camp.raisedINR / camp.goalINR) * 100, 100)}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between items-center mb-3">
                    <View>
                      <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                        ₹{camp.raisedINR.toLocaleString('en-IN')}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        {t('home.raised_of')} ₹{camp.goalINR.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {camp.donorsCount} {t('campaigns.donors')}
                    </Text>
                  </View>

                  {/* Buttons */}
                  <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(stacks)/donation',
                          params: { campaignId: camp.id, initialCategory: camp.category },
                        })
                      }
                      className="flex-1 bg-emerald-600 py-2.5 rounded-xl items-center justify-center flex-row"
                    >
                      <Heart color="#ffffff" size={14} fill="#ffffff" />
                      <Text className="text-white font-bold text-xs ml-1.5">{t('home.donate_now')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShareCampaign(camp)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
                    >
                      <Share2 color="#64748b" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/campaigns')}
              className="py-3.5 px-6 rounded-2xl bg-emerald-600 items-center justify-center flex-row shadow-sm mt-2"
            >
              <Text className="text-white font-bold text-xs mr-2">{t('home.view_all_campaigns')}</Text>
              <ArrowRight color="#ffffff" size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="py-10 items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center">
              {t('home.no_campaigns')}
            </Text>
          </View>
        )}
      </View>


      {/* 7. HOW IT WORKS (4 STEPS) */}
      <View className="py-6 px-4 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <View className="mb-5 text-center items-center">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            {t('home.how_tag')}
          </Text>
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('home.how_title')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-center">
            {t('home.how_desc')}
          </Text>
        </View>

        <View className="gap-3">
          {[
            {
              step: '1',
              title: t('home.step1_title'),
              desc: t('home.step1_desc'),
            },
            {
              step: '2',
              title: t('home.step2_title'),
              desc: t('home.step2_desc'),
            },
            {
              step: '3',
              title: t('home.step3_title'),
              desc: t('home.step3_desc'),
            },
            {
              step: '4',
              title: t('home.step4_title'),
              desc: t('home.step4_desc'),
            },
          ].map((item) => (
            <View
              key={item.step}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex-row gap-3.5 items-start"
            >
              <View className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/80 items-center justify-center shrink-0">
                <Text className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                  {item.step}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                  {item.title}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[11px] leading-4">
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 8. LIFE IMPACT & COUNTERS */}
      <View className="py-6 px-4 gap-3.5">
        <View className="bg-emerald-800 dark:bg-emerald-900 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              {t('home.impact_counter_tag')}
            </Text>
            <View className="bg-white/20 px-2 py-0.5 rounded">
              <Text className="text-[10px] text-white font-bold">{t('home.impact_realtime')}</Text>
            </View>
          </View>
          <Text className="text-3xl font-black text-white mb-1">
            {testimonials.length > 0 ? testimonials.length : 12}+
          </Text>
          <Text className="text-xs text-emerald-100">
            {t('home.impact_counter_desc')}
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('home.members_counter_tag')}
            </Text>
            <View className="bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              <Text className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                {t('home.today_badge')}
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {t('home.members_counter_desc')}
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('home.communities_tag')}
            </Text>
            <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              <Text className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">
                {communities.length > 0 ? communities.length : 1} {t('home.active_hubs')}
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {avgHealth}%
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t('home.communities_desc')}
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/community')}
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 items-center justify-center flex-row"
          >
            <Building2 color="#34d399" size={14} />
            <Text className="text-white font-bold text-xs ml-1.5">
              {t('home.explore_communities')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 9. RECENT DONATIONS LIVE FEED */}
      <View className="py-6 px-4">
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                {t('home.donations_feed_title')}
              </Text>
            </View>
            <Text className="text-[10px] text-slate-400">
              {t('home.donations_feed_subtitle')}
            </Text>
          </View>

          {recentDonations.length > 0 ? (
            <View className="gap-2.5">
              {recentDonations.map((don) => (
                <View
                  key={don.id}
                  className="flex-row items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center mr-2.5">
                      <Text className="text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        {(don.donorName || 'A').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900 dark:text-white text-xs">
                        {don.donorName}{' '}
                        <Text className="text-slate-400 font-normal">
                          {t('home.donated_label')}
                        </Text>{' '}
                        ₹{don.amountINR.toLocaleString('en-IN')}
                      </Text>
                      <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                        {don.campaignTitle} • {don.communityName}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end shrink-0">
                    <View className="bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/60 mb-0.5">
                      <Text className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold">
                        {t('home.utr_verified')}
                      </Text>
                    </View>
                    <Text className="text-[9px] text-slate-400 font-mono">{don.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-center py-4 text-xs text-slate-400">
              {t('home.no_donations')}
            </Text>
          )}
        </View>
      </View>

      {/* 10. COMMUNITY STORIES & TESTIMONIALS */}
      <View className="py-8 px-4 bg-slate-900 dark:bg-slate-950">
        <View className="mb-5 text-center items-center">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            {t('home.testimonials_tag')}
          </Text>
          <Text className="text-xl font-extrabold text-white text-center">
            {t('home.testimonials_title')}
          </Text>
          <Text className="text-xs text-slate-400 mt-0.5 text-center">
            {t('home.testimonials_desc')}
          </Text>
        </View>

        <View className="gap-3 mb-4">
          {testimonials.slice(0, 3).map((item) => (
            <View
              key={item.id}
              className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80"
            >
              <Text className="text-xs text-slate-300 italic leading-5 mb-3">
                "{item.quote}"
              </Text>
              <View className="flex-row items-center pt-2.5 border-t border-slate-700/60">
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    className="w-8 h-8 rounded-full mr-2.5"
                  />
                ) : (
                  <View className="w-8 h-8 rounded-full bg-emerald-700 items-center justify-center mr-2.5">
                    <Text className="text-white font-bold text-xs">
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="font-bold text-xs text-white">{item.name}</Text>
                  <Text className="text-[10px] text-slate-400">
                    {item.role} • {item.city}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/impact-stories')}
          className="py-3 px-6 rounded-2xl bg-emerald-600 items-center justify-center flex-row self-center shadow-md"
        >
          <Text className="text-white font-bold text-xs mr-2">
            {t('home.view_all_stories')}
          </Text>
          <ArrowRight color="#ffffff" size={14} />
        </TouchableOpacity>
      </View>

      {/* 11. FAQ ACCORDION */}
      <View className="py-8 px-4">
        <View className="mb-5 text-center items-center">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            {t('home.faq_tag')}
          </Text>
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('home.faq_title')}
          </Text>
        </View>

        <View className="gap-2.5">
          {faqs.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-2">
                  <HelpCircle color="#059669" size={16} />
                  <Text className="font-bold text-slate-900 dark:text-white text-xs ml-2 flex-1">
                    {faq.q}
                  </Text>
                </View>
                {activeFaq === idx ? (
                  <ChevronUp color="#94a3b8" size={16} />
                ) : (
                  <ChevronDown color="#94a3b8" size={16} />
                )}
              </View>
              {activeFaq === idx && (
                <Text className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 12. CONTACT COMMUNITY SUPPORT */}
      <View className="py-8 px-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <View className="mb-5 text-center items-center">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
            {t('home.contact_tag')}
          </Text>
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('home.contact_title')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-center">
            {t('home.contact_desc')}
          </Text>
        </View>

        {/* Contact Form */}
        <View className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-4">
          <Text className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            {t('home.send_message')}
          </Text>

          {contactSubmitted ? (
            <View className="p-4 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl items-center border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 color="#059669" size={32} />
              <Text className="font-bold text-slate-900 dark:text-white text-xs mt-2">
                {t('home.msg_received')}
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-[11px] text-center mt-1">
                {t('home.msg_received_desc')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              <View>
                <Text className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  {t('home.your_name')}
                </Text>
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder={t('home.name_placeholder')}
                  placeholderTextColor="#94a3b8"
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </View>

              <View>
                <Text className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  {t('home.phone_number')}
                </Text>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  placeholder={t('home.phone_placeholder')}
                  placeholderTextColor="#94a3b8"
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </View>

              <View>
                <Text className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  {t('home.help_label')}
                </Text>
                <TextInput
                  value={contactMsg}
                  onChangeText={setContactMsg}
                  multiline
                  numberOfLines={3}
                  placeholder={t('home.help_placeholder')}
                  placeholderTextColor="#94a3b8"
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white h-20"
                />
              </View>

              <TouchableOpacity
                onPress={handleContactSubmit}
                disabled={contactSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 items-center justify-center flex-row shadow-sm mt-1"
              >
                {contactSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Send color="#ffffff" size={14} />
                    <Text className="text-white font-bold text-xs ml-1.5">
                      {t('home.send_request')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Emergency Help Desks */}
        <View className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl space-y-3">
          <Text className="font-bold text-xs text-white uppercase tracking-wider mb-2">
            {t('home.emergency_desks')}
          </Text>

          <TouchableOpacity
            onPress={() => Linking.openURL('tel:18002006328')}
            className="flex-row items-center p-3 rounded-xl bg-slate-800 mb-2"
          >
            <Phone color="#34d399" size={18} />
            <View className="ml-3">
              <Text className="text-[10px] text-slate-400 uppercase font-semibold">
                {t('home.helpline_247')}
              </Text>
              <Text className="font-bold text-white text-xs">
                {t('home.helpline_num')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://wa.me/919810012345')}
            className="flex-row items-center p-3 rounded-xl bg-emerald-950 border border-emerald-500/30"
          >
            <MessageSquare color="#34d399" size={18} />
            <View className="ml-3">
              <Text className="text-[10px] text-emerald-300 uppercase font-bold">
                {t('home.whatsapp_desk')}
              </Text>
              <Text className="font-bold text-white text-xs">
                {t('home.whatsapp_num')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 13. ZAKAT CALCULATOR MODAL */}
      <Modal
        visible={isZakatModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsZakatModalOpen(false)}
      >
        <View className="flex-1 bg-slate-950/80 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88%] p-5">
            <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <View className="flex-row items-center">
                <Calculator color="#059669" size={20} />
                <Text className="font-extrabold text-base text-slate-900 dark:text-white ml-2">
                  {t('home.zakat_modal_title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsZakatModalOpen(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X color="#64748b" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {t('home.zakat_modal_desc')}
              </Text>

              <View className="gap-3 mb-4">
                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('home.zakat_gold')}
                  </Text>
                  <TextInput
                    value={zakatGold}
                    onChangeText={setZakatGold}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('home.zakat_silver')}
                  </Text>
                  <TextInput
                    value={zakatSilver}
                    onChangeText={setZakatSilver}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('home.zakat_cash')}
                  </Text>
                  <TextInput
                    value={zakatCash}
                    onChangeText={setZakatCash}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('home.zakat_investments')}
                  </Text>
                  <TextInput
                    value={zakatInvestments}
                    onChangeText={setZakatInvestments}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </View>

                <View>
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('home.zakat_liabilities')}
                  </Text>
                  <TextInput
                    value={zakatLiabilities}
                    onChangeText={setZakatLiabilities}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </View>
              </View>

              {/* Net Results Box */}
              <View className="bg-emerald-950 p-4 rounded-2xl border border-emerald-500/30 mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-emerald-200 text-xs font-medium">
                    {t('home.zakat_net_wealth')}
                  </Text>
                  <Text className="text-white font-bold text-sm">
                    ₹{netWealth.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center pt-2 border-t border-emerald-800">
                  <Text className="text-amber-300 font-extrabold text-sm">
                    {t('home.zakat_payable')}
                  </Text>
                  <Text className="text-amber-300 font-black text-lg">
                    ₹{zakatPayable.toLocaleString('en-IN')}
                  </Text>
                </View>

                <Text className="text-[10px] text-emerald-400/80 mt-2">
                  {t('home.zakat_nisab_note')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setIsZakatModalOpen(false);
                  router.push('/(tabs)/campaigns');
                }}
                className="w-full py-3.5 bg-emerald-600 rounded-xl items-center justify-center mb-3"
              >
                <Text className="text-white font-bold text-xs">
                  {t('home.zakat_donate_action')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsZakatModalOpen(false)}
                className="w-full py-2.5 rounded-xl items-center justify-center"
              >
                <Text className="text-slate-400 text-xs font-semibold">
                  {t('home.zakat_close')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
