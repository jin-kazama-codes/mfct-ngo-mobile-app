import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Modal
} from 'react-native';
import {
  getCommunities,
  createCommunity,
  updateCommunity,
  deleteCommunity
} from '../../../src/services/communityService';
import { getUsers, updateUser } from '../../../src/services/userService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { Community, User, UserRole } from '../../../src/types';
import {
  Building2, Users, TrendingUp, PlusCircle, Trash2, CheckCircle2,
  ShieldCheck, Calendar, Edit3, ArrowLeft, Upload, RefreshCw, X,
  AlertCircle, Sparkles, Check, ChevronDown, ChevronUp, UserCheck, Camera,
  MapPin, Flame, FileText, Search, Filter, ShieldAlert, Award, Lock
} from 'lucide-react-native';
import { CommunityCardSkeleton } from '../../../src/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLanguageCode,
  translateRole,
} from '../../../src/lib/translateEntity';
import { useDynamicTranslatedText, autoTranslateCommunityData } from '../../../src/lib/autoTranslate';
import { useAppState } from '../../../src/context/AppStateProvider';
import { STANDARD_DISTRICTS } from '../../../src/data/districtsData';

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
  canVerify?: boolean;
  onQuickVerify?: (id: string) => void;
  onEdit: (c: Community) => void;
  onDelete: (id: string) => void;
}

