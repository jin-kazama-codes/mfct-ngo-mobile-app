import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import {
  ShieldCheck,
  CheckCircle,
  Building2,
  QrCode,
  Award,
  Copy,
  Check,
  Download,
  BadgeCheck,
  Lock,
  MapPin,
  RotateCw,
  Phone,
  ArrowLeft,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { copyToClipboard } from '../../../src/lib/clipboard';
import { useAppState } from '../../../src/context/AppStateProvider';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateRole,
  translateRoleResponsibility,
  translateCommunityName,
  translateCity,
  translateState,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';
import { downloadRegistrationPaymentSlipPdf } from '../../../src/services/receiptPdfService';

const CARD_WIDTH = 340;
const ngoLogo = require('../../../assets/images/ngo-logo.png');

// ─── Golden Smart Card EMV Chip Vector ─────────────────────────────────────────
const EmvChip = () => (
  <View
    style={{
      width: 38,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#997300',
      backgroundColor: '#d4af37',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Svg width="38" height="28" viewBox="0 0 44 32" fill="none">
      <Rect x="1" y="1" width="42" height="30" rx="3" stroke="#7a5c00" strokeWidth="1.5" />
      <Path d="M1 11 H16 V21 H1" stroke="#7a5c00" strokeWidth="1.2" />
      <Path d="M43 11 H28 V21 H43" stroke="#7a5c00" strokeWidth="1.2" />
      <Path d="M16 1 V11" stroke="#7a5c00" strokeWidth="1.2" />
      <Path d="M28 1 V11" stroke="#7a5c00" strokeWidth="1.2" />
      <Path d="M16 21 V31" stroke="#7a5c00" strokeWidth="1.2" />
      <Path d="M28 21 V31" stroke="#7a5c00" strokeWidth="1.2" />
      <Circle cx="22" cy="16" r="4.5" fill="#e6c86e" fillOpacity="0.6" stroke="#7a5c00" strokeWidth="1" />
    </Svg>
  </View>
);

// ─── Holographic Security Seal ────────────────────────────────────────────────
const HologramSeal = () => (
  <View
    style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#fcd34d',
      backgroundColor: '#071f14',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#fcd34d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      elevation: 4,
      overflow: 'hidden',
    }}
  >
    {/* Inner dashed gold decorative ring */}
    <View
      style={{
        position: 'absolute',
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: 'rgba(252, 211, 77, 0.45)',
        borderStyle: 'dashed',
      }}
      pointerEvents="none"
    />

    <ShieldCheck color="#fcd34d" size={15} />

    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 6.5,
          fontWeight: '900',
          color: '#fef08a',
          letterSpacing: 0.8,
          textAlign: 'center',
          lineHeight: 8,
          textTransform: 'uppercase',
        }}
      >
        MFCT
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 5,
          fontWeight: '800',
          color: '#fde68a',
          letterSpacing: 0.5,
          textAlign: 'center',
          lineHeight: 6.5,
          textTransform: 'uppercase',
          opacity: 0.95,
        }}
      >
        SECURE
      </Text>
    </View>
  </View>
);

// ─── Code 128 Realistic Barcode Vector ────────────────────────────────────────
const BarcodeVector = ({ code }: { code: string }) => {
  const bars = [1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 1, 4, 1, 2, 3, 2, 1, 1, 3, 2, 1, 4];
  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 32, overflow: 'hidden' }}>
        {bars.map((w, i) => (
          <View
            key={i}
            style={{
              width: w * 1.3,
              height: '100%',
              backgroundColor: '#09150f',
              marginHorizontal: 0.4,
              opacity: i % 7 === 0 ? 0.35 : 1,
            }}
          />
        ))}
      </View>
      <Text style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#1e293b' }}>
        *{code || 'MFCT-VERIFIED'}*
      </Text>
    </View>
  );
};

