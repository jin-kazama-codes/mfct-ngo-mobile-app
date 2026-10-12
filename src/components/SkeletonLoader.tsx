/**
 * SkeletonLoader.tsx
 * Animated shimmer skeleton components for the NGO mobile app.
 * Mirrors the website's Skeletons.tsx but uses React Native Animated API.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Shimmer Hook ──────────────────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return opacity;
}

// ─── Base Block ────────────────────────────────────────────────────────────────
export function ShimmerBlock({
  width: w, height: h, borderRadius = 8, style,
}: { width?: number | string; height: number; borderRadius?: number; style?: object }) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        { width: w ?? '100%', height: h, borderRadius, backgroundColor: '#e2e8f0' },
        { opacity },
        style,
      ]}
    />
  );
}

export function ShimmerBlockDark({
  width: w, height: h, borderRadius = 8, style,
}: { width?: number | string; height: number; borderRadius?: number; style?: object }) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        { width: w ?? '100%', height: h, borderRadius, backgroundColor: '#1e293b' },
        { opacity },
        style,
      ]}
    />
  );
}

// ─── Campaign Card Skeleton ───────────────────────────────────────────────────
export function CampaignCardSkeleton() {
  return (
    <View style={sk.campaignCard}>
      {/* Image banner */}
      <ShimmerBlock height={120} borderRadius={0} />
      <View style={sk.campaignBody}>
        {/* Badges row */}
        <View style={sk.row}>
          <ShimmerBlock width={60} height={18} borderRadius={20} />
          <ShimmerBlock width={50} height={18} borderRadius={20} />
        </View>
        {/* Title lines */}
        <ShimmerBlock height={14} style={{ marginTop: 10 }} />
        <ShimmerBlock width="70%" height={14} style={{ marginTop: 6 }} />
        {/* Progress */}
        <View style={[sk.row, { marginTop: 12, justifyContent: 'space-between' }]}>
          <ShimmerBlock width="35%" height={12} borderRadius={6} />
          <ShimmerBlock width="25%" height={12} borderRadius={6} />
        </View>
        <ShimmerBlock height={6} borderRadius={6} style={{ marginTop: 6 }} />
        {/* Meta row */}
        <View style={[sk.row, { marginTop: 8, justifyContent: 'space-between' }]}>
          <ShimmerBlock width="30%" height={10} borderRadius={6} />
          <ShimmerBlock width="20%" height={10} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

// ─── Community Card Skeleton ──────────────────────────────────────────────────
export function CommunityCardSkeleton() {
  return (
    <View style={sk.communityCard}>
      <View style={sk.row}>
        <ShimmerBlock width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <ShimmerBlock width="60%" height={14} />
          <ShimmerBlock width="40%" height={11} borderRadius={6} />
        </View>
        <ShimmerBlock width={50} height={20} borderRadius={20} />
      </View>
      <ShimmerBlock height={6} borderRadius={6} style={{ marginTop: 14 }} />
      <View style={[sk.row, { marginTop: 10, justifyContent: 'space-between' }]}>
        <ShimmerBlock width="28%" height={11} borderRadius={6} />
        <ShimmerBlock width="28%" height={11} borderRadius={6} />
        <ShimmerBlock width="28%" height={11} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Story Card Skeleton ──────────────────────────────────────────────────────
export function StoryCardSkeleton() {
  return (
    <View style={sk.storyCard}>
      <ShimmerBlock width={24} height={24} borderRadius={6} />
      <ShimmerBlock height={13} style={{ marginTop: 10 }} />
      <ShimmerBlock width="85%" height={13} style={{ marginTop: 6 }} />
      <ShimmerBlock width="70%" height={13} style={{ marginTop: 6 }} />
      <View style={[sk.row, { marginTop: 14 }]}>
        <ShimmerBlock width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
          <ShimmerBlock width="40%" height={12} />
          <ShimmerBlock width="30%" height={10} borderRadius={6} />
        </View>
        <ShimmerBlock width={56} height={20} borderRadius={20} />
      </View>
    </View>
  );
}

// ─── Gallery Grid Skeleton ────────────────────────────────────────────────────
export function GalleryGridSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const tileWidth = (width - 36) / 2;

  return (
    <View style={sk.galleryGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={[
            sk.galleryCard,
            {
              width: tileWidth,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: isDark ? '#334155' : '#e2e8f0',
            },
          ]}
        >
          {/* Shimmer Image */}
          <Block height={120} borderRadius={0} />

          {/* Details */}
          <View style={{ padding: 8, gap: 6 }}>
            <Block width="80%" height={12} borderRadius={4} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Block width={10} height={10} borderRadius={5} />
              <Block width="45%" height={10} borderRadius={4} />
            </View>
          </View>

          {/* Bottom Action buttons */}
          <View
            style={[
              sk.row,
              {
                padding: 6,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#334155' : '#e2e8f0',
                gap: 4,
              },
            ]}
          >
            <Block width="30%" height={24} borderRadius={6} />
            <Block width="30%" height={24} borderRadius={6} />
            <Block width="30%" height={24} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── User Row Skeleton ────────────────────────────────────────────────────────
export function UserRowSkeleton() {
  return (
    <View style={sk.userRow}>
      <ShimmerBlockDark width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
        <ShimmerBlockDark width="50%" height={13} />
        <ShimmerBlockDark width="35%" height={10} borderRadius={6} />
      </View>
      <ShimmerBlockDark width={56} height={20} borderRadius={20} />
    </View>
  );
}

// ─── User Card & List Skeleton ───────────────────────────────────────────────
export function UserCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Block width={52} height={52} borderRadius={16} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <Block width="55%" height={14} borderRadius={4} />
          <Block width="35%" height={11} borderRadius={4} />
          <Block width="45%" height={10} borderRadius={4} />
        </View>
        <Block width={60} height={22} borderRadius={12} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Block width="48%" height={26} borderRadius={12} />
        <Block width="48%" height={26} borderRadius={12} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
        }}
      >
        <Block width={65} height={28} borderRadius={12} />
        <Block width={90} height={28} borderRadius={12} />
        <Block width={65} height={28} borderRadius={12} />
      </View>
    </View>
  );
}

