import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, Switch, Image, Modal, ActivityIndicator, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCampaigns, createCampaign, updateCampaign, updateCampaignStatus, deleteCampaign } from '../../../src/services/campaignService';
import { getCommunities } from '../../../src/services/communityService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { useAppState } from '../../../src/context/AppStateProvider';
import { Campaign, DonationCategory, Community } from '../../../src/types';
import {
  Clock, PlusCircle, Trash2, CheckCircle2, Flame, Heart, Zap,
  TrendingUp, Eye, Edit3, Check, X, Upload, FileText, AlertTriangle,
  Building2, ArrowLeft, Image as ImageIcon, Plus, ChevronDown, ChevronUp,
  Camera, Sparkles, HandHeart
} from 'lucide-react-native';
import { CampaignCardSkeleton } from '../../../src/components/SkeletonLoader';
import CampaignImageCarousel from '../../../src/components/CampaignImageCarousel';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLanguageCode,
  translateCategory,
  translateCity,
  translateState,
  translateCommunityName,
  translateCampaignTitle,
  translateRole,
  translateStatus,
} from '../../../src/lib/translateEntity';
import DynamicText from '../../../src/components/DynamicText';

const CATEGORIES: DonationCategory[] = [
  'Medical', 'Education', 'Marriage', 'Food', 'Janazah'
];

