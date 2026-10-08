import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Switch,
  Share,
  Modal,
} from 'react-native';
import { useGlobalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../src/context/AppStateProvider';
import { getCampaigns, getCampaignById } from '../../src/services/campaignService';
import { getAccountDetails } from '../../src/services/adminService';
import { createDonation, updateCampaignRaised } from '../../src/services/donationService';
import { uploadImageToSupabase } from '../../src/services/storageService';
import { Campaign, DonationCategory, AccountDetails, Donation } from '../../src/types';
import {
  getLanguageCode,
  translateCategory,
  translateCampaignTitle,
  translateStatus,
} from '../../src/lib/translateEntity';
import { DynamicText } from '../../src/components/DynamicText';
import {
  ArrowLeft,
  Check,
  Copy,
  QrCode,
  Upload,
  Heart,
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  X,
  FileCheck,
  FileText,
  Share2,
  ChevronDown,
} from 'lucide-react-native';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];
const ZAKAT_PRESETS = [1000, 2500, 5000, 10000, 25000];
const CATEGORIES: DonationCategory[] = [
  'General',
  'Sadaqah',
  'Zakat',
  'Fitra',
];

const hindiNumbers: Record<number, string> = {
  1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पाँच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
  11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
  21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस', 30: 'तीस',
  31: 'इकत्तीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस', 36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस', 40: 'चालीस',
  41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चवालीस', 45: 'पैंतालीस', 46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास', 50: 'पचास',
  51: 'इक्यावन', 52: 'बावन', 53: 'तिरपन', 54: 'चौवन', 55: 'पचपन', 56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ', 60: 'साठ',
  61: 'इकसठ', 62: 'बासठ', 63: 'तिरसठ', 64: 'चौंसठ', 65: 'पैंसठ', 66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर', 70: 'सत्तर',
  71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर', 76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उनासी', 80: 'अस्सी',
  81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी', 86: 'छियासी', 87: 'सत्तासी', 88: 'अट्ठासी', 89: 'नवासी', 90: 'नब्बे',
  91: 'इक्यानवे', 92: 'बानवे', 93: 'तिरानवे', 94: 'चौरानवे', 95: 'पंचानवे', 96: 'छियानवे', 97: 'सत्तानवे', 98: 'अट्ठानवे', 99: 'निन्यानवे',
};

