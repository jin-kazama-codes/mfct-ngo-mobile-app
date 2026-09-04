import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, StyleSheet,
  Modal, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getGalleryPhotos,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  GalleryPhoto
} from '../../../src/services/galleryService';
import {
  Image as ImageIcon, PlusCircle, Trash2, CheckCircle2,
  Filter, Eye, Edit3, Camera, Upload, X, MapPin,
  Sparkles, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react-native';
import { GalleryGridSkeleton } from '../../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { getLanguageCode, translateCategory, translateCity } from '../../../src/lib/translateEntity';
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
    setCity('');
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
      const finalCity = city.trim() || 'Bareilly';

      if (editingPhotoId) {
        // UPDATE existing photo
        const updated = await updateGalleryPhoto(editingPhotoId, {
          title: title.trim(),
          city: finalCity,
          image: imageUri.trim(),
          category,
        });

        setPhotos(prev => prev.map(p => (p.id === editingPhotoId ? { ...p, ...updated } : p)));
        showToast('Photo updated successfully!', 'success');
      } else {
        // CREATE new photo
        const newPhoto = await createGalleryPhoto({
          title: title.trim(),
          city: finalCity,
          image: imageUri.trim(),
          category,
          status: 'approved',
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

  // Handle Delete Confirmation (Matching impact-stories)
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

  // Dynamic Theme Colors
  const theme = {
    bg: isDark ? '#090d16' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    inputBg: isDark ? '#131d2e' : '#ffffff',
    inputBorder: isDark ? '#334155' : '#cbd5e1',
    tabHeaderBg: isDark ? '#0f172a' : '#ffffff',
    tabBorder: isDark ? '#1e293b' : '#e2e8f0',
    modalBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)',
    chipIdle: isDark ? '#1e293b' : '#f1f5f9',
    chipIdleText: isDark ? '#cbd5e1' : '#475569',
    primary: '#10b981',
    primaryDark: '#059669',
  };

  return (
    <View style={[s.screen, { backgroundColor: theme.bg }]}>
      {/* Toast Banner */}
      {toast && (
        <View
          style={[
            s.toastContainer,
            toast.type === 'success'
              ? s.toastSuccess
              : toast.type === 'error'
              ? s.toastError
              : s.toastInfo,
          ]}
        >
          {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
          {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
          {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
          <Text style={s.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Sub-Tab Header */}
      <View style={[s.tabHeader, { backgroundColor: theme.tabHeaderBg, borderBottomColor: theme.tabBorder }]}>
        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'list') setActiveSubTab('list');
          }}
          style={[s.tabBtn, activeSubTab === 'list' ? s.tabBtnActive : { backgroundColor: theme.chipIdle }]}
        >
          <ImageIcon color={activeSubTab === 'list' ? '#fff' : theme.textSub} size={16} />
          <Text
            style={[
              s.tabBtnText,
              activeSubTab === 'list' ? s.tabBtnTextActive : { color: theme.textSub },
            ]}
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
          style={[s.tabBtn, activeSubTab === 'create' ? s.tabBtnActive : { backgroundColor: theme.chipIdle }]}
        >
          {editingPhotoId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={16} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={16} />
          )}
          <Text
            style={[
              s.tabBtnText,
              activeSubTab === 'create' ? s.tabBtnTextActive : { color: theme.textSub },
            ]}
          >
            {editingPhotoId ? 'Edit Photo' : t('gallery.tab_create', '+ Add Photo')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        <>
          {/* Category Filter */}
          <View style={[s.filterBar, { backgroundColor: theme.tabHeaderBg, borderBottomColor: theme.tabBorder }]}>
            <Filter color={theme.textSub} size={14} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {CATEGORIES.map(cat => {
                const isSelected = filterCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFilterCat(cat)}
                    style={[
                      s.filterChip,
                      isSelected
                        ? s.filterChipActive
                        : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder },
                    ]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        isSelected ? s.filterChipTextActive : { color: theme.chipIdleText },
                      ]}
                    >
                      {translateCategory(cat, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              <GalleryGridSkeleton isDark={isDark} />
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
              {filteredPhotos.length === 0 ? (
                <View style={s.empty}>
                  <ImageIcon color={theme.textSub} size={48} />
                  <Text style={[s.emptyText, { color: theme.textSub }]}>{t('gallery.empty', 'No photos in this category')}</Text>
                  <TouchableOpacity
                    style={[s.emptyAddBtn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      resetForm();
                      setActiveSubTab('create');
                    }}
                  >
                    <PlusCircle color="#fff" size={16} />
                    <Text style={s.emptyAddBtnText}>{t('gallery.tab_create', '+ Add Photo')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.grid}>
                  {filteredPhotos.map(photo => (
                    <View
                      key={photo.id}
                      style={[
                        s.tileCard,
                        {
                          width: TILE,
                          backgroundColor: theme.cardBg,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                    >
                      {/* Photo Thumbnail */}
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedViewPhoto(photo)}
                        style={s.tileImgWrap}
                      >
                        <Image source={{ uri: photo.image }} style={s.tileImg} resizeMode="cover" />

                        {/* Category Badge */}
                        <View style={s.tileBadge}>
                          <Text style={s.tileBadgeText}>{translateCategory(photo.category, lang)}</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Photo Info */}
                      <View style={s.tileDetails}>
                        <DynamicText
                          text={photo.title}
                          style={[s.tileTitle, { color: theme.textMain }]}
                          numberOfLines={1}
                        />
                        <View style={s.tileLocationRow}>
                          <MapPin color={theme.primary} size={11} />
                          <DynamicText
                            text={photo.city || 'Bareilly'}
                            style={[s.tileCity, { color: theme.textSub }]}
                            numberOfLines={1}
                          />
                        </View>
                      </View>

                      {/* Action Buttons: View, Edit, Delete */}
                      <View style={[s.tileActions, { borderTopColor: theme.cardBorder }]}>
                        {/* View Button */}
                        <TouchableOpacity
                          onPress={() => setSelectedViewPhoto(photo)}
                          style={[s.actionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}
                          accessibilityLabel="View photo"
                        >
                          <Eye color="#0284c7" size={14} />
                          <Text style={[s.actionBtnText, { color: '#0284c7' }]}>{t('btn.viewDetails', 'View')}</Text>
                        </TouchableOpacity>

                        {/* Edit Button */}
                        <TouchableOpacity
                          onPress={() => handleStartEdit(photo)}
                          style={[s.actionBtn, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}
                          accessibilityLabel="Edit photo"
                        >
                          <Edit3 color="#10b981" size={14} />
                          <Text style={[s.actionBtnText, { color: '#10b981' }]}>{t('admin.auditTrail', 'Edit')}</Text>
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                          onPress={() => setDeleteConfirmId(photo.id)}
                          style={[s.actionBtn, { backgroundColor: isDark ? '#4c1d24' : '#fee2e2' }]}
                          accessibilityLabel="Delete photo"
                        >
                          <Trash2 color="#ef4444" size={14} />
                          <Text style={[s.actionBtnText, { color: '#ef4444' }]}>{t('btn.reject', 'Delete')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView contentContainerStyle={s.formPad} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.formHeaderRow}>
            {editingPhotoId && (
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                style={[s.backIconBtn, { backgroundColor: theme.chipIdle }]}
              >
                <ArrowLeft color={theme.textMain} size={18} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.formTitle, { color: theme.textMain }]}>
                {editingPhotoId ? 'Edit Gallery Photo' : t('gallery.form_title', 'Add Gallery Photo')}
              </Text>
              <Text style={[s.formSubTitle, { color: theme.textSub }]}>
                {editingPhotoId
                  ? 'Update details for this photo.'
                  : 'Upload an image from your mobile device and fill in details.'}
              </Text>
            </View>
          </View>

          {/* ──────────────── 1. IMAGE UPLOAD (FIRST FIELD) ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.label, { color: theme.textSub }]}>1. Photo / Image *</Text>

            {imageUri ? (
              <View style={[s.previewCard, isDark && { backgroundColor: '#064e3b25', borderColor: '#059669' }]}>
                <Image source={{ uri: imageUri }} style={s.docPreview} resizeMode="cover" />
                <View style={s.previewMeta}>
                  <Text style={[s.previewFileName, { color: theme.textMain }]} numberOfLines={1}>
                    {imageFileName || 'gallery_photo.jpg'}
                  </Text>
                  <View style={s.badgeAttached}>
                    <CheckCircle2 color="#059669" size={12} />
                    <Text style={s.badgeAttachedText}>Photo attached</Text>
                  </View>
                </View>
                <View style={s.previewActions}>
                  <TouchableOpacity
                    onPress={() => setShowMediaPicker(true)}
                    style={[s.changeBtn, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                    accessibilityLabel="Change photo"
                  >
                    <Camera color="#059669" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setImageUri('');
                      setImageFileName('');
                    }}
                    style={[s.deleteBtn, isDark && { backgroundColor: '#450a0a', borderColor: '#7f1d1d' }]}
                    accessibilityLabel="Remove photo"
                  >
                    <Trash2 color="#ef4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowMediaPicker(true)}
                style={[s.uploadBox, { borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: theme.inputBg }]}
                activeOpacity={0.7}
              >
                <View style={s.uploadIconCircle}>
                  <Camera color="#059669" size={20} />
                </View>
                <Text style={[s.uploadTitle, { color: theme.textMain }]}>Upload Gallery Photo</Text>
                <Text style={[s.uploadSubtitle, { color: theme.textSub }]}>Take photo or choose from gallery</Text>
              </TouchableOpacity>
            )}

            {/* Optional URL Toggle */}
            <TouchableOpacity
              onPress={() => setShowUrlFallback(!showUrlFallback)}
              style={s.urlToggleBtn}
            >
              <Text style={[s.urlToggleText, { color: theme.primary }]}>
                {showUrlFallback ? '▲ Hide Direct URL input' : '▼ Or enter direct Image URL'}
              </Text>
            </TouchableOpacity>

            {showUrlFallback && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={theme.textSub}
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
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.label, { color: theme.textSub }]}>2. Photo Title *</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
              placeholder="e.g. Free Ration Distribution Drive"
              placeholderTextColor={theme.textSub}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ──────────────── 3. CITY (THIRD FIELD) ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.label, { color: theme.textSub }]}>3. City / Location *</Text>
            <View style={s.inputWithIcon}>
              <MapPin color={theme.primary} size={18} style={s.inputLeftIcon} />
              <TextInput
                style={[
                  s.input,
                  s.inputPadded,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                ]}
                placeholder="e.g. Bareilly, UP"
                placeholderTextColor={theme.textSub}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          {/* ──────────────── 4. CATEGORY (FOURTH FIELD) ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.label, { color: theme.textSub }]}>4. Category *</Text>
            <View style={s.chipGroup}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      s.chip,
                      isSelected
                        ? s.chipActive
                        : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder },
                    ]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        isSelected ? s.chipTextActive : { color: theme.chipIdleText },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={s.submitRow}>
            {editingPhotoId && (
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: theme.cardBorder, backgroundColor: theme.chipIdle }]}
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                disabled={submitting}
              >
                <Text style={[s.cancelBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                s.submitBtn,
                editingPhotoId ? { flex: 2 } : { flex: 1 },
                submitting && s.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text style={s.submitBtnText}>
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
        <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg }]}>
          <View style={[s.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            {/* Modal Header */}
            <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <DynamicText
                  text={selectedViewPhoto?.title || ''}
                  style={[s.modalTitle, { color: theme.textMain }]}
                  numberOfLines={1}
                />
                <View style={s.modalMetaRow}>
                  <MapPin color={theme.primary} size={13} />
                  <DynamicText
                    text={selectedViewPhoto?.city || 'Bareilly'}
                    style={[s.modalMetaText, { color: theme.textSub }]}
                  />
                  <View style={s.modalDot} />
                  <Text style={[s.modalBadgeText, { color: theme.primary }]}>
                    {translateCategory(selectedViewPhoto?.category || '', lang)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedViewPhoto(null)}
                style={[s.modalCloseBtn, { backgroundColor: theme.chipIdle }]}
              >
                <X color={theme.textMain} size={18} />
              </TouchableOpacity>
            </View>

            {/* Modal Image */}
            {selectedViewPhoto && (
              <View style={s.modalImageWrap}>
                <Image
                  source={{ uri: selectedViewPhoto.image }}
                  style={s.modalImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Modal Actions */}
            <View style={[s.modalActions, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[s.modalActionBtn, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}
                onPress={() => {
                  if (selectedViewPhoto) {
                    handleStartEdit(selectedViewPhoto);
                  }
                }}
              >
                <Edit3 color="#10b981" size={16} />
                <Text style={[s.modalActionBtnText, { color: '#10b981' }]}>Edit Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalActionBtn, { backgroundColor: isDark ? '#4c1d24' : '#fee2e2' }]}
                onPress={() => {
                  if (selectedViewPhoto) {
                    const idToDelete = selectedViewPhoto.id;
                    setSelectedViewPhoto(null);
                    setDeleteConfirmId(idToDelete);
                  }
                }}
              >
                <Trash2 color="#ef4444" size={16} />
                <Text style={[s.modalActionBtnText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PROFESSIONAL DELETE CONFIRMATION MODAL (MATCHING IMPACT-STORIES) ── */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View style={[s.deleteModalBackdrop, { backgroundColor: theme.modalBg }]}>
          <View style={[s.deleteModalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={s.deleteIconCircle}>
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text style={[s.deleteModalTitle, { color: theme.textMain }]}>Delete Gallery Photo?</Text>
            <Text style={[s.deleteModalSub, { color: theme.textSub }]}>
              Are you sure you want to delete this photo from the gallery? This action cannot be undone.
            </Text>

            <View style={[s.deleteModalActions, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[s.deleteModalCancelBtn, { backgroundColor: theme.chipIdle }]}
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text style={[s.deleteModalCancelBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.deleteModalConfirmBtn}
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 color="#fff" size={15} />
                    <Text style={s.deleteModalConfirmBtnText}>Yes, Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MEDIA PICKER SHEET MODAL (MATCHING SIGN-UP) ── */}
      {showMediaPicker && (
        <Modal
          visible={showMediaPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMediaPicker(false)}
        >
          <TouchableOpacity
            style={s.sheetModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowMediaPicker(false)}
          >
            <View style={[s.modalSheet, { backgroundColor: theme.cardBg }]}>
              <View style={s.sheetHeader}>
                <Text style={[s.sheetTitle, { color: theme.textMain }]}>Upload Gallery Photo</Text>
                <TouchableOpacity
                  onPress={() => setShowMediaPicker(false)}
                  style={[s.closeBtn, { backgroundColor: theme.chipIdle }]}
                >
                  <X color={theme.textSub} size={18} />
                </TouchableOpacity>
              </View>

              <View style={s.pickerOptionsRow}>
                <TouchableOpacity
                  style={[s.pickerOptionCard, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                  onPress={() => handlePickMedia('camera')}
                  activeOpacity={0.7}
                >
                  <View style={[s.optionIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                    <Camera color="#059669" size={24} />
                  </View>
                  <Text style={[s.optionTitle, { color: theme.textMain }]}>Use Camera</Text>
                  <Text style={[s.optionSub, { color: theme.textSub }]}>Take a new photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.pickerOptionCard, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder }]}
                  onPress={() => handlePickMedia('gallery')}
                  activeOpacity={0.7}
                >
                  <View style={[s.optionIconCircle, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
                    <ImageIcon color="#2563eb" size={24} />
                  </View>
                  <Text style={[s.optionTitle, { color: theme.textMain }]}>From Gallery</Text>
                  <Text style={[s.optionSub, { color: theme.textSub }]}>Select image / file</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowMediaPicker(false)}
                style={[s.sheetCancelBtn, { backgroundColor: theme.chipIdle }]}
              >
                <Text style={[s.sheetCancelBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#059669' },
  toastError: { backgroundColor: '#dc2626' },
  toastInfo: { backgroundColor: '#0284c7' },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },

  // Sub Tab Header
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    padding: 10,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnActive: { backgroundColor: '#10b981' },
  tabBtnText: { fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },

  // Filter bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tileImgWrap: {
    width: '100%',
    height: 120,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  tileImg: { width: '100%', height: '100%' },
  tileBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(16,185,129,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tileBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  tileDetails: {
    padding: 8,
  },
  tileTitle: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  tileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileCity: { fontSize: 11, fontWeight: '500' },

  // Tile Action Buttons
  tileActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 6,
    gap: 4,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Form
  formPad: { padding: 16, paddingBottom: 60 },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backIconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  formTitle: { fontSize: 18, fontWeight: '800' },
  formSubTitle: { fontSize: 12, marginTop: 2 },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputPadded: {
    paddingLeft: 38,
  },

  // Upload Box (Matching sign-up)
  uploadBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  // Preview Cards (Matching sign-up)
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  docPreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  previewMeta: {
    flex: 1,
    gap: 4,
  },
  previewFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeAttached: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeAttachedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Media Picker Modal Sheet (Matching sign-up)
  sheetModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerOptionCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  optionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sheetCancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },

  urlToggleBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  urlToggleText: { fontSize: 12, fontWeight: '700' },

  // Category Chips
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  // Submit Row
  submitRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontWeight: '700', fontSize: 14 },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // View Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  modalMetaText: { fontSize: 12, fontWeight: '600' },
  modalDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94a3b8', marginHorizontal: 4 },
  modalBadgeText: { fontSize: 12, fontWeight: '800' },
  modalCloseBtn: { padding: 8, borderRadius: 10, marginLeft: 8 },
  modalImageWrap: {
    width: '100%',
    height: 280,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: { width: '100%', height: '100%' },
  modalActions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalActionBtnText: { fontSize: 13, fontWeight: '700' },

  // Delete Modal Styles (Matching impact-stories)
  deleteModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  deleteIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  deleteModalSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelBtnText: { fontSize: 13, fontWeight: '700' },
  deleteModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteModalConfirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