export function UserListSkeleton({ isDark = false }: { isDark?: boolean }) {
  return (
    <View style={{ padding: 14 }}>
      <UserCardSkeleton isDark={isDark} />
      <UserCardSkeleton isDark={isDark} />
      <UserCardSkeleton isDark={isDark} />
      <UserCardSkeleton isDark={isDark} />
    </View>
  );
}

// ─── UTR Card Skeleton ────────────────────────────────────────────────────────
export function UtrCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={[
        sk.utrCard,
        {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
        },
      ]}
    >
      {/* Top row */}
      <View style={[sk.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
        <Block width={90} height={20} borderRadius={6} />
        <Block width={60} height={14} borderRadius={4} />
      </View>

      {/* Middle row: Donor & Amount */}
      <View style={[sk.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Block width="65%" height={15} borderRadius={4} />
          <Block width="80%" height={12} borderRadius={4} />
          <Block width="45%" height={10} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Block width={70} height={18} borderRadius={4} />
          <Block width={50} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Badges row */}
      <View style={[sk.row, { gap: 6, marginBottom: 14 }]}>
        <Block width={110} height={22} borderRadius={6} />
        <Block width={80} height={22} borderRadius={6} />
        <Block width={55} height={22} borderRadius={6} />
      </View>

      {/* Actions footer */}
      <View
        style={[
          sk.row,
          {
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#334155' : '#e2e8f0',
          },
        ]}
      >
        <Block width={90} height={28} borderRadius={8} />
        <View style={[sk.row, { gap: 8 }]}>
          <Block width={65} height={28} borderRadius={8} />
          <Block width={65} height={28} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

// ─── Full UTR Desk Skeleton ───────────────────────────────────────────────────
export function UtrDeskSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View style={[sk.deskContainer, { backgroundColor: isDark ? '#090d16' : '#f8fafc' }]}>
      {/* Header */}
      <View style={[sk.row, { gap: 12, marginBottom: 16 }]}>
        <Block width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <Block width="55%" height={18} borderRadius={6} />
          <Block width="85%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Stats row */}
      <View style={[sk.row, { gap: 12, marginBottom: 16 }]}>
        <View
          style={[
            sk.statSkeleton,
            { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
          ]}
        >
          <Block width="40%" height={12} borderRadius={4} />
          <Block width="30%" height={22} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="60%" height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View
          style={[
            sk.statSkeleton,
            { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' },
          ]}
        >
          <Block width="40%" height={12} borderRadius={4} />
          <Block width="30%" height={22} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="60%" height={10} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Search Bar */}
      <Block height={42} borderRadius={14} style={{ marginBottom: 14 }} />

      {/* Tab filter chips */}
      <View style={[sk.row, { gap: 8, marginBottom: 16 }]}>
        <Block width={90} height={32} borderRadius={10} />
        <Block width={90} height={32} borderRadius={10} />
        <Block width={60} height={32} borderRadius={10} />
      </View>

      {/* Card Skeletons */}
      <UtrCardSkeleton isDark={isDark} />
      <UtrCardSkeleton isDark={isDark} />
      <UtrCardSkeleton isDark={isDark} />
    </View>
  );
}

// ─── KYC Card Skeleton ────────────────────────────────────────────────────────
export function KycCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 14,
      }}
    >
      {/* Card Top Strip */}
      <View style={[sk.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
        <Block width={70} height={18} borderRadius={6} />
        <Block width={80} height={14} borderRadius={4} />
      </View>

      {/* User Info Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Block width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <Block width="60%" height={15} borderRadius={4} />
          <Block width="45%" height={12} borderRadius={4} />
          <Block width="75%" height={11} borderRadius={4} />
        </View>
      </View>

      {/* Document Badges */}
      <View style={[sk.row, { gap: 6, marginBottom: 12 }]}>
        <Block width={110} height={22} borderRadius={6} />
        <Block width={95} height={22} borderRadius={6} />
        <Block width={65} height={22} borderRadius={6} />
      </View>

      {/* Action Buttons */}
      <View
        style={{
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
          gap: 8,
        }}
      >
        <View style={[sk.row, { gap: 8 }]}>
          <Block width="48%" height={32} borderRadius={10} />
          <Block width="48%" height={32} borderRadius={10} />
        </View>
        <View style={[sk.row, { gap: 8 }]}>
          <Block width="42%" height={36} borderRadius={10} />
          <Block width="54%" height={36} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

// ─── Full KYC Queue Skeleton ──────────────────────────────────────────────────
export function KycQueueSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View style={{ padding: 14, paddingBottom: 60 }}>
      {/* Overview Stats Row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 16,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
          }}
        >
          <Block width={24} height={24} borderRadius={6} />
          <Block width="40%" height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="65%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 16,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
          }}
        >
          <Block width={24} height={24} borderRadius={6} />
          <Block width="40%" height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="65%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Section Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Block width={160} height={18} borderRadius={4} />
        <Block width={70} height={18} borderRadius={6} />
      </View>

      {/* KYC Cards */}
      <KycCardSkeleton isDark={isDark} />
      <KycCardSkeleton isDark={isDark} />
      <KycCardSkeleton isDark={isDark} />
    </View>
  );
}

