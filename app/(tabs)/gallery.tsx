import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { getGalleryPhotos, GalleryPhoto } from '../../src/services/galleryService';
import { Image as ImageIcon, MapPin, X, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateCategory,
  translateCity,
  translateGalleryPhoto,
} from '../../src/lib/translateEntity';
import { DynamicText } from '../../src/components/DynamicText';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 44) / 2;

const CATEGORIES = ['All', 'Community', 'Education', 'Medical', 'Emergency', 'Masjid', 'Food'];

// Theme-adaptive Gallery Skeleton Component
function GalleryPhotoSkeleton() {
  return (
    <View
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
      className="bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden animate-pulse shadow-sm"
    />
  );
}

export default function GalleryScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getGalleryPhotos();
      setPhotos(data || []);
    } catch (err) {
      console.warn('Error loading gallery photos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filtered =
    selectedCat === 'All'
      ? photos
      : photos.filter((p) => {
          const cat = (p.category || '').toLowerCase();
          const target = selectedCat.toLowerCase();
          if (cat === target) return true;
          if (target === 'community' && (cat.includes('nikah') || cat.includes('community'))) return true;
          if (target === 'education' && (cat.includes('education') || cat.includes('school') || cat.includes('child'))) return true;
          if (target === 'medical' && (cat.includes('medical') || cat.includes('dialysis') || cat.includes('hospital'))) return true;
          if (target === 'food' && (cat.includes('food') || cat.includes('ration'))) return true;
          if (target === 'emergency' && (cat.includes('emergency') || cat.includes('relief'))) return true;
          return cat.includes(target);
        });

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Category filter strip */}
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full border self-center ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {translateCategory(cat, lang)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {/* Header summary */}
        <View className="mb-4">
          <Text className="text-xl font-black text-slate-900 dark:text-white">
            {t('gallery_page.title', 'Community Relief Gallery')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('gallery_page.desc', 'Verified ground photographs of ration drives, hospital visits, and community initiatives.')}
          </Text>
        </View>

        {/* Skeleton Grid on initial load */}
        {loading ? (
          <View className="flex-row flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GalleryPhotoSkeleton key={i} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 my-4">
            <ImageIcon color="#94a3b8" size={48} />
            <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-3">
              {t('gallery_page.no_photos', 'No photos found')}
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {filtered.map((rawPhoto) => {
              const photo = translateGalleryPhoto(rawPhoto, lang);
              const displayCat = translateCategory(photo.category, lang);
              const displayCity = translateCity(photo.city, lang);

              return (
                <TouchableOpacity
                  key={photo.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPhoto(rawPhoto)}
                  style={{ width: ITEM_SIZE }}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <View className="relative">
                    <Image
                      source={{ uri: photo.image }}
                      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <View className="absolute bottom-2 left-2.5 right-2.5">
                      <DynamicText
                        text={rawPhoto.title}
                        className="text-white text-xs font-extrabold leading-4"
                        numberOfLines={1}
                      />
                      <View className="flex-row items-center mt-0.5">
                        <MapPin color="#34d399" size={10} />
                        <DynamicText
                          text={rawPhoto.city || 'Bareilly'}
                          className="text-emerald-300 text-[10px] ml-1 font-medium"
                          numberOfLines={1}
                        />
                        <Text className="text-emerald-300 text-[10px] font-medium">
                          {' • '}{displayCat}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Full Photo Preview Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View className="flex-1 bg-black/90 justify-center p-4">
          <TouchableOpacity
            onPress={() => setSelectedPhoto(null)}
            className="absolute top-12 right-6 p-2.5 rounded-full bg-white/20 z-20"
          >
            <X color="#ffffff" size={20} />
          </TouchableOpacity>

          {selectedPhoto && (() => {
            const photo = translateGalleryPhoto(selectedPhoto, lang);
            const displayCat = translateCategory(photo.category, lang);
            const displayCity = translateCity(photo.city, lang);

            return (
              <View className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
                <Image
                  source={{ uri: photo.image }}
                  className="w-full h-80"
                  resizeMode="contain"
                />
                <View className="p-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-emerald-400 font-bold text-xs uppercase">
                      {displayCat}
                    </Text>
                    <DynamicText
                      text={selectedPhoto.city || 'Bareilly'}
                      className="text-slate-400 text-xs font-medium"
                    />
                  </View>
                  <DynamicText
                    text={selectedPhoto.title}
                    className="text-white font-extrabold text-base mb-1"
                  />
                  {selectedPhoto.description && (
                    <DynamicText
                      text={selectedPhoto.description}
                      className="text-slate-300 text-xs leading-5 mt-1"
                    />
                  )}
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}
