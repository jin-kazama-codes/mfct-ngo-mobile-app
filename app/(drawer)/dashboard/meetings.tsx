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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { MeetingListSkeleton } from '../../../src/components/SkeletonLoader';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
} from 'lucide-react-native';
import { useAppState } from '../../../src/context/AppStateProvider';
import {
  getLanguageCode,
  translateRole,
  translateRoleResponsibility,
} from '../../../src/lib/translateEntity';

import {
  getMeetings,
  createMeeting as apiCreateMeeting,
  approveMeeting as apiApproveMeeting,
  type DistrictMeeting,
} from '../../../src/services/meetingService';

export default function DistrictMeetingsScreen() {
  const { activeUser, currentRole } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);

  // Role checks matching MeetingsTab.tsx
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

  // District President can approve meetings
  const isDistrictPresident =
    currentRole === 'district_president' ||
    rawDistRole === 'district_president' ||
    rawDistRole.includes('president');

  // Only District Secretary (and Super Admin / Executive Admin) can schedule and record meetings
  const userDistRole = rawDistRole || (currentRole as string || '').toLowerCase().trim();
  const canCreateMeeting =
    isSuperOrExecutive ||
    currentRole === 'district_secretary' ||
    userDistRole === 'district_secretary' ||
    (userDistRole.includes('secretary') && !userDistRole.includes('gen'));

  const [meetings, setMeetings] = useState<DistrictMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Meeting Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formChairperson, setFormChairperson] = useState('');
  const [formAttendees, setFormAttendees] = useState('15');
  const [formAgenda, setFormAgenda] = useState('');
  const [formResolutions, setFormResolutions] = useState('');
  const [formMinutes, setFormMinutes] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'upcoming' | 'completed'>('pending');

  // Load meetings
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        const data = await getMeetings(activeUser?.district || activeUser?.city);
        setMeetings(data || []);
      } catch (e) {
        console.error('Failed to load meetings:', e);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
    loadMeetings();
  }, [activeUser?.district, activeUser?.city]);

  const saveMeetings = async (updated: DistrictMeeting[]) => {
    setMeetings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist meetings:', e);
    }
  };

  const handleCreateMeeting = async () => {
    if (!canCreateMeeting) {
      Alert.alert(
        lang === 'hi' ? 'अनुमति नहीं' : 'Permission Denied',
        lang === 'hi'
          ? 'केवल जिला सचिव या सुपर एडमिन ही बैठक दर्ज कर सकते हैं।'
          : 'Only District Secretary or Super Admin can schedule meetings.'
      );
      return;
    }
    if (!formTitle.trim()) {
      Alert.alert(lang === 'hi' ? 'त्रुटि' : 'Error', lang === 'hi' ? 'कृपया बैठक का शीर्षक दर्ज करें।' : 'Please enter meeting title.');
      return;
    }
    if (!formDate.trim()) {
      Alert.alert(lang === 'hi' ? 'त्रुटि' : 'Error', lang === 'hi' ? 'कृपया बैठक की तिथि दर्ज करें।' : 'Please enter meeting date.');
      return;
    }

    const resArray = formResolutions
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const currentDistrict = activeUser?.district || activeUser?.city || activeUser?.communityName || 'District Chapter';
    const initialStatus = isSuperOrExecutive ? (formStatus === 'pending' ? 'upcoming' : formStatus) : 'pending';

    const newMeetingData: Omit<DistrictMeeting, 'id'> = {
      title: formTitle.trim(),
      agenda: formAgenda.trim() || 'General committee administrative matters.',
      date: formDate.trim(),
      time: formTime.trim() || '11:00 AM - 01:00 PM',
      venue: formVenue.trim() || `${currentDistrict} Office`,
      chairperson: formChairperson.trim() || 'District President',
      recordedBy: activeUser?.name ? `${activeUser.name} (जिला सचिव)` : 'District Secretary (जिला सचिव)',
      attendeesCount: parseInt(formAttendees) || 12,
      status: initialStatus,
      resolutions: resArray.length > 0 ? resArray : undefined,
      minutes: formMinutes.trim() || undefined,
      district: currentDistrict,
    };

    try {
      const created = await apiCreateMeeting(newMeetingData);
      setMeetings(prev => [created, ...prev.filter(m => m.id !== created.id)]);
    } catch (err) {
      console.warn('apiCreateMeeting error, saving locally:', err);
      const local: DistrictMeeting = { id: `meet-${Date.now()}`, ...newMeetingData };
      await saveMeetings([local, ...meetings]);
    }

    // Reset
    setFormTitle('');
    setFormDate('');
    setFormTime('');
    setFormVenue('');
    setFormChairperson('');
    setFormAgenda('');
    setFormResolutions('');
    setFormMinutes('');
    setFormStatus('pending');
    setIsModalOpen(false);

    Alert.alert(
      lang === 'hi' ? 'सफल' : 'Success',
      lang === 'hi'
        ? initialStatus === 'pending'
          ? 'बैठक का विवरण सहेज लिया गया (अनुमोदन हेतु लंबित)।'
          : 'बैठक का विवरण सफलतापूर्वक सहेज लिया गया।'
        : initialStatus === 'pending'
          ? 'Meeting record submitted (Pending approval).'
          : 'Meeting record saved successfully.'
    );
  };

  const handleApproveMeeting = async (meetingId: string) => {
    if (!isSuperOrExecutive && !isDistrictPresident) return;
    try {
      await apiApproveMeeting(meetingId);
      setMeetings(prev =>
        prev.map(m => (m.id === meetingId ? { ...m, status: 'upcoming' as const } : m))
      );
    } catch {
      const updated = meetings.map((m) =>
        m.id === meetingId ? { ...m, status: 'upcoming' as const } : m
      );
      await saveMeetings(updated);
    }
    Alert.alert(
      lang === 'hi' ? 'सफल' : 'Success',
      lang === 'hi' ? 'बैठक अनुमोदित हो गई!' : 'Meeting approved successfully!'
    );
  };

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'pending' && m.status !== 'pending') return false;
    if (filter === 'upcoming' && m.status !== 'upcoming') return false;
    if (filter === 'completed' && m.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchVenue = m.venue.toLowerCase().includes(q);
      const matchChair = m.chairperson.toLowerCase().includes(q);
      const matchAgenda = m.agenda.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchChair && !matchAgenda) return false;
    }
    return true;
  });

  const totalCount = meetings.length;
  const pendingCount = meetings.filter(m => m.status === 'pending').length;
  const upcomingCount = meetings.filter(m => m.status === 'upcoming').length;
  const completedCount = meetings.filter(m => m.status === 'completed').length;
  const resolutionsCount = meetings.reduce((acc, m) => acc + (m.resolutions?.length || 0), 0);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (loading) {
    return <MeetingListSkeleton isDark={isDark} />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16 }}>
      {/* Secretary Mandate & Responsibility Card */}
      <View className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-300 dark:border-blue-800/60 rounded-2xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-blue-600 items-center justify-center">
              <Calendar color="#fff" size={18} />
            </View>
            <View>
              <Text className="text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                {translateRole('district_secretary', lang)}
              </Text>
              <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'hi'
                  ? 'आधिकारिक बैठकें, कार्यवाही विवरण (Minutes) एवं प्रशासनिक रिकॉर्ड'
                  : lang === 'ur'
                    ? 'سرکاری اجلاس، کارروائی کا ریکارڈ اور انتظامی خط و کتابت'
                    : 'Official Meetings, Minutes of Proceeding & Chapter Administration'}
              </Text>
            </View>
          </View>
          <View className="bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
            <Text className="text-blue-800 dark:text-blue-300 text-[10px] font-bold">
              {lang === 'hi' ? 'कार्यवाही संधारण' : lang === 'ur' ? 'کارروائی قلمبند' : 'Minutes Custodian'}
            </Text>
          </View>
        </View>

        <View className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-blue-200 dark:border-blue-900/50">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {lang === 'hi' ? 'प्रमुख दायित्व:' : lang === 'ur' ? 'اہم ذمہ داری:' : 'Mandated Responsibility:'}
          </Text>
          <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-5">
            {translateRoleResponsibility('district_secretary', lang)}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-4">
            {lang === 'hi'
              ? 'समिति बैठकों का समयबद्ध आयोजन, कोरम सत्यापन, प्रस्तावों (Resolutions) को दर्ज करना एवं आधिकारिक पत्राचार।'
              : lang === 'ur'
                ? 'کمیٹی اجلاسوں کا باقاعدہ انعقاد، کورم تصدیق، قراردادوں کا اندراج اور سرکاری خط و کتابت۔'
                : 'Timely scheduling of committee assemblies, quorum verification, official resolutions log, and executive correspondence.'}
          </Text>
        </View>
      </View>

      {/* KPI Stats Grid */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <Text className="text-slate-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'कुल बैठकें' : 'Total'}</Text>
          <Text className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalCount}</Text>
        </View>
        <View className="flex-1 bg-amber-500/10 border border-amber-300 dark:border-amber-800/50 p-3 rounded-xl">
          <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'आगामी' : 'Upcoming'}</Text>
          <Text className="text-lg font-bold text-amber-900 dark:text-amber-300 mt-1">{upcomingCount}</Text>
        </View>
        <View className="flex-1 bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800/50 p-3 rounded-xl">
          <Text className="text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'सम्पन्न' : 'Completed'}</Text>
          <Text className="text-lg font-bold text-emerald-900 dark:text-emerald-300 mt-1">{completedCount}</Text>
        </View>
        <View className="flex-1 bg-blue-500/10 border border-blue-300 dark:border-blue-800/50 p-3 rounded-xl">
          <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase">{lang === 'hi' ? 'प्रस्ताव' : 'Resolutions'}</Text>
          <Text className="text-lg font-bold text-blue-900 dark:text-blue-300 mt-1">{resolutionsCount}</Text>
        </View>
      </View>

      {/* Action Bar: Search & New Meeting Button */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-xs text-slate-800 dark:text-slate-100 p-0"
            placeholder={lang === 'hi' ? 'शीर्षक, स्थान या एजेंडा खोजें...' : 'Search meetings, venue, agenda...'}
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

        {canCreateMeeting && (
          <TouchableOpacity
            className="bg-blue-600 active:bg-blue-700 px-3 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#fff" />
            <Text className="text-white text-xs font-bold">
              {lang === 'hi' ? 'नई बैठक' : lang === 'ur' ? 'نیا اجلاس' : 'New Meeting'}
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
          <Text className={`text-xs font-bold ${filter === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'सभी' : lang === 'ur' ? 'تمام' : 'All'} ({totalCount})
          </Text>
        </TouchableOpacity>
        {pendingCount > 0 && (
          <TouchableOpacity
            className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'pending' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
            onPress={() => setFilter('pending')}
          >
            <Text className={`text-xs font-bold ${filter === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
              {lang === 'hi' ? 'लंबित' : lang === 'ur' ? 'زیر التواء' : 'Pending'} ({pendingCount})
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'upcoming' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
          onPress={() => setFilter('upcoming')}
        >
          <Text className={`text-xs font-bold ${filter === 'upcoming' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'आगामी' : lang === 'ur' ? 'آئندہ' : 'Upcoming'} ({upcomingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-1.5 rounded-lg items-center ${filter === 'completed' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''}`}
          onPress={() => setFilter('completed')}
        >
          <Text className={`text-xs font-bold ${filter === 'completed' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
            {lang === 'hi' ? 'सम्पन्न' : lang === 'ur' ? 'مکمل' : 'Completed'} ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 items-center justify-center my-4">
          <Calendar size={40} color="#94a3b8" />
          <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-3">
            {lang === 'hi' ? 'कोई बैठक नहीं मिली' : 'No meetings found'}
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            {lang === 'hi' ? 'नई बैठक आयोजित करने के लिए "नई बैठक" बटन दबाएं।' : 'Tap "New Meeting" to schedule or record minutes.'}
          </Text>
        </View>
      ) : (
        <View className="gap-3 pb-8">
          {filteredMeetings.map(item => {
            const isExpanded = expandedId === item.id;
            const isCompleted = item.status === 'completed';

            return (
              <View
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                <View className="p-4">
                  {/* Top Status & Date Row */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Calendar size={13} color="#64748b" />
                      <Text className="text-slate-600 dark:text-slate-400 font-bold text-xs">{item.date}</Text>
                      <Text className="text-slate-300 dark:text-slate-600">•</Text>
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-slate-500 dark:text-slate-400 text-[11px]">{item.time}</Text>
                    </View>

                    <View
                      className={`px-2 py-0.5 rounded-full flex-row items-center gap-1 ${item.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800'
                          : isCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800'
                        }`}
                    >
                      {item.status === 'pending' ? (
                        <Clock size={11} color="#d97706" />
                      ) : isCompleted ? (
                        <CheckCircle2 size={11} color="#059669" />
                      ) : (
                        <Calendar size={11} color="#2563eb" />
                      )}
                      <Text
                        className={`text-[10px] font-bold ${item.status === 'pending'
                            ? 'text-amber-800 dark:text-amber-300'
                            : isCompleted
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-blue-800 dark:text-blue-300'
                          }`}
                      >
                        {item.status === 'pending'
                          ? lang === 'hi' ? 'लंबित अनुमोदन' : lang === 'ur' ? 'زیر التواء' : 'Pending Approval'
                          : isCompleted
                            ? lang === 'hi' ? 'सम्पन्न एवं दर्ज' : 'Completed'
                            : lang === 'hi' ? 'आगामी नियत' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text className="text-slate-900 dark:text-white font-bold text-sm leading-5">
                    {item.title}
                  </Text>

                  {/* Venue */}
                  <View className="flex-row items-center gap-1.5 mt-2">
                    <MapPin size={12} color="#94a3b8" />
                    <Text className="text-slate-500 dark:text-slate-400 text-xs flex-1" numberOfLines={1}>
                      {item.venue}
                    </Text>
                  </View>

                  {/* Agenda summary */}
                  <View className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl mt-3 border border-slate-100 dark:border-slate-800">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {lang === 'hi' ? 'बैठक एजेंडा:' : 'Meeting Agenda:'}
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-300 text-xs leading-4">
                      {item.agenda}
                    </Text>
                  </View>

                  {/* Presided & Recorded By */}
                  <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <View className="flex-1">
                      <Text className="text-[10px] text-slate-400 font-semibold">{lang === 'hi' ? 'अध्यक्षता:' : 'Chairperson:'}</Text>
                      <Text className="text-xs font-bold text-slate-700 dark:text-slate-200" numberOfLines={1}>
                        {item.chairperson}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-center gap-1">
                        <Users size={12} color="#3b82f6" />
                        <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {item.attendeesCount} {lang === 'hi' ? 'उपस्थित' : 'Attended'}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-slate-400">
                        {lang === 'hi' ? 'कोरम पूर्ण' : 'Quorum Valid'}
                      </Text>
                    </View>
                  </View>

                  {/* Toggle Minutes & Resolutions */}
                  <TouchableOpacity
                    className="flex-row items-center justify-between bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl mt-3 border border-blue-200 dark:border-blue-900/40"
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-2">
                      <FileText size={14} color="#2563eb" />
                      <Text className="text-blue-700 dark:text-blue-300 font-bold text-xs">
                        {lang === 'hi' ? 'कार्यवाही विवरण व पारित प्रस्ताव' : 'Minutes & Official Resolutions'}
                      </Text>
                      {item.resolutions && item.resolutions.length > 0 && (
                        <View className="bg-blue-600 px-1.5 py-0.2 rounded-full">
                          <Text className="text-white text-[9px] font-bold">{item.resolutions.length}</Text>
                        </View>
                      )}
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#2563eb" />
                    ) : (
                      <ChevronDown size={16} color="#2563eb" />
                    )}
                  </TouchableOpacity>

                  {/* Approve Button (super/executive admin + district president, pending meetings) */}
                  {(isSuperOrExecutive || isDistrictPresident) && item.status === 'pending' && (
                    <View className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-row justify-end">
                      <TouchableOpacity
                        onPress={() => handleApproveMeeting(item.id)}
                        className="bg-emerald-600 active:bg-emerald-700 px-3.5 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 size={13} color="#fff" />
                        <Text className="text-white text-xs font-bold">
                          {lang === 'hi' ? 'बैठक अनुमोदित करें' : lang === 'ur' ? 'اجلاس منظور کریں' : 'Approve Meeting'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Expanded Section: Minutes & Resolutions */}
                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      {item.minutes ? (
                        <View className="mb-3">
                          <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            {lang === 'hi' ? 'कार्यवाही विवरण (Minutes of Meeting):' : 'Minutes of Meeting:'}
                          </Text>
                          <Text className="text-slate-700 dark:text-slate-300 text-xs leading-5 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            {item.minutes}
                          </Text>
                        </View>
                      ) : null}

                      {item.resolutions && item.resolutions.length > 0 ? (
                        <View className="mb-2">
                          <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            {lang === 'hi' ? 'सर्वसम्मति से पारित प्रस्ताव (Resolutions):' : 'Resolutions Passed:'}
                          </Text>
                          {item.resolutions.map((res, i) => (
                            <View key={i} className="flex-row items-start gap-2 mb-1.5">
                              <CheckCircle2 size={13} color="#059669" style={{ marginTop: 2 }} />
                              <Text className="text-slate-800 dark:text-slate-200 text-xs flex-1 leading-4">
                                {res}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <View className="bg-slate-100 dark:bg-slate-800/40 p-2 rounded-lg flex-row items-center justify-between mt-2">
                        <Text className="text-[10px] text-slate-400 font-medium">
                          {lang === 'hi' ? 'लिखित अभिलेखकर्ता:' : 'Recorded By:'} {item.recordedBy}
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <Shield size={10} color="#10b981" />
                          <Text className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {lang === 'hi' ? 'आधिकारिक सत्यापित' : 'Chapter Certified'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* New Meeting Schedule / Record Form Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[88%] border-t border-slate-200 dark:border-slate-800 p-5">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <View>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'नई बैठक आयोजित / दर्ज करें' : 'Schedule / Record Meeting'}
                </Text>
                <Text className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {lang === 'hi' ? 'जिला सचिव आधिकारिक कार्यप्रणाली' : 'District Secretary Administrative Register'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Meeting Status Section */}
              {!isSuperOrExecutive ? (
                <View className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 flex-row items-center gap-2">
                  <Shield size={14} color="#d97706" />
                  <Text className="text-amber-800 dark:text-amber-300 text-xs flex-1">
                    {lang === 'hi'
                      ? 'जिला सचिव द्वारा दर्ज बैठक "अनुमोदन हेतु लंबित" रहेगी (जिला अध्यक्ष / एडमिन द्वारा अनुमोदन आवश्यक)।'
                      : 'Meeting recorded by Secretary will be pending approval (District President / Admin approval required).'}
                  </Text>
                </View>
              ) : (
                <View className="mb-3">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'hi' ? 'बैठक स्थिति' : 'Meeting Status'}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-xl items-center border ${formStatus === 'upcoming'
                          ? 'bg-amber-500/15 border-amber-500'
                          : 'border-slate-200 dark:border-slate-800'
                        }`}
                      onPress={() => setFormStatus('upcoming')}
                    >
                      <Text className={`text-xs font-bold ${formStatus === 'upcoming' ? 'text-amber-600' : 'text-slate-500'}`}>
                        {lang === 'hi' ? 'आगामी नियत (सीधे सक्रिय)' : 'Upcoming (Published)'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-xl items-center border ${formStatus === 'completed'
                          ? 'bg-emerald-500/15 border-emerald-500'
                          : 'border-slate-200 dark:border-slate-800'
                        }`}
                      onPress={() => setFormStatus('completed')}
                    >
                      <Text className={`text-xs font-bold ${formStatus === 'completed' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {lang === 'hi' ? 'सम्पन्न (कार्यवाही दर्ज)' : 'Completed & Minuted'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Title */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'बैठक का शीर्षक *' : 'Meeting Title *'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="e.g. Monthly Welfare Review Assembly"
                  placeholderTextColor="#94a3b8"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Date & Time */}
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'तारीख (YYYY-MM-DD) *' : 'Date *'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                    placeholder="2026-09-20"
                    placeholderTextColor="#94a3b8"
                    value={formDate}
                    onChangeText={setFormDate}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'समय' : 'Time'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                    placeholder="11:00 AM - 01:00 PM"
                    placeholderTextColor="#94a3b8"
                    value={formTime}
                    onChangeText={setFormTime}
                  />
                </View>
              </View>

              {/* Venue */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'स्थान / स्थल' : 'Venue / Hall'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                  placeholder="MFCT District Chapter Office, Bareilly"
                  placeholderTextColor="#94a3b8"
                  value={formVenue}
                  onChangeText={setFormVenue}
                />
              </View>

              {/* Chairperson & Attendees */}
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'अध्यक्षता (Chairperson)' : 'Chairperson'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700"
                    placeholder="District President"
                    placeholderTextColor="#94a3b8"
                    value={formChairperson}
                    onChangeText={setFormChairperson}
                  />
                </View>
                <View className="w-24">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'उपस्थिति' : 'Attendees'}
                  </Text>
                  <TextInput
                    className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-center"
                    placeholder="15"
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                    value={formAttendees}
                    onChangeText={setFormAttendees}
                  />
                </View>
              </View>

              {/* Agenda */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'मुख्य एजेंडा' : 'Agenda Points'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 h-16 text-start"
                  placeholder="Key topics for discussion and administrative planning..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={formAgenda}
                  onChangeText={setFormAgenda}
                />
              </View>

              {/* Resolutions */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'पारित प्रस्ताव (एक पंक्ति में एक)' : 'Resolutions Passed (1 per line)'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 h-16 text-start"
                  placeholder={'1. Resolution one\n2. Resolution two'}
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={formResolutions}
                  onChangeText={setFormResolutions}
                />
              </View>

              {/* Minutes of Meeting */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'विस्तृत कार्यवाही विवरण (Minutes of Meeting)' : 'Minutes of Meeting Summary'}
                </Text>
                <TextInput
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 h-20 text-start"
                  placeholder="Proceedings, deliberations, quorum, and decisions taken..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={formMinutes}
                  onChangeText={setFormMinutes}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className="bg-blue-600 active:bg-blue-700 py-3.5 rounded-xl items-center mb-6 shadow-sm"
                onPress={handleCreateMeeting}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-sm">
                  {lang === 'hi' ? 'बैठक रिकॉर्ड सहेजें' : 'Save Meeting Record'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