// ─── Financial Analytics Skeleton ─────────────────────────────────────────────
export function FinancialAnalyticsSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View style={{ padding: 16 }}>
      {/* Banner Skeleton */}
      <View
        style={{
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Block width={32} height={32} borderRadius={10} />
            <View style={{ gap: 4 }}>
              <Block width={140} height={14} borderRadius={4} />
              <Block width={100} height={10} borderRadius={4} />
            </View>
          </View>
          <Block width={75} height={20} borderRadius={10} />
        </View>
        <View
          style={{
            borderRadius: 12,
            padding: 12,
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            gap: 6,
          }}
        >
          <Block width={90} height={10} borderRadius={4} />
          <Block width="90%" height={12} borderRadius={4} />
          <Block width="70%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            padding: 16,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <Block width={24} height={24} borderRadius={6} />
          <Block width="60%" height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="75%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View
          style={{
            flex: 1,
            borderRadius: 16,
            padding: 16,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <Block width={24} height={24} borderRadius={6} />
          <Block width="60%" height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Block width="75%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Category Section Header */}
      <Block width={120} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Category items */}
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <Block width={110} height={14} borderRadius={4} />
          <Block width={60} height={14} borderRadius={4} />
        </View>
      ))}

      {/* Recent Transactions Header */}
      <Block width={160} height={18} borderRadius={4} style={{ marginTop: 12, marginBottom: 12 }} />

      {/* Transaction items */}
      {[1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Block width="50%" height={14} borderRadius={4} />
            <Block width="70%" height={11} borderRadius={4} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Block width={60} height={14} borderRadius={4} />
            <Block width={45} height={11} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Account Details Skeleton ──────────────────────────────────────────────────
export function AccountCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={{
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Block width={44} height={44} borderRadius={16} />
          <View style={{ gap: 6 }}>
            <Block width={140} height={16} borderRadius={4} />
            <Block width={100} height={10} borderRadius={4} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Block width={32} height={32} borderRadius={10} />
          <Block width={32} height={32} borderRadius={10} />
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Account Number & IFSC */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 16,
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderWidth: 1,
              borderColor: isDark ? '#334155' : '#f1f5f9',
              gap: 6,
            }}
          >
            <Block width={70} height={10} borderRadius={4} />
            <Block width={110} height={14} borderRadius={4} />
          </View>
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 16,
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderWidth: 1,
              borderColor: isDark ? '#334155' : '#f1f5f9',
              gap: 6,
            }}
          >
            <Block width={60} height={10} borderRadius={4} />
            <Block width={90} height={14} borderRadius={4} />
          </View>
        </View>

        {/* UPI ID */}
        <View
          style={{
            padding: 12,
            borderRadius: 16,
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
            gap: 6,
          }}
        >
          <Block width={50} height={10} borderRadius={4} />
          <Block width={140} height={14} borderRadius={4} />
        </View>

        {/* QR Code */}
        <View
          style={{
            alignItems: 'center',
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#f1f5f9',
            gap: 8,
          }}
        >
          <Block width={128} height={128} borderRadius={12} />
          <Block width={100} height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function AccountDetailsSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View style={{ flex: 1 }}>
      {/* Sub-Tab Bar Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          padding: 8,
          gap: 8,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        <Block width="48%" height={38} borderRadius={12} />
        <Block width="48%" height={38} borderRadius={12} />
      </View>

      {/* Account Cards */}
      <View style={{ padding: 16, paddingBottom: 60 }}>
        <AccountCardSkeleton isDark={isDark} />
        <AccountCardSkeleton isDark={isDark} />
      </View>
    </View>
  );
}

