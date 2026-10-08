import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { getRecentDonations } from '../../../src/services/donationService';
import { Donation } from '../../../src/types';
import { TrendingUp, FileCheck, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { FinancialAnalyticsSkeleton } from '../../../src/components/SkeletonLoader';
import {
  getLanguageCode,
  translateCategory,
  translateDonorName,
  translateStatus,
  translateRole,
  translateRoleResponsibility,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

export default function FinancialAnalyticsScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
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
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <FinancialAnalyticsSkeleton isDark={isDark} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Official Responsibilities Banner for District Finance Coordinator */}
      <View className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-amber-500 items-center justify-center">
              <FileCheck color="#fff" size={18} />
            </View>
            <View>
              <Text className="text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                {translateRole('district_finance_coord', lang)}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'hi' ? 'आधिकारिक कार्यक्षेत्र एवं दायित्व' : lang === 'ur' ? 'سرکاری ورک اسپیس اور ذمہ داری' : 'Official Mandate & Responsibilities'}
              </Text>
            </View>
          </View>
          <View className="bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
            <Text className="text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              {lang === 'hi' ? 'दस्तावेजी सत्यापन' : lang === 'ur' ? 'دستاویزی تصدیق' : 'Documentary Audit'}
            </Text>
          </View>
        </View>

        <View className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-amber-200 dark:border-amber-900/50">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {lang === 'hi' ? 'प्रमुख जिम्मेदारी:' : lang === 'ur' ? 'اہم ذمہ داری:' : 'Key Responsibility:'}
          </Text>
          <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-5">
            {translateRoleResponsibility('district_finance_coord', lang)}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-4">
            {lang === 'hi'
              ? 'आधिकारिक लेन-देन, यूटीआर बैंक सत्यापन और वित्तीय बहीखाता प्रविष्टियों का पूर्ण दस्तावेजी संधारण।'
              : lang === 'ur'
              ? 'سرکاری لین دین، UTR بینک تصدیق اور مالیاتی کھاتہ جات کا مکمل دستاویزی اندراج۔'
              : 'End-to-end documentary maintenance of official transactions, UTR bank validations, and financial audit registers.'}
          </Text>
        </View>
      </View>

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