export default function ManageCampaignsScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { currentRole, activeUser, handleCampaignUpdated } = useAppState();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Campaign | null>(null);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DonationCategory>('Medical');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [goalINR, setGoalINR] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryRelation, setBeneficiaryRelation] = useState('');
  const [daysLeft, setDaysLeft] = useState('30');
  const [story, setStory] = useState('');
  const [coverImages, setCoverImages] = useState<{ title: string; url: string; size?: string }[]>([]);
  const [documents, setDocuments] = useState<{ title: string; url: string; verifiedBy: string; size?: string }[]>([]);
  const [pickerTarget, setPickerTarget] = useState<'mainImage' | 'medicalDocuments' | null>(null);
  const [isZakatEligible, setIsZakatEligible] = useState(true);
  const [isSadqaEligible, setIsSadqaEligible] = useState(false);
  const [isFitrahEligible, setIsFitrahEligible] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  type FilterType = 'all' | 'zakat' | 'sadqa' | 'fitrah' | 'urgent' | 'pending';
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const rawDistRole = (
    activeUser?.district_role ||
    activeUser?.districtRole ||
    (activeUser?.role as string) ||
    (currentRole as string) ||
    ''
  ).toLowerCase().trim().replace(/\s+/g, '_');

  const isSuperOrExecutive =
    currentRole === 'super_admin' ||
    currentRole === 'executive_admin' ||
    activeUser?.role === 'super_admin' ||
    activeUser?.role === 'executive_admin';

  const isPresident =
    currentRole === 'district_president' ||
    activeUser?.role === 'district_president' ||
    rawDistRole === 'district_president';

  const isCommunityAdmin =
    currentRole === 'community_admin' ||
    activeUser?.role === 'community_admin' ||
    rawDistRole === 'community_admin';

  // Can create / edit / delete campaigns
  const canManageCampaigns = isSuperOrExecutive || isCommunityAdmin;
  // Can approve / reject campaigns (matches web: isAdmin || isPresident)
  const canApprove = isSuperOrExecutive || isPresident;

  const isAdmin = isSuperOrExecutive; // kept for createCampaign status logic
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const primaryColor = '#10b981';

  const loadData = async () => {
    setLoading(true);
    try {
      const [campsData, commsData] = await Promise.all([
        getCampaigns(
          activeUser?.communityId && currentRole === 'community_admin'
            ? { communityId: activeUser.communityId, status: 'all' }
            : { status: 'all' }
        ),
        getCommunities(),
      ]);
      setCampaigns(campsData);
      setCommunities(commsData);
      if (commsData.length > 0 && !selectedCommunityId) {
        setSelectedCommunityId(activeUser?.communityId || commsData[0].id);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeUser, currentRole]);

  const handleOpenCreate = () => {
    setEditingCampaignId(null);
    setTitle('');
    setCategory('Medical');
    setSelectedCommunityId(activeUser?.communityId || (communities[0]?.id ?? 'comm_bareilly_hq'));
    setGoalINR('');
    setBeneficiaryName('');
    setBeneficiaryRelation('');
    setDaysLeft('30');
    setStory('');
    setCoverImages([]);
    setDocuments([]);
    setIsZakatEligible(true);
    setIsSadqaEligible(false);
    setIsFitrahEligible(false);
    setIsUrgent(false);
    setShowCommunityDropdown(false);
    setActiveSubTab('create');
  };

  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaignId(c.id);
    setTitle(c.title);
    setCategory(c.category);
    setSelectedCommunityId(c.communityId);
    setGoalINR(c.goalINR.toString());
    setBeneficiaryName(c.beneficiaryName || '');
    setBeneficiaryRelation(c.beneficiaryRelation || '');
    setDaysLeft(c.daysLeft?.toString() || '30');
    setStory(c.story || '');
    const existingImgs = [c.mainImage, ...(c.galleryImages || [])].filter(Boolean);
    setCoverImages(existingImgs.map((url, idx) => ({
      url,
      title: idx === 0 ? 'Main Cover Photo' : `Gallery Photo #${idx + 1}`,
      size: 'Uploaded Photo',
    })));
    setDocuments(c.documents || []);
    setIsZakatEligible(c.isZakatEligible ?? false);
    setIsSadqaEligible(c.isSadqaEligible ?? false);
    setIsFitrahEligible(c.isFitrahEligible ?? false);
    setIsUrgent(c.isUrgent ?? false);
    setShowCommunityDropdown(false);
    setActiveSubTab('create');
  };

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    const target = pickerTarget;
    setPickerTarget(null);
    if (!target) return;

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to capture photos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (target === 'mainImage') {
            setCoverImages(prev => [...prev, {
              title: asset.fileName || (coverImages.length === 0 ? 'Main Cover Photo' : `Campaign Photo #${coverImages.length + 1}`),
              url: asset.uri,
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Camera Photo',
            }]);
          } else {
            setDocuments(prev => [...prev, {
              title: asset.fileName || `medical_estimate_${documents.length + 1}.jpg`,
              url: asset.uri,
              verifiedBy: 'Community Leader',
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Camera Photo',
            }]);
          }
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library access is needed to pick files.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          if (target === 'mainImage') {
            const newPhotos = result.assets.map((asset, idx) => ({
              title: asset.fileName || (coverImages.length === 0 && idx === 0 ? 'Main Cover Photo' : `Campaign Photo #${coverImages.length + idx + 1}`),
              url: asset.uri,
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Gallery Photo',
            }));
            setCoverImages(prev => [...prev, ...newPhotos]);
          } else {
            const newDocs = result.assets.map((asset, idx) => ({
              title: asset.fileName || `medical_doc_${documents.length + idx + 1}.jpg`,
              url: asset.uri,
              verifiedBy: 'Community Leader',
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Gallery Image',
            }));
            setDocuments(prev => [...prev, ...newDocs]);
          }
        }
      }
    } catch (err: any) {
      console.warn('ImagePicker error:', err);
      Alert.alert('Picker Notice', 'Unable to open media picker on this device.');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !goalINR || !story.trim()) {
      Alert.alert('Required Fields', 'Please fill in Campaign Title, Goal Amount, and Full Story.');
      return;
    }
    setSubmitting(true);
    try {
      const selectedComm = communities.find(c => c.id === selectedCommunityId) || {
        id: activeUser?.communityId || '',
        name: activeUser?.communityName || 'MFCT Trust',
        city: activeUser?.city || ''
      };

      // Upload cover images to Supabase storage IMAGES bucket
      const uploadedUrls = await Promise.all(
        coverImages.map(img => uploadImageToSupabase(img.url, 'campaigns'))
      );

      const defaultFallback = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';
      const finalMainImage = uploadedUrls[0] || coverImages[0]?.url || defaultFallback;
      const finalGalleryImages = uploadedUrls.slice(1).filter(Boolean);

      if (editingCampaignId) {
        const updated = await updateCampaign(editingCampaignId, {
          title: title.trim(), category,
          communityId: selectedComm.id, communityName: selectedComm.name, city: selectedComm.city || 'Bareilly',
          beneficiaryName: beneficiaryName.trim() || 'Community Beneficiary',
          beneficiaryRelation: beneficiaryRelation.trim() || '',
          goalINR: Number(goalINR) || 100000, daysLeft: Number(daysLeft) || 30,
          isZakatEligible, isSadqaEligible, isFitrahEligible, isUrgent,
          mainImage: finalMainImage, galleryImages: finalGalleryImages,
          story: story.trim(), documents,
        });
        if (handleCampaignUpdated) handleCampaignUpdated(updated);
        Alert.alert('Success', 'Campaign updated successfully!');
      } else {
        const created = await createCampaign({
          title: title.trim(), category,
          communityId: selectedComm.id, communityName: selectedComm.name, city: selectedComm.city || 'Bareilly',
          beneficiaryName: beneficiaryName.trim() || 'Community Beneficiary',
          beneficiaryRelation: beneficiaryRelation.trim() || '',
          goalINR: Number(goalINR) || 100000, raisedINR: 0, donorsCount: 0,
          daysLeft: Number(daysLeft) || 30, isVerified: isAdmin,
          isZakatEligible, isSadqaEligible, isFitrahEligible, isUrgent,
          mainImage: finalMainImage, galleryImages: finalGalleryImages,
          story: story.trim(), documents,
          createdDate: new Date().toISOString(),
          createdBy: activeUser?.id || 'admin',
          status: isAdmin ? 'active' : 'pending_approval',
        });
        if (handleCampaignUpdated) handleCampaignUpdated(created);
        Alert.alert('Success', 'Campaign submitted successfully!');
      }
      setActiveSubTab('list');
      loadData();
    } catch (err: any) {
      console.error('Save campaign error:', err);
      Alert.alert('Error', err?.message || 'Failed to save campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, isApprove: boolean) => {
    if (!canApprove) {
      Alert.alert('Permission Denied', 'Only Super/Executive Admin or District President can approve or reject campaigns.');
      return;
    }
    try {
      setProcessingId(id);
      const newStatus = isApprove ? 'active' : 'rejected';
      const updated = await updateCampaignStatus(id, newStatus, isApprove);
      if (handleCampaignUpdated) handleCampaignUpdated(updated);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, isVerified: isApprove } : c));
      Alert.alert('Updated', `Campaign ${isApprove ? 'approved' : 'rejected'} successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update campaign status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setProcessingId(deleteConfirmItem.id);
      await deleteCampaign(deleteConfirmItem.id);
      setCampaigns(prev => prev.filter(c => c.id !== deleteConfirmItem.id));
      setDeleteConfirmItem(null);
      Alert.alert('Deleted', 'Campaign deleted successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to delete campaign.');
    } finally {
      setProcessingId(null);
    }
  };

  // Compute filter counts
  const counts = {
    all: campaigns.length,
    zakat: campaigns.filter(c => !!c.isZakatEligible).length,
    sadqa: campaigns.filter(c => !!c.isSadqaEligible).length,
    fitrah: campaigns.filter(c => !!c.isFitrahEligible).length,
    urgent: campaigns.filter(c => !!c.isUrgent).length,
    pending: campaigns.filter(c => c.status === 'pending_approval' || c.status === 'pending').length,
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeFilter === 'zakat') return !!c.isZakatEligible;
    if (activeFilter === 'sadqa') return !!c.isSadqaEligible;
    if (activeFilter === 'fitrah') return !!c.isFitrahEligible;
    if (activeFilter === 'urgent') return !!c.isUrgent;
    if (activeFilter === 'pending') return c.status === 'pending_approval' || c.status === 'pending';
    return true;
  });

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || communities[0];

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">

      {/* ── Tab Bar ── */}
      <View className="flex-row p-2 gap-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <TouchableOpacity
          onPress={() => setActiveSubTab('list')}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${activeSubTab === 'list' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-900'
            }`}
        >
          <Heart color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-[13px] font-bold ${activeSubTab === 'list' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {t('tabs.campaigns', 'Campaigns')} ({campaigns.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenCreate}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${activeSubTab === 'create' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-900'
            }`}
        >
          <PlusCircle color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-[13px] font-bold ${activeSubTab === 'create' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {editingCampaignId ? t('admin.update_campaign', 'Edit Campaign') : `+ ${t('admin.publish_campaign', 'Create Campaign')}`}
          </Text>
        </TouchableOpacity>
      </View>
      {/* ── Filter Chips (list tab only) ── */}
      {activeSubTab === 'list' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
        >
          {/* All */}
          {([
            { key: 'all' as const, label: t('admin.all_campaigns', 'All'), count: counts.all, color: '#64748b', active: '#0f172a' },
            { key: 'zakat' as const, label: t('campaign.zakat', 'Zakat'), count: counts.zakat, color: '#d97706', active: '#d97706' },
            { key: 'sadqa' as const, label: t('campaign.sadqa', 'Sadqa'), count: counts.sadqa, color: '#0d9488', active: '#0d9488' },
            { key: 'fitrah' as const, label: t('campaign.fitrah', 'Fitrah'), count: counts.fitrah, color: '#6366f1', active: '#6366f1' },
            { key: 'urgent' as const, label: t('campaign.urgent', 'Urgent'), count: counts.urgent, color: '#ef4444', active: '#ef4444' },
            { key: 'pending' as const, label: t('admin.pending', 'Pending'), count: counts.pending, color: '#f59e0b', active: '#f59e0b' },
          ] as { key: FilterType; label: string; count: number; color: string; active: string }[]).map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                {
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: activeFilter === f.key ? f.active : (isDark ? '#1e293b' : '#f1f5f9'),
                  borderWidth: 1,
                  borderColor: activeFilter === f.key ? f.active : (isDark ? '#334155' : '#e2e8f0'),
                },
              ]}
            >
              <Text style={[
                { fontSize: 11, fontWeight: '700' },
                { color: activeFilter === f.key ? '#fff' : (isDark ? '#94a3b8' : '#475569') },
              ]}>
                {f.label}
              </Text>
              <View style={[
                { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10 },
                { backgroundColor: activeFilter === f.key ? 'rgba(255,255,255,0.25)' : (isDark ? '#334155' : '#e2e8f0') },
              ]}>
                <Text style={[
                  { fontSize: 10, fontWeight: '800' },
                  { color: activeFilter === f.key ? '#fff' : (isDark ? '#94a3b8' : '#475569') },
                ]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
            {[1, 2, 3, 4].map(i => <CampaignCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
            {filteredCampaigns.length === 0 ? (
              <View className="items-center justify-center py-16 px-5">
                <Heart color={isDark ? '#64748b' : '#94a3b8'} size={48} />
                <Text className="text-lg font-extrabold mt-3.5 text-slate-900 dark:text-white">
                  {activeFilter === 'all'
                    ? t('campaigns.no_results', 'No Campaigns Found')
                    : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}-Eligible Campaigns`}
                </Text>
                <Text className="text-[13px] text-center mt-1.5 leading-[18px] text-slate-500 dark:text-slate-400">
                  {t('home.no_campaigns', 'Create your first community campaign to start receiving contributions.')}
                </Text>
                  {activeFilter !== 'all' && (
                    <TouchableOpacity
                      onPress={() => setActiveFilter('all')}
                      className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl mt-2 bg-slate-200 dark:bg-slate-800"
                    >
                      <Text className="text-slate-700 dark:text-slate-200 text-sm font-bold">View All Campaigns</Text>
                    </TouchableOpacity>
                  )}
                  {canManageCampaigns && (
                <TouchableOpacity
                  onPress={handleOpenCreate}
                  className="flex-row items-center gap-1.5 px-4 py-3 rounded-xl mt-5 bg-emerald-500"
                >
                  <PlusCircle color="#fff" size={16} />
                  <Text className="text-white text-sm font-bold">
                    {t('admin.publish_campaign', 'Create Campaign')}
                  </Text>
                </TouchableOpacity>
                  )}
              </View>
            ) : (
              filteredCampaigns.map((c) => {
                const pct = c.goalINR > 0 ? Math.min(100, Math.round(((c.raisedINR || 0) / c.goalINR) * 100)) : 0;
                const isPending = c.status === 'pending_approval' || c.status === 'pending';

                return (
                  <View
                    key={c.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mb-4 overflow-hidden"
                  >
                    {/* Campaign Image Carousel */}
                    <CampaignImageCarousel
                      images={[c.mainImage, ...(c.galleryImages || [])].filter(Boolean)}
                      height={160}
                      overlayBadges={
                        <>
                          <View className="px-2.5 py-1 rounded-full bg-emerald-500">
                            <Text className="text-white text-[10px] font-extrabold uppercase tracking-wide">
                              {translateCategory(c.category, lang)}
                            </Text>
                          </View>

                          {isPending && (
                            <View className="flex-row items-center gap-0.5 px-2 py-1 rounded-full bg-amber-500">
                              <Clock color="#fff" size={11} />
                              <Text className="text-white text-[10px] font-bold uppercase">
                                {translateStatus('pending', lang)}
                              </Text>
                            </View>
                          )}

                          {c.isUrgent && (
                            <View className="flex-row items-center gap-0.5 px-2 py-1 rounded-full bg-red-500">
                              <Flame color="#fff" size={11} />
                              <Text className="text-white text-[10px] font-bold uppercase">
                                {translateCategory('Urgent', lang)}
                              </Text>
                            </View>
                          )}

                          {c.isZakatEligible && (
                            <View className="flex-row items-center gap-0.5 px-2 py-1 rounded-full bg-violet-500">
                              <Zap color="#fff" size={11} />
                              <Text className="text-white text-[10px] font-bold uppercase">
                                {translateCategory('Zakat', lang)}
                              </Text>
                            </View>
                          )}

                          {c.isSadqaEligible && (
                            <View className="flex-row items-center gap-0.5 px-2 py-1 rounded-full" style={{ backgroundColor: '#0d9488' }}>
                              <Heart color="#fff" size={11} />
                              <Text className="text-white text-[10px] font-bold uppercase">
                                {translateCategory('Sadqa', lang)}
                              </Text>
                            </View>
                          )}

                          {c.isFitrahEligible && (
                            <View className="flex-row items-center gap-0.5 px-2 py-1 rounded-full" style={{ backgroundColor: '#d97706' }}>
                              <Sparkles color="#fff" size={11} />
                              <Text className="text-white text-[10px] font-bold uppercase">
                                {translateCategory('Fitra', lang)}
                              </Text>
                            </View>
                          )}
                        </>
                      }
                    />

                    {/* Card Content */}
                    <View className="p-3.5">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {translateCommunityName(c.communityName || 'Bareilly Central', lang)} {c.city ? `• ${translateCity(c.city, lang)}` : ''}
                        </Text>
                        <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {c.daysLeft || 30} {t('campaigns.days_left', 'days left')}
                        </Text>
                      </View>

                      <DynamicText
                        text={c.title}
                        lang={lang}
                        fallback={translateCampaignTitle(c.title, lang)}
                        style={{ fontSize: 15, fontWeight: '800', lineHeight: 20, marginBottom: 4, color: isDark ? '#fff' : '#0f172a' }}
                        numberOfLines={2}
                      />

                      {c.beneficiaryName ? (
                        <Text className="text-xs mb-2.5 text-slate-500 dark:text-slate-400">
                          {t('campaign_details.beneficiary', 'Beneficiary')}:{' '}
                          <DynamicText
                            text={c.beneficiaryName}
                            lang={lang}
                            style={{ fontWeight: '700', color: isDark ? '#fff' : '#0f172a' }}
                          />
                          {c.beneficiaryRelation ? ` (${translateRole(c.beneficiaryRelation, lang)})` : ''}
                        </Text>
                      ) : null}

                      {/* Progress bar */}
                      <View className="my-1.5">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-sm font-extrabold text-emerald-500">
                            ₹{(c.raisedINR || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('campaign_details.goal', 'Goal')}: ₹{c.goalINR.toLocaleString('en-IN')} ({pct}%)
                          </Text>
                        </View>
                        <View className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                          <View className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </View>
                      </View>

                      {/* Documents indicator */}
                      {c.documents && c.documents.length > 0 && (
                        <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 mt-2 bg-slate-50 dark:bg-slate-900">
                          <FileText color="#10b981" size={14} />
                          <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {c.documents.length} {t('campaign_details.verified_docs', 'verified estimate/document(s) attached')}
                          </Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View className="flex-row items-center justify-end flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {canApprove && isPending && (
                          <>
                            <TouchableOpacity
                              onPress={() => handleAction(c.id, true)}
                              disabled={processingId === c.id}
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-500/15"
                            >
                              <Check color="#10b981" size={14} />
                              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                {t('btn.approve', 'Approve')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleAction(c.id, false)}
                              disabled={processingId === c.id}
                              className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500 bg-red-500/15"
                            >
                              <X color="#ef4444" size={14} />
                              <Text className="text-[11px] font-bold text-red-500 dark:text-red-400">
                                {t('btn.reject', 'Reject')}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity
                          onPress={() => handleOpenEdit(c)}
                          className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                        >
                          <Edit3 color={isDark ? '#94a3b8' : '#64748b'} size={14} />
                          <Text className="text-[11px] font-bold text-slate-900 dark:text-white">
                            {t('admin.update_campaign', 'Edit')}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDeleteConfirmItem(c)}
                          className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500 bg-red-500/15"
                        >
                          <Trash2 color="#ef4444" size={14} />
                          <Text className="text-[11px] font-bold text-red-500 dark:text-red-400">
                            {t('btn.reject', 'Delete')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Campaign Title */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.campaign_title', 'Campaign Title *')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={t('admin.campaign_title_placeholder', 'e.g. Urgent Dialysis & Kidney Treatment Support')}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Chips */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.campaign_category')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-full border ${isSelected
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {translateCategory(cat, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Community Dropdown */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.tabCommunityHub', 'Community *')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCommunityDropdown(!showCommunityDropdown)}
              className="flex-row items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 bg-white dark:bg-slate-900"
            >
              <View className="flex-row items-center flex-1 gap-2.5">
                <Building2 color="#10b981" size={18} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {selectedCommunity ? translateCommunityName(selectedCommunity.name, lang) : t('admin.select_community', 'Select Community')}
                  </Text>
                  {selectedCommunity?.city ? (
                    <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                      {translateCity(selectedCommunity.city, lang)} {selectedCommunity.state ? `, ${translateState(selectedCommunity.state, lang)}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
              {showCommunityDropdown ? (
                <ChevronUp color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              ) : (
                <ChevronDown color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              )}
            </TouchableOpacity>

            {showCommunityDropdown && (
              <View className="border border-slate-200 dark:border-slate-700 rounded-xl mt-1.5 overflow-hidden bg-white dark:bg-slate-800">
                {communities.map((comm) => {
                  const isSelected = selectedCommunityId === comm.id;
                  return (
                    <TouchableOpacity
                      key={comm.id}
                      onPress={() => { setSelectedCommunityId(comm.id); setShowCommunityDropdown(false); }}
                      className={`flex-row items-center justify-between px-3.5 py-3 border-b border-slate-200 dark:border-slate-700 ${isSelected ? 'bg-emerald-500/15' : ''
                        }`}
                    >
                      <View className="flex-1">
                        <Text className={`text-[13px] font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {translateCommunityName(comm.name, lang)}
                        </Text>
                        <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                          {translateCity(comm.city, lang)} {comm.state ? `• ${translateState(comm.state, lang)}` : ''}
                        </Text>
                      </View>
                      {isSelected && <Check color="#10b981" size={16} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Goal Amount */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.campaign_goal', 'Goal Amount (₹) *')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="e.g. 250000"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              keyboardType="numeric"
              value={goalINR}
              onChangeText={setGoalINR}
            />
          </View>

          {/* Beneficiary Name */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.beneficiary_name', 'Beneficiary Name')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={t('admin.beneficiary_name_placeholder', 'e.g. Mohd Rashid')}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
            />
          </View>

          {/* Beneficiary Relation */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.beneficiary_relation', 'Relation')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={t('admin.beneficiary_relation_placeholder', 'e.g. Self / Father')}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={beneficiaryRelation}
              onChangeText={setBeneficiaryRelation}
            />
          </View>

          {/* Days Left */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.campaign_duration', 'Campaign Duration (Days)')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder="e.g. 30"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              keyboardType="numeric"
              value={daysLeft}
              onChangeText={setDaysLeft}
            />
          </View>

          {/* Full Story */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
              {t('admin.campaign_story', 'Full Story / Situation Details *')}
            </Text>
            <TextInput
              className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              style={{ height: 100 }}
              placeholder={t('admin.campaign_story_placeholder', 'Describe the medical situation, hospital diagnosis, family condition, and required aid...')}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              multiline
              textAlignVertical="top"
              value={story}
              onChangeText={setStory}
            />
          </View>

          {/* ── Cover Photos ── */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('admin.cover_photo_title', 'Campaign Main Cover & Photos')} ({coverImages.length})
              </Text>
              <TouchableOpacity
                onPress={() => setPickerTarget('mainImage')}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
              >
                <Plus color="#10b981" size={14} />
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t('admin.add_photo', 'Add / Snap')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setPickerTarget('mainImage')}
              className={`p-4 rounded-2xl border-2 border-dashed items-center justify-center gap-1.5 ${coverImages.length > 0
                  ? 'bg-emerald-500/15 border-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              activeOpacity={0.7}
            >
              <View className="w-11 h-11 rounded-full items-center justify-center bg-emerald-500/20 mb-2">
                <Camera color="#10b981" size={20} />
              </View>
              <Text className={`text-[13px] font-bold text-center ${coverImages.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {coverImages.length > 0
                  ? `✓ ${coverImages.length} ${t('admin.photos_attached', 'Photo(s) Selected')}`
                  : t('admin.upload_cover_photo', 'Upload Campaign Main Image')}
              </Text>
              <Text className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                {t('admin.upload_cover_photo_sub', 'Take photo or choose from gallery (JPG, PNG)')}
              </Text>
            </TouchableOpacity>

            {/* Live Carousel Preview */}
            {coverImages.length > 0 && (
              <View className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <View className="flex-row items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {t('admin.carousel_live_preview', 'Live Carousel Preview')}
                  </Text>
                  <Text className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {coverImages.length} {t('admin.photos_attached', 'photo(s)')}
                  </Text>
                </View>
                <CampaignImageCarousel
                  images={coverImages.map(img => img.url)}
                  height={140}
                  showDots={true}
                  showCounter={true}
                  showChevrons={true}
                />
              </View>
            )}

            {/* Attached Photos List */}
            {coverImages.length > 0 && (
              <View className="mt-2.5 gap-2">
                {coverImages.map((img, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center p-2.5 rounded-2xl border bg-white dark:bg-slate-800"
                    style={{ borderColor: idx === 0 ? '#10b981' : (isDark ? '#334155' : '#e2e8f0') }}
                  >
                    <Image source={{ uri: img.url }} style={{ width: 52, height: 52, borderRadius: 8 }} resizeMode="cover" />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-[13px] font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>
                          {img.title}
                        </Text>
                        {idx === 0 && (
                          <View className="px-1.5 py-0.5 rounded-md bg-emerald-500/15">
                            <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                              ★ {t('admin.cover_badge', 'Cover')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                        {idx === 0 ? t('admin.cover_photo_ready', 'Cover photo ready') : (img.size || `Gallery Photo #${idx + 1}`)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setCoverImages(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg bg-red-500/15"
                    >
                      <Trash2 color="#ef4444" size={15} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Medical Documents ── */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t('admin.attach_docs_title', 'Attach Medical Estimates / Documents')} ({documents.length})
              </Text>
              <TouchableOpacity
                onPress={() => setPickerTarget('medicalDocuments')}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
              >
                <Plus color="#10b981" size={14} />
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t('admin.add_scan', 'Add / Scan')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setPickerTarget('medicalDocuments')}
              className={`p-4 rounded-2xl border-2 border-dashed items-center justify-center gap-1.5 ${documents.length > 0
                  ? 'bg-emerald-500/15 border-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              activeOpacity={0.7}
            >
              <View className="w-11 h-11 rounded-full items-center justify-center bg-emerald-500/20 mb-2">
                <FileText color="#10b981" size={20} />
              </View>
              <Text className={`text-[13px] font-bold text-center ${documents.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {documents.length > 0
                  ? `✓ ${documents.length} ${t('admin.docs_attached', 'Medical Document(s) Attached')}`
                  : t('admin.upload_docs_placeholder', 'Upload Hospital Estimates, Bills or Prescription Reports')}
              </Text>
              <Text className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                {t('admin.upload_docs_sub', 'Camera scan or select multiple files/photos from gallery')}
              </Text>
            </TouchableOpacity>

            {documents.length > 0 && (
              <View className="mt-2.5 gap-2">
                {documents.map((doc, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <Image source={{ uri: doc.url }} style={{ width: 52, height: 52, borderRadius: 8 }} resizeMode="cover" />
                    <View className="flex-1 ml-3">
                      <Text className="text-[13px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                        {doc.size || 'Attached File'} • {doc.verifiedBy}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-lg bg-red-500/15"
                    >
                      <Trash2 color="#ef4444" size={15} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Eligibility & Priority Switches ── */}
          <View className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5 bg-white dark:bg-slate-800">
            {/* Zakat */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2.5">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'ज़कात पात्र' : lang === 'ur' ? 'زکوٰۃ کے اہل' : t('admin.zakat_eligible', 'Zakat Eligible')}
                </Text>
                <Text className="text-[11px] mt-0.5 leading-[15px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi' ? 'ज़कात नियमों के अनुरूप (Shariah compliance)' : lang === 'ur' ? 'شرعی زکوٰۃ کے شرائط پر پورا اترتا ہے' : t('admin.zakat_eligible_desc', 'Meets Shariah Zakat compliance rules')}
                </Text>
              </View>
              <Switch value={isZakatEligible} onValueChange={setIsZakatEligible} trackColor={{ true: '#10b981', false: borderColor }} />
            </View>

            {/* Sadqa */}
            <View className="flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3.5 mt-2.5">
              <View className="flex-1 pr-2.5">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'सदका पात्र' : lang === 'ur' ? 'صدقہ کے اہل' : t('admin.sadqa_eligible', 'Sadqa Eligible')}
                </Text>
                <Text className="text-[11px] mt-0.5 leading-[15px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi' ? 'सामान्य सदका व खैरात स्वीकार्य' : lang === 'ur' ? 'عام صدقہ اور خیرات کے لیے درست' : t('admin.sadqa_eligible_desc', 'Accepts general Sadaqah & voluntary charity')}
                </Text>
              </View>
              <Switch value={isSadqaEligible} onValueChange={setIsSadqaEligible} trackColor={{ true: '#0d9488', false: borderColor }} />
            </View>

            {/* Fitrah */}
            <View className="flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3.5 mt-2.5">
              <View className="flex-1 pr-2.5">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'फ़ितरा पात्र' : lang === 'ur' ? 'فطرہ کے اہل' : t('admin.fitrah_eligible', 'Fitrah Eligible')}
                </Text>
                <Text className="text-[11px] mt-0.5 leading-[15px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi' ? 'ईद-उल-फ़ित्र फ़ितरा व फ़िद्या पात्र' : lang === 'ur' ? 'صدقۃ الفطر اور فدیہ کے مستحقین کے لیے' : t('admin.fitrah_eligible_desc', 'Eligible for Fitrah & Fidya contributions')}
                </Text>
              </View>
              <Switch value={isFitrahEligible} onValueChange={setIsFitrahEligible} trackColor={{ true: '#d97706', false: borderColor }} />
            </View>

            {/* Urgent */}
            <View className="flex-row items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3.5 mt-2.5">
              <View className="flex-1 pr-2.5">
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'अति आवश्यक (इमरजेंसी)' : lang === 'ur' ? 'انتہائی ہنگامی (ارجنٹ)' : t('admin.urgent_appeal', 'Urgent Priority')}
                </Text>
                <Text className="text-[11px] mt-0.5 leading-[15px] text-slate-500 dark:text-slate-400">
                  {lang === 'hi' ? 'अस्पताल / जीवन रक्षा हेतु तत्काल' : lang === 'ur' ? 'ہسپتال / جان بچانے کے لیے فوری' : t('admin.urgent_appeal_desc', 'Immediate hospital / critical life threat')}
                </Text>
              </View>
              <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ true: '#ef4444', false: borderColor }} />
            </View>
          </View>

          {/* Form Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setActiveSubTab('list')}
              className="py-3.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-center bg-slate-100 dark:bg-slate-900"
            >
              <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-emerald-500"
              style={submitting ? { opacity: 0.7 } : undefined}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text className="text-white text-[15px] font-bold">
                    {editingCampaignId ? t('admin.update_campaign', 'Update Campaign') : t('admin.publish_campaign', 'Publish Campaign')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        visible={!!deleteConfirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmItem(null)}
      >
        <View className="flex-1 bg-black/75 justify-center items-center p-6">
          <View className="w-full max-w-[360px] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 items-center bg-white dark:bg-slate-800">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-red-500/15">
              <AlertTriangle color="#ef4444" size={28} />
            </View>
            <Text className="text-lg font-extrabold mb-2 text-center text-slate-900 dark:text-white">
              {t('admin.delete_campaign_title', 'Delete Campaign?')}
            </Text>
            <Text className="text-[13px] leading-[18px] text-center mb-5 text-slate-500 dark:text-slate-400">
              {t('admin.delete_campaign_desc', 'This action cannot be undone. Are you sure you want to permanently delete this campaign?')}
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setDeleteConfirmItem(null)}
                disabled={processingId === deleteConfirmItem?.id}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 items-center bg-slate-100 dark:bg-slate-900"
              >
                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={processingId === deleteConfirmItem?.id}
                className="flex-1 py-3 rounded-xl items-center justify-center bg-red-500"
              >
                {processingId === deleteConfirmItem?.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-sm font-bold">
                    {t('btn.reject', 'Yes, Delete')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Media Picker Bottom Sheet ── */}
      {pickerTarget !== null && (
        <Modal
          visible={pickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerTarget(null)}
        >
          <TouchableOpacity
            className="flex-1 bg-slate-900/65 justify-end"
            activeOpacity={1}
            onPress={() => setPickerTarget(null)}
          >
            <View
              className="bg-white dark:bg-slate-800 rounded-t-3xl p-5"
              style={{ paddingBottom: Platform.OS === 'ios' ? 36 : 24 }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-extrabold text-slate-900 dark:text-white">
                  {pickerTarget === 'mainImage'
                    ? t('admin.cover_photo_title', 'Campaign Main Cover & Photos')
                    : t('admin.attach_docs_title', 'Attach Medical Estimates / Documents')}
                </Text>
                <TouchableOpacity
                  onPress={() => setPickerTarget(null)}
                  className="w-8 h-8 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-900"
                >
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 mb-4">
                {/* Camera */}
                <TouchableOpacity
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 items-center justify-center bg-slate-100 dark:bg-slate-900"
                  onPress={() => handlePickMedia('camera')}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2 bg-emerald-500/20">
                    <Camera color="#10b981" size={24} />
                  </View>
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {t('admin.camera_option', 'Use Camera')}
                  </Text>
                  <Text className="text-[11px] mt-0.5 text-center text-slate-500 dark:text-slate-400">
                    {pickerTarget === 'mainImage' ? t('admin.camera_cover_sub', 'Snap photo with camera') : t('admin.camera_doc_sub', 'Scan document / receipt')}
                  </Text>
                </TouchableOpacity>

                {/* Gallery */}
                <TouchableOpacity
                  className="flex-1 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 items-center justify-center bg-slate-100 dark:bg-slate-900"
                  onPress={() => handlePickMedia('gallery')}
                  activeOpacity={0.7}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2 bg-blue-500/20">
                    <ImageIcon color="#2563eb" size={24} />
                  </View>
                  <Text className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {t('admin.gallery_option', 'From Gallery')}
                  </Text>
                  <Text className="text-[11px] mt-0.5 text-center text-slate-500 dark:text-slate-400">
                    {pickerTarget === 'mainImage' ? t('admin.gallery_doc_sub', 'Pick single or multiple photos') : t('admin.gallery_doc_sub', 'Pick multiple images/docs')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setPickerTarget(null)}
                className="py-3.5 rounded-2xl items-center justify-center bg-slate-100 dark:bg-slate-900"
              >
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
