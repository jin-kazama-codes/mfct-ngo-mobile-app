import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  LogOut,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  Award,
  KeyRound,
  ArrowLeft,
  UserCheck,
  Building,
} from 'lucide-react-native';
import { KycUpdateModal } from '../../../src/components/KycUpdateModal';
import { ChangePasswordModal } from '../../../src/components/ChangePasswordModal';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  translateRole,
  translateDistrictRole,
  translateCommunityName,
  translateCity,
  translateState,
} from '../../../src/lib/translateEntity';
import { useDynamicTranslatedText } from '@/src/lib/autoTranslate';

export default function ProfileScreen() {
  const { handleLogout, activeUser, currentRole, handleUpdateActiveUser } = useAppState();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { i18n } = useTranslation();
  const isDark = colorScheme === 'dark';

  const onLogout = async () => {
    await handleLogout();
    router.replace('/(tabs)');
  };

  const handleToggleTheme = async () => {
    toggleColorScheme();
    const next = isDark ? 'light' : 'dark';
    try {
      await AsyncStorage.setItem('mfct_theme', next);
    } catch { }
  };

  // Available languages configuration
  const ALL_LANGUAGES = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी', short: 'HI' },
    { code: 'ur', label: 'اردو', short: 'UR' },
  ];

  // Current active language code (en, hi, or ur)
  const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi')
    ? 'hi'
    : (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ur')
      ? 'ur'
      : 'en';

  const tr = (hi: string, ur: string, en: string) => {
    if (currentLang === 'hi') return hi;
    if (currentLang === 'ur') return ur;
    return en;
  };

  // Available options without current language
  const availableLanguages = ALL_LANGUAGES.filter((item) => item.code !== currentLang);

  const handleSelectLanguage = async (next: string) => {
    i18n.changeLanguage(next);
    try {
      await AsyncStorage.setItem('mfct_language', next);
    } catch { }
  };

  const [kycModalVisible, setKycModalVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);

  const userStatus = activeUser?.status || (activeUser?.isVerified ? 'approved' : 'pending');
  const isApproved = userStatus === 'approved';

  const rawRole = activeUser?.role || currentRole || 'member';
  const displayName = useDynamicTranslatedText(activeUser?.name, currentLang) || activeUser?.name || tr('एमएफसीटी सदस्य', 'ایم ایف سی ٹی ممبر', 'MFCT Member');

  const roleName = translateRole(rawRole, currentLang as any);
  const commName = translateCommunityName(activeUser?.communityName || 'MFCT Trust', currentLang as any);
  const cityName = useDynamicTranslatedText(activeUser?.city || activeUser?.district || '', currentLang as any);
  const stateName = useDynamicTranslatedText(activeUser?.state || 'UP', currentLang as any);
  const districtName = activeUser?.district ? translateCity(activeUser.district, currentLang as any) : '';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <View
        className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row items-center justify-between"
        style={{ paddingTop: Platform.OS === 'ios' ? 52 : 42 }}
      >
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft color={isDark ? '#cbd5e1' : '#334155'} size={20} />
        </TouchableOpacity>

        <View className="flex-1 mx-2 items-center justify-center">
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center">
            {tr('मेरी प्रोफ़ाइल', 'میری پروفائل', 'My Profile')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {tr('खाता और प्राथमिकताएं प्रबंधित करें', 'اکاؤنٹ اور ترجیحات کا انتظام کریں', 'Manage account & preferences')}
          </Text>
        </View>

        {/* Right balance spacer */}
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile Card */}
        <View className="bg-white dark:bg-slate-900 p-6 rounded-3xl items-center mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <View className="relative mb-3">
            {activeUser?.avatar ? (
              <Image
                key={activeUser.avatar}
                source={{ uri: activeUser.avatar }}
                className="w-24 h-24 rounded-full border-2 border-emerald-500"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 justify-center items-center">
                <UserCircle color="#10b981" size={56} />
              </View>
            )}
            {isApproved && (
              <View className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                <CheckCircle2 color="#ffffff" size={16} />
              </View>
            )}
          </View>

          <Text className="text-xl font-bold text-slate-900 dark:text-white text-center">
            {displayName}
          </Text>

          <View className="flex-row items-center gap-1 mt-1 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck color="#10b981" size={14} />
            <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide">
              {roleName}
            </Text>
          </View>

          {(activeUser?.districtRole || activeUser?.district_role) ? (
            <View className="flex-row items-center gap-1 mt-1.5 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
              <Award color="#d97706" size={14} />
              <Text className="text-amber-800 dark:text-amber-300 text-xs font-bold tracking-wide">
                {translateDistrictRole((activeUser?.districtRole || activeUser?.district_role) as string, currentLang as any)}
                {districtName || cityName ? ` • ${districtName || cityName}` : ''}
              </Text>
            </View>
          ) : null}

          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            {tr('सदस्यता आईडी', 'ممبرشپ آئی ڈی', 'ID')}: {activeUser?.membershipId || (activeUser?.id ? activeUser.id.slice(0, 8).toUpperCase() : 'N/A')}
          </Text>
        </View>

        {/* Account Details Card */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
            {tr('संपर्क एवं समुदाय जानकारी', 'رابطہ اور کمیونٹی معلومات', 'Contact & Community Info')}
          </Text>

          {activeUser?.email ? (
            <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Mail color="#10b981" size={18} />
              <View className="flex-1">
                <Text className="text-xs text-slate-400">
                  {tr('ईमेल पता', 'ای میل پتہ', 'Email Address')}
                </Text>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {activeUser.email}
                </Text>
              </View>
            </View>
          ) : null}

          {activeUser?.phone ? (
            <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Phone color="#10b981" size={18} />
              <View className="flex-1">
                <Text className="text-xs text-slate-400">
                  {tr('फ़ोन नंबर', 'فون نمبر', 'Phone Number')}
                </Text>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {activeUser.phone}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <Building2 color="#10b981" size={18} />
            <View className="flex-1">
              <Text className="text-xs text-slate-400">
                {tr('आवंटित समुदाय', 'مقرر کردہ کمیونٹی', 'Assigned Community')}
              </Text>
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {commName}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 py-2.5">
            <MapPin color="#10b981" size={18} />
            <View className="flex-1">
              <Text className="text-xs text-slate-400">
                {tr('स्थान', 'مقام', 'Location')}
              </Text>
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {cityName}, {stateName}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Card */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
            {tr('ऐप प्राथमिकताएं', 'ایپ کی ترجیحات', 'App Preferences')}
          </Text>

          {/* Appearance / Theme */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800"
            onPress={handleToggleTheme}
          >
            <View className="flex-row items-center gap-3">
              {isDark ? <Moon color="#10b981" size={18} /> : <Sun color="#10b981" size={18} />}
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {tr('थीम दिखावट', 'تھیم ظاہری شکل', 'Appearance')}
              </Text>
            </View>
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {isDark ? tr('डार्क मोड', 'ڈارک موڈ', 'Dark Mode') : tr('लाइट मोड', 'لائٹ موڈ', 'Light Mode')}
            </Text>
          </TouchableOpacity>

          {/* Language Selector */}
          <View className="py-3">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-3">
                <Globe color="#10b981" size={18} />
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {tr('भाषा', 'زبان', 'Language')}
                </Text>
              </View>
              <View className="bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {currentLang === 'hi' ? 'हिंदी (HI)' : currentLang === 'ur' ? 'اردو (UR)' : 'English (EN)'}
                </Text>
              </View>
            </View>

            {/* Other 2 language options without current language */}
            <View className="flex-row gap-2 pl-7">
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleSelectLanguage(lang.code)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center active:opacity-70"
                >
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang.label} ({lang.short})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Edit Profile */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800"
            onPress={() => setKycModalVisible(true)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <CheckCircle2 color="#10b981" size={18} />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {tr('प्रोफ़ाइल संपादित करें', 'پروفائل میں ترمیم کریں', 'Edit Profile')}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {tr(
                    'केवाईसी और व्यक्तिगत विवरण अपडेट करें',
                    'کے وائی سی اور ذاتی تفصیلات اپ ڈیٹ کریں',
                    'Update KYC and personal details'
                  )}
                </Text>
              </View>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {tr('संपादित करें →', 'ترمیم کریں →', 'Edit →')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800"
            onPress={() => router.push('/(stacks)/change-password')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <KeyRound color="#10b981" size={18} />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {tr('पासवर्ड बदलें', 'پاس ورڈ تبدیل کریں', 'Change Password')}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {tr(
                    'खाता लॉगिन विवरण अपडेट करें',
                    'اکاؤنٹ لاگ ان کی تفصیلات اپ ڈیٹ کریں',
                    'Update account login credentials'
                  )}
                </Text>
              </View>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {tr('अपडेट करें →', 'اپ ڈیٹ کریں →', 'Update →')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Nominee Details */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800"
            onPress={() => router.push('/(drawer)/dashboard/nominee-details')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <UserCheck color="#10b981" size={18} />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {tr('नॉमिनी विवरण', 'نامزد تفصیلات', 'Nominee Details')}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {tr(
                    'कानूनी उत्तराधिकारी का विवरण प्रबंधित करें',
                    'قانونی وارث کی تفصیلات کا انتظام کریں',
                    'Manage designated legal nominee'
                  )}
                </Text>
              </View>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {tr('देखें →', 'دیکھیں →', 'View →')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Member Bank Details */}
          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800"
            onPress={() => router.push('/(drawer)/dashboard/member-bank-details')}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Building color="#10b981" size={18} />
              <View>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {tr('बैंक खाता विवरण', 'بینک اکاؤنٹ کی تفصیلات', 'Bank Account Details')}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {tr(
                    'सहायता अंतरण हेतु बैंक विवरण',
                    'امداد منتقلی کے لیے بینک اکاؤنٹ',
                    'Personal bank details for aid disbursement'
                  )}
                </Text>
              </View>
            </View>
            <View className="bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {tr('देखें →', 'دیکھیں →', 'View →')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            className="flex-row bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-2xl justify-center items-center border border-emerald-200 dark:border-emerald-800 gap-2"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              {tr('मुख्य वेबसाइट पर लौटें', 'مرکزی ویب سائٹ پر واپس جائیں', 'Back to Public Website')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row bg-red-50 dark:bg-red-950/60 p-4 rounded-2xl justify-center items-center border border-red-200 dark:border-red-900 gap-2"
            onPress={onLogout}
          >
            <LogOut color="#ef4444" size={20} />
            <Text className="text-red-500 font-bold text-base">
              {tr('साइन आउट', 'سائن آؤٹ', 'Sign Out')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* KYC Update Modal */}
      <KycUpdateModal
        visible={kycModalVisible}
        user={activeUser}
        onClose={() => setKycModalVisible(false)}
        onUpdated={(updated) => {
          handleUpdateActiveUser(updated);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </View>
  );
}
