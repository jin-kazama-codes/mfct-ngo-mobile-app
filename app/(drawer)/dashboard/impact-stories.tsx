import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Image, StyleSheet, Modal, Dimensions
} from 'react-native';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} from '../../../src/services/testimonialService';
import { Testimonial } from '../../../src/types';
import {
  Quote, PlusCircle, Trash2, CheckCircle2, Clock,
  Edit3, Camera, Upload, X, MapPin, User as UserIcon,
  Sparkles, AlertCircle, ArrowLeft, RefreshCw, Check,
  HeartHandshake
} from 'lucide-react-native';
import { StoryCardSkeleton } from '../../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../../src/context/AppStateProvider';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ImpactStoriesAdminScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeUser, currentRole } = useAppState();

  const rawRole = (activeUser?.role || currentRole || 'member').toLowerCase().trim().replace(' ', '_');
  const isAdmin = ['super_admin', 'executive_admin', 'community_admin', 'admin'].some(r => rawRole.includes(r));

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Form fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [quote, setQuote] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFileName, setAvatarFileName] = useState('');
  const [linkedCampaign, setLinkedCampaign] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getAllTestimonials();
      let filteredData = data;
      if (!isAdmin && activeUser) {
        filteredData = data.filter(item => item.createdBy === activeUser.id);
      }
      setTestimonials(filteredData);
    } catch (err) {
      console.error('Error loading impact stories:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, activeUser?.id]);

  // Pick Avatar from Phone Gallery
  const handlePickAvatar = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow gallery access to select photo.', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatar(asset.uri);
        setAvatarFileName(asset.fileName || `avatar_${Date.now()}.jpg`);
        showToast('Profile photo selected from device', 'info');
      }
    } catch (err) {
      console.warn('ImagePicker error:', err);
      // Fallback
      const sampleAvatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      ];
      const fallback = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];
      setAvatar(fallback);
      setAvatarFileName('sample_avatar.jpg');
      showToast('Sample avatar attached', 'info');
    }
  };

  // Capture Avatar with Phone Camera
  const handleCameraCapture = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Please allow camera access to take photo.', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatar(asset.uri);
        setAvatarFileName(asset.fileName || `camera_${Date.now()}.jpg`);
        showToast('Photo captured successfully', 'info');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showToast('Could not open camera on this device', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setCity('');
    setRole('');
    setQuote('');
    setAvatar('');
    setAvatarFileName('');
    setLinkedCampaign('');
    setEditingId(null);
    setShowUrlInput(false);
  };

  // Open item in Edit Mode
  const handleOpenEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setName(item.name || '');
    setCity(item.city || '');
    setRole(item.role || '');
    setQuote(item.quote || '');
    setAvatar(item.avatar || '');
    setAvatarFileName(item.avatar ? 'current_avatar.jpg' : '');
    setLinkedCampaign(item.campaignTitle || '');
    setActiveSubTab('create');
  };

  // Handle Save (Create or Update)
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter the author/beneficiary name.', 'error');
      return;
    }
    if (!city.trim()) {
      showToast('Please enter the city.', 'error');
      return;
    }
    if (!quote.trim()) {
      showToast('Please write the quote / impact story.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const finalAvatar = avatar.trim() || activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

      if (editingId) {
        // UPDATE story
        await updateTestimonial(editingId, {
          name: name.trim(),
          city: city.trim(),
          role: role.trim() || 'Beneficiary',
          quote: quote.trim(),
          avatar: finalAvatar,
          campaignTitle: linkedCampaign.trim() || undefined,
        });

        showToast('Impact story updated successfully!', 'success');
      } else {
        // CREATE new story (Matching website logic)
        const newStoryData = {
          name: name.trim(),
          city: city.trim(),
          quote: quote.trim(),
          avatar: activeUser?.avatar,
          createdBy: activeUser?.id,
          communityId: activeUser?.communityId,
          status: isAdmin ? ('approved' as const) : ('pending' as const),
        };

        await createTestimonial(newStoryData);
        showToast('Impact story created successfully!', 'success');
      }

      resetForm();
      setActiveSubTab('list');
      await loadData(false);
    } catch (err: any) {
      console.error('Error saving impact story:', err);
      showToast(err?.message || 'Failed to save impact story.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await updateTestimonial(id, { status: 'approved' });
      showToast('Impact story approved successfully!', 'success');
      await loadData(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve impact story.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteTestimonial(deleteConfirmId);
      setTestimonials(prev => prev.filter(t => t.id !== deleteConfirmId));
      showToast('Impact story deleted successfully!', 'success');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete story.', 'error');
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
    modalBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
    chipIdle: isDark ? '#1e293b' : '#f1f5f9',
    chipIdleText: isDark ? '#cbd5e1' : '#475569',
    primary: '#10b981',
    primaryDark: '#059669',
  };

  return (
    <View style={[s.screen, { backgroundColor: theme.bg }]}>
      {/* Toast Notification Banner */}
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
          <Quote color={activeSubTab === 'list' ? '#fff' : theme.textSub} size={15} />
          <Text style={[s.tabBtnText, activeSubTab === 'list' ? s.tabBtnTextActive : { color: theme.textSub }]}>
            {t('stories.tab_list', 'All Stories')} ({testimonials.length})
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
          {editingId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={15} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={15} />
          )}
          <Text style={[s.tabBtnText, activeSubTab === 'create' ? s.tabBtnTextActive : { color: theme.textSub }]}>
            {editingId ? 'Edit Story' : t('stories.tab_create', '+ Add Story')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={s.listPad}>
            {[1, 2, 3].map(i => (
              <StoryCardSkeleton key={i} />
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={s.listPad}>
            {testimonials.length === 0 ? (
              <View style={s.empty}>
                <Quote color={theme.textSub} size={44} />
                <Text style={[s.emptyText, { color: theme.textSub }]}>
                  {t('stories.empty', 'No impact stories found')}
                </Text>
                <TouchableOpacity
                  style={[s.emptyAddBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    resetForm();
                    setActiveSubTab('create');
                  }}
                >
                  <PlusCircle color="#fff" size={16} />
                  <Text style={s.emptyAddBtnText}>Share First Story</Text>
                </TouchableOpacity>
              </View>
            ) : (
              testimonials.map(item => {
                const isApproved = item.status === 'approved';
                return (
                  <View
                    key={item.id}
                    style={[
                      s.card,
                      {
                        backgroundColor: theme.cardBg,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                  >
                    {/* Top Row: Author Info & Status */}
                    <View style={s.cardTopRow}>
                      <View style={s.authorRow}>
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={s.authorAvatar} resizeMode="cover" />
                        ) : (
                          <View style={[s.authorAvatarFallback, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                            <Text style={[s.authorInitial, { color: theme.textMain }]}>
                              {item.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[s.authorName, { color: theme.textMain }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={s.metaRow}>
                            <MapPin color={theme.primary} size={11} />
                            <Text style={[s.authorMeta, { color: theme.textSub }]} numberOfLines={1}>
                              {item.city} • {item.role || 'Beneficiary'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          s.statusBadge,
                          isApproved ? s.statusApproved : s.statusPending,
                        ]}
                      >
                        {isApproved ? (
                          <CheckCircle2 color="#059669" size={12} />
                        ) : (
                          <Clock color="#d97706" size={12} />
                        )}
                        <Text
                          style={[
                            s.statusText,
                            isApproved ? s.statusTextApproved : s.statusTextPending,
                          ]}
                        >
                          {isApproved ? 'Approved' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {/* Quote Text */}
                    <View style={[s.quoteContainer, { backgroundColor: isDark ? '#131d2e' : '#f8fafc' }]}>
                      <Quote color={theme.primary} size={14} style={{ marginBottom: 4 }} />
                      <Text style={[s.quoteText, { color: theme.textMain }]}>
                        "{item.quote}"
                      </Text>
                    </View>

                    {/* Linked Campaign Badge if present */}
                    {item.campaignTitle ? (
                      <View style={s.campaignTagRow}>
                        <HeartHandshake color={theme.primary} size={12} />
                        <Text style={[s.campaignTagText, { color: theme.primary }]} numberOfLines={1}>
                          {item.campaignTitle}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Bar: Approve, Edit, Delete */}
                    <View style={[s.cardActions, { borderTopColor: theme.cardBorder }]}>
                      {/* Approve button (for admins if pending) */}
                      {!isApproved && isAdmin && (
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}
                          onPress={() => handleApprove(item.id)}
                          disabled={approvingId === item.id}
                        >
                          {approvingId === item.id ? (
                            <ActivityIndicator size="small" color="#10b981" />
                          ) : (
                            <>
                              <Check color="#10b981" size={14} />
                              <Text style={[s.actionBtnText, { color: '#10b981' }]}>Approve</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Edit button */}
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Edit3 color="#0284c7" size={14} />
                        <Text style={[s.actionBtnText, { color: '#0284c7' }]}>Edit</Text>
                      </TouchableOpacity>

                      {/* Delete button */}
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: isDark ? '#4c1d24' : '#fee2e2' }]}
                        onPress={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 color="#ef4444" size={14} />
                        <Text style={[s.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )
      )}

      {/* ── CREATE / EDIT FORM TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView contentContainerStyle={s.formPad} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.formHeaderRow}>
            {editingId && (
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
                {editingId ? 'Edit Impact Story' : t('stories.form_title', 'Create Impact Story')}
              </Text>
              <Text style={[s.formSubTitle, { color: theme.textSub }]}>
                {editingId
                  ? 'Update beneficiary testimonial and details.'
                  : 'Add genuine voices from the community to inspire donors.'}
              </Text>
            </View>
          </View>

          {/* Form Card 1: Author & Location Details */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>{t('stories.field_name', 'Author / Beneficiary Name')} *</Text>
              <View style={s.inputWithIcon}>
                <UserIcon color={theme.primary} size={17} style={s.inputLeftIcon} />
                <TextInput
                  style={[
                    s.input,
                    s.inputPadded,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="e.g. Fatima Khan"
                  placeholderTextColor={theme.textSub}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={s.row2}>
              <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>{t('stories.field_city', 'City')} *</Text>
                <View style={s.inputWithIcon}>
                  <MapPin color={theme.primary} size={17} style={s.inputLeftIcon} />
                  <TextInput
                    style={[
                      s.input,
                      s.inputPadded,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                    ]}
                    placeholder="e.g. Bareilly"
                    placeholderTextColor={theme.textSub}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>
              <View style={s.gap10} />
              {/* <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>{t('stories.field_role', 'Role / Designation')}</Text>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="e.g. Beneficiary / Volunteer"
                  placeholderTextColor={theme.textSub}
                  value={role}
                  onChangeText={setRole}
                />
              </View> */}
            </View>
          </View>

          {/* Form Card 2: Quote / Story */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.label, { color: theme.textSub }]}>{t('stories.field_quote', 'Quote / Story')} *</Text>
            <TextInput
              style={[
                s.input,
                s.textArea,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
              ]}
              placeholder="Write the beneficiary's testimonial or impact story here..."
              placeholderTextColor={theme.textSub}
              multiline
              textAlignVertical="top"
              value={quote}
              onChangeText={setQuote}
            />
          </View>



          {/* Submit / Action Row */}
          <View style={s.submitRow}>
            {editingId && (
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
                editingId ? { flex: 2 } : { flex: 1 },
                submitting && s.submitBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text style={s.submitBtnText}>
                    {editingId ? 'Update Story' : t('stories.submit', 'Publish Impact Story')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── PROFESSIONAL DELETE CONFIRMATION MODAL ── */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg }]}>
          <View style={[s.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={s.deleteIconCircle}>
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text style={[s.deleteModalTitle, { color: theme.textMain }]}>Delete Impact Story?</Text>
            <Text style={[s.deleteModalSub, { color: theme.textSub }]}>
              Are you sure you want to delete this story? This action cannot be undone.
            </Text>

            <View style={[s.modalActions, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[s.modalCancelBtn, { backgroundColor: theme.chipIdle }]}
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text style={[s.modalCancelBtnText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.modalDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 color="#fff" size={15} />
                    <Text style={s.modalDeleteBtnText}>Yes, Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  listPad: { padding: 16, paddingBottom: 40 },
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

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
  },
  authorAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: { fontSize: 16, fontWeight: '800' },
  authorName: { fontSize: 14, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  authorMeta: { fontSize: 11, fontWeight: '500' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusApproved: { backgroundColor: 'rgba(16,185,129,0.12)' },
  statusPending: { backgroundColor: 'rgba(245,158,11,0.12)' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextApproved: { color: '#059669' },
  statusTextPending: { color: '#d97706' },

  quoteContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  campaignTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  campaignTagText: { fontSize: 11, fontWeight: '700' },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

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
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  formGroup: { marginBottom: 14 },
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
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  row2: {
    flexDirection: 'row',
  },
  flex1: { flex: 1 },
  gap10: { width: 10 },

  // Avatar upload styles
  avatarSelectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLargePreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
  },
  avatarFileNameText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  avatarBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  avatarBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  avatarRemoveBtn: {
    backgroundColor: '#ef4444',
    padding: 5,
    borderRadius: 6,
  },
  avatarUploadRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  avatarPickBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  avatarCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatarCameraBtnText: { fontSize: 12, fontWeight: '700' },
  urlToggleBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  urlToggleText: { fontSize: 12, fontWeight: '700' },

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

  // Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
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
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: { fontSize: 13, fontWeight: '700' },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalDeleteBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
