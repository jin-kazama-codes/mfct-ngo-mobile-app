import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Modal
} from 'react-native';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../../../src/services/userService';
import { getCommunities } from '../../../src/services/communityService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { getMemberNominees, getMemberBankDetails } from '../../../src/services/memberService';
import { useAppState } from '../../../src/context/AppStateProvider';
import { User, UserRole, Community, MemberNominee, MemberBankDetails } from '../../../src/types';
import {
  Users as UsersIcon, ShieldCheck, PlusCircle, Trash2, CheckCircle2,
  Eye, EyeOff, Edit3, Search, Upload, X, MapPin, Mail,
  Phone, Building2, Building, CreditCard, Lock, RefreshCw, AlertCircle,
  Sparkles, ArrowLeft, Camera, FileText, Award, UserCheck
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLanguageCode,
  translateRole,
  translateCity,
  translateCommunityName,
  translateDistrictRole,
} from '../../../src/lib/translateEntity';
import { useDynamicTranslatedText, autoTranslateText } from '../../../src/lib/autoTranslate';
import { UserListSkeleton } from '../../../src/components/SkeletonLoader';

const DISTRICT_ROLE_OPTIONS = [
  { id: '', label: '-- None (कोई भूमिका नहीं) --' },
  { id: 'district_president', label: 'District President (जिला अध्यक्ष)' },
  { id: 'district_coordinator', label: 'District Coordinator (जिला संयोजक)' },
  { id: 'district_gen_secretary', label: 'District Gen Sec (जिला महासचिव)' },
  { id: 'district_secretary', label: 'District Secretary (जिला सचिव)' },
  { id: 'district_finance_coord', label: 'District Finance Coord (जिला वित्त समन्वयक)' },
];

const ROLES: { id: UserRole; label: string; color: string }[] = [
  { id: 'member', label: 'Member (सदस्य)', color: '#10b981' },
  { id: 'district_president', label: 'District President (जिला अध्यक्ष)', color: '#d97706' },
  { id: 'district_coordinator', label: 'District Coordinator (जिला संयोजक)', color: '#059669' },
  { id: 'district_gen_secretary', label: 'District Gen Sec (जिला महासचिव)', color: '#7c3aed' },
  { id: 'district_secretary', label: 'District Secretary (जिला सचिव)', color: '#2563eb' },
  { id: 'district_finance_coord', label: 'District Finance Coord (जिला वित्त समन्वयक)', color: '#ea580c' },
  { id: 'community_admin', label: 'Community Admin (सामुदायिक एडमिन)', color: '#0284c7' },
  { id: 'executive_admin', label: 'Executive Admin (कार्यकारी एडमिन)', color: '#8b5cf6' },
  { id: 'super_admin', label: 'Super Admin (सुपर एडमिन)', color: '#ef4444' },
];

// ─── UserListItem ─────────────────────────────────────────────────────────
interface UserListItemProps {
  user: User;
  lang: ReturnType<typeof getLanguageCode>;
  isDark: boolean;
  isCurrent: boolean;
  onView: (user: User) => void;
  onAssignRole: (user: User) => void;
  onDelete: (id: string) => void;
}

