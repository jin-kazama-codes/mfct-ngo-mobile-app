import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { getTestimonials } from '../../src/services/testimonialService';
import { Testimonial } from '../../src/types';
import { Quote, Sparkles, MessageSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

// Theme-adaptive Story Card Skeleton
function StoryCardSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Quote Icon Skeleton */}
      <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 mb-3 animate-pulse" />

      {/* Quote Text Lines Skeleton */}
      <View className="space-y-2 mb-4">
        <View className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <View className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <View className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
      </View>

      {/* Author Profile Skeleton */}
      <View className="flex-row items-center pt-3 border-t border-slate-100 dark:border-slate-800">
        <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse mr-3" />
        <View className="space-y-1.5 flex-1">
          <View className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <View className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        </View>
      </View>
    </View>
  );
}

export default function ImpactStoriesScreen() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data || []);
    } catch (err) {
      console.warn('Error loading testimonials:', err);
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

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
      }
    >
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row items-center self-start bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1 rounded-full mb-2">
          <Sparkles color="#059669" size={13} />
          <Text className="text-emerald-800 dark:text-emerald-300 text-[11px] font-bold ml-1.5">
            Real Voices & Direct Beneficiaries
          </Text>
        </View>

        <Text className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Community Impact Stories
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-4">
          Heartfelt testimonials and verified stories of relief, education, and medical support across our member network.
        </Text>
      </View>

      {/* Skeletons on initial load */}
      {loading ? (
        <View className="mt-2">
          <StoryCardSkeleton />
          <StoryCardSkeleton />
          <StoryCardSkeleton />
        </View>
      ) : testimonials.length === 0 ? (
        <View className="items-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 my-4">
          <MessageSquare color="#94a3b8" size={48} />
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-3">
            No testimonials published yet
          </Text>
        </View>
      ) : (
        <View className="mt-2">
          {testimonials.map((item) => (
            <View
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 mb-4 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <View className="mb-3 flex-row items-center justify-between">
                <View className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/80 items-center justify-center">
                  <Quote color="#059669" size={16} />
                </View>
                {item.city && (
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {item.city}
                  </Text>
                )}
              </View>

              <Text className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-6 italic mb-4">
                "{item.quote}"
              </Text>

              <View className="flex-row items-center pt-3.5 border-t border-slate-100 dark:border-slate-800">
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    className="w-10 h-10 rounded-full mr-3 border border-emerald-500/30"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-full bg-emerald-700 items-center justify-center mr-3 shadow-sm">
                    <Text className="text-white font-bold text-sm">
                      {item.name?.charAt(0)?.toUpperCase() || 'M'}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-white font-bold text-sm leading-4">
                    {item.name}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    {item.role || 'Member Beneficiary'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
