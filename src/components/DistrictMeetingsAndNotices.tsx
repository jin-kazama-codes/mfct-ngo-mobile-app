import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, Megaphone, MapPin, Clock } from 'lucide-react-native';

import { getMeetings, DistrictMeeting } from '../services/meetingService';
import { getAllAnnouncements, Announcement } from '../services/announcementService';
import { getLanguageCode } from '../lib/translateEntity';

interface Props {
  district: string;
  meetings?: DistrictMeeting[] | any[];
  announcements?: Announcement[] | any[];
  onNavigateTab?: (tab: string) => void;
}

export default function DistrictMeetingsAndNotices({
  district,
  meetings: initialMeetings,
  announcements: initialAnnouncements,
  onNavigateTab,
}: Props) {
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const [meetings, setMeetings] = useState<any[]>(initialMeetings || []);
  const [announcements, setAnnouncements] = useState<any[]>(initialAnnouncements || []);
  const [loading, setLoading] = useState<boolean>(!initialMeetings || !initialAnnouncements);

  useEffect(() => {
    if (initialMeetings) {
      setMeetings(initialMeetings);
    }
  }, [initialMeetings]);

  useEffect(() => {
    if (initialAnnouncements) {
      setAnnouncements(initialAnnouncements);
    }
  }, [initialAnnouncements]);

  useEffect(() => {
    if (!initialMeetings || !initialAnnouncements) {
      let isMounted = true;
      const loadData = async () => {
        try {
          setLoading(true);
          const [mList, aList] = await Promise.all([
            initialMeetings ? Promise.resolve(initialMeetings) : getMeetings(district),
            initialAnnouncements ? Promise.resolve(initialAnnouncements) : getAllAnnouncements(),
          ]);
          if (isMounted) {
            if (!initialMeetings) setMeetings(mList || []);
            if (!initialAnnouncements) setAnnouncements(aList || []);
          }
        } catch (err) {
          console.warn('Error loading district meetings/announcements:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadData();
      return () => {
        isMounted = false;
      };
    } else {
      setLoading(false);
    }
  }, [district, initialMeetings, initialAnnouncements]);

  return (
    <View className="mt-4">
      {/* ─── SECTION 1: DISTRICT MEETINGS ─────────────────────────── */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 items-center justify-center mr-2">
            <Calendar size={18} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-slate-900 dark:text-white">
              {tr('ज़िला बैठकें', 'ضلعی اجلاس', 'District Meetings')}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {tr('कार्यवाही एवं आगामी कार्यसूची', 'کارروائی اور آئندہ ایجنڈا', 'Proceedings & upcoming agenda')}
            </Text>
          </View>
        </View>

        {meetings.length > 0 && (
          <View className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <Text className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
              {meetings.length} {tr('बैठकें', 'اجلاس', 'Meetings')}
            </Text>
          </View>
        )}
      </View>

      {loading && meetings.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 mb-4 shadow-xs">
          <View className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4 mb-2 animate-pulse" />
          <View className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 animate-pulse" />
        </View>
      ) : meetings.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center border border-slate-200 dark:border-slate-800 shadow-xs mb-4">
          <Calendar size={28} color="#94a3b8" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center mt-2">
            {tr('कोई बैठक निर्धारित नहीं है।', 'کوئی اجلاس شیڈول नहीं ہے۔', 'No meetings scheduled yet.')}
          </Text>
          <Text className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">
            {tr(`${district} जिले में नई बैठक निर्धारित होने पर यहाँ प्रदर्शित होगी।`, 'نئے اجلاس کی اطلاع یہاں دکھائی جائے گی۔', `New meetings for ${district} will appear here.`)}
          </Text>
        </View>
      ) : (
        meetings.slice(0, 4).map((meeting) => {
          const isCompleted = meeting.status === 'completed';
          const isUpcoming = meeting.status === 'upcoming';
          return (
            <Pressable
              key={meeting.id}
              onPress={() => onNavigateTab?.('meetings_manage')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 active:opacity-80 shadow-xs"
            >
              <View className="flex-row justify-between items-start">
                <Text className="flex-1 text-sm font-bold text-slate-900 dark:text-white mr-2">
                  {meeting.title}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-full border ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800'
                      : isUpcoming
                      ? 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800'
                      : 'bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : isUpcoming
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isCompleted
                      ? tr('सम्पन्न', 'مکمل', 'Completed')
                      : isUpcoming
                      ? tr('आगामी', 'آئندہ', 'Upcoming')
                      : tr('प्रतीक्षारत', 'زیر التواء', 'Pending')}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-2.5 flex-wrap gap-x-3 gap-y-1">
                <View className="flex-row items-center">
                  <Clock size={12} color="#64748b" />
                  <Text className="text-xs text-slate-600 dark:text-slate-400 ml-1.5">
                    {meeting.date} {meeting.time ? `• ${meeting.time}` : ''}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <MapPin size={12} color="#e11d48" />
                  <Text className="text-xs text-slate-600 dark:text-slate-400 ml-1.5">
                    {meeting.venue || district}
                  </Text>
                </View>
              </View>

              {meeting.agenda ? (
                <View className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <Text className="text-[11px] text-slate-600 dark:text-slate-300" numberOfLines={2}>
                    <Text className="font-bold text-slate-800 dark:text-slate-200">
                      {tr('एजेंडा: ', 'ایجنڈا: ', 'Agenda: ')}
                    </Text>
                    {meeting.agenda}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })
      )}

      {/* ─── SECTION 2: OFFICIAL ANNOUNCEMENTS ─────────────────────── */}
      <View className="flex-row items-center justify-between mt-3 mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 items-center justify-center mr-2">
            <Megaphone size={18} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-slate-900 dark:text-white">
              {tr('आधिकारिक घोषणाएँ', 'سرکاری اعلانات', 'Official Announcements')}
            </Text>
            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
              {tr('नेतृत्व द्वारा जारी महत्वपूर्ण सूचनाएँ', 'اہم اعلانات و ہدایات', 'Broadcasts & leadership notices')}
            </Text>
          </View>
        </View>

        {announcements.length > 0 && (
          <View className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
              {announcements.length} {tr('सूचनाएँ', 'اعلانات', 'Notices')}
            </Text>
          </View>
        )}
      </View>

      {loading && announcements.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <View className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2 mb-2 animate-pulse" />
          <View className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-full animate-pulse" />
        </View>
      ) : announcements.length === 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-6 items-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <Megaphone size={28} color="#94a3b8" />
          <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center mt-2">
            {tr('कोई घोषणा उपलब्ध नहीं है।', 'کوئی اعلان نہیں ہے۔', 'No announcements yet.')}
          </Text>
          <Text className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">
            {tr(`${district} जिले हेतु नई घोषणाएँ यहाँ प्रदर्शित होंगी।`, 'نئے اعلانات یہاں دکھائی دیں گے۔', `Notices broadcast for ${district} will appear here.`)}
          </Text>
        </View>
      ) : (
        announcements.slice(0, 4).map((item) => (
          <View
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3 shadow-xs"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-1 mr-2">
                {item.sentBy}
              </Text>
              {item.city ? (
                <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 flex-row items-center">
                  <MapPin size={10} color="#64748b" />
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold ml-1">
                    {item.city}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text className="text-sm text-slate-700 dark:text-slate-300 leading-5">
              {item.message}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
