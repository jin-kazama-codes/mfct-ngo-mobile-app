import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCommunities } from '../../src/services/communityService';
import { useAppState } from '../../src/context/AppStateProvider';
import { Community } from '../../src/types';
import {
  Users,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Building2,
  Search,
  CheckCircle2,
  ArrowRight,
  UserPlus,
} from 'lucide-react-native';

// Theme-aware Card Skeleton Component
function CommunityCardSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-5">
      {/* Cover Image Skeleton */}
      <View className="w-full h-40 bg-slate-200 dark:bg-slate-800 animate-pulse" />

      <View className="p-5 space-y-3">
        {/* Description Skeleton */}
        <View className="space-y-1.5 mb-2">
          <View className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <View className="w-4/5 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        </View>

        {/* Stats Rows Skeleton */}
        <View className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <View className="flex-row justify-between">
            <View className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <View className="w-28 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </View>
          <View className="flex-row justify-between">
            <View className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <View className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </View>
          <View className="flex-row justify-between">
            <View className="w-32 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <View className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </View>
          <View className="flex-row justify-between">
            <View className="w-28 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <View className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </View>
        </View>

        {/* Button Skeleton */}
        <View className="w-full h-11 bg-slate-200 dark:bg-slate-800 rounded-xl mt-2 animate-pulse" />
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, activeUser } = useAppState();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await getCommunities();
      setCommunities(data || []);
    } catch (err) {
      console.warn('Error loading communities:', err);
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

  const filteredCommunities = communities.filter((comm) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      comm.name.toLowerCase().includes(query) ||
      comm.city.toLowerCase().includes(query) ||
      (comm.state && comm.state.toLowerCase().includes(query)) ||
      (comm.adminName && comm.adminName.toLowerCase().includes(query))
    );
  });

  const handleJoinCommunity = (comm: Community) => {
    if (isAuthenticated) {
      if (activeUser?.communityId === comm.id) {
        router.push('/(drawer)/dashboard');
      } else {
        router.push({
          pathname: '/(auth)/sign-up',
          params: { communityId: comm.id },
        });
      }
    } else {
      router.push({
        pathname: '/(auth)/sign-up',
        params: { communityId: comm.id },
      });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
      }
    >
      {/* Header Section */}
      <View className="mb-5">
        <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('communities_page.title')}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-4 font-normal">
          {t('communities_page.desc')}
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 mt-4 shadow-sm">
          <Search color="#94a3b8" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('communities_page.search_placeholder')}
            placeholderTextColor="#94a3b8"
            className="flex-1 text-xs text-slate-900 dark:text-white ml-2 font-medium"
          />
        </View>
      </View>

      {/* Skeletons on initial load */}
      {loading ? (
        <View>
          <CommunityCardSkeleton />
          <CommunityCardSkeleton />
          <CommunityCardSkeleton />
        </View>
      ) : filteredCommunities.length === 0 ? (
        <View className="py-16 items-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <Building2 color="#94a3b8" size={40} />
          <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mt-3">
            {t('communities_page.empty')}
          </Text>
        </View>
      ) : (
        <View>
          {filteredCommunities.map((comm) => {
            const isUserInComm = isAuthenticated && activeUser?.communityId === comm.id;

            return (
              <View
                key={comm.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-5"
              >
                {/* Cover Image & Gradient */}
                <View className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    source={{
                      uri:
                        comm.coverImage ||
                        'https://images.unsplash.com/photo-1593113563332-e147ce367df0?q=80&w=400&auto=format&fit=crop',
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/40" />

                  {/* Top Right Badges */}
                  <View className="absolute top-3 right-3 flex-row gap-1.5">
                    {isUserInComm && (
                      <View className="bg-emerald-600 px-2.5 py-1 rounded-full flex-row items-center shadow-md">
                        <CheckCircle2 color="#ffffff" size={12} />
                        <Text className="text-white text-[10px] font-extrabold ml-1">
                          {t('communities_page.your_comm_badge')}
                        </Text>
                      </View>
                    )}
                    <View className="bg-slate-950/70 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                      <Text className="text-emerald-300 text-[10px] font-bold">
                        {comm.verifiedStatus || 'Verified'}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Image Info */}
                  <View className="absolute bottom-3 left-4 right-4">
                    <View className="flex-row items-center mb-0.5">
                      <MapPin color="#34d399" size={13} />
                      <Text className="text-emerald-300 font-bold text-xs ml-1">
                        {comm.city}, {comm.state}
                      </Text>
                    </View>
                    <Text className="font-extrabold text-lg text-white leading-5" numberOfLines={1}>
                      {comm.name}
                    </Text>
                  </View>
                </View>

                {/* Body Content */}
                <View className="p-5 space-y-4">
                  <Text className="text-xs text-slate-600 dark:text-slate-300 leading-5">
                    {comm.description || 'Dedicated local welfare and charity coordination community.'}
                  </Text>

                  {/* Metrics List */}
                  <View className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('communities_page.admin')}
                      </Text>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {comm.adminName || 'Bareilly Central Board'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('communities_page.active_members')}
                      </Text>
                      <Text className="text-xs font-black text-slate-900 dark:text-white">
                        {comm.totalMembers?.toLocaleString('en-IN') || '0'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('communities_page.total_disbursed')}
                      </Text>
                      <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{comm.totalRaisedINR?.toLocaleString('en-IN') || '0'}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {t('communities_page.health')}
                      </Text>
                      <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {comm.healthScore || 92}% {t('communities_page.grade_a')}
                      </Text>
                    </View>
                  </View>

                  {/* Join Community Button */}
                  <TouchableOpacity
                    onPress={() => handleJoinCommunity(comm)}
                    className={`w-full py-3 rounded-xl items-center justify-center flex-row shadow-sm ${
                      isUserInComm
                        ? 'bg-emerald-600 dark:bg-emerald-700'
                        : 'bg-slate-900 dark:bg-slate-800'
                    }`}
                  >
                    {isUserInComm ? (
                      <>
                        <CheckCircle2 color="#ffffff" size={15} />
                        <Text className="text-white font-black text-xs ml-2">
                          {t('communities_page.active_member_btn')}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Users color="#34d399" size={15} />
                        <Text className="text-white font-black text-xs ml-2">
                          {t('communities_page.join_btn')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Membership Banner (₹50) */}
      <View className="bg-slate-900 p-6 rounded-3xl border border-emerald-800/60 shadow-md my-4">
        <View className="self-start px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
          <Text className="text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
            ₹50 Annual Membership
          </Text>
        </View>

        <Text className="text-lg font-black text-white mb-2">
          {t('communities_page.membership_title')}
        </Text>

        <Text className="text-slate-300 text-xs leading-5 mb-4">
          {t('communities_page.membership_desc')}
        </Text>

        <View className="space-y-2 mb-5">
          <View className="flex-row items-center">
            <CheckCircle2 color="#34d399" size={15} />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              Instant Verified Digital Member ID Card
            </Text>
          </View>
          <View className="flex-row items-center">
            <CheckCircle2 color="#34d399" size={15} />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              Emergency Financial & Medical Aid Eligibility
            </Text>
          </View>
          <View className="flex-row items-center">
            <CheckCircle2 color="#34d399" size={15} />
            <Text className="text-slate-200 text-xs font-semibold ml-2">
              Verified Aadhaar KYC & Transparency
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/sign-up')}
          className="w-full py-3.5 bg-emerald-500 rounded-xl items-center justify-center flex-row shadow-lg"
        >
          <UserPlus color="#022c22" size={16} />
          <Text className="text-emerald-950 font-black text-xs ml-2">
            {t('communities_page.membership_btn')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
