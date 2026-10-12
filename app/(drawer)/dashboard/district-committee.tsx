import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { DistrictCommitteeSkeleton } from '../../../src/components/SkeletonLoader';
import {
  Award,
  Users,
  Search,
  Phone,
  MessageCircle,
  UserPlus,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Trash2,
  ChevronDown,
  Shield,
  Eye,
} from 'lucide-react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import { User, DistrictRoleKey } from '../../../src/types';
import { DISTRICT_POSTS, STANDARD_DISTRICTS } from '../../../src/data/districtsData';
import { getUsers, updateUser } from '../../../src/services/userService';
import { getLanguageCode } from '../../../src/lib/translateEntity';

export default function DistrictCommitteeScreen() {
  const { activeUser, currentRole } = useAppState();
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const rawDistRole = (
    activeUser?.districtRole ||
    activeUser?.district_role ||
    (currentRole as string) ||
    ''
  )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  const isDistrictPresident =
    currentRole === 'district_president' ||
    rawDistRole === 'district_president' ||
    rawDistRole === 'district_coordinator' ||
    rawDistRole.includes('president');

  // Only District President can appoint or remove officers (matching website logic)
  const canManageOfficers = isDistrictPresident;

  const initialDist =
    activeUser?.district || activeUser?.city || STANDARD_DISTRICTS[0].id;

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDist);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Appoint modal state
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [activeSlotKey, setActiveSlotKey] = useState<DistrictRoleKey | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateScope, setCandidateScope] = useState<'district' | 'all'>('district');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to load users for committee:', err);
      showToast(tr('उपयोगकर्ता लोड करने में त्रुटि', 'صارفین لوڈ کرنے میں خرابی', 'Failed to load members'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Filter users by selected district
  const usersInDistrict = useMemo(() => {
    const target = selectedDistrict.toLowerCase().trim();
    return allUsers.filter(u => {
      const uDist = (u.district || u.city || '').toLowerCase().trim();
      return uDist === target || uDist.includes(target) || target.includes(uDist);
    });
  }, [allUsers, selectedDistrict]);

  // Map appointed officers per post key
  const committeeAssignments = useMemo(() => {
    const map: Record<string, User | null> = {};
    DISTRICT_POSTS.forEach(post => {
      const officer = usersInDistrict.find(u => {
        const uRole = (u.districtRole || u.district_role || u.role || '')
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '_');
        return uRole === post.key || uRole.includes(post.key.replace('district_', ''));
      });
      map[post.key] = officer || null;
    });
    return map;
  }, [usersInDistrict]);

  // Candidate users for appoint modal
  const eligibleCandidates = useMemo(() => {
    const base = candidateScope === 'district' ? usersInDistrict : allUsers;
    const q = candidateSearch.toLowerCase().trim();
    return base.filter(u => {
      if (!q) return true;
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchMemId = (u.membershipId || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchMemId;
    });
  }, [candidateScope, usersInDistrict, allUsers, candidateSearch]);

  const assignedCount = Object.values(committeeAssignments).filter(Boolean).length;
  const vacantCount = DISTRICT_POSTS.length - assignedCount;

  // Open Appoint Modal
  const handleOpenAppoint = (slotKey: DistrictRoleKey) => {
    if (!canManageOfficers) {
      showToast(
        tr(
          'केवल जिला अध्यक्ष को पदाधिकारी नियुक्त करने का अधिकार है।',
          'صرف ضلعی صدر کو عہدیدار نامزد کرنے کا اختیار ہے۔',
          'Only District President can appoint officers.'
        ),
        'error'
      );
      return;
    }
    setActiveSlotKey(slotKey);
    setCandidateSearch('');
    setCandidateScope('district');
    setAppointModalOpen(true);
  };

  // Confirm appointment
  const handleConfirmAppoint = async (selectedUser: User) => {
    if (!activeSlotKey) return;
    if (!canManageOfficers) return;

    setIsSubmitting(true);
    try {
      // Remove any existing officer in this slot
      const existingInSlot = usersInDistrict.find(u => {
        const r = (u.districtRole || u.district_role || '').toLowerCase().trim();
        return r === activeSlotKey;
      });

      if (existingInSlot && existingInSlot.id !== selectedUser.id) {
        await updateUser(existingInSlot.id, { districtRole: '' as any });
      }

      // Assign to selected user
      await updateUser(selectedUser.id, {
        districtRole: activeSlotKey,
        district: selectedDistrict,
      });

      showToast(
        tr(
          `${selectedUser.name} को सफलतापूर्वक नियुक्त किया गया!`,
          `${selectedUser.name} کو کامیابی سے نامزد کر دیا گیا!`,
          `${selectedUser.name} successfully appointed!`
        ),
        'success'
      );

      setAppointModalOpen(false);
      setActiveSlotKey(null);
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to appoint officer:', err);
      showToast(err?.message || tr('नियुक्ति में त्रुटि', 'نامزدگی میں خرابی', 'Failed to appoint officer'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove officer
  const handleRemoveOfficer = (slotKey: DistrictRoleKey) => {
    if (!canManageOfficers) {
      showToast(
        tr(
          'केवल जिला अध्यक्ष को पदाधिकारी हटाने का अधिकार है।',
          'صرف ضلعی صدر کو عہدیدار ہٹانے کا اختیار ہے۔',
          'Only District President can remove officers.'
        ),
        'error'
      );
      return;
    }

    const officer = committeeAssignments[slotKey];
    if (!officer) return;

    Alert.alert(
      tr('पदाधिकारी हटाएं', 'عہدیدار ہٹائیں', 'Remove Officer'),
      tr(
        `क्या आप निश्चित रूप से ${officer.name} को इस पद से मुक्त करना चाहते हैं?`,
        `کیا آپ واقعی ${officer.name} کو اس عہدے سے ہٹانا چاہتے ہیں؟`,
        `Are you sure you want to unassign ${officer.name} from this position?`
      ),
      [
        { text: tr('रद्द करें', 'منسوخ', 'Cancel'), style: 'cancel' },
        {
          text: tr('हटाएं', 'ہٹائیں', 'Remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateUser(officer.id, { districtRole: '' as any });
              showToast(
                tr('पदाधिकारी को पदमुक्त किया गया।', 'عہدیدار کو سبکدوش کر دیا گیا۔', 'Officer unassigned successfully.'),
                'success'
              );
              await fetchUsers();
            } catch (err: any) {
              showToast(err?.message || 'Failed to remove officer.', 'error');
            }
          },
        },
      ]
    );
  };

  // Dial Phone
  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^\d+]/g, '');
    if (clean) Linking.openURL(`tel:${clean}`);
  };

  // WhatsApp
  const handleWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/[^\d]/g, '');
    const msg = encodeURIComponent(
      tr(
        `अस्सलामु अलैकुम ${name} जी, MFCT जिला समिति के संदर्भ में संपर्क।`,
        `السلام علیکم ${name} صاحب، MFCT ضلعی کمیٹی کے سلسلے میں رابطہ۔`,
        `Assalamu Alaikum ${name}, contacting regarding MFCT District Committee.`
      )
    );
    Linking.openURL(`https://wa.me/${clean}?text=${msg}`);
  };

  const activeSlotPost = DISTRICT_POSTS.find(p => p.key === activeSlotKey);
  const headerBg = isDark ? '#064e3b' : '#047857';

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#090d16]">

      {/* ── Toast Banner ── */}
      {toastMsg && (
        <View
          className={`absolute top-2.5 left-4 right-4 z-50 flex-row items-center gap-2 px-3.5 py-2.5 rounded-xl elevation-6 ${
            toastMsg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 color="#fff" size={16} />
          ) : (
            <AlertCircle color="#fff" size={16} />
          )}
          <Text className="text-white text-xs font-bold flex-1">{toastMsg.text}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner Header ── */}
        <View
          className="px-4 pt-3.5 pb-4 rounded-b-3xl mb-3.5"
          style={{ backgroundColor: headerBg }}
        >
          {/* Top row: authority pill + district picker */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25">
              {canManageOfficers ? (
                <>
                  <CheckCircle2 color="#86efac" size={12} />
                  <Text className="text-[#86efac] text-[11px] font-bold">
                    {tr('नियुक्ति अधिकृत (President)', 'تعیناتی مجاز (صدر)', 'Appoint Authorized (President)')}
                  </Text>
                </>
              ) : (
                <>
                  <Eye color="#e2e8f0" size={12} />
                  <Text className="text-slate-200 text-[11px] font-semibold">
                    {tr('केवल अवलोकन (View-Only)', 'صرف مشاہدہ', 'View-Only Mode')}
                  </Text>
                </>
              )}
            </View>

            {/* District Picker Button */}
            <TouchableOpacity
              className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-white/20"
              onPress={() => setDistrictDropdownOpen(prev => !prev)}
              activeOpacity={0.8}
            >
              <MapPin color="#fef08a" size={13} />
              <Text className="text-white text-xs font-bold">{selectedDistrict}</Text>
              <ChevronDown color="#fef08a" size={14} />
            </TouchableOpacity>
          </View>

          {/* Title row */}
          <View className="flex-row items-center gap-2 mb-1">
            <Award color="#fde047" size={24} />
            <Text className="text-white text-lg font-extrabold flex-1">
              {tr('जिला टीम पद एवं जिम्मेदारियाँ', 'ضلعی ٹیم عہدے اور ذمہ داریاں', 'District Team Posts & Duties')}
            </Text>
          </View>
          <Text className="text-white/85 text-xs leading-[17px]">
            {tr(
              `${selectedDistrict} जिले की आधिकारिक 5-सदस्यीय कार्यकारिणी समिति सूची।`,
              `${selectedDistrict} ضلع کی سرکاری 5 رکنی مجلس عاملہ فہرست۔`,
              `Official 5-member district executive committee for ${selectedDistrict}.`
            )}
          </Text>
        </View>

        {/* ── District Selector Modal ── */}
        <Modal
          visible={districtDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDistrictDropdownOpen(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/55 justify-center items-center p-5"
            activeOpacity={1}
            onPress={() => setDistrictDropdownOpen(false)}
          >
            <View className="w-full max-w-[340px] rounded-2xl border p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-200/30 dark:border-slate-700/30">
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {tr('जिला चुनें (Select District)', 'ضلع منتخب کریں', 'Select District')}
                </Text>
                <TouchableOpacity onPress={() => setDistrictDropdownOpen(false)}>
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {STANDARD_DISTRICTS.map(dist => {
                  const isSel = dist.id === selectedDistrict;
                  const distName = lang === 'hi' ? dist.nameHi : lang === 'ur' ? dist.nameUr : dist.nameEn;
                  return (
                    <TouchableOpacity
                      key={dist.id}
                      className={`flex-row items-center gap-2 py-2.5 px-3 rounded-lg mb-0.5 ${
                        isSel ? (isDark ? 'bg-emerald-950' : 'bg-emerald-50') : ''
                      }`}
                      onPress={() => {
                        setSelectedDistrict(dist.id);
                        setDistrictDropdownOpen(false);
                      }}
                    >
                      <MapPin color={isSel ? '#10b981' : (isDark ? '#94a3b8' : '#64748b')} size={14} />
                      <Text className={`text-[13px] font-semibold ${isSel ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {distName} ({dist.id})
                      </Text>
                      {isSel && <CheckCircle2 color="#10b981" size={14} style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Summary Stats Row ── */}
        <View className="flex-row gap-2.5 px-3.5 mb-3.5">
          <View className="flex-1 p-3 rounded-2xl border items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <Award color="#eab308" size={18} />
            <Text className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">5</Text>
            <Text className="text-[10px] font-semibold mt-0.5 text-center text-slate-500 dark:text-slate-400">
              {tr('कुल आधिकारिक पद', 'کل سرکاری عہدے', 'Official Posts')}
            </Text>
          </View>

          <View className="flex-1 p-3 rounded-2xl border items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CheckCircle2 color="#10b981" size={18} />
            <Text className="text-lg font-extrabold mt-1 text-emerald-500">{assignedCount}</Text>
            <Text className="text-[10px] font-semibold mt-0.5 text-center text-slate-500 dark:text-slate-400">
              {tr('सक्रिय नियुक्त', 'فعال تعینات', 'Assigned')}
            </Text>
          </View>

          <View className="flex-1 p-3 rounded-2xl border items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <AlertCircle color="#f43f5e" size={18} />
            <Text className="text-lg font-extrabold mt-1 text-rose-500">{vacantCount}</Text>
            <Text className="text-[10px] font-semibold mt-0.5 text-center text-slate-500 dark:text-slate-400">
              {tr('रिक्त पद', 'خالی عہدے', 'Vacant')}
            </Text>
          </View>
        </View>

        {/* ── 5 District Post Cards ── */}
        {loading ? (
          <DistrictCommitteeSkeleton isDark={isDark} />
        ) : (
          <View className="px-3.5 gap-3.5">
            {DISTRICT_POSTS.map(post => {
              const officer = committeeAssignments[post.key];
              const isAssigned = !!officer;
              const postTitle = lang === 'hi' ? post.titleHi : lang === 'ur' ? post.titleUr : post.titleEn;
              const postDuty = lang === 'hi' ? post.dutyHi : lang === 'ur' ? post.dutyUr : post.dutyEn;

              return (
                <View
                  key={post.key}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm"
                >
                  {/* Card Header Row */}
                  <View className="flex-row items-center mb-2.5">
                    <View
                      className="px-2 py-1 rounded-lg border"
                      style={{ backgroundColor: `${post.color}20`, borderColor: post.color }}
                    >
                      <Text className="text-[11px] font-extrabold" style={{ color: post.color }}>
                        #{post.slotNumber}
                      </Text>
                    </View>
                    <View className="flex-1 ml-2.5">
                      <Text className="text-[15px] font-extrabold text-slate-900 dark:text-white">{postTitle}</Text>
                      <Text className="text-[10px] font-semibold tracking-wide mt-0.5 text-slate-500 dark:text-slate-400">
                        {post.key.replace('district_', '').replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-lg ${
                        isAssigned ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-red-50 dark:bg-red-950/50'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          isAssigned ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isAssigned ? tr('नियुक्त', 'تعینات', 'Assigned') : tr('रिक्त पद', 'خالی', 'Vacant')}
                      </Text>
                    </View>
                  </View>

                  {/* Duty Description */}
                  <View className="p-2.5 rounded-xl mb-3 bg-slate-50 dark:bg-slate-900/50">
                    <Text className="text-[10px] font-bold uppercase mb-0.5 text-slate-500 dark:text-slate-400">
                      {tr('आधिकारिक दायित्व (Responsibility):', 'سرکاری ذمہ داری:', 'Official Duty:')}
                    </Text>
                    <Text className="text-xs leading-4 font-medium text-slate-900 dark:text-white">{postDuty}</Text>
                  </View>

                  {/* Officer Info or Vacant Box */}
                  {isAssigned && officer ? (
                    <View className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                      {/* Officer Profile Row */}
                      <View className="flex-row items-center mb-2.5">
                        {officer.avatar ? (
                          <Image
                            source={{ uri: officer.avatar }}
                            className="w-11 h-11 rounded-full"
                          />
                        ) : (
                          <View
                            className="w-11 h-11 rounded-full items-center justify-center"
                            style={{ backgroundColor: `${post.color}25` }}
                          >
                            <Text className="text-lg font-extrabold" style={{ color: post.color }}>
                              {officer.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </View>
                        )}
                        <View className="flex-1 ml-3">
                          <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                            {officer.name}
                          </Text>
                          <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                            {officer.membershipId ? `ID: ${officer.membershipId}` : officer.city || selectedDistrict}
                          </Text>
                          {officer.phone ? (
                            <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">{officer.phone}</Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Contact & Management Actions */}
                      <View className="flex-row gap-1.5 border-t border-slate-200 dark:border-slate-700 pt-2">
                        {officer.phone ? (
                          <>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-950"
                              onPress={() => handleCall(officer.phone)}
                            >
                              <Phone color="#0284c7" size={13} />
                              <Text className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                {tr('कॉल', 'کال', 'Call')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950"
                              onPress={() => handleWhatsApp(officer.phone, officer.name)}
                            >
                              <MessageCircle color="#10b981" size={13} />
                              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                WhatsApp
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : null}

                        {/* If District President: Change & Remove actions */}
                        {canManageOfficers && (
                          <>
                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950"
                              onPress={() => handleOpenAppoint(post.key)}
                            >
                              <Edit3 color="#6366f1" size={13} />
                              <Text className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                {tr('बदलें', 'تبدیل', 'Change')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              className="flex-1 flex-row items-center justify-center gap-1 py-1.5 rounded-lg bg-red-50 dark:bg-red-950"
                              onPress={() => handleRemoveOfficer(post.key)}
                            >
                              <Trash2 color="#ef4444" size={13} />
                              <Text className="text-[11px] font-bold text-red-500 dark:text-red-400">
                                {tr('हटाएं', 'ہٹائیں', 'Remove')}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 items-center justify-center">
                      <AlertCircle color="#f43f5e" size={24} />
                      <Text className="text-xs text-center mt-1.5 mb-3 text-slate-500 dark:text-slate-400">
                        {tr(
                          'वर्तमान में इस पद पर कोई पदाधिकारी नियुक्त नहीं है।',
                          'فی الحال اس عہدے پر کوئی عہدیدار تعینات نہیں ہے۔',
                          'No officer currently appointed to this slot.'
                        )}
                      </Text>

                      {canManageOfficers ? (
                        <TouchableOpacity
                          className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl"
                          style={{ backgroundColor: post.color }}
                          onPress={() => handleOpenAppoint(post.key)}
                          activeOpacity={0.8}
                        >
                          <UserPlus color="#fff" size={15} />
                          <Text className="text-white text-xs font-bold">
                            {tr('+ पदाधिकारी नियुक्त करें', '+ عہدیدار نامزد کریں', '+ Appoint Officer')}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-500/10">
                          <Eye color="#64748b" size={12} />
                          <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {tr('नियुक्ति केवल जिला अध्यक्ष द्वारा संभव है', 'نامزدگی صرف ضلعی صدر کر سکتے ہیں', 'Appointment reserved for District President')}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Appoint Officer Modal Sheet ── */}
      <Modal
        visible={appointModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAppointModalOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85%] p-4">

            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 mb-0 border-b border-slate-200 dark:border-slate-800">
              <View className="flex-1">
                <Text className="text-[17px] font-extrabold text-slate-900 dark:text-white">
                  {tr('पदाधिकारी नियुक्ति', 'عہدیدار کی نامزدگی', 'Appoint Officer')}
                </Text>
                {activeSlotPost && (
                  <Text className="text-[13px] font-bold mt-0.5" style={{ color: activeSlotPost.color }}>
                    {lang === 'hi' ? activeSlotPost.titleHi : lang === 'ur' ? activeSlotPost.titleUr : activeSlotPost.titleEn}
                    {' '}(#{activeSlotPost.slotNumber})
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setAppointModalOpen(false)}
                className="p-1.5 rounded-2xl"
              >
                <X color={isDark ? '#94a3b8' : '#64748b'} size={20} />
              </TouchableOpacity>
            </View>

            {/* Scope Filter Tabs */}
            <View className="flex-row gap-2 mt-3 mb-2.5">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
                  candidateScope === 'district' ? 'bg-emerald-500' : 'bg-slate-500/15'
                }`}
                onPress={() => setCandidateScope('district')}
              >
                <MapPin color={candidateScope === 'district' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={13} />
                <Text
                  className={`text-xs font-bold ${
                    candidateScope === 'district' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                  numberOfLines={1}
                >
                  {selectedDistrict} ({usersInDistrict.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${
                  candidateScope === 'all' ? 'bg-emerald-500' : 'bg-slate-500/15'
                }`}
                onPress={() => setCandidateScope('all')}
              >
                <Users color={candidateScope === 'all' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={13} />
                <Text
                  className={`text-xs font-bold ${
                    candidateScope === 'all' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tr('सभी सदस्य', 'تمام ممبران', 'All Members')} ({allUsers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 mb-3 bg-white dark:bg-slate-950">
              <Search color={isDark ? '#94a3b8' : '#64748b'} size={16} />
              <TextInput
                className="flex-1 py-2.5 text-[13px] text-slate-900 dark:text-white"
                placeholder={tr('नाम, फोन या सदस्य ID खोजें...', 'نام، فون یا ممبر آئی ڈی تلاش کریں...', 'Search name, phone or ID...')}
                placeholderTextColor={isDark ? '#94a3b8' : '#94a3b8'}
                value={candidateSearch}
                onChangeText={setCandidateSearch}
              />
              {candidateSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCandidateSearch('')}>
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* Candidates List */}
            {isSubmitting ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-[13px] mt-2.5 text-slate-500 dark:text-slate-400">
                  {tr('नियुक्ति दर्ज हो रही है...', 'نامزدگی ریکارڈ کی جا رہی ہے...', 'Updating appointment...')}
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {eligibleCandidates.length === 0 ? (
                  <View className="py-8 items-center">
                    <Users color={isDark ? '#94a3b8' : '#64748b'} size={36} />
                    <Text className="text-[13px] mt-2 text-slate-500 dark:text-slate-400">
                      {tr('कोई सदस्य नहीं मिला', 'کوئی ممبر نہیں ملا', 'No matching members found')}
                    </Text>
                  </View>
                ) : (
                  eligibleCandidates.map(candidate => {
                    const isAlreadyAssigned = !!candidate.districtRole;
                    return (
                      <View
                        key={candidate.id}
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 mb-2 bg-slate-50 dark:bg-slate-900/50"
                      >
                        <View className="flex-row items-center">
                          {candidate.avatar ? (
                            <Image
                              source={{ uri: candidate.avatar }}
                              className="w-9.5 h-9.5 rounded-full"
                            />
                          ) : (
                            <View className="w-9.5 h-9.5 rounded-full items-center justify-center bg-emerald-500/15">
                              <Text className="text-base font-extrabold text-emerald-500">
                                {candidate.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Text>
                            </View>
                          )}
                          <View className="flex-1 ml-2.5">
                            <Text className="text-[13px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                              {candidate.name}
                            </Text>
                            <Text className="text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                              {candidate.city || candidate.district || 'Member'} • {candidate.membershipId || candidate.phone}
                            </Text>
                            {isAlreadyAssigned && (
                              <Text className="text-[10px] font-semibold mt-0.5 text-amber-500">
                                {tr('वर्तमान पद:', 'موجودہ عہدہ:', 'Current:')} {candidate.districtRole}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity
                            className="px-3 py-1.5 rounded-lg bg-emerald-500"
                            onPress={() => handleConfirmAppoint(candidate)}
                            activeOpacity={0.8}
                          >
                            <Text className="text-white text-xs font-bold">
                              {tr('चुनें', 'منتخب', 'Select')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
