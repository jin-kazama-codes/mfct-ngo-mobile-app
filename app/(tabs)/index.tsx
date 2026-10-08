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
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../src/context/AppStateProvider';
import { AboutUs } from '../../src/components/AboutUs';
import { CampaignCardSkeleton, ShimmerBlock } from '../../src/components/SkeletonLoader';
import { getCampaigns, getEmergencyCampaigns } from '../../src/services/campaignService';
import { getTestimonials } from '../../src/services/testimonialService';
import { getRecentDonations } from '../../src/services/donationService';
import { getCommunities } from '../../src/services/communityService';
import { getUsers } from '../../src/services/userService';
import { getAccountDetails } from '../../src/services/adminService';
import { getAllAnnouncements, Announcement } from '../../src/services/announcementService';
import { submitContactMessage } from '../../src/services/contactService';
import {
  Campaign,
  Testimonial,
  Donation,
  Community,
  AccountDetails,
  Language,
} from '../../src/types';
import {
  getLanguageCode,
  translateCategory,
  translateCity,
  translateCommunityName,
  translateCampaignTitle,
  translateCampaignStory,
  translateTestimonial,
  translateDonorName,
} from '../../src/lib/translateEntity';
import DynamicText from '../../src/components/DynamicText';
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
  Activity,
  BookOpen,
  MessageSquare,
  Flame,
  Share2,
  Calculator,
  Copy,
  Clock,
  X,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Moon,
  Sun,
  User,
  LayoutDashboard,
  Briefcase,
  Newspaper,
  Image as ImageIcon,
  MoreHorizontal,
  FileText,
  Scale,
  HelpCircle,
} from 'lucide-react-native';

// ─── Local Assets ──────────────────────────────────────────────────────────
const aboutMfctImage = require('../../assets/images/about-mfct.jpeg');
const medicalAidImage = require('../../assets/images/medical-aid.jpeg');
const educationImage = require('../../assets/images/education-books.jpeg');
const marriageImage = require('../../assets/images/marriage-support.jpeg');
const janazahImage = require('../../assets/images/zanaza.jpeg');
const foodImage = require('../../assets/images/food-ration.jpeg');
const zakatImage = require('../../assets/images/zakat-eligiable.jpeg');
const mfctHeaderMosqueBg = require('../../assets/images/mfct-header-mosque.jpg');
const mfctEmblem = require('../../assets/images/mfct-emblem.png');
const greenGoldWave = require('../../assets/images/green-gold-wave.png');

// ─── Brand Color Constants ─────────────────────────────────────────────────
const C = {
  darkGreen: '#091f15',
  midGreen: '#0e2a1d',
  deepGreen: '#0d281a',
  richGreen: '#1a4230',
  gold: '#c8a84b',
  goldLight: 'rgba(200,168,75,0.7)',
  goldBg: 'rgba(200,168,75,0.15)',
  goldBorder: 'rgba(200,168,75,0.35)',
  goldDark: '#a0832e',
  white: '#ffffff',
  offWhite: '#fafaf8',
  border: 'rgba(26,60,44,0.12)',
  textMuted: '#6b7280',
  cardBg: '#ffffff',
};

// ─── Mission Pillar Card ───────────────────────────────────────────────────
const MissionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  line1: string;
  line2: string;
}> = ({ icon, title, line1, line2 }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#1e293b' : C.cardBg,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : C.border,
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          backgroundColor: isDark ? '#0f291e' : C.richGreen,
          borderWidth: 2,
          borderColor: C.goldBorder,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontWeight: '700',
          fontSize: 12,
          color: isDark ? '#f8fafc' : C.richGreen,
          textAlign: 'center',
          marginBottom: 6,
          lineHeight: 16,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : C.textMuted, textAlign: 'center', lineHeight: 14 }}>
        {line1}
      </Text>
      <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : C.textMuted, textAlign: 'center', lineHeight: 14 }}>
        {line2}
      </Text>
    </View>
  );
};