export default function MyIdCardScreen() {
  const { activeUser } = useAppState();
  const { colorScheme } = useColorScheme();
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const isDark = colorScheme === 'dark';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const memberId =
    activeUser?.membershipId ||
    (activeUser?.id
      ? `MFCT-${activeUser.id.slice(0, 8).toUpperCase()}`
      : 'N/A');
  const joinDate = activeUser?.joinDate || 'Active';
  const rawCommunity = activeUser?.communityName || 'MFCT Trust';
  const communityName = translateCommunityName(rawCommunity, lang);
  const cityName = translateCity(activeUser?.city || activeUser?.district || '', lang);
  const stateName = translateState(activeUser?.state || 'UP', lang);

  const role = activeUser?.role || activeUser?.districtRole || activeUser?.district_role || 'member';
  const roleTitle = useMemo(() => translateRole(role, lang as any), [role, lang]);
  const isDistrictOfficeBearer = Boolean(
    activeUser?.role?.startsWith('district_') ||
    activeUser?.districtRole ||
    activeUser?.district_role
  );

  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedMemberId, setCopiedMemberId] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(false);

  const copyMemberId = async () => {
    setCopiedMemberId(true);
    await copyToClipboard(memberId);
    Alert.alert(
      tr('सदस्य आईडी', 'ممبر آئی ڈی', 'Member ID'),
      `${memberId}\n\n${tr('आईडी कॉपी की गई', 'آئی ڈی کاپی ہو گئی', 'Copied')}`
    );
    setTimeout(() => {
      setCopiedMemberId(false);
    }, 2500);
  };

  const handleDownloadRegistrationSlip = async () => {
    if (!activeUser || downloadingSlip) return;
    try {
      setDownloadingSlip(true);
      await downloadRegistrationPaymentSlipPdf(activeUser);
    } catch (error) {
      console.error('Failed to create registration payment slip:', error);
      Alert.alert(
        tr('रसीद डाउनलोड नहीं हुई', 'رسید ڈاؤن لوڈ نہیں ہوئی', 'Could not download slip'),
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setDownloadingSlip(false);
    }
  };

  // Hardware back press listener on Android
  useEffect(() => {
    const handleHardwareBack = () => {
      // If viewing back side of ID card, flip back to front
      if (isFlipped) {
        setIsFlipped(false);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace('/(drawer)/dashboard');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => sub.remove();
  }, [isFlipped]);

  const handleGoBack = () => {
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(drawer)/dashboard');
    }
  };

  if (!activeUser) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#020617' : '#f8fafc', paddingHorizontal: 24 }}>
        <ShieldCheck color="#64748b" size={36} />
        <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 16, fontWeight: '600', color: isDark ? '#e2e8f0' : '#334155' }}>
          {tr('सदस्यता विवरण उपलब्ध नहीं है।', 'ممبرشپ کی تفصیلات دستیاب نہیں ہیں۔', 'Membership details are not available.')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Navigation Back Bar */}
      <View
        style={{
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignSelf: 'center',
          width: '100%',
          maxWidth: CARD_WIDTH + 36,
          paddingRight: 36,
        }}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 7,
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back to dashboard"
        >
          <ArrowLeft color={isDark ? '#e2e8f0' : '#334155'} size={15} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#e2e8f0' : '#334155' }}>
            {tr('वापस (Back)', 'واپس', 'Back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
          MFCT DIGITAL ID
        </Text>
      </View>

      {/* Page heading */}
      <View style={{ marginBottom: 20, alignItems: 'center' }}>
        <View
          style={{
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: isDark ? '#78350f' : '#fcd34d',
            backgroundColor: isDark ? 'rgba(69, 26, 3, 0.4)' : '#fefce8',
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <Award color="#b8860b" size={14} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#fde68a' : '#92400e' }}>
            {tr('मान्यता प्राप्त डिजिटल एनजीओ कार्ड', 'تصدیق شدہ ڈیجیٹل کارڈ', 'Official Verified NGO Credential')}
          </Text>
        </View>
        <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: isDark ? '#ffffff' : '#0f172a' }}>
          {tr('आधिकारिक डिजिटल सदस्यता पहचान पत्र', 'سرکاری ڈیجیٹل ممبرشپ شناختی کارڈ', 'Digital Membership Identity Card')}
        </Text>
        <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
          {tr('मोहम्मद फईम चैरिटेबल ट्रस्ट (MFCT) • केंद्रीय पहचान प्रणाली', 'محمد فہیم چیریٹیبل ٹرسٹ • مرکزی شناختی نظام', 'Mohammad Faeem Charitable Trust (MFCT) • Central Identification')}
        </Text>
      </View>

      {/* Card View Switcher Tabs (Front / Back / Flip) */}
      <View
        style={{
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignSelf: 'center',
          width: '100%',
          maxWidth: CARD_WIDTH + 36,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setIsFlipped(false)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: !isFlipped ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
            }}
          >
            <BadgeCheck color={!isFlipped ? '#059669' : '#64748b'} size={14} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: !isFlipped ? '700' : '500',
                color: !isFlipped ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              {tr('सामने (Front)', 'سامنے', 'Card Front')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFlipped(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: isFlipped ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
            }}
          >
            <Lock color={isFlipped ? '#059669' : '#64748b'} size={13} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: isFlipped ? '700' : '500',
                color: isFlipped ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
              }}
            >
              {tr('पीछे (Back)', 'پیچھے', 'Card Back')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setIsFlipped(prev => !prev)}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? '#b45309' : '#fcd34d',
            backgroundColor: isDark ? 'rgba(120, 53, 15, 0.3)' : '#fefce8',
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <RotateCw color="#b8860b" size={13} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: isDark ? '#fef08a' : '#92400e',
            }}
          >
            {tr('पलटें', 'پلٹیں', 'Flip 3D')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── FLIPPABLE MEMBERSHIP CARD CONTAINER ─── */}
      <TouchableOpacity
        activeOpacity={0.96}
        onPress={() => setIsFlipped(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel="Flip membership card"
        style={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: CARD_WIDTH + 36,
          overflow: 'hidden',
          borderRadius: 24,
          borderWidth: 2,
          borderColor: 'rgba(251, 191, 36, 0.8)',
          backgroundColor: '#071e13',
          padding: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Subtle decorative glow circles */}
        <View
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 176,
            height: 176,
            borderRadius: 88,
            borderWidth: 18,
            borderColor: 'rgba(252, 211, 77, 0.1)',
          }}
          pointerEvents="none"
        />
        <View
          style={{
            position: 'absolute',
            bottom: -64,
            left: -40,
            width: 192,
            height: 192,
            borderRadius: 96,
            borderWidth: 20,
            borderColor: 'rgba(110, 231, 183, 0.1)',
          }}
          pointerEvents="none"
        />

        {!isFlipped ? (
          /* ─────────────────────────────────────────────────────────────
             FRONT SIDE OF CARD
             ───────────────────────────────────────────────────────────── */
          <View>
            {/* Card header */}
            <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    height: 44,
                    width: 44,
                    borderRadius: 22,
                    borderWidth: 1.5,
                    borderColor: '#fcd34d',
                    backgroundColor: '#0a2318',
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                >
                  <Image
                    source={ngoLogo}
                    style={{ height: '100%', width: '100%' }}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#fde68a' }}>
                    MFCT Foundation
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.85)' }}>
                    {tr('सार्वजनिक चैरिटेबल ट्रस्ट', 'پبلک چیریٹیبل ٹرسٹ', 'Mohammad Faeem Charitable Trust')}
                  </Text>
                  <Text style={{ fontSize: 8, fontWeight: '500', color: 'rgba(203, 213, 225, 0.75)' }}>
                    Regd. Trust • NITI Aayog NGO Darpan
                  </Text>
                </View>
              </View>
              <HologramSeal />
            </View>

            <View style={{ marginBottom: 14, height: 1, backgroundColor: 'rgba(252, 211, 77, 0.3)' }} />

            {/* Member portrait & details */}
            <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'start', gap: 14 }}>
              {/* Photo Column */}
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: '#fcd34d',
                  padding: 4,
                  backgroundColor: '#062015',
                }}
              >
                {activeUser.avatar ? (
                  <Image
                    source={{ uri: activeUser.avatar }}
                    style={{ height: 96, width: 80, borderRadius: 12, backgroundColor: '#064e3b' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ height: 96, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#064e3b' }}>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#fde68a' }}>
                      {(activeUser.name || 'M').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ marginTop: 4, borderRadius: 6, backgroundColor: '#059669', paddingHorizontal: 4, paddingVertical: 2 }}>
                  <Text style={{ textAlign: 'center', fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#ffffff' }}>
                    ✓ VERIFIED
                  </Text>
                </View>
              </View>

              {/* Details Column */}
              <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                {/* EMV Chip & Active Badge */}
                <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <EmvChip />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(52, 211, 153, 0.1)', paddingHorizontal: 8, paddingVertical: 2 }}>
                    <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: '#34d399' }} />
                    <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: '#a7f3d0' }}>
                      ACTIVE
                    </Text>
                  </View>
                </View>

                {/* Member Name */}
                <DynamicText
                  text={activeUser.name || 'Member'}
                  style={{ fontSize: 17, fontWeight: '900', color: '#ffffff', letterSpacing: -0.3 }}
                  numberOfLines={2}
                />

                {/* Role Badge */}
                <View style={{ marginTop: 6, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)', backgroundColor: 'rgba(251, 191, 36, 0.15)', paddingHorizontal: 8, paddingVertical: 2 }}>
                  <ShieldCheck color="#fcd34d" size={13} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fef08a' }} numberOfLines={1}>
                    {roleTitle}
                  </Text>
                </View>

                {/* Community */}
                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Building2 color="#fbbf24" size={13} />
                  <DynamicText
                    text={communityName}
                    style={{ flex: 1, fontSize: 12, fontWeight: '500', color: 'rgba(254, 240, 138, 0.9)' }}
                    numberOfLines={1}
                  />
                </View>

                {/* Region / Location */}
                <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MapPin color="#fcd34d" size={12} />
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '500', color: 'rgba(203, 213, 225, 0.85)' }} numberOfLines={1}>
                    {cityName}{cityName ? ', ' : ''}{stateName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Credential footer */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(252, 211, 77, 0.25)', paddingTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.75)' }}>
                  {tr('सदस्य आईडी', 'ممبر آئی ڈی', 'Official Member ID')}
                </Text>
                <TouchableOpacity
                  onPress={copyMemberId}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(251, 191, 36, 0.3)',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Copy membership ID"
                >
                  <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, color: '#fcd34d' }}>
                    {memberId}
                  </Text>
                  {copiedMemberId ? (
                    <Check color="#34d399" size={14} />
                  ) : (
                    <Copy color="#fcd34d" size={14} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.75)' }}>
                  {tr('जारी तिथि', 'شمولیت', 'Member Since')}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '700', color: '#ffffff' }}>{joinDate}</Text>
              </View>
              <View style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.75)' }}>
                  {tr('वैधता', 'معیاد', 'Validity')}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '700', color: '#6ee7b7' }}>LIFETIME</Text>
              </View>
              <View style={{ borderRadius: 8, borderWidth: 1, borderColor: 'rgba(252, 211, 77, 0.6)', backgroundColor: '#ffffff', padding: 6 }}>
                <QrCode color="#064e3b" size={26} />
              </View>
            </View>
            <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(254, 243, 199, 0.5)' }}>
              Official membership credential • Keep this ID safe
            </Text>
          </View>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             BACK SIDE OF CARD
             ───────────────────────────────────────────────────────────── */
          <View>
            {/* Magnetic Stripe */}
            <View
              style={{
                marginHorizontal: -18,
                marginTop: -18,
                marginBottom: 12,
                height: 36,
                backgroundColor: '#020617',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(251, 191, 36, 0.3)',
              }}
            >
              <Text style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: 1.5, color: '#94a3b8', textTransform: 'uppercase' }}>
                MFCT-SECURE-ENCODED-IDENTITY-MAGNETIC-TRACK
              </Text>
            </View>

            {/* Barcode */}
            <View style={{ marginBottom: 12 }}>
              <BarcodeVector code={memberId} />
            </View>

            {/* Terms & Verification Conditions Box */}
            <View
              style={{
                marginBottom: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(252, 211, 77, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#fde68a', marginBottom: 4 }}>
                {tr('महत्वपूर्ण निर्देश एवं शर्तें:', 'اہم ہدایات و شرائط:', 'TERMS & VERIFICATION CONDITIONS:')}
              </Text>
              <Text style={{ fontSize: 9, lineHeight: 15, color: '#f1f5f9' }}>
                1. {tr('यह कार्ड मोहम्मद फईम चैरिटेबल ट्रस्ट की आधिकारिक संपत्ति है।', 'یہ کارڈ محمد فہیم چیریٹیبل ٹرسٹ کی ملکیت ہے۔', 'This credential remains property of Mohammad Faeem Charitable Trust.')}
              </Text>
              <Text style={{ fontSize: 9, lineHeight: 15, color: '#f1f5f9', marginTop: 3 }}>
                2. {tr('कार्ड खोने पर तुरंत हेल्पलाइन 98765-43210 पर सूचित करें।', 'کھو جانے کی صورت میں فوری ہیلپ لائن پر مطلع کریں۔', 'If found, please report to helpline or nearest MFCT office.')}
              </Text>
            </View>

            {/* Helpline & Authorized Signatory Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(252, 211, 77, 0.2)', paddingTop: 10 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Phone color="#fcd34d" size={11} />
                  <Text style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.85)', fontWeight: '700' }}>
                    {tr('केंद्रीय हेल्पलाइन', 'مرکزی ہیلپ لائن', 'Central Helpline')}
                  </Text>
                </View>
                <Text style={{ marginTop: 2, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: '#ffffff' }}>+91 98765 43210</Text>
                <Text style={{ fontSize: 9, color: '#cbd5e1' }}>www.mfct.org</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontStyle: 'italic', fontSize: 13, fontWeight: '700', color: '#fde68a' }}>
                  Mohammad Faeem
                </Text>
                <View style={{ marginVertical: 3, height: 1, width: 96, backgroundColor: 'rgba(251, 191, 36, 0.5)' }} />
                <Text style={{ fontSize: 7.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#cbd5e1' }}>
                  {tr('अधिकृत हस्ताक्षरकर्ता / ट्रस्टी', 'مجاز دستخط کنندہ / ٹرسٹی', 'Authorized Signatory / Trustee')}
                </Text>
              </View>
            </View>

            {/* Micro-stamp */}
            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(251, 191, 36, 0.15)', paddingTop: 8 }}>
              <Text style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 7, letterSpacing: 0.8, color: 'rgba(253, 230, 138, 0.6)', textTransform: 'uppercase' }}>
                Trust Act Reg: MFCT/UP/2024 • 80G & 12A Certified • NGO Darpan: UP/2024/0412891
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Flip hint */}
      <Text style={{ marginTop: 10, textAlign: 'center', fontSize: 11, fontWeight: '500', color: isDark ? '#94a3b8' : '#64748b' }}>
        💡 {tr('कार्ड को पलटने के लिए उस पर टैप करें अथवा ऊपर "पलटें" बटन दबाएं', 'کارڈ پر ٹیپ کر کے یا فلپ بٹن دبا کر دونوں رخ دیکھیں', 'Tap on card or use "Flip 3D" to toggle Front & Back')}
      </Text>

      {/* Copy Member ID action */}
      <View style={{ marginTop: 16, alignSelf: 'center', maxWidth: CARD_WIDTH + 36, width: '100%' }}>
        <TouchableOpacity
          onPress={copyMemberId}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel="Copy membership ID"
        >
          {copiedMemberId ? (
            <Check color="#059669" size={16} />
          ) : (
            <Copy color="#64748b" size={16} />
          )}
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: isDark ? '#e2e8f0' : '#334155',
            }}
            numberOfLines={1}
          >
            {copiedMemberId
              ? tr('आईडी कॉपी हो गई!', 'آئی ڈی کاپی ہو گئی!', 'ID Copied!')
              : tr('आईडी कॉपी करें', 'آئی ڈی کاپی करें', 'Copy Member ID')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Registration payment receipt */}
      {activeUser.status === 'approved' && activeUser.paymentUtr && (
        <View
          style={{
            marginTop: 18,
            alignSelf: 'center',
            width: '100%',
            maxWidth: 456,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? '#064e3b' : '#a7f3d0',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            padding: 16,
          }}
        >
          <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckCircle color="#059669" size={18} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
              {tr('पंजीकरण भुगतान रसीद', 'رجسٹریشن ادائیگی کی رسید', 'Registration Payment Slip')}
            </Text>
          </View>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: isDark ? '#94a3b8' : '#64748b' }}>
            {tr(
              'आपकी ₹100 सदस्यता पंजीकरण राशि दर्ज है।',
              'آپ کی ₹100 رکنیت رجسٹریشن فیس درج ہے۔',
              'Your ₹100 membership registration payment is recorded.'
            )}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '600', color: isDark ? '#cbd5e1' : '#475569' }}>
            UTR: {activeUser.paymentUtr}
          </Text>
          <TouchableOpacity
            onPress={handleDownloadRegistrationSlip}
            disabled={downloadingSlip}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderRadius: 12,
              backgroundColor: '#065f46',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
          >
            {downloadingSlip ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Download color="#ffffff" size={16} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff', textAlign: 'center' }} numberOfLines={1}>
              {downloadingSlip
                ? tr('डाउनलोड हो रहा है...', 'ڈاؤن لوڈ ہو رہا ہے...', 'Downloading...')
                : tr('रसीद डाउनलोड करें', 'رسید ڈاؤن لوڈ کریں', 'Download Receipt')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Assigned responsibilities */}
      {isDistrictOfficeBearer && (
        <View
          style={{
            marginTop: 16,
            alignSelf: 'center',
            width: '100%',
            maxWidth: 456,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? '#78350f' : '#fde68a',
            backgroundColor: isDark ? 'rgba(69, 26, 3, 0.35)' : '#fefce8',
            padding: 16,
          }}
        >
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck color="#d97706" size={18} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, color: isDark ? '#fde68a' : '#78350f' }}>
              {tr('आधिकारिक पद एवं दायित्व', 'سرکاری عہدہ اور ذمہ داری', 'Official Designation & Responsibility')}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{roleTitle}</Text>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: isDark ? '#fef3c7' : '#78350f' }}>
            {translateRoleResponsibility(role, lang)}
          </Text>
        </View>
      )}

      {/* Verification information */}
      <View
        style={{
          marginTop: 16,
          alignSelf: 'center',
          width: '100%',
          maxWidth: 456,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          padding: 16,
        }}
      >
        <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck color="#059669" size={18} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
            {tr('पहचान सत्यापन', 'شناختی تصدیق', 'Identity Verification')}
          </Text>
        </View>
        <Text style={{ fontSize: 12, lineHeight: 18, color: isDark ? '#94a3b8' : '#64748b' }}>
          {tr(
            'यह डिजिटल पहचान पत्र मोहम्मद फईम चैरिटेबल ट्रस्ट (MFCT) के साथ आपकी सदस्यता की पुष्टि करता है। सत्यापन के लिए सामुदायिक कार्यक्रमों और बैठकों के दौरान अपने सदस्यता विवरण प्रस्तुत करें।',
            'یہ ڈیجیٹل شناختی کارڈ محمد فہیم چیریٹیبل ٹرسٹ کے ساتھ آپ کی رکنیت کی تصدیق کرتا ہے۔ کمیونٹی پروگراموں کے دوران تصدیق کے لیے پیش کریں۔',
            'This digital identity card confirms your membership with Mohammad Faeem Charitable Trust (MFCT). Present your membership details during community events and meetings for verification.'
          )}
        </Text>
      </View>
    </ScrollView>
  );
}
