import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  Sparkles,
  ShieldCheck,
  Heart,
  HeartHandshake,
  Scale,
  Building2,
  FileCheck,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Phone,
  Share2,
  Lock,
  UserPlus,
  ArrowRight,
  BookOpen,
  Layers,
  MessageCircle,
  PhoneCall,
  Clock,
  Ban,
  Award,
  Users,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react-native';

// ─── Theme Colors ──────────────────────────────────────────────────────────
const C = {
  darkGreen: '#091f15',
  midGreen: '#0e2a1d',
  deepGreen: '#0a2e1d',
  richGreen: '#1a4230',
  emeraldDark: '#064e3b',
  gold: '#c8a84b',
  goldLight: '#f5d77f',
  goldBg: 'rgba(200,168,75,0.12)',
  goldBorder: 'rgba(200,168,75,0.35)',
  goldDark: '#a0832e',
  white: '#ffffff',
  offWhite: '#f8faf9',
  border: 'rgba(26,60,44,0.12)',
  borderDark: 'rgba(255,255,255,0.12)',
  textMuted: '#6b7280',
  textMutedDark: '#94a3b8',
};

export default function ZakatComplianceScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'all' | 'principles' | 'undertakings' | 'accounting' | 'hadith'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isHi = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi');

  const categories = [
    { id: 'all', labelHi: 'सभी (All)', labelEn: 'All Sections' },
    { id: 'principles', labelHi: 'शरीअत सिद्धांत', labelEn: 'Shariah Principles' },
    { id: 'undertakings', labelHi: 'फॉर्म व डिक्लेरेशन', labelEn: 'Forms & Undertakings' },
    { id: 'accounting', labelHi: 'लेखा व फंड पृथक्करण', labelEn: 'Accounting & Ledgers' },
    { id: 'hadith', labelHi: 'हदीस संदर्भ', labelEn: 'Hadith References' },
  ];

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'MFCT Zakat and Sadaqah Compliance Policy',
        message:
          'MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)\n' +
          (isHi
            ? 'ज़कात, सदक़ा-ए-फ़ित्र एवं सदक़ात/दान संग्रह एवं वितरण नीति (Reg. No. 301/2026 & 258/2026)'
            : 'Zakat, Sadaqah-e-Fitr & Sadaqah Collection & Distribution Policy') +
          '\nhttps://www.mfcttrust.com/zakat-compliance',
      });
    } catch {}
  };

  const handleCall = () => {
    Linking.openURL('tel:+918218017226');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/918218017226');
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: isDark ? '#04120b' : '#f8faf9',
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Luxury Hero Header ── */}
      <View
        style={{
          backgroundColor: C.deepGreen,
          paddingTop: 24,
          paddingBottom: 28,
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: C.gold,
        }}
      >
        {/* Trust Badge */}
        <View
          style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: 'rgba(200,168,75,0.15)',
            borderWidth: 1,
            borderColor: C.gold,
            marginBottom: 10,
          }}
        >
          <Sparkles size={12} color={C.goldLight} />
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: '900',
              color: C.goldLight,
              letterSpacing: 0.8,
            }}
          >
            MOHAMMAD FAEEM CHARITABLE TRUST
          </Text>
        </View>

        {/* Tagline */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: '900',
            color: C.goldLight,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {isHi ? '“याद उनकी, सेवा हमारी”' : '“In Their Memory, In Our Service”'}
        </Text>

        {/* Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: '900',
            color: C.white,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
          }}
        >
          {isHi
            ? 'ज़कात, सदक़ा-ए-फ़ित्र एवं सदक़ात/दान संग्रह एवं वितरण नीति'
            : 'Zakat, Sadaqah-e-Fitr & Sadaqah Collection Policy'}
        </Text>

        {/* Reg. No. */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.goldLight }}>
              Reg. No.: 301/2026 &amp; 258/2026
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            color: '#cbd5e1',
            textAlign: 'center',
            lineHeight: 16,
            marginBottom: 16,
          }}
        >
          {isHi
            ? 'सहीह बुखारी व मुस्लिम की प्रामाणिक हदीसों पर आधारित—MFCT को ज़कात का वकील/अमीन नियुक्त करने, पारदर्शी लेखा-जोखा और पृथक फंड प्रबंधन की आधिकारिक नियमावली।'
            : 'Anchored in authentic Prophetic Hadiths (Sahih al-Bukhari & Muslim)—The regulatory framework for Wakalah agency, segregated ledgers, and Shariah-compliant disbursement.'}
        </Text>

        {/* 4 Quick Stat Highlights */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              padding: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.25)',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight }}>
              {isHi ? 'ज़कात फंड' : 'Zakat Fund'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: C.white, marginTop: 2 }}>
              {isHi ? '100% शरीअती मद' : '100% Shariah'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 1 }}>
              {isHi ? 'केवल मुस्तहिक़ीन तक' : 'Eligible Only'}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: '47%',
              padding: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.25)',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight }}>
              {isHi ? 'वकील / अमीन' : 'Wakalah Agency'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: C.white, marginTop: 2 }}>
              {isHi ? 'अमानत का सिद्धांत' : 'Trustee Agency'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 1 }}>
              {isHi ? 'लिखित सहमति पत्र' : 'Signed Undertaking'}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: '47%',
              padding: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.25)',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight }}>
              {isHi ? 'फंड पृथक्करण' : '4 Ledgers'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: C.white, marginTop: 2 }}>
              {isHi ? 'शून्य क्रॉस-मिक्सिंग' : 'Zero Inter-Mixing'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 1 }}>
              {isHi ? 'Zakat, Fitra, Sadaqah, Gen' : '4 Independent Funds'}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: '47%',
              padding: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(200,168,75,0.25)',
            }}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight }}>
              {isHi ? 'प्रशासनिक खर्च' : 'Overheads'}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: C.white, marginTop: 2 }}>
              {isHi ? '0% ज़कात से व्यय' : '0% Zakat on Overhead'}
            </Text>
            <Text style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 1 }}>
              {isHi ? 'ट्रस्टी/ऑफिस/प्रचार शून्य' : 'No Trustees / Rent / Ads'}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Share & Call */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            onPress={handleShare}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              paddingVertical: 9,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Share2 size={13} color={C.white} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.white }}>
              {isHi ? 'शेयर करें (Share)' : 'Share Policy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            style={{
              flex: 1,
              backgroundColor: '#10b981',
              paddingVertical: 9,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <PhoneCall size={13} color={C.white} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.white }}>
              +91 82180 17226
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Search & Filter Bar ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 14, gap: 10 }}>
        {/* Search Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#0f261b' : '#ffffff',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(200,168,75,0.3)' : '#e2e8f0',
            paddingHorizontal: 12,
            paddingVertical: Platform.OS === 'ios' ? 8 : 4,
          }}
        >
          <Search size={15} color={C.gold} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isHi
                ? 'खोजें (उदा. 1395, वकील, आमिल, Undertaking, बरीरा)...'
                : 'Search policy (e.g. 1395, Wakalah, Amil, Ledger)...'
            }
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            style={{
              flex: 1,
              fontSize: 11.5,
              color: isDark ? C.white : '#1e293b',
              paddingLeft: 8,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isSelected
                    ? C.deepGreen
                    : isDark
                    ? '#0e2a1d'
                    : '#e2e8f0',
                  borderWidth: 1,
                  borderColor: isSelected ? C.gold : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: '800',
                    color: isSelected ? C.goldLight : isDark ? '#94a3b8' : '#334155',
                  }}
                >
                  {isHi ? cat.labelHi : cat.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 3. Content Sections ── */}
      <View style={{ paddingHorizontal: 14, paddingTop: 14, gap: 14 }}>

        {/* ══════════════════════════════════════════════════════════════
            PART A : मूल शरीअती सिद्धांत
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'principles') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#10b981' }}>
                  {isHi ? 'भाग–A : मूल शरीअती सिद्धांत' : 'Part A: Core Shariah Principles'}
                </Text>
              </View>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: '600' }}>A.1 &amp; A.2</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              {isHi ? 'मूल शरीअती सिद्धांत एवं MFCT की भूमिका' : 'Core Shariah Principles & The Role of MFCT'}
            </Text>

            {/* A.1 Purpose */}
            <View style={{ backgroundColor: isDark ? '#081a10' : '#f8faf9', padding: 12, borderRadius: 12, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? C.goldLight : C.deepGreen }}>
                1. {isHi ? 'ज़कात का उद्देश्य (Purpose of Zakat)' : 'Purpose of Zakat'}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 16 }}>
                {isHi
                  ? 'MFCT द्वारा प्राप्त ज़कात की राशि केवल उन व्यक्तियों/मदों तक पहुँचाई जाएगी जो शरीअत के अनुसार ज़कात के हकदार हों।'
                  : 'All Zakat funds received by MFCT shall be disbursed exclusively to individuals and categories entitled to Zakat under Islamic Shariah.'}
              </Text>

              {/* Hadith Quote */}
              <View
                style={{
                  backgroundColor: 'rgba(200,168,75,0.12)',
                  borderLeftWidth: 3,
                  borderLeftColor: C.gold,
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight, marginBottom: 2 }}>
                  📖 {isHi ? 'सहीह अल-बुखारी 1395' : 'Sahih al-Bukhari 1395'}
                </Text>
                <Text style={{ fontSize: 10.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  {isHi
                    ? 'नबी ﷺ ने हज़रत मुआज़ رضي الله عنه को यमन भेजते हुए फरमाया: “यह उनके मालदारों से ली जाएगी और उनके गरीबों को दी जाएगी।”'
                    : 'The Prophet ﷺ instructed Hazrat Mu’adh رضي الله عنه: “It shall be taken from their wealthy and given to their poor.”'}
                </Text>
              </View>

              <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981', marginTop: 4 }}>
                {isHi
                  ? '⚠️ इसलिए MFCT की सामान्य सामाजिक गतिविधियों और ज़कात फंड को एक ही अर्थ में नहीं माना जाएगा।'
                  : '⚠️ Therefore, MFCT’s general social activities and Zakat Fund are strictly segregated.'}
              </Text>
            </View>

            {/* A.2 Role of MFCT */}
            <View style={{ backgroundColor: isDark ? '#081a10' : '#f8faf9', padding: 12, borderRadius: 12, gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? C.goldLight : C.deepGreen }}>
                2. {isHi ? 'MFCT की भूमिका (वकील / अमीन व्यवस्था)' : 'Role of MFCT (Wakīl / Amīn Agency)'}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 16 }}>
                {isHi
                  ? 'ज़कात देने वाला व्यक्ति MFCT को अपनी ज़कात का वकील/अमीन नियुक्त कर सकता है, ताकि MFCT उसकी ओर से ज़कात की रकम को योग्य लाभार्थी तक पहुँचाए।'
                  : 'A Zakat donor appoints MFCT as their authorized Wakīl/Amīn (agent/trustee) to deliver the Zakat amount to Shariah-verified beneficiaries on their behalf.'}
              </Text>

              <View
                style={{
                  backgroundColor: 'rgba(200,168,75,0.12)',
                  borderLeftWidth: 3,
                  borderLeftColor: C.gold,
                  padding: 8,
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight, marginBottom: 2 }}>
                  📖 {isHi ? 'सहीह अल-बुखारी 1500' : 'Sahih al-Bukhari 1500'}
                </Text>
                <Text style={{ fontSize: 10.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  {isHi
                    ? 'नबी ﷺ ने ज़कात संग्रह के लिए कर्मचारी नियुक्त किए थे। हज़रत इब्न अल-लुत्बिया को ज़कात संग्रह का कार्य दिया गया और वापस आने पर उनका हिसाब लिया गया।'
                    : 'The Prophet ﷺ appointed personnel for Zakat collection (Hazrat Ibn al-Lutbiyyah) and audited their accounts upon return.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART B : ज़कात के लिए MFCT Undertaking
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'undertakings') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'rgba(200,168,75,0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
                  {isHi ? 'भाग–B : ज़कात Undertaking' : 'Part B: Zakat Undertaking'}
                </Text>
              </View>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: '600' }}>10 Clauses</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              ZAKAT AUTHORISATION &amp; WAKALAH UNDERTAKING
            </Text>

            {/* Simulated Donor Fields Box */}
            <View
              style={{
                backgroundColor: isDark ? '#081a10' : '#fdfbf7',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.3)',
                borderRadius: 12,
                padding: 12,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight, textTransform: 'uppercase' }}>
                {isHi ? 'दाता विवरण एवं घोषणा पत्र' : 'Donor Authorization Details'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• नाम: ________________________' : '• Name: ________________________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• पिता/पति: ____________________' : '• Father/Husband: ________________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• मोबाइल: _____________________' : '• Mobile: _____________________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• राशि: ₹______________________' : '• Amount: ₹_____________________'}
              </Text>
            </View>

            {/* 10 Clauses Accordion/List */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? C.goldLight : C.deepGreen, marginTop: 4 }}>
              {isHi ? 'दाता द्वारा स्वीकृत 10 अनिवार्य नियम:' : '10 Mandatory Undertaking Clauses:'}
            </Text>

            {[
              { num: '1', hi: 'यह राशि सामान्य unrestricted donation नहीं है।', en: 'This sum is not an unrestricted donation.' },
              { num: '2', hi: 'MFCT इसे व्यक्तिगत या व्यावसायिक संपत्ति के रूप में उपयोग नहीं करेगा।', en: 'MFCT shall never use this as personal/business asset.' },
              { num: '3', hi: 'राशि का उपयोग केवल शरीअत के अनुसार योग्य ज़कात लाभार्थियों के लिए होगा।', en: 'Disbursement strictly to Shariah-verified recipients.' },
              { num: '4', hi: 'MFCT लाभार्थी की पात्रता की निष्पक्ष जाँच कर सकता है।', en: 'MFCT reserves the right to verify beneficiary eligibility.' },
              { num: '5', hi: 'आवश्यकता होने पर पहचान व आर्थिक स्थिति के दस्तावेज माँगे जा सकते हैं।', en: 'KYC & economic verification documents may be demanded.' },
              { num: '6', hi: 'MFCT ज़कात फंड का अलग रिकॉर्ड/लेखा (Dedicated Ledger) रखेगा।', en: 'A separate, dedicated ledger shall be maintained.' },
              { num: '7', hi: 'MFCT को किसी उपयुक्त पात्र व्यक्ति तक ज़कात पहुँचाने का पूर्ण अधिकार होगा।', en: 'MFCT is delegated authority to select deserving beneficiaries.' },
              { num: '8', hi: 'केवल “गरीब दिखने” पर ज़कात नहीं दी जाएगी; ठोस जाँच आवश्यक होगी।', en: 'No aid merely on appearances; verified need is compulsory.' },
              { num: '9', hi: 'अपात्र पाए जाने पर किसी व्यक्ति को ज़कात फंड से भुगतान नहीं होगा।', en: 'Ineligible individuals will receive zero Zakat funds.' },
              { num: '10', hi: 'प्रशासनिक/प्रचार में ज़कात व्यय पूर्णतः वर्जित है (बिना मुफ़्ती की लिखित राय के)।', en: 'Zero Zakat on admin/publicity unless authorized by written fatwa.' },
            ].map((item) => (
              <View
                key={item.num}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: isDark ? '#081a10' : '#f8faf9',
                  padding: 8,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: C.deepGreen,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '900', color: C.goldLight }}>{item.num}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 10.5, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 15 }}>
                  {isHi ? item.hi : item.en}
                </Text>
              </View>
            ))}

            {/* Declaration Box */}
            <View
              style={{
                backgroundColor: 'rgba(200,168,75,0.1)',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: C.gold,
                borderRadius: 12,
                padding: 10,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
                {isHi ? 'दाता की घोषणा (Declaration):' : 'Donor Declaration:'}
              </Text>
              <Text style={{ fontSize: 10.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {isHi
                  ? '“मैंने उपरोक्त राशि अपनी ज़कात के रूप में MFCT को बतौर वकील/अमीन सौंपने की अनुमति दी है और MFCT से अपेक्षा करता/करती हूँ कि इसे शरीअत के अनुसार हकदार तक पहुँचाया जाए।”'
                  : '“I have entrusted the aforementioned sum as Zakat to MFCT as Wakīl/Amīn to deliver to entitled beneficiaries under Shariah.”'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART C : ज़कात फंड की Accounting व्यवस्था
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'accounting') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>
                  {isHi ? 'भाग–C : Accounting व्यवस्था' : 'Part C: Audit Framework'}
                </Text>
              </View>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: '600' }}>12 Parameters</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              MFCT ZAKAT FUND — {isHi ? '12-बिंदु पारदर्शी ऑडिट' : '12-Point Audit Ledger'}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                '1. Donor ID',
                '2. Receipt Date',
                '3. Amount (₹)',
                '4. Payment Mode',
                '5. Zakat Declaration',
                '6. Receipt & Txn No.',
                '7. Beneficiary ID',
                '8. Eligibility Verification',
                '9. Disbursement Date',
                '10. Paid Amount (₹)',
                '11. Disbursement Mode',
                '12. Running Balance',
              ].map((p, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: isDark ? '#081a10' : '#f1f5f9',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    width: '48%',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#e2e8f0' : '#334155' }}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>

            {/* Hadith Citation on Record Keeping */}
            <View
              style={{
                backgroundColor: 'rgba(200,168,75,0.12)',
                borderLeftWidth: 3,
                borderLeftColor: C.gold,
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
                📖 {isHi ? 'सहीह अल-बुखारी 1500 की मिसाल' : 'Sahih al-Bukhari 1500 Model'}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? '#cbd5e1' : '#334155', marginTop: 2 }}>
                {isHi
                  ? 'नबी ﷺ द्वारा नियुक्त ज़कात संग्रहकर्ता से वापस आने पर हिसाब लिया गया था। इससे accountability और record keeping की महत्वपूर्ण मिसाल मिलती है।'
                  : 'The Prophet ﷺ audited the accounts of the Zakat collector upon his return, establishing the legal requirement for meticulous auditing.'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART D : ज़कात के लाभार्थी की घोषणा
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'undertakings') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'rgba(244,63,94,0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#f43f5e' }}>
                  {isHi ? 'भाग–D : लाभार्थी घोषणा' : 'Part D: Beneficiary Declaration'}
                </Text>
              </View>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: '600' }}>KYC Checklist</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              ZAKAT BENEFICIARY DECLARATION
            </Text>

            <View style={{ backgroundColor: isDark ? '#081a10' : '#f8faf9', padding: 12, borderRadius: 12, gap: 6 }}>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• नाम: ________________________' : '• Beneficiary Name: ____________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• पिता/पति: ____________________' : '• Father/Husband: ________________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• परिवार सदस्य: _________________' : '• Family Members: _______________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• मासिक आय: ₹__________________' : '• Monthly Income: ₹______________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• आवश्यक खर्च: ₹________________' : '• Essential Expenses: ₹__________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                {isHi ? '• आवास स्थिति: किराये का ☐ / स्वयं का ☐' : '• Housing: Rented ☐ / Owned ☐'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(16,185,129,0.25)',
                borderRadius: 10,
                padding: 10,
              }}
            >
              <Text style={{ fontSize: 10.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {isHi
                  ? '“यह घोषणा करता/करती हूँ कि मैं आर्थिक रूप से जरूरतमंद हूँ और MFCT द्वारा माँगी गई जानकारी मेरे ज्ञान के अनुसार सही है।”'
                  : '“I declare that I am genuinely in financial distress and the information provided to MFCT is true to the best of my knowledge.”'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART E : फ़ितरा / सदक़ा-ए-फ़ित्र
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'principles') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(168,85,247,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#a855f7' }}>
                {isHi ? 'भाग–E : फ़ितरा नीति' : 'Part E: Fitra Policy'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              MFCT FITRA FUND — {isHi ? 'सदक़ा-ए-फ़ित्र' : 'Sadaqah-e-Fitr'}
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(200,168,75,0.12)',
                borderLeftWidth: 3,
                borderLeftColor: C.gold,
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight, marginBottom: 2 }}>
                📖 {isHi ? 'सहीह अल-बुखारी 1503' : 'Sahih al-Bukhari 1503'}
              </Text>
              <Text style={{ fontSize: 10.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                {isHi
                  ? 'नबी ﷺ ने सदक़ा-ए-फ़ित्र को मुसलमानों पर अनिवार्य किया और उसे ईद की नमाज़ से पहले अदा करने का आदेश दिया।'
                  : 'The Prophet ﷺ enjoined the payment of Sadaqah-e-Fitr and ordered that it be paid before the Eid prayer.'}
              </Text>
            </View>

            <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 16 }}>
              {isHi
                ? 'फ़ितरा प्राप्त होने पर उसे सामान्य donation में मिलाकर unrestricted fund नहीं माना जाएगा। इसके लिए अलग “MFCT FITRA FUND” बनाया गया है।'
                : 'Fitra funds are never pooled into general unrestricted donations. A dedicated “MFCT FITRA FUND” guarantees timely distribution before Eid.'}
            </Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART F & G : सामान्य सदक़ा व Donation Undertaking
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'principles' || activeCategory === 'undertakings') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(20,184,166,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#14b8a6' }}>
                {isHi ? 'भाग–F & G : सामान्य सदक़ा व दान' : 'Part F & G: General Sadaqah'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              GENERAL DONATION AUTHORISATION
            </Text>

            <Text style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 16 }}>
              {isHi
                ? 'सामान्य नफ़्ल सदक़ा में दाता के विशिष्ट उद्देश्य (भोजन, शिक्षा, चिकित्सा आदि) का पूर्ण सम्मान किया जाता है।'
                : 'For voluntary charity, donor-specified causes (food, education, medical) are strictly honored.'}
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '800', color: isDark ? C.goldLight : C.deepGreen, marginTop: 4 }}>
              {isHi ? '11 अनुमत सेवा क्षेत्र:' : '11 Permissible Welfare Heads:'}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                isHi ? 'गरीब व जरूरतमंद' : 'Needy Families',
                isHi ? 'शिक्षा सहायता' : 'Education Aid',
                isHi ? 'चिकित्सा सहायता' : 'Medical Aid',
                isHi ? 'भोजन वितरण' : 'Food Relief',
                isHi ? 'आपदा राहत' : 'Disaster Relief',
                isHi ? 'विधवा सहायता' : 'Widow Support',
                isHi ? 'अनाथ बच्चे' : 'Orphan Care',
                isHi ? 'बेटी निकाह' : 'Daughter Nikah',
                isHi ? 'आकस्मिक सहायता' : 'Emergency Aid',
                isHi ? 'जनाज़ा सहायता' : 'Janazah Services',
                isHi ? 'वैध सामाजिक कार्य' : 'Other Welfare',
              ].map((head, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: isDark ? '#081a10' : '#f0fdf4',
                    borderWidth: 1,
                    borderColor: 'rgba(16,185,129,0.25)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: isDark ? '#86efac' : '#166534' }}>
                    ✓ {head}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART H : फंड पृथक्करण नियम
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'accounting') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(99,102,241,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#6366f1' }}>
                {isHi ? 'भाग–H : 4 फंड विभाजन' : 'Part H: 4 Segregated Funds'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              {isHi ? 'चार अलग-अलग Categories' : 'Four Segregated Ledger Categories'}
            </Text>

            {[
              {
                title: '1. Zakat Fund',
                descHi: 'शरीअत के अनुसार केवल ज़कात के पात्र लाभार्थी',
                descEn: 'Only Shariah-verified Zakat recipients',
                color: '#10b981',
              },
              {
                title: '2. Fitra Fund',
                descHi: 'शरीअत के अनुसार केवल फ़ितरा के पात्र लाभार्थी (ईद से पूर्व)',
                descEn: 'Eligible Fitra beneficiaries (before Eid)',
                color: '#a855f7',
              },
              {
                title: '3. Sadaqah Fund',
                descHi: 'सामान्य सदक़ा के निर्धारित सामाजिक व राहत कार्य',
                descEn: 'Prescribed voluntary charity welfare works',
                color: '#14b8a6',
              },
              {
                title: '4. General Donation Fund',
                descHi: 'Trust के अनुमत सामाजिक, मानवीय व प्रशासनिक कार्य',
                descEn: 'Trust humanitarian and operational activities',
                color: '#3b82f6',
              },
            ].map((fund, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? '#081a10' : '#f8faf9',
                  padding: 10,
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: fund.color,
                  gap: 2,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', color: fund.color }}>
                  {fund.title}
                </Text>
                <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                  {isHi ? fund.descHi : fund.descEn}
                </Text>
              </View>
            ))}

            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.3)',
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#ef4444' }}>
                ⚠️ {isHi ? 'सख्त नियम:' : 'Strict Rule:'}{' '}
                {isHi
                  ? 'एक Fund की राशि को दूसरे Fund में बिना उचित शरीअती/प्रशासनिक आधार के transfer नहीं किया जाएगा।'
                  : 'Zero inter-fund transfers without valid Shariah basis.'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART I : कर्मचारियों व ट्रस्टियों के लिए नियम
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'principles') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(239,68,68,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444' }}>
                {isHi ? 'भाग–I : ट्रस्टी व खर्च प्रतिबंध' : 'Part I: Trustee Restrictions'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              {isHi ? 'ज़कात से इन मदों में खर्च पूर्णतः वर्जित है:' : 'Absolute Ban on Administrative Consumption:'}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Founder',
                'Trustee',
                'Chairman',
                'Secretary',
                'Treasurer',
                isHi ? 'कर्मचारी वेतन' : 'Staff Salaries',
                isHi ? 'कार्यालय किराया' : 'Office Rent',
                isHi ? 'विज्ञापन' : 'Advertisements',
                isHi ? 'वेबसाइट' : 'Website',
                isHi ? 'मोबाइल ऐप' : 'Mobile App',
                isHi ? 'प्रचार' : 'Promotion',
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#ef4444' }}>
                    ✕ {item}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: 'rgba(200,168,75,0.1)',
                padding: 10,
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: C.gold,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight, marginBottom: 2 }}>
                {isHi ? '“आमिलीन” की स्थिति:' : 'Status of "Amilīn":'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 15 }}>
                {isHi
                  ? 'MFCT के निजी कर्मचारी/ट्रस्टी अपने-आप “आमिलीन” नहीं बन जाते। इसलिए इस हिस्से को स्थानीय मुफ़्ती से लिखित शरीअती राय लेकर ही लागू करना बेहतर होगा।'
                  : 'Private staff/trustees do not automatically qualify as Amilīn. A written fatwa from a local Mufti is mandatory.'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART J : भाषा व शब्दावली में सावधानियां
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'principles') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(200,168,75,0.15)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
                {isHi ? 'भाग–J : भाषा में सावधानियां' : 'Part J: Language Precautions'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              {isHi ? '“मालिकाना हक़” बनाम “वकील/अमीन”' : 'Ownership vs. Wakalah Language'}
            </Text>

            {/* Prohibited */}
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.25)',
                borderRadius: 10,
                padding: 10,
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444' }}>
                {isHi ? '❌ कदापि न लिखें:' : '❌ Prohibited:'}
              </Text>
              <Text style={{ fontSize: 10, fontStyle: 'italic', color: isDark ? '#fca5a5' : '#991b1b' }}>
                {isHi
                  ? '“मैं अपनी ज़कात MFCT को पूर्ण मालिकाना हक़ से देता हूँ और अब Trust इसे अपनी मर्जी से किसी भी कार्य में खर्च कर सकता है।”'
                  : '“I give my Zakat to MFCT with absolute ownership to spend at its will.”'}
              </Text>
            </View>

            {/* Prescribed */}
            <View
              style={{
                backgroundColor: 'rgba(16,185,129,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(16,185,129,0.25)',
                borderRadius: 10,
                padding: 10,
                gap: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#10b981' }}>
                {isHi ? '✅ इसके बजाय लिखें:' : '✅ Prescribed:'}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#86efac' : '#166534' }}>
                {isHi
                  ? '“मैं MFCT को अपनी ज़कात का वकील/अमीन नियुक्त करता/करती हूँ ताकि मेरी ओर से यह राशि शरीअत के अनुसार उसके हकदारों तक पहुँचाई जाए।”'
                  : '“I appoint MFCT as Wakīl/Amīn of my Zakat to deliver it to Shariah-entitled beneficiaries.”'}
              </Text>
            </View>

            {/* Hadith Barirah */}
            <View
              style={{
                backgroundColor: 'rgba(200,168,75,0.1)',
                padding: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight }}>
                📖 {isHi ? 'सहीह मुस्लिम 1074a (हज़रत बरीरा رضي الله عنها)' : 'Sahih Muslim 1074a (Hazrat Barirah)'}
              </Text>
              <Text style={{ fontSize: 9.5, color: isDark ? '#cbd5e1' : '#475569', marginTop: 2 }}>
                {isHi
                  ? 'पात्र व्यक्ति के कब्ज़े में पहुँचने पर सदक़े की स्थिति बदलती है—बरीरा رضي الله عنها के लिए सदक़ा और दूसरे के लिए हदिया।'
                  : 'Charity status transforms upon physical possession by eligible recipient (Tamleek).'}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PART K : MFCT का Zakat Receipt Format
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'undertakings') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View
                style={{
                  backgroundColor: 'rgba(59,130,246,0.12)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>
                  {isHi ? 'भाग–K : Zakat Receipt प्रारूप' : 'Part K: Zakat Receipt'}
                </Text>
              </View>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: '600' }}>Reg. 258/2026</Text>
            </View>

            {/* Receipt Simulation Card */}
            <View
              style={{
                backgroundColor: isDark ? '#07160e' : '#fefcf8',
                borderWidth: 1.5,
                borderColor: C.gold,
                borderRadius: 14,
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '900', color: C.goldLight, textAlign: 'center' }}>
                MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
              </Text>
              <Text style={{ fontSize: 9.5, color: '#94a3b8', textAlign: 'center' }}>
                Reg. No. 258/2026 • Yaad Unki, Seva Hamari
              </Text>

              <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(200,168,75,0.2)', marginVertical: 4 }} />

              <Text style={{ fontSize: 10.5, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {isHi ? 'रसीद संख्या: MFCT-ZKT-2026-XXXX' : 'Receipt No.: MFCT-ZKT-2026-XXXX'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                {isHi ? 'दाता का नाम: ________________________' : 'Donor Name: ________________________'}
              </Text>
              <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                {isHi ? 'प्राप्त राशि: ₹_________________________' : 'Amount: ₹___________________________'}
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#10b981' }}>
                {isHi ? 'उद्देश्य: ☑ Zakat (ज़कात)' : 'Purpose: ☑ Zakat'}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>
                Payment Mode: ☐ UPI  ☐ Bank Transfer  ☐ Cheque  ☐ Cash
              </Text>

              <View
                style={{
                  backgroundColor: 'rgba(200,168,75,0.1)',
                  padding: 8,
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontSize: 9.5, fontStyle: 'italic', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                  {isHi
                    ? '“यह राशि दाता द्वारा ज़कात के रूप में MFCT को बतौर वकील/अमीन सौंपने हेतु दी गई है। MFCT इसे अपनी शरीअती नीति के अनुसार योग्य लाभार्थियों तक पहुँचाएगा।”'
                    : '“This sum is entrusted to MFCT as Wakīl/Amīn for delivery to Shariah-eligible beneficiaries.”'}
                </Text>
              </View>

              <Text style={{ fontSize: 9.5, fontWeight: '800', color: C.goldLight, textAlign: 'right', marginTop: 4 }}>
                Authorized Signatory, MFCT
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            HADITH CITATIONS (शरीअती आधार)
        ══════════════════════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'hadith') && (
          <View
            style={{
              backgroundColor: isDark ? '#0c2317' : '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.25)' : '#e2e8f0',
              padding: 14,
              gap: 10,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(200,168,75,0.15)',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: C.goldLight }}>
                {isHi ? 'शरीअती आधार : हदीस संदर्भ' : 'Shariah Foundation: Hadiths'}
              </Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? C.white : C.deepGreen }}>
              {isHi ? '6 सबसे महत्वपूर्ण शरीअती हदीसें' : '6 Primary Prophetic Hadiths'}
            </Text>

            {[
              {
                ref: isHi ? '1. सहीह बुखारी 1395' : '1. Sahih al-Bukhari 1395',
                textHi: 'ज़कात मालदारों से लेकर गरीबों को देने का स्पष्ट नबवी निर्देश।',
                textEn: 'Mandate to collect from the rich and distribute among their poor.',
              },
              {
                ref: isHi ? '2. सहीह बुखारी 1500' : '2. Sahih al-Bukhari 1500',
                textHi: 'नबी ﷺ द्वारा संग्रहकर्ता नियुक्त करना और वापस आने पर हिसाब लेना।',
                textEn: 'Prophetic appointment of collectors and rigorous auditing upon return.',
              },
              {
                ref: isHi ? '3. सहीह बुखारी 1503' : '3. Sahih al-Bukhari 1503',
                textHi: 'सदक़ा-ए-फ़ित्र की अनिवार्यता और ईद की नमाज़ से पहले अदा करने का आदेश।',
                textEn: 'Obligation of Fitra and mandatory disbursement prior to Eid.',
              },
              {
                ref: isHi ? '4. सहीह मुस्लिम 1074a' : '4. Sahih Muslim 1074a',
                textHi: 'सदक़े की वस्तु पात्र व्यक्ति के कब्ज़े में आने के बाद स्थिति का परिवर्तन (बरीरा رضي الله عنها)।',
                textEn: 'Status transformation upon possession by eligible recipient (Barirah).',
              },
              {
                ref: isHi ? '5. सुनन अबी दाऊद 1635' : '5. Sunan Abi Dawood 1635',
                textHi: 'ज़कात संग्रह करने वाले व्यक्ति के संबंध में “आमिल” का उल्लेख।',
                textEn: 'Jurisprudence governing the category of Amil (collector).',
              },
              {
                ref: isHi ? '6. सहीह बुखारी 1490' : '6. Sahih al-Bukhari 1490',
                textHi: 'नबी ﷺ ने दिए हुए सदक़े को वापस लेने से मना किया।',
                textEn: 'Prohibition against reclaiming charity given for Allah’s sake.',
              },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? '#081a10' : '#f8faf9',
                  padding: 10,
                  borderRadius: 10,
                  gap: 2,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: C.goldLight }}>
                  {item.ref}
                </Text>
                <Text style={{ fontSize: 10.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                  {isHi ? item.textHi : item.textEn}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            THREE PILLARS SUMMARY CARD
        ══════════════════════════════════════════════════════════════ */}
        <View
          style={{
            backgroundColor: C.deepGreen,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: C.gold,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: C.goldLight, textAlign: 'center', letterSpacing: 0.5 }}>
            {isHi ? 'शरीअती एवं प्रशासनिक स्पष्टता' : 'SHARIAH & AUDIT FOUNDATION'}
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '900', color: C.white, textAlign: 'center' }}>
            {isHi ? 'MFCT के तीन प्रमुख Undertakings' : 'The Three Core Undertaking Pillars'}
          </Text>

          <View style={{ gap: 6 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.goldLight }}>
                ① Zakat Wakalah Undertaking
              </Text>
              <Text style={{ fontSize: 9.5, color: '#cbd5e1', marginTop: 1 }}>
                {isHi ? 'दाता से लिखित अमानत व एजेंसी अधिकार' : 'Written fiduciary mandate from donor'}
              </Text>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.goldLight }}>
                ② Fitra Wakalah Undertaking
              </Text>
              <Text style={{ fontSize: 9.5, color: '#cbd5e1', marginTop: 1 }}>
                {isHi ? 'ईद से पूर्व वितरण का विशिष्ट संकल्प' : 'Pre-Eid distribution covenant'}
              </Text>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: C.goldLight }}>
                ③ General Sadaqah/Donation Undertaking
              </Text>
              <Text style={{ fontSize: 9.5, color: '#cbd5e1', marginTop: 1 }}>
                {isHi ? 'मानवीय व सामाजिक कार्यों के लिए सहमति' : 'Humanitarian welfare mandate'}
              </Text>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════
            PLEDGE & CONTACT
        ══════════════════════════════════════════════════════════════ */}
        <View
          style={{
            backgroundColor: isDark ? '#04120b' : C.deepGreen,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: C.gold,
            padding: 16,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: C.goldLight, letterSpacing: 0.8 }}>
            MFCT SOLEMN COMPLIANCE PLEDGE
          </Text>

          <Text style={{ fontSize: 14, fontWeight: '900', color: C.white, textAlign: 'center' }}>
            {isHi ? 'अमानत में खयानत नहीं, हकदार तक पूरा हक।' : 'Zero breach of trust, 100% aid to the rightful.'}
          </Text>

          <Text style={{ fontSize: 10.5, color: '#cbd5e1', textAlign: 'center', lineHeight: 15 }}>
            {isHi
              ? 'मरहूम मोहम्मद फ़ईम साहब की याद में स्थापित यह ट्रस्ट शरीअत के उसूलों के साथ आपकी ज़कात और सदक़ात को हकदारों तक पहुँचाने के लिए वचनबद्ध है।'
              : 'Dedicated to delivering your Zakat and Sadaqat to genuine beneficiaries in full compliance with Islamic Shariah.'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, width: '100%' }}>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{
                flex: 1,
                backgroundColor: '#25D366',
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <MessageCircle size={14} color="#000" />
              <Text style={{ color: '#000', fontWeight: '800', fontSize: 11 }}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCall}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <PhoneCall size={14} color={C.goldLight} />
              <Text style={{ color: C.white, fontWeight: '700', fontSize: 11 }}>
                +91 82180 17226
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
