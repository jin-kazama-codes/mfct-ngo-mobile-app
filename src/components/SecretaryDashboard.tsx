import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
    Calendar,
    CheckCircle2,
    Megaphone,
} from 'lucide-react-native';

import { getMeetings } from '../services/meetingService';
import { getAllAnnouncements } from '../services/announcementService';
import { getLanguageCode } from '../lib/translateEntity';
import { SecretarySkeleton } from './SkeletonLoader';
import DistrictMeetingsAndNotices from './DistrictMeetingsAndNotices';

type Props = {
    activeUser: any;
    onNavigateTab?: (tab: string) => void;
};

export default function DistrictSecretaryDashboard({
    activeUser,
    onNavigateTab,
}: Props) {
    const { t, i18n } = useTranslation();
    const lang = getLanguageCode(i18n.language);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const tr = (hi: string, ur: string, en: string) => {
        if (lang === 'hi') return hi;
        if (lang === 'ur') return ur;
        return en;
    };

    const [meetings, setMeetings] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const district =
        activeUser?.district ||
        activeUser?.city ||
        'All Districts';

    useEffect(() => {
        loadData();
    }, [district]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [meetingsData, announcementsData] =
                await Promise.all([
                    getMeetings(district),
                    getAllAnnouncements(),
                ]);

            setMeetings(meetingsData || []);
            setAnnouncements(announcementsData || []);
        } catch (error) {
            console.log('Secretary dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const completed = useMemo(
        () =>
            meetings.filter(
                (m) => m.status === 'completed'
            ).length,
        [meetings]
    );

    const upcoming = useMemo(
        () =>
            meetings.filter(
                (m) => m.status === 'upcoming'
            ).length,
        [meetings]
    );

    if (loading) {
        return <SecretarySkeleton isDark={isDark} />;
    }

    return (
        <ScrollView
            className="flex-1 bg-slate-50 dark:bg-slate-950"
            contentContainerStyle={{
                padding: 16,
                paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
        >
            <View className="bg-emerald-950 rounded-3xl p-5 mb-5 border border-emerald-800 shadow-md">
                <Text className="text-white text-xl font-black">
                    {tr('जिला सचिव (District Secretary)', 'ضلعی سیکرٹری', 'District Secretary')}
                </Text>

                <Text className="text-amber-300 text-xs mt-1 font-semibold">
                    {district} {tr('ज़िला', 'ضلع', 'District')}
                </Text>
            </View>

            <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <CheckCircle2 size={22} color="#059669" />

                    <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
                        {completed}
                    </Text>

                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {tr('सम्पन्न बैठकें', 'مکمل شدہ اجلاس', 'Completed Meetings')}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('कार्यवृत्त व हस्ताक्षर सहित', 'دستخط شدہ کارروائی', 'With Signed Minutes')}
                    </Text>
                </View>

                <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <Calendar size={22} color="#2563eb" />

                    <Text className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-3">
                        {upcoming}
                    </Text>

                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {tr('आगामी बैठकें', 'آئندہ اجلاس', 'Upcoming Meetings')}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('निर्धारित कार्यसूची', 'طے شدہ ایجنڈا', 'Scheduled Agenda')}
                    </Text>
                </View>
            </View>

            <View className="flex-row gap-3 mb-5">
                <ActionButton
                    icon={<Calendar size={19} color="white" />}
                    title={tr('बैठक आयोजित करें', 'اجلاس کا انعقاد', 'Create Meeting')}
                    onPress={() =>
                        onNavigateTab?.('meetings_manage')
                    }
                />

                <ActionButton
                    icon={<Megaphone size={19} color="white" />}
                    title={tr('आधिकारिक सूचना', 'سرکاری اعلان', 'New Notice')}
                    onPress={() =>
                        onNavigateTab?.('announcements')
                    }
                />
            </View>

            {/* Unified District Meetings & Announcements */}
            <DistrictMeetingsAndNotices
                district={district}
                meetings={meetings}
                announcements={announcements}
                onNavigateTab={onNavigateTab}
            />
        </ScrollView>
    );
}

function ActionButton({
    icon,
    title,
    onPress,
}: any) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-1 bg-emerald-700 rounded-2xl p-4 active:opacity-80 shadow-xs"
        >
            <View className="items-center">
                {icon}

                <Text className="text-white text-xs font-bold mt-2 text-center">
                    {title}
                </Text>
            </View>
        </Pressable>
    );
}