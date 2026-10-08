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
    IndianRupee,
    ShieldCheck,
    FileCheck,
    TrendingUp,
    FileText,
    Award,
} from 'lucide-react-native';

import { getDonations } from '../services/donationService';
import { getMeetings } from '../services/meetingService';
import { getAllAnnouncements } from '../services/announcementService';
import { getLanguageCode } from '../lib/translateEntity';
import { FinanceCoorSkeleton } from './SkeletonLoader';
import DistrictMeetingsAndNotices from './DistrictMeetingsAndNotices';

type Props = {
    activeUser: any;
    onNavigateTab?: (tab: string) => void;
};

export default function DistrictFinanceCoordinatorDashboard({
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

    const [donations, setDonations] = useState<any[]>([]);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const district =
        activeUser?.district ||
        activeUser?.city ||
        'All Districts';

    useEffect(() => {
        loadDonations();
    }, [district]);

    const loadDonations = async () => {
        try {
            setLoading(true);

            const [data, meetingsData, announcementsData] = await Promise.all([
                getDonations(),
                getMeetings(district),
                getAllAnnouncements(),
            ]);

            setDonations(data || []);
            setMeetings(meetingsData || []);
            setAnnouncements(announcementsData || []);
        } catch (error) {
            console.log('Finance dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const districtDonations = useMemo(() => {
        const target = (district || '').toLowerCase().trim();
        if (!target) return donations;
        const filtered = donations.filter((d) => {
            const dCity = ((d as any).city || (d as any).district || d.communityName || '').toLowerCase().trim();
            return dCity === target || dCity.includes(target) || target.includes(dCity);
        });
        return filtered.length > 0 ? filtered : donations;
    }, [donations, district]);

    const totalDonations = useMemo(
        () =>
            districtDonations.reduce(
                (sum, donation) =>
                    sum + (donation.status === 'verified' ? Number(donation.amountINR || 0) : 0),
                0
            ),
        [districtDonations]
    );

    const pending = useMemo(
        () =>
            districtDonations.filter(
                (d) =>
                    d.status?.toLowerCase() === 'pending'
            ).length,
        [districtDonations]
    );

    if (loading) {
        return <FinanceCoorSkeleton isDark={isDark} />;
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
            <View className="bg-emerald-950 rounded-3xl p-5 mb-5 border border-emerald-800 shadow-md">
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-amber-400/15 items-center justify-center border border-amber-400/30">
                        <FileCheck size={24} color="#c8a84b" />
                    </View>

                    <View className="ml-3 flex-1">
                        <Text className="text-white text-lg font-black">
                            {tr('जिला वित्त समन्वयक', 'ضلعی فنانس کوآرڈینیٹر', 'District Finance Coordinator')}
                        </Text>

                        <Text className="text-amber-300 text-xs mt-1 font-semibold">
                            {district} {tr('ज़िला', 'ضلع', 'District')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <IndianRupee size={21} color="#059669" />

                    <Text className="text-xl font-black text-slate-900 dark:text-white mt-3">
                        ₹{totalDonations.toLocaleString('en-IN')}
                    </Text>

                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {tr('कुल राहत संवितरण', 'کل مالیاتی امداد', 'Total Relief Aid')}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('सत्यापित राहत फंड', 'تصدیق شدہ فنڈ', 'Verified Relief Fund')}
                    </Text>
                </View>

                <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <ShieldCheck size={21} color="#2563eb" />

                    <Text className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-3">
                        {pending}
                    </Text>

                    <Text className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {tr('सत्यापन के अंतर्गत', 'زیر التواء ادائیگیاں', 'Under Verification')}
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {tr('लंबित दान रसीदें', 'زیر تصدیق رسیدات', 'Pending Donations')}
                    </Text>
                </View>
            </View>

            {/* Navigation */}
            <View className="flex-row gap-3 mb-5">
                <Pressable
                    onPress={() =>
                        onNavigateTab?.('financial_analytics')
                    }
                    className="flex-1 bg-emerald-700 rounded-2xl p-4 active:opacity-80 shadow-xs"
                >
                    <TrendingUp size={20} color="white" />

                    <Text className="text-white text-xs font-bold mt-2">
                        {tr('वित्तीय विश्लेषण', 'مالیاتی تجزیات', 'Financial Analytics')}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() =>
                        onNavigateTab?.('utr_audit')
                    }
                    className="flex-1 bg-slate-800 rounded-2xl p-4 active:opacity-80 shadow-xs"
                >
                    <ShieldCheck size={20} color="white" />

                    <Text className="text-white text-xs font-bold mt-2">
                        {tr('यूटीआर ऑडिट डेस्क', 'یو ٹی آر آڈٹ ڈیسک', 'UTR Audit Desk')}
                    </Text>
                </Pressable>
            </View>

            {/* Workspace */}
            <Text className="text-base font-black text-slate-900 dark:text-white mb-3">
                {tr('वित्त कार्यक्षेत्र एवं प्रबंधन', 'فنانس ورک اسپیس و مانیٹرنگ', 'Finance Workspace & Oversight')}
            </Text>

            <WorkspaceCard
                icon={<ShieldCheck size={21} color="#059669" />}
                title={tr('यूटीआर व बैंक मिलान', 'یو ٹی آر و بینک مطابقت', 'UTR Reconciliation')}
                description={tr(
                    'जिले से संबंधित सभी ऑनलाइन यूपीआई व बैंक ट्रांसफर दान रसीदों के यूटीआर नंबरों का केंद्रीय सर्वर से 100% सत्यापन।',
                    'ضلع سے موصول تمام عطیات کی تصدیق اور یو ٹی آر کی جانچ۔',
                    '100% verification of all district donor UTR numbers and transaction slips against the central ledger.'
                )}
            />

            <WorkspaceCard
                icon={<FileText size={21} color="#d97706" />}
                title={tr('राहत सहायता वाउचर व साक्ष्य', 'امدادی واؤچرز و رسیدات', 'Relief Aid Vouchers')}
                description={tr(
                    'लाभार्थियों के मेडिकल बिल, राशन प्राप्ति रसीदें एवं राहत वितरण के भौतिक सत्यापन रिकॉर्ड सुरक्षित करना।',
                    'مستحقین کے ہسپتال بل، امدادی رسیدات اور تصدیقی ریکارڈ محفوظ کرنا۔',
                    'Collect and archive beneficiary receipts, hospital vouchers and field distribution records.'
                )}
            />

            <WorkspaceCard
                icon={<Award size={21} color="#9333ea" />}
                title={tr('मासिक वित्तीय ऑडिट रिपोर्टिंग', 'ماہانہ آڈٹ رپورٹنگ', 'Monthly Audit Reporting')}
                description={tr(
                    'जिले के आय-व्यय व राहत वितरण की मासिक ऑडिट रिपोर्ट तैयार कर राज्य कार्यकारिणी को प्रस्तुत करना।',
                    'ضلعی اخراجات اور آمدنی کی ماہانہ آڈٹ رپورٹ تیار کرنا۔',
                    'Prepare district financial records and audited aid documentation for central reporting.'
                )}
            />

            <DistrictMeetingsAndNotices
                district={district}
                meetings={meetings}
                announcements={announcements}
                onNavigateTab={onNavigateTab}
            />
        </ScrollView>
    );
}

function WorkspaceCard({
    icon,
    title,
    description,
}: any) {
    return (
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs">
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 items-center justify-center">
                    {icon}
                </View>

                <Text className="text-sm font-black text-slate-900 dark:text-white ml-3">
                    {title}
                </Text>
            </View>

            <Text className="text-xs text-slate-500 dark:text-slate-400 leading-5 mt-3">
                {description}
            </Text>
        </View>
    );
}