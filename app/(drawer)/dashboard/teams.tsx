import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { TeamListSkeleton } from '../../../src/components/SkeletonLoader';
import {
  Users,
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  Shield,
  Award,
  Layers,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Network,
  Trash2,
  CheckCircle2,
  Clock,
  Check,
} from 'lucide-react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  getLanguageCode,
  translateRole,
  translateRoleResponsibility,
} from '../../../src/lib/translateEntity';
import {
  getTeams,
  createTeam,
  updateTeam,
  saveTeams,
  type DistrictTeamUnit,
  type TeamMember,
} from '../../../src/services/teamService';
import { getUsers, updateUser } from '../../../src/services/userService';
import type { User } from '../../../src/types';

export default function DistrictTeamsScreen() {
  const { activeUser, currentRole } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);

  // Role-based access matching TeamTab.tsx
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

  const isGenSecretary =
    currentRole === 'district_gen_secretary' ||
    rawDistRole === 'district_gen_secretary' ||
    rawDistRole.includes('gen_sec') ||
    rawDistRole.includes('general');

  const isDistrictPresident =
    currentRole === 'district_president' ||
    rawDistRole === 'district_president' ||
    rawDistRole.includes('president');

  const [teams, setTeams] = useState<DistrictTeamUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'block' | 'city'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Registered users for picker
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  // New Team Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formUnitName, setFormUnitName] = useState('');
  const [formUnitType, setFormUnitType] = useState<'block' | 'city'>('block');
  const [formTehsil, setFormTehsil] = useState('');
  const [formPresidentUserId, setFormPresidentUserId] = useState('');
  const [formPresidentName, setFormPresidentName] = useState('');
  const [formPresidentPhone, setFormPresidentPhone] = useState('');
  const [formSecretaryName, setFormSecretaryName] = useState('');
  const [formSecretaryPhone, setFormSecretaryPhone] = useState('');
  const [formCoordinatorName, setFormCoordinatorName] = useState('');
  const [formCoordinatorPhone, setFormCoordinatorPhone] = useState('');
  const [formFormedDate, setFormFormedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formVolunteers, setFormVolunteers] = useState('20');
  const [formStatus, setFormStatus] = useState<'active' | 'in_formation' | 'pending'>('pending');
  const [formObjectives, setFormObjectives] = useState('');
  // Head user picker search
  const [headPickerSearch, setHeadPickerSearch] = useState('');
  const [isHeadPickerOpen, setIsHeadPickerOpen] = useState(false);

  // Add Member Modal
  const [selectedTeam, setSelectedTeam] = useState<DistrictTeamUnit | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Executive Member (कार्यकारिणी सदस्य)');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  // Member user picker search
  const [memberPickerSearch, setMemberPickerSearch] = useState('');
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const data = await getTeams(activeUser?.district || activeUser?.city);
        setTeams(data || []);
      } catch (e) {
        console.error('Failed to load teams:', e);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();

    // Load registered users for picker (exclude district role holders)
    const districtRoles = [
      'district_president', 'district_coordinator', 'district_gen_secretary',
      'district_secretary', 'district_finance_coord', 'community_admin',
    ];
    getUsers(activeUser?.city || '')
      .then((users) => {
        const filtered = users.filter((u) => !districtRoles.includes(u.districtRole || ''));
        setRegisteredUsers(filtered);
      })
      .catch(() => {});
  }, []);

  const saveTeams = async (updated: DistrictTeamUnit[]) => {
    setTeams(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save teams:', e);
    }
  };

  const handleCreateTeam = async () => {
    if (!isGenSecretary) {
      Alert.alert(
        lang === 'hi' ? 'अनुमति नहीं' : 'Permission Denied',
        lang === 'hi'
          ? 'केवल जिला महासचिव ही नई टीम गठित कर सकते हैं।'
          : 'Only District General Secretary can form teams.'
      );
      return;
    }
    if (!formUnitName.trim()) {
      Alert.alert(lang === 'hi' ? 'त्रुटि' : 'Error', lang === 'hi' ? 'कृपया इकाई का नाम दर्ज करें।' : 'Please enter unit name.');
      return;
    }
    if (!formPresidentName.trim() || !formSecretaryName.trim()) {
      Alert.alert(lang === 'hi' ? 'त्रुटि' : 'Error', lang === 'hi' ? 'कृपया अध्यक्ष और सचिव का नाम दर्ज करें।' : 'Please enter President and Secretary names.');
      return;
    }

    const activeDistrict = activeUser?.city || activeUser?.district || '';

    const newUnit: DistrictTeamUnit = {
      id: `team-${Date.now()}`,
      unitName: formUnitName.trim(),
      unitType: formUnitType,
      tehsilOrZone: formTehsil.trim() || (formUnitType === 'block' ? 'Rural Block' : 'Urban Unit'),
      district: activeDistrict || activeUser?.communityName || 'Main District',
      presidentName: formPresidentName.trim(),
      presidentPhone: formPresidentPhone.trim(),
      secretaryName: formSecretaryName.trim(),
      secretaryPhone: formSecretaryPhone.trim(),
      coordinatorName: formCoordinatorName.trim() || undefined,
      coordinatorPhone: formCoordinatorPhone.trim() || undefined,
      formedDate: formFormedDate,
      activeVolunteersCount: parseInt(formVolunteers, 10) || 0,
      status: 'pending', // starts pending until District President approves
      objectives: formObjectives.trim() || 'Local public welfare and volunteer coordination.',
      members: [],
    };

    const updated = [newUnit, ...teams];
    await saveTeams(updated);

    // Update team head's district and district role
    if (formPresidentUserId) {
      updateUser(formPresidentUserId, {
        district: activeDistrict,
        districtRole: 'team_head',
      }).catch(() => {});
    }

    // Reset
    setFormUnitName('');
    setFormUnitType('block');
    setFormTehsil('');
    setFormPresidentUserId('');
    setFormPresidentName('');
    setFormPresidentPhone('');
    setFormSecretaryName('');
    setFormSecretaryPhone('');
    setFormCoordinatorName('');
    setFormCoordinatorPhone('');
    setFormVolunteers('20');
    setFormStatus('pending');
    setFormObjectives('');
    setHeadPickerSearch('');
    setIsHeadPickerOpen(false);
    setIsCreateModalOpen(false);

    Alert.alert(
      lang === 'hi' ? 'सफल' : 'Success',
      lang === 'hi'
        ? 'नई टीम इकाई गठित की गई (जिला अध्यक्ष / सुपर एडमिन के अनुमोदन हेतु लंबित)।'
        : 'New team unit formed (Pending approval by District President or Super Admin).'
    );
  };

  const handleApproveTeam = async (teamId: string) => {
    if (!isDistrictPresident && !isSuperOrExecutive) return;
    const updated = teams.map((t) => (t.id === teamId ? { ...t, status: 'active' as const } : t));
    await saveTeams(updated);
    Alert.alert(
      lang === 'hi' ? 'स्वीकृत' : 'Approved',
      lang === 'hi' ? 'टीम सफलतापूर्वक अनुमोदित कर दी गई।' : 'Team approved successfully.'
    );
  };

  const handleAddMember = async () => {
    if (!isGenSecretary) {
      Alert.alert(
        lang === 'hi' ? 'अनुमति नहीं' : 'Permission Denied',
        lang === 'hi'
          ? 'केवल जिला महासचिव ही सदस्य जोड़ सकते हैं।'
          : 'Only District General Secretary can add members.'
      );
      return;
    }
    if (!selectedTeam || !newMemberName.trim()) return;

    const activeDistrict = activeUser?.city || activeUser?.district || '';

    const newMem: TeamMember = {
      id: newMemberUserId || `mem-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
      phone: newMemberPhone.trim() || '+91 98000 00000',
      appointedDate: new Date().toISOString().split('T')[0],
    };

    const updated = teams.map((t) => {
      if (t.id === selectedTeam.id) {
        return {
          ...t,
          members: [...(t.members || []), newMem],
          activeVolunteersCount: (t.activeVolunteersCount || 0) + 1,
        };
      }
      return t;
    });

    await saveTeams(updated);

    // Update the selected registered user's district and district role
    if (newMemberUserId) {
      updateUser(newMemberUserId, {
        district: activeDistrict,
        districtRole: 'team_member',
      }).catch(() => {});
    }

    setSelectedTeam(null);
    setNewMemberUserId('');
    setNewMemberName('');
    setNewMemberPhone('');
    setMemberPickerSearch('');
    setIsMemberPickerOpen(false);

    Alert.alert(
      lang === 'hi' ? 'सफल' : 'Success',
      lang === 'hi' ? 'पदाधिकारी सफलतापूर्वक जोड़ लिया गया।' : 'Office bearer appointed successfully.'
    );
  };

  const handleDeleteMember = (teamId: string, memberId: string) => {
    if (!isGenSecretary) return;
    Alert.alert(
      lang === 'hi' ? 'पदाधिकारी हटाएं' : 'Remove Officer',
      lang === 'hi'
        ? 'क्या आप इस पदाधिकारी को हटाना चाहते हैं?'
        : 'Are you sure you want to remove this office bearer?',
      [
        { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'hi' ? 'हटाएं' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = teams.map((t) => {
              if (t.id === teamId) {
                const members = (t.members || []).filter((m) => m.id !== memberId);
                return {
                  ...t,
                  members,
                  activeVolunteersCount: Math.max(0, (t.activeVolunteersCount || 1) - 1),
                };
              }
              return t;
            });
            await saveTeams(updated);
          },
        },
      ]
    );
  };

  const filteredTeams = teams.filter((t) => {
    if (filter === 'block' && t.unitType !== 'block') return false;
    if (filter === 'city' && t.unitType !== 'city') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.unitName.toLowerCase().includes(q);
      const matchTehsil = t.tehsilOrZone.toLowerCase().includes(q);
      const matchPres = t.presidentName.toLowerCase().includes(q);
      const matchSec = t.secretaryName.toLowerCase().includes(q);
      if (!matchName && !matchTehsil && !matchPres && !matchSec) return false;
    }
    return true;
  });

  const totalUnits = teams.length;
  const blockCount = teams.filter((t) => t.unitType === 'block').length;
  const cityCount = teams.filter((t) => t.unitType === 'city').length;
  const totalOfficers = teams.reduce((acc, t) => acc + (t.members?.length || 0) + 2, 0);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (loading) {
    return <TeamListSkeleton isDark={isDark} />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* General Secretary Mandate & Responsibility Card */}
      <View className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent border border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-emerald-600 items-center justify-center">
              <Network color="#fff" size={18} />
            </View>
            <View>
              <Text className="text-emerald-900 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                {translateRole('district_gen_secretary', lang)}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'hi'
                  ? 'ब्लॉक एवं नगर कार्यकारिणी टीम गठन व संगठन विस्तार'
                  : lang === 'ur'
                  ? 'بلاک اور شہری تنظیمی ٹیمیں اور توسیع'
                  : 'Block & City Units Formation & Organization'}
              </Text>
            </View>
          </View>
          <View className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
            <Text className="text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
              {lang === 'hi' ? 'इकाई गठन' : lang === 'ur' ? 'تشکیل' : 'Unit Formation'}
            </Text>
          </View>
        </View>

        <View className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/50">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {lang === 'hi' ? 'प्रमुख दायित्व:' : lang === 'ur' ? 'اہم ذمہ داری:' : 'Mandated Responsibility:'}
          </Text>
          <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-5">
            {translateRoleResponsibility('district_gen_secretary', lang)}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-4">
            {lang === 'hi'
              ? 'तहसील, ब्लॉक और नगर पालिका स्तर पर समर्पित टीमों का गठन, पदाधिकारियों की नियुक्ति एवं सदस्यता विस्तार।'
              : lang === 'ur'
              ? 'تحصیل، بلاک اور بلدیہ سطح پر ٹیموں کی باضابطہ تشکیل اور عہدیداران کی تعیناتی۔'
              : 'Establishment of dedicated Tehsil, Block, and City units, appointment of unit presidents/secretaries, and membership growth.'}
          </Text>
        </View>
      </View>

      {/* KPI Stats Grid */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <Text className="text-slate-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'कुल इकाइयाँ' : 'Total'}</Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalUnits}</Text>
        </View>
        <View className="flex-1 bg-blue-500/10 border border-blue-300 dark:border-blue-800/50 p-3 rounded-xl">
          <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'ब्लॉक' : 'Block'}</Text>
          <Text className="text-lg font-bold text-blue-900 dark:text-blue-300 mt-1">{blockCount}</Text>
        </View>
        <View className="flex-1 bg-amber-500/10 border border-amber-300 dark:border-amber-800/50 p-3 rounded-xl">
          <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'नगर / शहर' : 'City'}</Text>
          <Text className="text-lg font-bold text-amber-900 dark:text-amber-300 mt-1">{cityCount}</Text>
        </View>
        <View className="flex-1 bg-purple-500/10 border border-purple-300 dark:border-purple-800/50 p-3 rounded-xl">
          <Text className="text-purple-700 dark:text-purple-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'पदाधिकारी' : 'Leaders'}</Text>
          <Text className="text-lg font-bold text-purple-900 dark:text-purple-300 mt-1">{totalOfficers}</Text>
        </View>
      </View>

      {/* Action Bar: Search & New Team CTA */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-xs text-slate-800 dark:text-slate-100 p-0"
            placeholder={lang === 'hi' ? 'टीम नाम, तहसील या अध्यक्ष खोजें...' : 'Search team, tehsil, president...'}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {isGenSecretary && (
          <TouchableOpacity
            className="bg-emerald-600 active:bg-emerald-700 px-3 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-xs font-bold">
              {lang === 'hi' ? 'नई टीम' : lang === 'ur' ? 'نئی ٹیم' : 'New Team'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="flex-row bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl mb-4">
        <TouchableOpacity
          className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'all' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
          onPress={() => setFilter('all')}
        >
          <Text className={`text-xs font-bold ${filter === 'all' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'सभी' : lang === 'ur' ? 'تمام' : 'All'} ({totalUnits})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'block' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
          onPress={() => setFilter('block')}
        >
          <Text className={`text-xs font-bold ${filter === 'block' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'ब्लॉक (ग्रामीण)' : lang === 'ur' ? 'بلاک' : 'Block Units'} ({blockCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'city' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
          onPress={() => setFilter('city')}
        >
          <Text className={`text-xs font-bold ${filter === 'city' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'नगर / शहर' : lang === 'ur' ? 'شہری' : 'City Units'} ({cityCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center my-4">
          <Network size={40} color="#94a3b8" />
          <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-3">
            {lang === 'hi' ? 'कोई टीम इकाई नहीं मिली' : 'No team units found'}
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            {lang === 'hi' ? 'नई टीम गठित करने के लिए "नई टीम" बटन दबाएं।' : 'Tap "New Team" to establish a new block or city unit.'}
          </Text>
        </View>
      ) : (
        <View className="gap-3 pb-8">
          {filteredTeams.map((team) => {
            const isExpanded = expandedId === team.id;
            const isBlock = team.unitType === 'block';

            return (
              <View
                key={team.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <View className="p-4">
                  {/* Top Badge Row */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5 flex-wrap flex-1 mr-2">
                      <View
                        className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${
                          team.status === 'pending'
                            ? 'bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800'
                            : isBlock
                            ? 'bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800'
                            : 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {team.status === 'pending' ? (
                          <Clock size={10} color="#d97706" />
                        ) : isBlock ? (
                          <Layers size={10} color="#2563eb" />
                        ) : (
                          <Building2 size={10} color="#059669" />
                        )}
                        <Text
                          className={`text-[10px] font-bold ${
                            team.status === 'pending'
                              ? 'text-amber-800 dark:text-amber-300'
                              : isBlock
                              ? 'text-blue-800 dark:text-blue-300'
                              : 'text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {team.status === 'pending'
                            ? (lang === 'hi' ? 'अनुमोदन लंबित' : lang === 'ur' ? 'منظوری زیر التواء' : 'Pending Approval')
                            : isBlock
                            ? (lang === 'hi' ? 'ब्लॉक इकाई' : 'Block Unit')
                            : (lang === 'hi' ? 'नगर इकाई' : 'City Unit')}
                        </Text>
                      </View>

                      <Text className="text-[10px] text-slate-400">•</Text>
                      <Text className="text-[10px] text-slate-500 font-semibold">{team.tehsilOrZone}</Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Users size={12} color="#10b981" />
                        <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {team.activeVolunteersCount} {lang === 'hi' ? 'कार्यकर्ता' : 'Volunteers'}
                        </Text>
                      </View>

                      {/* District President & Super/Executive Admin: Approve button for pending teams */}
                      {(isDistrictPresident || isSuperOrExecutive) && team.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleApproveTeam(team.id)}
                          className="bg-emerald-600 active:bg-emerald-700 px-2.5 py-1 rounded-xl flex-row items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 size={12} color="#fff" />
                          <Text className="text-white text-[10px] font-bold">
                            {lang === 'hi' ? 'स्वीकृत करें' : lang === 'ur' ? 'منظور کریں' : 'Approve'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-slate-900 dark:text-white font-bold text-sm leading-5 mb-2">
                    {team.unitName}
                  </Text>

                  {/* Core Leadership Grid */}
                  <View className="flex-row gap-2 mb-2.5">
                    {/* President */}
                    <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {lang === 'hi' ? 'इकाई अध्यक्ष' : 'President'}
                      </Text>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                        {team.presidentName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${team.presidentPhone}`)}
                        className="flex-row items-center gap-1 mt-1"
                      >
                        <Phone size={10} color="#10b981" />
                        <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" numberOfLines={1}>
                          {team.presidentPhone}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Secretary */}
                    <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {lang === 'hi' ? 'इकाई सचिव' : 'Secretary'}
                      </Text>
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100" numberOfLines={1}>
                        {team.secretaryName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${team.secretaryPhone}`)}
                        className="flex-row items-center gap-1 mt-1"
                      >
                        <Phone size={10} color="#10b981" />
                        <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400" numberOfLines={1}>
                          {team.secretaryPhone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Objectives */}
                  <Text className="text-[11px] text-slate-600 dark:text-slate-400 leading-4 mb-3" numberOfLines={2}>
                    {team.objectives}
                  </Text>

                  {/* Action row */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    {isGenSecretary ? (
                      <TouchableOpacity
                        onPress={() => setSelectedTeam(team)}
                        className="flex-row items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg"
                      >
                        <UserPlus size={12} color="#10b981" />
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'hi' ? '+ सदस्य जोड़ें' : '+ Add Member'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}

                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : team.id)}
                      className="flex-row items-center gap-1 py-1 px-2"
                    >
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {isExpanded
                          ? lang === 'hi' ? 'छुपाएं' : 'Hide'
                          : `${lang === 'hi' ? 'कार्यकारिणी' : 'Members'} (${team.members?.length || 0})`}
                      </Text>
                      {isExpanded ? <ChevronUp size={14} color="#10b981" /> : <ChevronDown size={14} color="#10b981" />}
                    </TouchableOpacity>
                  </View>

                  {/* Expanded Members */}
                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      {team.members && team.members.length > 0 ? (
                        team.members.map((mem) => (
                          <View
                            key={mem.id}
                            className="flex-row items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                          >
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{mem.name}</Text>
                              <Text className="text-[10px] text-slate-400">{mem.role}</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${mem.phone}`)}
                                className="flex-row items-center gap-1"
                              >
                                <Phone size={11} color="#10b981" />
                                <Text className="text-[11px] font-bold text-emerald-600">{mem.phone}</Text>
                              </TouchableOpacity>
                              {isGenSecretary && (
                                <TouchableOpacity
                                  onPress={() => handleDeleteMember(team.id, mem.id)}
                                  className="p-1 rounded-md"
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Trash2 size={13} color="#ef4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text className="text-[11px] text-slate-400 italic py-1 text-center">
                          {lang === 'hi' ? 'अन्य सदस्य जोड़ने के लिए "+ सदस्य जोड़ें" दबाएं।' : 'Tap "+ Add Member" to appoint office bearers.'}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* New Team Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88%] border-t border-slate-200 dark:border-slate-800 p-5">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'नई ब्लॉक / नगर टीम गठित करें' : 'Form Block / City Team'}
                </Text>
                <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {lang === 'hi' ? 'जिला महासचिव आधिकारिक पंजीयन' : 'District General Secretary Official Roster'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Unit Type */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'hi' ? 'इकाई प्रकार' : 'Unit Type'}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      formUnitType === 'block' ? 'bg-blue-500/15 border-blue-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    onPress={() => setFormUnitType('block')}
                  >
                    <Text className={`text-xs font-bold ${formUnitType === 'block' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {lang === 'hi' ? 'ब्लॉक इकाई' : 'Block Unit'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      formUnitType === 'city' ? 'bg-amber-500/15 border-amber-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    onPress={() => setFormUnitType('city')}
                  >
                    <Text className={`text-xs font-bold ${formUnitType === 'city' ? 'text-amber-600' : 'text-slate-500'}`}>
                      {lang === 'hi' ? 'नगर / शहर इकाई' : 'City Unit'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Unit Name */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'इकाई का नाम *' : 'Unit Name *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="e.g. Nawabganj Block Executive Committee"
                  placeholderTextColor="#94a3b8"
                  value={formUnitName}
                  onChangeText={setFormUnitName}
                />
              </View>

              {/* Tehsil */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'तहसील / क्षेत्र *' : 'Tehsil / Zone *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="e.g. Nawabganj Tehsil / City Ward 14"
                  placeholderTextColor="#94a3b8"
                  value={formTehsil}
                  onChangeText={setFormTehsil}
                />
              </View>

              {/* Team Head — registered user picker */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'टीम प्रमुख (अध्यक्ष) *' : 'Team Head (President) *'}
                </Text>

                {/* Picker toggle button */}
                <TouchableOpacity
                  className="flex-row items-center justify-between bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl mb-2"
                  onPress={() => setIsHeadPickerOpen(!isHeadPickerOpen)}
                >
                  <Text className="text-xs text-slate-800 dark:text-slate-100 flex-1" numberOfLines={1}>
                    {formPresidentName
                      ? formPresidentName
                      : lang === 'hi' ? '⚡ पंजीकृत सदस्य चुनें...' : '⚡ Select registered member...'}
                  </Text>
                  {formPresidentUserId ? (
                    <TouchableOpacity onPress={() => { setFormPresidentUserId(''); setFormPresidentName(''); setFormPresidentPhone(''); }}>
                      <X size={14} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    isHeadPickerOpen ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />
                  )}
                </TouchableOpacity>

                {/* Picker dropdown */}
                {isHeadPickerOpen && (
                  <View className="bg-white dark:bg-slate-900 border border-emerald-400 rounded-xl overflow-hidden mb-2">
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                      <Search size={12} color="#94a3b8" />
                      <TextInput
                        className="flex-1 ml-2 text-xs text-slate-800 dark:text-slate-100 p-0"
                        placeholder={lang === 'hi' ? 'नाम या फोन खोजें...' : 'Search name or phone...'}
                        placeholderTextColor="#94a3b8"
                        value={headPickerSearch}
                        onChangeText={setHeadPickerSearch}
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                      {registeredUsers
                        .filter((u) => {
                          if (!headPickerSearch.trim()) return true;
                          const q = headPickerSearch.toLowerCase();
                          return (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
                        })
                        .map((u) => (
                          <TouchableOpacity
                            key={u.id}
                            className="flex-row items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800"
                            onPress={() => {
                              setFormPresidentUserId(u.id);
                              setFormPresidentName(u.name || '');
                              setFormPresidentPhone(u.phone || '');
                              setIsHeadPickerOpen(false);
                              setHeadPickerSearch('');
                            }}
                          >
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{u.name}</Text>
                              <Text className="text-[10px] text-slate-400">{u.phone} {u.city ? `• ${u.city}` : ''}</Text>
                            </View>
                            {formPresidentUserId === u.id && <Check size={14} color="#10b981" />}
                          </TouchableOpacity>
                        ))}
                      {registeredUsers.length === 0 && (
                        <Text className="text-xs text-slate-400 italic text-center py-3">
                          {lang === 'hi' ? 'कोई पंजीकृत सदस्य नहीं मिला।' : 'No registered members found.'}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* Editable name & phone fields — auto-filled or manual */}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'नाम *' : 'Name *'}
                    </Text>
                    <TextInput
                      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                      placeholder="e.g. Mohammad Rashid"
                      placeholderTextColor="#94a3b8"
                      value={formPresidentName}
                      onChangeText={(v) => { setFormPresidentName(v); if (!v) setFormPresidentUserId(''); }}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      {lang === 'hi' ? 'फोन' : 'Phone'}
                    </Text>
                    <TextInput
                      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                      placeholder="+91 98371 00000"
                      placeholderTextColor="#94a3b8"
                      value={formPresidentPhone}
                      onChangeText={setFormPresidentPhone}
                    />
                  </View>
                </View>
              </View>

              {/* Secretary */}
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'सचिव नाम *' : 'Secretary Name *'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                    placeholder="e.g. Zubair Ahmad"
                    placeholderTextColor="#94a3b8"
                    value={formSecretaryName}
                    onChangeText={setFormSecretaryName}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'सचिव फोन' : 'Secretary Phone'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                    placeholder="+91 94120 00000"
                    placeholderTextColor="#94a3b8"
                    value={formSecretaryPhone}
                    onChangeText={setFormSecretaryPhone}
                  />
                </View>
              </View>

              {/* Volunteers Count */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'प्रारंभिक स्वयंसेवक संख्या' : 'Volunteers Count'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="20"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                  value={formVolunteers}
                  onChangeText={setFormVolunteers}
                />
              </View>

              {/* Objectives */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'कार्यक्षेत्र व उद्देश्य' : 'Objectives / Focus'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 h-16 text-start"
                  placeholder="Rural welfare, membership drives, emergency relief dispatch..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={formObjectives}
                  onChangeText={setFormObjectives}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                className="bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-xl items-center mb-6 shadow-sm"
                onPress={handleCreateTeam}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">
                  {lang === 'hi' ? 'इकाई गठित करें' : 'Form Team Unit'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      {selectedTeam && (
        <Modal visible={!!selectedTeam} animationType="fade" transparent>
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
              <View className="flex-row items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
                <View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'hi' ? 'नया पदाधिकारी नियुक्त करें' : 'Appoint Office Bearer'}
                  </Text>
                  <Text className="text-[10px] text-slate-400 truncate" numberOfLines={1}>
                    {selectedTeam.unitName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTeam(null)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Registered user picker for member */}
              <View className="mb-2.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? '⚡ पंजीकृत सदस्य चुनें (वैकल्पिक)' : '⚡ Select Registered Member (Optional)'}
                </Text>
                <TouchableOpacity
                  className="flex-row items-center justify-between bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-xl mb-2"
                  onPress={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                >
                  <Text className="text-xs text-slate-800 dark:text-slate-100 flex-1" numberOfLines={1}>
                    {newMemberName
                      ? newMemberName
                      : lang === 'hi' ? 'सदस्य चुनें...' : 'Select member...'}
                  </Text>
                  {newMemberUserId ? (
                    <TouchableOpacity onPress={() => { setNewMemberUserId(''); setNewMemberName(''); setNewMemberPhone(''); }}>
                      <X size={14} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    isMemberPickerOpen ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />
                  )}
                </TouchableOpacity>

                {isMemberPickerOpen && (
                  <View className="bg-white dark:bg-slate-900 border border-emerald-400 rounded-xl overflow-hidden mb-2">
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700">
                      <Search size={12} color="#94a3b8" />
                      <TextInput
                        className="flex-1 ml-2 text-xs text-slate-800 dark:text-slate-100 p-0"
                        placeholder={lang === 'hi' ? 'नाम या फोन खोजें...' : 'Search name or phone...'}
                        placeholderTextColor="#94a3b8"
                        value={memberPickerSearch}
                        onChangeText={setMemberPickerSearch}
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                      {registeredUsers
                        .filter((u) => {
                          if (!memberPickerSearch.trim()) return true;
                          const q = memberPickerSearch.toLowerCase();
                          return (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
                        })
                        .map((u) => (
                          <TouchableOpacity
                            key={u.id}
                            className="flex-row items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800"
                            onPress={() => {
                              setNewMemberUserId(u.id);
                              setNewMemberName(u.name || '');
                              setNewMemberPhone(u.phone || '');
                              setIsMemberPickerOpen(false);
                              setMemberPickerSearch('');
                            }}
                          >
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-800 dark:text-slate-200">{u.name}</Text>
                              <Text className="text-[10px] text-slate-400">{u.phone} {u.city ? `• ${u.city}` : ''}</Text>
                            </View>
                            {newMemberUserId === u.id && <Check size={14} color="#10b981" />}
                          </TouchableOpacity>
                        ))}
                      {registeredUsers.length === 0 && (
                        <Text className="text-xs text-slate-400 italic text-center py-3">
                          {lang === 'hi' ? 'कोई पंजीकृत सदस्य नहीं मिला।' : 'No registered members found.'}
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View className="mb-2.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'नाम *' : 'Name *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="e.g. Salman Mansoori"
                  placeholderTextColor="#94a3b8"
                  value={newMemberName}
                  onChangeText={(v) => { setNewMemberName(v); if (!v) setNewMemberUserId(''); }}
                />
              </View>

              <View className="mb-2.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'पदनाम *' : 'Designation *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="e.g. Youth Coordinator / Media Incharge"
                  placeholderTextColor="#94a3b8"
                  value={newMemberRole}
                  onChangeText={setNewMemberRole}
                />
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर *' : 'Phone Number *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="+91 98370 00000"
                  placeholderTextColor="#94a3b8"
                  value={newMemberPhone}
                  onChangeText={setNewMemberPhone}
                />
              </View>

              <TouchableOpacity
                className="bg-emerald-600 active:bg-emerald-700 py-3 rounded-xl items-center shadow-sm"
                onPress={handleAddMember}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-xs">
                  {lang === 'hi' ? 'नियुक्ति दर्ज करें' : 'Confirm Appointment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