function UserListItem({ user, lang, isDark, isCurrent, onView, onAssignRole, onDelete }: UserListItemProps) {
  const roleObj = ROLES.find(r => r.id === user.role) || { label: user.role || 'member', color: '#64748b' };
  const translatedCity = useDynamicTranslatedText(user.city || '', lang);
  const translatedComm = useDynamicTranslatedText(user.communityName || '', lang);
  const translatedName = useDynamicTranslatedText(user.name || '', lang);
  const translatedState = useDynamicTranslatedText(user.state || '', lang);

  const rawDistrict = user.district || '';
  const translatedDistrict = useDynamicTranslatedText(rawDistrict, lang);
  const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
  const effectiveDistrictRole = (user.districtRole || user.district_role || (distRoleKeys.includes(user.role) ? user.role : '')) as string;

  return (
    <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 mb-3 shadow-xs">
      {/* Top Row: Avatar + Info + Role Badge */}
      <View className="flex-row items-center">
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-3" resizeMode="cover" />
        ) : (
          <View className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
            <Text className="text-lg font-black text-slate-900 dark:text-white">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-extrabold text-slate-900 dark:text-white" numberOfLines={1}>
              {translatedName}
            </Text>
            {user.isVerified && <ShieldCheck color="#10b981" size={15} />}
          </View>

          <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
            ID: {user.membershipId || 'N/A'}
          </Text>

          {/* Contact Info */}
          <View className="flex-row items-center gap-1 mt-1">
            <Phone color={isDark ? '#94a3b8' : '#64748b'} size={11} />
            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{user.phone}</Text>
          </View>

          {user.email ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Mail color={isDark ? '#94a3b8' : '#64748b'} size={11} />
              <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-400" numberOfLines={1}>{user.email}</Text>
            </View>
          ) : null}
        </View>

        {/* Role Badge */}
        <View className="px-2.5 py-1 rounded-xl" style={{ backgroundColor: `${roleObj.color}20` }}>
          <Text className="text-[10px] font-black" style={{ color: roleObj.color }}>
            {translateRole(user.role || 'member', lang).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* District Role Badge */}
      {!!effectiveDistrictRole && (
        <View className="mt-3">
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 self-start">
            <Award color={isDark ? '#fbbf24' : '#d97706'} size={12} />
            <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
              {translateDistrictRole(effectiveDistrictRole, lang)}
              {rawDistrict ? ` (${translatedDistrict || rawDistrict})` : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Location & Community row */}
      <View className="flex-row items-center flex-wrap gap-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl mt-3">
        <View className="flex-row items-center gap-1 flex-1">
          <MapPin color="#10b981" size={12} />
          <Text className="text-[11px] font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
            {user.city
              ? `${translatedCity}${user.state ? `, ${translatedState}` : ''}`
              : 'Location N/A'}
          </Text>
        </View>

        {user.communityName ? (
          <View className="flex-row items-center gap-1 flex-1">
            <Building2 color="#10b981" size={12} />
            <Text className="text-[11px] font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
              {translatedComm}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Bar: Edit & Delete */}
      <View className="flex-row items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        {isCurrent && (
          <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-auto">
            (Your Account)
          </Text>
        )}

        <TouchableOpacity
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40"
          onPress={() => onView(user)}
        >
          <Eye color="#0284c7" size={13} />
          <Text className="text-xs font-bold text-sky-600 dark:text-sky-400">View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40"
          onPress={() => onAssignRole(user)}
        >
          <Award color="#d97706" size={13} />
          <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">Assign Role</Text>
        </TouchableOpacity>

        {!isCurrent && (
          <TouchableOpacity
            className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40"
            onPress={() => onDelete(user.id)}
          >
            <Trash2 color="#ef4444" size={14} />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ManageUsersScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { activeUser } = useAppState();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // View User modal state
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewNominees, setViewNominees] = useState<MemberNominee[]>([]);
  const [viewBankDetails, setViewBankDetails] = useState<MemberBankDetails[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    if (viewUser?.id) {
      setLoadingExtra(true);
      Promise.all([
        getMemberNominees(viewUser.id),
        getMemberBankDetails(viewUser.id),
      ])
        .then(([noms, banks]) => {
          setViewNominees(noms);
          setViewBankDetails(banks);
        })
        .finally(() => {
          setLoadingExtra(false);
        });
    } else {
      setViewNominees([]);
      setViewBankDetails([]);
    }
  }, [viewUser?.id]);

  // Assign Role modal state (only 2 fields: district and role)
  const [assignRoleUser, setAssignRoleUser] = useState<User | null>(null);
  const [assignDistrict, setAssignDistrict] = useState('');
  const [assignRole, setAssignRole] = useState<UserRole | string>('member');
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const handleOpenAssignRole = (u: User) => {
    setAssignRoleUser(u);
    setAssignDistrict(u.district || '');
    const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
    const currentDistRole = (u.districtRole || u.district_role || '') as string;
    if (currentDistRole && distRoleKeys.includes(currentDistRole)) {
      setAssignRole(currentDistRole);
    } else {
      setAssignRole(u.role || 'member');
    }
  };

  const handleSaveAssignRole = async () => {
    if (!assignRoleUser) return;
    setIsAssigningRole(true);
    try {
      const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
      const isDistrictRole = distRoleKeys.includes(assignRole);
      const finalDistrictRole = isDistrictRole ? assignRole : undefined;
      const finalDistrict = assignDistrict.trim();

      await updateUser(assignRoleUser.id, {
        district: finalDistrict || undefined,
        role: assignRole as UserRole,
        districtRole: finalDistrictRole,
        district_role: finalDistrictRole,
      });

      if (finalDistrict) {
        autoTranslateText(finalDistrict, 'hi').catch(() => { });
        autoTranslateText(finalDistrict, 'ur').catch(() => { });
      }

      showToast(lang === 'hi' ? 'भूमिका व जिला सफलतापूर्वक सौंपा गया' : 'Role & District assigned successfully!', 'success');
      setAssignRoleUser(null);
      await loadData(false);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Failed to assign role', 'error');
    } finally {
      setIsAssigningRole(false);
    }
  };

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

  // Form states matching website
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plainPassword, setPlainPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('member');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [districtRole, setDistrictRole] = useState('');
  const [state, setState] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Media states
  const [avatar, setAvatar] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [showUrlInputs, setShowUrlInputs] = useState(false);

  const loadData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [usersData, commsData] = await Promise.all([
        getUsers(),
        getCommunities()
      ]);
      const filteredMembers = usersData.filter(
        (member) =>
          member.role !== 'super_admin' &&
          member.role !== 'executive_admin'
      );
      setUsers(filteredMembers);
      setCommunities(commsData);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
    if (roleFilter === 'district_committee') {
      result = result.filter(u => u.districtRole || u.district_role || distRoleKeys.includes(u.role));
    } else if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter || u.districtRole === roleFilter || u.district_role === roleFilter);
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return result;
    return result.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.membershipId && u.membershipId.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q)) ||
      (u.district && u.district.toLowerCase().includes(q)) ||
      (u.districtRole && u.districtRole.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  }, [users, searchQuery, roleFilter]);

  // Pick Image from Mobile
  const handlePickImage = async (field: 'avatar' | 'document' | 'screenshot') => {
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (field === 'avatar') setAvatar(uri);
        else if (field === 'document') setDocumentUrl(uri);
        else if (field === 'screenshot') setPaymentScreenshotUrl(uri);
        showToast('Image selected from device', 'info');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      showToast('Image selected (fallback)', 'info');
    }
  };

  // Reset Form
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPlainPassword('');
    setShowPassword(false);
    setRole('member');
    setCity('');
    setDistrict('');
    setDistrictRole('');
    setState('');
    setSelectedCommunityId('');
    setPaymentUtr('');
    setAvatar('');
    setDocumentUrl('');
    setPaymentScreenshotUrl('');
    setEditingId(null);
    setShowUrlInputs(false);
  };

  // Open Edit Mode
  const handleOpenEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPlainPassword('');
    setShowPassword(false);
    const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
    const currentDistRole = (user.districtRole || user.district_role || '') as string;
    const effectiveRole = distRoleKeys.includes(currentDistRole)
      ? (currentDistRole as UserRole)
      : (user.role || 'member');
    setRole(effectiveRole);
    setCity(user.city || '');
    setDistrict(user.district || user.city || '');
    setDistrictRole(currentDistRole);
    setState(user.state || '');
    setSelectedCommunityId(user.communityId || '');
    setPaymentUtr(user.paymentUtr || '');
    setAvatar(user.avatar || '');
    setDocumentUrl(user.documentUrl || '');
    setPaymentScreenshotUrl(user.paymentScreenshotUrl || '');
    setActiveSubTab('create');
  };

  // Handle Save (Create / Update)
  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Please enter the user full name.', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter the phone number.', 'error');
      return;
    }
    if (!editingId && !plainPassword) {
      showToast('Please set a password for the new user.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const comm = communities.find(c => c.id === selectedCommunityId);
      const [upAvatar, upDoc, upReceipt] = await Promise.all([
        avatar.trim() ? uploadImageToSupabase(avatar.trim(), 'users') : Promise.resolve(''),
        documentUrl.trim() ? uploadImageToSupabase(documentUrl.trim(), 'kyc') : Promise.resolve(''),
        paymentScreenshotUrl.trim() ? uploadImageToSupabase(paymentScreenshotUrl.trim(), 'receipts') : Promise.resolve(''),
      ]);

      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`;
      const finalAvatar = upAvatar || avatar.trim() || defaultAvatar;
      const finalDocUrl = upDoc || documentUrl.trim() || undefined;
      const finalScreenshotUrl = upReceipt || paymentScreenshotUrl.trim() || undefined;

      const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
      const isDistrictRole = distRoleKeys.includes(role);
      const finalDistrictRole = isDistrictRole ? role : (districtRole || undefined);

      if (editingId) {
        // UPDATE existing user
        await updateUser(editingId, {
          name: name.trim(),
          role,
          district: district.trim() || city.trim() || undefined,
          districtRole: finalDistrictRole,
          district_role: finalDistrictRole,
          city: city.trim(),
          state: state.trim(),
          communityId: comm?.id || selectedCommunityId || '',
          communityName: comm?.name || '',
          avatar: finalAvatar,
          documentUrl: finalDocUrl,
          paymentUtr: paymentUtr.trim() || undefined,
          paymentScreenshotUrl: finalScreenshotUrl,
          plainPassword: plainPassword.trim() || undefined,
        });

        showToast('User account updated successfully!', 'success');
      } else {
        // CREATE new user
        const finalEmail = email.trim().toLowerCase() || `${phone.trim()}@mfct.org`;
        const newUser: User = {
          id: `usr_${Date.now()}`,
          name: name.trim(),
          email: finalEmail,
          phone: phone.trim(),
          role,
          district: district.trim() || city.trim() || comm?.city || '',
          districtRole: finalDistrictRole,
          district_role: finalDistrictRole,
          avatar: finalAvatar,
          communityId: comm?.id || selectedCommunityId || '',
          communityName: comm?.name || '',
          membershipId: `MEM-${Date.now().toString().slice(-4)}`,
          status: 'approved',
          isVerified: true,
          joinDate: new Date().toISOString(),
          city: city.trim() || district.trim() || comm?.city || '',
          state: state.trim() || 'UP',
          documentUrl: finalDocUrl,
          paymentUtr: paymentUtr.trim() || undefined,
          paymentScreenshotUrl: finalScreenshotUrl,
        };

        await createUser({
          ...newUser,
          password: plainPassword.trim(),
        });

        showToast('User account created successfully!', 'success');
      }

      // Pre-warm translations for name, city, state in Hindi and Urdu
      if (name) {
        autoTranslateText(name, 'hi').catch(() => { });
        autoTranslateText(name, 'ur').catch(() => { });
      }
      if (city) {
        autoTranslateText(city, 'hi').catch(() => { });
        autoTranslateText(city, 'ur').catch(() => { });
      }
      if (state) {
        autoTranslateText(state, 'hi').catch(() => { });
        autoTranslateText(state, 'ur').catch(() => { });
      }

      resetForm();
      setActiveSubTab('list');
      await loadData(false);
    } catch (err: any) {
      console.error('Error saving user:', err);
      showToast(err?.message || 'Failed to save user account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    if (deleteConfirmId === activeUser?.id) {
      showToast('You cannot delete your own account.', 'error');
      setDeleteConfirmId(null);
      return;
    }

    setDeletingId(deleteConfirmId);
    try {
      await deleteUser(deleteConfirmId);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
      showToast('User deleted successfully!', 'success');
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Toast Notification */}
      {toast && (
        <View
          className={`absolute top-2.5 left-4 right-4 z-50 flex-row items-center p-3.5 rounded-xl gap-2.5 shadow-lg ${toast.type === 'success'
            ? 'bg-emerald-600'
            : toast.type === 'error'
              ? 'bg-rose-600'
              : 'bg-sky-600'
            }`}
        >
          {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
          {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
          {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
          <Text className="color-white text-xs font-bold flex-1">{toast.message}</Text>
        </View>
      )}

      {/* Sub-Tab Header */}
      <View className="flex-row border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 gap-2">
        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'list') setActiveSubTab('list');
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${activeSubTab === 'list' ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800'
            }`}
        >
          <UsersIcon color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-xs font-bold ${activeSubTab === 'list' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'create') {
              resetForm();
              setActiveSubTab('create');
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
            {editingId ? 'Edit User' : '+ Add User'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        <>
          {/* Search Bar */}
          <View className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 justify-center">
            <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
              <Search color={isDark ? '#94a3b8' : '#64748b'} size={16} className="mr-2" />
              <TextInput
                className="flex-1 py-2 text-xs font-medium text-slate-900 dark:text-white"
                placeholder="Search users by name, phone, email..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={16} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Role Filter Pills */}
          <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2 px-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                { id: 'all', label: 'All Users' },
                { id: 'district_committee', label: '★ District Committee' },
                { id: 'member', label: 'Members' },
                { id: 'community_admin', label: 'Community Admins' },
                { id: 'executive_admin', label: 'Executive Admins' },
                { id: 'super_admin', label: 'Super Admins' },
              ].map(rf => {
                const isSelected = roleFilter === rf.id;
                return (
                  <TouchableOpacity
                    key={rf.id}
                    onPress={() => setRoleFilter(rf.id)}
                    className={`px-3 py-1.5 rounded-full border ${isSelected
                      ? rf.id === 'district_committee'
                        ? 'bg-amber-600 border-amber-600'
                        : 'bg-emerald-600 border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}
                    >
                      {rf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
            <UserListSkeleton isDark={isDark} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }}>
              {filteredUsers.length === 0 ? (
                <View className="items-center py-16 px-4">
                  <UsersIcon color={isDark ? '#64748b' : '#94a3b8'} size={44} />
                  <Text className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400 text-center">
                    {searchQuery ? 'No users matching your search' : 'No users registered yet'}
                  </Text>
                  <TouchableOpacity
                    className="flex-row items-center gap-1.5 px-4 py-2.5 bg-emerald-600 rounded-xl mt-4"
                    onPress={() => {
                      resetForm();
                      setActiveSubTab('create');
                    }}
                  >
                    <PlusCircle color="#fff" size={16} />
                    <Text className="text-xs font-bold text-white">Create First User</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredUsers.map(user => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    lang={lang}
                    isDark={isDark}
                    isCurrent={user.id === activeUser?.id}
                    onView={setViewUser}
                    onAssignRole={handleOpenAssignRole}
                    onDelete={setDeleteConfirmId}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {activeSubTab === 'create' && (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 90 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-4">
            {editingId && (
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <ArrowLeft color={isDark ? '#f8fafc' : '#0f172a'} size={18} />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                {editingId ? 'Edit User Account' : 'Create New User'}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {editingId
                  ? 'Update permissions, details, and community assigned.'
                  : 'Register a new user account with assigned role and details.'}
              </Text>
            </View>
          </View>

          {/* Section 1: Basic Information */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Personal Details</Text>

            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</Text>
              <TextInput
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                placeholder="e.g. Mohd Zaid"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="flex-row gap-2.5 mb-3.5">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number *</Text>
                <TextInput
                  className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white ${editingId ? 'opacity-60' : ''
                    }`}
                  placeholder="e.g. 8630675154"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="phone-pad"
                  editable={!editingId}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</Text>
                <TextInput
                  className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white ${editingId ? 'opacity-60' : ''
                    }`}
                  placeholder="e.g. zaid@example.com"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingId}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {editingId ? 'Password (Leave blank to keep unchanged)' : 'Login Password *'}
              </Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                <Lock color={isDark ? '#94a3b8' : '#64748b'} size={17} className="mr-2" />
                <TextInput
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder={editingId ? '••••••••' : 'Set secure login password'}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry={!showPassword}
                  value={plainPassword}
                  onChangeText={setPlainPassword}
                />
                <TouchableOpacity
                  className="p-1"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                  ) : (
                    <Eye color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 2: Role & Community */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Role & Community Assignment</Text>

            {/* Roles */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Assigned Role *</Text>
              <View className="flex-row flex-wrap gap-2">
                {ROLES.map(r => {
                  const isSelected = role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        setRole(r.id);
                        const distRoleKeys = ['district_president', 'district_coordinator', 'district_gen_secretary', 'district_secretary', 'district_finance_coord'];
                        if (distRoleKeys.includes(r.id)) {
                          setDistrictRole(r.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border ${isSelected
                        ? ''
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      style={isSelected ? { backgroundColor: r.color, borderColor: r.color } : {}}
                    >
                      <Text
                        className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {role === 'district_finance_coord' && (
                <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-2.5 mt-2">
                  <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    Official Responsibility (आधिकारिक दायित्व):
                  </Text>
                  <Text className="text-xs font-medium text-slate-900 dark:text-white mt-0.5">
                    Financial records and documentary support for official transactions.
                  </Text>
                </View>
              )}
            </View>

            {/* Select Community */}
            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Community / Chapter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCommunityId('')}
                  className={`px-3.5 py-2 rounded-xl border ${!selectedCommunityId
                    ? 'bg-emerald-600 border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${!selectedCommunityId ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    No Community
                  </Text>
                </TouchableOpacity>

                {communities.map(c => {
                  const isSelected = selectedCommunityId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCommunityId(c.id)}
                      className={`px-3.5 py-2 rounded-xl border ${isSelected
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}
                      >
                        {c.name} ({c.city})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Section 3: Location & Payment UTR */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Location & Payment Details</Text>

            <View className="flex-row gap-2.5 mb-3.5">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">City</Text>
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. Bareilly"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">District (जिला)</Text>
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. Bareilly, Lucknow"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
            </View>

            {/* District Role Picker */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">District Role (जिला भूमिका)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DISTRICT_ROLE_OPTIONS.map(opt => {
                  const isSelected = (districtRole || '') === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id || 'none'}
                      onPress={() => {
                        setDistrictRole(opt.id);
                        if (opt.id) {
                          setRole(opt.id as UserRole);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl border ${isSelected
                        ? 'bg-amber-600 border-amber-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                          }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">State</Text>
              <TextInput
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                placeholder="e.g. UP"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={state}
                onChangeText={setState}
              />
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">UTR / Transaction Number (Optional)</Text>
              <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                <CreditCard color="#10b981" size={17} className="mr-2" />
                <TextInput
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. 420199381029"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={paymentUtr}
                  onChangeText={setPaymentUtr}
                />
              </View>
            </View>
          </View>

          {/* Section 4: Documents & Photos Upload */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Documents & Photo Attachments</Text>

            {/* 1. Profile Photo */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Profile Photo</Text>
              {avatar ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl gap-3">
                  <Image source={{ uri: avatar }} className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" resizeMode="cover" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo Attached</Text>
                    <View className="flex-row gap-2 mt-1.5">
                      <TouchableOpacity
                        className="flex-row items-center gap-1 bg-emerald-600 px-2.5 py-1 rounded-lg"
                        onPress={() => handlePickImage('avatar')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text className="text-[10px] font-bold text-white">Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-rose-600 p-1 rounded-lg justify-center items-center px-2"
                        onPress={() => setAvatar('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl gap-2"
                  onPress={() => handlePickImage('avatar')}
                >
                  <Upload color="#10b981" size={18} />
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">Choose Profile Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Aadhaar / KYC Document */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Aadhaar / ID Proof</Text>
              {documentUrl ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl gap-3">
                  <Image source={{ uri: documentUrl }} className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" resizeMode="cover" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">ID Document Attached</Text>
                    <View className="flex-row gap-2 mt-1.5">
                      <TouchableOpacity
                        className="flex-row items-center gap-1 bg-emerald-600 px-2.5 py-1 rounded-lg"
                        onPress={() => handlePickImage('document')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text className="text-[10px] font-bold text-white">Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-rose-600 p-1 rounded-lg justify-center items-center px-2"
                        onPress={() => setDocumentUrl('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl gap-2"
                  onPress={() => handlePickImage('document')}
                >
                  <FileText color="#10b981" size={18} />
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">Upload ID Document</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Payment Screenshot */}
            <View className="mb-3">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Screenshot</Text>
              {paymentScreenshotUrl ? (
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl gap-3">
                  <Image source={{ uri: paymentScreenshotUrl }} className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" resizeMode="cover" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">Screenshot Attached</Text>
                    <View className="flex-row gap-2 mt-1.5">
                      <TouchableOpacity
                        className="flex-row items-center gap-1 bg-emerald-600 px-2.5 py-1 rounded-lg"
                        onPress={() => handlePickImage('screenshot')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text className="text-[10px] font-bold text-white">Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-rose-600 p-1 rounded-lg justify-center items-center px-2"
                        onPress={() => setPaymentScreenshotUrl('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl gap-2"
                  onPress={() => handlePickImage('screenshot')}
                >
                  <CreditCard color="#10b981" size={18} />
                  <Text className="text-xs font-bold text-slate-900 dark:text-white">Upload Payment Receipt</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Direct URL Toggle */}
            <TouchableOpacity
              onPress={() => setShowUrlInputs(!showUrlInputs)}
              className="mt-1"
            >
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {showUrlInputs ? '▲ Hide Direct URL Inputs' : '▼ Or enter direct URLs manually'}
              </Text>
            </TouchableOpacity>

            {showUrlInputs && (
              <View className="gap-2.5 mt-2.5">
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="Avatar URL: https://..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={avatar}
                  onChangeText={setAvatar}
                />
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="Document URL: https://..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={documentUrl}
                  onChangeText={setDocumentUrl}
                />
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="Payment Screenshot URL: https://..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={paymentScreenshotUrl}
                  onChangeText={setPaymentScreenshotUrl}
                />
              </View>
            )}
          </View>

          {/* Submit Row */}
          <View className="flex-row gap-2.5 mt-2">
            {editingId && (
              <TouchableOpacity
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                onPress={() => {
                  resetForm();
                  setActiveSubTab('list');
                }}
                disabled={submitting}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-row items-center justify-center bg-emerald-600 active:bg-emerald-700 py-3 rounded-xl gap-2 shadow-sm ${editingId ? 'flex-2' : 'flex-1'
                } ${submitting ? 'opacity-60' : ''}`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text className="text-xs font-extrabold text-white">
                    {editingId ? 'Save Changes' : 'Create User Account'}
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
        <View className="flex-1 justify-center items-center p-5 bg-black/70">
          <View className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-14 h-14 rounded-full bg-rose-500/10 items-center justify-center mb-3">
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text className="text-base font-black text-slate-900 dark:text-white mb-1">Delete User Account?</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center leading-5 mb-5">
              Are you sure you want to delete this user? All user data and access will be permanently removed.
            </Text>

            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-rose-600 active:bg-rose-700 py-3 rounded-xl items-center flex-row justify-center gap-1.5"
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 color="#fff" size={15} />
                    <Text className="text-xs font-extrabold text-white">Yes, Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── VIEW USER DETAILS MODAL ── */}
      <Modal
        visible={viewUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setViewUser(null)}
      >
        <View className="flex-1 justify-end sm:justify-center p-0 sm:p-5 bg-black/70">
          <View className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85%] overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="w-9 h-9 rounded-xl bg-sky-500/10 items-center justify-center">
                  <Eye color="#0284c7" size={18} />
                </View>
                <View>
                  <Text className="text-sm font-black text-slate-900 dark:text-white">User Details</Text>
                  <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    ID: {viewUser?.membershipId || viewUser?.id}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setViewUser(null)} className="p-1">
                <X color={isDark ? '#94a3b8' : '#64748b'} size={20} />
              </TouchableOpacity>
            </View>

            {/* Scrollable details */}
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
              {/* Profile Card */}
              <View className="flex-row items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                {viewUser?.avatar ? (
                  <Image source={{ uri: viewUser.avatar }} className="w-13 h-13 rounded-2xl bg-slate-200 dark:bg-slate-700" resizeMode="cover" />
                ) : (
                  <View className="w-13 h-13 rounded-2xl bg-slate-200 dark:bg-slate-800 items-center justify-center">
                    <Text className="text-xl font-black text-slate-900 dark:text-white">
                      {viewUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-900 dark:text-white">{viewUser?.name}</Text>
                  <View className="flex-row flex-wrap gap-1.5 mt-1">
                    <View className="px-2 py-0.5 rounded-lg bg-emerald-500/10">
                      <Text className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        {translateRole(viewUser?.role || 'member', lang).toUpperCase()}
                      </Text>
                    </View>
                    {(viewUser?.districtRole || viewUser?.district_role) ? (
                      <View className="px-2 py-0.5 rounded-lg bg-amber-500/10">
                        <Text className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          {translateDistrictRole(viewUser.districtRole || viewUser.district_role || '', lang)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Detail Items */}
              <View className="gap-2.5">
                {/* District */}
                <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">DISTRICT (जिला)</Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <MapPin color="#10b981" size={13} />
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">
                      {viewUser?.district || viewUser?.city || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">LOCATION</Text>
                  <Text className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {[viewUser?.city, viewUser?.state].filter(Boolean).join(', ') || 'N/A'}
                  </Text>
                </View>

                {/* Phone */}
                <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">PHONE NUMBER</Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Phone color={isDark ? '#94a3b8' : '#64748b'} size={13} />
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">
                      {viewUser?.phone || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">EMAIL ADDRESS</Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <Mail color={isDark ? '#94a3b8' : '#64748b'} size={13} />
                    <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                      {viewUser?.email || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Community */}
                {viewUser?.communityName ? (
                  <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">COMMUNITY / CHAPTER</Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Building2 color="#0284c7" size={14} />
                      <Text className="text-xs font-bold text-slate-900 dark:text-white">
                        {viewUser.communityName}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Payment UTR */}
                {viewUser?.paymentUtr ? (
                  <View className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">PAYMENT UTR NUMBER</Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <CreditCard color="#10b981" size={14} />
                      <Text className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {viewUser.paymentUtr}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Nominee Details Section */}
                <View className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <UserCheck color="#059669" size={14} />
                    <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      NOMINEE DETAILS (वारिस / उत्तराधिकारी)
                    </Text>
                  </View>
                  {loadingExtra ? (
                    <Text className="text-xs text-slate-400 italic">Loading nominee...</Text>
                  ) : viewNominees.length > 0 ? (
                    <View className="gap-2">
                      {viewNominees.map((nom) => (
                        <View key={nom.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900">
                          <Text className="text-xs font-black text-slate-900 dark:text-white capitalize">
                            {nom.nominee_name} ({nom.relation})
                          </Text>
                          <Text className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Ph: {nom.phone} • Share: {nom.share_percentage || 100}%
                          </Text>
                          {nom.aadhaar_number ? (
                            <Text className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Aadhaar: •••• {nom.aadhaar_number.slice(-4)}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-xs text-slate-400 italic">No nominee registered</Text>
                  )}
                </View>

                {/* Member Bank Details Section */}
                <View className="p-3 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-xl">
                  <View className="flex-row items-center gap-1.5 mb-2">
                    <Building color="#0d9488" size={14} />
                    <Text className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      MEMBER BANK ACCOUNT (सदस्य बैंक खाता)
                    </Text>
                  </View>
                  {loadingExtra ? (
                    <Text className="text-xs text-slate-400 italic">Loading bank details...</Text>
                  ) : viewBankDetails.length > 0 ? (
                    <View className="gap-2">
                      {viewBankDetails.map((b) => (
                        <View key={b.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-teal-100 dark:border-teal-900">
                          <Text className="text-xs font-black text-slate-900 dark:text-white uppercase">
                            {b.bank_name}
                          </Text>
                          <Text className="text-[11px] text-slate-500 font-mono mt-0.5">
                            A/C: •••• {b.account_number.slice(-4)} • IFSC: {b.ifsc_code}
                          </Text>
                          <Text className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                            {b.account_holder_name} ({b.account_type || 'Savings'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-xs text-slate-400 italic">No bank account registered</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
              <TouchableOpacity
                className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40"
                onPress={() => {
                  const targetUser = viewUser;
                  setViewUser(null);
                  if (targetUser) handleOpenAssignRole(targetUser);
                }}
              >
                <Award color="#d97706" size={15} />
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">Assign Role</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800"
                onPress={() => setViewUser(null)}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ASSIGN ROLE MODAL (Only Two Fields: District and Role) ── */}
      <Modal
        visible={assignRoleUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignRoleUser(null)}
      >
        <View className="flex-1 justify-center items-center p-5 bg-black/70">
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="w-9 h-9 rounded-xl bg-amber-500/10 items-center justify-center">
                  <Award color="#d97706" size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-black text-slate-900 dark:text-white">Assign Role & District</Text>
                  <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    {assignRoleUser?.name} ({assignRoleUser?.membershipId || assignRoleUser?.phone})
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAssignRoleUser(null)} className="p-1">
                <X color={isDark ? '#94a3b8' : '#64748b'} size={20} />
              </TouchableOpacity>
            </View>

            {/* Form - Only 2 Fields */}
            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Field 1: District */}
              <View className="mb-4">
                <View className="flex-row items-center gap-1 mb-1.5">
                  <MapPin color="#059669" size={13} />
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">1. District (जिला) *</Text>
                </View>
                <TextInput
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. Bareilly, Lucknow"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={assignDistrict}
                  onChangeText={setAssignDistrict}
                />
              </View>

              {/* Field 2: Role */}
              <View className="mb-2">
                <View className="flex-row items-center gap-1 mb-1.5">
                  <Award color="#d97706" size={13} />
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Role (भूमिका) *</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {ROLES.map(r => {
                    const isSelected = assignRole === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setAssignRole(r.id)}
                        className={`px-3 py-1.5 rounded-xl border ${isSelected
                          ? ''
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        style={isSelected ? { backgroundColor: r.color, borderColor: r.color } : {}}
                      >
                        <Text
                          className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                            }`}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {assignRole === 'district_finance_coord' && (
                  <View className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-2.5 mt-3">
                    <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                      Official Responsibility (आधिकारिक दायित्व):
                    </Text>
                    <Text className="text-xs font-medium text-slate-900 dark:text-white mt-0.5">
                      Financial records and documentary support for official transactions.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="flex-row gap-2.5 p-4 border-t border-slate-100 dark:border-slate-800">
              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 items-center"
                onPress={() => setAssignRoleUser(null)}
                disabled={isAssigningRole}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-amber-600 active:bg-amber-700 items-center flex-row justify-center gap-1.5 shadow-sm"
                onPress={handleSaveAssignRole}
                disabled={isAssigningRole}
              >
                {isAssigningRole ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <CheckCircle2 color="#fff" size={15} />
                    <Text className="text-xs font-extrabold text-white">Assign Role</Text>
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
