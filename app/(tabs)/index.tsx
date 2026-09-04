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
import { useAppState } from '../../src/context/AppStateProvider';
import { AboutUs } from '../../src/components/AboutUs';
import { getCampaigns, getEmergencyCampaigns } from '../../src/services/campaignService';
import { getTestimonials } from '../../src/services/testimonialService';
import { getCommunityStories } from '../../src/services/storiesService';
import { getRecentDonations } from '../../src/services/donationService';
import { getCommunities } from '../../src/services/communityService';
import { getUsers } from '../../src/services/userService';
import { getAccountDetails } from '../../src/services/adminService';
import {
  Campaign,
  Testimonial,
  CommunityStory,
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
  translateRole,
  translateQuote,
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
} from 'lucide-react-native';

// ─── Local Assets ──────────────────────────────────────────────────────────
const aboutMfctImage = require('../../assets/images/about-mfct.jpeg');
const medicalAidImage = require('../../assets/images/medical-aid.jpeg');
const educationImage = require('../../assets/images/education-books.jpeg');
const marriageImage = require('../../assets/images/marriage-support.jpeg');
const janazahImage = require('../../assets/images/zanaza.jpeg');
const foodImage = require('../../assets/images/food-ration.jpeg');
const zakatImage = require('../../assets/images/zakat-eligiable.jpeg');

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
  const { isAuthenticated, activeUser } = useAppState();
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
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [realTotalMembers, setRealTotalMembers] = useState(0);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

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
      contentContainerStyle={{ width: '100%' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.gold]} />}
    >
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO SECTION                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ backgroundColor: C.darkGreen, overflow: 'hidden', width: '100%' }}>
        {/* Hero Background Image */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=70' }}
          style={{ minHeight: 380, width: '100%' }}
          resizeMode="cover"
        >
          {/* Cinematic Gradient Overlay */}
          <View
            style={{
              position: 'absolute',
              inset: 0,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(8,24,16,0.88)',
            }}
          />

          {/* Hero Content */}
          <View style={{ paddingHorizontal: 16, paddingTop: 48, paddingBottom: 28, width: '100%' }}>
            {/* Tagline Badge */}
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(26,60,44,0.9)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.4)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 999,
                marginBottom: 14,
              }}
            >
              <ArrowRight size={12} color={C.gold} style={{ marginRight: 5 }} />
              <Text style={{ color: C.gold, fontWeight: '800', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {t('home.hero_tagline', 'Together for a Better Tomorrow')}
              </Text>
            </View>

            {/* Main Headline */}
            <Text style={{ fontSize: 32, fontWeight: '900', color: C.white, lineHeight: 38, marginBottom: 10, letterSpacing: -0.5 }}>
              {t('home.hero_line1', 'Yaad Unki,')}{' '}
              <Text style={{ color: C.gold }}>{t('home.hero_line2_giving', 'Seva Hamari')}</Text>
            </Text>

            {/* Description */}
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 18 }}>
              {t('home.hero_desc', '100% verified direct relief for hospital care, orphan education, dignified nikah support, janazah burial services, and ration kits.')}
            </Text>

            {/* Trust Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {[
                { icon: <ShieldCheck size={12} color={C.gold} />, label: t('home.trust_zakat', 'Zakat Compliant') },
                { icon: <CheckCircle2 size={12} color={C.gold} />, label: t('home.trust_verified', 'UTR Verified') },
                { icon: <Building2 size={12} color={C.gold} />, label: t('home.trust_registered', 'Govt. Registered NGO') },
              ].map(({ icon, label }) => (
                <View
                  key={label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: C.goldBg,
                    borderWidth: 1,
                    borderColor: C.goldBorder,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  {icon}
                  <Text style={{ color: C.white, fontSize: 10, fontWeight: '600', marginLeft: 4 }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* CTA Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 24, width: '100%' }}>
              {/* Become a Member */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/sign-up')}
                style={{
                  flex: 1.15,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: 'rgba(200,168,75,0.6)',
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <UserPlus size={12} color={C.white} style={{ flexShrink: 0 }} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                  style={{
                    flexShrink: 1,
                    color: C.white,
                    fontWeight: '800',
                    fontSize: 10.5,
                    marginLeft: 3,
                    marginRight: 2,
                  }}
                >
                  {t('home.become_member', 'Become a Member')}
                </Text>
                <View
                  style={{
                    backgroundColor: C.goldBg,
                    paddingHorizontal: 3.5,
                    paddingVertical: 1,
                    borderRadius: 4,
                    flexShrink: 0,
                    borderWidth: 0.5,
                    borderColor: 'rgba(200,168,75,0.3)',
                  }}
                >
                  <Text style={{ color: C.gold, fontSize: 8, fontWeight: '800' }}>₹100</Text>
                </View>
              </TouchableOpacity>

              {/* Donate Now (Gold) */}
              <TouchableOpacity
                onPress={() => router.push('/(stacks)/donation')}
                style={{
                  flex: 0.92,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: C.gold,
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  shadowColor: C.gold,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                  overflow: 'hidden',
                }}
              >
                <Heart size={12} color={C.deepGreen} fill={C.deepGreen} style={{ flexShrink: 0 }} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                  style={{
                    flexShrink: 1,
                    color: C.deepGreen,
                    fontWeight: '800',
                    fontSize: 10.5,
                    marginLeft: 3,
                  }}
                >
                  {t('home.donate_now', 'Donate Now')}
                </Text>
              </TouchableOpacity>

              {/* Zakat Calculator */}
              <TouchableOpacity
                onPress={() => setIsZakatModalOpen(true)}
                style={{
                  flex: 0.93,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: C.midGreen,
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.3)',
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <Calculator size={12} color={C.gold} style={{ flexShrink: 0 }} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  ellipsizeMode="tail"
                  style={{
                    flexShrink: 1,
                    color: C.white,
                    fontWeight: '800',
                    fontSize: 10.5,
                    marginLeft: 3,
                  }}
                >
                  {t('home.zakat_calc', 'Zakat Calculator')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Stats – 3 Cards */}
            <View style={{ flexDirection: 'row', gap: 6, width: '100%' }}>
              {/* Members */}
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? theme.cardBorder : 'rgba(200,168,75,0.3)',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.25 : 0.15,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                {loading ? (
                  <View style={{ width: 40, height: 22, backgroundColor: theme.progressTrack, borderRadius: 4, marginBottom: 4 }} />
                ) : (
                  <Text style={{ fontSize: 17, fontWeight: '900', color: theme.accentGreen, lineHeight: 22 }} numberOfLines={1} adjustsFontSizeToFit>
                    {totalMembers > 0 ? totalMembers.toLocaleString('en-IN') : '0'}+
                  </Text>
                )}
                <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textSecondary, lineHeight: 12 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {t('home.verified_members', 'Verified Members')}
                </Text>
              </View>

              {/* Relief Disbursed */}
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: C.richGreen,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: C.midGreen,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                {loading ? (
                  <View style={{ width: 48, height: 22, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 4 }} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '900', color: C.white, lineHeight: 22 }} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{totalRaised > 0 ? totalRaised.toLocaleString('en-IN') : '0'}+
                  </Text>
                )}
                <Text style={{ fontSize: 9, fontWeight: '600', color: C.gold, lineHeight: 12 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {t('home.funds_disbursed', 'Relief Disbursed')}
                </Text>
              </View>

              {/* Audit Receipts */}
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: theme.cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? theme.cardBorder : 'rgba(200,168,75,0.3)',
                  shadowColor: '#000',
                  shadowOpacity: isDark ? 0.25 : 0.15,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '900', color: theme.accentGreen, lineHeight: 22 }} numberOfLines={1} adjustsFontSizeToFit>
                  100%
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textSecondary, lineHeight: 12 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {t('home.audit_receipts', 'Audit Receipts')}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. UPI DONATION WIDGET                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
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
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Live dot */}
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

          {/* QR + UPI ID */}
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
              {/* App labels */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. OUR MISSION – 4 PILLARS                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 28 }}>
        <SectionHeader
          tag={t('home.mission_tag', 'OUR MISSION')}
          title={t('home.mission_title', 'Our Mission')}
          desc={t('home.mission_desc', 'Our goal is to deliver aid, support, and selfless service to every section of society.')}
        />
        {/* Row 1 */}
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
        {/* Row 2 */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. ABOUT MFCT BANNER                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
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
          {/* About Image from local asset */}
          <Image
            source={aboutMfctImage}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
          {/* Content */}
          <View style={{ padding: 20 }}>
            <Text style={{ color: C.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              {t('home.about_tag', 'ABOUT MFCT')}
            </Text>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '900', marginBottom: 10, lineHeight: 24 }}>
              {t('home.about_title', 'Mohammad Faeem Charitable Trust')}
            </Text>
            {/* Gold divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 32, height: 2, backgroundColor: C.gold }} />
              <Heart size={10} color={C.gold} fill={C.gold} style={{ marginHorizontal: 6 }} />
              <ArrowRight size={10} color={C.gold} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
              {t('home.about_desc', 'MFCT was established to strengthen brotherhood, unity, and humanity across society. Through education, health, emergency bereavement aid, daughter marriage support, medical assistance, disaster relief, and welfare programs, we are dedicated to reaching every section of society.')}
            </Text>

            {/* Impact Stats Grid */}
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

            {/* Read More Button */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. OUR PROGRAMS / DONATION CATEGORIES                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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
                {/* Image & Icon Header */}
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

                {/* Card Text Content */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. YOUR COMMUNITY CAMPAIGNS (LOGGED IN)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isAuthenticated && activeUser && myCommunityCampaigns.length > 0 && (
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
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 7. ZAKAT CALCULATOR HIGHLIGHT BANNER                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
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
          {/* Badge */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 8. FEATURED CAMPAIGNS WITH CATEGORY FILTER                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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

        {/* Filter Pills */}
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

        {/* Campaigns List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : filteredCampaigns.length > 0 ? (
          <View style={{ gap: 14 }}>
            {filteredCampaigns.slice(0, 6).map((camp) => {
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
                    {/* Badges */}
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
                    {/* Category + days */}
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

                    {/* Progress bar */}
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

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? theme.cardBorder : '#f1f5f9' }}>
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(stacks)/donation', params: { campaignId: camp.id, initialCategory: camp.category } })}
                        style={{ flex: 1, backgroundColor: C.gold, paddingVertical: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
                      >
                        <Heart color={C.deepGreen} size={14} fill={C.deepGreen} />
                        <Text style={{ color: C.deepGreen, fontWeight: '800', fontSize: 12, marginLeft: 6 }}>{t('home.donate_now', 'Donate Now')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleShareCampaign(camp)}
                        style={{ padding: 11, borderRadius: 12, backgroundColor: theme.innerCardBg, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Share2 color={theme.textSecondary} size={16} />
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 9. MEMBERSHIP BANNER                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
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
            {/* Overlay */}
            <View style={{ backgroundColor: 'rgba(9,31,21,0.93)', padding: 22 }}>
              {/* Badge */}
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

              {/* Benefits */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 10. HOW IT WORKS (4 STEPS)                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 11. IMPACT COUNTERS                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}>
        {/* Life Impact */}
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

        {/* Members */}
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

        {/* Communities */}
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 12. FAQ ACCORDION                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13. RECENT DONATIONS LIVE FEED                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13. TESTIMONIALS                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View
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
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 13.5 ABOUT US & FOUNDERS' MESSAGE                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AboutUs />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 14. 24/7 HELPLINE & SUPPORT (Clean, Readable Design)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 36, paddingTop: 28, backgroundColor: theme.screenBg, borderTopWidth: 1, borderTopColor: theme.cardBorder }}>
        <SectionHeader
          tag={t('home.contact_tag', '24/7 Helpline & Support')}
          title={t('home.contact_title', 'Emergency & Support Helpline')}
          desc={t('home.contact_desc', 'Our team and grassroots volunteers are available 24/7 for immediate assistance.')}
        />

        {/* Emergency Helpline Cards */}
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

          {/* Helpline 1 */}
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

          {/* Helpline 2 */}
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

          {/* WhatsApp / Email Quick Row */}
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

        {/* Registered Trust Information Footer */}
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
      </View>

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
    </ScrollView>
  );
}
