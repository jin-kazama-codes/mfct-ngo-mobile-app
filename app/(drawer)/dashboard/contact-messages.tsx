import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StyleSheet,
} from 'react-native';
import { MessageSquare, Calendar, Mail, Phone, User, Clock, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import { getContactMessages } from '../../../src/services/contactService';
import { ContactMessage } from '../../../src/types';
import DynamicText from '../../../src/components/DynamicText';

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

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    cardBg: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
    pillBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primaryLight }]}>
          <MessageSquare color={colors.primary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>
            {t('admin.tabContactMessages', 'Contact Messages')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSub }]}>
            {messages.length} {t('admin.messages_total', 'total inquiries received')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: colors.pillBg }]}
        >
          <RefreshCw color={colors.textSub} size={16} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
            <MessageSquare color={colors.primary} size={36} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
            {t('admin.no_messages', 'No Messages Found')}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textSub }]}>
            {t('admin.no_pending_kyc', 'Messages submitted through the contact form will appear here.')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {messages.map((msg) => {
            const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '';
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <View
                key={msg.id}
                style={[styles.msgCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              >
                {/* Header Row: User Name & Timestamp */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.userInfoRow}>
                    <View style={[styles.userAvatarWrap, { backgroundColor: colors.primaryLight }]}>
                      <User color={colors.primary} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DynamicText
                        text={msg.name}
                        lang={lang}
                        style={[styles.userNameText, { color: colors.textMain }]}
                      />
                      <View style={styles.timestampRow}>
                        <Calendar color={colors.textSub} size={11} />
                        <Text style={[styles.timestampText, { color: colors.textSub }]}>{dateStr}</Text>
                        <Clock color={colors.textSub} size={11} style={{ marginLeft: 6 }} />
                        <Text style={[styles.timestampText, { color: colors.textSub }]}>{timeStr}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Message Body with real-time dynamic translation */}
                <View style={[styles.messageBox, { backgroundColor: colors.pillBg }]}>
                  <DynamicText
                    text={msg.message}
                    lang={lang}
                    style={[styles.messageText, { color: colors.textMain }]}
                  />
                </View>

                {/* Actions: Phone & Email */}
                <View style={styles.actionsRow}>
                  {msg.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${msg.phone}`)}
                      style={[styles.actionChip, { backgroundColor: colors.primaryLight }]}
                    >
                      <Phone color={colors.primary} size={13} />
                      <Text style={[styles.actionChipText, { color: colors.primary }]}>{msg.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {msg.email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${msg.email}`)}
                      style={[styles.actionChip, { backgroundColor: colors.pillBg }]}
                    >
                      <Mail color={colors.textSub} size={13} />
                      <Text style={[styles.actionChipText, { color: colors.textSub }]} numberOfLines={1}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  msgCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    marginBottom: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  timestampText: {
    fontSize: 11,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