function numberToWordsINR(amount: number, lang: 'hi' | 'en' = 'hi'): string {
  if (!amount || isNaN(amount) || amount <= 0) return '';
  const num = Math.floor(amount);

  const onesEn = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tensEn = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const convertLessThanOneThousandEn = (n: number): string => {
    let current = '';
    if (n >= 100) {
      current += onesEn[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += tensEn[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      current += onesEn[n] + ' ';
    }
    return current.trim();
  };

  const convertLessThanOneThousandHi = (n: number): string => {
    let current = '';
    if (n >= 100) {
      const h = Math.floor(n / 100);
      current += (hindiNumbers[h] || '') + ' सौ ';
      n %= 100;
    }
    if (n > 0) {
      current += (hindiNumbers[n] || '') + ' ';
    }
    return current.trim();
  };

  if (lang === 'hi') {
    if (num === 0) return 'शून्य रुपये मात्र';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    let result = '';
    if (crore > 0) result += convertLessThanOneThousandHi(crore) + ' करोड़ ';
    if (lakh > 0) result += convertLessThanOneThousandHi(lakh) + ' लाख ';
    if (thousand > 0) result += convertLessThanOneThousandHi(thousand) + ' हज़ार ';
    if (remainder > 0) result += convertLessThanOneThousandHi(remainder);
    return (result.trim() + ' रुपये मात्र').replace(/\s+/g, ' ');
  } else {
    if (num === 0) return 'Zero Rupees Only';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    let result = '';
    if (crore > 0) result += convertLessThanOneThousandEn(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanOneThousandEn(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanOneThousandEn(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanOneThousandEn(remainder);
    return (result.trim() + ' Rupees Only').replace(/\s+/g, ' ');
  }
}

export default function DonationScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  // router is imported as static module from expo-router (avoids NavigationContainer context errors)
  const { activeUser } = useAppState();
  const params = useGlobalSearchParams<{ campaignId?: string; initialCategory?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Translation helper function (plain function - no hooks needed)
  const tr = (hi: string, ur: string, en: string): string => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  // Steps: 1 = Amount/Category/Wakalah, 2 = Payment/UTR, 3 = Success/Receipt
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isUtrFocused, setIsUtrFocused] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DonationCategory>(
    (params.initialCategory as DonationCategory) || 'General'
  );
  const [donorName, setDonorName] = useState<string>(
    activeUser?.name || tr('उदार दानदाता', 'عطیہ دہندہ', 'Generous Supporter')
  );
  const [isOutsideCommunity, setIsOutsideCommunity] = useState<boolean>(false);

  // Zakat Wakalah Form states
  const [zakatGuardianName, setZakatGuardianName] = useState<string>('');
  const [zakatAddress, setZakatAddress] = useState<string>(
    activeUser?.address || activeUser?.city || ''
  );
  const [zakatMobile, setZakatMobile] = useState<string>(
    activeUser?.phone || ''
  );
  const [zakatAmountWords, setZakatAmountWords] = useState<string>('');
  const [zakatAgreed, setZakatAgreed] = useState<boolean>(true);

  // Campaign & Account data
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 2 payment inputs
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 3 Result
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);

  const userCity = (activeUser?.city || activeUser?.address || '').trim();

  // Locality matcher
  const isMatchUserCity = useCallback(
    (c: Campaign | null | undefined) => {
      if (!c || !userCity) return false;
      const uCity = userCity.toLowerCase().trim();
      const cCity = (c.city || '').toLowerCase().trim();
      const cDistrict = ((c as any).district || '').toLowerCase().trim();
      const cComm = (c.communityName || '').toLowerCase().trim();
      return (
        cCity === uCity ||
        (cCity && (cCity.includes(uCity) || uCity.includes(cCity))) ||
        (cDistrict && (cDistrict.includes(uCity) || uCity.includes(cDistrict))) ||
        (cComm && (cComm.includes(uCity) || uCity.includes(cComm)))
      );
    },
    [userCity]
  );

  useEffect(() => {
    async function initData() {
      try {
        const allCamps = await getCampaigns();
        setCampaigns(allCamps);

        if (params.campaignId) {
          const camp = await getCampaignById(params.campaignId);
          if (camp) {
            setCampaign(camp);
            setSelectedCategory(camp.category);
          } else if (allCamps.length > 0) {
            const localCamp = userCity ? allCamps.find(isMatchUserCity) : null;
            setCampaign(localCamp || allCamps[0]);
          }
        } else if (allCamps.length > 0) {
          const localCamp = userCity ? allCamps.find(isMatchUserCity) : null;
          setCampaign(localCamp || allCamps[0]);
        }

        const accData = await getAccountDetails();
        if (accData && accData.length > 0) {
          setAccountDetails(accData[0]);
        }
      } catch (err) {
        console.warn('Error loading donation screen data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [params.campaignId, userCity, isMatchUserCity]);

  // Sync user details
  useEffect(() => {
    if (activeUser) {
      if (activeUser.name && (!donorName || donorName === 'Generous Supporter' || donorName === 'उदार दानदाता')) {
        setDonorName(activeUser.name);
      }
      if (activeUser.phone && !zakatMobile) {
        setZakatMobile(activeUser.phone);
      }
      if ((activeUser.address || activeUser.city) && !zakatAddress) {
        setZakatAddress(activeUser.address || activeUser.city || '');
      }
    }
  }, [activeUser]);

  // Sync Zakat Amount in words when amount or language changes
  useEffect(() => {
    if (selectedCategory === 'Zakat') {
      const targetLang = lang === 'en' ? 'en' : 'hi';
      setZakatAmountWords(numberToWordsINR(amount, targetLang));
    }
  }, [amount, selectedCategory, lang]);

  // Filter campaigns for Zakat eligibility
  const isZakatSelected = selectedCategory === 'Zakat';
  const filteredCampaigns = useMemo(() => {
    return isZakatSelected ? campaigns.filter((c) => c.isZakatEligible) : campaigns;
  }, [isZakatSelected, campaigns]);

  const localCityCampaigns = useMemo(() => {
    return userCity ? filteredCampaigns.filter(isMatchUserCity) : [];
  }, [userCity, filteredCampaigns, isMatchUserCity]);

  // Manual list according to outside community toggle
  const displayCampaigns = useMemo(() => {
    if (isOutsideCommunity) {
      const outside = filteredCampaigns.filter((c) => !isMatchUserCity(c));
      return outside.length > 0 ? outside : filteredCampaigns;
    }
    return localCityCampaigns.length > 0 ? localCityCampaigns : filteredCampaigns;
  }, [isOutsideCommunity, filteredCampaigns, localCityCampaigns, isMatchUserCity]);

  const handleToggleOutsideCommunity = (enabled: boolean) => {
    setIsOutsideCommunity(enabled);
    if (enabled) {
      const outsideCamp = filteredCampaigns.find((c) => !isMatchUserCity(c)) || filteredCampaigns[0];
      if (outsideCamp) setCampaign(outsideCamp);
    } else {
      const localCamp = localCityCampaigns[0] || filteredCampaigns[0];
      if (localCamp) setCampaign(localCamp);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          tr('अनुमति आवश्यक', 'اجازت درکار ہے', 'Permission Required'),
          tr('स्क्रीनशॉट चुनने के लिए गैलरी अनुमति आवश्यक है।', 'رسید منتخب کرنے کے لیے گیلری کی اجازت درکار ہے۔', 'Gallery permission is required to choose screenshot.')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshotUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleCopy = (text: string, fieldLabel: string, fieldKey: string) => {
    setCopiedField(fieldKey);
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
      (navigator as any).clipboard.writeText(text);
    }
    Alert.alert(
      t('donation.copied', tr('कॉपी किया गया', 'کاپی ہو گیا', 'Copied')),
      `${fieldLabel}: ${text}`
    );
    setTimeout(() => setCopiedField(null), 3000);
  };

  const handleProceedToPayment = () => {
    if (selectedCategory === 'Zakat') {
      if (!donorName.trim()) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया अपना पूरा नाम दर्ज करें।', 'براہ کرم اپنا پورا نام درج کریں۔', 'Please enter your full name.')
        );
        return;
      }
      if (!zakatGuardianName.trim()) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया पिता या पति का नाम दर्ज करें।', 'براہ کرم والد یا شوہر کا نام درج کریں۔', "Please enter father's or husband's name.")
        );
        return;
      }
      if (!zakatAddress.trim()) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया अपना पूरा पता दर्ज करें।', 'براہ کرم اپنا پتہ درج کریں۔', 'Please enter your residential address.')
        );
        return;
      }
      if (!zakatMobile.trim()) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया अपना मोबाइल नंबर दर्ज करें।', 'براہ کرم موبائل نمبر درج کریں۔', 'Please enter mobile number.')
        );
        return;
      }
      if (!amount || amount <= 0) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया वैध ज़कात राशि दर्ज करें।', 'براہ کرم درست رقم درج کریں۔', 'Please enter a valid Zakat amount.')
        );
        return;
      }
      if (!zakatAgreed) {
        Alert.alert(
          tr('सूचना', 'نوٹس', 'Notice'),
          tr('कृपया वकालात वचनबद्धता स्वीकार करें।', 'براہ کرم وکالت اقرار نامہ قبول کریں۔', 'Please accept the Wakalah Undertaking declaration.')
        );
        return;
      }
    } else {
      if (!amount || amount <= 0) {
        Alert.alert(
          t('donation.invalid_amount', tr('अमान्य राशि', 'غلط رقم', 'Invalid Amount')),
          t('donation.enter_valid_amount', tr('कृपया एक मान्य दान राशि दर्ज करें।', 'براہ کرم درست رقم درج کریں۔', 'Please enter a valid donation amount.'))
        );
        return;
      }
    }
    setStep(2);
  };

  const handleSubmitDonation = async () => {
    if (!donorName.trim()) {
      Alert.alert(
        tr('सूचना', 'نوٹس', 'Notice'),
        tr('कृपया अपना पूरा नाम दर्ज करें।', 'براہ کرم اپنا پورا نام درج کریں۔', 'Please enter your full name.')
      );
      return;
    }
    if (!utrNumber.trim() && !screenshotUri) {
      Alert.alert(
        t('donation.verification_needed', tr('सत्यापन आवश्यक', 'تصدیق درکار ہے', 'Verification Needed')),
        t(
          'donation.enter_utr_or_screenshot',
          tr(
            'कृपया 12 अंकों का बैंक UTR नंबर दर्ज करें या भुगतान स्क्रीनशॉट अपलोड करें।',
            'براہ کرم 12 ہندسوں کا بینک UTR نمبر درج کریں یا رسید اپلوڈ کریں۔',
            'Please enter a valid 12-digit Bank UTR number or upload payment screenshot.'
          )
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const finalUtr = utrNumber.trim() || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const finalDonorName = donorName.trim() || tr('उदार दानदाता', 'عطیہ دہندہ', 'Generous Supporter');
      const isOutside = Boolean(
        isOutsideCommunity ||
        (userCity && campaign && !isMatchUserCity(campaign))
      );

      // Upload payment screenshot to Supabase storage IMAGES bucket
      const uploadedScreenshotUrl = screenshotUri
        ? await uploadImageToSupabase(screenshotUri, 'receipts')
        : '';

      const donationData: Omit<Donation, 'id'> = {
        transactionId: `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
        utrNumber: finalUtr,
        donorName: finalDonorName,
        donorId: activeUser?.id || 'anonymous',
        donorRole: activeUser?.role || 'member',
        // When outside community: do NOT link to any specific campaign
        campaignId: isOutside ? 'general' : (campaign?.id || 'general'),
        campaignTitle: isOutside ? `${selectedCategory} General Fund (MFCT)` : (campaign?.title || `${selectedCategory} General Fund`),
        communityName: isOutside ? 'Mohammad Faeem Charitable Trust (MFCT)' : (campaign?.communityName || 'Mohammad Faeem Charitable Trust (MFCT)'),
        amountINR: amount,
        category: selectedCategory,
        isOutsideCommunity: isOutside,
        paymentMethod,
        paymentScreenshotUrl: uploadedScreenshotUrl || screenshotUri || undefined,
        status: 'pending_verification',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        receiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        district: activeUser?.district || activeUser?.city || campaign?.district || campaign?.city || '',
        wakalahInformation: selectedCategory === 'Zakat' ? [
          {
            donorName: finalDonorName,
            guardianName: zakatGuardianName.trim(),
            address: zakatAddress.trim(),
            mobile: zakatMobile.trim(),
            amountINR: amount,
            amountInWords: zakatAmountWords || numberToWordsINR(amount, lang === 'en' ? 'en' : 'hi'),
            isAccepted: true,
            undertakingTitle: 'ZAKAT AUTHORISATION & WAKALAH UNDERTAKING',
            declarationText: 'यह घोषित करता/करती हूँ कि उपरोक्त राशि मेरी ज़कात की राशि है।',
            authorizationText: 'मैं MOHAMMAD FAEEM CHARITABLE TRUST (MFCT) को अपनी ओर से इस राशि को वकील/अमीन के रूप में प्राप्त करने तथा शरीअत के अनुसार योग्य ज़कात लाभार्थियों तक पहुँचाने के लिए अधिकृत करता/करती हूँ।',
            trustName: 'MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)',
            date: new Date().toISOString(),
          },
        ] : undefined,
      };

      const saved = await createDonation(donationData);
      // Only credit the campaign raised amount when donation is for a specific campaign
      if (!isOutside && campaign?.id) {
        await updateCampaignRaised(campaign.id, amount);
      }

      setCreatedDonation(saved);
      setStep(3);
    } catch (err) {
      Alert.alert(
        tr('त्रुटि', 'خرابی', 'Error'),
        t(
          'donation.submit_failed',
          tr(
            'दान जमा करने में विफल। कृपया पुन: प्रयास करें।',
            'عطیہ جمع کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
            'Failed to submit donation. Please try again.'
          )
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!createdDonation) return;
    try {
      const message = `*MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)*\n` +
        `Donation Receipt: ${createdDonation.receiptNumber}\n` +
        `Donor: ${createdDonation.donorName}\n` +
        `Amount: ₹${createdDonation.amountINR.toLocaleString('en-IN')}\n` +
        `Category: ${createdDonation.category}\n` +
        `Campaign: ${createdDonation.campaignTitle}\n` +
        `UTR Ref: ${createdDonation.utrNumber}\n` +
        `Date: ${createdDonation.date}\n` +
        `Status: ${createdDonation.status}\n` +
        `JazakAllah Khair for your generous support!`;
      await Share.share({ message });
    } catch (err) {
      console.warn('Share receipt error:', err);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <View className="pt-12 pb-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => (step > 1 && step < 3 ? setStep((step - 1) as any) : router.back())}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <ArrowLeft color="#334155" size={20} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="font-extrabold text-sm text-slate-900 dark:text-white">
            {step === 1
              ? t('donation.make_donation', tr('सत्यापित दान करें', 'تصدیق شدہ عطیہ دیں', 'Make a Donation'))
              : step === 2
                ? t('donation.complete_payment', tr('भुगतान पूर्ण करें', 'ادائیگی مکمل کریں', 'Complete Payment'))
                : t('donation.donation_receipt', tr('दान रसीद', 'عطیہ رسید', 'Donation Receipt'))}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {t('donation.transparent_escrow', tr('पारदर्शी सामुदायिक एस्क्रो', 'شفاف کمیونٹی اسکرو', 'Transparent Community Escrow'))}
            </Text>
          </View>
        </View>
        <View className="w-8" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: isUtrFocused ? 360 : 80 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* STEP 1: Select Amount, Category & Zakat Wakalah */}
          {step === 1 && (
            <View className="space-y-4">
              {/* Outside Community Assistance Toggle */}
              {campaigns.length > 0 && (
                <View
                  className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${isOutsideCommunity
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                >
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    <View
                      className={`p-2.5 rounded-xl ${isOutsideCommunity
                        ? 'bg-emerald-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/60'
                        }`}
                    >
                      <Building2 color={isOutsideCommunity ? '#ffffff' : '#059669'} size={20} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white">
                          {tr('समुदाय से बाहर सहायता करें', 'کمیونٹی سے باہر امداد', 'Help Outside Community')}
                        </Text>
                        {isOutsideCommunity && (
                          <View className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
                            <Text className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-200">
                              {tr('सक्रिय ✓', 'فعال ✓', 'Active ✓')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-4">
                        {isOutsideCommunity
                          ? tr(
                            'बाहरी समुदाय सहायता सक्षम: अभियान ट्रस्ट द्वारा स्वतः चयनित है।',
                            'بیرونی کمیونٹی امداد فعال: مہم ٹرسٹ کے ذریعے خود بخود منتخب ہے۔',
                            'Outside assistance enabled: Campaign is automatically selected by Trust.'
                          )
                          : tr(
                            'अन्यथा अभियान मैन्युअली अपने शहर/समुदाय से चुनें।',
                            'بصورت دیگر अपने شہر/کمیونٹی کی مہم دستی طور پر منتخب کریں۔',
                            'Otherwise select campaign manually from your city/community.'
                          )}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isOutsideCommunity}
                    onValueChange={handleToggleOutsideCommunity}
                    trackColor={{ false: '#cbd5e1', true: '#059669' }}
                    thumbColor="#ffffff"
                  />
                </View>
              )}

              {/* Campaign Picker Scroller */}
              {displayCampaigns.length > 0 && !params.campaignId && !isOutsideCommunity ? (
                <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    {tr('अभियान / कारण चुनें', 'مہم / مقصد منتخب کریں', 'Choose Cause / Campaign')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10 }}
                  >
                    {displayCampaigns.map((c) => {
                      const isSelected = campaign?.id === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setCampaign(c);
                            setSelectedCategory(c.category);
                          }}
                          className={`p-2.5 rounded-2xl border flex-row items-center w-64 ${isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          <Image
                            source={{ uri: c.mainImage }}
                            className="w-12 h-12 rounded-xl mr-2.5"
                            resizeMode="cover"
                          />
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                {translateCategory(c.category, lang)}
                              </Text>
                              {c.isZakatEligible && (
                                <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                  {t('donation.zakat_eligible_tag', tr('ज़कात पात्र ✓', 'زکوٰۃ اہل ✓', 'Zakat Eligible ✓'))}
                                </Text>
                              )}
                            </View>
                            <DynamicText
                              text={c.title}
                              className="font-bold text-slate-900 dark:text-white text-xs leading-4 mt-0.5"
                              numberOfLines={1}
                            />
                            <Text className="text-[10px] text-slate-400 mt-0.5">
                              {c.city ? `${c.city} • ` : ''}₹{c.goalINR?.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : campaign ? (
                /* Selected Campaign Card Preview */
                <View className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center">
                  <Image
                    source={{ uri: campaign.mainImage }}
                    className="w-14 h-14 rounded-xl mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        {translateCategory(campaign.category, lang)}
                      </Text>
                      {campaign.isZakatEligible && (
                        <Text className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          {t('donation.zakat_eligible_tag', tr('ज़कात पात्र ✓', 'زکوٰۃ اہل ✓', 'Zakat Eligible ✓'))}
                        </Text>
                      )}
                    </View>
                    <DynamicText
                      text={campaign.title}
                      className="font-bold text-slate-900 dark:text-white text-xs leading-4 mt-0.5"
                      numberOfLines={2}
                    />
                    <Text className="text-[10px] text-slate-400 mt-0.5">
                      {campaign.city ? `${campaign.city} • ` : ''}₹{campaign.goalINR?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Category Dropdown */}
              <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  {t('donation.giving_category', tr('1. दान का प्रकार चुनें', '1. عطیہ کی قسم منتخب کریں', '1. Select Donation Type'))}
                </Text>

                {/* Dropdown trigger button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategoryDropdownOpen(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#059669',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                    {translateCategory(selectedCategory, lang)}
                  </Text>
                  <ChevronDown color="#fff" size={16} />
                </TouchableOpacity>

                {/* Category Picker Modal */}
                <Modal
                  visible={categoryDropdownOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setCategoryDropdownOpen(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setCategoryDropdownOpen(false)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 24,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        padding: 8,
                        width: '100%',
                        maxWidth: 340,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: '#0f172a',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          padding: 12,
                          paddingBottom: 8,
                        }}
                      >
                        {tr('दान का प्रकार चुनें', 'عطیہ کی قسم منتخب کریں', 'Select Donation Type')}
                      </Text>

                      {CATEGORIES.map((cat) => {
                        const isSel = selectedCategory === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (cat === 'Zakat' && campaign && !campaign.isZakatEligible) {
                                const zakatCamp = campaigns.find((c) => c.isZakatEligible);
                                if (zakatCamp) setCampaign(zakatCamp);
                              }
                              setSelectedCategory(cat);
                              setCategoryDropdownOpen(false);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 14,
                              paddingVertical: 13,
                              borderRadius: 12,
                              marginVertical: 2,
                              backgroundColor: isSel ? '#059669' : 'transparent',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: isSel ? '700' : '500',
                                color: isSel ? '#fff' : '#334155',
                              }}
                            >
                              {translateCategory(cat, lang)}
                            </Text>
                            {isSel && <Check color="#fff" size={16} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>

              {/* SPECIAL ZAKAT WAKALAH FORM CONTAINER */}
              {isZakatSelected ? (
                <View className="p-4 sm:p-5 rounded-3xl border-2 border-amber-400 dark:border-amber-600/60 bg-amber-500/5 dark:bg-amber-950/20 space-y-4">
                  {/* Undertaking Header */}
                  <View className="border-b border-amber-400/30 dark:border-amber-600/30 pb-3">
                    <View className="flex-row items-center gap-1.5">
                      <FileCheck color="#b45309" size={16} />
                      <Text className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                        MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
                      </Text>
                    </View>
                    <Text className="text-sm font-black text-emerald-950 dark:text-emerald-100 mt-1">
                      ZAKAT AUTHORISATION &amp; WAKALAH UNDERTAKING
                    </Text>
                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {tr(
                        'ज़कात वकील/अमीन नियुक्ति एवं वैधानिक घोषणा पत्र',
                        'زکوٰۃ وکالت نامہ اور توثیق اقرار نامہ',
                        'Official Legal & Shariah Undertaking Executed by the Zakat Donor'
                      )}
                    </Text>
                  </View>

                  {/* Form Inputs Grid */}
                  <View className="space-y-3 mt-3">
                    {/* Donor Name */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800" >
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tr('नाम:', 'نام:', 'Name:')} <Text className="text-rose-500">*</Text>
                      </Text>
                      <TextInput
                        value={donorName}
                        onChangeText={setDonorName}
                        placeholder={tr('उदा. मोहम्मद फ़हीम', 'مثال: محمد فہیم', 'e.g. Mohammad Faeem')}
                        placeholderTextColor="#94a3b8"
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white p-0"
                      />
                    </View>

                    {/* Father's / Husband's Name */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tr('पिता का नाम:', 'والد کا نام:', "Father's Name:")} <Text className="text-rose-500">*</Text>
                      </Text>
                      <TextInput
                        value={zakatGuardianName}
                        onChangeText={setZakatGuardianName}
                        placeholder={tr('पिता का नाम दर्ज करें', 'والد کا نام درج کریں', "Enter Father's Name")}
                        placeholderTextColor="#94a3b8"
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white p-0"
                      />
                    </View>

                    {/* Residential Address */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tr('पता:', 'پتہ:', 'Residential Address:')} <Text className="text-rose-500">*</Text>
                      </Text>
                      <TextInput
                        value={zakatAddress}
                        onChangeText={setZakatAddress}
                        placeholder={tr('उदा. मकान सं., मोहल्ला, शहर', 'مثال: مکان نمبر، محلہ، شہر', 'e.g. House No., Locality, City')}
                        placeholderTextColor="#94a3b8"
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white p-0"
                      />
                    </View>

                    {/* Mobile Number */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tr('मोबाइल:', 'موبائل:', 'Mobile Number:')} <Text className="text-rose-500">*</Text>
                      </Text>
                      <TextInput
                        value={zakatMobile}
                        onChangeText={setZakatMobile}
                        keyboardType="phone-pad"
                        placeholder="उदा. 9876543210"
                        placeholderTextColor="#94a3b8"
                        className="text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white p-0"
                      />
                    </View>

                    {/* Zakat Amount Selection */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {tr('ज़कात राशि:', 'زکوٰۃ رقم:', 'Zakat Amount:')} <Text className="text-rose-500">*</Text>
                        </Text>
                        <Text className="text-xs font-black text-amber-600 dark:text-amber-400">
                          ₹{amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6 }}
                        className="mb-2"
                      >
                        {ZAKAT_PRESETS.map((val) => {
                          const isSelected = amount === val && !customAmount;
                          return (
                            <TouchableOpacity
                              key={val}
                              onPress={() => {
                                setAmount(val);
                                setCustomAmount('');
                              }}
                              className={`px-3 py-1.5 rounded-lg border ${isSelected
                                ? 'bg-amber-600 border-amber-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                              <Text
                                className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                              >
                                ₹{val.toLocaleString('en-IN')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                        <Text className="text-amber-600 font-bold text-sm mr-2">₹</Text>
                        <TextInput
                          value={customAmount}
                          onChangeText={(txt) => {
                            setCustomAmount(txt);
                            const num = parseInt(txt, 10);
                            if (!isNaN(num) && num > 0) setAmount(num);
                          }}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                          placeholder={tr('अन्य राशि दर्ज करें...', 'دیگر رقم درج کریں...', 'Enter other amount...')}
                          placeholderTextColor="#94a3b8"
                          className="flex-1 text-slate-900 dark:text-white text-xs font-bold p-0"
                        />
                      </View>
                    </View>

                    {/* Amount in Words */}
                    <View className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-3">
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tr('राशि शब्दों में:', 'رقم لفظوں میں:', 'Amount in Words:')}
                      </Text>
                      <TextInput
                        value={zakatAmountWords}
                        onChangeText={setZakatAmountWords}
                        placeholder={tr(
                          'उदा. दो हज़ार पाँच सौ रुपये मात्र',
                          'مثال: دو ہزار پانچ سو روپے فقط',
                          'e.g. Two Thousand Five Hundred Rupees Only'
                        )}
                        placeholderTextColor="#94a3b8"
                        className="text-xs font-semibold text-slate-800 dark:text-slate-200 p-0"
                      />
                    </View>
                  </View>

                  {/* Solemn Declaration & Authorization Box */}
                  <View className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-600/40 space-y-2 mt-3">
                    {lang === 'hi' ? (
                      <View className="space-y-1.5">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white leading-5">
                          यह घोषित करता/करती हूँ कि उपरोक्त राशि मेरी ज़कात की राशि है।
                        </Text>
                        <Text className="text-[11px] text-slate-700 dark:text-slate-300 leading-4">
                          मैं <Text className="font-extrabold text-emerald-800 dark:text-emerald-400">MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)</Text> को अपनी ओर से इस राशि को <Text className="font-extrabold text-amber-700 dark:text-amber-400">वकील/अमीन</Text> के रूप में प्राप्त करने तथा शरीअत के अनुसार योग्य ज़कात लाभार्थियों तक पहुँचाने के लिए अधिकृत करता/करती हूँ।
                        </Text>
                      </View>
                    ) : lang === 'ur' ? (
                      <View className="space-y-1.5 text-right">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white leading-5">
                          یہ اقرار کرتا/کرتی ہوں کہ درج بالا رقم میری زکوٰۃ کی رقم ہے۔
                        </Text>
                        <Text className="text-[11px] text-slate-700 dark:text-slate-300 leading-4">
                          میں <Text className="font-extrabold text-emerald-800 dark:text-emerald-400">MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)</Text> کو اپنی طرف سے <Text className="font-extrabold text-amber-700 dark:text-amber-400">وکیل/امین</Text> کے طور پر اس رقم کو وصول کرنے اور شریعت کے مطابق مستحقین تک پہنچانے کا مجاز بناتا/بناتی ہوں۔
                        </Text>
                      </View>
                    ) : (
                      <View className="space-y-1.5">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white leading-5">
                          I hereby declare that the above amount is my Zakat money.
                        </Text>
                        <Text className="text-[11px] text-slate-700 dark:text-slate-300 leading-4">
                          I authorise <Text className="font-extrabold text-emerald-800 dark:text-emerald-400">MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)</Text> to act as my <Text className="font-extrabold text-amber-700 dark:text-amber-400">Wakil/Amin</Text> on my behalf to receive and disburse this Zakat to Shariah-compliant eligible beneficiaries.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Wakalah Agreement Checkbox */}
                  <TouchableOpacity
                    onPress={() => setZakatAgreed(!zakatAgreed)}
                    className="flex-row items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mt-3"
                  >
                    <View
                      className={`w-4 h-4 rounded mt-0.5 items-center justify-center border ${zakatAgreed
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-slate-400 dark:border-slate-600'
                        }`}
                    >
                      {zakatAgreed && <Check color="#ffffff" size={12} />}
                    </View>
                    <Text className="flex-1 text-[11px] text-slate-700 dark:text-slate-300 leading-4">
                      {tr(
                        'मैं पुष्टि करता/करती हूँ कि मैंने उपरोक्त वकालात वचनबद्धता पढ़ ली है और मैं अपनी पूर्ण सहमति देता/देती हूँ।',
                        'میں تصدیق کرتا/کرتی ہوں کہ میں نے مذکورہ بالا زکوٰۃ وکالت اقرار نامہ پڑھ لیا ہے اور میں اپنی مکمل رضامندی دیتا/دیتی ہوں۔',
                        'I solemnly confirm that I have read the above Zakat Wakalah Undertaking and grant my full authorization.'
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Standard Non-Zakat Amount Selection */
                <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t('donation.select_amount', tr('2. राशि चुनें (INR ₹)', '2. رقم منتخب کریں (INR ₹)', '2. Choose Amount (INR ₹)'))}
                  </Text>

                  {/* Preset Amount Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginTop: 4 }}
                  >
                    {PRESET_AMOUNTS.map((val) => {
                      const isSelected = amount === val && !customAmount;
                      return (
                        <TouchableOpacity
                          key={val}
                          onPress={() => {
                            setAmount(val);
                            setCustomAmount('');
                          }}
                          className={`px-4 py-2.5 rounded-xl border ${isSelected
                            ? 'bg-emerald-600 border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          <Text
                            className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                              }`}
                          >
                            ₹{val.toLocaleString('en-IN')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Custom Amount Input */}
                  <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 mt-4">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mr-2">₹</Text>
                    <TextInput
                      value={customAmount}
                      onChangeText={(txt) => {
                        setCustomAmount(txt);
                        const num = parseInt(txt, 10);
                        if (!isNaN(num) && num > 0) setAmount(num);
                      }}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder={t('donation.enter_custom_amount', tr('इच्छानुसार राशि दर्ज करें...', 'अपनी مرضی کی رقم درج کریں...', 'Enter custom amount...'))}
                      placeholderTextColor="#94a3b8"
                      className="flex-1 text-slate-900 dark:text-white text-xs font-bold p-0"
                    />
                  </View>

                  {/* Donor Name Input for General Giving */}
                  <View className="pt-1">
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tr('आपका नाम:', 'آپ کا نام:', 'Your Name:')}
                    </Text>
                    <TextInput
                      value={donorName}
                      onChangeText={setDonorName}
                      placeholder={tr('उदा. मोहम्मद आरिफ़', 'مثال: محمد عارف', 'e.g. Mohammad Arif')}
                      placeholderTextColor="#94a3b8"
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </View>
                </View>
              )}

              {/* Proceed to Payment Button */}
              <TouchableOpacity
                onPress={handleProceedToPayment}
                className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md flex-row mt-2"
              >
                <Text className="text-white font-black text-sm">
                  {t('donation.proceed_to_pay', tr('भुगतान हेतु आगे बढ़ें', 'ادائیگی کے لیے آگے بڑھیں', 'Proceed to Payment'))} (₹{amount.toLocaleString('en-IN')})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: UPI & Bank Transfer Payment Details + Verification Submission */}
          {step === 2 && (
            <View className="space-y-4">
              {/* Summary Bar */}
              <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-xs text-slate-400">
                    {t('donation.selected_campaign', tr('चयनित अभियान:', 'منتخب مہم:', 'Selected Campaign:'))}
                  </Text>
                  <DynamicText
                    text={campaign?.title || `${selectedCategory} General Fund`}
                    className="font-bold text-sm text-slate-900 dark:text-white mt-0.5"
                    numberOfLines={1}
                  />
                  {isOutsideCommunity && (
                    <View className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 self-start mt-1">
                      <Text className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-200">
                        {tr('बाहरी समुदाय सहायता', 'بیرونی کمیونٹی امداد', 'Outside Community Relief')}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-xs text-slate-400">
                    {t('donation.total_amount', tr('कुल राशि:', 'کل رقم:', 'Total Amount:'))}
                  </Text>
                  <Text className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ₹{amount.toLocaleString('en-IN')}
                  </Text>
                  <View className="bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 mt-1">
                    <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                      {translateCategory(selectedCategory, lang)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Zakat Wakalah Confirmation Badge */}
              {isZakatSelected && (
                <View className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-row items-center gap-2">
                  <FileCheck color="#b45309" size={16} />
                  <Text className="flex-1 text-xs font-bold text-amber-900 dark:text-amber-300">
                    {tr(
                      'ज़कात वकालात वचनबद्धता अधिकृत ✓ (वकील/अमीन: MFCT)',
                      'زکوٰۃ وکالت اقرار نامہ مجاز ✓ (وکیل/امین: MFCT)',
                      'Zakat Wakalah Undertaking Authorized ✓ (Wakil/Amin: MFCT)'
                    )}
                  </Text>
                </View>
              )}

              {/* Payment Method Switcher Tabs */}
              <View className="flex-row bg-slate-200 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-300 dark:border-slate-700">
                <TouchableOpacity
                  onPress={() => setPaymentMethod('UPI')}
                  className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 ${paymentMethod === 'UPI' ? 'bg-emerald-700 shadow-sm' : 'bg-transparent'
                    }`}
                >
                  <QrCode color={paymentMethod === 'UPI' ? '#ffffff' : '#64748b'} size={15} />
                  <Text
                    className={`text-xs font-bold ${paymentMethod === 'UPI' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {t('donation.instant_upi', tr('तत्काल यूपीआई / क्यूआर स्कैन', 'فوری یو پی آئی / کیو آر اسکین', 'Instant UPI / QR Scan'))}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPaymentMethod('Bank Transfer')}
                  className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 ${paymentMethod === 'Bank Transfer' ? 'bg-emerald-700 shadow-sm' : 'bg-transparent'
                    }`}
                >
                  <Building2 color={paymentMethod === 'Bank Transfer' ? '#ffffff' : '#64748b'} size={15} />
                  <Text
                    className={`text-xs font-bold ${paymentMethod === 'Bank Transfer' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {t('donation.direct_bank', tr('प्रत्यक्ष बैंक NEFT / RTGS', 'براہ راست بینک NEFT / RTGS', 'Direct Bank NEFT / RTGS'))}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TAB 1: UPI Payment Card */}
              {paymentMethod === 'UPI' ? (
                <View className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/30 items-center shadow-lg space-y-3">
                  <Text className="text-amber-400 font-bold text-xs uppercase tracking-wider text-center">
                    {t('donation.upi_id_escrow', tr('सीधे एस्क्रो के लिए UPI ID', 'براہ راست اسکرو کے لیے یو پی آئی آئی ڈی', 'UPI ID for Direct Escrow'))}
                  </Text>

                  {/* QR Code Container */}
                  <View className="bg-white p-3.5 rounded-2xl shadow-md items-center justify-center">
                    {accountDetails?.qr_code_url ? (
                      <Image
                        source={{ uri: accountDetails.qr_code_url }}
                        className="w-36 h-36"
                        resizeMode="contain"
                      />
                    ) : (
                      <QrCode color="#064e3b" size={144} />
                    )}
                  </View>

                  {/* UPI ID Display with Copy */}
                  <View className="w-full bg-slate-800/90 border border-slate-700 p-3 rounded-xl flex-row items-center justify-between">
                    <Text className="text-white font-mono font-bold text-sm flex-1 mr-2" numberOfLines={1}>
                      {accountDetails?.upi_id || 'mfct@okicici'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopy(accountDetails?.upi_id || 'mfct@okicici', 'UPI ID', 'upi')}
                      className="bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/40 flex-row items-center"
                    >
                      {copiedField === 'upi' ? <Check color="#34d399" size={13} /> : <Copy color="#34d399" size={13} />}
                      <Text className="text-emerald-300 font-bold text-xs ml-1">
                        {copiedField === 'upi'
                          ? t('donation.copied', tr('कॉपी किया गया', 'کاپی ہو گیا', 'Copied'))
                          : t('donation.copy', tr('कॉपी करें', 'کاپی کریں', 'Copy'))}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-slate-300 text-[11px] text-center px-2">
                    {t(
                      'donation.scan_apps',
                      tr(
                        'Google Pay, PhonePe, Paytm या BHIM UPI द्वारा स्कैन करें',
                        'Google Pay, PhonePe, Paytm یا BHIM ایپ سے اسکین کریں',
                        'Scan using Google Pay, PhonePe, Paytm, or BHIM UPI'
                      )
                    )}
                  </Text>
                </View>
              ) : (
                /* TAB 2: Direct Bank Transfer Card */
                <View className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/30 shadow-lg space-y-3">
                  <View className="flex-row items-center justify-between border-b border-slate-800 pb-2.5">
                    <View className="flex-row items-center gap-2">
                      <Building2 color="#34d399" size={18} />
                      <Text className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                        {t('donation.bank_details_title', tr('बैंक ट्रांसफर विवरण', 'بینک ٹرانسفر تفصیلات', 'Bank Transfer Credentials'))}
                      </Text>
                    </View>
                    <View className="bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                      <Text className="text-[10px] font-bold text-emerald-400">NEFT / RTGS</Text>
                    </View>
                  </View>

                  {/* Bank Name */}
                  <View className="flex-row justify-between items-center py-1 border-b border-slate-800/80">
                    <Text className="text-slate-400 text-xs font-medium">
                      {t('donation.bank_name', tr('बैंक का नाम:', 'بینک کا نام:', 'Bank Name:'))}
                    </Text>
                    <Text className="text-white font-bold text-xs">
                      {accountDetails?.bank_name || 'ICICI Bank Ltd'}
                    </Text>
                  </View>

                  {/* Account Number with Copy */}
                  <View className="flex-row justify-between items-center py-1 border-b border-slate-800/80">
                    <Text className="text-slate-400 text-xs font-medium">
                      {t('donation.account_number', tr('खाता संख्या:', 'اکاؤنٹ نمبر:', 'Account Number:'))}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-amber-400 font-mono font-bold text-sm">
                        {accountDetails?.account_number || '000405018892'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleCopy(
                            accountDetails?.account_number || '000405018892',
                            tr('खाता संख्या', 'اکاؤنٹ نمبر', 'Account Number'),
                            'acc'
                          )
                        }
                        className="bg-slate-800 p-1.5 rounded-lg border border-slate-700"
                      >
                        {copiedField === 'acc' ? <Check color="#34d399" size={12} /> : <Copy color="#cbd5e1" size={12} />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* IFSC Code with Copy */}
                  <View className="flex-row justify-between items-center py-1 border-b border-slate-800/80">
                    <Text className="text-slate-400 text-xs font-medium">
                      {t('donation.ifsc_code', tr('IFSC कोड:', 'آئی ایف ایس سی کوڈ:', 'IFSC Code:'))}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-amber-400 font-mono font-bold text-sm">
                        {accountDetails?.ifsc_code || 'ICIC0000004'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleCopy(
                            accountDetails?.ifsc_code || 'ICIC0000004',
                            tr('IFSC कोड', 'آئی ایف ایس سی کوڈ', 'IFSC Code'),
                            'ifsc'
                          )
                        }
                        className="bg-slate-800 p-1.5 rounded-lg border border-slate-700"
                      >
                        {copiedField === 'ifsc' ? <Check color="#34d399" size={12} /> : <Copy color="#cbd5e1" size={12} />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Account Holder Name */}
                  <View className="flex-row justify-between items-center py-1">
                    <Text className="text-slate-400 text-xs font-medium">
                      {t('donation.account_holder', tr('खाताधारक का नाम:', 'کھاتہ دار کا نام:', 'Account Holder Name:'))}
                    </Text>
                    <Text className="text-white font-semibold text-xs text-right max-w-[200px]" numberOfLines={1}>
                      {accountDetails?.account_holder_name || 'Mohammad Faeem Charitable Trust (MFCT)'}
                    </Text>
                  </View>

                  <View className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1">
                    <Text className="text-[11px] text-slate-300 text-center font-medium">
                      {t(
                        'donation.bank_instructions',
                        tr(
                          'NEFT / RTGS / IMPS द्वारा सीधे खाते में भेजें',
                          'براہ راست بینک ٹرانسفر بذریعہ IMPS / NEFT / RTGS',
                          'Direct bank transfer via IMPS / NEFT / RTGS'
                        )
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {/* Verification Inputs (Donor Name, UTR, Screenshot) */}
              <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                {/* Donor Full Name */}
                <View>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    {t('donation.full_name', tr('आपका पूरा नाम', 'آپ کا پورا نام', 'Your Full Name'))} <Text className="text-rose-500">*</Text>
                  </Text>
                  <TextInput
                    value={donorName}
                    onChangeText={setDonorName}
                    placeholder={t('donation.donor_name_placeholder', tr('उदा. मोहम्मद आरिफ़', 'مثال: محمد عارف', 'e.g. Mohammad Arif'))}
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm text-slate-900 dark:text-white font-medium"
                  />
                </View>

                {/* 12-Digit Bank UTR */}
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex-1 mr-2">
                      {t('donation.utr_number', tr('12 अंकों का बैंक UTR / संदर्भ संख्या', '12 ہندسوں کا بینک UTR / ٹرانزیکشن نمبر', '12-Digit Bank UTR / Transaction Ref No'))}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] font-bold text-slate-400">
                        {utrNumber.length}/12
                      </Text>
                      {isUtrFocused && (
                        <TouchableOpacity
                          onPress={() => {
                            Keyboard.dismiss();
                            setIsUtrFocused(false);
                          }}
                          className="bg-emerald-600 px-2.5 py-1 rounded-lg"
                        >
                          <Text className="text-[10px] font-bold text-white">
                            {t('donation.done', tr('पूर्ण', 'مکمل', 'Done'))}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View className="relative justify-center mb-1">
                    <TextInput
                      value={utrNumber}
                      onChangeText={(txt) => {
                        setUtrNumber(txt);
                        if (txt.trim().length >= 12) {
                          Keyboard.dismiss();
                          setIsUtrFocused(false);
                        }
                      }}
                      onFocus={() => {
                        setIsUtrFocused(true);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 200);
                      }}
                      onBlur={() => setIsUtrFocused(false)}
                      placeholder={t('donation.utr_placeholder', tr('उदा. 420199381029', 'مثال: 420199381029', 'e.g. 420199381029'))}
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        setIsUtrFocused(false);
                      }}
                      blurOnSubmit={true}
                      className="bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/70 dark:border-emerald-500 p-3 pr-10 rounded-xl text-base text-slate-900 dark:text-white font-mono font-bold tracking-widest"
                    />
                    {utrNumber.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setUtrNumber('')}
                        className="absolute right-3 p-1 bg-slate-200 dark:bg-slate-700 rounded-full"
                      >
                        <X color="#64748b" size={14} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {utrNumber.length > 0 && (
                    <View className="bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex-row items-center justify-between mt-1">
                      <Text className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        {t('donation.typed_utr', tr('दर्ज यूटीआर:', 'درج شدہ UTR:', 'Typed UTR:'))}{' '}
                        <Text className="font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-200">
                          {utrNumber}
                        </Text>
                      </Text>
                      {utrNumber.length >= 12 && (
                        <View className="bg-emerald-500 rounded-full p-0.5">
                          <Check color="#ffffff" size={12} />
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Upload Screenshot */}
                <View>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                    {t('donation.or_upload_screenshot', tr('या भुगतान स्क्रीनशॉट अपलोड करें', 'یا ادائیگی کی رسید اپلوڈ کریں', 'Or Upload Payment Screenshot'))}
                  </Text>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl items-center justify-center bg-slate-50 dark:bg-slate-800/40"
                  >
                    {screenshotUri ? (
                      <View className="items-center">
                        <Image source={{ uri: screenshotUri }} className="w-24 h-24 rounded-lg mb-2" />
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          {t('donation.screenshot_attached', tr('✓ स्क्रीनशॉट संलग्न है (बदलने के लिए टैप करें)', '✓ رسید منسلک ہے (تبدیل کرنے کے لیے ٹیپ کریں)', '✓ Screenshot Attached (Tap to change)'))}
                        </Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <Upload color="#64748b" size={22} />
                        <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold mt-1">
                          {t('donation.upload_screenshot_optional', tr('भुगतान स्क्रीनशॉट अपलोड करें (वैकल्पिक)', 'ادائیگی کی رسید اپلوڈ کریں (اختیاری)', 'Upload Payment Screenshot (Optional)'))}
                        </Text>
                        <Text className="text-slate-400 text-[10px] mt-0.5">
                          {t('donation.gallery_format', tr('फ़ोन गैलरी से JPG या PNG', 'فون گیلری سے JPG یا PNG', 'JPG or PNG from phone gallery'))}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitDonation}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md flex-row mt-2"
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Heart color="#ffffff" size={16} fill="#ffffff" />
                    <Text className="text-white font-black text-sm ml-2">
                      {t('donation.verify_and_submit', tr('सत्यापित दान जमा करें', 'تصدیق شدہ عطیہ جمع کریں', 'Verify & Submit Donation'))}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Trust Tag */}
              <View className="flex-row items-center justify-center gap-1.5 mt-1">
                <ShieldCheck color="#10b981" size={14} />
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('donation.escrow_badge', tr('100% सत्यापित सामुदायिक एस्क्रो • सीधा वितरण', '100% تصدیق شدہ کمیونٹی اسکرو • براہ راست ترسیل', '100% Verified Community Escrow • Direct Reach'))}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 3: Success Confirmation & Digital Receipt */}
          {step === 3 && (
            <View className="space-y-4 items-center">
              <View className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 items-center justify-center mt-4 border-2 border-emerald-500">
                <CheckCircle2 color="#059669" size={40} />
              </View>

              <Text className="text-xl font-black text-slate-900 dark:text-white text-center">
                {t('donation.success_title', tr('दान सफल! 🎉', 'عطیہ کامیاب! 🎉', 'Donation Successful! 🎉'))}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 text-center px-4 leading-5">
                {tr(
                  `आपकी ₹${(createdDonation?.amountINR || amount).toLocaleString('en-IN')} की दान राशि एस्क्रो के तहत दर्ज कर ली गई है और कर-छूट रसीद तैयार कर दी गई है।`,
                  `آپ کا ₹${(createdDonation?.amountINR || amount).toLocaleString('en-IN')} کا عطیہ موصول ہو گیا ہے اور ٹیکس چھوٹ رسید تیار کر دی گئی ہے۔`,
                  `Your donation of ₹${(createdDonation?.amountINR || amount).toLocaleString('en-IN')} has been submitted under escrow and a tax-exempt receipt has been generated.`
                )}
              </Text>

              {/* Digital Receipt Card */}
              <View className="w-full bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-2 space-y-2.5">
                {/* Trust Name Banner */}
                <View className="border-b border-slate-100 dark:border-slate-800 pb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <FileText color="#059669" size={14} />
                    <Text className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400">
                      MOHAMMAD FAEEM CHARITABLE TRUST (MFCT)
                    </Text>
                  </View>
                  <View className="bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    <Text className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      {tr('आधिकारिक रसीद', 'سرکاری رسید', 'Official Receipt')}
                    </Text>
                  </View>
                </View>

                {/* Receipt Number */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.receipt_number', tr('रसीद संख्या', 'رسید نمبر', 'Receipt No.'))}
                  </Text>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {createdDonation?.receiptNumber || 'RCP-2024-9988'}
                  </Text>
                </View>

                {/* Amount Paid */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.amount_paid', tr('भुगतान की गई राशि', 'ادا کردہ رقم', 'Amount Paid'))}
                  </Text>
                  <Text className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ₹{createdDonation?.amountINR?.toLocaleString('en-IN') || amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Category */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.category', tr('दान का प्रकार', 'عطیہ کی قسم', 'Category'))}
                  </Text>
                  <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {translateCategory(createdDonation?.category || selectedCategory, lang)}
                  </Text>
                </View>

                {/* Target Campaign */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.target_campaign', tr('लक्षित अभियान', 'ہدف مہم', 'Target Campaign'))}
                  </Text>
                  <DynamicText
                    text={createdDonation?.campaignTitle || campaign?.title || 'General Community Fund'}
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[200px]"
                    numberOfLines={1}
                  />
                </View>

                {/* Donor Name */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.donor_name', tr('दानदाता का नाम', 'عطیہ دہندہ کا نام', 'Donor Name'))}
                  </Text>
                  <DynamicText
                    text={createdDonation?.donorName || donorName}
                    className="text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </View>

                {/* Bank UTR */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.utr_number', tr('12 अंकों का बैंक UTR / संदर्भ संख्या', '12 ہندسوں کا بینک UTR / ٹرانزیکشن نمبر', 'Bank UTR'))}
                  </Text>
                  <Text className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {createdDonation?.utrNumber || utrNumber}
                  </Text>
                </View>

                {/* Date */}
                <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Text className="text-xs text-slate-400">
                    {t('donation.date', tr('दिनांक', 'تاریخ', 'Date'))}
                  </Text>
                  <Text className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {createdDonation?.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>

                {/* Relief Scope */}
                {createdDonation?.isOutsideCommunity && (
                  <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Text className="text-xs text-slate-400">
                      {tr('सहायता क्षेत्र:', 'امداد کا علاقہ:', 'Relief Scope:')}
                    </Text>
                    <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      {tr('बाहरी समुदाय', 'بیرونی کمیونٹی', 'Outside Community')}
                    </Text>
                  </View>
                )}

                {/* Wakalah Status */}
                {createdDonation?.category === 'Zakat' && (
                  <View className="flex-row justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Text className="text-xs text-slate-400">
                      {tr('वकालात स्थिति:', 'وکالت کی حیثیت:', 'Wakalah Status:')}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <FileCheck color="#059669" size={13} />
                      <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {tr('वकील/अमीन अधिकृत ✓', 'وکیل/امین مجاز ✓', 'Wakalah Executed ✓')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Status */}
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-slate-400">
                    {t('donation.status', tr('स्थिति', 'حیثیت', 'Status'))}
                  </Text>
                  <View className="bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {translateStatus(createdDonation?.status || 'pending_verification', lang)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Share Receipt Button */}
              <TouchableOpacity
                onPress={handleShareReceipt}
                className="w-full py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 items-center justify-center flex-row gap-2 mt-2"
              >
                <Share2 color="#059669" size={16} />
                <Text className="text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  {tr('रसीद विवरण साझा करें', 'رسید کی تفصیلات شیئر کریں', 'Share Receipt Details')}
                </Text>
              </TouchableOpacity>

              {/* Done and Home Buttons */}
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                className="w-full py-4 bg-emerald-600 rounded-2xl items-center justify-center shadow-md mt-2"
              >
                <Text className="text-white font-black text-sm">
                  {t('donation.done_home', tr('पूर्ण व मुख्य पृष्ठ पर लौटें', 'مکمل اور ہوم پر واپس جائیں', 'Done & Return Home'))}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/campaigns')}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Text className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                  {t('donation.explore_more', tr('और अभियान देखें', 'مزید مہمات دیکھیں', 'Explore More Campaigns'))}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