// ─── Campaign Details Skeleton ────────────────────────────────────────────────
export function CampaignDetailsSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
      {/* Banner Image */}
      <Block height={230} borderRadius={0} />

      {/* Body Content */}
      <View style={{ padding: 16, gap: 14 }}>
        {/* Badges */}
        <View style={sk.row}>
          <Block width={80} height={24} borderRadius={12} />
          <Block width={65} height={24} borderRadius={12} />
          <Block width={70} height={24} borderRadius={12} />
        </View>

        {/* Title */}
        <Block height={22} borderRadius={6} />
        <Block width="70%" height={22} borderRadius={6} />

        {/* Organizer Row */}
        <View style={[sk.row, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor }]}>
          <Block width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 4 }}>
            <Block width={120} height={14} borderRadius={4} />
            <Block width={90} height={11} borderRadius={4} />
          </View>
        </View>

        {/* Progress & Stats Card */}
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            gap: 10,
          }}
        >
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={110} height={18} borderRadius={4} />
            <Block width={60} height={14} borderRadius={4} />
          </View>
          <Block height={8} borderRadius={4} />
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={80} height={12} borderRadius={4} />
            <Block width={70} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Description Paragraphs */}
        <View style={{ gap: 8, marginTop: 4 }}>
          <Block width={100} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <Block height={13} borderRadius={4} />
          <Block height={13} borderRadius={4} />
          <Block width="90%" height={13} borderRadius={4} />
          <Block width="65%" height={13} borderRadius={4} />
        </View>
      </View>

      {/* Sticky Bottom Donate Button Skeleton */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: cardBg,
          borderTopWidth: 1,
          borderTopColor: borderColor,
        }}
      >
        <Block height={50} borderRadius={14} />
      </View>
    </View>
  );
}

// ─── Donation Form Skeleton ───────────────────────────────────────────────────
export function DonationFormSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
      {/* Top Header Strip */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Block width={36} height={36} borderRadius={10} />
        <Block width={130} height={18} borderRadius={6} />
        <View style={{ width: 36 }} />
      </View>

      {/* Form Body */}
      <View style={{ padding: 16, gap: 16 }}>
        {/* Step Indicator */}
        <View style={[sk.row, { justifyContent: 'center', gap: 10 }]}>
          <Block width={28} height={28} borderRadius={14} />
          <Block width={40} height={4} borderRadius={2} />
          <Block width={28} height={28} borderRadius={14} />
          <Block width={40} height={4} borderRadius={2} />
          <Block width={28} height={28} borderRadius={14} />
        </View>

        {/* Campaign Summary Mini Card */}
        <View
          style={{
            flexDirection: 'row',
            padding: 12,
            borderRadius: 14,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Block width={54} height={54} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Block width="80%" height={14} borderRadius={4} />
            <Block width="50%" height={11} borderRadius={4} />
          </View>
        </View>

        {/* Preset Amount Chips */}
        <View style={{ gap: 8 }}>
          <Block width={110} height={14} borderRadius={4} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Block width="22%" height={40} borderRadius={12} />
            <Block width="22%" height={40} borderRadius={12} />
            <Block width="22%" height={40} borderRadius={12} />
            <Block width="22%" height={40} borderRadius={12} />
          </View>
        </View>

        {/* Amount Input */}
        <View style={{ gap: 8 }}>
          <Block width={90} height={14} borderRadius={4} />
          <Block height={52} borderRadius={14} />
        </View>

        {/* Donor Name & Phone Inputs */}
        <View style={{ gap: 8 }}>
          <Block width={80} height={14} borderRadius={4} />
          <Block height={46} borderRadius={12} />
        </View>
        <View style={{ gap: 8 }}>
          <Block width={95} height={14} borderRadius={4} />
          <Block height={46} borderRadius={12} />
        </View>

        {/* Submit CTA */}
        <Block height={50} borderRadius={14} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

// ─── Dashboard Home Skeleton ──────────────────────────────────────────────────
export function DashboardHomeSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* User Header Profile Card */}
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 1,
          borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Block width={56} height={56} borderRadius={28} />
        <View style={{ flex: 1, gap: 6 }}>
          <Block width="60%" height={16} borderRadius={4} />
          <Block width="40%" height={12} borderRadius={4} />
          <Block width="70%" height={10} borderRadius={4} />
        </View>
      </View>

      {/* Role Mandate Banner */}
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Block width={140} height={14} borderRadius={4} />
        <Block height={12} borderRadius={4} />
        <Block width="80%" height={12} borderRadius={4} />
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={[sk.statSkeleton, { backgroundColor: cardBg, borderColor }]}>
          <Block width="50%" height={12} borderRadius={4} />
          <Block width="70%" height={20} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={[sk.statSkeleton, { backgroundColor: cardBg, borderColor }]}>
          <Block width="50%" height={12} borderRadius={4} />
          <Block width="70%" height={20} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={[sk.statSkeleton, { backgroundColor: cardBg, borderColor }]}>
          <Block width="50%" height={12} borderRadius={4} />
          <Block width="70%" height={20} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Quick Action Tiles */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              alignItems: 'center',
              padding: 12,
              borderRadius: 14,
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor,
              gap: 6,
            }}
          >
            <Block width={32} height={32} borderRadius={10} />
            <Block width="80%" height={10} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Recent List Title & Cards */}
      <Block width={140} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
      <UtrCardSkeleton isDark={isDark} />
      <UtrCardSkeleton isDark={isDark} />
    </View>
  );
}

