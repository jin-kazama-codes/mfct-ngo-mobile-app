import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { getDonations } from '../../../src/services/donationService';
import { useAppState } from '../../../src/context/AppStateProvider';
import { Donation } from '../../../src/types';
import { CreditCard } from 'lucide-react-native';

export default function FinancialScreen() {
  const { activeUser } = useAppState();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDonations(activeUser?.id).then(setDonations).finally(() => setLoading(false));
  }, [activeUser]);

  const totalVerified = donations.filter(d => d.status === 'verified').reduce((a, d) => a + d.amountINR, 0);

  if (loading) return <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950"><ActivityIndicator color="#10b981" /></View>;

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      <View className="bg-emerald-500 rounded-2xl p-5 mb-4 items-center">
        <CreditCard color="#fff" size={32} />
        <Text className="text-white text-2xl font-bold mt-2">₹{totalVerified.toLocaleString()}</Text>
        <Text className="text-white/80 text-sm mt-1">Total Verified Donations</Text>
      </View>

      <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">All Transactions ({donations.length})</Text>
      {donations.length === 0 ? (
        <Text className="text-center text-slate-500 dark:text-slate-400 py-10">No donations yet</Text>
      ) : donations.map(d => (
        <View key={d.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2">
          <View className="flex-row justify-between items-start">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white flex-1 mr-2" numberOfLines={1}>{d.campaignTitle || 'General Donation'}</Text>
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{d.amountINR.toLocaleString()}</Text>
          </View>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.category} • {d.paymentMethod}</Text>
          {d.utrNumber && <Text className="text-xs text-slate-400 mt-0.5">UTR: {d.utrNumber}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
