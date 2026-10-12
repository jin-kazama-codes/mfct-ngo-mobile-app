import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Dimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';

interface CampaignImageCarouselProps {
  images: string[];
  height?: number;
  overlayBadges?: React.ReactNode;
  containerStyle?: ViewStyle;
  showDots?: boolean;
  showCounter?: boolean;
  showChevrons?: boolean;
  enableFullscreenViewer?: boolean;
}

export default function CampaignImageCarousel({
  images,
  height = 160,
  overlayBadges,
  containerStyle,
  showDots = true,
  showCounter = true,
  showChevrons = true,
  enableFullscreenViewer = true,
}: CampaignImageCarouselProps) {
  const cleanImages = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean)
    : [DEFAULT_FALLBACK_IMAGE];

  const total = cleanImages.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(SCREEN_WIDTH - 32);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const fullscreenScrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (containerWidth > 0) {
      const nextIndex = Math.max(0, Math.min(total - 1, Math.round(offsetX / containerWidth)));
      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (index >= 0 && index < total && scrollRef.current && containerWidth > 0) {
      scrollRef.current.scrollTo({ x: index * containerWidth, animated: true });
      setActiveIndex(index);
    }
  };

  const handleNext = (e?: any) => {
    e?.stopPropagation?.();
    if (activeIndex < total - 1) {
      scrollToIndex(activeIndex + 1);
    } else {
      scrollToIndex(0);
    }
  };

  const handlePrev = (e?: any) => {
    e?.stopPropagation?.();
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    } else {
      scrollToIndex(total - 1);
    }
  };

  const openFullscreen = (index: number) => {
    if (!enableFullscreenViewer) return;
    setFullscreenIndex(index);
    setFullscreenVisible(true);
  };

  return (
    <View
      style={[styles.carouselContainer, { height }, containerStyle]}
      onLayout={(e) => {
        const measuredWidth = e.nativeEvent.layout.width;
        if (measuredWidth > 0 && Math.abs(measuredWidth - containerWidth) > 2) {
          setContainerWidth(measuredWidth);
        }
      }}
    >
      {/* Horizontal Scrollable Images */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.scrollView}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {cleanImages.map((uri, idx) => (
          <TouchableOpacity
            key={`img-${idx}-${uri}`}
            activeOpacity={enableFullscreenViewer ? 0.95 : 1}
            onPress={() => openFullscreen(idx)}
            style={[styles.slideItem, { width: containerWidth, height }]}
          >
            <Image
              source={{ uri: uri || DEFAULT_FALLBACK_IMAGE }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Badges Overlay (Top-Left) */}
      {overlayBadges && (
        <View pointerEvents="box-none" style={styles.badgeOverlay}>
          {overlayBadges}
        </View>
      )}

      {/* Multi-photo Counter Badge (Top-Right) */}
      {total > 1 && showCounter && (
        <View style={styles.counterBadge} pointerEvents="none">
          <ImageIcon color="#ffffff" size={11} style={{ marginRight: 4 }} />
          <Text style={styles.counterBadgeText}>
            {activeIndex + 1}/{total}
          </Text>
        </View>
      )}

      {/* Left Navigation Arrow */}
      {total > 1 && showChevrons && (
        <TouchableOpacity
          onPress={handlePrev}
          activeOpacity={0.8}
          style={[styles.navArrowBtn, styles.navArrowLeft]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="#ffffff" size={16} />
        </TouchableOpacity>
      )}

      {/* Right Navigation Arrow */}
      {total > 1 && showChevrons && (
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={[styles.navArrowBtn, styles.navArrowRight]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight color="#ffffff" size={16} />
        </TouchableOpacity>
      )}

      {/* Dots Pagination Indicators (Bottom-Center) */}
      {total > 1 && showDots && (
        <View style={styles.dotsContainer} pointerEvents="none">
          {cleanImages.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View
                key={`dot-${idx}`}
                style={[
                  styles.dot,
                  isActive ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {enableFullscreenViewer && (
        <Modal
          visible={fullscreenVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFullscreenVisible(false)}
        >
          <View style={styles.fullscreenOverlay}>
            {/* Header with Title & Close button */}
            <View style={styles.fullscreenHeader}>
              <View style={styles.fullscreenCounterPill}>
                <ImageIcon color="#ffffff" size={14} style={{ marginRight: 6 }} />
                <Text style={styles.fullscreenCounterText}>
                  {fullscreenIndex + 1} / {total} Photos
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setFullscreenVisible(false)}
                style={styles.fullscreenCloseBtn}
                activeOpacity={0.7}
              >
                <X color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Fullscreen ScrollView */}
            <ScrollView
              ref={fullscreenScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: fullscreenIndex * SCREEN_WIDTH, y: 0 }}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const nextIdx = Math.max(0, Math.min(total - 1, Math.round(offsetX / SCREEN_WIDTH)));
                if (nextIdx !== fullscreenIndex) {
                  setFullscreenIndex(nextIdx);
                }
              }}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
            >
              {cleanImages.map((uri, idx) => (
                <View
                  key={`fs-${idx}-${uri}`}
                  style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems: 'center' }}
                >
                  <Image
                    source={{ uri: uri || DEFAULT_FALLBACK_IMAGE }}
                    style={{ width: SCREEN_WIDTH, height: '80%' }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {/* Bottom Dots Indicator in Fullscreen */}
            {total > 1 && (
              <View style={styles.fullscreenDots}>
                {cleanImages.map((_, idx) => (
                  <View
                    key={`fs-dot-${idx}`}
                    style={[
                      styles.dot,
                      idx === fullscreenIndex ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  slideItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 60,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    zIndex: 10,
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  counterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  navArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navArrowLeft: {
    left: 8,
  },
  navArrowRight: {
    right: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 10,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  inactiveDot: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  // Fullscreen Viewer
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 44 : 20,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  fullscreenCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fullscreenCounterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  fullscreenCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 20,
  },
});
