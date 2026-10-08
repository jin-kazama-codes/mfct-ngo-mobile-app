import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  Activity,
  Building2,
  Calendar,
  Heart,
  IndianRupee,
  MapPin,
  ShieldCheck,
  UserCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppState } from '../../../src/context/AppStateProvider';
import { Community } from '../../../src/types';
import { getCommunityById } from '../../../src/services/communityService';
import {
  Announcement,
  getAnnouncementsByCommunity,
} from '../../../src/services/announcementService';

import { useDynamicTranslatedText } from '../../../src/lib/autoTranslate';
import {
  getLanguageCode,
  translateStatus,
} from '../../../src/lib/translateEntity';

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  iconColor: string;
  valueColor?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  label,
  value,
  iconColor,
  valueColor = 'text-slate-900 dark:text-white',
}) => {
  return (
    <View className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className={`h-11 w-11 items-center justify-center rounded-xl ${iconColor}`}>
        {icon}
      </View>

      <Text className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </Text>

      <Text
        className={`mt-1 text-base font-bold ${valueColor}`}
        numberOfLines={2}
      >
        {value || '---'}
      </Text>
    </View>
  );
};

const AnnouncementItem = ({ item, lang }: { item: Announcement; lang: any }) => {
  const { t } = useTranslation();
  const displayAuthor = useDynamicTranslatedText(item.sentBy, lang) || item.sentBy;
  const displayMessage = useDynamicTranslatedText(item.message, lang) || item.message;

  const locale = lang === 'hi' ? 'hi-IN' : lang === 'ur' ? 'ur-PK' : 'en-IN';
  const formattedDate = item.sentAt ? new Date(item.sentAt).toLocaleString(locale) : '';

  const channelText = item.channel?.toLowerCase() === 'all'
    ? t('admin.channelAll', 'All')
    : (item.channel || t('admin.channelAll', 'All'));

  return (
    <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Sender + Channel */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950">
            <UserCircle size={20} color="#059669" />
          </View>

          <View className="ml-3 flex-1">
            <Text
              className="text-sm font-bold text-slate-900 dark:text-white"
              numberOfLines={1}
            >
              {displayAuthor}
            </Text>

            <Text className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {formattedDate}
            </Text>
          </View>
        </View>

        <View className="ml-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {channelText}
          </Text>
        </View>
      </View>

      {/* Message */}
      <Text className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {displayMessage}
      </Text>
    </View>
  );
};

