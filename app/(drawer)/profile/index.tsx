import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building2,
  IdCardLanyard,
  ShieldCheck,
  LogOut,
  Globe,
  Sun,
  Moon,
  ExternalLink,
  CheckCircle2,
  Award,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLanguageCode,
  translateRole,
  translateDistrictRole,
  translateCommunityName,
  translateCity,
  translateState,
} from '../../../src/lib/translateEntity';

export default function ProfileScreen() {
  const { handleLogout, activeUser, currentRole } = useAppState();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
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
    } catch {}
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

  // Available options without current language
  const availableLanguages = ALL_LANGUAGES.filter((item) => item.code !== currentLang);

  const handleSelectLanguage = async (next: string) => {
    i18n.changeLanguage(next);
    try {
      await AsyncStorage.setItem('mfct_language', next);
    } catch {}
  };

  const rawRole = activeUser?.role || currentRole || 'member';
  const roleName = translateRole(rawRole, currentLang as any);
  const commName = translateCommunityName(activeUser?.communityName || 'Bareilly Central Care Society (Headquarters)', currentLang as any);
  const cityName = translateCity(activeUser?.city || 'Bareilly', currentLang as any);
  const stateName = translateState(activeUser?.state || 'UP', currentLang as any);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <View
        className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        style={{ paddingTop: Platform.OS === 'ios' ? 52 : 42 }}
      >
        <Text className="text-xl font-bold text-slate-900 dark:text-white">{t('profile_page.title', 'My Profile')}</Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">{t('profile_page.subtitle', 'Manage account & preferences')}</Text>
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
                source={{ uri: activeUser.avatar }}
                className="w-24 h-24 rounded-full border-2 border-emerald-500"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 justify-center items-center">
                <UserCircle color="#10b981" size={56} />
              </View>
            )}
            {activeUser?.isVerified && (
              <View className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-slate-900">
                <CheckCircle2 color="#ffffff" size={16} />
              </View>
            )}
          </View>

          <Text className="text-xl font-bold text-slate-900 dark:text-white text-center">
            {activeUser?.name || 'MFCT Member'}
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
                {activeUser?.district || activeUser?.city ? ` • ${activeUser?.district || activeUser?.city}` : ''}
              </Text>
            </View>
          ) : null}

          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            ID: {activeUser?.membershipId || 'MEM-2024-001'}
          </Text>
        </View>

        {/* Membership ID Card Action Banner */}
        <TouchableOpacity
          className="bg-emerald-600 dark:bg-emerald-700 p-4 rounded-2xl flex-row items-center justify-between mb-5 shadow-sm"
          onPress={() => router.push('/(drawer)/dashboard/my-id-card')}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <IdCardLanyard color="#ffffff" size={22} />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Digital ID Card</Text>
              <Text className="text-emerald-100 text-xs">View official membership badge</Text>
            </View>
          </View>
          <ExternalLink color="#ffffff" size={18} />
        </TouchableOpacity>

        {/* Account Details Card */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Contact & Community Info
          </Text>

          {activeUser?.email ? (
            <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Mail color="#10b981" size={18} />
              <View className="flex-1">
                <Text className="text-xs text-slate-400">Email Address</Text>
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
                <Text className="text-xs text-slate-400">Phone Number</Text>
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {activeUser.phone}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <Building2 color="#10b981" size={18} />
            <View className="flex-1">
              <Text className="text-xs text-slate-400">Assigned Community</Text>
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {commName}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 py-2.5">
            <MapPin color="#10b981" size={18} />
            <View className="flex-1">
              <Text className="text-xs text-slate-400">Location</Text>
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {cityName}, {stateName}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Card */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-3xl mb-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
            App Preferences
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800"
            onPress={handleToggleTheme}
          >
            <View className="flex-row items-center gap-3">
              {isDark ? <Moon color="#10b981" size={18} /> : <Sun color="#10b981" size={18} />}
              <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Appearance
              </Text>
            </View>
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </TouchableOpacity>

          <View className="py-3">
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="flex-row items-center gap-3">
                <Globe color="#10b981" size={18} />
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Language / भाषा / زبان
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
        </View>

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            className="flex-row bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-2xl justify-center items-center border border-emerald-200 dark:border-emerald-800 gap-2"
            onPress={() => router.replace('/(tabs)')}
          >
            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              Back to Public Website
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row bg-red-50 dark:bg-red-950/60 p-4 rounded-2xl justify-center items-center border border-red-200 dark:border-red-900 gap-2"
            onPress={onLogout}
          >
            <LogOut color="#ef4444" size={20} />
            <Text className="text-red-500 font-bold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
