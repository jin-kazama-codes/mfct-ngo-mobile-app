import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getUsers } from '../../../src/services/userService';
import { User } from '../../../src/types';
import { Users, ShieldCheck } from 'lucide-react-native';

export default function CommunityMembersScreen() {
  const { activeUser } = useAppState();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        if (activeUser?.communityId) {
          const data = await getUsers(activeUser.communityId);
          // Filter out top-level admins from directory list
          const filtered = data.filter(
            m => m.role !== 'super_admin' && m.role !== 'executive_admin'
          );
          setMembers(filtered);
        } else {
          const data = await getUsers();
          setMembers(data);
        }
      } catch (err) {
        console.error('Error fetching community members:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [activeUser?.communityId]);

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
          <Text className="text-lg font-bold text-slate-900 dark:text-white">Community Directory</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>
            {activeUser?.communityName || 'Registered Community Members'}
          </Text>
        </View>
        <View className="bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            Total: {members.length}
          </Text>
        </View>
      </View>

      {/* Members List */}
      <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">Verified Members</Text>
      {members.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 items-center">
          <Users color="#94a3b8" size={40} />
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-3">No members found in this community</Text>
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
                <Text className="font-bold text-slate-900 dark:text-white text-sm" numberOfLines={1}>
                  {member.name}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: {member.membershipId || member.id.slice(0, 8)} • {member.city || 'Bareilly'}
                </Text>
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
                {member.isVerified ? '✓ KYC Verified' : 'Pending KYC'}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