export default function MyCommunityScreen() {
  const { activeUser } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);

  const [community, setCommunity] = useState<Community | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const commName = community?.name || activeUser?.communityName || '';
  const commCity = community?.city || activeUser?.city || '';
  const commState = community?.state || activeUser?.state || '';
  const commAdmin = community?.adminName || '';

  const displayCommName = useDynamicTranslatedText(commName, lang) || commName;
  const displayCity = useDynamicTranslatedText(commCity, lang) || commCity;
  const displayState = useDynamicTranslatedText(commState, lang) || commState;
  const displayAdminName = useDynamicTranslatedText(commAdmin, lang) || commAdmin;

  const fallbackLocation = lang === 'hi' ? 'बरेली, उत्तर प्रदेश' : lang === 'ur' ? 'بریلی، اتر پردیش' : 'Bareilly, Uttar Pradesh';
  const locationText = [displayCity, displayState].filter(Boolean).join(', ') || fallbackLocation;

  // Fetch community + announcements
  useEffect(() => {
    if (activeUser?.communityId) {
      setLoading(true);

      Promise.all([
        getCommunityById(activeUser.communityId).then(setCommunity),
        getAnnouncementsByCommunity(activeUser.communityId).then(setAnnouncements),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeUser?.communityId]);

  const getStatusLabel = (status?: string) => {
    if (status === 'Verified') return t('admin.verified', 'Verified');
    if (status === 'Pending') return t('admin.pending', 'Pending');
    if (status === 'Flagged') return t('admin.flagged', 'Flagged');
    return status ? translateStatus(status, lang) : t('admin.verified', 'Verified');
  };

  const statusColorClass = community?.verifiedStatus === 'Pending'
    ? 'text-amber-600 dark:text-amber-400'
    : community?.verifiedStatus === 'Flagged'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const statusIconBgClass = community?.verifiedStatus === 'Pending'
    ? 'border border-amber-500/20 bg-amber-500/10'
    : community?.verifiedStatus === 'Flagged'
      ? 'border border-rose-500/20 bg-rose-500/10'
      : 'border border-emerald-500/20 bg-emerald-500/10';

  const statusIconColor = community?.verifiedStatus === 'Pending'
    ? '#d97706'
    : community?.verifiedStatus === 'Flagged'
      ? '#e11d48'
      : '#059669';

  // --------------------------------------------------
  // Loading Skeleton
  // --------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-5">
        <View className="space-y-5">
          {/* Header Skeleton */}
          <View className="rounded-3xl bg-slate-900 p-5">
            <View className="flex-row items-center">
              <View className="h-16 w-16 rounded-2xl bg-slate-800" />
              <View className="ml-4 flex-1">
                <View className="h-6 w-48 rounded bg-slate-800" />
                <View className="mt-2 h-4 w-32 rounded bg-slate-800" />
              </View>
            </View>
            <View className="mt-5 h-10 w-32 rounded-xl bg-slate-800" />
          </View>

          {/* Cards Skeleton */}
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4, 5].map((item) => (
              <View
                key={item}
                className="mb-3 w-[48%] rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <View className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <View className="mt-3 h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <View className="mt-2 h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              </View>
            ))}
          </View>

          {/* Activity Skeleton */}
          <View className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <View className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <View className="mt-4 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <View className="mt-2 h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
            <View className="mt-2 h-4 w-4/6 rounded bg-slate-100 dark:bg-slate-800" />
          </View>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------
  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================= */}
      {/* COMMUNITY HEADER */}
      {/* ========================================= */}
      <View className="overflow-hidden rounded-3xl border border-emerald-900 bg-[#0d2017] p-5">
        <View className="flex-row items-center">
          {/* Icon */}
          <View className="h-16 w-16 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-[#c8a84b]">
            <Building2 size={32} color="#0d2017" />
          </View>

          {/* Community Name */}
          <View className="ml-4 flex-1">
            <Text
              className="text-2xl font-extrabold tracking-tight text-white"
              numberOfLines={2}
            >
              {displayCommName || t('admin.communityHub', 'Community Hub')}
            </Text>

            {/* Location */}
            <View className="mt-2 flex-row items-center">
              <MapPin size={15} color="#c8a84b" />
              <Text
                className="ml-1 flex-1 text-sm font-medium text-yellow-200"
                numberOfLines={2}
              >
                {locationText}
              </Text>
            </View>
          </View>
        </View>

        {/* Community ID */}
        <View className="mt-5 self-start rounded-xl border border-yellow-700/30 bg-black/25 px-4 py-2.5">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-yellow-200/70">
            {t('admin.communityId', 'Community ID')}
          </Text>

          <Text className="mt-1 font-mono text-sm font-bold text-[#c8a84b]">
            #{activeUser?.communityId || community?.id || '---'}
          </Text>
        </View>
      </View>

      {/* ========================================= */}
      {/* COMMUNITY INFORMATION CARDS */}
      {/* ========================================= */}
      <View className="mt-5 flex-row flex-wrap justify-between">
        {/* Admin Name */}
        <InfoCard
          label={t('admin.adminName', 'Admin Name')}
          value={displayAdminName}
          iconColor="border border-amber-500/20 bg-amber-500/10"
          icon={<UserCircle size={22} color="#d97706" />}
        />

        {/* Total Released */}
        <InfoCard
          label={t('admin.totalReleased', 'Total Released')}
          value={
            community?.totalRaisedINR !== undefined
              ? `₹${community.totalRaisedINR.toLocaleString()}`
              : undefined
          }
          iconColor="border border-emerald-500/20 bg-emerald-500/10"
          valueColor="text-emerald-600 dark:text-emerald-400"
          icon={<IndianRupee size={22} color="#059669" />}
        />

        {/* Health Score */}
        <InfoCard
          label={t('communities.health_score', 'Health Score')}
          value={
            community?.healthScore !== undefined
              ? `${community.healthScore}%`
              : '100%'
          }
          iconColor="border border-amber-500/20 bg-amber-500/10"
          icon={<Heart size={22} color="#d97706" />}
        />

        {/* Establish Year */}
        <InfoCard
          label={t('admin.establishYear', 'Establish Year')}
          value={community?.establishedYear}
          iconColor="border border-blue-500/20 bg-blue-500/10"
          icon={<Calendar size={22} color="#2563eb" />}
        />

        {/* Status */}
        <InfoCard
          label={t('admin.status', 'Status')}
          value={getStatusLabel(community?.verifiedStatus)}
          iconColor={statusIconBgClass}
          valueColor={statusColorClass}
          icon={<ShieldCheck size={22} color={statusIconColor} />}
        />
      </View>

      {/* ========================================= */}
      {/* ANNOUNCEMENTS / COMMUNITY ACTIVITY */}
      {/* ========================================= */}
      {announcements.length === 0 ? (
        <View className="mt-3 min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 dark:border-slate-800 dark:bg-slate-900/50">
          <View className="h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Activity size={40} color="#94a3b8" />
          </View>

          <Text className="mt-4 text-center text-xl font-bold text-slate-900 dark:text-white">
            {t('admin.communityActivity', 'Community Activity')}
          </Text>

          <Text className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
            {t(
              'admin.noCommunityActivity',
              'Recent activities, campaigns, and announcements from your community will appear here.'
            )}
          </Text>
        </View>
      ) : (
        <View className="mt-5">
          {/* Section Header */}
          <View className="mb-4 flex-row items-center">
            <Activity size={20} color="#059669" />
            <Text className="ml-2 text-lg font-black text-slate-900 dark:text-white">
              {t('admin.recentAnnouncements', 'Recent Announcements')}
            </Text>
          </View>

          {/* Announcements */}
          <FlatList
            data={announcements}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AnnouncementItem item={item} lang={lang} />}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </ScrollView>
  );
}