// ─── My Donations List Skeleton ───────────────────────────────────────────────
export function MyDonationsListSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Summary Header Card */}
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          backgroundColor: isDark ? '#064e3b' : '#10b981',
          marginBottom: 16,
          gap: 10,
        }}
      >
        <Block width={100} height={12} borderRadius={4} />
        <Block width={140} height={26} borderRadius={6} />
        <View style={[sk.row, { justifyContent: 'space-between', marginTop: 6 }]}>
          <Block width={90} height={12} borderRadius={4} />
          <Block width={80} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[sk.row, { gap: 8, marginBottom: 16 }]}>
        <Block width={60} height={30} borderRadius={15} />
        <Block width={80} height={30} borderRadius={15} />
        <Block width={80} height={30} borderRadius={15} />
        <Block width={70} height={30} borderRadius={15} />
      </View>

      {/* Donation Cards */}
      <UtrCardSkeleton isDark={isDark} />
      <UtrCardSkeleton isDark={isDark} />
      <UtrCardSkeleton isDark={isDark} />
    </View>
  );
}

// ─── Team List Skeleton ───────────────────────────────────────────────────────
export function TeamListSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header Banner */}
      <View
        style={{
          borderRadius: 18,
          padding: 16,
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Block width={160} height={18} borderRadius={4} />
        <Block height={12} borderRadius={4} />
        <Block width="75%" height={12} borderRadius={4} />
      </View>

      {/* Unit Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 18,
            padding: 16,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 12,
          }}
        >
          {/* Top Row: Unit Name & Status */}
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Block width="70%" height={16} borderRadius={4} />
              <Block width="45%" height={11} borderRadius={4} />
            </View>
            <Block width={70} height={22} borderRadius={11} />
          </View>

          {/* President Strip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              gap: 10,
            }}
          >
            <Block width={36} height={36} borderRadius={18} />
            <View style={{ flex: 1, gap: 4 }}>
              <Block width={110} height={12} borderRadius={4} />
              <Block width={80} height={10} borderRadius={4} />
            </View>
            <Block width={60} height={24} borderRadius={8} />
          </View>

          {/* Members Counter & Actions */}
          <View style={[sk.row, { justifyContent: 'space-between', paddingTop: 4 }]}>
            <Block width={100} height={12} borderRadius={4} />
            <Block width={80} height={26} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Meeting List Skeleton ────────────────────────────────────────────────────
export function MeetingListSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header Banner */}
      <View
        style={{
          borderRadius: 18,
          padding: 16,
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Block width={180} height={18} borderRadius={4} />
        <Block height={12} borderRadius={4} />
        <Block width="70%" height={12} borderRadius={4} />
      </View>

      {/* Filter Tabs */}
      <View style={[sk.row, { gap: 8, marginBottom: 16 }]}>
        <Block width={55} height={30} borderRadius={10} />
        <Block width={75} height={30} borderRadius={10} />
        <Block width={85} height={30} borderRadius={10} />
        <Block width={80} height={30} borderRadius={10} />
      </View>

      {/* Meeting Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 18,
            padding: 16,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 10,
          }}
        >
          {/* Status & Date */}
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={80} height={22} borderRadius={11} />
            <Block width={100} height={12} borderRadius={4} />
          </View>

          {/* Title */}
          <Block width="80%" height={16} borderRadius={4} />

          {/* Venue & Time */}
          <View style={[sk.row, { gap: 12 }]}>
            <Block width={110} height={12} borderRadius={4} />
            <Block width={90} height={12} borderRadius={4} />
          </View>

          {/* Agenda preview */}
          <Block height={12} borderRadius={4} />
          <Block width="65%" height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// ─── District Committee Skeleton ──────────────────────────────────────────────
export function DistrictCommitteeSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 14 }}>
      {/* 5 District Posts */}
      {[1, 2, 3, 4, 5].map((slot) => (
        <View
          key={slot}
          style={{
            borderRadius: 18,
            padding: 14,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 10,
          }}
        >
          {/* Top Post Header */}
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <View style={[sk.row, { gap: 10 }]}>
              <Block width={34} height={34} borderRadius={10} />
              <View style={{ gap: 4 }}>
                <Block width={130} height={15} borderRadius={4} />
                <Block width={90} height={10} borderRadius={4} />
              </View>
            </View>
            <Block width={60} height={22} borderRadius={11} />
          </View>

          {/* Duty description */}
          <Block height={11} borderRadius={4} />
          <Block width="80%" height={11} borderRadius={4} />

          {/* Officer Info Strip */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              gap: 10,
            }}
          >
            <Block width={36} height={36} borderRadius={18} />
            <View style={{ flex: 1, gap: 4 }}>
              <Block width={120} height={13} borderRadius={4} />
              <Block width={80} height={10} borderRadius={4} />
            </View>
            <Block width={70} height={26} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Contact Messages Skeleton ────────────────────────────────────────────────
export function ContactMessagesSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Search Header */}
      <Block height={42} borderRadius={12} style={{ marginBottom: 16 }} />

      {/* Messages */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 10,
            gap: 8,
          }}
        >
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <View style={[sk.row, { gap: 10 }]}>
              <Block width={36} height={36} borderRadius={18} />
              <View style={{ gap: 4 }}>
                <Block width={120} height={14} borderRadius={4} />
                <Block width={90} height={11} borderRadius={4} />
              </View>
            </View>
            <Block width={50} height={11} borderRadius={4} />
          </View>
          <Block width="60%" height={13} borderRadius={4} />
          <Block height={11} borderRadius={4} />
          <Block width="80%" height={11} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// ─── District Role Dashboards Skeletons ───────────────────────────────────────

export function DistrictMeetingsSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Block width={30} height={30} borderRadius={8} />
        <View style={{ marginLeft: 8, gap: 4 }}>
          <Block width={110} height={14} borderRadius={4} />
          <Block width={70} height={10} borderRadius={4} />
        </View>
      </View>
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          marginBottom: 10,
          gap: 6,
        }}
      >
        <View style={[sk.row, { justifyContent: 'space-between' }]}>
          <Block width="65%" height={14} borderRadius={4} />
          <Block width={55} height={18} borderRadius={10} />
        </View>
        <Block width="40%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

