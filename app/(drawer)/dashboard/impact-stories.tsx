import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../../../src/services/testimonialService';
import { Testimonial } from '../../../src/types';
import {
  Quote,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Check,
  HeartHandshake,
} from 'lucide-react-native';
import { StoryCardSkeleton } from '../../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  getLanguageCode,
  translateDonorName,
  translateRole,
  translateCity,
  translateQuote,
  translateCampaignTitle,
  translateStatus,
} from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ImpactStoriesAdminScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
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
  const [quote, setQuote] = useState('');

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

  // Reset form
  const resetForm = () => {
    setName('');
    setCity((activeUser?.district || activeUser?.city || '').trim());
    setQuote('');
    setEditingId(null);
  };

  // Open item in Edit Mode
  const handleOpenEdit = (item: Testimonial) => {
    setEditingId(item.id);
    setName(item.name || '');
    setCity(item.city || '');
    setQuote(item.quote || '');
    setActiveSubTab('create');
  };

  // Handle Save (Create or Update)
  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter the author/beneficiary name.', 'error');
      return;
    }
    const userDistrictVal = (activeUser?.district || activeUser?.city || '').trim();
    if (editingId && !city.trim()) {
      showToast('Please enter the city.', 'error');
      return;
    }
    if (!quote.trim()) {
      showToast('Please write the quote / impact story.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // UPDATE story
        await updateTestimonial(editingId, {
          name: name.trim(),
          city: city.trim() || userDistrictVal,
          quote: quote.trim(),
        });

        showToast('Impact story updated successfully!', 'success');
      } else {
        // CREATE new story
        const newStoryData = {
          name: name.trim(),
          city: userDistrictVal,
          role: (activeUser?.role || 'Member') as any,
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

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Toast Notification Banner */}
      {toast && (
        <View
          className={`absolute top-2.5 left-4 right-4 z-50 flex-row items-center py-3 px-4 rounded-xl gap-2.5 shadow-md ${
            toast.type === 'success'
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
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
            activeSubTab === 'list'
              ? 'bg-emerald-500 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Quote color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text
            className={`text-[13px] font-bold ${
              activeSubTab === 'list' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
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
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
            activeSubTab === 'create'
              ? 'bg-emerald-500 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {editingId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          )}
          <Text
            className={`text-[13px] font-bold ${
              activeSubTab === 'create' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {editingId ? 'Edit Story' : t('stories.tab_create', '+ Add Story')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
            {[1, 2, 3].map(i => (
              <StoryCardSkeleton key={i} />
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {testimonials.length === 0 ? (
              <View className="items-center justify-center py-16 px-5">
                <Quote color={isDark ? '#64748b' : '#94a3b8'} size={44} />
                <Text className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('stories.empty', 'No impact stories found')}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl mt-4 bg-emerald-500"
                  onPress={() => {
                    resetForm();
                    setActiveSubTab('create');
                  }}
                >
                  <PlusCircle color="#fff" size={16} />
                  <Text className="text-white text-[13px] font-bold">{t('testimonials.title', 'Share First Story')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              testimonials.map(item => {
                const isApproved = item.status === 'approved';
                const authorRole = translateRole(item.role || 'Beneficiary', lang);
                const statusDisplay = translateStatus(item.status || 'pending', lang);

                return (
                  <View
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-3.5 p-4 shadow-xs"
                  >
                    {/* Top Row: Author Info & Status */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        {item.avatar ? (
                          <Image
                            source={{ uri: item.avatar }}
                            style={{ width: 42, height: 42, borderRadius: 21 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-10.5 h-10.5 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {item.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <DynamicText
                            text={item.name}
                            style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}
                            numberOfLines={1}
                          />
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <MapPin color="#10b981" size={11} />
                            <DynamicText
                              text={item.city || ''}
                              style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}
                              numberOfLines={1}
                            />
                            <Text className="text-[11px] text-slate-400 dark:text-slate-500">
                              {' • '}{authorRole}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        className={`flex-row items-center gap-1 px-2.5 py-1 rounded-md border ${
                          isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 color="#059669" size={12} />
                        ) : (
                          <Clock color="#d97706" size={12} />
                        )}
                        <Text
                          className={`text-[11px] font-bold ${
                            isApproved
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {statusDisplay}
                        </Text>
                      </View>
                    </View>

                    {/* Quote Text */}
                    <View className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-3">
                      <Quote color="#10b981" size={14} style={{ marginBottom: 4 }} />
                      <DynamicText
                        text={item.quote}
                        style={{
                          fontSize: 13,
                          lineHeight: 20,
                          color: isDark ? '#f1f5f9' : '#1e293b',
                          fontStyle: 'italic',
                        }}
                      />
                    </View>

                    {/* Linked Campaign Badge if present */}
                    {item.campaignTitle ? (
                      <View className="flex-row items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                        <HeartHandshake color="#10b981" size={13} />
                        <DynamicText
                          text={item.campaignTitle}
                          style={{ fontSize: 11, fontWeight: '600', color: '#10b981' }}
                          numberOfLines={1}
                        />
                      </View>
                    ) : null}

                    {/* Action Bar: Approve, Edit, Delete */}
                    <View className="flex-row gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      {/* Approve button (for admins if pending) */}
                      {!isApproved && isAdmin && (
                        <TouchableOpacity
                          className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                          onPress={() => handleApprove(item.id)}
                          disabled={approvingId === item.id}
                        >
                          {approvingId === item.id ? (
                            <ActivityIndicator size="small" color="#10b981" />
                          ) : (
                            <>
                              <Check color="#10b981" size={14} />
                              <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {t('btn.approve', 'Approve')}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Edit button */}
                      <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/50"
                        onPress={() => handleOpenEdit(item)}
                      >
                        <Edit3 color="#0284c7" size={14} />
                        <Text className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {t('admin.auditTrail', 'Edit')}
                        </Text>
                      </TouchableOpacity>

                      {/* Delete button */}
                      <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50"
                        onPress={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 color="#ef4444" size={14} />
                        <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                          {t('btn.reject', 'Delete')}
                        </Text>
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
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            {editingId && (
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
                {editingId ? 'Edit Impact Story' : t('stories.form_title', 'Create Impact Story')}
              </Text>
              <Text className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                {editingId
                  ? 'Update beneficiary testimonial and details.'
                  : 'Add genuine voices from the community to inspire donors.'}
              </Text>
            </View>
          </View>

          {/* Form Card 1: Author Details */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
            <View className={editingId ? "mb-3.5" : ""}>
              <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">
                {t('stories.field_name', 'Author / Beneficiary Name')} *
              </Text>
              <View className="relative justify-center">
                <View className="absolute left-3 z-10">
                  <UserIcon color="#10b981" size={17} />
                </View>
                <TextInput
                  className="h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  placeholder="e.g. Fatima Khan"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {editingId && (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">
                    {t('stories.field_city', 'City')} *
                  </Text>
                  <View className="relative justify-center">
                    <View className="absolute left-3 z-10">
                      <MapPin color="#10b981" size={17} />
                    </View>
                    <TextInput
                      className="h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      placeholder="e.g. Bareilly"
                      placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Form Card 2: Quote / Story */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3.5 shadow-xs">
            <Text className="text-xs font-bold mb-2 text-slate-500 dark:text-slate-400">
              {t('stories.field_quote', 'Quote / Story')} *
            </Text>
            <TextInput
              className="min-h-[120px] p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-5"
              placeholder="Write the beneficiary's testimonial or impact story here..."
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              multiline
              textAlignVertical="top"
              value={quote}
              onChangeText={setQuote}
            />
          </View>

          {/* Submit / Action Row */}
          <View className="flex-row gap-3 mt-1 pb-10">
            {editingId && (
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
              className={`py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-emerald-500 ${
                editingId ? 'flex-[2]' : 'flex-1'
              } ${submitting ? 'opacity-60' : ''}`}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text className="text-white text-sm font-bold">
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
        <View className="flex-1 justify-center items-center p-5 bg-black/75">
          <View className="w-full max-w-[340px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 items-center">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-3.5 bg-red-50 dark:bg-red-950/50">
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">
              Delete Impact Story?
            </Text>
            <Text className="text-xs text-center leading-4 text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to delete this story? This action cannot be undone.
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
    </View>
  );
}
