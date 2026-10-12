import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
    Layers,
    Users,
    Building2,
    Plus,
} from 'lucide-react-native';

import { getTeams } from '../services/teamService';
import { getMeetings } from '../services/meetingService';
import { getAllAnnouncements } from '../services/announcementService';
import { getLanguageCode } from '../lib/translateEntity';
import { GenSecretarySkeleton } from './SkeletonLoader';
import DistrictMeetingsAndNotices from './DistrictMeetingsAndNotices';

type Props = {
    activeUser: any;
    onNavigateTab?: (tab: string) => void;
};

export default function DistrictGeneralSecretaryDashboard({
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

    const [teams, setTeams] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const district =
        activeUser?.district ||
        activeUser?.city ||
        'All Districts';

    useEffect(() => {
        loadTeams();
    }, [district]);

    const loadTeams = async () => {
        try {
            setLoading(true);

            const [teamsData, meetingsData, announcementsData] = await Promise.all([
                getTeams(district),
                getMeetings(district),
                getAllAnnouncements(),
            ]);

            setTeams(teamsData || []);
            setMeetings(meetingsData || []);
            setAnnouncements(announcementsData || []);
        } catch (error) {
            console.log('General Secretary teams error:', error);
        } finally {
            setLoading(false);
        }
    };

    const officers = teams.reduce(
        (sum, team) =>
            sum + (team.members?.length || 0),
        0
    );

    if (loading) {
        return <GenSecretarySkeleton isDark={isDark} />;
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
            <Header
                title={tr('जिला महासचिव (General Secretary)', 'ضلعی جنرل سیکرٹری', 'District General Secretary')}
                district={`${district} ${tr('ज़िला', 'ضلع', 'District')}`}
            />

            <View className="flex-row gap-3 mb-4">
                <StatCard
                    icon={<Layers size={22} color="#059669" />}
                    title={tr('कुल गठित इकाइयाँ', 'کل تشکیل شدہ یونٹس', 'Total Units')}
                    value={teams.length}
                    subtitle={tr('जिले में अधिकृत इकाइयाँ', 'ضلع میں مجاز یونٹس', 'Authorized Chapters')}
                />

                <StatCard
                    icon={<Users size={22} color="#9333ea" />}
                    title={tr('नियुक्त पदाधिकारी', 'مقرر عہدیداران', 'Appointed Leaders')}
                    value={officers}
                    subtitle={tr('अध्यक्ष, सचिव व कार्यकारिणी', 'صدور، سیکرٹریز اور اراکین', 'Presidents, Secs & Execs')}
                />
            </View>

            <Pressable
                onPress={() => onNavigateTab?.('teams_manage')}
                className="bg-emerald-700 rounded-2xl p-5 mb-4 active:opacity-80 shadow-xs"
            >
                <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-xl bg-white/15 items-center justify-center">
                        <Plus size={22} color="white" />
                    </View>

                    <View className="flex-1 ml-3">
                        <Text className="text-white text-sm font-black">
                            {tr('नगर / ब्लॉक इकाई का गठन करें', 'شہر / بلاک ٹیم تشکیل دیں', 'Create City / Block Team')}
                        </Text>

                        <Text className="text-emerald-100 text-xs mt-1 leading-4">
                            {tr('जिले की इकाइयों एवं कार्यकारिणी का प्रबंधन', 'ضلعی یونٹس اور ٹیم کی تشکیل کا انتظام', 'Manage district units and team formations')}
                        </Text>
                    </View>
                </View>
            </Pressable>

            <Text className="text-base font-black text-slate-900 dark:text-white mb-3">
                {tr('ज़िला इकाइयाँ एवं ब्लॉक टीमें', 'ضلعی یونٹس اور بلاک ٹیمیں', 'District Units & Block Teams')}
            </Text>

            {teams.length === 0 ? (
                <View className="bg-white dark:bg-slate-900 rounded-2xl p-8 items-center border border-slate-200 dark:border-slate-800 shadow-xs">
                    <Building2 size={30} color="#94a3b8" />

                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                        {tr('कोई टीम अभी तक गठित नहीं हुई है।', 'ابھی تک کوئی ٹیم نہیں بنائی گئی۔', 'No teams created yet.')}
                    </Text>
                </View>
            ) : (
                teams.map((team) => (
                    <Pressable
                        key={team.id}
                        onPress={() =>
                            onNavigateTab?.('teams_manage')
                        }
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-80 shadow-xs"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 items-center justify-center">
                                <Building2 size={20} color="#2563eb" />
                            </View>

                            <View className="flex-1 ml-3">
                                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                                    {team.unitName || team.name || tr('ज़िला इकाई', 'ضلعی یونٹ', 'District Unit')}
                                </Text>

                                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {team.members?.length || 0} {tr('पदाधिकारी नियुक्त', 'عہدیداران مقرر', 'officers appointed')} • {team.tehsilOrZone || district}
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                ))
            )}

            <DistrictMeetingsAndNotices
                district={district}
                meetings={meetings}
                announcements={announcements}
                onNavigateTab={onNavigateTab}
            />
        </ScrollView>
    );
}

function Header({ title, district }: any) {
    return (
        <View className="bg-emerald-950 rounded-3xl p-5 mb-5 border border-emerald-800 shadow-md">
            <Text className="text-white text-xl font-black">
                {title}
            </Text>

            <Text className="text-amber-300 text-xs mt-1 font-semibold">
                {district}
            </Text>
        </View>
    );
}

function StatCard({
    icon,
    title,
    value,
    subtitle,
}: any) {
    return (
        <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <View className="flex-row justify-between">
                <Text className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex-1">
                    {title}
                </Text>

                {icon}
            </View>

            <Text className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {value}
            </Text>

            <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
            </Text>
        </View>
    );
}