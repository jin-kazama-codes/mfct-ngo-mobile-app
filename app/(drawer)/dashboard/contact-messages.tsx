import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { MessageSquare, Calendar, Mail, Phone, User, Clock, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import { getContactMessages } from '../../../src/services/contactService';
import { ContactMessage } from '../../../src/types';
import DynamicText from '../../../src/components/DynamicText';
import { ContactMessagesSkeleton } from '../../../src/components/SkeletonLoader';

export default function ContactMessagesScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getContactMessages();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load contact messages:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-[#020617]">

      {/* ── Header Banner ── */}
      <View className="flex-row items-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <View className="w-11 h-11 rounded-xl items-center justify-center bg-emerald-50 dark:bg-emerald-500/15">
          <MessageSquare color="#10b981" size={24} />
        </View>
        <View className="flex-1">
          <Text className="text-[17px] font-extrabold text-slate-900 dark:text-white">
            {t('admin.tabContactMessages', 'Contact Messages')}
          </Text>
          <Text className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
            {messages.length} {t('admin.messages_total', 'total inquiries received')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          className="w-9 h-9 rounded-xl items-center justify-center bg-slate-100 dark:bg-slate-800"
        >
          <RefreshCw color={isDark ? '#94a3b8' : '#64748b'} size={16} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ContactMessagesSkeleton isDark={isDark} />
      ) : messages.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-18 h-18 rounded-full items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-500/15">
            <MessageSquare color="#10b981" size={36} />
          </View>
          <Text className="text-lg font-extrabold mb-1.5 text-slate-900 dark:text-white">
            {t('admin.no_messages', 'No Messages Found')}
          </Text>
          <Text className="text-[13px] text-center leading-[18px] text-slate-500 dark:text-slate-400">
            {t('admin.no_pending_kyc', 'Messages submitted through the contact form will appear here.')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
        >
          {messages.map((msg) => {
            const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '';
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View
                key={msg.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-3.5 shadow-sm"
              >
                {/* Header Row: User Name & Timestamp */}
                <View className="mb-2.5">
                  <View className="flex-row items-center gap-2.5">
                    <View className="w-9.5 h-9.5 rounded-full items-center justify-center bg-emerald-50 dark:bg-emerald-500/15">
                      <User color="#10b981" size={18} />
                    </View>
                    <View className="flex-1">
                      <DynamicText
                        text={msg.name}
                        lang={lang}
                        style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}
                      />
                      <View className="flex-row items-center mt-0.5 gap-0.5">
                        <Calendar color={isDark ? '#94a3b8' : '#64748b'} size={11} />
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{dateStr}</Text>
                        <Clock color={isDark ? '#94a3b8' : '#64748b'} size={11} style={{ marginLeft: 6 }} />
                        <Text className="text-[11px] text-slate-500 dark:text-slate-400">{timeStr}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Message Body */}
                <View className="rounded-xl p-3 mb-2.5 bg-slate-100 dark:bg-slate-800">
                  <DynamicText
                    text={msg.message}
                    lang={lang}
                    style={{ fontSize: 13, lineHeight: 19, color: isDark ? '#f8fafc' : '#0f172a' }}
                  />
                </View>

                {/* Actions: Phone & Email */}
                <View className="flex-row items-center flex-wrap gap-2">
                  {msg.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${msg.phone}`)}
                      className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15"
                    >
                      <Phone color="#10b981" size={13} />
                      <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{msg.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {msg.email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${msg.email}`)}
                      className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                    >
                      <Mail color={isDark ? '#94a3b8' : '#64748b'} size={13} />
                      <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400" numberOfLines={1}>
                        {msg.email}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