// ─── Testimonial Card ──────────────────────────────────────────────────────
const TestimonialCard: React.FC<{ item: Testimonial; lang: Language }> = ({ item, lang }) => {
  const tItem = translateTestimonial(item, lang);

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(200,168,75,0.2)',
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.82)', lineHeight: 18, marginBottom: 12 }}>
        "{tItem.quote}"
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(200,168,75,0.15)',
        }}
      >
        {tItem.avatar ? (
          <Image
            source={{ uri: tItem.avatar }}
            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 2, borderColor: C.gold }}
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: C.goldBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              borderWidth: 2,
              borderColor: C.gold,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: '700', fontSize: 12 }}>
              {(tItem.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 11, color: C.white }}>{tItem.name}</Text>
          <Text style={{ fontSize: 10, color: C.goldLight }}>{tItem.role} • {tItem.city}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Section Header ────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  tag: string;
  title: string;
  desc?: string;
  light?: boolean;
}> = ({ tag, title, desc, light = false }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: light ? C.gold : isDark ? C.gold : C.goldDark,
          marginBottom: 4,
        }}
      >
        {tag}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '900',
          color: light ? C.white : isDark ? '#f8fafc' : C.richGreen,
          textAlign: 'center',
          lineHeight: 26,
        }}
      >
        {title}
      </Text>
      {/* Gold divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
        <View style={{ width: 28, height: 2, borderRadius: 1, backgroundColor: C.gold }} />
        <Heart size={12} color={C.gold} fill={C.gold} style={{ marginHorizontal: 6 }} />
        <View style={{ width: 28, height: 2, borderRadius: 1, backgroundColor: C.gold }} />
      </View>
      {desc ? (
        <Text style={{ fontSize: 11, color: light ? 'rgba(255,255,255,0.7)' : isDark ? '#94a3b8' : C.textMuted, textAlign: 'center', lineHeight: 16, marginTop: 2 }}>
          {desc}
        </Text>
      ) : null}
    </View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const router = useRouter();
  const { isAuthenticated, activeUser, isInitialized } = useAppState();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    screenBg: isDark ? '#080d1a' : C.offWhite,
    cardBg: isDark ? '#1e293b' : C.white,
    cardBorder: isDark ? '#334155' : C.border,
    innerCardBg: isDark ? '#0f172a' : '#fafaf8',
    textPrimary: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : C.textMuted,
    textHeading: isDark ? '#f8fafc' : C.richGreen,
    accentGreen: isDark ? '#4ade80' : C.richGreen,
    pillBg: isDark ? '#1e293b' : C.white,
    pillBorder: isDark ? '#334155' : C.border,
    progressTrack: isDark ? '#334155' : '#f1f5f9',
    inputBg: isDark ? '#0f172a' : '#fafaf8',
    inputBorder: isDark ? '#334155' : C.border,
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [realTotalMembers, setRealTotalMembers] = useState(0);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Direct Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Policy Modals
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // UI Interactive states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Zakat Calculator Modal state
  const [isZakatModalOpen, setIsZakatModalOpen] = useState(false);
  const [zakatGold, setZakatGold] = useState('');
  const [zakatSilver, setZakatSilver] = useState('');
  const [zakatCash, setZakatCash] = useState('');
  const [zakatInvestments, setZakatInvestments] = useState('');
  const [zakatLiabilities, setZakatLiabilities] = useState('');

  // Insets & Theme/Lang Handlers
  const insets = useSafeAreaInsets();
  const { toggleColorScheme } = useColorScheme();

  const isHi = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi');
  const handleToggleLanguage = async () => {
    const next = isHi ? 'en' : 'hi';
    i18n.changeLanguage(next);
    try { await AsyncStorage.setItem('mfct_language', next); } catch { }
  };
  const langLabel = isHi ? 'HI' : 'EN';

  const handleToggleTheme = async () => {
    toggleColorScheme();
    const next = isDark ? 'light' : 'dark';
    try { await AsyncStorage.setItem('mfct_theme', next); } catch { }
  };

  // Modals for the 8 Grid Action Buttons
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSchemesModalOpen, setIsSchemesModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  const handleSendContactMessage = async () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) {
      Alert.alert('Incomplete Form', 'Please enter your name, phone number, and message.');
      return;
    }
    setSubmittingContact(true);
    try {
      await submitContactMessage({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim() || undefined,
        message: contactMessage.trim(),
      });
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      Alert.alert(
        'Message Sent',
        'Thank you! Your message has been submitted to the MFCT Trust desk. Our team will contact you shortly.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit message. Please try again or call our helpline.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [cData, eData, tData, dData, commData, uData, accData, annData] = await Promise.all([
        getCampaigns(),
        getEmergencyCampaigns(),
        getTestimonials(),
        getRecentDonations(5),
        getCommunities(),
        getUsers(),
        getAccountDetails(),
        getAllAnnouncements(),
      ]);

      const allCamps = [...(cData || []), ...(eData || [])];
      setCampaigns(allCamps);
      setTestimonials(tData || []);
      setRecentDonations(dData || []);
      setCommunities(commData || []);
      setRealTotalMembers(uData?.length || 0);
      if (accData && accData.length > 0) {
        setAccountDetails(accData[0]);
      }
      setAnnouncements(annData || []);
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
      image: medicalAidImage,
      count: (campaigns || []).filter((c) => c.category === 'Medical').length,
      desc: t('home.cat_medical_desc'),
    },
    {
      id: 'Education',
      label: t('home.cat_education'),
      icon: BookOpen,
      image: educationImage,
      count: (campaigns || []).filter((c) => c.category === 'Education').length,
      desc: t('home.cat_education_desc'),
    },
    {
      id: 'Marriage',
      label: t('home.cat_marriage'),
      icon: Heart,
      image: marriageImage,
      count: (campaigns || []).filter((c) => c.category === 'Marriage').length,
      desc: t('home.cat_marriage_desc'),
    },
    {
      id: 'Janazah',
      label: t('home.cat_janazah'),
      icon: Building2,
      image: janazahImage,
      count: (campaigns || []).filter((c) => c.category === 'Janazah').length,
      desc: t('home.cat_janazah_desc'),
    },
    {
      id: 'Food',
      label: t('home.cat_food'),
      icon: Flame,
      image: foodImage,
      count: (campaigns || []).filter((c) => c.category === 'Food').length,
      desc: t('home.cat_food_desc'),
    },
    {
      id: 'Zakat',
      label: t('home.cat_zakat'),
      icon: ShieldCheck,
      image: zakatImage,
      count: (campaigns || []).filter((c) => c.isZakatEligible).length,
      desc: t('home.cat_zakat_desc'),
    },
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
        message: `Support ${camp.title} on MFCT - Muslim Family Care Trust: Goal ₹${camp.goalINR.toLocaleString('en-IN')}`,
      });
    } catch (error) {
      console.error(error);
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

  const faqs = [
    {
      q: t('home.faq1_q', 'How is MFCT different from other fundraising platforms?'),
      a: t('home.faq1_a', 'We operate at 0% platform fee and every case is verified on the ground by the local mohalla committee.'),
    },
    {
      q: t('home.faq2_q', 'Does my donation reach 100% directly to the beneficiary?'),
      a: t('home.faq2_a', 'Yes, emergency medical funds go directly to the hospital and nikah/ration items go directly from vendor to beneficiary.'),
    },
    {
      q: t('home.faq3_q', 'Will I receive an 80G tax exemption receipt?'),
      a: t('home.faq3_a', 'Yes, an official 80G receipt is issued instantly upon entering your PAN number.'),
    },
    {
      q: t('home.faq4_q', 'Can I give my Zakat through these campaigns?'),
      a: t('home.faq4_a', 'Yes, campaigns marked \'Zakat Eligible\' are 100% Shariah-compliant and given only to eligible beneficiaries.'),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.screenBg }}
      contentContainerStyle={{ width: '100%', flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.gold]} />}
    >
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO SECTION                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. MOCKUP HERO HEADER & 8-BUTTON DASHBOARD                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ backgroundColor: isDark ? '#080d1a' : '#06311e', width: '100%', flex: 1, overflow: 'hidden' }}>
        {/* Single Unified Header Background: Mosque Skyline & Sky */}
        <ImageBackground
          source={mfctHeaderMosqueBg}
          style={{ width: '100%', height: 350 }}
          resizeMode="cover"
        >
          {/* Subtle light/warm gradient wash */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDark ? 'rgba(8,13,26,0.35)' : 'rgba(255,255,255,0.02)',
            }}
          />

          {/* Top Floating Utility Bar (Lang, Theme, Dashboard/Sign In) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingTop: Math.max(insets.top + 4, 12),
              paddingHorizontal: 16,
              gap: 8,
              zIndex: 30,
            }}
          >
            {/* Language toggle: HI / EN */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleLanguage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 3.5,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.5)',
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Globe color="#073820" size={12} />
              <Text style={{ color: '#073820', fontSize: 10, fontWeight: '900' }}>
                {langLabel}
              </Text>
            </TouchableOpacity>

            {/* Theme Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleTheme}
              style={{
                padding: 5,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.5)',
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isDark ? <Sun color="#073820" size={13} /> : <Moon color="#073820" size={13} />}
            </TouchableOpacity>

            {/* Profile / Member Dashboard */}
            {!isInitialized ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.4)',
                }}
              >
                <ShimmerBlock width={48} height={12} borderRadius={999} />
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (isAuthenticated) {
                    const status = (activeUser?.status || '').toLowerCase();
                    if (status === 'pending' || status === 'reject' || status === 'rejected' || (!activeUser?.isVerified && status !== 'approved')) {
                      router.push('/(auth)/under-review');
                    } else {
                      router.push('/(drawer)/dashboard');
                    }
                  } else {
                    router.push('/(auth)/sign-in');
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3.5,
                  borderRadius: 999,
                  backgroundColor: isAuthenticated ? '#073820' : 'rgba(255,255,255,0.92)',
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.6)',
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard color={C.gold} size={12} />
                    <Text style={{ color: C.gold, fontSize: 10, fontWeight: '900', maxWidth: 85 }} numberOfLines={1}>
                      {activeUser?.name ? (activeUser.name.split(' ')[0] || activeUser.name) : t('drawer.dashboard', 'Portal')}
                    </Text>
                  </>
                ) : (
                  <>
                    <User color="#073820" size={12} />
                    <Text style={{ color: '#073820', fontSize: 10, fontWeight: '900' }}>
                      {t('auth.sign_in', 'Login')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Header Branding Container */}
          <View style={{ alignItems: 'center', paddingTop: 2, paddingHorizontal: 16 }}>
            {/* 1. Emblem Badge */}
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 15,
                backgroundColor: '#07321e',
                borderWidth: 1.5,
                borderColor: '#d4af37',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 4,
                marginBottom: 2,
                overflow: 'hidden',
              }}
            >
              <Image
                source={mfctEmblem}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            {/* 2. Bold Acronym MFCT */}
            <Text
              style={{
                fontSize: 27,
                fontWeight: '900',
                color: '#073820',
                letterSpacing: 2,
                lineHeight: 30,
                fontFamily: 'serif',
                textAlign: 'center',
              }}
            >
              MFCT
            </Text>

            {/* 3. Subtitle Full Trust Name */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: '900',
                color: '#073820',
                letterSpacing: 0.9,
                textAlign: 'center',
                textTransform: 'uppercase',
                marginTop: 1,
              }}
            >
              MOHAMMAD FAEEM CHARITABLE TRUST
            </Text>

            {/* 4. Tagline flanked by horizontal lines */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <View style={{ width: 22, height: 1.5, backgroundColor: '#073820', opacity: 0.8 }} />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: '800',
                  color: '#073820',
                  marginHorizontal: 7,
                  letterSpacing: 0.4,
                }}
              >
                याद उनकी, सेवा हमारी
              </Text>
              <View style={{ width: 22, height: 1.5, backgroundColor: '#073820', opacity: 0.8 }} />
            </View>
          </View>
        </ImageBackground>

        {/* 6. White Frosted Card Container for 8 Action Tiles (Starts BELOW the mosque image) */}
        <View
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            paddingVertical: 14,
            paddingHorizontal: 8,
            marginHorizontal: 14,
            marginTop: 0,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : 'rgba(26,66,44,0.08)',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
            zIndex: 5,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {/* Tile 1: About Us */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsAboutModalOpen(true)}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <User size={24} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                About Us
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                हमारे बारे में
              </Text>
            </TouchableOpacity>

            {/* Tile 2: Membership */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(auth)/sign-up')}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <Users size={24} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                Membership
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                सदस्यता
              </Text>
            </TouchableOpacity>

            {/* Tile 3: Our Schemes */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsSchemesModalOpen(true)}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <Briefcase size={23} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                Our Schemes
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                हमारी योजनाएँ
              </Text>
            </TouchableOpacity>

            {/* Tile 4: Donate */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(stacks)/donation')}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <Heart size={24} color="#ffffff" fill="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                Donate
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                सहयोग करें
              </Text>
            </TouchableOpacity>

            {/* Tile 5: News & Updates */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsNewsModalOpen(true)}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2, marginTop: 4 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <Newspaper size={23} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                News & Updates
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                समाचार
              </Text>
            </TouchableOpacity>

            {/* Tile 6: Gallery */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)/gallery')}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2, marginTop: 4 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <ImageIcon size={23} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                Gallery
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                गैलरी
              </Text>
            </TouchableOpacity>

            {/* Tile 7: Contact Us */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsContactModalOpen(true)}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2, marginTop: 4 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <Phone size={23} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                Contact Us
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                संपर्क करें
              </Text>
            </TouchableOpacity>

            {/* Tile 8: More */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsMoreModalOpen(true)}
              style={{ width: '24%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2, marginTop: 4 }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: '#09482b',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#09482b',
                  shadowOpacity: 0.35,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                }}
              >
                <MoreHorizontal size={24} color="#ffffff" />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#f8fafc' : '#111827', textAlign: 'center', marginTop: 6 }}
              >
                More
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: 8.5, fontWeight: '600', color: isDark ? '#94a3b8' : '#4b5563', textAlign: 'center', marginTop: 1 }}
              >
                और भी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Bottom Elegant Green-Gold Ribbon Wave Banner */}
        <View style={{ width: '100%', flex: 1, minHeight: 150, marginTop: -18, zIndex: 1, overflow: 'hidden', backgroundColor: '#06311e' }}>
          <ImageBackground
            source={greenGoldWave}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 150,
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: 18,
            }}
            resizeMode="cover"
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 20,
                marginTop: 32,
                fontWeight: '800',
                letterSpacing: 0.6,
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 4,
              }}
            >
              “याद उनकी, सेवा हमारी”
            </Text>
          </ImageBackground>
        </View>

        {/* 8. Live Verified Audit Stats Strip (Preserved) */}
        {/* <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            <View
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: theme.cardBg,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: isDark ? theme.cardBorder : 'rgba(200,168,75,0.3)',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 6,
                elevation: 3,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ShimmerBlock width={40} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: '900', color: theme.accentGreen, lineHeight: 20 }} numberOfLines={1} adjustsFontSizeToFit>
                  {totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}+
                </Text>
              )}
              <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textSecondary, lineHeight: 12, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t('home.verified_members', 'Verified Members')}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: C.richGreen,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: C.midGreen,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
                alignItems: 'center',
              }}
            >
              {loading ? (
                <ShimmerBlock width={48} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: '900', color: C.white, lineHeight: 20 }} numberOfLines={1} adjustsFontSizeToFit>
                  ₹{totalRaised > 0 ? totalRaised.toLocaleString('en-IN') : '0'}+
                </Text>
              )}
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.gold, lineHeight: 12, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t('home.funds_disbursed', 'Relief Disbursed')}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: theme.cardBg,
                borderRadius: 14,
                paddingHorizontal: 8,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: isDark ? theme.cardBorder : 'rgba(200,168,75,0.3)',
                shadowColor: '#000',
                shadowOpacity: isDark ? 0.25 : 0.08,
                shadowRadius: 6,
                elevation: 3,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: theme.accentGreen, lineHeight: 20 }} numberOfLines={1} adjustsFontSizeToFit>
                100%
              </Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textSecondary, lineHeight: 12, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {t('home.audit_receipts', 'Audit Receipts')}
              </Text>
            </View>
          </View>
        </View> */}
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. UPI DONATION WIDGET                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <View
          style={{
            backgroundColor: C.darkGreen,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(200,168,75,0.4)',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, marginRight: 8 }} />
              <Text style={{ color: C.gold, fontWeight: '800', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {t('home.scan_donate', 'UPI Direct Donate')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyUpi}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: copiedUpi ? '#10b981' : C.gold,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              {copiedUpi ? <Check size={12} color={C.white} /> : <Copy size={12} color={C.deepGreen} />}
              <Text style={{ color: copiedUpi ? C.white : C.deepGreen, fontWeight: '800', fontSize: 10, marginLeft: 4 }}>
                {copiedUpi ? t('home.upi_copied', 'Copied!') : t('home.copy_upi', 'Copy UPI')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ backgroundColor: C.white, padding: 8, borderRadius: 12 }}>
              {accountDetails?.qr_code_url ? (
                <Image source={{ uri: accountDetails.qr_code_url }} style={{ width: 72, height: 72 }} resizeMode="contain" />
              ) : (
                <QrCode color={C.darkGreen} size={72} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.white, fontFamily: 'monospace', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                {accountDetails?.upi_id || 'mfct@okicici'}
              </Text>
              <Text style={{ color: C.gold, fontSize: 10, fontWeight: '600', marginBottom: 2 }}>
                {t('home.scan_upi', 'Scan & Pay via any UPI app')}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>
                {accountDetails?.bank_name ? `Bank: ${accountDetails.bank_name}` : t('home.escrow_note', '100% Direct Hospital & Aid Escrow')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <View key={app} style={{ backgroundColor: C.goldBg, borderWidth: 1, borderColor: C.goldBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: C.gold, fontSize: 8, fontWeight: '700' }}>{app}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. OUR MISSION – 4 PILLARS                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingVertical: 28 }}>
        <SectionHeader
          tag={t('home.mission_tag', 'OUR MISSION')}
          title={t('home.mission_title', 'Our Mission')}
          desc={t('home.mission_desc', 'Our goal is to deliver aid, support, and selfless service to every section of society.')}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <MissionCard
            icon={<Heart size={22} color={C.white} fill={C.white} />}
            title={t('home.mission_care_title', 'We Care Every Life')}
            line1={t('home.mission_care_l1', 'Emergency Bereavement Aid')}
            line2={t('home.mission_care_l2', 'Standing by you in every crisis')}
          />
          <MissionCard
            icon={<ShieldCheck size={22} color={C.white} />}
            title={t('home.mission_stand_title', 'We Stand Together')}
            line1={t('home.mission_stand_l1', 'Cooperation, Unity & Humanity')}
            line2={t('home.mission_stand_l2', 'Dedicated to All')}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <MissionCard
            icon={<Award size={22} color={C.white} />}
            title={t('home.mission_serve_title', 'We Serve Selflessly')}
            line1={t('home.mission_serve_l1', 'Daughter Marriage Shagun Aid,')}
            line2={t('home.mission_serve_l2', 'Our Daughter, Our Responsibility')}
          />
          <MissionCard
            icon={<Users size={22} color={C.white} />}
            title={t('home.mission_build_title', 'We Build Better Society')}
            line1={t('home.mission_build_l1', 'Education, Health & Medical Aid')}
            line2={t('home.mission_build_l2', 'and Social Upliftment')}
          />
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. ABOUT MFCT BANNER                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View
          style={{
            backgroundColor: C.darkGreen,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: 'rgba(200,168,75,0.4)',
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Image
            source={aboutMfctImage}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
          <View style={{ padding: 20 }}>
            <Text style={{ color: C.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {t('home.about_tag', 'ABOUT MFCT')}
            </Text>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '900', marginBottom: 10, lineHeight: 24 }}>
              {t('home.about_title', 'Mohammad Faeem Charitable Trust')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 32, height: 2, backgroundColor: C.gold }} />
              <Heart size={10} color={C.gold} fill={C.gold} style={{ marginHorizontal: 6 }} />
              <ArrowRight size={10} color={C.gold} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
              {t('home.about_desc', 'MFCT was established to strengthen brotherhood, unity, and humanity across society. Through education, health, emergency bereavement aid, daughter marriage support, medical assistance, disaster relief, and welfare programs, we are dedicated to reaching every section of society.')}
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.28)',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.3)',
                padding: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[
                  { val: '1000+', label: t('home.about_families', 'Families Assisted') },
                  { val: '500+', label: t('home.about_marriage', 'Marriage Aid') },
                  { val: '200+', label: t('home.about_emergency', 'Emergency Aid') },
                  { val: '50+', label: t('home.about_volunteers', 'Key Volunteers') },
                ].map((stat) => (
                  <View key={stat.label} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 }}>
                    <Users size={20} color={C.gold} style={{ marginRight: 8 }} />
                    <View>
                      <Text style={{ color: C.white, fontWeight: '900', fontSize: 15, lineHeight: 18 }}>{stat.val}</Text>
                      <Text style={{ color: C.goldLight, fontSize: 9, fontWeight: '600' }}>{stat.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/campaigns')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.gold,
                paddingVertical: 12,
                borderRadius: 12,
                shadowColor: C.gold,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {t('home.about_read_more', 'Read More About Us')}
              </Text>
              <ArrowRight size={14} color={C.deepGreen} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. OUR PROGRAMS / DONATION CATEGORIES                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <SectionHeader
          tag={t('home.programs_tag', 'OUR PROGRAMS')}
          title={t('home.programs_title', 'Our Key Programs')}
          desc={t('home.programs_desc', 'Choose a cause. Every rupee goes directly to the beneficiary.')}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {categoriesList.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? 'All' : cat.id)}
                style={{
                  width: '48%',
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? C.gold : theme.cardBorder,
                  backgroundColor: theme.cardBg,
                  shadowColor: '#000',
                  shadowOpacity: isSelected ? 0.15 : 0.04,
                  shadowRadius: isSelected ? 10 : 4,
                  elevation: isSelected ? 5 : 2,
                  marginBottom: 4,
                }}
              >
                <View style={{ height: 80, width: '100%', position: 'relative', overflow: 'hidden' }}>
                  <Image source={cat.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isSelected ? 'rgba(9,31,21,0.5)' : 'rgba(0,0,0,0.3)',
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isSelected ? C.gold : isDark ? '#0f172a' : C.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <IconComp size={16} color={isSelected ? C.deepGreen : isDark ? C.gold : C.richGreen} />
                    </View>
                    <View
                      style={{
                        backgroundColor: isSelected ? C.gold : isDark ? '#0f172a' : 'rgba(255,255,255,0.92)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        shadowColor: '#000',
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Text style={{ color: isSelected ? C.deepGreen : isDark ? C.gold : C.richGreen, fontSize: 10, fontWeight: '900' }}>
                        {cat.count}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
                  <Text style={{ fontWeight: '800', fontSize: 12, color: theme.textHeading, marginBottom: 2 }}>
                    {cat.label}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 10, color: theme.textSecondary }}>
                    {cat.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. YOUR COMMUNITY CAMPAIGNS (LOGGED IN)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* {isAuthenticated && activeUser && myCommunityCampaigns.length > 0 && (
        <View
          style={{
            paddingVertical: 20,
            paddingHorizontal: 16,
            backgroundColor: isDark ? 'rgba(200,168,75,0.06)' : 'rgba(26,66,44,0.06)',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: isDark ? theme.cardBorder : 'rgba(26,66,44,0.1)',
            marginBottom: 8,
          }}
        >
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: C.goldDark, marginBottom: 3 }}>
              {t('home.your_community', 'Your Community')}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: theme.textHeading }}>
              {t('home.community_campaigns_title', { community: translateCommunityName(activeUser.communityName || 'Your Area', lang) })}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {myCommunityCampaigns.slice(0, 4).map((c) => {
              const displayTitle = translateCampaignTitle(c.title, lang);
              const displayCat = translateCategory(c.category, lang);
              const displayCity = translateCity(c.city, lang);

              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: c.id } })}
                  style={{
                    width: 220,
                    backgroundColor: theme.cardBg,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <Image source={{ uri: c.mainImage }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? C.gold : C.richGreen, textTransform: 'uppercase', marginBottom: 3 }}>
                      {displayCat} • {displayCity}
                    </Text>
                    <DynamicText
                      text={c.title}
                      lang={lang}
                      fallback={displayTitle}
                      style={{ fontWeight: '700', color: theme.textPrimary, fontSize: 12, marginBottom: 8 }}
                      numberOfLines={2}
                    />
                    <View style={{ backgroundColor: theme.progressTrack, borderRadius: 999, height: 4, marginBottom: 8 }}>
                      <View style={{ backgroundColor: C.gold, height: 4, borderRadius: 999, width: `${Math.min((c.raisedINR / c.goalINR) * 100, 100)}%` as any }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: theme.accentGreen, fontWeight: '700' }}>
                        ₹{c.raisedINR.toLocaleString('en-IN')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(stacks)/donation', params: { campaignId: c.id, initialCategory: c.category } })}
                        style={{ backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                      >
                        <Text style={{ color: C.deepGreen, fontSize: 10, fontWeight: '800' }}>{t('home.donate_now', 'Donate')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )} */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 7. ZAKAT CALCULATOR HIGHLIGHT BANNER                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View
          style={{
            backgroundColor: C.richGreen,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(200,168,75,0.3)',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 }}>
            <Sparkles size={12} color={C.deepGreen} />
            <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 5 }}>
              {t('home.zakat_banner_badge', '100% Shariah Compliant Calculator')}
            </Text>
          </View>
          <Text style={{ color: C.white, fontSize: 20, fontWeight: '900', marginBottom: 6, lineHeight: 26 }}>
            {t('home.zakat_modal_title', 'Calculate Your Zakat (2.5%)')}
          </Text>
          <Text style={{ color: C.goldLight, fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
            {t('home.zakat_banner_desc', 'Enter gold, silver, savings and investments to instantly know your Zakat due and donate directly.')}
          </Text>
          <TouchableOpacity
            onPress={() => setIsZakatModalOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.gold,
              paddingVertical: 12,
              borderRadius: 14,
              shadowColor: C.gold,
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Calculator size={16} color={C.deepGreen} />
            <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 13, marginLeft: 8 }}>
              {t('home.zakat_calc', 'Free Zakat Calculator')}
            </Text>
            <ArrowRight size={14} color={C.deepGreen} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. FEATURED CAMPAIGNS WITH CATEGORY FILTER                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: C.goldDark, marginBottom: 3 }}>
            {t('home.how_tag', 'On-site Verified Causes')}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: theme.textHeading }}>
            {t('home.featured_title', 'Featured Active Campaigns')}
          </Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 3 }}>
            {t('home.featured_desc', 'High-impact relief campaigns verified at the grassroots level')}
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {['All', 'Urgent', 'Zakat', 'Medical', 'Education', 'Food', 'Marriage', 'Janazah'].map((cat) => {
            const isCatActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: isCatActive ? (isDark ? C.gold : C.richGreen) : theme.cardBg,
                  borderColor: isCatActive ? (isDark ? C.gold : C.richGreen) : theme.cardBorder,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: isCatActive ? (isDark ? C.deepGreen : C.white) : theme.textSecondary }}>
                  {cat === 'All' ? t('home.cat_all', 'All')
                    : cat === 'Urgent' ? t('home.cat_urgent', 'Urgent')
                      : cat === 'Zakat' ? t('home.cat_zakat', 'Zakat')
                        : cat === 'Medical' ? t('home.cat_medical', 'Medical')
                          : cat === 'Education' ? t('home.cat_education', 'Education')
                            : cat === 'Food' ? t('home.cat_food', 'Food')
                              : cat === 'Marriage' ? t('home.cat_marriage', 'Marriage')
                                : cat === 'Janazah' ? t('home.cat_janazah', 'Janazah')
                                  : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ gap: 14 }}>
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
            <CampaignCardSkeleton />
          </View>
        ) : filteredCampaigns.length > 0 ? (
          <View style={{ gap: 14 }}>
            {filteredCampaigns.slice(0, 3).map((camp) => {
              const displayTitle = translateCampaignTitle(camp.title, lang);
              const displayCat = translateCategory(camp.category, lang);
              const displayCity = translateCity(camp.city, lang);
              const displayStory = translateCampaignStory(camp.story, lang);

              return (
                <View
                  key={camp.id}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: camp.id } })}
                  >
                    <Image source={{ uri: camp.mainImage }} style={{ width: '100%', height: 168 }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
                      {camp.isUrgent && (
                        <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                          <Flame color={C.white} size={9} />
                          <Text style={{ color: C.white, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 3 }}>
                            {translateCategory('Urgent', lang)}
                          </Text>
                        </View>
                      )}
                      {camp.isZakatEligible && (
                        <View style={{ backgroundColor: C.richGreen, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                          <ShieldCheck color={C.white} size={9} />
                          <Text style={{ color: C.white, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 3 }}>
                            {translateCategory('Zakat', lang)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? C.gold : C.richGreen, textTransform: 'uppercase' }}>
                        {displayCat} • {displayCity}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock color="#94a3b8" size={11} />
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginLeft: 3 }}>
                          {camp.daysLeft} {t('campaigns.days_left', 'days left')}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => router.push({ pathname: '/(stacks)/campaign-details', params: { id: camp.id } })}>
                      <DynamicText
                        text={camp.title}
                        lang={lang}
                        fallback={displayTitle}
                        style={{ fontWeight: '800', color: theme.textPrimary, fontSize: 15, lineHeight: 21, marginBottom: 6 }}
                        numberOfLines={2}
                      />
                    </TouchableOpacity>

                    <DynamicText
                      text={camp.story}
                      lang={lang}
                      fallback={displayStory}
                      style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginBottom: 12 }}
                      numberOfLines={2}
                    />

                    <View style={{ backgroundColor: theme.progressTrack, borderRadius: 999, height: 6, marginBottom: 8 }}>
                      <View
                        style={{
                          backgroundColor: C.gold,
                          height: 6,
                          borderRadius: 999,
                          width: `${Math.min((camp.raisedINR / camp.goalINR) * 100, 100)}%` as any,
                        }}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View>
                        <Text style={{ color: theme.accentGreen, fontWeight: '800', fontSize: 13 }}>
                          ₹{camp.raisedINR.toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                          {t('home.raised_of', 'of')} ₹{camp.goalINR.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>
                        {camp.donorsCount} {t('campaigns.donors', 'donors')}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? theme.cardBorder : '#f1f5f9' }}>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(stacks)/donation', params: { campaignId: camp.id, initialCategory: camp.category } })}
                        style={{ flex: 1, backgroundColor: C.gold, paddingVertical: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
                      >
                        <Heart color={C.deepGreen} size={14} fill={C.deepGreen} />
                        <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 12, marginLeft: 6 }}>{t('home.donate_now', 'Donate Now')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/campaigns')}
              style={{ paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, backgroundColor: C.richGreen, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
            >
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 13, marginRight: 8 }}>{t('home.view_all_campaigns', 'View All Campaigns')}</Text>
              <ArrowRight color={C.gold} size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingVertical: 36, alignItems: 'center', backgroundColor: theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
              {t('home.no_campaigns', 'No active campaigns found in this category.')}
            </Text>
          </View>
        )}
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 9. MEMBERSHIP BANNER                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: 'rgba(200,168,75,0.5)',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=70' }}
            style={{ overflow: 'hidden' }}
            resizeMode="cover"
          >
            <View style={{ backgroundColor: 'rgba(9,31,21,0.93)', padding: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 12 }}>
                <Sparkles size={11} color={C.deepGreen} />
                <Text style={{ color: C.deepGreen, fontWeight: '900', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginLeft: 5 }}>
                  {t('home.join_badge', 'Join the Community')}
                </Text>
              </View>

              <Text style={{ color: C.white, fontSize: 22, fontWeight: '900', lineHeight: 28, marginBottom: 8 }}>
                {t('home.member_heading', 'Become a Member')}{' '}
                <Text style={{ color: C.gold }}>{t('home.member_price', 'for ₹100/yr')}</Text>
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18, marginBottom: 18 }}>
                {t('home.member_desc', 'Your ₹100 annual membership fee creates a verified member ID and builds our solidarity emergency fund — helping families in crisis right in your neighbourhood.')}
              </Text>

              <View style={{ gap: 8, marginBottom: 20 }}>
                {[
                  t('home.benefit_1', 'Verified Member ID Card'),
                  t('home.benefit_2', 'Priority Emergency Assistance'),
                  t('home.benefit_3', 'Access to all Community Events'),
                  t('home.benefit_4', 'Zakat & Donation Receipts'),
                ].map((benefit) => (
                  <View key={benefit} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CheckCircle2 size={14} color={C.gold} fill={C.gold} />
                    <Text style={{ color: C.white, fontSize: 12, marginLeft: 8, fontWeight: '600' }}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/sign-up')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: C.gold,
                  paddingVertical: 14,
                  borderRadius: 14,
                  shadowColor: C.gold,
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                <UserPlus size={16} color={C.deepGreen} />
                <Text style={{ color: C.deepGreen, fontWeight: '900', fontSize: 14, marginLeft: 8 }}>
                  {t('home.become_member_action', 'Become a Member · ₹100')}
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 10. HOW IT WORKS (4 STEPS)                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View
        style={{
          marginHorizontal: 16,
          marginBottom: 20,
          backgroundColor: theme.cardBg,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <SectionHeader
          tag={t('home.how_tag', 'Simple & Trustworthy')}
          title={t('home.how_title', 'How Does It Work?')}
          desc={t('home.how_desc', 'A simple 4-step model for transparent and direct aid')}
        />
        <View style={{ gap: 10 }}>
          {[
            { step: '1', title: t('home.step1_title', 'Grassroots Identification'), desc: t('home.step1_desc', 'Mohalla elders and field volunteers personally verify every case.') },
            { step: '2', title: t('home.step2_title', 'Direct Bank & Hospital Payments'), desc: t('home.step2_desc', 'Funds go directly to hospitals, vendors, or beneficiaries.') },
            { step: '3', title: t('home.step3_title', '100% Audit & Receipts'), desc: t('home.step3_desc', "Every transaction's bill and audit report is publicly available.") },
            { step: '4', title: t('home.step4_title', 'Video & Photo Updates'), desc: t('home.step4_desc', 'Proof is shared with donors immediately after relief is delivered.') },
          ].map((item) => (
            <View
              key={item.step}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                backgroundColor: theme.innerCardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: C.goldBg,
                  borderWidth: 2,
                  borderColor: 'rgba(200,168,75,0.35)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ color: isDark ? C.gold : C.richGreen, fontWeight: '900', fontSize: 14 }}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 12, color: theme.textHeading, marginBottom: 3 }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 16 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 11. IMPACT COUNTERS                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}>
        <View
          style={{
            backgroundColor: C.richGreen,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(200,168,75,0.2)',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: C.goldLight }}>
              {t('home.impact_counter_tag', 'Impact')}
            </Text>
            <View style={{ backgroundColor: C.goldBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
              <Text style={{ color: C.gold, fontSize: 10, fontWeight: '700' }}>{t('home.impact_realtime', 'Live')}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: C.gold, marginBottom: 4 }}>
            {testimonials.length > 0 ? testimonials.length : 12}+
          </Text>
          <Text style={{ fontSize: 12, color: C.goldLight, lineHeight: 18 }}>
            {t('home.impact_counter_desc', 'Lives changed and successful relief stories')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textSecondary }}>
              {t('home.members_counter_tag', 'Network')}
            </Text>
            <View style={{ backgroundColor: C.goldBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)' }}>
              <Text style={{ color: isDark ? C.gold : C.richGreen, fontSize: 10, fontWeight: '700' }}>
                {t('home.today_badge', 'Active')} +14
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: theme.textHeading, marginBottom: 4 }}>
            {totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {t('home.members_counter_desc', 'Registered volunteers and donor members')}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textSecondary }}>
              {t('home.communities_tag', 'Mohalla Hub')}
            </Text>
            <View style={{ backgroundColor: isDark ? 'rgba(200,168,75,0.1)' : 'rgba(26,60,44,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
              <Text style={{ color: isDark ? C.gold : C.richGreen, fontSize: 10, fontWeight: '700' }}>
                {communities.length > 0 ? communities.length : '0'} {t('home.active_hubs', 'Active Hubs')}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: theme.textHeading, marginBottom: 4 }}>{avgHealth}%</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14 }}>
            {t('home.communities_desc', 'Average community health and verification score')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/community')}
            style={{ paddingVertical: 11, borderRadius: 12, backgroundColor: isDark ? '#0f291e' : C.richGreen, borderWidth: isDark ? 1 : 0, borderColor: C.goldBorder, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
          >
            <Building2 color={C.gold} size={14} />
            <Text style={{ color: C.white, fontWeight: '800', fontSize: 12, marginLeft: 6 }}>
              {t('home.explore_communities', 'Explore Community Network')}
            </Text>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 12. FAQ ACCORDION                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View
        style={{
          marginHorizontal: 16,
          marginBottom: 20,
          backgroundColor: theme.cardBg,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <SectionHeader
          tag={t('home.faq_tag', 'Frequently Asked Questions')}
          title={t('home.faq_title', 'FAQ')}
        />
        <View style={{ gap: 10 }}>
          {faqs.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <View
                key={index}
                style={{
                  borderRadius: 14,
                  backgroundColor: isOpen ? theme.innerCardBg : theme.cardBg,
                  borderWidth: 1,
                  borderColor: isOpen ? C.goldBorder : theme.cardBorder,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setExpandedFaq(isOpen ? null : index)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: isOpen ? C.goldBg : isDark ? '#334155' : '#f1f5f9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        borderWidth: 1,
                        borderColor: isOpen ? C.goldBorder : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isOpen ? (isDark ? C.gold : C.richGreen) : theme.textSecondary }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: isOpen ? (isDark ? C.gold : C.richGreen) : theme.textPrimary,
                        flex: 1,
                        lineHeight: 18,
                      }}
                    >
                      {faq.q}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isOpen ? (isDark ? '#0f291e' : C.richGreen) : isDark ? '#334155' : '#f8fafc',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isOpen ? (
                      <ChevronUp size={16} color={C.white} />
                    ) : (
                      <ChevronDown size={16} color={theme.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingBottom: 14,
                      paddingTop: 4,
                      borderTopWidth: 1,
                      borderTopColor: 'rgba(200,168,75,0.15)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.textSecondary,
                        lineHeight: 18,
                      }}
                    >
                      {faq.a}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13. RECENT DONATIONS LIVE FEED                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold, marginRight: 8 }} />
              <Text style={{ fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: theme.textHeading }}>
                {t('home.donations_feed_title', 'Recent Donations')}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: theme.textSecondary }}>{t('home.donations_feed_subtitle', 'Transparent Live Feed')}</Text>
          </View>

          {recentDonations.length > 0 ? (
            <View style={{ gap: 10 }}>
              {recentDonations.map((don) => {
                const donorName = translateDonorName(don.donorName, lang);
                const campTitle = translateCampaignTitle(don.campaignTitle, lang);
                const commName = translateCommunityName(don.communityName, lang);

                return (
                  <View
                    key={don.id}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,60,44,0.06)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          backgroundColor: C.goldBg,
                          borderWidth: 1,
                          borderColor: 'rgba(200,168,75,0.3)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10,
                        }}
                      >
                        <Text style={{ color: isDark ? C.gold : C.richGreen, fontWeight: '800', fontSize: 13 }}>
                          {(donorName || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: theme.textPrimary, fontSize: 12 }}>
                          {donorName}{' '}
                          <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>{t('home.donated_label', 'donated')}</Text>{' '}
                          ₹{don.amountINR.toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>
                          {campTitle} • {commName}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <View
                        style={{
                          backgroundColor: C.goldBg,
                          borderWidth: 1,
                          borderColor: 'rgba(200,168,75,0.3)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginBottom: 3,
                        }}
                      >
                        <Text style={{ fontSize: 9, color: isDark ? C.gold : C.richGreen, fontWeight: '800' }}>
                          ✓ {t('home.utr_verified', 'UTR Verified')}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 9, color: theme.textSecondary, fontFamily: 'monospace' }}>{don.date}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ textAlign: 'center', paddingVertical: 16, fontSize: 12, color: theme.textSecondary }}>
              {t('home.no_donations', 'No donation records yet')}
            </Text>
          )}
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13. TESTIMONIALS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 32,
          marginHorizontal: 0,
          backgroundColor: C.richGreen,
        }}
      >
        <SectionHeader
          tag={t('home.testimonials_tag', 'Stories')}
          title={t('home.testimonials_title', 'Grassroots Impact Stories')}
          desc={t('home.testimonials_desc', 'Experiences of beneficiaries and field volunteers')}
          light
        />
        <View>
          {testimonials.slice(0, 3).map((item) => (
            <TestimonialCard key={item.id} item={item} lang={lang} />
          ))}
        </View>
        {testimonials.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/impact-stories')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 13,
              paddingHorizontal: 24,
              borderRadius: 14,
              backgroundColor: C.gold,
              alignSelf: 'center',
              shadowColor: C.gold,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 12, marginRight: 6 }}>
              {t('home.view_all_stories', 'View All Stories')}
            </Text>
            <ArrowRight color={C.deepGreen} size={14} />
          </TouchableOpacity>
        )}
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13.5 ABOUT US & FOUNDERS' MESSAGE                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <AboutUs /> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 14. 24/7 HELPLINE & SUPPORT (Clean, Readable Design)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* <View style={{ paddingHorizontal: 16, paddingBottom: 36, paddingTop: 28, backgroundColor: theme.screenBg, borderTopWidth: 1, borderTopColor: theme.cardBorder }}>
        <SectionHeader
          tag={t('home.contact_tag', '24/7 Helpline & Support')}
          title={t('home.contact_title', 'Emergency & Support Helpline')}
          desc={t('home.contact_desc', 'Our team and grassroots volunteers are available 24/7 for immediate assistance.')}
        />

        
        <View
          style={{
            backgroundColor: C.richGreen,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: 'rgba(200,168,75,0.25)',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontWeight: '800', fontSize: 11, color: C.gold, textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('home.emergency_desks', 'Emergency Direct Desks')}
            </Text>
            <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ color: '#34d399', fontSize: 9, fontWeight: '800' }}>● 24/7 LIVE</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Linking.openURL('tel:+918218017226')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.2)',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.goldBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Phone color={C.gold} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.goldLight, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 }}>
                {t('home.helpline_desk1', '24/7 Emergency Support Desk 1')}
              </Text>
              <Text style={{ fontWeight: '900', color: C.white, fontSize: 15, marginTop: 1 }}>
                +91 82180 17226
              </Text>
            </View>
            <View style={{ backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Text style={{ color: C.deepGreen, fontSize: 10, fontWeight: '900' }}>CALL</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Linking.openURL('tel:+919756919430')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.2)',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: C.goldBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Phone color={C.gold} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.goldLight, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 }}>
                {t('home.helpline_desk2', '24/7 Emergency Support Desk 2')}
              </Text>
              <Text style={{ fontWeight: '900', color: C.white, fontSize: 15, marginTop: 1 }}>
                +91 97569 19430
              </Text>
            </View>
            <View style={{ backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
              <Text style={{ color: C.deepGreen, fontSize: 10, fontWeight: '900' }}>CALL</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://wa.me/918218017226?text=Hello%20MFCT%20Team,%20I%20need%20assistance')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#25D366',
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <MessageSquare color={C.white} size={14} />
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 11, marginLeft: 6 }}>
                {t('home.whatsapp_desk', 'WhatsApp Desk')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL('mailto:info@mfcttrust.com')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 11 }}>
                info@mfcttrust.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 16, alignItems: 'center', paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textHeading, textAlign: 'center' }}>
            {t('home.footer_trust_name')}
          </Text>
          <Text style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center', marginTop: 2 }}>
            {t('home.footer_reg')}
          </Text>
          <Text style={{ fontSize: 9, color: theme.textSecondary, textAlign: 'center', marginTop: 2 }}>
            {t('home.footer_address')}
          </Text>
        </View>
      </View> */}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 16. ZAKAT CALCULATOR MODAL (Logic Unchanged)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isZakatModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsZakatModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calculator color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  {t('home.zakat_modal_title', 'Zakat Calculator (2.5%)')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsZakatModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16, lineHeight: 18 }}>
                {t('home.zakat_modal_desc', 'Enter values in INR (₹) to calculate your 2.5% Zakat obligation.')}
              </Text>

              <View style={{ gap: 12, marginBottom: 16 }}>
                {[
                  { label: t('home.zakat_gold', 'Gold Value (₹)'), val: zakatGold, set: setZakatGold },
                  { label: t('home.zakat_silver', 'Silver Value (₹)'), val: zakatSilver, set: setZakatSilver },
                  { label: t('home.zakat_cash', 'Cash & Savings (₹)'), val: zakatCash, set: setZakatCash },
                  { label: t('home.zakat_investments', 'Investments (₹)'), val: zakatInvestments, set: setZakatInvestments },
                  { label: t('home.zakat_liabilities', 'Liabilities / Loans (₹)'), val: zakatLiabilities, set: setZakatLiabilities },
                ].map((field) => (
                  <View key={field.label}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textHeading, marginBottom: 5 }}>{field.label}</Text>
                    <TextInput
                      value={field.val}
                      onChangeText={field.set}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      style={{ padding: 12, borderRadius: 12, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, fontSize: 13, color: theme.textPrimary }}
                    />
                  </View>
                ))}
              </View>

              {/* Result */}
              <View style={{ backgroundColor: C.darkGreen, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{t('home.zakat_net_wealth', 'Net Wealth')}</Text>
                  <Text style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>₹{netWealth.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(200,168,75,0.2)' }}>
                  <Text style={{ color: C.gold, fontWeight: '800', fontSize: 14 }}>{t('home.zakat_payable', 'Zakat Payable (2.5%)')}</Text>
                  <Text style={{ color: C.gold, fontWeight: '900', fontSize: 22 }}>₹{zakatPayable.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={{ fontSize: 10, color: 'rgba(200,168,75,0.65)', marginTop: 8 }}>
                  {t('home.zakat_nisab_note', 'Based on current nisab. Verify with your local scholar.')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => { setIsZakatModalOpen(false); router.push('/(tabs)/campaigns'); }}
                style={{ paddingVertical: 14, backgroundColor: C.gold, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: C.gold, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }}
              >
                <Text style={{ color: C.deepGreen, fontWeight: '900', fontSize: 13 }}>
                  {t('home.zakat_donate_action', 'Donate Your Zakat Now')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsZakatModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  {t('home.zakat_close', 'Close')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 17. ABOUT US MODAL (Tile 1)                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAboutModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAboutModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '92%', maxHeight: '92%', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: theme.cardBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <User color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  About Us / हमारे बारे में
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAboutModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <AboutUs
                visible={isAboutModalOpen}
                onRequestClose={() => setIsAboutModalOpen(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 18. OUR SCHEMES MODAL (Tile 3)                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isSchemesModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSchemesModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Briefcase color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  Our Schemes / हमारी योजनाएँ
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSchemesModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14 }}>
                Choose any welfare scheme below to view active cases or make a direct contribution.
              </Text>

              <View style={{ gap: 12, marginBottom: 16 }}>
                {[
                  {
                    title: 'Emergency Bereavement & Janazah Aid',
                    titleHi: 'जनाज़ा व कफ़न-दफ़न सहायता',
                    desc: 'Dignified funeral expenses and instant financial assistance for underprivileged families in times of sudden loss.',
                    cat: 'Janazah',
                  },
                  {
                    title: 'Medical Aid & Hospital Relief',
                    titleHi: 'चिकित्सा एवं अस्पताल सहायता',
                    desc: 'Direct payment to hospitals and pharmacies for life-saving surgeries, dialysis, cancer treatment, and medications.',
                    cat: 'Medical',
                  },
                  {
                    title: 'Daughter Marriage Support (Shagun Aid)',
                    titleHi: 'कन्या विवाह शगुन सहायता',
                    desc: 'Essential household items, ration, and marriage gift support to ensure respectful weddings for poor daughters.',
                    cat: 'Marriage',
                  },
                  {
                    title: 'Education & Orphan Support',
                    titleHi: 'शिक्षा व अनाथ छात्रवृत्ति',
                    desc: 'School fees, uniform, and books for orphan and underprivileged students to ensure uninterrupted learning.',
                    cat: 'Education',
                  },
                  {
                    title: 'Monthly Ration & Food Kits',
                    titleHi: 'मासिक राशन किट सहायता',
                    desc: 'Nutritious grocery kits (flour, rice, oil, pulses, spices) delivered to widow-led and destitute households.',
                    cat: 'Food',
                  },
                  {
                    title: '100% Shariah-Compliant Zakat Fund',
                    titleHi: 'शरिया सम्मत ज़कात वितरण',
                    desc: 'Dedicated Zakat collection given strictly to verified mustahiqeen as per authentic Shariah guidelines.',
                    cat: 'Zakat',
                  },
                ].map((scheme, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: theme.textHeading }}>
                      {scheme.title}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: C.gold, marginTop: 1 }}>
                      {scheme.titleHi}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 5, lineHeight: 17 }}>
                      {scheme.desc}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setIsSchemesModalOpen(false);
                          router.push({ pathname: '/(stacks)/donation', params: { initialCategory: scheme.cat } });
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: C.gold,
                          paddingVertical: 8,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 11 }}>
                          Donate to Scheme
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setIsSchemesModalOpen(false);
                          setSelectedCategory(scheme.cat);
                          router.push('/(tabs)/campaigns');
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                          paddingVertical: 8,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: theme.textHeading, fontWeight: '700', fontSize: 11 }}>
                          View Cases
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setIsSchemesModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 19. NEWS & UPDATES MODAL (Tile 5)                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isNewsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNewsModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Newspaper color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  News & Updates / समाचार
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsNewsModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {announcements.length === 0 ? (
                <View style={{ paddingVertical: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Newspaper size={36} color={C.gold} style={{ opacity: 0.6, marginBottom: 12 }} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textHeading, textAlign: 'center' }}>
                    No Active Announcements / कोई घोषणा नहीं
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 16 }}>
                    New trust announcements, verified field updates, and relief notices will appear here in real time.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginBottom: 16 }}>
                  {announcements.map((news, i) => (
                    <View
                      key={news.id || i}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        borderRadius: 16,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ backgroundColor: C.richGreen, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                          <Text style={{ color: C.white, fontSize: 9, fontWeight: '900' }}>
                            {news.communityName || (news.city ? `${news.city.toUpperCase()} UNIT` : 'MFCT TRUST')}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                          {news.sentAt ? new Date(news.sentAt).toLocaleDateString() : 'Recent'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: C.gold, marginBottom: 3 }}>
                        By {news.sentBy || 'Admin'}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: theme.textPrimary, lineHeight: 18 }}>
                        {news.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setIsNewsModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 20. CONTACT US MODAL (Tile 7)                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isContactModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsContactModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Phone color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  Contact Us / संपर्क करें
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsContactModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14 }}>
                Our team is available round the clock to answer your queries, coordinate case verification, or register urgent aid.
              </Text>

              <View style={{ gap: 10, marginBottom: 16 }}>
                {/* Helpline 1 */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('tel:+918218017226')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.goldBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Phone color={C.gold} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>
                      24/7 Emergency Support Desk 1
                    </Text>
                    <Text style={{ fontWeight: '900', color: theme.textHeading, fontSize: 15, marginTop: 1 }}>
                      +91 82180 17226
                    </Text>
                  </View>
                  <View style={{ backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: C.deepGreen, fontSize: 10, fontWeight: '900' }}>CALL</Text>
                  </View>
                </TouchableOpacity>

                {/* Helpline 2 */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('tel:+919756919430')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.goldBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Phone color={C.gold} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase' }}>
                      24/7 Support Desk 2
                    </Text>
                    <Text style={{ fontWeight: '900', color: theme.textHeading, fontSize: 15, marginTop: 1 }}>
                      +91 97569 19430
                    </Text>
                  </View>
                  <View style={{ backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: C.deepGreen, fontSize: 10, fontWeight: '900' }}>CALL</Text>
                  </View>
                </TouchableOpacity>

                {/* WhatsApp Support */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('https://wa.me/918218017226?text=Hello%20MFCT%20Team,%20I%20need%20assistance')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: '#25D366',
                  }}
                >
                  <MessageSquare color="#ffffff" size={20} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>
                      Connect via WhatsApp Support
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10 }}>
                      Instant response & verification guidance
                    </Text>
                  </View>
                  <ArrowRight color="#ffffff" size={16} />
                </TouchableOpacity>

                {/* Email Support */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL('mailto:info@mfcttrust.com')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '700' }}>Official Email Desk</Text>
                    <Text style={{ fontWeight: '800', color: theme.textHeading, fontSize: 13, marginTop: 2 }}>info@mfcttrust.com</Text>
                  </View>
                  <ArrowRight color={C.gold} size={16} />
                </TouchableOpacity>
              </View>

              {/* Direct Inquiry Form */}
              <View
                style={{
                  marginTop: 10,
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 18,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textHeading, marginBottom: 2 }}>
                  Direct Message / संदेश भेजें
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 12 }}>
                  Submit an inquiry, complaint, or aid request directly to our administrators.
                </Text>

                <TextInput
                  placeholder="Full Name / आपका नाम *"
                  placeholderTextColor={theme.textSecondary}
                  value={contactName}
                  onChangeText={setContactName}
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: theme.textPrimary,
                    marginBottom: 10,
                  }}
                />

                <TextInput
                  placeholder="Phone Number / फ़ोन नंबर *"
                  placeholderTextColor={theme.textSecondary}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: theme.textPrimary,
                    marginBottom: 10,
                  }}
                />

                <TextInput
                  placeholder="Email Address (Optional) / ईमेल"
                  placeholderTextColor={theme.textSecondary}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: theme.textPrimary,
                    marginBottom: 10,
                  }}
                />

                <TextInput
                  placeholder="Your Message or Assistance Needed / आपका संदेश *"
                  placeholderTextColor={theme.textSecondary}
                  value={contactMessage}
                  onChangeText={setContactMessage}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 13,
                    color: theme.textPrimary,
                    marginBottom: 12,
                    textAlignVertical: 'top',
                    minHeight: 70,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={submittingContact}
                  onPress={handleSendContactMessage}
                  style={{
                    backgroundColor: C.richGreen,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  {submittingContact ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <>
                      <Text style={{ color: C.white, fontWeight: '800', fontSize: 13, marginRight: 6 }}>
                        Send Message / संदेश भेजें
                      </Text>
                      <ArrowRight size={15} color={C.gold} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setIsContactModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 21. MORE OPTIONS BOTTOM SHEET MODAL (Tile 8)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isMoreModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMoreModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MoreHorizontal color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  More Services / और भी
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsMoreModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {[
                  {
                    title: 'Niyamawali (Trust Rules & By-Laws)',
                    titleHi: 'नियमावली एवं ट्रस्ट विधान',
                    icon: <FileText size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); router.push('/(tabs)/niyamawali'); },
                  },
                  {
                    title: 'Zakat Policy & Compliance',
                    titleHi: 'ज़कात नीति एवं शरिया प्रमाणन',
                    icon: <Scale size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); router.push('/(tabs)/zakat-compliance'); },
                  },
                  {
                    title: 'Zakat Calculator (2.5%)',
                    titleHi: 'मुफ़्त ज़कात कैलकुलेटर',
                    icon: <Calculator size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); setIsZakatModalOpen(true); },
                  },
                  {
                    title: 'Mohalla & District Communities',
                    titleHi: 'मोहल्ला एवं ज़िला समितियाँ',
                    icon: <Users size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); router.push('/(tabs)/community'); },
                  },
                  {
                    title: 'Impact Stories & Testimonials',
                    titleHi: 'सच्ची कहानियाँ एवं प्रभाव',
                    icon: <BookOpen size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); router.push('/(tabs)/impact-stories'); },
                  },
                  {
                    title: 'Privacy Policy & Data Security',
                    titleHi: 'गोपनीयता नीति एवं डेटा सुरक्षा',
                    icon: <ShieldCheck size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); setIsPrivacyModalOpen(true); },
                  },
                  {
                    title: 'Terms of Service & Rules',
                    titleHi: 'सेवा की शर्तें एवं नियम',
                    icon: <FileText size={18} color={C.gold} />,
                    onPress: () => { setIsMoreModalOpen(false); setIsTermsModalOpen(true); },
                  },

                ].map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    onPress={item.onPress}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.goldBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {item.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textHeading }}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 10.5, fontWeight: '600', color: C.gold, marginTop: 1 }}>
                        {item.titleHi}
                      </Text>
                    </View>
                    <ArrowRight color={theme.textSecondary} size={15} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => setIsMoreModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 22. PRIVACY POLICY MODAL                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isPrivacyModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldCheck color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  Privacy Policy / गोपनीयता नीति
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPrivacyModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14, marginBottom: 20 }}>
                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    1. Introduction / परिचय
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    Welcome to the MFCT Community Foundation. We respect your privacy and are committed to protecting your personal data in accordance with Indian regulations.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    2. Information We Collect / एकत्र की जाने वाली जानकारी
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    We collect donor and member details including Name, Phone, Email, and PAN details as required under Indian income tax regulations for 80G tax receipt issuance.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    3. How We Use Information / डेटा का उपयोग
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    • Processing donations and issuing 80G tax exemption certificates.{'\n'}
                    • Verifying community membership and emergency assistance eligibility.{'\n'}
                    • Publishing audited transparent expenditure reports.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    4. Data Security / सुरक्षा
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    We employ encrypted database protocols. We never sell or rent your personal information to any third party.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsPrivacyModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 23. TERMS OF SERVICE MODAL                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isTermsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTermsModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(9,31,21,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.cardBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileText color={C.gold} size={22} />
                <Text style={{ fontWeight: '900', fontSize: 16, color: theme.textHeading, marginLeft: 8 }}>
                  Terms of Service / सेवा की शर्तें
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTermsModalOpen(false)}
                style={{ padding: 6, borderRadius: 999, backgroundColor: isDark ? '#1a4230' : '#f1f5f9' }}
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14, marginBottom: 20 }}>
                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    1. Acceptance of Terms / शर्तों की स्वीकृति
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    By accessing or using the MFCT Community Mobile App, you agree to be bound by these Terms of Service and Trust By-Laws.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    2. Donations & 80G Tax Exemption / दान एवं कर छूट
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    All donations made via UPI or Bank Transfer are non-refundable once verified and credited. 80G receipts are generated digitally upon UTR confirmation.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    3. Shariah Wakalah Agreement / ज़कात वकालत अनुबंध
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    For all Zakat donations, the donor formally appoints MFCT as their Wakeel (agent) to identify verified Mustahiq (eligible) recipients according to Quranic Shariah criteria.
                  </Text>
                </View>

                <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: C.gold, marginBottom: 4 }}>
                    4. Member Code of Conduct / आचार संहिता
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18 }}>
                    Members and committee volunteers must maintain absolute transparency, respect beneficiary dignity, and adhere to the official Niyamawali.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsTermsModalOpen(false)}
                style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Close
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
