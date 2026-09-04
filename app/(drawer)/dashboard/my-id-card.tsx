import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import { ShieldCheck, CheckCircle, Sparkles, Building2, QrCode } from 'lucide-react-native';

export default function MyIdCardScreen() {
  const { activeUser } = useAppState();

  const isPremium = activeUser?.isPremium || activeUser?.role === 'premium_donor';
  const memberId = activeUser?.membershipId || 'SS-BAR-2024-7185';
  const joinDate = activeUser?.joinDate || '13 Aug 2026';
  const communityName = activeUser?.communityName || 'Bareilly Central Care Society (Headquarters)';

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Top Header Badge */}
      <View className="items-center mb-6">
        <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 mb-2">
          <ShieldCheck color="#10b981" size={16} />
          <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">Government Recognized NGO Card</Text>
        </View>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Digital Membership Card</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Official MFCT Community ID</Text>
      </View>

      {/* Digital Membership Card View */}
      <View
        className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
          isPremium
            ? 'bg-gradient-to-br from-amber-900 via-amber-950 to-slate-950 border-amber-400/40'
            : 'bg-slate-900 border-emerald-500/30'
        }`}
      >
        {/* Header Strip inside card */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-xl bg-emerald-600 items-center justify-center">
              <Text className="text-white font-bold text-xl">M</Text>
            </View>
            <View>
              <Text className="font-bold text-base text-white">MFCT</Text>
              <Text className="text-[10px] text-slate-300 uppercase tracking-wider font-medium">Community Network</Text>
            </View>
          </View>

          {isPremium ? (
            <View className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30">
              <Sparkles color="#fcd34d" size={12} />
              <Text className="text-amber-300 text-xs font-bold">Premium Gold Member</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
              <CheckCircle color="#34d399" size={12} />
              <Text className="text-emerald-300 text-xs font-bold">Verified Member</Text>
            </View>
          )}
        </View>

        {/* User Info inside card */}
        <View className="flex-row items-center gap-4 mb-6">
          <Image
            source={{ uri: activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }}
            className="w-16 h-16 rounded-2xl border-2 border-white/20"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text className="font-bold text-lg text-white" numberOfLines={1}>{activeUser?.name || 'User'}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Building2 color="#34d399" size={12} />
              <Text className="text-xs text-slate-300 flex-1" numberOfLines={1}>{communityName}</Text>
            </View>
            <Text className="text-xs text-slate-400 mt-0.5">
              {activeUser?.city || 'Bareilly'}, {activeUser?.state || 'UP'}
            </Text>
          </View>
        </View>

        {/* Card Footer Details */}
        <View className="pt-4 border-t border-white/10 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] uppercase text-slate-400 tracking-wider">Member ID</Text>
            <Text className="font-mono font-bold text-emerald-300 text-sm mt-0.5">{memberId}</Text>
          </View>

          <View>
            <Text className="text-[10px] uppercase text-slate-400 tracking-wider">Member Since</Text>
            <Text className="font-semibold text-slate-200 text-xs mt-0.5">{joinDate}</Text>
          </View>

          <View className="bg-white p-1.5 rounded-lg">
            <QrCode color="#0f172a" size={28} />
          </View>
        </View>
      </View>

      {/* Info Card */}
      <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mt-6 gap-2">
        <Text className="text-slate-900 dark:text-white font-bold text-sm">Identity Verification</Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs leading-5">
          This digital identity card confirms your active membership with Muslim Family Care Trust (MFCT). You can present this QR code during community events, meetings, and donation drives for official verification.
        </Text>
      </View>
    </ScrollView>
  );
}
