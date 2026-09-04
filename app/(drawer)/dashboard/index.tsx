import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getDonations } from '../../../src/services/donationService';
import { getCampaigns } from '../../../src/services/campaignService';
import { getUsers } from '../../../src/services/userService';
import { getCommunities } from '../../../src/services/communityService';
import { Campaign, Donation, User, UserRole, Community } from '../../../src/types';
import {
  Building2, Activity, TrendingUp, Heart, ShieldCheck, Users,
  CreditCard, Award, Star, Shield, UserCheck, Clock, Flame, ArrowRight
} from 'lucide-react-native';

export default function DashboardIndex() {
  const router = useRouter();
  const { currentRole, activeUser, campaignsList } = useAppState();
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [communityCampaigns, setCommunityCampaigns] = useState<Campaign[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const rawRole = (activeUser?.role || currentRole || 'member') as string;
  let userRole = rawRole.toLowerCase().trim().replace(/ /g, '_') as UserRole;
  if (userRole.includes('executive')) userRole = 'executive_admin';
  else if (userRole.includes('community')) userRole = 'community_admin';
  else if (userRole.includes('super')) userRole = 'super_admin';
  else if (userRole.includes('premium')) userRole = 'premium_donor';
  else if (userRole.includes('member')) userRole = 'member';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (userRole === 'member' || userRole === 'premium_donor') {
          const myDons = await getDonations(activeUser?.id);
          setDonations(myDons);
        } else if (userRole === 'community_admin') {
          const [myDons, cCamps] = await Promise.all([
            getDonations(),
            activeUser?.communityId ? getCampaigns({ communityId: activeUser.communityId }) : Promise.resolve([]),
          ]);
          setDonations(myDons);
          setCommunityCampaigns(cCamps);
        } else {
          // Executive / Super Admin
          const [allDons, usersList, commList] = await Promise.all([
            getDonations(),
            getUsers(),
            getCommunities(),
          ]);
          setDonations(allDons);
          setAllUsers(usersList);
          setCommunities(commList);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeUser, userRole]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  // ----------------------------------------------------
  // 1. MEMBER / PREMIUM DONOR DASHBOARD
  // ----------------------------------------------------
  if (userRole === 'member' || userRole === 'premium_donor') {
    const verifiedDonations = donations.filter(d => d.status === 'verified');
    const totalDonatedINR = verifiedDonations.reduce((acc, d) => acc + d.amountINR, 0);

    return (
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
        {/* User Card */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-full bg-emerald-500 items-center justify-center">
            {activeUser?.avatar ? (
              <Image source={{ uri: activeUser.avatar }} className="w-14 h-14 rounded-full" />
            ) : (
              <Text className="text-white font-bold text-xl">{activeUser?.name?.[0]?.toUpperCase() || 'U'}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">{activeUser?.name || 'User'}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">{activeUser?.email || ''}</Text>
            <View className="flex-row items-center gap-2 mt-1.5">
              <View className={`px-2.5 py-0.5 rounded-full ${userRole === 'premium_donor' ? 'bg-amber-100 dark:bg-amber-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
                <Text className={`text-xs font-bold ${userRole === 'premium_donor' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  {userRole === 'premium_donor' ? '⭐ Premium Donor' : '👤 Member / Volunteer'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Membership Details */}
        {activeUser?.membershipId && (
          <View className="bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-400">Membership ID</Text>
              <Text className="text-emerald-400 font-bold text-base mt-0.5">{activeUser.membershipId}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-slate-400">Community</Text>
              <Text className="text-white font-medium text-xs mt-0.5" numberOfLines={1}>{activeUser.communityName || 'Bareilly Central'}</Text>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Heart color="#ef4444" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total Donated</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{totalDonatedINR.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CreditCard color="#10b981" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Donations</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{donations.length}</Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          className="bg-emerald-500 p-4 rounded-2xl flex-row items-center justify-between mb-4"
          onPress={() => router.push('/(tabs)/campaigns')}
        >
          <View className="flex-row items-center gap-3">
            <Heart color="#fff" size={22} />
            <View>
              <Text className="text-white font-bold text-base">Make a Donation</Text>
              <Text className="text-white/80 text-xs">Support active verified campaigns</Text>
            </View>
          </View>
          <ArrowRight color="#fff" size={20} />
        </TouchableOpacity>

        {/* Recent Transactions */}
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">Recent Receipts</Text>
        {donations.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 items-center">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">No donations recorded yet</Text>
          </View>
        ) : (
          donations.slice(0, 5).map(d => (
            <View key={d.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-2 flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>{d.campaignTitle || 'General Donation'}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.category} • {d.paymentMethod}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{d.amountINR.toLocaleString()}</Text>
                <Text className={`text-xs font-medium ${d.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{d.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ----------------------------------------------------
  // 2. COMMUNITY ADMIN DASHBOARD
  // ----------------------------------------------------
  if (userRole === 'community_admin') {
    const totalCommunityRaised = communityCampaigns.reduce((acc, c) => acc + c.raisedINR, 0);

    return (
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Community Administration</Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{activeUser?.communityName || 'Bareilly Central'}</Text>
            </View>
            <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              <Text className="text-blue-700 dark:text-blue-300 text-xs font-bold">Community Admin</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="gap-3 mb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Activity color="#10b981" size={22} />
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active Campaigns</Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{communityCampaigns.length}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <TrendingUp color="#3b82f6" size={22} />
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total Raised</Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{(totalCommunityRaised / 1000).toFixed(0)}K</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck color="#8b5cf6" size={22} />
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Verified Desk</Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{donations.filter(d => d.status === 'verified').length}</Text>
            </View>
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Award color="#f59e0b" size={22} />
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Health Score</Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">95%</Text>
            </View>
          </View>
        </View>

        {/* Community Campaigns */}
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">Community Campaigns</Text>
        {communityCampaigns.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 items-center">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">No active community campaigns</Text>
          </View>
        ) : (
          communityCampaigns.map(c => (
            <View key={c.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-2">
              <Text className="font-bold text-slate-900 dark:text-white text-sm" numberOfLines={1}>{c.title}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.category}</Text>
              <View className="flex-row justify-between items-center mt-3">
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">₹{c.raisedINR.toLocaleString()} raised</Text>
                <Text className="text-xs text-slate-400">Goal: ₹{c.goalINR.toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // ----------------------------------------------------
  // 3. EXECUTIVE & SUPER ADMIN DASHBOARD
  // ----------------------------------------------------
  const totalPlatformRaised = campaignsList.reduce((acc, c) => acc + c.raisedINR, 0);
  const pendingApprovals = campaignsList.filter(c => c.status === 'pending_approval');

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Super Admin Header */}
      <View className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Management Desk</Text>
            <Text className="text-2xl font-bold text-white mt-0.5">{activeUser?.name || 'Admin'}</Text>
          </View>
          <View className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full">
            <Text className="text-emerald-400 text-xs font-bold">
              {userRole === 'super_admin' ? '⚡ Super Admin' : '🛡️ Executive Admin'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="gap-3 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Users color="#3b82f6" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total Users</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{allUsers.length}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Building2 color="#8b5cf6" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Communities</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{communities.length}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <TrendingUp color="#10b981" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Platform Raised</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{(totalPlatformRaised / 100000).toFixed(1)}L</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Activity color="#f59e0b" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">Active Campaigns</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{campaignsList.length}</Text>
          </View>
        </View>
      </View>

      {/* Pending Queue Summary */}
      {pendingApprovals.length > 0 && (
        <View className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
          <View>
            <Text className="font-bold text-amber-900 dark:text-amber-200 text-sm">Approvals Pending</Text>
            <Text className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{pendingApprovals.length} campaigns awaiting verification</Text>
          </View>
          <ShieldCheck color="#f59e0b" size={24} />
        </View>
      )}

      {/* Recent Platform Activity */}
      <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">Recent Platform Transactions</Text>
      {donations.slice(0, 5).map(d => (
        <View key={d.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-2 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>{d.donorName || 'Donor'}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.campaignTitle || 'General'} • {d.category}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{d.amountINR.toLocaleString()}</Text>
            <Text className={`text-xs ${d.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{d.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
