import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getDonations } from '../../../src/services/donationService';
import { getCampaigns } from '../../../src/services/campaignService';
import { getUsers, getUnverifiedUsers } from '../../../src/services/userService';
import { getCommunities } from '../../../src/services/communityService';
import { broadcastAnnouncement } from '../../../src/services/adminService';
import { Campaign, Donation, User, UserRole, Community } from '../../../src/types';
import {
  getLanguageCode,
  translateRole,
  translateCategory,
  translateCommunityName,
  translateCampaignTitle,
  translateDonorName,
  translateStatus,
  translateCity,
} from '../../../src/lib/translateEntity';
import {
  Building2, Activity, TrendingUp, Heart, ShieldCheck, Users,
  CreditCard, Award, ArrowRight, BarChart3, PieChart,
  PlusCircle, CheckCircle2, Megaphone, UserCheck, Banknote
} from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useDynamicTranslatedText } from '@/src/lib/autoTranslate';

export default function DashboardIndex() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { currentRole, activeUser, campaignsList } = useAppState();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [communityCampaigns, setCommunityCampaigns] = useState<Campaign[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [pendingKycCount, setPendingKycCount] = useState(0);
  const [pendingUtrCount, setPendingUtrCount] = useState(0);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [loading, setLoading] = useState(true);

  const displayName = useDynamicTranslatedText(activeUser?.name, lang);

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
          const [comms, allDons, allCamps, unverified] = await Promise.all([
            getCommunities(),
            getDonations(),
            getCampaigns(),
            getUnverifiedUsers(),
          ]);

          setCommunities(comms);
          setDonations(allDons);

          // Find active user's community
          let userCommunity: Community | null = null;
          if (activeUser?.communityId) {
            userCommunity = comms.find(c => c.id === activeUser.communityId) || null;
          }
          if (!userCommunity && activeUser?.communityName) {
            userCommunity = comms.find(c =>
              c.name.toLowerCase() === activeUser.communityName.toLowerCase() ||
              c.city.toLowerCase() === activeUser.communityName.toLowerCase()
            ) || null;
          }
          if (!userCommunity && activeUser?.name) {
            userCommunity = comms.find(c => c.adminName?.toLowerCase() === activeUser.name?.toLowerCase()) || null;
          }
          if (!userCommunity && comms.length > 0) {
            userCommunity = comms[0];
          }
          setCommunity(userCommunity);

          const targetCommId = userCommunity?.id || activeUser?.communityId;
          const targetCommName = userCommunity?.name || activeUser?.communityName;

          // Filter campaigns for this community
          const matchedCamps = allCamps.filter(c =>
            (targetCommId && c.communityId === targetCommId) ||
            (targetCommName && c.communityName?.toLowerCase() === targetCommName.toLowerCase()) ||
            (userCommunity?.city && c.city?.toLowerCase() === userCommunity.city.toLowerCase())
          );
          setCommunityCampaigns(matchedCamps);

          // Filter pending KYC users
          const commUnverified = unverified.filter(u =>
            (targetCommId && u.communityId === targetCommId) ||
            (targetCommName && u.communityName?.toLowerCase() === targetCommName.toLowerCase()) ||
            (userCommunity?.city && u.city?.toLowerCase() === userCommunity.city.toLowerCase())
          );
          setPendingKycCount(commUnverified.length);

          // Filter pending UTR donations
          const commPendingUtr = allDons.filter(d =>
            d.status === 'pending_verification' &&
            ((targetCommName && d.communityName?.toLowerCase() === targetCommName.toLowerCase()) ||
              (targetCommId && (d as any).communityId === targetCommId))
          );
          setPendingUtrCount(commPendingUtr.length);

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

  const handleBroadcast = async () => {
    if (!announcementText.trim() || !community) return;
    setBroadcasting(true);
    try {
      await broadcastAnnouncement({
        communityId: community.id,
        communityName: community.name,
        sentBy: community.adminName || activeUser?.name || 'Admin',
        message: announcementText.trim(),
      });
      setAnnouncementSent(true);
      setAnnouncementText('');
      setTimeout(() => {
        setAnnouncementSent(false);
      }, 4000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setBroadcasting(false);
    }
  };

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
                  {translateRole(userRole, lang)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Heart color="#ef4444" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('home.total_donations', 'Total Donated')}</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{totalDonatedINR.toLocaleString()}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <CreditCard color="#10b981" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.tabDonations', 'Donations')}</Text>
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
              <Text className="text-white font-bold text-base">{t('card.donateNow', 'Make a Donation')}</Text>
              <Text className="text-white/80 text-xs">{t('home.stat_transparency_desc', 'Support active verified campaigns')}</Text>
            </View>
          </View>
          <ArrowRight color="#fff" size={20} />
        </TouchableOpacity>

      </ScrollView>
    );
  }

  // ----------------------------------------------------
  // 2. COMMUNITY ADMIN DASHBOARD
  // ----------------------------------------------------
  if (userRole === 'community_admin') {
    const commTotalMembers = community?.totalMembers ?? community?.total_members ?? 0;
    const commActiveCampaigns = community?.activeCampaigns ?? community?.active_campaigns ?? communityCampaigns.filter(c => c.status === 'active').length;
    const commTotalRaised = community?.totalRaisedINR ?? community?.total_raised_inr ?? communityCampaigns.reduce((sum, c) => sum + (c.raisedINR || 0), 0);
    const commHealthScore = community?.healthScore ?? community?.health_score ?? 100;
    const pendingCampaignsCount = communityCampaigns.filter(c => c.status === 'pending' || c.status === 'pending_approval').length;

    return (
      <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
        {/* Top Banner */}
        <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                {translateCommunityName(community?.name || activeUser?.communityName || t('admin.community_hub', 'Community Hub'), lang)}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('admin.adminLabel', 'Admin')}: <Text className="font-bold text-slate-800 dark:text-slate-200">{displayName || community?.adminName || t('admin.adminLabel', 'Admin')}</Text> • {translateCity(community?.city || activeUser?.city || 'Bareilly', lang)} {t('admin.chapter', 'Chapter')}
              </Text>
            </View>
            <View className="bg-amber-100 dark:bg-amber-950/80 px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-800/60 flex-row items-center gap-1.5 self-start">
              <ShieldCheck color="#d97706" size={14} />
              <Text className="text-amber-800 dark:text-amber-300 text-xs font-bold">{translateRole('community_admin', lang)}</Text>
            </View>
          </View>
        </View>

        {/* 4 Primary Stats Grid */}
        <View className="gap-3 mb-4">
          <View className="flex-row gap-3">
            {/* Total Members */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(drawer)/dashboard/community-members')}
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 items-center justify-center mb-2">
                <Users color="#10b981" size={22} />
              </View>
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('admin.tabMembers', 'Total Members')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {commTotalMembers}
              </Text>
              <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                {t('communities.active_registered', 'Active Registered')}
              </Text>
            </TouchableOpacity>

            {/* Active Campaigns */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(drawer)/campaigns')}
              className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <View className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 items-center justify-center mb-2">
                <Heart color="#ef4444" size={22} />
              </View>
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('admin.statActiveCampaigns', 'Active Causes')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {commActiveCampaigns}
              </Text>
              <Text className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                {t('communities.live_causes', 'Live Campaign Causes')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3">
            {/* Total Funds Raised */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 items-center justify-center mb-2">
                <TrendingUp color="#3b82f6" size={22} />
              </View>
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('home.stat_funds_raised', 'Total Funds Raised')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                ₹{commTotalRaised >= 100000 ? `${(commTotalRaised / 100000).toFixed(1)}L` : commTotalRaised.toLocaleString('en-IN')}
              </Text>
              <Text className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                {t('communities.escrow_audited', 'Escrow Audited')}
              </Text>
            </View>

            {/* Health Score */}
            <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 items-center justify-center mb-2">
                <Activity color="#f59e0b" size={22} />
              </View>
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('communities.grade_a', 'Community Health')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {commHealthScore}%
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {t('communities.grade_a_transparency', 'Grade A Transparency')}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Actions Grid */}
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-3">
          {t('admin.tabApprovals', 'Pending Approvals')}
        </Text>
        <View className="gap-3 mb-5">
          {/* Pending KYC */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(drawer)/dashboard/kyc-aproved')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-1 mr-3">
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('admin.tabKycQueue', 'Pending KYC Approvals')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingKycCount}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {pendingKycCount > 0 ? t('admin.requires_review', 'Requires admin review') : t('admin.all_verified', 'All members verified')}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 items-center justify-center">
              <UserCheck color="#d97706" size={24} />
            </View>
          </TouchableOpacity>

          {/* Pending Campaigns */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(drawer)/campaigns')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-1 mr-3">
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('admin.pending_campaigns', 'Pending Campaigns')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingCampaignsCount}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {pendingCampaignsCount > 0 ? t('admin.awaiting_approval', 'Awaiting approval') : t('admin.no_pending_campaigns', 'No pending campaigns')}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 items-center justify-center">
              <PlusCircle color="#d97706" size={24} />
            </View>
          </TouchableOpacity>

          {/* Pending UTR */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(drawer)/dashboard/utr-aproved')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-1 mr-3">
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('admin.tabUtrAudit', 'Pending UTR Verification')}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {pendingUtrCount}
              </Text>
              <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {pendingUtrCount > 0 ? t('admin.manual_bank_transfers', 'Manual bank transfers') : t('admin.no_pending_utr', 'No pending UTRs')}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 items-center justify-center">
              <Banknote color="#d97706" size={24} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Broadcast Announcement */}
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-5">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 items-center justify-center">
              <Megaphone color="#2563eb" size={20} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-base text-slate-900 dark:text-white">
                {t('admin.broadcast_title', 'Broadcast Announcement')}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {t('admin.broadcast_desc', 'Send an alert to all members of your community')}
              </Text>
            </View>
          </View>

          {announcementSent ? (
            <View className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl items-center">
              <CheckCircle2 color="#10b981" size={24} />
              <Text className="font-bold text-xs text-emerald-800 dark:text-emerald-400 mt-1">
                {t('admin.broadcast_sent', 'Broadcast Dispatched!')}
              </Text>
              <Text className="text-[10px] text-emerald-600 dark:text-emerald-500/80 mt-0.5 text-center">
                {t('admin.broadcast_gateway', 'Sent via WhatsApp & SMS gateway.')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              <TextInput
                multiline
                numberOfLines={3}
                placeholder={t('admin.broadcast_placeholder', 'Type urgent community broadcast message...')}
                placeholderTextColor="#94a3b8"
                value={announcementText}
                onChangeText={setAnnouncementText}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 min-h-[70px]"
                textAlignVertical="top"
              />
              <TouchableOpacity
                onPress={handleBroadcast}
                disabled={broadcasting || !announcementText.trim()}
                className={`w-full py-3 rounded-xl items-center justify-center flex-row gap-2 ${broadcasting || !announcementText.trim() ? 'bg-emerald-600/60' : 'bg-emerald-600 active:bg-emerald-700'
                  }`}
              >
                {broadcasting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Megaphone color="#ffffff" size={16} />
                    <Text className="text-white font-bold text-xs">
                      {t('admin.dispatch_alert', 'Dispatch Broadcast Alert')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Community Campaigns */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            {t('tabs.campaigns', 'Community Campaigns')} ({communityCampaigns.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/(drawer)/campaigns')}>
            <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {t('home.view_all_campaigns', 'View All')}
            </Text>
          </TouchableOpacity>
        </View>

        {communityCampaigns.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 items-center mb-6">
            <Text className="text-slate-500 dark:text-slate-400 text-sm">
              {t('admin.no_pending_kyc', 'No active community campaigns')}
            </Text>
          </View>
        ) : (
          communityCampaigns.map(c => {
            const pct = Math.min(Math.round(((c.raisedINR || 0) / (c.goalINR || 1)) * 100), 100);
            return (
              <View key={c.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 shadow-sm">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-900 dark:text-white text-sm" numberOfLines={1}>
                      {translateCampaignTitle(c.title, lang)}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {translateCategory(c.category, lang)} • {translateCity(c.city || 'Bareilly', lang)}
                    </Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-amber-100 dark:bg-amber-950'
                    }`}>
                    <Text className={`text-[10px] font-bold ${c.status === 'active' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                      {translateStatus(c.status, lang)}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <View style={{ width: `${pct}%` }} className="bg-emerald-500 h-full rounded-full" />
                </View>

                <View className="flex-row justify-between items-center mt-2.5">
                  <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    ₹{(c.raisedINR || 0).toLocaleString()} <Text className="font-normal text-slate-500">{t('home.funds_disbursed', 'raised')}</Text>
                  </Text>
                  <Text className="text-xs text-slate-400">
                    {t('home.funds_needed', 'Goal')}: ₹{(c.goalINR || 0).toLocaleString()} ({pct}%)
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // ----------------------------------------------------
  // 3. EXECUTIVE & SUPER ADMIN DASHBOARD
  // ----------------------------------------------------
  const totalPlatformRaised = communities.reduce((acc, c) => acc + (c.totalRaisedINR ?? c.total_raised_inr ?? 0), 0);
  const pendingApprovals = campaignsList.filter(c => c.status === 'pending_approval' || c.status === 'pending');

  const communityGrowth = [...communities]
    .sort((a, b) => ((b.totalRaisedINR ?? b.total_raised_inr ?? 0) - (a.totalRaisedINR ?? a.total_raised_inr ?? 0)))
    .slice(0, 5)
    .map((c) => ({
      name: c.city || c.name,
      raised: parseFloat((((c.totalRaisedINR ?? c.total_raised_inr ?? 0)) / 100000).toFixed(1)),
    }));
  const maxRaised = Math.max(...communityGrowth.map(c => c.raised), 1);

  const categoryData = [
    { name: t('cat.medical', 'Medical'), value: 45, color: '#059669' },
    { name: t('cat.education', 'Education'), value: 25, color: '#2563eb' },
    { name: t('cat.food', 'Food Relief'), value: 18, color: '#d97706' },
    { name: t('cat.marriage', 'Marriage'), value: 12, color: '#9333ea' },
  ];

  const donutRadius = 45;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedPct = 0;

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Super Admin Header */}
      <View className="bg-slate-900 dark:bg-slate-950 p-5 rounded-2xl border border-slate-800 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            {/* <Text className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{t('admin.platformMasterTitle', 'Management Desk')}</Text> */}
            <Text className="text-2xl font-bold text-white mt-0.5">{displayName}</Text>
          </View>
          <View className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full">
            <Text className="text-emerald-400 text-xs font-bold">
              {translateRole(userRole, lang)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="gap-3 mb-4">
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Users color="#3b82f6" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.statActiveMembers', 'Total Users')}</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{allUsers.length}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Building2 color="#8b5cf6" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.statActiveCommunities', 'Communities')}</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{communities.length}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <TrendingUp color="#10b981" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.stat_funds_raised')}</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{(totalPlatformRaised / 100000).toFixed(1)}L</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Activity color="#f59e0b" size={22} />
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.statTotalCampaigns')}</Text>
            <Text className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{campaignsList.length}</Text>
          </View>
        </View>
      </View>

      {/* Pending Queue Summary */}
      {pendingApprovals.length > 0 && (
        <View className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
          <View>
            <Text className="font-bold text-amber-900 dark:text-amber-200 text-sm">{t('admin.kyc_subtitle', 'Approvals Pending')}</Text>
            <Text className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{pendingApprovals.length} {t('admin.kyc_subtitle', 'campaigns awaiting verification')}</Text>
          </View>
          <ShieldCheck color="#f59e0b" size={24} />
        </View>
      )}

      {/* Top 5 Communities by Funds Chart */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            {t('admin.top5Communities', 'Top 5 Communities by Funds (Lakhs INR)')}
          </Text>
          <BarChart3 color="#10b981" size={18} />
        </View>

        {communityGrowth.length === 0 ? (
          <Text className="text-xs text-slate-400 py-6 text-center">
            {t('communities.empty', 'No communities found')}
          </Text>
        ) : (
          <View className="flex-row items-end justify-between h-44 pt-4 pb-1 px-1">
            {communityGrowth.map((item, idx) => {
              const heightPct = maxRaised > 0 ? Math.max((item.raised / maxRaised) * 100, 10) : 10;
              return (
                <View key={idx} className="items-center flex-1 mx-1 justify-end h-full">
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                    ₹{item.raised}L
                  </Text>
                  <View className="w-full max-w-[34px] bg-slate-100 dark:bg-slate-800 h-28 rounded-t-lg justify-end overflow-hidden">
                    <View
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-emerald-500 rounded-t-lg"
                    />
                  </View>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Category Donation Distribution Chart */}
      <View className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-bold text-slate-900 dark:text-white">
            {t('admin.categoryDistribution', 'Category Donation Distribution (%)')}
          </Text>
          <PieChart color="#3b82f6" size={18} />
        </View>

        <View className="items-center justify-center my-2">
          <View className="relative items-center justify-center">
            <Svg width={130} height={130} viewBox="0 0 130 130">
              <G rotation="-90" origin="65, 65">
                {categoryData.map((cat, idx) => {
                  const strokeDasharray = `${(cat.value / 100) * donutCircumference} ${donutCircumference}`;
                  const strokeDashoffset = -((accumulatedPct / 100) * donutCircumference);
                  accumulatedPct += cat.value;
                  return (
                    <Circle
                      key={idx}
                      cx="65"
                      cy="65"
                      r={donutRadius}
                      stroke={cat.color}
                      strokeWidth={18}
                      fill="none"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </G>
            </Svg>
            <View className="absolute items-center justify-center">
              <Text className="text-base font-black text-slate-900 dark:text-white">100%</Text>
              <Text className="text-[9px] font-bold uppercase text-slate-400">Total</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {categoryData.map((cat, idx) => (
            <View key={idx} className="flex-row items-center gap-2 w-[48%] py-1.5">
              <View style={{ backgroundColor: cat.color }} className="w-3 h-3 rounded-full shrink-0" />
              <View className="flex-1">
                <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate" numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text className="text-xs font-bold text-slate-900 dark:text-white">
                  {cat.value}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
