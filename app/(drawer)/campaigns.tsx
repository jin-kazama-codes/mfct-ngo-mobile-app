import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, Switch, Image, StyleSheet, Modal, ActivityIndicator, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCampaigns, createCampaign, updateCampaign, updateCampaignStatus, deleteCampaign } from '../../src/services/campaignService';
import { getCommunities } from '../../src/services/communityService';
import { useAppState } from '../../src/context/AppStateProvider';
import { Campaign, DonationCategory, Community } from '../../src/types';
import {
  Clock, PlusCircle, Trash2, CheckCircle2, Flame, Heart, Zap,
  TrendingUp, Eye, Edit3, Check, X, Upload, FileText, AlertTriangle,
  Building2, ArrowLeft, Image as ImageIcon, Plus, ChevronDown, ChevronUp,
  Camera, Sparkles, HandHeart
} from 'lucide-react-native';
import { CampaignCardSkeleton } from '../../src/components/SkeletonLoader';
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
} from '../../src/lib/translateEntity';
import DynamicText from '../../src/components/DynamicText';

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

  // Edit mode tracking
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Professional Delete Modal state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Campaign | null>(null);

  // Community Dropdown state
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

  // Multiple Campaign Cover & Gallery Photos state
  const [coverImages, setCoverImages] = useState<{ title: string; url: string; size?: string }[]>([]);

  // Multiple Documents / Medical Estimates state (from phone)
  const [documents, setDocuments] = useState<{ title: string; url: string; verifiedBy: string; size?: string }[]>([]);

  // Media picker target state
  const [pickerTarget, setPickerTarget] = useState<'mainImage' | 'medicalDocuments' | null>(null);

  const [isZakatEligible, setIsZakatEligible] = useState(true);
  const [isSadqaEligible, setIsSadqaEligible] = useState(false);
  const [isFitrahEligible, setIsFitrahEligible] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const isAdmin = currentRole === 'super_admin' || currentRole === 'executive_admin';

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

  // Open form in Create mode
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

  // Open form in Edit mode
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

  // Unified Media Picker for Camera and Gallery (single or multiple)
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

        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (target === 'mainImage') {
            const newPhoto = {
              title: asset.fileName || (coverImages.length === 0 ? 'Main Cover Photo' : `Campaign Photo #${coverImages.length + 1}`),
              url: asset.uri,
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Camera Photo',
            };
            setCoverImages(prev => [...prev, newPhoto]);
          } else {
            const newDoc = {
              title: asset.fileName || `medical_estimate_${documents.length + 1}.jpg`,
              url: asset.uri,
              verifiedBy: 'Community Leader',
              size: asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : 'Camera Photo',
            };
            setDocuments(prev => [...prev, newDoc]);
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

  // Save / Update Campaign
  const handleSave = async () => {
    if (!title.trim() || !goalINR || !story.trim()) {
      Alert.alert('Required Fields', 'Please fill in Campaign Title, Goal Amount, and Full Story.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedComm = communities.find(c => c.id === selectedCommunityId) || {
        id: activeUser?.communityId || 'comm_bareilly_hq',
        name: activeUser?.communityName || 'Bareilly Central Care Society',
        city: 'Bareilly'
      };

      const finalMainImage = coverImages[0]?.url || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';
      const finalGalleryImages = coverImages.slice(1).map(img => img.url);

      if (editingCampaignId) {
        // Update existing campaign
        const updated = await updateCampaign(editingCampaignId, {
          title: title.trim(),
          category,
          communityId: selectedComm.id,
          communityName: selectedComm.name,
          city: selectedComm.city || 'Bareilly',
          beneficiaryName: beneficiaryName.trim() || 'Community Beneficiary',
          beneficiaryRelation: beneficiaryRelation.trim() || '',
          goalINR: Number(goalINR) || 100000,
          daysLeft: Number(daysLeft) || 30,
          isZakatEligible,
          isSadqaEligible,
          isFitrahEligible,
          isUrgent,
          mainImage: finalMainImage,
          galleryImages: finalGalleryImages,
          story: story.trim(),
          documents,
        });
        if (handleCampaignUpdated) handleCampaignUpdated(updated);
        Alert.alert('Success', 'Campaign updated successfully!');
      } else {
        // Create new campaign
        const created = await createCampaign({
          title: title.trim(),
          category,
          communityId: selectedComm.id,
          communityName: selectedComm.name,
          city: selectedComm.city || 'Bareilly',
          beneficiaryName: beneficiaryName.trim() || 'Community Beneficiary',
          beneficiaryRelation: beneficiaryRelation.trim() || '',
          goalINR: Number(goalINR) || 100000,
          raisedINR: 0,
          donorsCount: 0,
          daysLeft: Number(daysLeft) || 30,
          isVerified: isAdmin,
          isZakatEligible,
          isSadqaEligible,
          isFitrahEligible,
          isUrgent,
          mainImage: finalMainImage,
          galleryImages: finalGalleryImages,
          story: story.trim(),
          documents,
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

  // Handle Approve / Reject
  const handleAction = async (id: string, isApprove: boolean) => {
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

  // Confirm Delete
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

  // Dynamic Theme Colors
  const colors = {
    screenBg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBgAlt: isDark ? '#0f172a' : '#f1f5f9',
    inputBg: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    danger: '#ef4444',
    dangerLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    warning: '#f59e0b',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
  };

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || communities[0];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.screenBg }]} edges={['top']}>


      {/*Tab Navigation Header */}
      <View style={[styles.tabBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveSubTab('list')}
          style={[
            styles.tabItem,
            activeSubTab === 'list'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.cardBgAlt }
          ]}
        >
          <Heart color={activeSubTab === 'list' ? '#fff' : colors.textSecondary} size={15} />
          <Text style={[styles.tabText, { color: activeSubTab === 'list' ? '#fff' : colors.textSecondary }]}>
            {t('tabs.campaigns', 'Campaigns')} ({campaigns.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenCreate}
          style={[
            styles.tabItem,
            activeSubTab === 'create'
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.cardBgAlt }
          ]}
        >
          <PlusCircle color={activeSubTab === 'create' ? '#fff' : colors.textSecondary} size={15} />
          <Text style={[styles.tabText, { color: activeSubTab === 'create' ? '#fff' : colors.textSecondary }]}>
            {editingCampaignId ? t('admin.update_campaign', 'Edit Campaign') : `+ ${t('admin.publish_campaign', 'Create Campaign')}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={styles.listPad}>
            {[1, 2, 3, 4].map(i => <CampaignCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
            {campaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart color={colors.textMuted} size={48} />
                <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                  {t('campaigns.no_results', 'No Campaigns Found')}
                </Text>
                <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                  {t('home.no_campaigns', 'Create your first community campaign to start receiving contributions.')}
                </Text>
                <TouchableOpacity onPress={handleOpenCreate} style={styles.emptyActionBtn}>
                  <PlusCircle color="#fff" size={16} />
                  <Text style={styles.emptyActionBtnText}>
                    {t('admin.publish_campaign', 'Create Campaign')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              campaigns.map((c) => {
                const pct = c.goalINR > 0 ? Math.min(100, Math.round(((c.raisedINR || 0) / c.goalINR) * 100)) : 0;
                const isPending = c.status === 'pending_approval' || c.status === 'pending';

                return (
                  <View
                    key={c.id}
                    style={[
                      styles.campaignCard,
                      { backgroundColor: colors.cardBg, borderColor: colors.border }
                    ]}
                  >
                    {/* Cover Image */}
                    <View style={styles.coverWrap}>
                      <Image
                        source={{
                          uri: c.mainImage || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
                        }}
                        style={styles.cardCoverImg}
                        resizeMode="cover"
                      />
                      {/* Badges Overlay */}
                      <View style={styles.badgeOverlay}>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.categoryBadgeText}>
                            {translateCategory(c.category, lang)}
                          </Text>
                        </View>

                        {isPending && (
                          <View style={[styles.statusTag, { backgroundColor: colors.warning }]}>
                            <Clock color="#fff" size={11} />
                            <Text style={styles.statusTagText}>
                              {translateStatus('pending', lang)}
                            </Text>
                          </View>
                        )}

                        {c.isUrgent && (
                          <View style={[styles.statusTag, { backgroundColor: colors.danger }]}>
                            <Flame color="#fff" size={11} />
                            <Text style={styles.statusTagText}>
                              {translateCategory('Urgent', lang)}
                            </Text>
                          </View>
                        )}

                        {c.isZakatEligible && (
                          <View style={[styles.statusTag, { backgroundColor: '#8b5cf6' }]}>
                            <Zap color="#fff" size={11} />
                            <Text style={styles.statusTagText}>
                              {translateCategory('Zakat', lang)}
                            </Text>
                          </View>
                        )}

                        {c.isSadqaEligible && (
                          <View style={[styles.statusTag, { backgroundColor: '#0d9488' }]}>
                            <Heart color="#fff" size={11} />
                            <Text style={styles.statusTagText}>
                              {translateCategory('Sadqa', lang)}
                            </Text>
                          </View>
                        )}

                        {c.isFitrahEligible && (
                          <View style={[styles.statusTag, { backgroundColor: '#d97706' }]}>
                            <Sparkles color="#fff" size={11} />
                            <Text style={styles.statusTagText}>
                              {translateCategory('Fitra', lang)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Card Content */}
                    <View style={styles.cardContent}>
                      <View style={styles.metaTopRow}>
                        <Text style={[styles.communityMetaText, { color: colors.textSecondary }]}>
                          {translateCommunityName(c.communityName || 'Bareilly Central', lang)} {c.city ? `• ${translateCity(c.city, lang)}` : ''}
                        </Text>
                        <Text style={[styles.daysLeftText, { color: colors.textSecondary }]}>
                          {c.daysLeft || 30} {t('campaigns.days_left', 'days left')}
                        </Text>
                      </View>

                      <DynamicText
                        text={c.title}
                        lang={lang}
                        fallback={translateCampaignTitle(c.title, lang)}
                        style={[styles.campaignTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      />

                      {c.beneficiaryName ? (
                        <Text style={[styles.beneficiaryText, { color: colors.textSecondary }]}>
                          {t('campaign_details.beneficiary', 'Beneficiary')}:{' '}
                          <DynamicText
                            text={c.beneficiaryName}
                            lang={lang}
                            style={{ fontWeight: '700', color: colors.textPrimary }}
                          />
                          {c.beneficiaryRelation ? ` (${translateRole(c.beneficiaryRelation, lang)})` : ''}
                        </Text>
                      ) : null}

                      {/* Progress bar */}
                      <View style={styles.progressBlock}>
                        <View style={styles.progressInfoRow}>
                          <Text style={[styles.raisedText, { color: colors.primary }]}>
                            ₹{(c.raisedINR || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.goalText, { color: colors.textSecondary }]}>
                            {t('campaign_details.goal', 'Goal')}: ₹{c.goalINR.toLocaleString('en-IN')} ({pct}%)
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: colors.cardBgAlt }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                        </View>
                      </View>

                      {/* Documents / Estimate indicators */}
                      {c.documents && c.documents.length > 0 && (
                        <View style={[styles.docNotice, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}>
                          <FileText color={colors.primary} size={14} />
                          <Text style={[styles.docNoticeText, { color: colors.textSecondary }]}>
                            {c.documents.length} {t('campaign_details.verified_docs', 'verified estimate/document(s) attached')}
                          </Text>
                        </View>
                      )}

                      {/* Action Buttons Row */}
                      <View style={[styles.cardActionsRow, { borderTopColor: colors.border }]}>
                        {isAdmin && isPending && (
                          <>
                            <TouchableOpacity
                              onPress={() => handleAction(c.id, true)}
                              disabled={processingId === c.id}
                              style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                            >
                              <Check color={colors.primary} size={14} />
                              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                                {t('btn.approve', 'Approve')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleAction(c.id, false)}
                              disabled={processingId === c.id}
                              style={[styles.actionBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}
                            >
                              <X color={colors.danger} size={14} />
                              <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                                {t('btn.reject', 'Reject')}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity
                          onPress={() => handleOpenEdit(c)}
                          style={[styles.actionBtn, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}
                        >
                          <Edit3 color={colors.textSecondary} size={14} />
                          <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                            {t('admin.update_campaign', 'Edit')}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setDeleteConfirmItem(c)}
                          style={[styles.actionBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}
                        >
                          <Trash2 color={colors.danger} size={14} />
                          <Text style={[styles.actionBtnText, { color: colors.danger }]}>
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
        <ScrollView contentContainerStyle={styles.formPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Campaign Title */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.campaign_title', 'Campaign Title *')}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('admin.campaign_title_placeholder', 'e.g. Urgent Dialysis & Kidney Treatment Support')}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Chips */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.campaign_category')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryChip,
                      isSelected
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.cardBgAlt, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.categoryChipText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {translateCategory(cat, lang)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Community Dropdown ── */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.tabCommunityHub', 'Community *')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCommunityDropdown(!showCommunityDropdown)}
              style={[
                styles.dropdownTrigger,
                { backgroundColor: colors.inputBg, borderColor: colors.border }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                <Building2 color={colors.primary} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownSelectedText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {selectedCommunity ? translateCommunityName(selectedCommunity.name, lang) : t('admin.select_community', 'Select Community')}
                  </Text>
                  {selectedCommunity?.city ? (
                    <Text style={[styles.dropdownSelectedSub, { color: colors.textSecondary }]}>
                      {translateCity(selectedCommunity.city, lang)} {selectedCommunity.state ? `, ${translateState(selectedCommunity.state, lang)}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
              {showCommunityDropdown ? (
                <ChevronUp color={colors.textSecondary} size={18} />
              ) : (
                <ChevronDown color={colors.textSecondary} size={18} />
              )}
            </TouchableOpacity>

            {/* Dropdown Menu Items */}
            {showCommunityDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {communities.map((comm) => {
                  const isSelected = selectedCommunityId === comm.id;
                  return (
                    <TouchableOpacity
                      key={comm.id}
                      onPress={() => {
                        setSelectedCommunityId(comm.id);
                        setShowCommunityDropdown(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: colors.primaryLight }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            { color: isSelected ? colors.primary : colors.textPrimary }
                          ]}
                        >
                          {translateCommunityName(comm.name, lang)}
                        </Text>
                        <Text style={[styles.dropdownItemSub, { color: colors.textSecondary }]}>
                          {translateCity(comm.city, lang)} {comm.state ? `• ${translateState(comm.state, lang)}` : ''}
                        </Text>
                      </View>
                      {isSelected && <Check color={colors.primary} size={16} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Goal Amount */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.campaign_goal', 'Goal Amount (₹) *')}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. 250000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={goalINR}
              onChangeText={setGoalINR}
            />
          </View>

          {/* Beneficiary Name */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.beneficiary_name', 'Beneficiary Name')}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('admin.beneficiary_name_placeholder', 'e.g. Mohd Rashid')}
              placeholderTextColor={colors.textMuted}
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
            />
          </View>

          {/* Beneficiary Relation */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.beneficiary_relation', 'Relation')}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('admin.beneficiary_relation_placeholder', 'e.g. Self / Father')}
              placeholderTextColor={colors.textMuted}
              value={beneficiaryRelation}
              onChangeText={setBeneficiaryRelation}
            />
          </View>

          {/* Days Left */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.campaign_duration', 'Campaign Duration (Days)')}
            </Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="e.g. 30"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={daysLeft}
              onChangeText={setDaysLeft}
            />
          </View>

          {/* Full Story / Description */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              {t('admin.campaign_story', 'Full Story / Situation Details *')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }
              ]}
              placeholder={t('admin.campaign_story_placeholder', 'Describe the medical situation, hospital diagnosis, family condition, and required aid...')}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              value={story}
              onChangeText={setStory}
            />
          </View>

          {/* ── MAIN CAMPAIGN COVER & GALLERY PHOTOS (MULTIPLE CAMERA & GALLERY) ── */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelWithActionRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t('admin.cover_photo_title', 'Campaign Main Cover & Photos')} ({coverImages.length})
              </Text>
              <TouchableOpacity
                onPress={() => setPickerTarget('mainImage')}
                style={[styles.addInlineBtn, { backgroundColor: colors.primaryLight }]}
                activeOpacity={0.7}
              >
                <Plus color={colors.primary} size={14} />
                <Text style={[styles.addInlineBtnText, { color: colors.primary }]}>
                  {t('admin.add_photo', 'Add / Snap')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Photo Upload Area Dropzone */}
            <TouchableOpacity
              onPress={() => setPickerTarget('mainImage')}
              style={[
                styles.docUploadDropzone,
                {
                  backgroundColor: coverImages.length > 0 ? colors.primaryLight : colors.cardBgAlt,
                  borderColor: coverImages.length > 0 ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
                <Camera color={colors.primary} size={20} />
              </View>
              <Text style={[styles.docDropzoneTitle, { color: coverImages.length > 0 ? colors.primary : colors.textPrimary }]}>
                {coverImages.length > 0
                  ? `✓ ${coverImages.length} ${t('admin.photos_attached', 'Photo(s) Selected')}`
                  : t('admin.upload_cover_photo', 'Upload Campaign Main Image')}
              </Text>
              <Text style={[styles.docDropzoneSub, { color: colors.textSecondary }]}>
                {t('admin.upload_cover_photo_sub', 'Take photo or choose from gallery (JPG, PNG)')}
              </Text>
            </TouchableOpacity>

            {/* Attached Photos List with Thumbnails */}
            {coverImages.length > 0 && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {coverImages.map((img, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.attachedDocCard,
                      { backgroundColor: colors.cardBg, borderColor: idx === 0 ? colors.primary : colors.border },
                    ]}
                  >
                    <Image source={{ uri: img.url }} style={styles.attachedDocThumbnail} resizeMode="cover" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.docListTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {img.title}
                        </Text>
                        {idx === 0 && (
                          <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>
                              ★ {t('admin.cover_badge', 'Cover')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.docListSub, { color: colors.textSecondary }]}>
                        {idx === 0 ? t('admin.cover_photo_ready', 'Cover photo ready') : (img.size || `Gallery Photo #${idx + 1}`)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setCoverImages(prev => prev.filter((_, i) => i !== idx))}
                      style={[styles.docRemoveBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}
                    >
                      <Trash2 color={colors.danger} size={15} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── ATTACH MEDICAL ESTIMATES / DOCUMENTS (MULTIPLE CAMERA & GALLERY) ── */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelWithActionRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {t('admin.attach_docs_title', 'Attach Medical Estimates / Documents')} ({documents.length})
              </Text>
              <TouchableOpacity
                onPress={() => setPickerTarget('medicalDocuments')}
                style={[styles.addInlineBtn, { backgroundColor: colors.primaryLight }]}
                activeOpacity={0.7}
              >
                <Plus color={colors.primary} size={14} />
                <Text style={[styles.addInlineBtnText, { color: colors.primary }]}>
                  {t('admin.add_scan', 'Add / Scan')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document Upload Area Button */}
            <TouchableOpacity
              onPress={() => setPickerTarget('medicalDocuments')}
              style={[
                styles.docUploadDropzone,
                {
                  backgroundColor: documents.length > 0 ? colors.primaryLight : colors.cardBgAlt,
                  borderColor: documents.length > 0 ? colors.primary : colors.border
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
                <FileText color={colors.primary} size={20} />
              </View>
              <Text style={[styles.docDropzoneTitle, { color: documents.length > 0 ? colors.primary : colors.textPrimary }]}>
                {documents.length > 0
                  ? `✓ ${documents.length} ${t('admin.docs_attached', 'Medical Document(s) Attached')}`
                  : t('admin.upload_docs_placeholder', 'Upload Hospital Estimates, Bills or Prescription Reports')}
              </Text>
              <Text style={[styles.docDropzoneSub, { color: colors.textSecondary }]}>
                {t('admin.upload_docs_sub', 'Camera scan or select multiple files/photos from gallery')}
              </Text>
            </TouchableOpacity>

            {/* Attached Documents List with Thumbnails */}
            {documents.length > 0 && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {documents.map((doc, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.attachedDocCard,
                      { backgroundColor: colors.cardBg, borderColor: colors.border }
                    ]}
                  >
                    <Image source={{ uri: doc.url }} style={styles.attachedDocThumbnail} resizeMode="cover" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.docListTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text style={[styles.docListSub, { color: colors.textSecondary }]}>
                        {doc.size || 'Attached File'} • {doc.verifiedBy}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                      style={[styles.docRemoveBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}
                    >
                      <Trash2 color={colors.danger} size={15} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Eligibility & Priority Switches Box */}
          <View style={[styles.switchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Zakat Eligible */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                  {lang === 'hi' ? 'ज़कात पात्र' : lang === 'ur' ? 'زکوٰۃ کے اہل' : t('admin.zakat_eligible', 'Zakat Eligible')}
                </Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  {lang === 'hi' ? 'ज़कात नियमों के अनुरूप (Shariah compliance)' : lang === 'ur' ? 'شرعی زکوٰۃ کے شرائط پر پورا اترتا ہے' : t('admin.zakat_eligible_desc', 'Meets Shariah Zakat compliance rules')}
                </Text>
              </View>
              <Switch
                value={isZakatEligible}
                onValueChange={setIsZakatEligible}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>

            {/* Sadqa Eligible */}
            <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 10 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                  {lang === 'hi' ? 'सदका पात्र' : lang === 'ur' ? 'صدقہ کے اہل' : t('admin.sadqa_eligible', 'Sadqa Eligible')}
                </Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  {lang === 'hi' ? 'सामान्य सदका व खैरात स्वीकार्य' : lang === 'ur' ? 'عام صدقہ اور خیرات کے لیے درست' : t('admin.sadqa_eligible_desc', 'Accepts general Sadaqah & voluntary charity')}
                </Text>
              </View>
              <Switch
                value={isSadqaEligible}
                onValueChange={setIsSadqaEligible}
                trackColor={{ true: '#0d9488', false: colors.border }}
              />
            </View>

            {/* Fitrah Eligible */}
            <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 10 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                  {lang === 'hi' ? 'फ़ितरा पात्र' : lang === 'ur' ? 'فطرہ کے اہل' : t('admin.fitrah_eligible', 'Fitrah Eligible')}
                </Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  {lang === 'hi' ? 'ईद-उल-फ़ित्र फ़ितरा व फ़िद्या पात्र' : lang === 'ur' ? 'صدقۃ الفطر اور فدیہ کے مستحقین کے لیے' : t('admin.fitrah_eligible_desc', 'Eligible for Fitrah & Fidya contributions')}
                </Text>
              </View>
              <Switch
                value={isFitrahEligible}
                onValueChange={setIsFitrahEligible}
                trackColor={{ true: '#d97706', false: colors.border }}
              />
            </View>

            {/* Urgent Priority */}
            <View style={[styles.switchRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 10 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                  {lang === 'hi' ? 'अति आवश्यक (इमरजेंसी)' : lang === 'ur' ? 'انتہائی ہنگامی (ارجنٹ)' : t('admin.urgent_appeal', 'Urgent Priority')}
                </Text>
                <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                  {lang === 'hi' ? 'अस्पताल / जीवन रक्षा हेतु तत्काल' : lang === 'ur' ? 'ہسپتال / جان بچانے کے لیے فوری' : t('admin.urgent_appeal_desc', 'Immediate hospital / critical life threat')}
                </Text>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ true: colors.danger, false: colors.border }}
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.formActionsRow}>
            <TouchableOpacity
              onPress={() => setActiveSubTab('list')}
              style={[styles.cancelFormBtn, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}
            >
              <Text style={[styles.cancelFormBtnText, { color: colors.textSecondary }]}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={submitting}
              style={[
                styles.submitFormBtn,
                { backgroundColor: colors.primary },
                submitting && { opacity: 0.7 }
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text style={styles.submitFormBtnText}>
                    {editingCampaignId ? t('admin.update_campaign', 'Update Campaign') : t('admin.publish_campaign', 'Publish Campaign')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── PROFESSIONAL DELETE CONFIRMATION MODAL ── */}
      <Modal
        visible={!!deleteConfirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.modalWarnIconCircle, { backgroundColor: colors.dangerLight }]}>
              <AlertTriangle color={colors.danger} size={28} />
            </View>

            <Text style={[styles.modalHeading, { color: colors.textPrimary }]}>
              {t('admin.delete_campaign_title', 'Delete Campaign?')}
            </Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              {t('admin.delete_campaign_desc', 'This action cannot be undone. Are you sure you want to permanently delete this campaign?')}
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setDeleteConfirmItem(null)}
                disabled={processingId === deleteConfirmItem?.id}
                style={[styles.modalCancelBtn, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textPrimary }]}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={processingId === deleteConfirmItem?.id}
                style={[styles.modalDeleteBtn, { backgroundColor: colors.danger }]}
              >
                {processingId === deleteConfirmItem?.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteBtnText}>
                    {t('btn.reject', 'Yes, Delete')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MOBILE MEDIA PICKER SHEET MODAL (CAMERA VS GALLERY) ── */}
      {pickerTarget !== null && (
        <Modal
          visible={pickerTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerTarget(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPickerTarget(null)}
          >
            <View style={[styles.modalSheet, { backgroundColor: colors.cardBg }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {pickerTarget === 'mainImage'
                    ? t('admin.cover_photo_title', 'Campaign Main Cover & Photos')
                    : t('admin.attach_docs_title', 'Attach Medical Estimates / Documents')}
                </Text>
                <TouchableOpacity onPress={() => setPickerTarget(null)} style={[styles.closeBtn, { backgroundColor: colors.cardBgAlt }]}>
                  <X color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerOptionsRow}>
                <TouchableOpacity
                  style={[styles.pickerOptionCard, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}
                  onPress={() => handlePickMedia('camera')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
                    <Camera color={colors.primary} size={24} />
                  </View>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {t('admin.camera_option', 'Use Camera')}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                    {pickerTarget === 'mainImage' ? t('admin.camera_cover_sub', 'Snap photo with camera') : t('admin.camera_doc_sub', 'Scan document / receipt')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerOptionCard, { backgroundColor: colors.cardBgAlt, borderColor: colors.border }]}
                  onPress={() => handlePickMedia('gallery')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}>
                    <ImageIcon color="#2563eb" size={24} />
                  </View>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {t('admin.gallery_option', 'From Gallery')}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                    {pickerTarget === 'mainImage' ? t('admin.gallery_doc_sub', 'Pick single or multiple photos') : t('admin.gallery_doc_sub', 'Pick multiple images/docs')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setPickerTarget(null)}
                style={[styles.cancelBtn, { backgroundColor: colors.cardBgAlt }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  topHeaderSub: {
    fontSize: 11,
    marginTop: 2,
  },
  createHeaderBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createHeaderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listPad: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  campaignCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  coverWrap: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  cardCoverImg: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 14,
  },
  metaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  communityMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: '700',
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  beneficiaryText: {
    fontSize: 12,
    marginBottom: 10,
  },
  progressBlock: {
    marginVertical: 6,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  raisedText: {
    fontSize: 14,
    fontWeight: '800',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 7,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 7,
  },
  docNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  docNoticeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formPad: {
    padding: 16,
    paddingBottom: 100,
  },
  formHeaderRow: {
    marginBottom: 16,
  },
  backToBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  backToBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formMainHeading: {
    fontSize: 20,
    fontWeight: '800',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownSelectedSub: {
    fontSize: 11,
    marginTop: 1,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  textArea: {
    height: 100,
  },
  twoColRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachedImageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  attachedImageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  attachedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  attachedDocThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  docUploadDropzone: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  docDropzoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  docDropzoneSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  docListTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  docListSub: {
    fontSize: 11,
    marginTop: 2,
  },
  docRemoveBtn: {
    padding: 6,
  },
  switchContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelFormBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitFormBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitFormBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Delete Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalWarnIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Mobile Media Picker Bottom Sheet
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  docChangeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
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
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderWidth: 1,
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
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
