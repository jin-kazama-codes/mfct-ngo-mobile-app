import React from 'react';
import { View, ScrollView } from 'react-native';

const SkeletonBox = ({
    className = '',
}: {
    className?: string;
}) => {
    return (
        <View
            className={`bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
        />
    );
};

const MetricSkeleton = () => {
    return (
        <View className="w-[48%] bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <View className="flex-row items-center justify-between mb-4">
                <SkeletonBox className="w-10 h-10 rounded-xl" />
                <SkeletonBox className="w-14 h-4 rounded-md" />
            </View>

            <SkeletonBox className="w-20 h-7 rounded-md mb-2" />
            <SkeletonBox className="w-28 h-3 rounded-md" />
        </View>
    );
};

const MeetingSkeleton = () => {
    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mb-3">
            <View className="flex-row items-center justify-between mb-3">
                <SkeletonBox className="w-10 h-10 rounded-xl" />

                <View className="flex-1 ml-3">
                    <SkeletonBox className="w-3/4 h-5 rounded-md mb-2" />
                    <SkeletonBox className="w-1/2 h-3 rounded-md" />
                </View>

                <SkeletonBox className="w-6 h-6 rounded-full" />
            </View>

            <SkeletonBox className="w-full h-3 rounded-md mb-2" />
            <SkeletonBox className="w-4/5 h-3 rounded-md mb-4" />

            <View className="flex-row gap-3">
                <SkeletonBox className="w-24 h-8 rounded-lg" />
                <SkeletonBox className="w-28 h-8 rounded-lg" />
            </View>
        </View>
    );
};

const AnnouncementSkeleton = () => {
    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mb-3">
            <View className="flex-row items-center mb-3">
                <SkeletonBox className="w-10 h-10 rounded-full" />

                <View className="flex-1 ml-3">
                    <SkeletonBox className="w-32 h-4 rounded-md mb-2" />
                    <SkeletonBox className="w-24 h-3 rounded-md" />
                </View>
            </View>

            <SkeletonBox className="w-full h-3 rounded-md mb-2" />
            <SkeletonBox className="w-full h-3 rounded-md mb-2" />
            <SkeletonBox className="w-3/5 h-3 rounded-md" />
        </View>
    );
};

export default function CommunityAdminDashboardSkeleton() {
    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-slate-50 dark:bg-slate-950"
            contentContainerStyle={{ paddingBottom: 30 }}
        >
            {/* Header / Community Banner */}
            <View className="mx-4 mt-4 mb-5 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
                <View className="flex-row items-center mb-5">
                    <SkeletonBox className="w-12 h-12 rounded-2xl" />

                    <View className="flex-1 ml-3">
                        <SkeletonBox className="w-36 h-5 rounded-md mb-2" />
                        <SkeletonBox className="w-24 h-3 rounded-md" />
                    </View>
                </View>

                <SkeletonBox className="w-3/4 h-7 rounded-md mb-3" />

                <View className="flex-row items-center">
                    <SkeletonBox className="w-20 h-3 rounded-md mr-3" />
                    <SkeletonBox className="w-24 h-3 rounded-md mr-3" />
                    <SkeletonBox className="w-20 h-3 rounded-md" />
                </View>
            </View>

            {/* Metrics */}
            <View className="px-4">
                <View className="flex-row flex-wrap justify-between gap-y-3">
                    <MetricSkeleton />
                    <MetricSkeleton />
                    <MetricSkeleton />
                    <MetricSkeleton />
                </View>
            </View>

            {/* Meetings */}
            <View className="px-4 mt-7">
                <View className="flex-row items-center justify-between mb-4">
                    <SkeletonBox className="w-32 h-6 rounded-md" />
                    <SkeletonBox className="w-16 h-4 rounded-md" />
                </View>

                <MeetingSkeleton />
                <MeetingSkeleton />
            </View>

            {/* Announcements */}
            <View className="px-4 mt-5">
                <View className="flex-row items-center justify-between mb-4">
                    <SkeletonBox className="w-40 h-6 rounded-md" />
                    <SkeletonBox className="w-16 h-4 rounded-md" />
                </View>

                <AnnouncementSkeleton />
                <AnnouncementSkeleton />
            </View>
        </ScrollView>
    );
}