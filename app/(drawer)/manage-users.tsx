import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Image, StyleSheet, Modal, Dimensions
} from 'react-native';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../../src/services/userService';
import { getCommunities } from '../../src/services/communityService';
import { useAppState } from '../../src/context/AppStateProvider';
import { User, UserRole, Community } from '../../src/types';
import {
  Users as UsersIcon, ShieldCheck, PlusCircle, Trash2, CheckCircle2,
  Eye, EyeOff, Edit3, Search, Upload, X, MapPin, Mail,
  Phone, Building2, CreditCard, Lock, RefreshCw, AlertCircle,
  Sparkles, ArrowLeft, Camera, FileText
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getLanguageCode,
  translateRole,
  translateCity,
  translateCommunityName,
} from '../../src/lib/translateEntity';
import { useDynamicTranslatedText, autoTranslateText } from '../../src/lib/autoTranslate';

const ROLES: { id: UserRole; label: string; color: string }[] = [
  { id: 'member', label: 'Member', color: '#10b981' },
  { id: 'community_admin', label: 'Community Admin', color: '#0284c7' },
  { id: 'executive_admin', label: 'Executive Admin', color: '#8b5cf6' },
  { id: 'super_admin', label: 'Super Admin', color: '#ef4444' },
];

// ─── UserListItem ─────────────────────────────────────────────────────────
// Extracted as its own component so hooks (useDynamicTranslatedText) can be
// called at the component top-level — never inside a .map() callback.
interface UserListItemProps {
  user: User;
  lang: ReturnType<typeof getLanguageCode>;
  theme: Record<string, string>;
  isDark: boolean;
  isCurrent: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

function UserListItem({ user, lang, theme, isDark, isCurrent, onEdit, onDelete }: UserListItemProps) {
  const roleObj = ROLES.find(r => r.id === user.role) || { label: user.role || 'member', color: '#64748b' };
  const translatedCity = useDynamicTranslatedText(user.city || '', lang);
  const translatedComm = useDynamicTranslatedText(user.communityName || '', lang);
  const translatedName = useDynamicTranslatedText(user.name || '', lang);
  const translatedState = useDynamicTranslatedText(user.state || '', lang);

  return (
    <View
      style={[
        s.userCard,
        { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
      ]}
    >
      {/* Top Row: Avatar + Info + Role Badge */}
      <View style={s.userCardTop}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={s.avatarImg} resizeMode="cover" />
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <Text style={[s.avatarInitial, { color: theme.textMain }]}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={s.userNameRow}>
            <Text style={[s.userNameText, { color: theme.textMain }]} numberOfLines={1}>
              {translatedName}
            </Text>
            {user.isVerified && <ShieldCheck color="#10b981" size={14} />}
          </View>

          <Text style={[s.membershipText, { color: theme.textSub }]}>
            ID: {user.membershipId || 'N/A'}
          </Text>

          {/* Contact Info */}
          <View style={s.contactRow}>
            <Phone color={theme.textSub} size={11} />
            <Text style={[s.contactText, { color: theme.textSub }]}>{user.phone}</Text>
          </View>

          {user.email ? (
            <View style={s.contactRow}>
              <Mail color={theme.textSub} size={11} />
              <Text style={[s.contactText, { color: theme.textSub }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Role Badge */}
        <View style={[s.roleBadge, { backgroundColor: `${roleObj.color}20` }]}>
          <Text style={[s.roleBadgeText, { color: roleObj.color }]}>
            {translateRole(user.role || 'member', lang).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Location & Community row */}
      <View style={[s.metaDetailsBar, { backgroundColor: isDark ? '#131d2e' : '#f8fafc' }]}>
        <View style={s.metaItem}>
          <MapPin color={theme.primary} size={12} />
          <Text style={[s.metaItemText, { color: theme.textMain }]} numberOfLines={1}>
            {user.city
              ? `${translatedCity}${user.state ? `, ${translatedState}` : ''}`
              : 'Location N/A'}
          </Text>
        </View>

        {user.communityName ? (
          <View style={s.metaItem}>
            <Building2 color={theme.primary} size={12} />
            <Text style={[s.metaItemText, { color: theme.textMain }]} numberOfLines={1}>
              {translatedComm}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Bar: Edit & Delete */}
      <View style={[s.cardActions, { borderTopColor: theme.cardBorder }]}>
        {isCurrent && (
          <Text style={[s.selfAccountTag, { color: theme.textSub }]}>
            (Your Account)
          </Text>
        )}

        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe' }]}
          onPress={() => onEdit(user)}
        >
          <Edit3 color="#0284c7" size={14} />
          <Text style={[s.actionBtnText, { color: '#0284c7' }]}>Edit User</Text>
        </TouchableOpacity>

        {!isCurrent && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: isDark ? '#4c1d24' : '#fee2e2' }]}
            onPress={() => onDelete(user.id)}
          >
            <Trash2 color="#ef4444" size={14} />
            <Text style={[s.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
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
      setUsers(usersData);
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
    if (roleFilter === 'district_committee') {
      result = result.filter(u => u.districtRole || u.district_role);
    } else if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
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
    setRole(user.role || 'member');
    setCity(user.city || '');
    setDistrict(user.district || user.city || '');
    setDistrictRole((user.districtRole || user.district_role || '') as string);
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
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`;

      if (editingId) {
        // UPDATE existing user
        await updateUser(editingId, {
          name: name.trim(),
          role,
          district: district.trim() || city.trim() || undefined,
          districtRole: districtRole || undefined,
          district_role: districtRole || undefined,
          city: city.trim(),
          state: state.trim(),
          communityId: comm?.id || selectedCommunityId || '',
          communityName: comm?.name || '',
          avatar: avatar.trim() || defaultAvatar,
          documentUrl: documentUrl.trim() || undefined,
          paymentUtr: paymentUtr.trim() || undefined,
          paymentScreenshotUrl: paymentScreenshotUrl.trim() || undefined,
          plainPassword: plainPassword.trim() || undefined,
        });

        showToast('User account updated successfully!', 'success');
      } else {
        // CREATE new user (Matching website logic)
        const finalEmail = email.trim().toLowerCase() || `${phone.trim()}@mfct.org`;
        const newUser: User = {
          id: `usr_${Date.now()}`,
          name: name.trim(),
          email: finalEmail,
          phone: phone.trim(),
          role,
          district: district.trim() || city.trim() || 'Bareilly',
          districtRole: districtRole || undefined,
          district_role: districtRole || undefined,
          avatar: avatar.trim() || defaultAvatar,
          communityId: comm?.id || selectedCommunityId || '',
          communityName: comm?.name || '',
          membershipId: `MEM-${Date.now().toString().slice(-4)}`,
          isVerified: true,
          joinDate: new Date().toISOString(),
          city: city.trim() || 'Bareilly',
          state: state.trim() || 'UP',
          documentUrl: documentUrl.trim() || undefined,
          paymentUtr: paymentUtr.trim() || undefined,
          paymentScreenshotUrl: paymentScreenshotUrl.trim() || undefined,
        };

        await createUser({
          ...newUser,
          password: plainPassword.trim(),
        });

        showToast('User account created successfully!', 'success');
      }

      // Pre-warm translations for name, city, state in Hindi and Urdu
      if (name) {
        autoTranslateText(name, 'hi').catch(() => {});
        autoTranslateText(name, 'ur').catch(() => {});
      }
      if (city) {
        autoTranslateText(city, 'hi').catch(() => {});
        autoTranslateText(city, 'ur').catch(() => {});
      }
      if (state) {
        autoTranslateText(state, 'hi').catch(() => {});
        autoTranslateText(state, 'ur').catch(() => {});
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
    <SafeAreaView style={[s.screen, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Toast Notification */}
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
          <UsersIcon color={activeSubTab === 'list' ? '#fff' : theme.textSub} size={15} />
          <Text style={[s.tabBtnText, activeSubTab === 'list' ? s.tabBtnTextActive : { color: theme.textSub }]}>
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
          style={[s.tabBtn, activeSubTab === 'create' ? s.tabBtnActive : { backgroundColor: theme.chipIdle }]}
        >
          {editingId ? (
            <Edit3 color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={15} />
          ) : (
            <PlusCircle color={activeSubTab === 'create' ? '#fff' : theme.textSub} size={15} />
          )}
          <Text style={[s.tabBtnText, activeSubTab === 'create' ? s.tabBtnTextActive : { color: theme.textSub }]}>
            {editingId ? 'Edit User' : '+ Add User'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST TAB ── */}
      {activeSubTab === 'list' && (
        <>
          {/* Search Bar */}
          <View style={[s.searchBarContainer, { backgroundColor: theme.tabHeaderBg, borderBottomColor: theme.tabBorder }]}>
            <Search color={theme.textSub} size={16} style={s.searchIcon} />
            <TextInput
              style={[
                s.searchInput,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.cardBorder,
                  color: theme.textMain,
                },
              ]}
              placeholder="Search users by name, phone, email..."
              placeholderTextColor={theme.textSub}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={s.searchClearBtn}>
                <X color={theme.textSub} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Role Filter Pills */}
          <View style={{ backgroundColor: theme.tabHeaderBg, borderBottomWidth: 1, borderBottomColor: theme.tabBorder, paddingVertical: 8, paddingHorizontal: 12 }}>
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
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: isSelected ? (rf.id === 'district_committee' ? '#d97706' : theme.primary) : (isDark ? '#1e293b' : '#f1f5f9'),
                      borderWidth: 1,
                      borderColor: isSelected ? 'transparent' : theme.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isSelected ? '#fff' : theme.chipIdleText,
                      }}
                    >
                      {rf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {loading ? (
            <View style={s.loadingCenter}>
              <ActivityIndicator color="#10b981" size="large" />
              <Text style={[s.loadingText, { color: theme.textSub }]}>Loading registered users...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={s.listPad}>
              {filteredUsers.length === 0 ? (
                <View style={s.empty}>
                  <UsersIcon color={theme.textSub} size={44} />
                  <Text style={[s.emptyText, { color: theme.textSub }]}>
                    {searchQuery ? 'No users matching your search' : 'No users registered yet'}
                  </Text>
                  <TouchableOpacity
                    style={[s.emptyAddBtn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      resetForm();
                      setActiveSubTab('create');
                    }}
                  >
                    <PlusCircle color="#fff" size={16} />
                    <Text style={s.emptyAddBtnText}>Create First User</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredUsers.map(user => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    lang={lang}
                    theme={theme}
                    isDark={isDark}
                    isCurrent={user.id === activeUser?.id}
                    onEdit={handleOpenEdit}
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
                {editingId ? 'Edit User Account' : 'Create New User'}
              </Text>
              <Text style={[s.formSubTitle, { color: theme.textSub }]}>
                {editingId
                  ? 'Update permissions, details, and community assigned.'
                  : 'Register a new user account with assigned role and details.'}
              </Text>
            </View>
          </View>

          {/* Section 1: Basic Information */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>Personal Details</Text>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>Full Name *</Text>
              <TextInput
                style={[
                  s.input,
                  { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                ]}
                placeholder="e.g. Mohd Zaid"
                placeholderTextColor={theme.textSub}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={s.row2}>
              <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>Phone Number *</Text>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                    !!editingId && s.disabledInput,
                  ]}
                  placeholder="e.g. 8630675154"
                  placeholderTextColor={theme.textSub}
                  keyboardType="phone-pad"
                  editable={!editingId}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              <View style={s.gap10} />
              <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>Email Address</Text>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                    !!editingId && s.disabledInput,
                  ]}
                  placeholder="e.g. zaid@example.com"
                  placeholderTextColor={theme.textSub}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingId}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>
                {editingId ? 'Password (Leave blank to keep unchanged)' : 'Login Password *'}
              </Text>
              <View style={s.passwordInputWrap}>
                <Lock color={theme.textSub} size={17} style={s.inputLeftIcon} />
                <TextInput
                  style={[
                    s.input,
                    s.inputPadded,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain, flex: 1 },
                  ]}
                  placeholder={editingId ? '••••••••' : 'Set secure login password'}
                  placeholderTextColor={theme.textSub}
                  secureTextEntry={!showPassword}
                  value={plainPassword}
                  onChangeText={setPlainPassword}
                />
                <TouchableOpacity
                  style={s.passwordToggleBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color={theme.textSub} size={18} />
                  ) : (
                    <Eye color={theme.textSub} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 2: Role & Community */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>Role & Community Assignment</Text>

            {/* Roles */}
            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>Assigned Role *</Text>
              <View style={s.roleChipWrap}>
                {ROLES.map(r => {
                  const isSelected = role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setRole(r.id)}
                      style={[
                        s.roleChip,
                        isSelected
                          ? { backgroundColor: r.color, borderColor: r.color }
                          : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          s.roleChipText,
                          isSelected ? { color: '#fff' } : { color: theme.chipIdleText },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Select Community */}
            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>Select Community / Chapter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCommunityId('')}
                  style={[
                    s.commChip,
                    !selectedCommunityId
                      ? s.commChipActive
                      : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder },
                  ]}
                >
                  <Text
                    style={[
                      s.commChipText,
                      !selectedCommunityId ? s.commChipTextActive : { color: theme.chipIdleText },
                    ]}
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
                      style={[
                        s.commChip,
                        isSelected
                          ? s.commChipActive
                          : { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder },
                      ]}
                    >
                      <Text
                        style={[
                          s.commChipText,
                          isSelected ? s.commChipTextActive : { color: theme.chipIdleText },
                        ]}
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
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>Location & Payment Details</Text>

            <View style={s.row2}>
              <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>City</Text>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="e.g. Bareilly"
                  placeholderTextColor={theme.textSub}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={s.gap10} />
              <View style={s.flex1}>
                <Text style={[s.label, { color: theme.textSub }]}>State</Text>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="e.g. UP"
                  placeholderTextColor={theme.textSub}
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <View style={s.formGroup}>
              <Text style={[s.label, { color: theme.textSub }]}>UTR / Transaction Number (Optional)</Text>
              <View style={s.inputWithIcon}>
                <CreditCard color={theme.primary} size={17} style={s.inputLeftIcon} />
                <TextInput
                  style={[
                    s.input,
                    s.inputPadded,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="e.g. 420199381029"
                  placeholderTextColor={theme.textSub}
                  value={paymentUtr}
                  onChangeText={setPaymentUtr}
                />
              </View>
            </View>
          </View>

          {/* Section 4: Documents & Photos Upload */}
          <View style={[s.formCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[s.sectionHeading, { color: theme.primary }]}>Documents & Photo Attachments</Text>

            {/* 1. Profile Photo */}
            <View style={s.uploadItem}>
              <Text style={[s.label, { color: theme.textSub }]}>Profile Photo</Text>
              {avatar ? (
                <View style={s.uploadPreviewRow}>
                  <Image source={{ uri: avatar }} style={s.uploadThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.uploadAttachedText, { color: theme.textMain }]}>Profile Photo Attached</Text>
                    <View style={s.thumbActionRow}>
                      <TouchableOpacity
                        style={s.thumbChangeBtn}
                        onPress={() => handlePickImage('avatar')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text style={s.thumbBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.thumbRemoveBtn}
                        onPress={() => setAvatar('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.uploadBoxBtn, { borderColor: theme.cardBorder, backgroundColor: theme.inputBg }]}
                  onPress={() => handlePickImage('avatar')}
                >
                  <Upload color={theme.primary} size={18} />
                  <Text style={[s.uploadBoxBtnText, { color: theme.textMain }]}>Choose Profile Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Aadhaar / KYC Document */}
            <View style={s.uploadItem}>
              <Text style={[s.label, { color: theme.textSub }]}>Aadhaar / ID Proof</Text>
              {documentUrl ? (
                <View style={s.uploadPreviewRow}>
                  <Image source={{ uri: documentUrl }} style={s.uploadThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.uploadAttachedText, { color: theme.textMain }]}>ID Document Attached</Text>
                    <View style={s.thumbActionRow}>
                      <TouchableOpacity
                        style={s.thumbChangeBtn}
                        onPress={() => handlePickImage('document')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text style={s.thumbBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.thumbRemoveBtn}
                        onPress={() => setDocumentUrl('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.uploadBoxBtn, { borderColor: theme.cardBorder, backgroundColor: theme.inputBg }]}
                  onPress={() => handlePickImage('document')}
                >
                  <FileText color={theme.primary} size={18} />
                  <Text style={[s.uploadBoxBtnText, { color: theme.textMain }]}>Upload ID Document</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Payment Screenshot */}
            <View style={s.uploadItem}>
              <Text style={[s.label, { color: theme.textSub }]}>Payment Screenshot</Text>
              {paymentScreenshotUrl ? (
                <View style={s.uploadPreviewRow}>
                  <Image source={{ uri: paymentScreenshotUrl }} style={s.uploadThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.uploadAttachedText, { color: theme.textMain }]}>Screenshot Attached</Text>
                    <View style={s.thumbActionRow}>
                      <TouchableOpacity
                        style={s.thumbChangeBtn}
                        onPress={() => handlePickImage('screenshot')}
                      >
                        <RefreshCw color="#fff" size={11} />
                        <Text style={s.thumbBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.thumbRemoveBtn}
                        onPress={() => setPaymentScreenshotUrl('')}
                      >
                        <X color="#fff" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[s.uploadBoxBtn, { borderColor: theme.cardBorder, backgroundColor: theme.inputBg }]}
                  onPress={() => handlePickImage('screenshot')}
                >
                  <CreditCard color={theme.primary} size={18} />
                  <Text style={[s.uploadBoxBtnText, { color: theme.textMain }]}>Upload Payment Receipt</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Direct URL Toggle */}
            <TouchableOpacity
              onPress={() => setShowUrlInputs(!showUrlInputs)}
              style={s.urlToggleBtn}
            >
              <Text style={[s.urlToggleText, { color: theme.primary }]}>
                {showUrlInputs ? '▲ Hide Direct URL Inputs' : '▼ Or enter direct URLs manually'}
              </Text>
            </TouchableOpacity>

            {showUrlInputs && (
              <View style={{ gap: 10, marginTop: 10 }}>
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="Avatar URL: https://..."
                  placeholderTextColor={theme.textSub}
                  value={avatar}
                  onChangeText={setAvatar}
                />
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="Document URL: https://..."
                  placeholderTextColor={theme.textSub}
                  value={documentUrl}
                  onChangeText={setDocumentUrl}
                />
                <TextInput
                  style={[
                    s.input,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textMain },
                  ]}
                  placeholder="Payment Screenshot URL: https://..."
                  placeholderTextColor={theme.textSub}
                  value={paymentScreenshotUrl}
                  onChangeText={setPaymentScreenshotUrl}
                />
              </View>
            )}
          </View>

          {/* Submit Row */}
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
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={18} />
                  <Text style={s.submitBtnText}>
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
        <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg }]}>
          <View style={[s.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={s.deleteIconCircle}>
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text style={[s.deleteModalTitle, { color: theme.textMain }]}>Delete User Account?</Text>
            <Text style={[s.deleteModalSub, { color: theme.textSub }]}>
              Are you sure you want to delete this user? All user data and access will be permanently removed.
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

  // Search Bar
  searchBarContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 26,
    zIndex: 2,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 38,
    paddingRight: 38,
    paddingVertical: 9,
    fontSize: 13,
  },
  searchClearBtn: {
    position: 'absolute',
    right: 24,
    padding: 4,
    zIndex: 2,
  },

  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },

  listPad: { padding: 14, paddingBottom: 90 },
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

  // User Card
  userCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e2e8f0',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '800' },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  userNameText: { fontSize: 15, fontWeight: '800' },
  membershipText: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  contactText: { fontSize: 11, fontWeight: '500' },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },

  metaDetailsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    borderRadius: 10,
    gap: 12,
    marginBottom: 10,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItemText: { fontSize: 11, fontWeight: '600' },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selfAccountTag: { fontSize: 11, fontStyle: 'italic', marginRight: 'auto' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  // Form
  formPad: { padding: 16, paddingBottom: 100 },
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
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  formGroup: { marginBottom: 12 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    fontSize: 14,
  },
  disabledInput: {
    opacity: 0.6,
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
  passwordInputWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordToggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  row2: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flex1: { flex: 1 },
  gap10: { width: 10 },

  // Role selector
  roleChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleChipText: { fontSize: 12, fontWeight: '700' },

  // Community Selector
  commChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  commChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  commChipText: { fontSize: 12, fontWeight: '600' },
  commChipTextActive: { color: '#fff', fontWeight: '700' },

  // Upload sections
  uploadItem: {
    marginBottom: 12,
  },
  uploadBoxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadBoxBtnText: { fontSize: 12, fontWeight: '700' },
  uploadPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  uploadThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#e2e8f0' },
  uploadAttachedText: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  thumbActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thumbChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  thumbBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  thumbRemoveBtn: {
    backgroundColor: '#ef4444',
    padding: 4,
    borderRadius: 6,
  },
  urlToggleBtn: {
    marginTop: 6,
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
