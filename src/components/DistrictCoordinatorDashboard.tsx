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
    Clock,
    CheckCircle2,
    XCircle,
    UserCheck,
    ShieldCheck,
} from 'lucide-react-native';

import { getUsers } from '../services/userService';
import { getMeetings } from '../services/meetingService';
import { getAllAnnouncements } from '../services/announcementService';
import { getLanguageCode } from '../lib/translateEntity';
import { DistrictCoordinatorSkeleton } from './SkeletonLoader';
import DistrictMeetingsAndNotices from './DistrictMeetingsAndNotices';

type Props = {
    activeUser: any;
    onNavigateTab?: (tab: string) => void;
};

export default function DistrictCoordinatorDashboard({
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

    const [users, setUsers] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const district =
        activeUser?.district ||
        activeUser?.city ||
        'All Districts';

    useEffect(() => {
        loadUsers();
    }, [district]);

    const loadUsers = async () => {
        try {
            setLoading(true);

            const [data, meetingsData, announcementsData] = await Promise.all([
                getUsers(undefined, undefined),
                getMeetings(district),
                getAllAnnouncements(),
            ]);

            setUsers(data || []);
            setMeetings(meetingsData || []);
            setAnnouncements(announcementsData || []);
        } catch (error) {
            console.log('Coordinator users error:', error);
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

    const pending = districtUsers.filter(
        (u) =>
            u.status === 'pending' ||
            (!u.status && !u.isVerified)
    ).length;

    const approved = districtUsers.filter(
        (u) =>
            u.status === 'approved' ||
            u.isVerified === true
    ).length;

    const rejected = districtUsers.filter(
        (u) =>
            u.status === 'rejected' ||
            u.status === 'reject'
    ).length;

    if (loading) {
        return <DistrictCoordinatorSkeleton isDark={isDark} />;
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
                title={tr('जिला समन्वयक (District Coordinator)', 'ضلعی کوآرڈینیٹر', 'District Coordinator')}
                subtitle={`${district} • ${tr('केवाईसी सत्यापन एवं सदस्यता', 'کے وائی سی مینجمنٹ', 'KYC & Member Verification')}`}
            />

            <KycCard
                title={tr('लंबित केवाईसी (Pending KYC)', 'زیر التواء کے وائی سی', 'Pending KYC')}
                value={pending}
                icon={<Clock size={22} color="#d97706" />}
                description={tr('सत्यापन हेतु प्रतीक्षारत', 'تصدیق کے منتظر', 'Awaiting verification')}
                onPress={() => onNavigateTab?.('kyc_queue')}
            />

            <KycCard
                title={tr('स्वीकृत केवाईसी (Approved KYC)', 'منظور شدہ کے وائی سی', 'Approved KYC')}
                value={approved}
                icon={<CheckCircle2 size={22} color="#059669" />}
                description={tr('सत्यापित सक्रिय सदस्य', 'تصدیق شدہ ممبران', 'Verified active members')}
                onPress={() => onNavigateTab?.('kyc_queue')}
            />

            <KycCard
                title={tr('अस्वीकृत केवाईसी (Rejected KYC)', 'مسترد شدہ کے وائی سی', 'Rejected KYC')}
                value={rejected}
                icon={<XCircle size={22} color="#e11d48" />}
                description={tr('पुनः आवेदन / त्रुटिपूर्ण', 'دوبارہ درخواست مطلوب', 'Re-application required')}
                onPress={() => onNavigateTab?.('kyc_queue')}
            />

            <View className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 mt-2">
                <View className="flex-row items-center">
                    <View className="w-11 h-11 rounded-xl bg-emerald-600 items-center justify-center">
                        <UserCheck size={22} color="white" />
                    </View>

                    <View className="flex-1 ml-3">
                        <Text className="text-sm font-black text-slate-900 dark:text-white">
                            {tr('जिला समन्वयक कार्यक्षेत्र (KYC Desk)', 'ضلعی کوآرڈینیٹر ورک اسپیس', 'District Coordinator Desk')}
                        </Text>

                        <Text className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-4">
                            {tr(
                                'जिले के सभी नए सदस्यों के पहचान पत्र, आधार एवं सदस्यता आवेदनों का सत्यापन व अनुमोदन।',
                                'ضلع کے تمام نئے ممبران کی شناختی تصدیق اور کے وائی سی منظوری۔',
                                'Review identity proofs, Aadhaar documents, and membership KYC verifications.'
                            )}
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => onNavigateTab?.('kyc_queue')}
                    className="bg-emerald-700 rounded-xl py-3 mt-4 items-center active:opacity-80"
                >
                    <View className="flex-row items-center">
                        <ShieldCheck size={17} color="white" />

                        <Text className="text-white text-xs font-bold ml-2">
                            {tr('केवाईसी अनुमोदन डेस्क खोलें', 'کے وائی سی ڈیسک کھولیں', 'Open KYC Desk')}
                        </Text>
                    </View>
                </Pressable>
            </View>

            <DistrictMeetingsAndNotices
                district={district}
                meetings={meetings}
                announcements={announcements}
                onNavigateTab={onNavigateTab}
            />
        </ScrollView>
    );
}

function Header({ title, subtitle }: any) {
    return (
        <View className="bg-emerald-950 rounded-3xl p-5 mb-5 border border-emerald-800">
            <Text className="text-white text-xl font-black">
                {title}
            </Text>

            <Text className="text-amber-300 text-xs mt-1">
                {subtitle}
            </Text>
        </View>
    );
}

function KycCard({
    title,
    value,
    icon,
    description,
    onPress,
}: any) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-3 active:opacity-80 shadow-xs"
        >
            <View className="flex-row justify-between items-center">
                <Text className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    {title}
                </Text>

                <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 items-center justify-center">
                    {icon}
                </View>
            </View>

            <Text className="text-3xl font-black text-slate-900 dark:text-white mt-3">
                {value}
            </Text>

            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description}
            </Text>
        </Pressable>
    );
}