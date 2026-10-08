import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getGalleryPhotos,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  GalleryPhoto,
} from '../../../src/services/galleryService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import {
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Check,
  Filter,
  Eye,
  Edit3,
  Camera,
  X,
  MapPin,
  Sparkles,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { GalleryGridSkeleton } from '../../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../../src/context/AppStateProvider';
import { getLanguageCode, translateCategory } from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

const { width } = Dimensions.get('window');
const TILE = (width - 36) / 2;

const CATEGORIES = ['All', 'Community', 'Education', 'Medical', 'Emergency', 'Masjid', 'Food', 'General'];

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function GalleryAdminScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeUser, currentRole } = useAppState();

  // Mirror impact-stories.tsx: admins get 'approved', others get 'pending'
  const rawRole = (activeUser?.role || currentRole || 'member').toLowerCase().trim().replace(' ', '_');
  const isAdmin = ['super_admin', 'executive_admin', 'community_admin', 'admin'].some(r => rawRole.includes(r));

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState('All');

  // Edit State
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  // View Modal State
  const [selectedViewPhoto, setSelectedViewPhoto] = useState<GalleryPhoto | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Approve state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Media Picker Modal State
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Toast State
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Form state
  const [imageUri, setImageUri] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('Community');
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getGalleryPhotos();
      setPhotos(data);
    } catch (e) {
      console.error('Error loading gallery photos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPhotos = useMemo(
    () => (filterCat === 'All' ? photos : photos.filter(p => p.category === filterCat)),
    [photos, filterCat]
  );

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    setShowMediaPicker(false);
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setImageUri(asset.uri);
          setImageFileName(asset.fileName || `photo_${Date.now()}.jpg`);
          showToast('Photo captured successfully!', 'success');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is needed to pick an image.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setImageUri(asset.uri);
          setImageFileName(asset.fileName || `photo_${Date.now()}.jpg`);
          showToast('Photo selected from gallery!', 'success');
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showToast('Unable to open media picker on this device.', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setImageUri('');
    setImageFileName('');
    setTitle('');
    setCity((activeUser?.district || activeUser?.city || '').trim());
    setCategory('Community');
    setEditingPhotoId(null);
    setShowUrlFallback(false);
  };

  // Open photo in Edit mode
  const handleStartEdit = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setImageUri(photo.image);
    setImageFileName(photo.image.split('/').pop() || 'photo.jpg');
    setTitle(photo.title);
    setCity(photo.city || '');
    setCategory(photo.category || 'Community');
    setSelectedViewPhoto(null);
    setActiveSubTab('create');
  };

  // Save (Create or Update)
  const handleSubmit = async () => {
    if (!imageUri.trim()) {
      showToast('Please select or upload an image first.', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a photo title.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const userDistrictVal = (activeUser?.district || activeUser?.city || '').trim();
      const finalCity = editingPhotoId ? (city.trim() || userDistrictVal) : userDistrictVal;
      const finalImage = await uploadImageToSupabase(imageUri.trim(), 'gallery');

      if (editingPhotoId) {
        // UPDATE existing photo
        const updated = await updateGalleryPhoto(editingPhotoId, {
          title: title.trim(),
          city: finalCity,
          image: finalImage || imageUri.trim(),
          category,
        });

        setPhotos(prev => prev.map(p => (p.id === editingPhotoId ? { ...p, ...updated } : p)));
        showToast('Photo updated successfully!', 'success');
      } else {
        // CREATE new photo
        const newPhoto = await createGalleryPhoto({
          title: title.trim(),
          city: userDistrictVal,
          image: finalImage || imageUri.trim(),
          category,
          createdBy: activeUser?.id,
          communityId: activeUser?.communityId,
          status: isAdmin ? ('approved' as const) : ('pending' as const),
        });

        setPhotos(prev => [newPhoto, ...prev]);
        showToast('Photo added to gallery successfully!', 'success');
      }

      resetForm();
      setActiveSubTab('list');
      loadData();
    } catch (err: any) {
      console.error('Save gallery photo error:', err);
      showToast(err?.message || 'Failed to save photo. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve Photo
  const handleApprovePhoto = async (id: string) => {
    setApprovingId(id);
    try {
      await updateGalleryPhoto(id, { status: 'approved' });
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
      if (selectedViewPhoto?.id === id) {
        setSelectedViewPhoto(prev => prev ? { ...prev, status: 'approved' } : null);
      }
      showToast(tr('तस्वीर स्वीकृत कर दी गई!', 'تصویر منظور کر لی گئی!', 'Photo approved successfully!'), 'success');
    } catch (err: any) {
      showToast(err?.message || tr('स्वीकृति विफल रही', 'منظوری ناکام رہی', 'Failed to approve photo.'), 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteGalleryPhoto(deleteConfirmId);
      setPhotos(prev => prev.filter(p => p.id !== deleteConfirmId));
      if (selectedViewPhoto?.id === deleteConfirmId) {
        setSelectedViewPhoto(null);
      }
      showToast('Photo deleted successfully!', 'success');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Toast Banner */}
      {toast && (
        <View
          className={`absolute top-2.5 left-4 right-4 z-50 flex-row items-center py-3 px-4 rounded-xl gap-2.5 shadow-md ${toast.type === 'success'
            ? 'bg-emerald-600'
            : toast.type === 'error'
              ? 'bg-rose-600'
              : 'bg-sky-600'
            }`}
        >
          {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
          {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
          {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
          <Text className="text-white text-[13px] font-bold flex-1">{toast.message}</Text>
        </View>
      )}

      {/* Sub-Tab Header */}
      <View className="flex-row border-b border-slate-200 dark:border-slate-800 p-2.5 gap-2 bg-white dark:bg-slate-900">
        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'list') setActiveSubTab('list');
          }}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${activeSubTab === 'list'
            ? 'bg-emerald-500 shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800'
            }`}
        >
          <ImageIcon color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={16} />
          <Text
            className={`text-[13px] font-bold ${activeSubTab === 'list' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
          >
            {t('gallery.tab_list', 'Gallery')} ({photos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'create') {
              resetForm();
              setActiveSubTab('create');
            }
          }}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${activeSubTab === 'create'
            ? 'bg-emerald-500 shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800'
            }`}
        >
          {editingPhotoId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={16} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={16} />
          )}
          <Text
            className={`text-[13px] font-bold ${activeSubTab === 'create' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
              }`}
          >
            {editingPhotoId ? 'Edit Photo' : t('gallery.tab_create', '+ Add Photo')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        <>
          {/* Category Filter */}
          <View className="flex-row items-center py-2.5 px-3 border-b border-slate-200 dark:border-slate-800 gap-2 bg-white dark:bg-slate-900">
            <Filter color={isDark ? '#94a3b8' : '#64748b'} size={14} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {CATEGORIES.map(cat => {
                const isSelected = filterCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFilterCat(cat)}
                    className={`py-1.5 px-3 rounded-full border ${isSelected
                      ? 'bg-emerald-500 border-emerald-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      {translateCategory(cat, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
              <GalleryGridSkeleton isDark={isDark} />
            </ScrollView>
          ) : (
            <View className="flex-1">
              <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {filteredPhotos.length === 0 ? (
                  <View className="items-center justify-center py-16 px-5">
                    <ImageIcon color={isDark ? '#64748b' : '#94a3b8'} size={48} />
                    <Text className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {t('gallery.empty', 'No photos in this category')}
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between">
                    {filteredPhotos.map(photo => (
                      <View
                        key={photo.id}
                        style={{ width: TILE }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-3.5 overflow-hidden shadow-xs"
                      >
                        {/* Photo Thumbnail */}
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => setSelectedViewPhoto(photo)}
                          className="relative w-full bg-slate-100 dark:bg-slate-800"
                          style={{ height: 130 }}
                        >
                          <Image
                            source={{ uri: photo.image }}
                            style={{ width: '100%', height: 130 }}
                            resizeMode="cover"
                          />

                          {/* Category Badge */}
                          <View className="absolute top-2 left-2 bg-black/65 px-2 py-0.5 rounded-md">
                            <Text className="text-white text-[10px] font-bold">
                              {translateCategory(photo.category, lang)}
                            </Text>
                          </View>

                          {/* Status Badge */}
                          {photo.status === 'pending' && (
                            <View className="absolute top-2 right-2 bg-amber-500/90 px-1.5 py-0.5 rounded-md">
                              <Text className="text-white text-[9px] font-bold">Pending</Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Photo Info */}
                        <View className="p-2.5">
                          <DynamicText
                            text={photo.title}
                            style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}
                            numberOfLines={1}
                          />
                          <View className="flex-row items-center gap-1 mt-1">
                            <MapPin color="#10b981" size={11} />
                            <DynamicText
                              text={photo.city || ''}
                              style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}
                              numberOfLines={1}
                            />
                          </View>
                        </View>

                        {/* Action Buttons: Approve (admin), View, Edit, Delete */}
                        <View className="flex-row items-center border-t border-slate-200 dark:border-slate-800 p-1.5 gap-1 bg-slate-50/70 dark:bg-slate-800/40">
                          {/* Approve Button — admin only, pending photos only */}
                          {photo.status === 'pending' && isAdmin && (
                            <TouchableOpacity
                              onPress={() => handleApprovePhoto(photo.id)}
                              disabled={approvingId === photo.id}
                              className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60"
                              accessibilityLabel="Approve photo"
                              activeOpacity={0.7}
                            >
                              {approvingId === photo.id ? (
                                <ActivityIndicator size={10} color="#059669" />
                              ) : (
                                <Check color="#059669" size={11} />
                              )}
                              <Text numberOfLines={1} className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                {tr('मंज़ूर', 'منظور', 'Approve')}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {/* View Button */}
                          <TouchableOpacity
                            onPress={() => setSelectedViewPhoto(photo)}
                            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/50"
                            accessibilityLabel="View photo"
                            activeOpacity={0.7}
                          >
                            <Eye color="#0284c7" size={11} />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-bold text-sky-600 dark:text-sky-400"
                            >
                              {tr('देखें', 'دیکھیں', 'View')}
                            </Text>
                          </TouchableOpacity>

                          {/* Edit Button */}
                          <TouchableOpacity
                            onPress={() => handleStartEdit(photo)}
                            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50"
                            accessibilityLabel="Edit photo"
                            activeOpacity={0.7}
                          >
                            <Edit3 color="#10b981" size={11} />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                            >
                              {tr('एडिट', 'ترمیم', 'Edit')}
                            </Text>
                          </TouchableOpacity>

                          {/* Delete Button */}
                          <TouchableOpacity
                            onPress={() => setDeleteConfirmId(photo.id)}
                            className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50"
                            accessibilityLabel="Delete photo"
                            activeOpacity={0.7}
                          >
                            <Trash2 color="#ef4444" size={11} />
                            <Text
                              numberOfLines={1}
                              className="text-[10px] font-bold text-red-600 dark:text-red-400"
                            >
                              {tr('हटाएं', 'حذف', 'Del')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Floating Action Button (+ Add Photo) */}
              {/* <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setActiveSubTab('create');
                }}
                className="absolute bottom-6 right-5 flex-row items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 z-30"
                activeOpacity={0.85}
              >
                <PlusCircle color="#fff" size={18} />
                <Text className="text-white font-extrabold text-xs">
                  {t('gallery.tab_create', '+ Add Photo')}
                </Text>
              </TouchableOpacity> */}
            </View>
          )}
        </>
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            {editingPhotoId && (
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                className="w-9 h-9 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800"
              >
                <ArrowLeft color={isDark ? '#f8fafc' : '#0f172a'} size={18} />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingPhotoId ? 'Edit Gallery Photo' : t('gallery.form_title', 'Add Gallery Photo')}
              </Text>
              <Text className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                {editingPhotoId
                  ? 'Update details for this photo.'
                  : 'Upload an image from your mobile device and fill in details.'}
              </Text>
            </View>
          </View>

          {/* ──────────────── 1. IMAGE UPLOAD (FIRST FIELD) ──────────────── */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
            <Text className="text-xs font-bold mb-2.5 text-slate-500 dark:text-slate-400">1. Photo / Image *</Text>

            {imageUri ? (
              <View className="flex-row items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 gap-3">
                <Image source={{ uri: imageUri }} className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700" resizeMode="cover" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {imageFileName || 'gallery_photo.jpg'}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <CheckCircle2 color="#059669" size={12} />
                    <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Photo attached</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setShowMediaPicker(true)}
                    className="w-8 h-8 rounded-lg items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    accessibilityLabel="Change photo"
                  >
                    <Camera color="#059669" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setImageUri('');
                      setImageFileName('');
                    }}
                    className="w-8 h-8 rounded-lg items-center justify-center border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40"
                    accessibilityLabel="Remove photo"
                  >
                    <Trash2 color="#ef4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowMediaPicker(true)}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 items-center justify-center bg-slate-50 dark:bg-slate-800/50"
                activeOpacity={0.7}
              >
                <View className="w-11 h-11 rounded-full items-center justify-center mb-2 bg-emerald-50 dark:bg-emerald-950/50">
                  <Camera color="#059669" size={20} />
                </View>
                <Text className="text-[13px] font-bold text-slate-900 dark:text-white">Upload Gallery Photo</Text>
                <Text className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">Take photo or choose from gallery</Text>
              </TouchableOpacity>
            )}

            {/* Optional URL Toggle */}
            <TouchableOpacity
              onPress={() => setShowUrlFallback(!showUrlFallback)}
              className="mt-2.5 py-1"
            >
              <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {showUrlFallback ? '▲ Hide Direct URL input' : '▼ Or enter direct Image URL'}
              </Text>
            </TouchableOpacity>

            {showUrlFallback && (
              <View className="mt-2">
                <TextInput
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  value={imageUri}
                  onChangeText={txt => {
                    setImageUri(txt);
                    setImageFileName('direct_url_image.jpg');
                  }}
                />
              </View>
            )}
          </View>

          {/* ──────────────── 2. TITLE (SECOND FIELD) ──────────────── */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
            <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">2. Photo Title *</Text>
            <TextInput
              className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              placeholder="e.g. Free Ration Distribution Drive"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ──────────────── 3. CITY (EDIT ONLY) ──────────────── */}
          {editingPhotoId && (
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
              <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">3. City / Location *</Text>
              <View className="relative justify-center">
                <View className="absolute left-3 z-10">
                  <MapPin color="#10b981" size={18} />
                </View>
                <TextInput
                  className="h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  placeholder="e.g. Bareilly, UP"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
          )}

          {/* ──────────────── CATEGORY ──────────────── */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
            <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">
              {editingPhotoId ? '4. Category *' : '3. Category *'}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`py-2 px-3.5 rounded-xl border ${isSelected
                      ? 'bg-emerald-500 border-emerald-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-1 pb-10">
            {editingPhotoId && (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                disabled={submitting}
              >
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-emerald-500 ${editingPhotoId ? 'flex-[2]' : 'flex-1'
                } ${submitting ? 'opacity-60' : ''}`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text className="text-white text-sm font-bold">
                    {editingPhotoId ? 'Update Photo' : t('gallery.submit', 'Add Photo to Gallery')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── VIEW PHOTO MODAL ── */}
      <Modal
        visible={!!selectedViewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedViewPhoto(null)}
      >
        <View className="flex-1 justify-center items-center p-4 bg-black/75">
          <View className="w-full max-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <View className="flex-1 pr-3">
                <DynamicText
                  text={selectedViewPhoto?.title || ''}
                  style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#f8fafc' : '#0f172a' }}
                  numberOfLines={1}
                />
                <View className="flex-row items-center gap-1.5 mt-1">
                  <MapPin color="#10b981" size={13} />
                  <DynamicText
                    text={selectedViewPhoto?.city || ''}
                    style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}
                  />
                  <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-1" />
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {translateCategory(selectedViewPhoto?.category || '', lang)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedViewPhoto(null)}
                className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700"
              >
                <X color={isDark ? '#f8fafc' : '#0f172a'} size={18} />
              </TouchableOpacity>
            </View>

            {/* Modal Image */}
            {selectedViewPhoto && (
              <View className="w-full h-72 bg-slate-900 items-center justify-center">
                <Image
                  source={{ uri: selectedViewPhoto.image }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Modal Actions */}
            <View className="flex-row p-3 gap-2.5 border-t border-slate-200 dark:border-slate-700">
              {/* Approve button — admin only, pending only */}
              {selectedViewPhoto?.status === 'pending' && isAdmin && (
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                  onPress={() => {
                    if (selectedViewPhoto) handleApprovePhoto(selectedViewPhoto.id);
                  }}
                  disabled={approvingId === selectedViewPhoto?.id}
                >
                  {approvingId === selectedViewPhoto?.id ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <>
                      <Check color="#059669" size={15} />
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {tr('मंज़ूर करें', 'منظور کریں', 'Approve')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50"
                onPress={() => {
                  if (selectedViewPhoto) {
                    handleStartEdit(selectedViewPhoto);
                  }
                }}
              >
                <Edit3 color="#10b981" size={16} />
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Edit Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50"
                onPress={() => {
                  if (selectedViewPhoto) {
                    const idToDelete = selectedViewPhoto.id;
                    setSelectedViewPhoto(null);
                    setDeleteConfirmId(idToDelete);
                  }
                }}
              >
                <Trash2 color="#ef4444" size={16} />
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PROFESSIONAL DELETE CONFIRMATION MODAL ── */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View className="flex-1 justify-center items-center p-5 bg-black/75">
          <View className="w-full max-w-[340px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 items-center">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-3.5 bg-red-50 dark:bg-red-950/50">
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">
              Delete Gallery Photo?
            </Text>
            <Text className="text-xs text-center leading-4 text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to delete this photo from the gallery? This action cannot be undone.
            </Text>

            <View className="flex-row gap-2.5 w-full border-t border-slate-200 dark:border-slate-700 pt-3.5">
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-700"
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl items-center justify-center bg-red-500"
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center gap-1">
                    <Trash2 color="#fff" size={15} />
                    <Text className="text-white text-xs font-bold">Yes, Delete</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MEDIA PICKER SHEET MODAL ── */}
      {showMediaPicker && (
        <Modal
          visible={showMediaPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMediaPicker(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-end bg-black/60"
            activeOpacity={1}
            onPress={() => setShowMediaPicker(false)}
          >
            <View
              className="bg-white dark:bg-slate-800 rounded-t-3xl p-5"
              style={{ paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-extrabold text-slate-900 dark:text-white">Upload Gallery Photo</Text>
                <TouchableOpacity
                  onPress={() => setShowMediaPicker(false)}
                  className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700"
                >
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 items-center justify-center bg-slate-50 dark:bg-slate-900"
                  onPress={() => handlePickMedia('camera')}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2 bg-emerald-50 dark:bg-emerald-950/50">
                    <Camera color="#059669" size={24} />
                  </View>
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white">Use Camera</Text>
                  <Text className="text-[11px] mt-0.5 text-center text-slate-500 dark:text-slate-400">Take a new photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 items-center justify-center bg-slate-50 dark:bg-slate-900"
                  onPress={() => handlePickMedia('gallery')}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2 bg-blue-50 dark:bg-blue-950/50">
                    <ImageIcon color="#2563eb" size={24} />
                  </View>
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white">From Gallery</Text>
                  <Text className="text-[11px] mt-0.5 text-center text-slate-500 dark:text-slate-400">Select image / file</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowMediaPicker(false)}
                className="py-3.5 rounded-2xl items-center justify-center bg-slate-100 dark:bg-slate-700"
              >
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