function CommunityCardItem({
  community: c,
  lang,
  theme,
  isDark,
  tr,
  canVerify,
  onQuickVerify,
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
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl mb-3.5 overflow-hidden shadow-xs">

      {/* ── Cover Banner (always shown, dark bg fallback) ── */}
      <View className="relative w-full overflow-hidden" style={{ height: 140, backgroundColor: '#0d3822' }}>
        {c.coverImage ? (
          <Image
            source={{ uri: c.coverImage }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
          />
        ) : null}

        {/* Dark gradient overlay — top half light tint */}
        <View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%',
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        />
        {/* Dark gradient overlay — bottom half strong dark */}
        <View
          style={{
            position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
          }}
        />

        {/* Verified Status Badge — top right */}
        <View className="absolute top-2.5 right-2.5">
          <View
            className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${isPending
                ? 'bg-amber-500/80'
                : isFlagged
                  ? 'bg-rose-600/80'
                  : 'bg-emerald-600/80'
              }`}
          >
            <ShieldCheck color="#fff" size={10} />
            <Text className="text-white text-[10px] font-bold">
              {c.verifiedStatus === 'Verified'
                ? tr('✓ सत्यापित', '✓ تصدیق شدہ', '✓ Verified')
                : c.verifiedStatus === 'Pending'
                  ? tr('लंबित', 'زیر التواء', 'Pending')
                  : tr('चिह्नित', 'نشان زدہ', 'Flagged')}
            </Text>
          </View>
        </View>

        {/* Avatar + Name + City — anchored at bottom of cover */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-end gap-2.5 px-3 pb-2.5">
          <Image
            source={{
              uri:
                c.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=059669&color=fff`
            }}
            style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 2, borderColor: '#fff' }}
            resizeMode="cover"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="text-[10px] font-bold text-emerald-400" numberOfLines={1}>
              {c.district ? `${c.district} • ` : ''}{translatedCity || c.city}{translatedState || c.state ? `, ${translatedState || c.state}` : ''}
            </Text>
            <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
              {translatedName || c.name}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-3.5">

        {/* Admin Info Badge */}
        <View className="flex-row items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
          <UserCheck color="#10b981" size={14} />
          <Text className="text-[11px] flex-1 text-slate-600 dark:text-slate-400" numberOfLines={1}>
            <Text className="font-bold text-slate-900 dark:text-white">
              {tr('व्यवस्थापक: ', 'ایڈمن: ', 'Admin: ')}
            </Text>
            {translatedAdminName || c.adminName}
            <Text className="text-emerald-600 dark:text-emerald-400 font-semibold"> • {translatedRole}</Text>
          </Text>
        </View>

        {/* Description / Mission Statement (All Data) */}
        {descContent ? (
          <View className="mt-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <View className="flex-row items-center gap-1.5 mb-1">
              <FileText color="#10b981" size={13} />
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {tr('विवरण एवं उद्देश्य', 'تفصیل اور مقصد', 'About & Mission')}
              </Text>
            </View>
            <Text
              className="text-xs leading-4.5 text-slate-900 dark:text-white"
              numberOfLines={expandedDesc ? undefined : 2}
            >
              {descContent}
            </Text>
            {descContent.length > 80 && (
              <TouchableOpacity
                onPress={() => setExpandedDesc(!expandedDesc)}
                className="mt-1 self-start"
              >
                <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {expandedDesc
                    ? tr('कम दिखाएं ▲', 'کم دکھائیں ▲', 'Show Less ▲')
                    : tr('और पढ़ें ▼', 'مزید پڑھیں ▼', 'Read More ▼')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Comprehensive 4-Metric Grid */}
        <View className="flex-row flex-wrap gap-2 mt-3">
          {/* Members */}
          <View className="flex-1 min-w-[46%] flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Users color="#0284c7" size={15} />
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-slate-900 dark:text-white">
                {c.totalMembers ? c.totalMembers.toLocaleString() : 0}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('कुल सदस्य', 'کل ممبران', 'Members')}
              </Text>
            </View>
          </View>

          {/* Funds Raised */}
          <View className="flex-1 min-w-[46%] flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <TrendingUp color="#10b981" size={15} />
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-slate-900 dark:text-white">
                ₹{c.totalRaisedINR ? (c.totalRaisedINR >= 100000 ? `${(c.totalRaisedINR / 100000).toFixed(1)}L` : c.totalRaisedINR.toLocaleString()) : 0}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('एकत्रित राशि', 'جمع رقم', 'Raised')}
              </Text>
            </View>
          </View>

          {/* Active Campaigns */}
          <View className="flex-1 min-w-[46%] flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Flame color="#f59e0b" size={15} />
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-slate-900 dark:text-white">
                {c.activeCampaigns ?? 0}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('सक्रिय अभियान', 'فعال مہمات', 'Campaigns')}
              </Text>
            </View>
          </View>

          {/* Established Year */}
          <View className="flex-1 min-w-[46%] flex-row items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Calendar color="#8b5cf6" size={15} />
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-slate-900 dark:text-white">
                {c.establishedYear || 2024}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                {tr('स्थापना वर्ष', 'سال قیام', 'Est. Year')}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Score Progress */}
        <View className="mt-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {tr('स्वास्थ्य स्कोर एवं गुणवत्ता', 'ہیلتھ سکور اور معیار', 'Community Health Score')}
            </Text>
            <Text className="text-[11px] font-bold" style={{ color: healthColor }}>{healthPct}%</Text>
          </View>
          <View className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            <View className="h-1.5 rounded-full" style={{ width: `${healthPct}%`, backgroundColor: healthColor }} />
          </View>
        </View>

        {/* Action buttons: Verify, Edit & Delete */}
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {canVerify && c.verifiedStatus !== 'Verified' && onQuickVerify ? (
            <TouchableOpacity
              onPress={() => onQuickVerify(c.id)}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/15"
            >
              <CheckCircle2 color="#10b981" size={14} />
              <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {tr('सत्यापित करें', 'تصدیق کریں', 'Verify')}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => onEdit(c)}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-sky-500/15"
          >
            <Edit3 color="#0284c7" size={14} />
            <Text className="text-xs font-bold text-sky-600 dark:text-sky-400">
              {tr('संपादित करें', 'ترمیم', 'Edit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onDelete(c.id)}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/15"
          >
            <Trash2 color="#ef4444" size={14} />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">
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

  // Connect to AppStateProvider for Active User & Role
  let contextUser: User | null = null;
  let contextRole: UserRole | undefined;
  try {
    const appState = useAppState();
    contextUser = appState?.activeUser ?? null;
    contextRole = appState?.currentRole;
  } catch {
    // Outside AppStateProvider fallback
  }

  const activeUser = contextUser;
  const currentRole = contextRole;

  const rawDistRole = (
    activeUser?.district_role ||
    activeUser?.districtRole ||
    (activeUser?.role as string) ||
    ''
  ).toLowerCase().trim().replace(/\s+/g, '_');

  const isSuperOrExecutive =
    currentRole === 'super_admin' ||
    currentRole === 'executive_admin' ||
    activeUser?.role === 'super_admin' ||
    activeUser?.role === 'executive_admin';

  const isDistrictPresident =
    currentRole === 'district_president' ||
    rawDistRole === 'district_president' ||
    rawDistRole.includes('president');

  // Strictly use activeUser.district for District President
  const userDistrict = (activeUser?.district || activeUser?.city || '').trim();

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search and District filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('');
  const [showDistrictFilterModal, setShowDistrictFilterModal] = useState(false);
  const [showDistrictFormModal, setShowDistrictFormModal] = useState(false);

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
    district: string;
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
    district: '',
    city: '',
    state: 'Uttar Pradesh',
    establishedYear: new Date().getFullYear().toString(),
    adminId: '',
    adminName: '',
    adminRoleTitle: 'community_admin',
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

  // Filter communities: for District President, strictly restrict to their district
  const filteredCommunities = useMemo(() => {
    let list = communities;

    // 1. District president restriction: strictly match by District
    if (isDistrictPresident && userDistrict) {
      const target = userDistrict.toLowerCase().trim();
      list = list.filter((c) => {
        const commDistrict = (c.district || c.city || '').toLowerCase().trim();
        return commDistrict === target;
      });
    } else if (selectedDistrictFilter) {
      // Super admin / Executive admin optional district filter
      const target = selectedDistrictFilter.toLowerCase().trim();
      list = list.filter((c) => {
        const commDistrict = (c.district || c.city || '').toLowerCase().trim();
        return commDistrict === target;
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q) ||
        (c.adminName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [communities, isDistrictPresident, userDistrict, selectedDistrictFilter, searchQuery]);

  // Candidate users for becoming community admin:
  // - Super Admin & Executive Admin: all users are visible
  // - District President: only users from their specific district appear as candidates
  const candidateUsers = useMemo(() => {
    if (isSuperOrExecutive) {
      return availableUsers;
    }
    if (isDistrictPresident && userDistrict) {
      const target = userDistrict.toLowerCase().trim();
      return availableUsers.filter((u) => {
        const uDist = (u.district || '').toLowerCase().trim();
        const uCity = (u.city || '').toLowerCase().trim();
        return uDist === target || uCity === target || (formData.adminId && u.id === formData.adminId);
      });
    }
    return availableUsers;
  }, [availableUsers, isSuperOrExecutive, isDistrictPresident, userDistrict, formData.adminId]);

  // Quick verify handler for Super Admin / Executive Admin
  const handleQuickVerify = async (id: string) => {
    if (!isSuperOrExecutive) return;
    try {
      await updateCommunity(id, { verifiedStatus: 'Verified' });
      showToast(
        tr('समुदाय सफलतापूर्वक सत्यापित किया गया!', 'کمیونٹی کی کامیابی سے تصدیق ہو گئی!', 'Community verified successfully!'),
        'success'
      );
      setCommunities(prev => prev.map(c => c.id === id ? { ...c, verifiedStatus: 'Verified' } : c));
    } catch (err: any) {
      console.error('Quick verify error:', err);
      showToast(
        err?.message || tr('सत्यापन में विफल।', 'تصدیق میں ناکامی۔', 'Failed to verify community.'),
        'error'
      );
    }
  };

  // Open Create Mode
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      district: isDistrictPresident ? userDistrict : '',
      city: isDistrictPresident ? userDistrict : '',
      state: activeUser?.state || 'Uttar Pradesh',
      establishedYear: new Date().getFullYear().toString(),
      adminId: '',
      adminName: '',
      adminRoleTitle: 'community_admin',
      healthScore: '100',
      verifiedStatus: isSuperOrExecutive ? 'Verified' : 'Pending',
      coverImage: '',
      coverImageFileName: '',
      description: '',
      avatar: '',
      avatarFileName: '',
    });
    setShowUrlFallback(false);
    setShowAvatarUrlFallback(false);
    setShowAdminDropdown(false);
    setShowDistrictFormModal(false);
    setActiveSubTab('create');
  };

  // Open Edit Mode
  const handleOpenEdit = (comm: Community) => {
    setEditingId(comm.id);
    const matchedUser = availableUsers.find(
      u => u.name === comm.adminName || u.communityId === comm.id || (comm as any).adminId === u.id
    );
    setFormData({
      name: comm.name || '',
      district: comm.district || (isDistrictPresident ? userDistrict : '') || comm.city || '',
      city: comm.city || '',
      state: comm.state || 'Uttar Pradesh',
      establishedYear: (comm.establishedYear || 2024).toString(),
      adminId: matchedUser?.id || '',
      adminName: comm.adminName || '',
      adminRoleTitle: comm.adminRoleTitle || 'community_admin',
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
    setShowDistrictFormModal(false);
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
      console.warn('Image picker error:', err);
      showToast(tr('फोटो चयन रद्द या विफल हुआ', 'تصویر کا انتخاب منسوخ या ناکام ہوا', 'Image selection cancelled or failed'), 'error');
    }
  };

  // Select Admin User from Dropdown
  const handleSelectAdmin = (user: User) => {
    setFormData(prev => ({
      ...prev,
      adminId: user.id,
      adminName: user.name,
      adminRoleTitle: 'community_admin'
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

      // Verification status rules:
      // - Creating: Super Admin & Executive Admin -> user choice or 'Verified'; District President -> strictly 'Pending'
      // - Editing: only Super Admin & Executive Admin can promote to 'Verified'
      let resolvedStatus: 'Verified' | 'Pending' | 'Flagged' = 'Pending';
      if (editingId) {
        if (isSuperOrExecutive) {
          resolvedStatus = formData.verifiedStatus;
        } else {
          const existingComm = communities.find((c) => c.id === editingId);
          resolvedStatus = existingComm?.verifiedStatus === 'Verified' ? 'Verified' : 'Pending';
        }
      } else {
        resolvedStatus = isSuperOrExecutive ? formData.verifiedStatus : 'Pending';
      }

      const finalDistrict = formData.district.trim() || (isDistrictPresident ? userDistrict : '') || formData.city.trim() || '';

      const uploadedCover = formData.coverImage
        ? await uploadImageToSupabase(formData.coverImage.trim(), 'communities')
        : '';

      const communityPayload: Partial<Community> = {
        name: formData.name.trim(),
        district: finalDistrict,
        city: formData.city.trim(),
        state: formData.state.trim() || 'Uttar Pradesh',
        establishedYear: Number(formData.establishedYear) || new Date().getFullYear(),
        adminName: formData.adminName.trim() || 'Community Administrator',
        adminRoleTitle: formData.adminRoleTitle || 'community_admin',
        healthScore: Number(formData.healthScore) || 100,
        verifiedStatus: resolvedStatus,
        coverImage: uploadedCover || formData.coverImage.trim() || defaultCover,
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

      // Auto-translate community metadata for instant Hindi & Urdu caching
      try {
        await autoTranslateCommunityData(
          formData.name.trim(),
          formData.description.trim(),
          formData.city.trim(),
          formData.state.trim()
        );
      } catch (tErr) {
        console.warn('Community auto-translation notice:', tErr);
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

  const selectedAdminUser = availableUsers.find(u => u.id === formData.adminId);
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#131d2e' : '#ffffff';
  const inputBorder = isDark ? '#334155' : '#cbd5e1';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#090d16]">
      {/* Toast Notification Banner */}
      {toast && (
        <View
          className={`absolute top-2.5 left-4 right-4 z-50 flex-row items-center gap-2.5 py-3 px-4 rounded-xl elevation-8 ${
            toast.type === 'success' ? 'bg-emerald-700' : toast.type === 'error' ? 'bg-red-600' : 'bg-sky-600'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
          {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
          {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
          <Text className="text-white text-[13px] font-bold flex-1">{toast.message}</Text>
        </View>
      )}

      {/* Sub-Tab Header */}
      <View className="flex-row border-b border-slate-200 dark:border-slate-800 p-2 gap-2 bg-white dark:bg-slate-900">
        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'list') setActiveSubTab('list');
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${activeSubTab === 'list' ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800'
            }`}
        >
          <Building2 color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-xs font-bold ${activeSubTab === 'list' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
            {tr('समुदाय', 'کمیونٹیز', 'Communities')} ({filteredCommunities.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'create') {
              handleOpenAdd();
            }
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${activeSubTab === 'create' ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800'
            }`}
        >
          {editingId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          )}
          <Text className={`text-xs font-bold ${activeSubTab === 'create' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
            {editingId
              ? tr('समुदाय संपादित करें', 'کمیونٹی میں ترمیم کریں', 'Edit Community')
              : tr('+ नया समुदाय जोड़ें', '+ نئی کمیونٹی شامل کریں', '+ Add Community')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        loading ? (
          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }}>
            {[1, 2, 3].map(i => <CommunityCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
            {/* District President Filter Indicator Banner */}
            {isDistrictPresident && (
              <View className="flex-row items-center justify-between p-3 rounded-2xl border border-amber-500 bg-amber-500/15 mb-3 gap-2.5">
                <View className="flex-row items-start flex-1 gap-2.5">
                  <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mt-0.5">
                    <Award color="#d97706" size={18} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <Text className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                        {tr('जिला अध्यक्ष दृश्य', 'ضلعی صدر منظر', 'District President View')}
                      </Text>
                      {userDistrict ? (
                        <View className="bg-amber-600 px-1.5 py-0.5 rounded-md">
                          <Text className="text-white text-[10px] font-extrabold">{userDistrict}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-[11px] mt-0.5 leading-3.5 text-amber-800 dark:text-amber-400">
                      {tr(
                        `केवल आपके जिले (${userDistrict || 'निर्दिष्ट जिला'}) के समुदाय दिखाए जा रहे हैं।`,
                        `صرف آپ کے ضلع (${userDistrict || 'مخصوص ضلع'}) کی کمیونٹیز دکھائی جا رہی ہیں۔`,
                        `Showing only communities belonging to your designated district (${userDistrict || 'Assigned District'}).`
                      )}
                    </Text>
                  </View>
                </View>
                <View className="bg-amber-500/20 px-2 py-1 rounded-xl">
                  <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {filteredCommunities.length} {tr('समुदाय', 'کمیونٹیز', 'Communities')}
                  </Text>
                </View>
              </View>
            )}

            {/* Filter & Search Bar */}
            <View className="flex-row items-center gap-2 mb-3">
              <View className="flex-1 flex-row items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 h-10 bg-white dark:bg-slate-900">
                <Search color={isDark ? '#94a3b8' : '#64748b'} size={15} />
                <TextInput
                  className="flex-1 text-xs text-slate-900 dark:text-white py-0"
                  placeholder={tr('समुदाय, शहर या व्यवस्थापक खोजें...', 'کمیونٹی، شہر یا منتظم تلاش کریں...', 'Search community, city, or admin...')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                    <X color={isDark ? '#94a3b8' : '#64748b'} size={14} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {!isDistrictPresident && (
                <TouchableOpacity
                  onPress={() => setShowDistrictFilterModal(true)}
                  className={`flex-row items-center gap-1.5 border rounded-xl px-3 h-10 ${selectedDistrictFilter
                      ? 'bg-emerald-600 border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Filter color={selectedDistrictFilter ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={14} />
                  <Text
                    className={`text-[11px] font-bold max-w-[90px] ${selectedDistrictFilter ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    numberOfLines={1}
                  >
                    {selectedDistrictFilter
                      ? (STANDARD_DISTRICTS.find(d => d.id === selectedDistrictFilter)?.[lang === 'hi' ? 'nameHi' : lang === 'ur' ? 'nameUr' : 'nameEn'] || selectedDistrictFilter)
                      : tr('सभी जिले', 'تمام اضلاع', 'All Districts')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredCommunities.length === 0 ? (
              <View className="items-center py-15 px-4">
                <Building2 color={isDark ? '#64748b' : '#94a3b8'} size={48} />
                <Text className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {isDistrictPresident
                    ? tr(
                      `जिला ${userDistrict || ''} में कोई समुदाय नहीं मिला`,
                      `ضلع ${userDistrict || ''} میں کوئی کمیونٹی نہیں ملی`,
                      `No communities found for ${userDistrict || 'your district'}`
                    )
                    : tr('कोई समुदाय नहीं मिला', 'کوئی کمیونٹی نہیں ملی', 'No communities found')}
                </Text>
                <Text className="text-xs text-center mt-1 text-slate-500 dark:text-slate-400">
                  {isDistrictPresident
                    ? tr(
                      `आप अपने जिले (${userDistrict}) के लिए नया समुदाय बनाने के लिए नीचे दिए गए बटन पर क्लिक करें।`,
                      `آپ اپنے ضلع (${userDistrict}) کے لیے نئی کمیونٹی بنانے کے لیے نیچے دیے گئے بٹن پر کلک کریں۔`,
                      `Click below to establish the official community chapter for ${userDistrict}.`
                    )
                    : tr('अपनी खोज को समायोजित करें या नया समुदाय जोड़ें।', 'اپنی تلاش تبدیل کریں یا نئی کمیونٹی شامل کریں۔', 'Try adjusting your search or add a new community.')}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl mt-4 bg-emerald-500"
                  onPress={handleOpenAdd}
                >
                  <PlusCircle color="#fff" size={16} />
                  <Text className="text-white font-bold text-[13px]">
                    {tr('पहला समुदाय जोड़ें', 'پہلی کمیونٹی شامل کریں', 'Add First Community')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredCommunities.map(c => (
                <CommunityCardItem
                  key={c.id}
                  community={c}
                  lang={lang}
                  theme={{}}
                  isDark={isDark}
                  tr={tr}
                  canVerify={isSuperOrExecutive}
                  onQuickVerify={handleQuickVerify}
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
        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            {editingId && (
              <TouchableOpacity
                onPress={() => setActiveSubTab('list')}
                className="w-9 h-9 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800"
              >
                <ArrowLeft color={isDark ? '#f8fafc' : '#0f172a'} size={18} />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-slate-900 dark:text-white">
                {editingId
                  ? tr('समुदाय संपादित करें', 'کمیونٹی میں ترمیم کریں', 'Edit Community')
                  : tr('नया समुदाय जोड़ें', 'نئی کمیونٹی شامل کریں', 'Add New Community')}
              </Text>
              <Text className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                {editingId
                  ? tr('समुदाय का विवरण, प्रशासक और मेट्रिक्स अपडेट करें।', 'کمیونٹی کی تفصیلات، تفویض کردہ ایڈمن اور میٹرکس اپ ڈیٹ کریں۔', 'Update community details, assigned admin, and metrics.')
                  : tr('प्लेटफ़ॉर्म पर एक नया क्षेत्रीय समुदाय अध्याय जोड़ें।', 'پلیٹ فارم پر ایک نیا علاقائی کمیونٹی چیپٹر شامل کریں۔', 'Add a new regional community chapter to the platform.')}
              </Text>
            </View>
          </View>

          {/* ── 1. AVATAR / LOGO ── */}
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 mb-3.5 bg-white dark:bg-slate-800">
            <Text className="text-[13px] font-extrabold uppercase tracking-wide mb-3 text-emerald-600 dark:text-emerald-400">
              {tr('1. समुदाय का अवतार / लोगो', '1. کمیونٹی اوتار / لوگو', '1. Community Avatar / Logo')}
            </Text>
            <Text className="text-[11px] mb-2.5 text-slate-500 dark:text-slate-400">
              {tr('अपनी डिवाइस से इस समुदाय अध्याय के लिए लोगो चुनें या URL दर्ज करें।', 'اپنے ڈیوائس سے اس کمیونٹی چیپٹر کے لیے لوگو منتخب کریں یا URL درج کریں۔', 'Select a logo or profile image for this community chapter from your device or enter a URL.')}
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-500/15"
              onPress={handlePickAvatarImage}
              activeOpacity={0.7}
            >
              <Upload color="#10b981" size={15} />
              <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {formData.avatar
                  ? tr('अवतार बदलें', 'اوتار تبدیل کریں', 'Change Avatar')
                  : tr('गैलरी से अवतार चुनें', 'گیلری سے اوتار منتخب کریں', 'Select Avatar from Gallery')}
              </Text>
            </TouchableOpacity>

            {formData.avatar ? (
              <View className="flex-row items-center mt-2">
                <Text className="flex-1 text-[11px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  ✓ {formData.avatarFileName || tr('अवतार संलग्न', 'اوتار منسلک', 'Avatar attached')}
                </Text>
                <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, avatar: '', avatarFileName: '' }))}
                  className="p-1">
                  <X color="#ef4444" size={14} />
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => setShowAvatarUrlFallback(!showAvatarUrlFallback)}
              className="mt-2 self-start"
            >
              <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {showAvatarUrlFallback
                  ? tr('▲ डायरेक्ट URL छुपाएं', '▲ براہ راست URL چھپائیں', '▲ Hide Direct URL')
                  : tr('▼ या छवि URL दर्ज करें', '▼ یا تصویری URL درج کریں', '▼ Or enter Image URL')}
              </Text>
            </TouchableOpacity>

            {showAvatarUrlFallback && (
              <TextInput
                className="mt-2.5 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={formData.avatar}
                onChangeText={v => setFormData(prev => ({ ...prev, avatar: v, avatarFileName: 'url_avatar.jpg' }))}
              />
            )}
          </View>

          {/* ── 2. BASIC DETAILS ── */}
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 mb-3.5 bg-white dark:bg-slate-800">
            <Text className="text-[13px] font-extrabold uppercase tracking-wide mb-3 text-emerald-600 dark:text-emerald-400">
              {tr('2. मूल विवरण', '2. بنیادی تفصیلات', '2. Basic Details')}
            </Text>

            {/* Community Name */}
            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('समुदाय का नाम *', 'کمیونٹی کا نام *', 'Community Name *')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder={tr('उदा. बरेली सेंट्रल केयर सोसाइटी', 'مثال: بریلی سنٹرل کیئر سوسائٹی', 'e.g. Bareilly Central Care Society')}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={formData.name}
                onChangeText={v => setFormData(prev => ({ ...prev, name: v }))}
              />
            </View>

            {/* Est. Year */}
            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('स्थापना वर्ष *', 'سال قیام *', 'Established Year *')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder={tr('उदा. 2024', 'مثال: 2024', 'e.g. 2024')}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                keyboardType="numeric"
                value={formData.establishedYear}
                onChangeText={v => setFormData(prev => ({ ...prev, establishedYear: v }))}
              />
            </View>

            {/* District Field */}
            <View className="mb-3.5">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {tr('जिला *', 'ضلع *', 'District *')}
                </Text>
                {isDistrictPresident && userDistrict ? (
                  <View className="flex-row items-center gap-1">
                    <Lock color="#d97706" size={11} />
                    <Text className="text-[10px] font-bold text-amber-600">
                      {tr('आपके जिले के लिए लॉक', 'آپ کے ضلع کے لیے مقفل', 'Locked to your district')}
                    </Text>
                  </View>
                ) : null}
              </View>

              {isDistrictPresident && userDistrict ? (
                <View className="flex-row items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 opacity-70 bg-slate-100 dark:bg-slate-900">
                  <MapPin color={isDark ? '#94a3b8' : '#64748b'} size={16} />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">{userDistrict}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowDistrictFormModal(true)}
                  className="flex-row items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 bg-white dark:bg-slate-900"
                >
                  <View className="flex-row items-center flex-1 gap-2.5">
                    <MapPin color="#10b981" size={18} />
                    <Text className={`text-[13px] font-bold ${formData.district ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {formData.district
                        ? (STANDARD_DISTRICTS.find(d => d.id === formData.district)?.[lang === 'hi' ? 'nameHi' : lang === 'ur' ? 'nameUr' : 'nameEn'] || formData.district)
                        : tr('-- जिला चुनें --', '-- ضلع منتخب کریں --', '-- Select District --')}
                    </Text>
                  </View>
                  <ChevronDown color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                </TouchableOpacity>
              )}
            </View>

            {/* City */}
            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('शहर / कस्बा *', 'شہر / قصبہ *', 'City *')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder={tr('उदा. बरेली', 'مثال: بریلی', 'e.g. Bareilly')}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={formData.city}
                onChangeText={v => setFormData(prev => ({ ...prev, city: v }))}
              />
            </View>

            {/* State */}
            <View className="mb-0">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('राज्य *', 'ریاست *', 'State *')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder={tr('उदा. उत्तर प्रदेश', 'مثال: اتر پردیش', 'e.g. UP')}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={formData.state}
                onChangeText={v => setFormData(prev => ({ ...prev, state: v }))}
              />
            </View>
          </View>

          {/* ── 3. ASSIGN ADMIN ── */}
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 mb-3.5 bg-white dark:bg-slate-800">
            <Text className="text-[13px] font-extrabold uppercase tracking-wide mb-3 text-emerald-600 dark:text-emerald-400">
              {tr('3. व्यवस्थापक नियुक्त करें', '3. ایڈمن تفویض کریں', '3. Assign Admin')}
            </Text>
            <Text className="text-[11px] mb-2.5 text-slate-500 dark:text-slate-400">
              {tr('समुदाय व्यवस्थापक के रूप में असाइन करने के लिए पंजीकृत उपयोगकर्ता चुनें।', 'کمیونٹی ایڈمنسٹریٹر کے طور پر تفویض کرنے کے لیے رجسٹرڈ صارف منتخب کریں۔', 'Select a registered user to assign as the community administrator.')}
            </Text>

            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('उपयोगकर्ता चुनें (व्यवस्थापक)', 'صارف منتخب کریں (ایڈمن)', 'Select User (Admin)')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAdminDropdown(!showAdminDropdown)}
                className="flex-row items-center justify-between border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 bg-white dark:bg-slate-900"
              >
                <View className="flex-row items-center flex-1 gap-2.5">
                  <UserCheck color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                  <Text className={`text-[13px] font-bold ${formData.adminName ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formData.adminName
                      ? `${formData.adminName}${selectedAdminUser?.email ? ` (${selectedAdminUser.email})` : ''}`
                      : tr('उपयोगकर्ता चुनें...', 'صارف منتخب کریں...', 'Select a user...')}
                  </Text>
                </View>
                <ChevronDown color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>

              {showAdminDropdown && (
                <View className="border border-slate-200 dark:border-slate-700 rounded-xl mt-1.5 overflow-hidden bg-white dark:bg-slate-800">
                  {candidateUsers.length === 0 ? (
                    <View className="p-3.5">
                      <Text className="text-center text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">
                        {isDistrictPresident && userDistrict
                          ? tr(`${userDistrict} से कोई पंजीकृत सदस्य नहीं मिला`, `${userDistrict} سے کوئی رجسٹرڈ رکن نہیں ملا`, `No registered members found from ${userDistrict}`)
                          : tr('कोई उपयुक्त पंजीकृत उपयोगकर्ता नहीं मिला', 'کوئی مناسب رجسٹرڈ صارف نہیں ملا', 'No suitable registered users found')}
                      </Text>
                    </View>
                  ) : (
                    candidateUsers.map(user => {
                      const isSelected = formData.adminId === user.id;
                      return (
                        <TouchableOpacity
                          key={user.id}
                          onPress={() => handleSelectAdmin(user)}
                          className={`flex-row items-center justify-between px-3.5 py-3 border-b border-slate-200 dark:border-slate-700 ${isSelected ? 'bg-emerald-500/15' : ''}`}
                        >
                          <View className="flex-1">
                            <Text className={`text-[13px] font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {user.name}
                            </Text>
                            <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                              {user.email || user.phone} • {user.role}{user.district ? ` • ${user.district}` : ''}
                            </Text>
                          </View>
                          {isSelected && <Check color="#10b981" size={16} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            <View className="mb-0">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('व्यवस्थापक पद शीर्षक', 'ایڈمن کا عہدہ', 'Admin Role Title')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm opacity-70 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                value={formData.adminRoleTitle}
                editable={false}
              />
            </View>
          </View>

          {/* ── 4. METRICS & STATUS ── */}
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 mb-3.5 bg-white dark:bg-slate-800">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[13px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {tr('4. मेट्रिक्स एवं स्थिति', '4. میٹرکس اور حیثیت', '4. Metrics & Status')}
              </Text>
              {!isSuperOrExecutive && (
                <View className="flex-row items-center gap-1">
                  <ShieldAlert color="#f59e0b" size={13} />
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                    {tr('केवल सुपर/कार्यकारी एडमिन', 'صرف سپر/ایگزیکٹو ایڈمن', 'Super/Exec Admin only')}
                  </Text>
                </View>
              )}
            </View>

            {/* Health Score */}
            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('स्वास्थ्य स्कोर (0-100)', 'ہیلتھ سکور (0-100)', 'Health Score (0-100)')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="100"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                keyboardType="numeric"
                value={formData.healthScore}
                onChangeText={v => setFormData(prev => ({ ...prev, healthScore: v }))}
              />
            </View>

            {/* Verified Status */}
            <View className="mb-0">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('सत्यापन स्थिति', 'تصدیق کی حیثیت', 'Verified Status')}
              </Text>
              {isSuperOrExecutive ? (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {(['Verified', 'Pending', 'Flagged'] as const).map(status => {
                      const isSelected = formData.verifiedStatus === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          onPress={() => setFormData(prev => ({ ...prev, verifiedStatus: status }))}
                          className={`px-3.5 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Text className={`text-xs ${
                            isSelected ? 'text-white font-bold' : 'text-slate-500 dark:text-slate-400 font-semibold'
                          }`}>
                            {status === 'Verified'
                              ? tr('✓ सत्यापित', '✓ تصدیق شدہ', '✓ Verified')
                              : status === 'Pending'
                                ? tr('लंबित', 'زیر التواء', 'Pending')
                                : tr('चिह्नित', 'نشان زدہ', 'Flagged')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text className="text-[11px] mt-2 text-slate-500 dark:text-slate-400">
                    {tr('सत्यापित स्थिति समुदाय को आधिकारिक बनाती है। केवल सुपर / कार्यकारी एडमिन इसे सेट कर सकते हैं।', 'تصدیق شدہ حیثیت کمیونٹی کو باضابطہ بناتی ہے۔ صرف سپر یا ایگزیکٹو ایڈمن اسے سیٹ کر سکتے ہیں۔', 'Verified status officially validates the community. Only Super / Executive Admin can set this.')}
                  </Text>
                </>
              ) : (
                <View className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e]">
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border ${
                        formData.verifiedStatus === 'Verified'
                          ? 'bg-emerald-500/15 border-emerald-500'
                          : formData.verifiedStatus === 'Flagged'
                            ? 'bg-red-500/15 border-red-500'
                            : 'bg-amber-500/15 border-amber-500'
                      }`}
                    >
                      <ShieldCheck
                        color={formData.verifiedStatus === 'Verified' ? '#10b981' : formData.verifiedStatus === 'Flagged' ? '#ef4444' : '#f59e0b'}
                        size={12}
                      />
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: formData.verifiedStatus === 'Verified' ? '#10b981' : formData.verifiedStatus === 'Flagged' ? '#ef4444' : '#f59e0b' }}
                      >
                        {formData.verifiedStatus === 'Verified'
                          ? tr('✓ सत्यापित', '✓ تصدیق شدہ', '✓ Verified')
                          : formData.verifiedStatus === 'Flagged'
                            ? tr('चिह्नित', 'نشان زدہ', 'Flagged')
                            : tr('⏳ लंबित', '⏳ زیر التواء', '⏳ Pending')}
                      </Text>
                    </View>
                    <Text className="text-[11px] flex-1 text-slate-500 dark:text-slate-400">
                      {editingId
                        ? (formData.verifiedStatus === 'Verified'
                          ? tr('यह समुदाय पहले से सत्यापित है।', 'یہ کمیونٹی پہلے سے تصدیق شدہ ہے۔', 'This community is officially verified.')
                          : tr('कार्यकारी / सुपर एडमिन से सत्यापन की प्रतीक्षा है।', 'ایگزیکٹو یا سپر ایڈمن کی تصدیق کا انتظار ہے۔', 'Awaiting approval and verification from Executive / Super Admin.'))
                        : tr('जिला अध्यक्ष द्वारा बनाए गए नए समुदाय डिफ़ॉल्ट रूप से "लंबित" रहते हैं।', 'ضلعی صدر کی بنائی گئی نئی کمیونٹی خود بخود "زیر التواء" رہے گی۔', 'New communities created by District President are set to "Pending" until approved by Executive/Super Admin.')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── 5. MEDIA & DESCRIPTION ── */}
          <View className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 mb-3.5 bg-white dark:bg-slate-800">
            <Text className="text-[13px] font-extrabold uppercase tracking-wide mb-3 text-emerald-600 dark:text-emerald-400">
              {tr('5. मीडिया (कवर फोटो) एवं विवरण', '5. میڈیا (کور تصویر) اور تفصیل', '5. Media & Description')}
            </Text>

            <View className="mb-3.5">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('कवर फोटो (फोन गैलरी से)', 'کور تصویر (فون گیلری سے)', 'Cover Image (From Phone Gallery)')}
              </Text>

              {formData.coverImage ? (
                <View className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <Image source={{ uri: formData.coverImage }} style={{ height: 160, width: '100%' }} resizeMode="cover" />
                  <View className="flex-row items-center justify-between px-3 py-2 bg-black/70">
                    <Text className="text-white text-[11px] font-semibold flex-1" numberOfLines={1}>
                      {formData.coverImageFileName || tr('कवर फोटो संलग्न', 'کور فوٹو منسلک', 'Cover Photo Attached')}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/20"
                        onPress={handlePickCoverImage}
                      >
                        <RefreshCw color="#fff" size={13} />
                        <Text className="text-white text-[11px] font-bold">{tr('बदलें', 'تبدیل کریں', 'Change')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-1.5 rounded-lg bg-red-500/80"
                        onPress={() => setFormData(prev => ({ ...prev, coverImage: '', coverImageFileName: '' }))}
                      >
                        <X color="#fff" size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  className="border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900"
                  onPress={handlePickCoverImage}
                >
                  <Upload color="#10b981" size={26} />
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {tr('गैलरी से कवर फोटो चुनें', 'گیلری سے کور تصویر منتخب کریں', 'Select Cover Photo from Gallery')}
                  </Text>
                  <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tr('छवि फ़ाइल चुनने के लिए टैप करें', 'تصویر فائل منتخب کرنے کے لیے ٹیپ کریں', 'Tap to pick image file')}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowUrlFallback(!showUrlFallback)}
                className="mt-2 self-start"
              >
                <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {showUrlFallback
                    ? tr('▲ डायरेक्ट URL छुपाएं', '▲ براہ راست URL چھپائیں', '▲ Hide Direct URL input')
                    : tr('▼ या सीधा इमेज URL दर्ज करें', '▼ یا براہ راست تصویری URL درج کریں', '▼ Or enter direct Image URL')}
                </Text>
              </TouchableOpacity>

              {showUrlFallback && (
                <TextInput
                  className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={formData.coverImage}
                  onChangeText={v => setFormData(prev => ({ ...prev, coverImage: v, coverImageFileName: 'url_image.jpg' }))}
                />
              )}
            </View>

            <View className="mb-0">
              <Text className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-slate-500 dark:text-slate-400">
                {tr('विवरण', 'تفصیل', 'Description')}
              </Text>
              <TextInput
                className="border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                style={{ height: 90, textAlignVertical: 'top' }}
                placeholder={tr('समुदाय अध्याय के मिशन, सदस्यों और सेवा कार्य का वर्णन करें...', 'کمیونٹی چیپٹر کے مشن، ارکان اور خدمات کے دائرہ کار کی وضاحت کریں...', "Describe the community chapter's mission, members, and service scope...")}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                multiline
                textAlignVertical="top"
                value={formData.description}
                onChangeText={v => setFormData(prev => ({ ...prev, description: v }))}
              />
            </View>
          </View>

          {/* Action / Submit Buttons */}
          <View className="flex-row gap-3">
            {editingId && (
              <TouchableOpacity
                className="border border-slate-200 dark:border-slate-700 py-3.5 px-5 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-800"
                onPress={() => setActiveSubTab('list')}
                disabled={submitting}
              >
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-emerald-500"
              style={submitting ? { opacity: 0.7 } : undefined}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text className="text-white text-[15px] font-bold">
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

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View className="flex-1 justify-center items-center p-6 bg-black/70">
          <View className="w-full max-w-[360px] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 items-center bg-white dark:bg-slate-800">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-red-500/15">
              <Trash2 color="#ef4444" size={28} />
            </View>
            <Text className="text-lg font-extrabold mb-2 text-center text-slate-900 dark:text-white">
              {tr('समुदाय हटाएं?', 'کمیونٹی حذف کریں؟', 'Delete Community?')}
            </Text>
            <Text className="text-[13px] text-center leading-[18px] mb-5 text-slate-500 dark:text-slate-400">
              {tr('क्या आप वाकई इस समुदाय को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'کیا آپ واقعی اس کمیونٹی کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں کیا جا سکتا۔', 'Are you sure you want to delete this community? This action cannot be undone and will affect all associated data.')}
            </Text>
            <View className="flex-row gap-3 w-full border-t border-slate-200 dark:border-slate-700 pt-4">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center bg-slate-100 dark:bg-slate-900"
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 bg-red-500"
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 color="#fff" size={15} />
                    <Text className="text-white text-sm font-bold">
                      {tr('हां, हटाएं', 'ہاں، حذف کریں', 'Yes, Delete')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DISTRICT MODAL (FILTER & FORM) ── */}
      <Modal
        visible={showDistrictFilterModal || showDistrictFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowDistrictFilterModal(false); setShowDistrictFormModal(false); }}
      >
        <View className="flex-1 justify-center items-center p-5 bg-black/70">
          <View className="w-full max-w-[360px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center gap-2">
                <MapPin color="#10b981" size={20} />
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {showDistrictFilterModal
                    ? tr('जिला अनुसार फ़िल्टर करें', 'ضلع کے لحاظ سے فلٹر کریں', 'Filter by District')
                    : tr('जिला चुनें', 'ضلع منتخب کریں', 'Select District')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setShowDistrictFilterModal(false); setShowDistrictFormModal(false); }}
                className="p-1"
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {showDistrictFilterModal && (
                <TouchableOpacity
                  onPress={() => { setSelectedDistrictFilter(''); setShowDistrictFilterModal(false); }}
                  className={`flex-row items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${
                    !selectedDistrictFilter ? 'bg-emerald-500/15' : ''
                  }`}
                >
                  <Text className={`text-[13px] font-bold ${
                    !selectedDistrictFilter ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {tr('सभी जिले (संपूर्ण राज्य)', 'تمام اضلاع (پوری ریاست)', 'All Districts (All State)')}
                  </Text>
                  {!selectedDistrictFilter && <Check color="#10b981" size={18} />}
                </TouchableOpacity>
              )}

              {STANDARD_DISTRICTS.map(dist => {
                const isSelected = showDistrictFilterModal
                  ? selectedDistrictFilter.toLowerCase() === dist.id.toLowerCase()
                  : formData.district.toLowerCase() === dist.id.toLowerCase();
                const displayName = lang === 'hi' ? dist.nameHi : lang === 'ur' ? dist.nameUr : dist.nameEn;
                const subName = lang === 'hi' ? dist.nameEn : dist.nameHi;

                return (
                  <TouchableOpacity
                    key={dist.id}
                    onPress={() => {
                      if (showDistrictFilterModal) {
                        setSelectedDistrictFilter(dist.id);
                        setShowDistrictFilterModal(false);
                      } else {
                        setFormData(prev => ({ ...prev, district: dist.id, city: prev.city || dist.nameEn }));
                        setShowDistrictFormModal(false);
                      }
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${
                      isSelected ? 'bg-emerald-500/15' : ''
                    }`}
                  >
                    <View className="flex-1">
                      <Text className={`text-[13px] font-bold ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {displayName}
                      </Text>
                      <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                        {subName} • {dist.stateEn}
                      </Text>
                    </View>
                    {isSelected && <Check color="#10b981" size={18} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