export function DistrictPresidentSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header Banner */}
      <View
        style={{
          borderRadius: 24,
          padding: 20,
          backgroundColor: isDark ? '#064e3b' : '#064e3b',
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Block width={48} height={48} borderRadius={16} />
        <View style={{ flex: 1, gap: 6 }}>
          <Block width="60%" height={20} borderRadius={6} />
          <Block width="40%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Metric Cards */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 18,
            padding: 16,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 10,
          }}
        >
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={140} height={12} borderRadius={4} />
            <Block width={36} height={36} borderRadius={10} />
          </View>
          <Block width="45%" height={26} borderRadius={6} />
          <View style={[sk.row, { justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: borderColor, paddingTop: 10 }]}>
            <Block width={100} height={12} borderRadius={4} />
            <Block width={80} height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DistrictCoordinatorSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header */}
      <View
        style={{
          borderRadius: 24,
          padding: 20,
          backgroundColor: isDark ? '#064e3b' : '#064e3b',
          marginBottom: 16,
          gap: 6,
        }}
      >
        <Block width={180} height={22} borderRadius={6} />
        <Block width={120} height={12} borderRadius={4} />
      </View>

      {/* 3 KYC Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 18,
            padding: 18,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 10,
          }}
        >
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={100} height={12} borderRadius={4} />
            <Block width={38} height={38} borderRadius={12} />
          </View>
          <Block width={70} height={30} borderRadius={6} />
          <Block width={130} height={12} borderRadius={4} />
        </View>
      ))}

      {/* Desk Action Card */}
      <View
        style={{
          borderRadius: 24,
          padding: 18,
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
          marginTop: 6,
          gap: 12,
        }}
      >
        <View style={[sk.row, { gap: 12 }]}>
          <Block width={44} height={44} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Block width={160} height={14} borderRadius={4} />
            <Block width="80%" height={12} borderRadius={4} />
          </View>
        </View>
        <Block height={42} borderRadius={12} />
      </View>

      <DistrictMeetingsSkeleton isDark={isDark} />
    </View>
  );
}

