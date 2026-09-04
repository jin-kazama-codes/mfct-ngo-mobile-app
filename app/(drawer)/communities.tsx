import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, StyleSheet, Modal
} from 'react-native';
import {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity
} from '../../src/services/communityService';
import { getUsers, updateUser } from '../../src/services/userService';
import { Community, User } from '../../src/types';
import {
  Building2, Users, TrendingUp, PlusCircle, Trash2, CheckCircle2,
  ShieldCheck, Calendar, Edit3, ArrowLeft, Upload, RefreshCw, X,
  AlertCircle, Sparkles, Check, ChevronDown, ChevronUp, UserCheck, Camera,
  MapPin, Flame, FileText
} from 'lucide-react-native';
import { CommunityCardSkeleton } from '../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLanguageCode,
  translateRole,
} from '../../src/lib/translateEntity';
import { useDynamicTranslatedText } from '../../src/lib/autoTranslate';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── CommunityCardItem ──────────────────────────────────────────────────
// Extracted as its own component so hooks (useDynamicTranslatedText) can be
// called at the component top-level — never inside a .map() callback.
interface CommunityCardItemProps {
  community: Community;
  lang: ReturnType<typeof getLanguageCode>;
  theme: any;
  isDark: boolean;
  tr: (hi: string, ur: string, en: string) => string;
  onEdit: (c: Community) => void;
  onDelete: (id: string) => void;
}

