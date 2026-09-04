import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getUsers } from '../../../src/services/userService';
import { User } from '../../../src/types';
import { Users, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateCommunityName,
  translateCity,
  translateRole,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

export default function CommunityMembersScreen() {
  const { activeUser } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await getUsers();
        let filtered = data;
        if (activeUser?.communityId || activeUser?.communityName) {
          filtered = data.filter(
            m =>
              (activeUser.communityId && m.communityId === activeUser.communityId) ||
              (activeUser.communityName && m.communityName?.toLowerCase() === activeUser.communityName.toLowerCase())
          );
        }
        // Filter out top-level admins from directory list
        const cleanMembers = filtered.filter(
          m => m.role !== 'super_admin' && m.role !== 'executive_admin'
        );
        setMembers(cleanMembers);
      } catch (err) {
        console.error('Error fetching community members:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [activeUser?.communityId, activeUser?.communityName]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-bold text-slate-900 dark:text-white">{t('community.directory', 'Community Directory')}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
            {translateCommunityName(activeUser?.communityName || 'Registered Community Members', lang)}
          </Text>
        </View>
        <View className="bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            {t('common.total', 'Total')}: {members.length}
          </Text>
        </View>
      </View>

      {/* Members List */}
      <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">{t('community.verified_members', 'Verified Members')}</Text>
      {members.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 items-center">
          <Users color="#94a3b8" size={40} />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-3">{t('community.no_members', 'No members found in this community')}</Text>
        </View>
      ) : (
        members.map((member) => (
          <View
            key={member.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-2 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              {member.avatar ? (
                <Image source={{ uri: member.avatar }} className="w-10 h-10 rounded-full bg-slate-200" />
              ) : (
                <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 items-center justify-center">
                  <Text className="text-emerald-700 dark:text-emerald-300 font-bold text-base">
                    {member.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <DynamicText
                  text={member.name}
                  className="font-bold text-slate-900 dark:text-white text-sm"
                  numberOfLines={1}
                />
                <View className="flex-row items-center flex-wrap mt-0.5">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {translateRole(member.role || 'member', lang)}{' • '}
                  </Text>
                  <DynamicText
                    text={member.city || 'Bareilly'}
                    className="text-xs text-slate-500 dark:text-slate-400"
                  />
                </View>
              </View>
            </View>

            <View className={`px-2.5 py-0.5 rounded-full border ${
              member.isVerified
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
            }`}>
              <Text className={`text-xs font-bold ${
                member.isVerified
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}>
                {member.isVerified ? `✓ ${t('id_card.verified_badge', 'KYC Verified')}` : t('admin.kyc_subtitle', 'Pending KYC')}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