export function GenSecretarySkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header */}
      <View
        style={{
          borderRadius: 24,
          padding: 20,
          backgroundColor: isDark ? '#064e3b' : '#064e3b',
          marginBottom: 16,
          gap: 6,
        }}
      >
        <Block width={200} height={22} borderRadius={6} />
        <Block width={110} height={12} borderRadius={4} />
      </View>

      {/* 2 Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={70} height={10} borderRadius={4} />
            <Block width={22} height={22} borderRadius={6} />
          </View>
          <Block width={40} height={24} borderRadius={6} />
          <Block width={80} height={10} borderRadius={4} />
        </View>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <View style={[sk.row, { justifyContent: 'space-between' }]}>
            <Block width={80} height={10} borderRadius={4} />
            <Block width={22} height={22} borderRadius={6} />
          </View>
          <Block width={40} height={24} borderRadius={6} />
          <Block width={80} height={10} borderRadius={4} />
        </View>
      </View>

      {/* Create Team CTA */}
      <Block height={72} borderRadius={18} style={{ marginBottom: 18 }} />

      {/* Section Title */}
      <Block width={120} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Team Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Block width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Block width="65%" height={14} borderRadius={4} />
            <Block width="40%" height={11} borderRadius={4} />
          </View>
        </View>
      ))}

      <DistrictMeetingsSkeleton isDark={isDark} />
    </View>
  );
}

export function SecretarySkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header */}
      <View
        style={{
          borderRadius: 24,
          padding: 20,
          backgroundColor: isDark ? '#064e3b' : '#064e3b',
          marginBottom: 16,
          gap: 6,
        }}
      >
        <Block width={170} height={22} borderRadius={6} />
        <Block width={100} height={12} borderRadius={4} />
      </View>

      {/* 2 Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <Block width={22} height={22} borderRadius={6} />
          <Block width={45} height={24} borderRadius={6} />
          <Block width={90} height={11} borderRadius={4} />
        </View>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <Block width={22} height={22} borderRadius={6} />
          <Block width={45} height={24} borderRadius={6} />
          <Block width={90} height={11} borderRadius={4} />
        </View>
      </View>

      {/* Action Buttons row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
        <Block width="48%" height={56} borderRadius={16} />
        <Block width="48%" height={56} borderRadius={16} />
      </View>

      {/* Section Title */}
      <Block width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Meeting Cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 10,
            gap: 6,
          }}
        >
          <Block width="75%" height={14} borderRadius={4} />
          <Block width="45%" height={11} borderRadius={4} />
          <Block width="55%" height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

export function FinanceCoorSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc', padding: 16 }}>
      {/* Header */}
      <View
        style={{
          borderRadius: 24,
          padding: 20,
          backgroundColor: isDark ? '#064e3b' : '#064e3b',
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Block width={48} height={48} borderRadius={16} />
        <View style={{ flex: 1, gap: 6 }}>
          <Block width="70%" height={18} borderRadius={6} />
          <Block width="35%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* 2 Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <Block width={22} height={22} borderRadius={6} />
          <Block width="70%" height={22} borderRadius={6} />
          <Block width={80} height={10} borderRadius={4} />
        </View>
        <View style={{ flex: 1, borderRadius: 16, padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor, gap: 8 }}>
          <Block width={22} height={22} borderRadius={6} />
          <Block width="40%" height={22} borderRadius={6} />
          <Block width={90} height={10} borderRadius={4} />
        </View>
      </View>

      {/* Navigation CTA Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
        <Block width="48%" height={60} borderRadius={16} />
        <Block width="48%" height={60} borderRadius={16} />
      </View>

      {/* Workspace Header */}
      <Block width={150} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Workspace cards */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            borderRadius: 16,
            padding: 16,
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: 12,
            gap: 10,
          }}
        >
          <View style={[sk.row, { gap: 10 }]}>
            <Block width={38} height={38} borderRadius={10} />
            <Block width={130} height={14} borderRadius={4} />
          </View>
          <Block height={12} borderRadius={4} />
          <Block width="80%" height={12} borderRadius={4} />
        </View>
      ))}

      <DistrictMeetingsSkeleton isDark={isDark} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  campaignBody: { padding: 14, gap: 0 },
  communityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  deskContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
  },
  statSkeleton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  utrCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
});