function CommunityCardItem({
  community: c,
  lang,
  theme,
  isDark,
  tr,
  onEdit,
  onDelete,
}: CommunityCardItemProps) {
  const [expandedDesc, setExpandedDesc] = useState(false);

  const translatedName = useDynamicTranslatedText(c.name, lang);
  const translatedCity = useDynamicTranslatedText(c.city, lang);
  const translatedState = useDynamicTranslatedText(c.state, lang);
  const translatedAdminName = useDynamicTranslatedText(c.adminName, lang);
  const translatedDesc = useDynamicTranslatedText(c.description, lang);
  const translatedRole = translateRole(c.adminRoleTitle || 'community admin', lang);

  const healthPct = Math.min(100, c.healthScore ?? 80);
  const healthColor = healthPct >= 80 ? '#10b981' : healthPct >= 50 ? '#f59e0b' : '#ef4444';
  const isPending = c.verifiedStatus === 'Pending';
  const isFlagged = c.verifiedStatus === 'Flagged';

  const descContent = translatedDesc || c.description || '';

  return (
    <View
      style={[
        s.card,
        { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }
      ]}
    >
      {/* Cover image with Est Year Overlay Badge */}
      {c.coverImage ? (
        <View style={s.cardCoverContainer}>
          <Image source={{ uri: c.coverImage }} style={s.coverImg} resizeMode="cover" />
          <View style={s.coverBadgeOverlay}>
            <View style={s.statPill}>
              <Calendar color="#fff" size={11} />
              <Text style={s.statPillText}>
                {tr('स्थापना', 'قیام', 'Est.')} {c.establishedYear || 2024}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={s.cardBody}>
        {/* Header row: Avatar, Title, Location & Status Badge */}
        <View style={s.headerRow}>
          <Image
            source={{
              uri:
                c.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=059669&color=fff`
            }}
            style={s.avatar}
          />
          <View style={s.flex1}>
            <Text style={[s.cardTitle, { color: theme.textMain }]} numberOfLines={1}>
              {translatedName || c.name}
            </Text>
            <View style={s.locationRow}>
              <MapPin color={theme.textSub} size={12} />
              <Text style={[s.cardMeta, { color: theme.textSub }]} numberOfLines={1}>
                {translatedCity || c.city}{translatedState || c.state ? `, ${translatedState || c.state}` : ''}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              s.verifiedBadge,
              isPending
                ? { backgroundColor: theme.warningLight, borderColor: theme.warning }
                : isFlagged
                  ? { backgroundColor: theme.dangerLight, borderColor: theme.danger }
                  : { backgroundColor: theme.primaryLight, borderColor: theme.primary }
            ]}
          >
            <ShieldCheck
              color={isPending ? theme.warning : isFlagged ? theme.danger : theme.primary}
              size={11}
            />
            <Text
              style={[
                s.verifiedText,
                { color: isPending ? theme.warning : isFlagged ? theme.danger : theme.primary }
              ]}
            >
              {c.verifiedStatus === 'Verified'
                ? tr('सत्यापित', 'تصدیق شدہ', 'Verified')
                : c.verifiedStatus === 'Pending'
                  ? tr('लंबित', 'زیر التواء', 'Pending')
                  : tr('चिह्नित', 'نشان زدہ', 'Flagged')}
            </Text>
          </View>
        </View>

        {/* Admin Info Badge */}
        <View style={[s.adminBadgeRow, { backgroundColor: isDark ? '#131d2e' : '#f1f5f9' }]}>
          <UserCheck color={theme.primary} size={14} />
          <Text style={[s.adminTextNew, { color: theme.textSub }]} numberOfLines={1}>
            <Text style={{ fontWeight: '700', color: theme.textMain }}>
              {tr('व्यवस्थापक: ', 'ایڈمن: ', 'Admin: ')}
            </Text>
            {translatedAdminName || c.adminName}
            <Text style={{ color: theme.primary, fontWeight: '600' }}> • {translatedRole}</Text>
          </Text>
        </View>

        {/* Description / Mission Statement (All Data) */}
        {descContent ? (
          <View style={[s.descContainer, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
            <View style={s.descHeader}>
              <FileText color={theme.primary} size={13} />
              <Text style={[s.descHeading, { color: theme.textSub }]}>
                {tr('विवरण एवं उद्देश्य', 'تفصیل اور مقصد', 'About & Mission')}
              </Text>
            </View>
            <Text
              style={[s.descText, { color: theme.textMain }]}
              numberOfLines={expandedDesc ? undefined : 2}
            >
              {descContent}
            </Text>
            {descContent.length > 80 && (
              <TouchableOpacity
                onPress={() => setExpandedDesc(!expandedDesc)}
                style={s.descToggleBtn}
              >
                <Text style={[s.descToggleText, { color: theme.primary }]}>
                  {expandedDesc
                    ? tr('कम दिखाएं ▲', 'کم دکھائیں ▲', 'Show Less ▲')
                    : tr('और पढ़ें ▼', 'مزید پڑھیں ▼', 'Read More ▼')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Comprehensive 4-Metric Grid */}
        <View style={s.gridStatsContainer}>
          {/* Members */}
          <View style={[s.gridStatBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
            <Users color="#0284c7" size={15} />
            <View style={{ flex: 1 }}>
              <Text style={[s.gridStatVal, { color: theme.textMain }]}>
                {c.totalMembers ? c.totalMembers.toLocaleString() : 0}
              </Text>
              <Text style={[s.gridStatLbl, { color: theme.textSub }]}>
                {tr('कुल सदस्य', 'کل ممبران', 'Members')}
              </Text>
            </View>
          </View>

          {/* Funds Raised */}
          <View style={[s.gridStatBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
            <TrendingUp color="#10b981" size={15} />
            <View style={{ flex: 1 }}>
              <Text style={[s.gridStatVal, { color: theme.textMain }]}>
                ₹{c.totalRaisedINR ? (c.totalRaisedINR >= 100000 ? `${(c.totalRaisedINR / 100000).toFixed(1)}L` : c.totalRaisedINR.toLocaleString()) : 0}
              </Text>
              <Text style={[s.gridStatLbl, { color: theme.textSub }]}>
                {tr('एकत्रित राशि', 'جمع رقم', 'Raised')}
              </Text>
            </View>
          </View>

          {/* Active Campaigns */}
          <View style={[s.gridStatBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
            <Flame color="#f59e0b" size={15} />
            <View style={{ flex: 1 }}>
              <Text style={[s.gridStatVal, { color: theme.textMain }]}>
                {c.activeCampaigns ?? 0}
              </Text>
              <Text style={[s.gridStatLbl, { color: theme.textSub }]}>
                {tr('सक्रिय अभियान', 'فعال مہمات', 'Campaigns')}
              </Text>
            </View>
          </View>

          {/* Established Year */}
          <View style={[s.gridStatBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
            <Calendar color="#8b5cf6" size={15} />
            <View style={{ flex: 1 }}>
              <Text style={[s.gridStatVal, { color: theme.textMain }]}>
                {c.establishedYear || 2024}
              </Text>
              <Text style={[s.gridStatLbl, { color: theme.textSub }]}>
                {tr('स्थापना वर्ष', 'سال قیام', 'Est. Year')}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Score Progress */}
        <View style={s.healthSection}>
          <View style={s.healthLabelRow}>
            <Text style={[s.healthLabel, { color: theme.textSub }]}>
              {tr('स्वास्थ्य स्कोर एवं गुणवत्ता', 'ہیلتھ سکور اور معیار', 'Community Health Score')}
            </Text>
            <Text style={[s.healthPct, { color: healthColor }]}>{healthPct}%</Text>
          </View>
          <View style={[s.healthTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View style={[s.healthFill, { width: `${healthPct}%`, backgroundColor: healthColor }]} />
          </View>
        </View>

        {/* Action buttons: Edit & Delete */}
        <View style={[s.cardActionsRow, { borderTopColor: theme.cardBorder }]}>
          <TouchableOpacity
            onPress={() => onEdit(c)}
            style={[s.actionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}
          >
            <Edit3 color="#0284c7" size={14} />
            <Text style={[s.actionBtnText, { color: '#0284c7' }]}>
              {tr('संपादित करें', 'ترمیم', 'Edit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(c.id)}
            style={[s.actionBtn, { backgroundColor: theme.dangerLight }]}
          >
            <Trash2 color={theme.danger} size={14} />
            <Text style={[s.actionBtnText, { color: theme.danger }]}>
              {tr('हटाएं', 'حذف کریں', 'Delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CommunitiesAdminScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit mode tracking
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Admin dropdown modal state
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form states matching website Communities.tsx
  const [formData, setFormData] = useState<{
    name: string;
    city: string;
    state: string;
    establishedYear: string;
    adminId: string;
    adminName: string;
    adminRoleTitle: string;
    healthScore: string;
    verifiedStatus: 'Verified' | 'Pending' | 'Flagged';
    coverImage: string;
    coverImageFileName: string;
    description: string;
    avatar: string;
    avatarFileName: string;
  }>({
    name: '',
    city: '',
    state: 'UP',
    establishedYear: new Date().getFullYear().toString(),
    adminId: '',
    adminName: '',
    adminRoleTitle: 'community admin',
    healthScore: '100',
    verifiedStatus: 'Verified',
    coverImage: '',
    coverImageFileName: '',
    description: '',
    avatar: '',
    avatarFileName: '',
  });

  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [showAvatarUrlFallback, setShowAvatarUrlFallback] = useState(false);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [commsData, usersData] = await Promise.all([
        getCommunities(),
        getUsers()
      ]);
      setCommunities(commsData);
      setAvailableUsers(usersData);
    } catch (err) {
      console.error('Error loading communities:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Create Mode
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      city: '',
      state: 'UP',
      establishedYear: new Date().getFullYear().toString(),
      adminId: '',
      adminName: '',
      adminRoleTitle: 'community admin',
      healthScore: '100',
      verifiedStatus: 'Verified',
      coverImage: '',
      coverImageFileName: '',
      description: '',
      avatar: '',
      avatarFileName: '',
    });
    setShowUrlFallback(false);
    setShowAvatarUrlFallback(false);
    setShowAdminDropdown(false);
    setActiveSubTab('create');
  };

  // Open Edit Mode
  const handleOpenEdit = (comm: Community) => {
    setEditingId(comm.id);
    const matchedUser = availableUsers.find(u => u.name === comm.adminName || u.communityId === comm.id);
    setFormData({
      name: comm.name || '',
      city: comm.city || '',
      state: comm.state || 'UP',
      establishedYear: (comm.establishedYear || 2024).toString(),
      adminId: matchedUser?.id || '',
      adminName: comm.adminName || '',
      adminRoleTitle: comm.adminRoleTitle || 'community admin',
      healthScore: (comm.healthScore ?? 100).toString(),
      verifiedStatus: comm.verifiedStatus || 'Verified',
      coverImage: comm.coverImage || '',
      coverImageFileName: comm.coverImage ? 'community_cover.jpg' : '',
      description: comm.description || '',
      avatar: comm.avatar || '',
      avatarFileName: comm.avatar ? 'community_avatar.jpg' : '',
    });
    setShowUrlFallback(false);
    setShowAvatarUrlFallback(false);
    setShowAdminDropdown(false);
    setActiveSubTab('create');
  };

  // Pick Avatar / Logo from Phone Gallery
  const handlePickAvatarImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(
          tr(
            'कृपया अवतार लोगो चुनने के लिए गैलरी एक्सेस की अनुमति दें।',
            'براہ کرم اوتار لوگو منتخب کرنے کے لیے گیلری تک رسائی کی اجازت دیں۔',
            'Please allow gallery access to select avatar logo.'
          ),
          'error'
        );
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
        setFormData(prev => ({
          ...prev,
          avatar: asset.uri,
          avatarFileName: asset.fileName || `avatar_${Date.now()}.jpg`
        }));
        showToast(
          tr('अवतार / लोगो चुना गया', 'اوتار / لوگو منتخب کیا گیا', 'Avatar / logo selected from device'),
          'info'
        );
      }
    } catch (err) {
      console.warn('Avatar picker fallback:', err);
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'C')}&background=059669&color=fff`;
      setFormData(prev => ({
        ...prev,
        avatar: defaultAvatar,
        avatarFileName: 'avatar_default.jpg'
      }));
      showToast(tr('अवतार संलग्न किया गया', 'اوتار منسلک کیا گیا', 'Avatar attached'), 'info');
    }
  };

  // Pick Cover Photo from Phone Gallery
  const handlePickCoverImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(
          tr(
            'कृपया कवर फोटो चुनने के लिए गैलरी एक्सेस की अनुमति दें।',
            'براہ کرم کور تصویر منتخب کرنے کے لیے گیلری تک رسائی کی اجازت دیں۔',
            'Please allow gallery access to select cover photo.'
          ),
          'error'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({
          ...prev,
          coverImage: asset.uri,
          coverImageFileName: asset.fileName || `cover_${Date.now()}.jpg`
        }));
        showToast(
          tr('कवर फोटो डिवाइस से चुनी गई', 'کور تصویر منتخب کی گئی', 'Cover photo selected from device'),
          'info'
        );
      }
    } catch (err) {
      console.warn('Image picker fallback:', err);
      const samplePhotos = [
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80',
      ];
      const chosen = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
      setFormData(prev => ({
        ...prev,
        coverImage: chosen,
        coverImageFileName: 'sample_cover.jpg'
      }));
      showToast(tr('कवर फोटो संलग्न की गई', 'کور تصویر منسلک کی گئی', 'Sample cover photo attached'), 'info');
    }
  };

  // Select Admin User from Dropdown
  const handleSelectAdmin = (user: User) => {
    setFormData(prev => ({
      ...prev,
      adminId: user.id,
      adminName: user.name,
      adminRoleTitle: 'community admin'
    }));
    setShowAdminDropdown(false);
  };

  // Handle Save (Create or Update)
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast(tr('कृपया समुदाय का नाम दर्ज करें।', 'براہ کرم کمیونٹی کا نام درج کریں۔', 'Please enter Community Name.'), 'error');
      return;
    }
    if (!formData.city.trim()) {
      showToast(tr('कृपया शहर दर्ज करें।', 'براہ کرم شہر درج کریں۔', 'Please enter City.'), 'error');
      return;
    }
    if (!formData.state.trim()) {
      showToast(tr('कृपया राज्य दर्ज करें।', 'براہ کرم ریاست درج کریں۔', 'Please enter State.'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const defaultCover = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80';
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'C')}&background=059669&color=fff`;

      const communityPayload: Partial<Community> = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || 'UP',
        establishedYear: Number(formData.establishedYear) || new Date().getFullYear(),
        adminName: formData.adminName.trim() || 'Community Administrator',
        adminRoleTitle: formData.adminRoleTitle || 'community admin',
        healthScore: Number(formData.healthScore) || 100,
        verifiedStatus: formData.verifiedStatus,
        coverImage: formData.coverImage.trim() || defaultCover,
        description: formData.description.trim(),
        avatar: formData.avatar || defaultAvatar,
      };

      let savedCommunity: Community;

      if (editingId) {
        // Update community
        savedCommunity = await updateCommunity(editingId, communityPayload);
        showToast(
          tr('समुदाय सफलतापूर्वक अपडेट किया गया!', 'کمیونٹی کامیابی سے اپ ڈیٹ ہو گئی!', 'Community updated successfully!'),
          'success'
        );
      } else {
        // Create community
        savedCommunity = await createCommunity({
          ...communityPayload,
          totalMembers: 1,
          activeCampaigns: 0,
          totalRaisedINR: 0,
        } as Omit<Community, 'id'>);
        showToast(
          tr('समुदाय सफलतापूर्वक बनाया गया!', 'کمیونٹی کامیابی سے بنائی گئی!', 'Community created successfully!'),
          'success'
        );
      }

      // Sync Admin User role if selected
      if (formData.adminId) {
        try {
          await updateUser(formData.adminId, {
            role: 'community_admin',
            communityId: savedCommunity.id,
            communityName: savedCommunity.name,
          });
        } catch (uErr) {
          console.warn('Failed to update user role for admin:', uErr);
        }
      }

      setActiveSubTab('list');
      await loadData(false);
    } catch (err: any) {
      console.error('Save community error:', err);
      showToast(
        err?.message || tr('समुदाय सुरक्षित करने में विफल।', 'کمیونٹی محفوظ کرنے میں ناکام۔', 'Failed to save community.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteCommunity(deleteConfirmId);
      setCommunities(prev => prev.filter(c => c.id !== deleteConfirmId));
      showToast(
        tr('समुदाय सफलतापूर्वक हटा दिया गया!', 'کمیونٹی کامیابی سے حذف ہو گئی!', 'Community deleted successfully!'),
        'success'
      );
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Delete community error:', err);
      showToast(
        err?.message || tr('समुदाय हटाने में विफल।', 'کمیونٹی حذف کرنے میں ناکام۔', 'Failed to delete community.'),
        'error'
      );
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
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    danger: '#ef4444',
    dangerLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
    warning: '#f59e0b',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
  };

  const selectedAdminUser = availableUsers.find(u => u.id === formData.adminId);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]} edges={['top']}>
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
          <Building2 color={activeSubTab === 'list' ? '#fff' : theme.textSub} size={15} />
          <Text style={[s.tabBtnText, activeSubTab === 'list' ? s.tabBtnTextActive : { color: theme.textSub }]}>
            {tr('समुदाय', 'کمیونٹیز', 'Communities')} ({communities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'create') {
              handleOpenAdd();
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
            {editingId
              ? tr('समुदाय संपादित करें', 'کمیونٹی میں ترمیم کریں', 'Edit Community')
              : tr('+ नया समुदाय जोड़ें', '+ نئی کمیونٹی شامل کریں', '+ Add Community')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={s.listPad}>
            {[1, 2, 3].map(i => <CommunityCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={s.listPad} showsVerticalScrollIndicator={false}>
            {communities.length === 0 ? (
              <View style={s.empty}>
                <Building2 color={theme.textSub} size={48} />
                <Text style={[s.emptyText, { color: theme.textSub }]}>
                  {tr('कोई समुदाय नहीं मिला', 'کوئی کمیونٹی نہیں ملی', 'No communities found')}
                </Text>
                <TouchableOpacity
                  style={[s.emptyAddBtn, { backgroundColor: theme.primary }]}
                  onPress={handleOpenAdd}
                >
                  <PlusCircle color="#fff" size={16} />
                  <Text style={s.emptyAddBtnText}>
                    {tr('पहला समुदाय जोड़ें', 'پہلی کمیونٹی شامل کریں', 'Add First Community')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              communities.map(c => (
                <CommunityCardItem
                  key={c.id}
                  community={c}
                  lang={lang}
                  theme={theme}
                  isDark={isDark}
                  tr={tr}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteConfirmId}
                />
              ))
            )}
          </ScrollView>
        )
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView contentContainerStyle={s.formPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.formHeaderRow}>
            {editingId && (
              <TouchableOpacity
                onPress={() => {
                  setActiveSubTab('list');
                }}
                style={[s.backIconBtn, { backgroundColor: theme.chipIdle }]}
              >
                <ArrowLeft color={theme.textMain} size={18} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.formTitle, { color: theme.textMain }]}>
                {editingId
                  ? tr('समुदाय संपादित करें', 'کمیونٹی میں ترمیم کریں', 'Edit Community')
                  : tr('नया समुदाय जोड़ें', 'نئی کمیونٹی شامل کریں', 'Add New Community')}
              </Text>
              <Text style={[s.formSubTitle, { color: theme.textSub }]}>
                {editingId
                  ? tr(
                    'समुदाय का विवरण, प्रशासक और मेट्रिक्स अपडेट करें।',
                    'کمیونٹی کی تفصیلات، تفویض کردہ ایڈمن اور میٹرکس اپ ڈیٹ کریں۔',
                    'Update community details, assigned admin, and metrics.'
                  )
                  : tr(
                    'प्लेटफ़ॉर्म पर एक नया क्षेत्रीय समुदाय अध्याय जोड़ें।',
                    'پلیٹ فارم پر ایک نیا علاقائی کمیونٹی چیپٹر شامل کریں۔',
                    'Add a new regional community chapter to the platform.'
                  )}
              </Text>
            </View>
          </View>

          {/* ──────────────── 1. AVATAR / LOGO ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>
              {tr('1. समुदाय का अवतार / लोगो', '1. کمیونٹی اوتار / لوگو', '1. Community Avatar / Logo')}
            </Text>
            <Text style={[s.hintText, { color: theme.textSub }]}>
              {tr(
                'अपनी डिवाइस से इस समुदाय अध्याय के लिए लोगो चुनें या URL दर्ज करें।',
                'اپنے ڈیوائس سے اس کمیونٹی چیپٹر کے لیے لوگو منتخب کریں یا URL درج کریں۔',
                'Select a logo or profile image for this community chapter from your device or enter a URL.'
              )}
            </Text>

            <View style={s.avatarSectionRow}>

              {/* Upload & Actions */}
              <View style={{ flex: 1, gap: 6 }}>
                <TouchableOpacity
                  style={[s.avatarUploadBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                  onPress={handlePickAvatarImage}
                  activeOpacity={0.7}
                >
                  <Upload color={theme.primary} size={15} />
                  <Text style={[s.avatarUploadBtnText, { color: theme.primary }]}>
                    {formData.avatar
                      ? tr('अवतार बदलें', 'اوتار تبدیل کریں', 'Change Avatar')
                      : tr('गैलरी से अवतार चुनें', 'گیلری سے اوتار منتخب کریں', 'Select Avatar from Gallery')}
                  </Text>
                </TouchableOpacity>

                {formData.avatar ? (
                  <View style={s.avatarFileRow}>
                    <Text style={[s.avatarFileNameText, { color: theme.textSub }]} numberOfLines={1}>
                      ✓ {formData.avatarFileName || tr('अवतार संलग्न', 'اوتار منسلک', 'Avatar attached')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setFormData(prev => ({ ...prev, avatar: '', avatarFileName: '' }))}
                      style={s.avatarClearBtn}
                    >
                      <X color="#ef4444" size={14} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Direct Avatar URL Toggle */}
                <TouchableOpacity
                  onPress={() => setShowAvatarUrlFallback(!showAvatarUrlFallback)}
                  style={s.urlToggleBtn}
                >
                  <Text style={[s.urlToggleText, { color: theme.primary }]}>
                    {showAvatarUrlFallback
                      ? tr('▲ डायरेक्ट URL छुपाएं', '▲ براہ راست URL چھپائیں', '▲ Hide Direct URL')
                      : tr('▼ या छवि URL दर्ज करें', '▼ یا تصویری URL درج کریں', '▼ Or enter Image URL')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showAvatarUrlFallback && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={theme.textSub}
                  value={formData.avatar}
                  onChangeText={v => setFormData(prev => ({ ...prev, avatar: v, avatarFileName: 'url_avatar.jpg' }))}
                />
              </View>
            )}
          </View>

          {/* ──────────────── 2. BASIC DETAILS ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>
              {tr('2. मूल विवरण', '2. بنیادی تفصیلات', '2. Basic Details')}
            </Text>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('समुदाय का नाम *', 'کمیونٹی کا نام *', 'Community Name *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                placeholder={tr('उदा. बरेली सेंट्रल केयर सोसाइटी', 'مثال: بریلی سنٹرل کیئر سوسائٹی', 'e.g. Bareilly Central Care Society')}
                placeholderTextColor={theme.textSub}
                value={formData.name}
                onChangeText={v => setFormData(prev => ({ ...prev, name: v }))}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('स्थापना वर्ष *', 'سال قیام *', 'Established Year *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                placeholder={tr('उदा. 2024', 'مثال: 2024', 'e.g. 2024')}
                placeholderTextColor={theme.textSub}
                keyboardType="numeric"
                value={formData.establishedYear}
                onChangeText={v => setFormData(prev => ({ ...prev, establishedYear: v }))}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('शहर / कस्बा *', 'شہر / قصبہ *', 'City *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                placeholder={tr('उदा. बरेली', 'مثال: بریلی', 'e.g. Bareilly')}
                placeholderTextColor={theme.textSub}
                value={formData.city}
                onChangeText={v => setFormData(prev => ({ ...prev, city: v }))}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('राज्य *', 'ریاست *', 'State *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                placeholder={tr('उदा. उत्तर प्रदेश', 'مثال: اتر پردیش', 'e.g. UP')}
                placeholderTextColor={theme.textSub}
                value={formData.state}
                onChangeText={v => setFormData(prev => ({ ...prev, state: v }))}
              />
            </View>
          </View>

          {/* ──────────────── 3. ASSIGN ADMIN ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>
              {tr('3. व्यवस्थापक नियुक्त करें', '3. ایڈمن تفویض کریں', '3. Assign Admin')}
            </Text>
            <Text style={[s.hintText, { color: theme.textSub }]}>
              {tr(
                'समुदाय व्यवस्थापक के रूप में असाइन करने के लिए पंजीकृत उपयोगकर्ता चुनें।',
                'کمیونٹی ایڈمنسٹریٹر کے طور پر تفویض کرنے کے لیے رجسٹرڈ صارف منتخب کریں۔',
                'Select a registered user to assign as the community administrator.'
              )}
            </Text>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('उपयोगकर्ता चुनें (व्यवस्थापक)', 'صارف منتخب کریں (ایڈمن)', 'Select User (Admin)')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAdminDropdown(!showAdminDropdown)}
                style={[
                  s.dropdownTrigger,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                  <UserCheck color={theme.primary} size={18} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dropdownSelectedText, { color: theme.textMain }]} numberOfLines={1}>
                      {selectedAdminUser
                        ? selectedAdminUser.name
                        : formData.adminName || tr('पंजीकृत उपयोगकर्ता चुनें', 'رجسٹرڈ صارف منتخب کریں', 'Select a registered user')}
                    </Text>
                    {selectedAdminUser ? (
                      <Text style={[s.dropdownSelectedSub, { color: theme.textSub }]}>
                        {selectedAdminUser.email || selectedAdminUser.phone}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {showAdminDropdown ? (
                  <ChevronUp color={theme.textSub} size={18} />
                ) : (
                  <ChevronDown color={theme.textSub} size={18} />
                )}
              </TouchableOpacity>

              {/* Admin Dropdown Menu */}
              {showAdminDropdown && (
                <View style={[s.dropdownMenu, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  {availableUsers.length === 0 ? (
                    <Text style={[s.emptyUserNotice, { color: theme.textSub }]}>
                      {tr('कोई पंजीकृत उपयोगकर्ता नहीं मिला', 'کوئی رجسٹرڈ صارف نہیں ملا', 'No registered users found')}
                    </Text>
                  ) : (
                    availableUsers.map(user => {
                      const isSelected = formData.adminId === user.id;
                      return (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => handleSelectAdmin(user)}
                          style={[
                            s.dropdownItem,
                            { borderBottomColor: theme.cardBorder },
                            isSelected && { backgroundColor: theme.primaryLight }
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.dropdownItemTitle,
                                { color: isSelected ? theme.primary : theme.textMain }
                              ]}
                            >
                              {user.name}
                            </Text>
                            <Text style={[s.dropdownItemSub, { color: theme.textSub }]}>
                              {user.email || user.phone} • {user.role}
                            </Text>
                          </View>
                          {isSelected && <Check color={theme.primary} size={16} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('व्यवस्थापक पद शीर्षक', 'ایڈمن کا عہدہ', 'Admin Role Title')}
              </Text>
              <TextInput
                style={[
                  s.input,
                  s.disabledInput,
                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: theme.inputBorder, color: theme.textSub }
                ]}
                value={formData.adminRoleTitle}
                editable={false}
              />
            </View>
          </View>

          {/* ──────────────── 4. METRICS & STATUS ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>
              {tr('4. मेट्रिक्स एवं स्थिति', '4. میٹرکس اور حیثیت', '4. Metrics & Status')}
            </Text>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('स्वास्थ्य स्कोर (0-100)', 'ہیلتھ سکور (0-100)', 'Health Score (0-100)')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                placeholder="100"
                placeholderTextColor={theme.textSub}
                keyboardType="numeric"
                value={formData.healthScore}
                onChangeText={v => setFormData(prev => ({ ...prev, healthScore: v }))}
              />
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('सत्यापन स्थिति', 'تصدیق کی حیثیت', 'Verified Status')}
              </Text>
              <View style={s.chipGroup}>
                {(['Verified', 'Pending', 'Flagged'] as const).map(status => {
                  const isSelected = formData.verifiedStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFormData(prev => ({ ...prev, verifiedStatus: status }))}
                      style={[
                        s.chip,
                        isSelected
                          ? { backgroundColor: theme.primary, borderColor: theme.primary }
                          : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder }
                      ]}
                    >
                      <Text
                        style={[
                          s.chipText,
                          isSelected ? { color: '#fff', fontWeight: '700' } : { color: theme.chipIdleText }
                        ]}
                      >
                        {status === 'Verified'
                          ? tr('सत्यापित', 'تصدیق شدہ', 'Verified')
                          : status === 'Pending'
                            ? tr('लंबित', 'زیر التواء', 'Pending')
                            : tr('चिह्नित', 'نشان زدہ', 'Flagged')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ──────────────── 5. MEDIA & DESCRIPTION ──────────────── */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>
              {tr('5. मीडिया (कवर फोटो) एवं विवरण', '5. میڈیا (کور تصویر) اور تفصیل', '5. Media & Description')}
            </Text>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {tr('कवर फोटो (फोन गैलरी से)', 'کور تصویر (فون گیلری سے)', 'Cover Image (From Phone Gallery)')}
              </Text>

              {formData.coverImage ? (
                <View style={s.previewContainer}>
                  <Image source={{ uri: formData.coverImage }} style={s.imagePreview} resizeMode="cover" />
                  <View style={s.previewOverlayBar}>
                    <Text style={s.previewFileName} numberOfLines={1}>
                      {formData.coverImageFileName || tr('कवर फोटो संलग्न', 'کور فوٹو منسلک', 'Cover Photo Attached')}
                    </Text>
                    <View style={s.previewActionGroup}>
                      <TouchableOpacity
                        style={s.previewChangeBtn}
                        onPress={handlePickCoverImage}
                      >
                        <RefreshCw color="#fff" size={13} />
                        <Text style={s.previewBtnText}>{tr('बदलें', 'تبدیل کریں', 'Change')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.previewRemoveBtn}
                        onPress={() => setFormData(prev => ({ ...prev, coverImage: '', coverImageFileName: '' }))}
                      >
                        <X color="#fff" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.uploadBox, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                  onPress={handlePickCoverImage}
                >
                  <Upload color={theme.primary} size={26} />
                  <Text style={[s.uploadTitle, { color: theme.textMain }]}>
                    {tr('गैलरी से कवर फोटो चुनें', 'گیلری سے کور تصویر منتخب کریں', 'Select Cover Photo from Gallery')}
                  </Text>
                  <Text style={[s.uploadSub, { color: theme.textSub }]}>
                    {tr('छवि फ़ाइल चुनने के लिए टैप करें', 'تصویر فائل منتخب کرنے کے لیے ٹیپ کریں', 'Tap to pick image file')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Direct URL Fallback */}
              <TouchableOpacity
                onPress={() => setShowUrlFallback(!showUrlFallback)}
                style={s.urlToggleBtn}
              >
                <Text style={[s.urlToggleText, { color: theme.primary }]}>
                  {showUrlFallback
                    ? tr('▲ डायरेक्ट URL छुपाएं', '▲ براہ راست URL چھپائیں', '▲ Hide Direct URL input')
                    : tr('▼ या सीधा इमेज URL दर्ज करें', '▼ یا براہ راست تصویری URL درج کریں', '▼ Or enter direct Image URL')}
                </Text>
              </TouchableOpacity>

              {showUrlFallback && (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }]}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor={theme.textSub}
                    value={formData.coverImage}
                    onChangeText={v => setFormData(prev => ({ ...prev, coverImage: v, coverImageFileName: 'url_image.jpg' }))}
                  />
                </View>
              )}
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>{tr('विवरण', 'تفصیل', 'Description')}</Text>
              <TextInput
                style={[
                  s.input,
                  s.textArea,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain }
                ]}
                placeholder={tr(
                  'समुदाय अध्याय के मिशन, सदस्यों और सेवा कार्य का वर्णन करें...',
                  'کمیونٹی چیپٹر کے مشن، ارکان اور خدمات کے دائرہ کار کی وضاحت کریں...',
                  "Describe the community chapter's mission, members, and service scope..."
                )}
                placeholderTextColor={theme.textSub}
                multiline
                textAlignVertical="top"
                value={formData.description}
                onChangeText={v => setFormData(prev => ({ ...prev, description: v }))}
              />
            </View>
          </View>

          {/* Action / Submit Buttons */}
          <View style={s.submitRow}>
            {editingId && (
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: theme.cardBorder, backgroundColor: theme.chipIdle }]}
                onPress={() => setActiveSubTab('list')}
                disabled={submitting}
              >
                <Text style={[s.cancelBtnText, { color: theme.textSub }]}>{tr('रद्द करें', 'منسوخ کریں', 'Cancel')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                s.submitBtn,
                editingId ? { flex: 2 } : { flex: 1 },
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
                    {editingId
                      ? tr('समुदाय अपडेट करें', 'کمیونٹی اپ ڈیٹ کریں', 'Update Community')
                      : tr('समुदाय सहेजें', 'کمیونٹی محفوظ کریں', 'Save Community')}
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

            <Text style={[s.deleteModalTitle, { color: theme.textMain }]}>
              {tr('समुदाय हटाएं?', 'کمیونٹی حذف کریں؟', 'Delete Community?')}
            </Text>
            <Text style={[s.deleteModalSub, { color: theme.textSub }]}>
              {tr(
                'क्या आप वाकई इस समुदाय को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
                'کیا آپ واقعی اس کمیونٹی کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔',
                'Are you sure you want to delete this community? This action cannot be undone and will affect all associated data.'
              )}
            </Text>

            <View style={[s.modalActions, { borderTopColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[s.modalCancelBtn, { backgroundColor: theme.chipIdle }]}
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text style={[s.modalCancelBtnText, { color: theme.textSub }]}>
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
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
                    <Text style={s.modalDeleteBtnText}>
                      {tr('हां, हटाएं', 'ہاں، حذف کریں', 'Yes, Delete')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

  // Tab Header
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    padding: 8,
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
  tabBtnText: { fontSize: 12, fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },

  // List View
  listPad: { padding: 14, paddingBottom: 90 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardCoverContainer: { position: 'relative', width: '100%', height: 100 },
  coverImg: { height: 100, width: '100%' },
  coverBadgeOverlay: { position: 'absolute', top: 8, right: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  statPillText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#e2e8f0' },
  flex1: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cardMeta: { fontSize: 12, fontWeight: '500' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 10, fontWeight: '700' },

  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  adminTextNew: { fontSize: 11, flex: 1 },

  descContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  descHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  descHeading: { fontSize: 11, fontWeight: '700' },
  descText: { fontSize: 12, lineHeight: 18 },
  descToggleBtn: { marginTop: 4, alignSelf: 'flex-start' },
  descToggleText: { fontSize: 11, fontWeight: '700' },

  gridStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  gridStatBox: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  gridStatVal: { fontSize: 13, fontWeight: '800' },
  gridStatLbl: { fontSize: 10, marginTop: 1 },

  healthSection: { marginTop: 12 },
  healthLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  healthLabel: { fontSize: 11, fontWeight: '600' },
  healthPct: { fontSize: 11, fontWeight: '700' },
  healthTrack: { height: 6, borderRadius: 6, overflow: 'hidden' },
  healthFill: { height: 6, borderRadius: 6 },

  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Form View
  formPad: { padding: 14, paddingBottom: 100 },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { fontSize: 18, fontWeight: '800' },
  formSubTitle: { fontSize: 12, marginTop: 2 },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeading: { fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  hintText: { fontSize: 11, marginBottom: 10 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, padding: 12, borderRadius: 12, fontSize: 14 },
  disabledInput: { opacity: 0.7 },
  textArea: { height: 90, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', marginBottom: 14 },
  gap10: { width: 10 },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSelectedText: { fontSize: 13, fontWeight: '700' },
  dropdownSelectedSub: { fontSize: 11, marginTop: 1 },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownItemTitle: { fontSize: 13, fontWeight: '700' },
  dropdownItemSub: { fontSize: 11, marginTop: 1 },
  emptyUserNotice: { padding: 12, fontSize: 12, textAlign: 'center' },

  chipGroup: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Avatar Logo Styles
  avatarSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  avatarPreviewWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  avatarPreviewImg: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  avatarFileNameText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  avatarClearBtn: {
    padding: 2,
  },

  // Upload Box
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadTitle: { fontSize: 13, fontWeight: '700' },
  uploadSub: { fontSize: 11 },
  previewContainer: { borderRadius: 14, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 120 },
  previewOverlayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewFileName: { color: '#fff', fontSize: 11, fontWeight: '600', flex: 1, marginRight: 8 },
  previewActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  previewRemoveBtn: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlToggleBtn: { marginTop: 8, alignSelf: 'flex-start' },
  urlToggleText: { fontSize: 11, fontWeight: '700' },

  // Submit Buttons
  submitRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center' },
  deleteIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deleteModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  deleteModalSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%', paddingTop: 14, borderTopWidth: 1 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelBtnText: { fontWeight: '700', fontSize: 13 },
  modalDeleteBtn: { flex: 1, backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalDeleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
