import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Animated,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../src/context/AppStateProvider';
import { getUserById } from '../../src/services/userService';
import { KycUpdateModal } from '../../src/components/KycUpdateModal';
import { User } from '../../src/types';
import { getLanguageCode } from '../../src/lib/translateEntity';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Edit3,
  UserPlus,
  ShieldCheck,
  Phone,
  Mail,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';

export default function UnderReviewScreen() {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { activeUser, handleUpdateActiveUser, handleLogout } = useAppState();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(activeUser);
  const [isTerminated, setIsTerminated] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollTimerRef = useRef<any>(null);
  const isCheckingRef = useRef(false);
  const activeUserRef = useRef(activeUser);
  const handleUpdateActiveUserRef = useRef(handleUpdateActiveUser);

  useEffect(() => {
    activeUserRef.current = activeUser;
    handleUpdateActiveUserRef.current = handleUpdateActiveUser;
  }, [activeUser, handleUpdateActiveUser]);

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  // Keep currentUser synced with activeUser without triggering loops
  useEffect(() => {
    if (activeUser) {
      setCurrentUser(prev => {
        if (
          prev?.id === activeUser.id &&
          prev?.status === activeUser.status &&
          prev?.isVerified === activeUser.isVerified &&
          prev?.role === activeUser.role &&
          prev?.rejectionReason === activeUser.rejectionReason
        ) {
          return prev;
        }
        return activeUser;
      });
    }
  }, [activeUser]);

  // Pulse animation for pending badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Status check function - completely stable reference, no dependencies that mutate on update
  const checkStatus = useCallback(async (showIndicator = false) => {
    if (isCheckingRef.current) return;
    const current = activeUserRef.current;
    const userId = current?.id;
    if (!userId) return;

    isCheckingRef.current = true;
    if (showIndicator) setIsRefreshing(true);

    try {
      const freshUser = await getUserById(userId);
      setLastChecked(new Date());

      if (!freshUser) {
        // User record was deleted or not found in DB -> Terminated
        setIsTerminated(true);
        return;
      }

      setIsTerminated(false);

      // Only update state if data actually changed
      const hasChanged =
        freshUser.status !== current?.status ||
        freshUser.isVerified !== current?.isVerified ||
        freshUser.role !== current?.role ||
        freshUser.rejectionReason !== current?.rejectionReason;

      if (hasChanged) {
        setCurrentUser(freshUser);
        if (handleUpdateActiveUserRef.current) {
          await handleUpdateActiveUserRef.current(freshUser);
        }
      }

      // If approved or admin / community admin, redirect to dashboard
      const isPrivileged =
        freshUser.role === 'super_admin' ||
        freshUser.role === 'executive_admin' ||
        freshUser.role === 'community_admin' ||
        freshUser.district_role === 'community_admin' ||
        !!(freshUser.district_role || freshUser.districtRole);

      const isApproved =
        isPrivileged ||
        freshUser.status === 'approved' ||
        (freshUser.isVerified && freshUser.status !== 'reject' && freshUser.status !== 'rejected' && freshUser.status !== 'pending');

      if (isApproved) {
        setTimeout(() => {
          router.replace('/(drawer)/dashboard');
        }, 1200);
      }
    } catch (err) {
      console.warn('Failed to check user status:', err);
    } finally {
      isCheckingRef.current = false;
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Initial check and periodic polling (every 12 seconds)
  useEffect(() => {
    checkStatus(false);

    pollTimerRef.current = setInterval(() => {
      checkStatus(false);
    }, 12000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkStatus]);

  // Re-check whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkStatus(false);
    }, [checkStatus])
  );

  // Prevent back navigation to common website or admin while pending
  useEffect(() => {
    const onBackPress = () => {
      if (isPending) {
        return true; // handled, block hardware back navigation
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isPending]);

  const handleLanguageChange = async (targetLang: 'hi' | 'ur' | 'en') => {
    i18n.changeLanguage(targetLang);
    try {
      await AsyncStorage.setItem('mfct_language', targetLang);
    } catch { }
  };

  const handleSignOut = async () => {
    try {
      await handleLogout();
    } catch (e) {
      router.replace('/(auth)/sign-in');
    }
  };

  const handleRegisterAgain = async () => {
    try {
      await handleLogout();
    } catch { }
    router.replace('/(auth)/sign-up');
  };

  // Determine current status state
  const effectiveStatus = currentUser?.status;
  const isApproved =
    !isTerminated &&
    (effectiveStatus === 'approved' ||
      (currentUser?.isVerified && effectiveStatus !== 'reject' && effectiveStatus !== 'rejected'));
  const isRejected = !isTerminated && (effectiveStatus === 'reject' || effectiveStatus === 'rejected');
  const isPending = !isTerminated && !isApproved && !isRejected;

  const rejectionReason =
    currentUser?.rejectionReason ||
    currentUser?.rejection_reason ||
    tr(
      'दस्तावेज़ या विवरण सत्यापन में विसंगति पाई गई।',
      'دستاویزات یا تفصیلات میں نامکمل معلومات پائی گئیں۔',
      'Information or document mismatch during review.'
    );

  return (
    <View className="flex-1 bg-[#0f3322] dark:bg-[#071910]">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0f3322"
        translucent={Platform.OS === 'android'}
      />

      {/* Top Header Bar with Safe Area Inset */}
      <View
        className="flex-row items-center justify-between border-b border-[#f0c868]/20 bg-[#0f3322] px-4 dark:bg-[#071910]"
        style={{
          paddingTop: topInset > 0 ? topInset + 8 : (Platform.OS === 'android' ? 36 : 14),
          paddingBottom: 14,
        }}
      >
        <View className="flex-row items-center gap-2.5">
          <View className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#f0c868]/40 bg-[#f0c868]/15">
            <ShieldCheck color="#f0c868" size={18} />
          </View>
          <View>
            <Text className="text-base font-extrabold tracking-[0.3px] text-white">MFCT Trust</Text>
            <Text className="text-[11px] font-semibold text-[#f0c868]">
              {tr('सदस्यता समीक्षा', 'ممبرشپ جائزہ', 'Membership Review')}
            </Text>
          </View>
        </View>

        {/* Language Switcher Buttons */}
        <View className="flex-row items-center gap-1">
          {(['hi', 'ur', 'en'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => handleLanguageChange(l)}
              className={`rounded-md px-2 py-1 ${lang === l ? 'bg-[#f0c868]' : 'bg-white/[0.08]'
                }`}
            >
              <Text
                className={`text-[11px] ${lang === l ? 'font-extrabold text-[#0f3322]' : 'font-semibold text-slate-300'
                  }`}
              >
                {l === 'hi' ? 'हिंदी' : l === 'ur' ? 'اردو' : 'EN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-[#f8f6f1] dark:bg-[#0b1410]"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40 + Math.max(insets.bottom, 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STATUS CARD ─── */}
        {isApproved ? (
          /* Approved Screen */
          <View className="mb-4 items-center rounded-[20px] border border-green-200 bg-white p-[22px] shadow-sm dark:border-emerald-800/60 dark:bg-slate-900">
            <View className="mb-3.5 h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80">
              <CheckCircle2 color="#16a34a" size={42} />
            </View>
            <View className="mb-3 rounded-full border border-green-200 bg-green-100 px-3 py-1 dark:border-green-800 dark:bg-green-950/60">
              <Text className="text-xs font-bold text-green-700 dark:text-green-300">
                {tr('खाता स्वीकृत', 'اکاؤنٹ منظور ہوا', 'Account Approved')}
              </Text>
            </View>
            <Text className="mb-2 text-center text-[19px] font-extrabold leading-[25px] text-slate-900 dark:text-white">
              {tr(
                'मुबारक हो! आपका खाता स्वीकृत हो चुका है',
                'مبارک ہو! آپ کا اکاؤنٹ منظور ہو چکا ہے',
                'Congratulations! Your Account is Approved'
              )}
            </Text>
            <Text className="mb-4 text-center text-[13px] leading-[19px] text-slate-600 dark:text-slate-300">
              {tr(
                'अल्हम्दुलिल्लाह, आपका सदस्यता सत्यापन पूरा हो गया है। आपको मुख्य डैशबोर्ड पर भेजा जा रहा है...',
                'الحمدللہ، آپ کی ممبرشپ کی تصدیق مکمل ہو گئی ہے۔ آپ کو ڈیش بورڈ پر منتقل کیا جا رہا ہے...',
                'Your membership KYC has been successfully verified. Redirecting you to the dashboard...'
              )}
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/(drawer)/dashboard')}
              className="w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-[#10b981] py-3.5 active:opacity-90"
            >
              <Text className="text-sm font-bold text-white">
                {tr('डैशबोर्ड खोलें', 'ڈیش بورڈ پر جائیں', 'Open Dashboard')}
              </Text>
              <ChevronRight color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
        ) : isTerminated ? (
          /* Terminated Screen */
          <View className="mb-4 items-center rounded-[20px] border border-slate-300 bg-white p-[22px] shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <View className="mb-3.5 h-[76px] w-[76px] items-center justify-center rounded-full bg-red-100 dark:bg-red-950/80">
              <XCircle color="#dc2626" size={42} />
            </View>
            <View className="mb-3 rounded-full border border-red-200 bg-red-100 px-3 py-1 dark:border-red-800 dark:bg-red-950/60">
              <Text className="text-xs font-bold text-red-700 dark:text-red-300">
                {tr('खाता समाप्त', 'اکاؤنٹ ختم کیا گیا', 'Account Terminated')}
              </Text>
            </View>
            <Text className="mb-2 text-center text-[19px] font-extrabold leading-[25px] text-slate-900 dark:text-white">
              {tr(
                'यह सदस्यता खाता समाप्त कर दिया गया है',
                'یہ ممبرشپ اکاؤنٹ ختم کر دیا گیا ہے',
                'Membership Account Has Been Terminated'
              )}
            </Text>
            <Text className="mb-4 text-center text-[13px] leading-[19px] text-slate-600 dark:text-slate-300">
              {tr(
                'प्रशासन द्वारा इस सदस्यता खाते को समाप्त कर दिया गया है। यदि आप नए सिरे से जुड़ना चाहते हैं, तो आप पुनः पंजीकरण कर सकते हैं।',
                'انتظامیہ کی طرف سے یہ اکاؤنٹ ختم کر دیا گیا ہے۔ آپ نئی درخواست کے ساتھ دوبارہ رجسٹریشن کر سکتے ہیں۔',
                'This membership has been terminated by the administration. You may register again with updated details.'
              )}
            </Text>

            <TouchableOpacity
              onPress={handleRegisterAgain}
              className="w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-[#0f3322] py-3.5 active:opacity-90 dark:bg-emerald-900"
            >
              <UserPlus color="#f0c868" size={18} />
              <Text className="text-sm font-bold text-[#f0c868]">
                {tr('पुनः नया खाता बनाएं', 'دوبارہ نیا اکاؤنٹ بنائیں', 'Register New Account')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isRejected ? (
          /* Rejected Screen */
          <View className="mb-4 items-center rounded-[20px] border border-rose-200 bg-white p-[22px] shadow-sm dark:border-rose-900/60 dark:bg-slate-900">
            <View className="mb-3.5 h-[76px] w-[76px] items-center justify-center rounded-full bg-red-100 dark:bg-red-950/80">
              <AlertTriangle color="#e11d48" size={40} />
            </View>
            <View className="mb-3 rounded-full border border-red-200 bg-red-100 px-3 py-1 dark:border-red-800 dark:bg-red-950/60">
              <Text className="text-xs font-bold text-red-700 dark:text-red-300">
                {tr('समीक्षा विफल / अस्वीकृत', 'کے وائی سی مسترد', 'Action Required / Rejected')}
              </Text>
            </View>
            <Text className="mb-2 text-center text-[19px] font-extrabold leading-[25px] text-slate-900 dark:text-white">
              {tr(
                'केवाईसी आवेदन में सुधार आवश्यक है',
                'درخواست میں درستگی درکار ہے',
                'KYC Application Needs Correction'
              )}
            </Text>
            <Text className="mb-4 text-center text-[13px] leading-[19px] text-slate-600 dark:text-slate-300">
              {tr(
                'आपके दस्तावेज़ों या विवरण में कमी के कारण आवेदन अस्वीकृत किया गया है। कृपया नीचे दिए गए कारण को पढ़कर अपने विवरण में सुधार करें।',
                'آپ کی تفصیلات میں کچھ نقائص کی وجہ سے درخواست مسترد ہوئی ہے۔ برائے مہربانی نیچے دی گئی وجہ دیکھ کر درستگی کریں۔',
                'Your application requires corrections before it can be approved. Please review the reason below and update your details.'
              )}
            </Text>

            {/* Rejection Reason Box */}
            <View className="mb-4 w-full rounded-[14px] border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900 dark:bg-rose-950/40">
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <ShieldAlert color="#e11d48" size={16} />
                <Text className="text-[13px] font-bold text-rose-700 dark:text-rose-400">
                  {tr('अस्वीकृति का कारण:', 'مسترد ہونے کی وجہ:', 'Rejection Reason:')}
                </Text>
              </View>
              <Text className="text-[13px] font-medium leading-[18px] text-[#4c0519] dark:text-rose-200">
                {rejectionReason}
              </Text>
            </View>

            {/* Action Button: Edit Details */}
            {/* <TouchableOpacity
              onPress={() => setIsKycModalOpen(true)}
              className="mb-2.5 w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-[#0f3322] py-3.5 active:opacity-90 dark:bg-emerald-900"
            >
              <Edit3 color="#f0c868" size={18} />
              <Text className="text-sm font-bold text-[#f0c868]">
                {tr('विवरण सुधारें व पुनः भेजें', 'تفصیلات درست کریں', 'Edit & Resubmit Details')}
              </Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => checkStatus(true)}
              disabled={isRefreshing}
              className="w-full flex-row items-center justify-center gap-2 rounded-[14px] border border-slate-300 bg-slate-100 py-3.5 active:opacity-90 dark:border-slate-700 dark:bg-slate-800"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#0f3322" />
              ) : (
                <>
                  <RefreshCw color="#0f3322" size={16} />
                  <Text className="text-[13px] font-bold text-[#0f3322] dark:text-emerald-300">
                    {tr('स्थिति पुनः जांचें', 'حیثیت دوبارہ چیک کریں', 'Check Status Again')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Pending Screen */
          <View className="mb-4 items-center rounded-[20px] border border-amber-200 bg-white p-[22px] shadow-sm dark:border-amber-900/50 dark:bg-slate-900">
            <Animated.View
              className="mb-3.5 h-[76px] w-[76px] items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/80"
              style={{ transform: [{ scale: pulseAnim }] }}
            >
              <Clock color="#d97706" size={42} />
            </Animated.View>

            <View className="mb-3 flex-row items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 dark:border-amber-800 dark:bg-amber-950/60">
              <View className="h-[7px] w-[7px] rounded-full bg-amber-600" />
              <Text className="text-xs font-bold text-amber-800 dark:text-amber-300">
                {tr('समीक्षाधीन / प्रक्रिया में', 'زیر جائزہ / عمل جاری ہے', 'Under Review / In Progress')}
              </Text>
            </View>

            <Text className="mb-2 text-center text-[19px] font-extrabold leading-[25px] text-slate-900 dark:text-white">
              {tr(
                'आपका खाता वर्तमान में समीक्षाधीन है',
                'آپ کا اکاؤنٹ زیر جائزہ ہے',
                'Your Account is Under Review'
              )}
            </Text>

            <Text className="mb-4 text-center text-[13px] leading-[19px] text-slate-600 dark:text-slate-300">
              {tr(
                'मोहम्मद फईम चैरिटेबल ट्रस्ट (MFCT) में पंजीकरण के लिए धन्यवाद! हमारी प्रशासनिक टीम आपके केवाईसी दस्तावेज़ों और विवरण का सत्यापन कर रही है।',
                'محمد فہیم چیریٹیبل ٹرسٹ میں رجسٹریشن کا شکریہ! ہماری انتظامی کمیٹی آپ کی تفصیلات اور دستاویزات کی تصدیق کر رہی ہے۔',
                'Thank you for registering with Mohammad Faeem Charitable Trust (MFCT). Our administrative committee is currently verifying your submitted documents.'
              )}
            </Text>

            {/* Live Polling Info Banner */}
            <View className="mb-4 w-full flex-row items-center justify-center gap-2 rounded-[10px] border border-amber-100 bg-amber-50 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/40">
              <RefreshCw color="#92400e" size={14} />
              <Text className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                {tr(
                  'यह स्क्रीन हर 12 सेकंड में स्वचालित रूप से स्थिति अपडेट करती है।',
                  'یہ اسکرین خود بخود ہر 12 سیکنڈ بعد اپ ڈیٹ ہوتی ہے۔',
                  'Auto-refreshing status every 12 seconds.'
                )}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-2.5">
              <TouchableOpacity
                onPress={() => checkStatus(true)}
                disabled={isRefreshing}
                className="w-full flex-row items-center justify-center gap-2 rounded-[14px] bg-[#0f3322] py-3.5 active:opacity-90 dark:bg-emerald-900"
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#f0c868" />
                ) : (
                  <>
                    <RefreshCw color="#f0c868" size={18} />
                    <Text className="text-sm font-bold text-[#f0c868]">
                      {tr('अभी स्थिति जांचें', 'ابھی اسٹیٹس چیک کریں', 'Refresh Status Now')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── USER SUMMARY CARD ─── */}
        {currentUser && !isTerminated && (
          <View className="mb-4 rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-3 border-b border-slate-100 pb-2 text-[13px] font-extrabold uppercase tracking-[0.5px] text-slate-900 dark:border-slate-800 dark:text-slate-100">
              {tr('पंजीकृत सदस्य जानकारी', 'رجسٹرڈ ممبر معلومات', 'Registered Member Info')}
            </Text>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                {tr('नाम', 'نام', 'Name')}:
              </Text>
              <Text className="text-[13px] font-semibold text-slate-900 dark:text-white">
                {currentUser.name || 'Member'}
              </Text>
            </View>

            {currentUser.phone ? (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {tr('मोबाइल', 'موبائل', 'Phone')}:
                </Text>
                <Text className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  {currentUser.phone}
                </Text>
              </View>
            ) : null}

            {currentUser.email ? (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {tr('ईमेल', 'ای میل', 'Email')}:
                </Text>
                <Text className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  {currentUser.email}
                </Text>
              </View>
            ) : null}

            {currentUser.communityName ? (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {tr('कम्युनिटी', 'کمیونٹی', 'Community')}:
                </Text>
                <Text className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  {currentUser.communityName}
                </Text>
              </View>
            ) : null}

            {currentUser.membershipId ? (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  {tr('सदस्यता आईडी', 'ممبرشپ نمبر', 'Member ID')}:
                </Text>
                <Text className="text-[13px] font-bold text-[#0f3322] dark:text-[#f0c868]">
                  {currentUser.membershipId}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ─── HELP & SUPPORT BOX ─── */}
        <View className="mb-4 rounded-[16px] border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-1 text-[13px] font-bold text-slate-800 dark:text-slate-200">
            {tr('मदद चाहिए? संपर्क करें', 'مدد درکار ہے؟', 'Need Assistance?')}
          </Text>
          <Text className="mb-3 text-xs leading-[17px] text-slate-500 dark:text-slate-400">
            {tr(
              'यदि सत्यापन में 24 घंटे से अधिक समय लग रहा है, तो कृपया ट्रस्ट हेल्पलाइन पर संपर्क करें।',
              'اگر تصدیق میں 24 گھنٹے سے زیادہ وقت لگے تو ہیلپ لائن پر رابطہ کریں۔',
              'If your review is pending for more than 24 hours, contact the MFCT administration helpline.'
            )}
          </Text>

          <View className="flex-row flex-wrap gap-2.5">
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:919999999999')}
              className="flex-row items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 active:opacity-90 dark:border-slate-700 dark:bg-slate-800"
            >
              <Phone color="#0f3322" size={14} />
              <Text className="text-xs font-semibold text-[#0f3322] dark:text-emerald-300">
                +91 99999 99999
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:info@mfcttrust.com')}
              className="flex-row items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 active:opacity-90 dark:border-slate-700 dark:bg-slate-800"
            >
              <Mail color="#0f3322" size={14} />
              <Text className="text-xs font-semibold text-[#0f3322] dark:text-emerald-300">
                info@mfcttrust.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* KYC Update Modal */}
      {currentUser && (
        <KycUpdateModal
          visible={isKycModalOpen}
          user={currentUser}
          onClose={() => setIsKycModalOpen(false)}
          onUpdated={async (updated) => {
            setCurrentUser(updated);
            if (handleUpdateActiveUser) {
              await handleUpdateActiveUser(updated);
            }
            setIsKycModalOpen(false);
            // Refresh right after update
            checkStatus(true);
          }}
        />
      )}
    </View>
  );
}
