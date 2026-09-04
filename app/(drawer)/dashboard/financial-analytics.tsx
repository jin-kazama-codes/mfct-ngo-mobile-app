import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { getRecentDonations } from '../../../src/services/donationService';
import { Donation } from '../../../src/types';
import { TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateCategory,
  translateDonorName,
  translateStatus,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

export default function FinancialAnalyticsScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentDonations(50).then(setDonations).finally(() => setLoading(false));
  }, []);

  const total = donations.filter(d => d.status === 'verified').reduce((a, d) => a + d.amountINR, 0);
  const pending = donations.filter(d => d.status === 'pending_verification').reduce((a, d) => a + d.amountINR, 0);
  const byCategory = donations.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = 0;
    acc[d.category] += d.amountINR;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Summary Cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-emerald-500 rounded-2xl p-4">
          <TrendingUp color="#fff" size={20} />
          <Text className="text-white text-xl font-bold mt-2">₹{(total / 1000).toFixed(1)}K</Text>
          <Text className="text-white/80 text-xs mt-0.5">{t('home.funds_disbursed', 'Verified Funds')}</Text>
        </View>
        <View className="flex-1 bg-amber-500 rounded-2xl p-4">
          <TrendingUp color="#fff" size={20} />
          <Text className="text-white text-xl font-bold mt-2">₹{(pending / 1000).toFixed(1)}K</Text>
          <Text className="text-white/80 text-xs mt-0.5">{t('admin.kyc_subtitle', 'Pending Verification')}</Text>
        </View>
      </View>

      {/* By Category */}
      <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
        {t('admin.categoryDistribution', 'By Category')}
      </Text>
      {Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount]) => (
          <View key={cat} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-2 flex-row items-center justify-between">
            <Text className="text-sm text-slate-900 dark:text-white font-medium">{translateCategory(cat, lang)}</Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{amount.toLocaleString()}</Text>
          </View>
        ))
      }

      {/* Recent Transactions */}
      <Text className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-3">
        {t('admin.auditTrail', 'Recent Transactions')}
      </Text>
      {donations.slice(0, 10).map(d => (
        <View key={d.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 mb-2 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <DynamicText
              text={d.donorName || 'Donor'}
              className="text-sm text-slate-900 dark:text-white font-medium"
              numberOfLines={1}
            />
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {translateCategory(d.category, lang)} • {d.utrNumber || d.paymentMethod}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{d.amountINR.toLocaleString()}</Text>
            <Text className={`text-xs ${d.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {translateStatus(d.status, lang)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
