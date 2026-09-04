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
function ShimmerBlock({
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

function ShimmerBlockDark({
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

