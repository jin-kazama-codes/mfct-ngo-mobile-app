import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCampaigns, getEmergencyCampaigns } from '../../src/services/campaignService';
import { Campaign } from '../../src/types';
import { Search, Heart, Clock, Flame, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateCategory,
  translateCity,
  translateCommunityName,
  translateCampaignTitle,
} from '../../src/lib/translateEntity';
import DynamicText from '../../src/components/DynamicText';

const CATEGORIES = ['All', 'Urgent', 'Zakat', 'Sadqa', 'Fitra', 'Medical', 'Education', 'Food', 'Marriage', 'Janazah', 'Emergency Relief'];

// Theme-adaptive Campaign Card Skeleton
function CampaignCardSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 mb-3 shadow-sm">
      {/* Image Skeleton */}
      <View className="w-full h-44 bg-slate-200 dark:bg-slate-800 animate-pulse" />

      <View className="p-4 space-y-2.5">
        {/* Category & Location Skeleton */}
        <View className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mb-1" />

        {/* Title Lines Skeleton */}
        <View className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <View className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mb-1" />

        {/* Community subtitle Skeleton */}
        <View className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mb-2" />

        {/* Progress Bar Skeleton */}
        <View className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-2" />

        {/* Amount & Time Row Skeleton */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <View className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        </View>

        {/* Action Buttons Skeleton */}
        <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <View className="flex-1 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <View className="flex-1 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </View>
      </View>
    </View>
  );
}

export default function CampaignsScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadData = useCallback(async () => {
    try {
      const [regular, emergency] = await Promise.all([getCampaigns(), getEmergencyCampaigns()]);
      setCampaigns([...regular, ...emergency]);
    } catch (err) {
      console.warn('Error loading campaigns:', err);
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

  const filtered = campaigns.filter((c) => {
    const tTitle = translateCampaignTitle(c.title, lang);
    const tComm = translateCommunityName(c.communityName, lang);
    const tCity = translateCity(c.city, lang);

    const matchSearch =
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      tTitle.toLowerCase().includes(search.toLowerCase()) ||
      (c.communityName || '').toLowerCase().includes(search.toLowerCase()) ||
      tComm.toLowerCase().includes(search.toLowerCase()) ||
      (c.beneficiaryName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
      tCity.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      selectedCategory === 'All' ||
      (selectedCategory === 'Urgent'
        ? c.isUrgent
        : selectedCategory === 'Zakat'
        ? c.isZakatEligible
        : selectedCategory === 'Sadqa'
        ? c.isSadqaEligible
        : selectedCategory === 'Fitra'
        ? c.isFitrahEligible
        : c.category === selectedCategory);
    return matchSearch && matchCat;
  });

  const progress = (c: Campaign) => Math.min((c.raisedINR / c.goalINR) * 100, 100);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Search Bar */}
      <View className="bg-white dark:bg-slate-900 px-4 pb-3 pt-2 border-b border-slate-200 dark:border-slate-800">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 gap-2">
          <Search color="#94a3b8" size={18} />
          <TextInput
            className="flex-1 text-slate-900 dark:text-white text-sm"
            placeholder={t('campaigns.search_placeholder', 'Search campaigns by cause or area...')}
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Chips */}
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full border self-center ${
                selectedCategory === cat
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {translateCategory(cat, lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content / Skeleton View */}
      {loading ? (
        <ScrollView className="flex-1 p-3" showsVerticalScrollIndicator={false}>
          <CampaignCardSkeleton />
          <CampaignCardSkeleton />
          <CampaignCardSkeleton />
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
        >
          {filtered.length === 0 ? (
            <View className="items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 my-4">
              <Text className="text-slate-500 dark:text-slate-400 text-base font-semibold">
                {t('campaigns.no_results', 'No campaigns found')}
              </Text>
            </View>
          ) : (
            filtered.map((campaign) => {
              const displayTitle = translateCampaignTitle(campaign.title, lang);
              const displayCat = translateCategory(campaign.category, lang);
              const displayComm = translateCommunityName(campaign.communityName, lang);
              const displayCity = translateCity(campaign.city, lang);

              return (
                <View
                  key={campaign.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  {/* Image */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: '/(stacks)/campaign-details',
                        params: { id: campaign.id },
                      })
                    }
                    className="relative"
                  >
                    <Image
                      source={{ uri: campaign.mainImage }}
                      className="w-full h-44"
                      resizeMode="cover"
                    />
                    <View className="absolute top-2 left-2 flex-row flex-wrap gap-1">
                      {campaign.isUrgent && (
                        <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                          <Flame color="#fff" size={12} />
                          <Text className="text-white text-xs font-bold">{translateCategory('Urgent', lang)}</Text>
                        </View>
                      )}
                      {campaign.isZakatEligible && (
                        <View className="bg-emerald-500 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-xs font-bold">{translateCategory('Zakat', lang)}</Text>
                        </View>
                      )}
                      {campaign.isSadqaEligible && (
                        <View className="bg-teal-600 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-xs font-bold">{translateCategory('Sadqa', lang)}</Text>
                        </View>
                      )}
                      {campaign.isFitrahEligible && (
                        <View className="bg-amber-600 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-xs font-bold">{translateCategory('Fitra', lang)}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Content */}
                  <View className="p-4">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">{displayCat}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(stacks)/campaign-details',
                          params: { id: campaign.id },
                        })
                      }
                    >
                      <DynamicText
                        text={campaign.title}
                        lang={lang}
                        fallback={displayTitle}
                        className="text-base font-bold text-slate-900 dark:text-white mb-1"
                        numberOfLines={2}
                      />
                    </TouchableOpacity>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <DynamicText text={campaign.communityName} lang={lang} fallback={displayComm} />
                      {campaign.city ? ' • ' : ''}
                      {campaign.city ? <DynamicText text={campaign.city} lang={lang} fallback={displayCity} /> : null}
                    </Text>

                    {/* Progress Bar */}
                    <View className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
                      <View
                        className="bg-emerald-500 rounded-full h-2"
                        style={{ width: `${progress(campaign)}%` }}
                      />
                    </View>

                    <View className="flex-row justify-between items-center mb-3">
                      <View>
                        <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                          ₹{campaign.raisedINR.toLocaleString('en-IN')}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {t('home.raised_of', 'of')} ₹{campaign.goalINR.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Clock color="#94a3b8" size={12} />
                        <Text className="text-xs text-slate-500 font-semibold">{campaign.daysLeft}{t('campaigns.days_left', 'd left')}</Text>
                      </View>
                    </View>

                    {/* Two Buttons: Details & Donate Now */}
                    <View className="flex-row items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/(stacks)/campaign-details',
                            params: { id: campaign.id },
                          })
                        }
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700"
                      >
                        <Text className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                          {t('common.details', 'Details')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: '/(stacks)/donation',
                            params: { campaignId: campaign.id, initialCategory: campaign.category },
                          })
                        }
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 items-center justify-center flex-row shadow-sm"
                      >
                        <Heart color="#ffffff" size={13} fill="#ffffff" />
                        <Text className="text-white font-bold text-xs ml-1.5">
                          {t('home.donate_now', 'Donate Now')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
