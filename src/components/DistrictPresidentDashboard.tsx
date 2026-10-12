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
    Users,
    Building2,
    Calendar,
    IndianRupee,
    HeartHandshake,
    ShieldCheck,
} from 'lucide-react-native';

import { getUsers } from '../services/userService';
import { getTeams } from '../services/teamService';
import { getMeetings } from '../services/meetingService';
import { getAllAnnouncements } from '../services/announcementService';
import { getDonations } from '../services/donationService';
import { getCampaigns } from '../services/campaignService';
import { getCommunities } from '../services/communityService';
import { getLanguageCode } from '../lib/translateEntity';
import { DistrictPresidentSkeleton } from './SkeletonLoader';
import DistrictMeetingsAndNotices from './DistrictMeetingsAndNotices';

type Props = {
    activeUser: any;
    onNavigateTab?: (tab: string) => void;
};

export default function DistrictPresidentDashboard({
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

    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);

    const district =
        activeUser?.district ||
        activeUser?.city ||
        'All Districts';

    useEffect(() => {
        loadDashboard();
    }, [district]);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [
                usersData,
                teamsData,
                meetingsData,
                announcementsData,
                donationsData,
                campaignsData,
                communitiesData,
            ] = await Promise.all([
                getUsers(undefined, undefined),
                getTeams(district),
                getMeetings(district),
                getAllAnnouncements(),
                getDonations(),
                getCampaigns(),
                getCommunities(),
            ]);

            setUsers(usersData || []);
            setTeams(teamsData || []);
            setMeetings(meetingsData || []);
            setAnnouncements(announcementsData || []);
            setDonations(donationsData || []);
            setCampaigns(campaignsData || []);
            setCommunities(communitiesData || []);
        } catch (error) {
            console.log('District President dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const districtUsers = useMemo(() => {
        const target = district.toLowerCase().trim();

        return users.filter((user) => {
            const userDistrict = (
                user.district ||
                user.city ||
                ''
            )
                .toLowerCase()
                .trim();

            return (
                userDistrict === target ||
                userDistrict.includes(target) ||
                target.includes(userDistrict)
            );
        });
    }, [users, district]);

    const approvedKyc = districtUsers.filter(
        (u) =>
            u.status === 'approved' ||
            u.isVerified === true
    ).length;

    const pendingKyc = districtUsers.filter(
        (u) =>
            u.status === 'pending' ||
            (!u.status && !u.isVerified)
    ).length;

    const districtDonations = useMemo(() => {
        const target = district.toLowerCase().trim();
        if (!target) return donations;
        const filtered = donations.filter((d) => {
            const dCity = ((d as any).city || (d as any).district || d.communityName || '').toLowerCase().trim();
            return dCity === target || dCity.includes(target) || target.includes(dCity);
        });
        return filtered.length > 0 ? filtered : donations;
    }, [donations, district]);

    const totalDonations = districtDonations.reduce(
        (sum, donation) =>
            sum + (donation.status === 'verified' ? Number(donation.amountINR || 0) : 0),
        0
    );

    const pendingDonations = districtDonations.filter(
        (d) =>
            d.status?.toLowerCase() === 'pending'
    ).length;

    const upcomingMeetings = meetings.filter(
        (m) => m.status === 'upcoming'
    ).length;

    const districtCampaigns = useMemo(() => {
        const target = district.toLowerCase().trim();
        if (!target) return campaigns;
        const filtered = campaigns.filter((c) => {
            const cCity = (c.city || '').toLowerCase().trim();
            return cCity === target || cCity.includes(target) || target.includes(cCity);
        });
        return filtered.length > 0 ? filtered : campaigns;
    }, [campaigns, district]);

    const activeCampaigns = districtCampaigns.filter(
        (c) =>
            c.daysLeft === undefined ||
            c.daysLeft > 0
    ).length;

    if (loading) {
        return <DistrictPresidentSkeleton isDark={isDark} />;
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
            {/* Header */}
            <View className="rounded-3xl bg-emerald-950 p-5 mb-5 overflow-hidden border border-emerald-800 shadow-md">
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-amber-400/15 items-center justify-center mr-3 border border-amber-400/30">
                        <ShieldCheck size={26} color="#c8a84b" />
                    </View>

                    <View className="flex-1">
                        <Text className="text-white text-xl font-extrabold">
                            {district} {tr('ज़िला', 'ضلع', 'District')}
                        </Text>

                        <Text className="text-amber-300 text-xs mt-1 font-semibold">
                            {tr('जिला अध्यक्ष समग्र डैशबोर्ड', 'ضلعی صدر جائزہ ڈیش بورڈ', 'District President Executive Dashboard')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Members */}
            <DashboardCard
                icon={<Users size={22} color="#059669" />}
                title={tr('पंजीकृत सदस्य व केवाईसी', 'اراکین اور کے وائی سی', 'District Members & KYC')}
                value={`${districtUsers.length} ${tr('सदस्य', 'اراکین', 'Members')}`}
                footerLeft={`${approvedKyc} ${tr('केवाईसी सत्यापित', 'کے وائی سی تصدیق شدہ', 'KYC Verified')}`}
                footerRight={`${pendingKyc} ${tr('लंबित', 'زیر التواء', 'Pending')}`}
                onPress={() =>
                    onNavigateTab?.('community_members')
                }
            />

            {/* Teams */}
            <DashboardCard
                icon={<Building2 size={22} color="#2563eb" />}
                title={tr('सक्रिय इकाइयाँ व टीमें', 'فعال یونٹس اور ٹیمیں', 'Active Units & Teams')}
                value={`${teams.length} ${tr('इकाइयाँ', 'یونٹس', 'Units')}`}
                footerLeft={`${teams.reduce(
                    (sum, t) =>
                        sum + (t.members?.length || 0),
                    0
                )} ${tr('स्वयंसेवक / पदाधिकारी', 'رضاکار / عہدیداران', 'Volunteers / Officers')}`}
                footerRight={tr('ज़िला इकाइयां', 'ضلعی یونٹس', 'District Units')}
                onPress={() =>
                    onNavigateTab?.('teams_manage')
                }
            />

            {/* Meetings */}
            <DashboardCard
                icon={<Calendar size={22} color="#d97706" />}
                title={tr('बैठकें एवं घोषणाएँ', 'اجلاس اور اعلانات', 'Meetings & Notices')}
                value={`${meetings.length}`}
                footerLeft={`${upcomingMeetings} ${tr('आगामी', 'آئندہ', 'Upcoming')}`}
                footerRight={`${announcements.length} ${tr('घोषणाएँ', 'اعلانات', 'Notices')}`}
                onPress={() =>
                    onNavigateTab?.('meetings_manage')
                }
            />

            {/* Donations */}
            <DashboardCard
                icon={<IndianRupee size={22} color="#e11d48" />}
                title={tr('कुल राहत संवितरण एवं कोष', 'کل مالیاتی امداد और فنڈ', 'Total Donations & Aid')}
                value={`₹${totalDonations.toLocaleString('en-IN')}`}
                footerLeft={`${districtDonations.length} ${tr('लेन-देन', 'ٹرانزیکشنز', 'Transactions')}`}
                footerRight={`${pendingDonations} ${tr('सत्यापन अधीन', 'زیر تصدیق', 'Pending')}`}
            />

            {/* Campaigns */}
            <DashboardCard
                icon={<HeartHandshake size={22} color="#9333ea" />}
                title={tr('ज़िला राहत अभियान', 'ضلعی مہمات', 'District Campaigns')}
                value={`${districtCampaigns.length}`}
                footerLeft={`${activeCampaigns} ${tr('सक्रिय', 'فعال', 'Active')}`}
                footerRight={tr('अभियान', 'مہمات', 'Campaigns')}
                onPress={() =>
                    onNavigateTab?.('campaigns')
                }
            />

            {/* Communities */}
            <DashboardCard
                icon={<Building2 size={22} color="#0d9488" />}
                title={tr('स्थानीय समुदाय', 'مقامی کمیونٹیز', 'Local Communities')}
                value={`${communities.length}`}
                footerLeft={tr('ज़िला नेटवर्क', 'ضلعی نیٹ ورک', 'District Network')}
                footerRight={tr('समुदाय', 'کمیونٹیز', 'Communities')}
                onPress={() =>
                    onNavigateTab?.('communities_manage')
                }
            />

            {/* Unified District Meetings & Announcements Section */}
            <DistrictMeetingsAndNotices
                district={district}
                meetings={meetings}
                announcements={announcements}
                onNavigateTab={onNavigateTab}
            />
        </ScrollView>
    );
}

function DashboardCard({
    icon,
    title,
    value,
    footerLeft,
    footerRight,
    onPress,
}: any) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-80 shadow-xs"
        >
            <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {title}
                </Text>

                <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 items-center justify-center">
                    {icon}
                </View>
            </View>

            <Text className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {value}
            </Text>

            <View className="flex-row justify-between border-t border-slate-100 dark:border-slate-800 mt-3 pt-3">
                <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {footerLeft}
                </Text>

                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                    {footerRight}
                </Text>
            </View>
        </Pressable>
    );
}