// ─── Community Admin Dashboard Skeleton ───────────────────────────────────────
export function CommunityAdminSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const outerBg = isDark ? '#090d16' : '#f8fafc';

  const MetricCard = () => (
    <View
      style={{
        width: '48%',
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Block width={40} height={40} borderRadius={12} />
        <Block width={56} height={14} borderRadius={6} />
      </View>
      <Block width={80} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
      <Block width={112} height={12} borderRadius={6} />
    </View>
  );

  const MeetingCard = () => (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Block width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Block width="75%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />
          <Block width="50%" height={12} borderRadius={6} />
        </View>
        <Block width={24} height={24} borderRadius={12} />
      </View>
      <Block height={12} borderRadius={6} style={{ marginBottom: 8 }} />
      <Block width="80%" height={12} borderRadius={6} style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Block width={96} height={32} borderRadius={10} />
        <Block width={112} height={32} borderRadius={10} />
      </View>
    </View>
  );

  const AnnouncementCard = () => (
    <View
      style={{
        backgroundColor: cardBg,
        borderColor: cardBorder,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Block width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Block width={128} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
          <Block width={96} height={12} borderRadius={6} />
        </View>
      </View>
      <Block height={12} borderRadius={6} style={{ marginBottom: 8 }} />
      <Block height={12} borderRadius={6} style={{ marginBottom: 8 }} />
      <Block width="60%" height={12} borderRadius={6} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: outerBg }}>
      {/* Community Banner */}
      <View
        style={{
          margin: 16,
          marginBottom: 20,
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderWidth: 1,
          borderRadius: 24,
          padding: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Block width={48} height={48} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Block width={144} height={18} borderRadius={6} style={{ marginBottom: 8 }} />
            <Block width={96} height={12} borderRadius={6} />
          </View>
        </View>
        <Block width="75%" height={28} borderRadius={8} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Block width={80} height={12} borderRadius={6} style={{ marginRight: 12 }} />
          <Block width={96} height={12} borderRadius={6} style={{ marginRight: 12 }} />
          <Block width={80} height={12} borderRadius={6} />
        </View>
      </View>

      {/* 4-Metric Grid */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          <MetricCard />
          <MetricCard />
          <MetricCard />
          <MetricCard />
        </View>
      </View>

      {/* Meetings Section */}
      <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Block width={128} height={22} borderRadius={6} />
          <Block width={64} height={16} borderRadius={6} />
        </View>
        <MeetingCard />
        <MeetingCard />
      </View>

      {/* Announcements Section */}
      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Block width={160} height={22} borderRadius={6} />
          <Block width={64} height={16} borderRadius={6} />
        </View>
        <AnnouncementCard />
        <AnnouncementCard />
      </View>
    </View>
  );
}

// ─── Nominee Card Skeleton ──────────────────────────────────────────────────
export function NomineeCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
        padding: 16,
        gap: 14,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Block width={48} height={48} borderRadius={16} />
          <View style={{ gap: 6 }}>
            <Block width={140} height={16} borderRadius={4} />
            <Block width={80} height={12} borderRadius={4} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Block width={32} height={32} borderRadius={10} />
          <Block width={32} height={32} borderRadius={10} />
        </View>
      </View>

      {/* Grid Fields */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
          <Block width={60} height={10} borderRadius={3} />
          <Block width={100} height={14} borderRadius={4} />
        </View>
        <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
          <Block width={60} height={10} borderRadius={3} />
          <Block width={80} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Address / extra bar */}
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
        <Block width={50} height={10} borderRadius={3} />
        <Block width="85%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

// ─── Member Bank Card Skeleton ───────────────────────────────────────────────
export function MemberBankCardSkeleton({ isDark = false }: { isDark?: boolean }) {
  const Block = isDark ? ShimmerBlockDark : ShimmerBlock;
  return (
    <View
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
        padding: 16,
        gap: 14,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Block width={48} height={48} borderRadius={16} />
          <View style={{ gap: 6 }}>
            <Block width={150} height={16} borderRadius={4} />
            <Block width={90} height={12} borderRadius={4} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Block width={32} height={32} borderRadius={10} />
          <Block width={32} height={32} borderRadius={10} />
        </View>
      </View>

      {/* Account Number Box */}
      <View style={{ padding: 14, borderRadius: 14, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
        <Block width={80} height={10} borderRadius={3} />
        <Block width={160} height={16} borderRadius={4} />
      </View>

      {/* Grid Fields */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
          <Block width={50} height={10} borderRadius={3} />
          <Block width={90} height={12} borderRadius={4} />
        </View>
        <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? '#0f172a' : '#f8fafc', gap: 6 }}>
          <Block width={50} height={10} borderRadius={3} />
          <Block width={80} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

