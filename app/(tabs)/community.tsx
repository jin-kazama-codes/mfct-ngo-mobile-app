import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { getCommunities } from '../../src/services/communityService';
import { useAppState } from '../../src/context/AppStateProvider';
import { Community } from '../../src/types';
import {
  getLanguageCode,
  translateRole,
  translateCity,
  translateState,
  translateAdminName,
  translateCommunityDesc,
  translateCommunityName,
} from '../../src/lib/translateEntity';
import { useDynamicTranslatedText } from '../../src/lib/autoTranslate';
import {
  Users,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Building2,
  Search,
  CheckCircle2,
  UserPlus,
  Calendar,
  Flame,
  FileText,
  UserCheck,
} from 'lucide-react-native';

// Theme-aware Card Skeleton Component
function CommunityCardSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? '#1e293b' : '#ffffff';
  const pulseBg = isDark ? '#334155' : '#e2e8f0';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.coverImg, { backgroundColor: pulseBg }]} />
      <View style={styles.cardBody}>
        <View style={{ height: 14, width: '70%', backgroundColor: pulseBg, borderRadius: 6, marginBottom: 8 }} />
        <View style={{ height: 10, width: '40%', backgroundColor: pulseBg, borderRadius: 4, marginBottom: 16 }} />
        <View style={{ height: 50, width: '100%', backgroundColor: pulseBg, borderRadius: 10, marginBottom: 12 }} />
        <View style={{ height: 44, width: '100%', backgroundColor: pulseBg, borderRadius: 12 }} />
      </View>
    </View>
  );
}

// ─── DynamicCommunityCard ────────────────────────────────────────────────
// Extracted as its own component so hooks (useDynamicTranslatedText) can be
// called at the component top-level for full-field real-time dynamic translation.
interface DynamicCommunityCardProps {
  comm: Community;
  lang: ReturnType<typeof getLanguageCode>;
  theme: any;
  isDark: boolean;
  isUserInComm: boolean;
  onJoin: (comm: Community) => void;
  t: any;
}

function DynamicCommunityCard({
  comm,
  lang,
  theme,
  isDark,
  isUserInComm,
  onJoin,
  t,
}: DynamicCommunityCardProps) {
  const [expandedDesc, setExpandedDesc] = useState(false);

  const displayName = useDynamicTranslatedText(comm.name, lang);
  const displayCity = useDynamicTranslatedText(comm.city, lang) || translateCity(comm.city, lang);
  const displayState = useDynamicTranslatedText(comm.state, lang) || translateState(comm.state, lang);
  const displayAdminName = useDynamicTranslatedText(comm.adminName, lang) || translateAdminName(comm.adminName, lang);
  const displayDescription = useDynamicTranslatedText(comm.description, lang) || translateCommunityDesc(comm.description, lang);
  const displayRole = translateRole(comm.adminRoleTitle || 'community admin', lang);

  const healthPct = Math.min(100, comm.healthScore ?? 80);
  const healthColor = healthPct >= 80 ? '#10b981' : healthPct >= 50 ? '#f59e0b' : '#ef4444';
  const descContent = displayDescription || comm.description || '';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      {/* Cover Image & Overlay Header */}
      <View style={styles.cardCoverContainer}>
        <Image
          source={{
            uri:
              comm.coverImage ||
              'https://images.unsplash.com/photo-1593113563332-e147ce367df0?q=80&w=400&auto=format&fit=crop',
          }}
          style={styles.coverImg}
          resizeMode="cover"
        />
        <View style={styles.coverGradientOverlay} />

        {/* Top Right Badges */}
        <View style={styles.topRightBadgesRow}>
          {/* Est Year Badge */}
          <View style={styles.estPillBadge}>
            <Calendar color="#ffffff" size={10} />
            <Text style={styles.estPillText}>
              {tr('स्थापना', 'قیام', 'Est.')} {comm.establishedYear || 2024}
            </Text>
          </View>

          {isUserInComm && (
            <View style={styles.yourCommBadge}>
              <CheckCircle2 color="#ffffff" size={11} />
              <Text style={styles.yourCommBadgeText}>
                {t('communities_page.your_comm_badge', 'Your Community')}
              </Text>
            </View>
          )}

          <View style={[styles.verifiedStatusBadge, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
            <Text style={{ color: '#6ee7b7', fontSize: 10, fontWeight: '700' }}>
              {comm.verifiedStatus === 'Verified'
                ? tr('सत्यापित', 'تصدیق شدہ', 'Verified')
                : comm.verifiedStatus === 'Pending'
                  ? tr('लंबित', 'زیر التواء', 'Pending')
                  : tr('चिह्नित', 'نشان زدہ', 'Flagged')}
            </Text>
          </View>
        </View>

        {/* Bottom Image Info: Avatar, Title & City */}
        <View style={styles.coverBottomInfo}>
          <Image
            source={{
              uri:
                comm.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(comm.name || 'C')}&background=059669&color=fff`,
            }}
            style={styles.avatarImg}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.locationRow}>
              <MapPin color="#34d399" size={12} />
              <Text style={styles.locationText} numberOfLines={1}>
                {displayCity}, {displayState}
              </Text>
            </View>
            <Text style={styles.coverTitleText} numberOfLines={1}>
              {displayName || comm.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        {/* Admin Info Row */}
        <View style={[styles.adminInfoBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
          <UserCheck color="#10b981" size={15} />
          <Text style={[styles.adminInfoText, { color: theme.textSub }]} numberOfLines={1}>
            <Text style={{ fontWeight: '700', color: theme.textMain }}>
              {tr('व्यवस्थापक: ', 'ایڈمن: ', 'Admin: ')}
            </Text>
            {displayAdminName || comm.adminName}
            <Text style={{ color: '#10b981', fontWeight: '700' }}> • {displayRole}</Text>
          </Text>
        </View>

        {/* Description / Mission */}
        {descContent ? (
          <View style={[styles.descContainer, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.descHeader}>
              <FileText color="#10b981" size={12} />
              <Text style={[styles.descHeading, { color: theme.textSub }]}>
                {tr('विवरण एवं उद्देश्य', 'تفصیل और مقصد', 'About & Mission')}
              </Text>
            </View>
            <Text
              style={[styles.descText, { color: theme.textMain }]}
              numberOfLines={expandedDesc ? undefined : 2}
            >
              {descContent}
            </Text>
            {descContent.length > 80 && (
              <TouchableOpacity
                onPress={() => setExpandedDesc(!expandedDesc)}
                style={styles.descToggleBtn}
              >
                <Text style={styles.descToggleText}>
                  {expandedDesc
                    ? tr('कम दिखाएं ▲', 'کم دکھائیں ▲', 'Show Less ▲')
                    : tr('और पढ़ें ▼', 'مزید پڑھیں ▼', 'Read More ▼')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* 2x2 Clean Metrics Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Members */}
            <View style={[styles.gridBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
              <Users color="#0284c7" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridVal, { color: theme.textMain }]}>
                  {comm.totalMembers ? comm.totalMembers.toLocaleString('en-IN') : 0}
                </Text>
                <Text style={[styles.gridLbl, { color: theme.textSub }]}>
                  {tr('कुल सदस्य', 'کل ممبران', 'Members')}
                </Text>
              </View>
            </View>

            {/* Funds Raised */}
            <View style={[styles.gridBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
              <TrendingUp color="#10b981" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridVal, { color: theme.textMain }]}>
                  ₹{comm.totalRaisedINR ? (comm.totalRaisedINR >= 100000 ? `${(comm.totalRaisedINR / 100000).toFixed(1)}L` : comm.totalRaisedINR.toLocaleString('en-IN')) : 0}
                </Text>
                <Text style={[styles.gridLbl, { color: theme.textSub }]}>
                  {tr('एकत्रित राशि', 'جمع رقم', 'Raised')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Active Campaigns */}
            <View style={[styles.gridBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
              <Flame color="#f59e0b" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridVal, { color: theme.textMain }]}>
                  {comm.activeCampaigns ?? 0}
                </Text>
                <Text style={[styles.gridLbl, { color: theme.textSub }]}>
                  {tr('सक्रिय अभियान', 'فعال مہمات', 'Campaigns')}
                </Text>
              </View>
            </View>

            {/* Established Year */}
            <View style={[styles.gridBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
              <Calendar color="#8b5cf6" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.gridVal, { color: theme.textMain }]}>
                  {comm.establishedYear || 2024}
                </Text>
                <Text style={[styles.gridLbl, { color: theme.textSub }]}>
                  {tr('स्थापना वर्ष', 'سال قیام', 'Est. Year')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Score Bar (Fixed pixel dimensions) */}
        <View style={styles.healthSection}>
          <View style={styles.healthLabelRow}>
            <Text style={[styles.healthLabel, { color: theme.textSub }]}>
              {tr('स्वास्थ्य स्कोर एवं विश्वसनीयता', 'ہیلتھ سکور اور اعتماد', 'Health Score & Trust')}
            </Text>
            <Text style={[styles.healthPct, { color: healthColor }]}>
              {healthPct}% {healthPct >= 80 ? tr('ग्रेड A', 'گریڈ A', 'Grade A') : ''}
            </Text>
          </View>
          <View style={[styles.healthTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View style={[styles.healthFill, { width: `${healthPct}%`, backgroundColor: healthColor }]} />
          </View>
        </View>

        {/* Join / Active Button */}
        <TouchableOpacity
          onPress={() => onJoin(comm)}
          style={[
            styles.joinBtn,
            isUserInComm
              ? { backgroundColor: '#059669' }
              : { backgroundColor: isDark ? '#10b981' : '#0f172a' }
          ]}
          activeOpacity={0.85}
        >
          {isUserInComm ? (
            <>
              <CheckCircle2 color="#ffffff" size={16} />
              <Text style={styles.joinBtnText}>
                {t('communities_page.active_member_btn', 'Active Community Member')}
              </Text>
            </>
          ) : (
            <>
              <Users color="#ffffff" size={16} />
              <Text style={styles.joinBtnText}>
                {t('communities_page.join_btn', 'Join Community (₹50)')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const router = useRouter();
  const { isAuthenticated, activeUser } = useAppState();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    bg: isDark ? '#090d16' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? '#334155' : '#e2e8f0',
    subCardBg: isDark ? '#131d2e' : '#f8fafc',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    inputBg: isDark ? '#131d2e' : '#ffffff',
    inputBorder: isDark ? '#334155' : '#cbd5e1',
    primary: '#10b981',
  };

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await getCommunities();
      setCommunities(data || []);
    } catch (err) {
      console.warn('Error loading communities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredCommunities = communities.filter((comm) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    const tName = translateCommunityName(comm.name, lang).toLowerCase();
    const tCity = translateCity(comm.city, lang).toLowerCase();
    const tState = translateState(comm.state, lang).toLowerCase();
    const tAdmin = translateAdminName(comm.adminName, lang).toLowerCase();

    return (
      comm.name.toLowerCase().includes(query) ||
      tName.includes(query) ||
      comm.city.toLowerCase().includes(query) ||
      tCity.includes(query) ||
      (comm.state && comm.state.toLowerCase().includes(query)) ||
      tState.includes(query) ||
      (comm.adminName && comm.adminName.toLowerCase().includes(query)) ||
      tAdmin.includes(query)
    );
  });

  const handleJoinCommunity = (comm: Community) => {
    if (isAuthenticated) {
      if (activeUser?.communityId === comm.id) {
        router.push('/(drawer)/dashboard');
      } else {
        router.push({
          pathname: '/(auth)/sign-up',
          params: { communityId: comm.id },
        });
      }
    } else {
      router.push({
        pathname: '/(auth)/sign-up',
        params: { communityId: comm.id },
      });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
      }
    >
      {/* Header Section */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.textMain, letterSpacing: -0.5 }}>
          {t('communities_page.title')}
        </Text>
        <Text style={{ fontSize: 12, color: theme.textSub, marginTop: 4, lineHeight: 18 }}>
          {t('communities_page.desc')}
        </Text>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <Search color="#94a3b8" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('communities_page.search_placeholder')}
            placeholderTextColor="#94a3b8"
            style={[styles.searchInput, { color: theme.textMain }]}
          />
        </View>
      </View>

      {/* Skeletons on initial load */}
      {loading ? (
        <View>
          <CommunityCardSkeleton isDark={isDark} />
          <CommunityCardSkeleton isDark={isDark} />
          <CommunityCardSkeleton isDark={isDark} />
        </View>
      ) : filteredCommunities.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Building2 color="#94a3b8" size={42} />
          <Text style={{ color: theme.textSub, fontWeight: '700', fontSize: 13, marginTop: 12 }}>
            {t('communities_page.empty')}
          </Text>
        </View>
      ) : (
        <View>
          {filteredCommunities.map((rawComm) => (
            <DynamicCommunityCard
              key={rawComm.id}
              comm={rawComm}
              lang={lang}
              theme={theme}
              isDark={isDark}
              isUserInComm={isAuthenticated && activeUser?.communityId === rawComm.id}
              onJoin={handleJoinCommunity}
              t={t}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    padding: 0,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardCoverContainer: {
    position: 'relative',
    height: 130,
    width: '100%',
    backgroundColor: '#0f172a',
  },
  coverImg: {
    width: '100%',
    height: 130,
  },
  coverGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topRightBadgesRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  estPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  yourCommBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  yourCommBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coverBottomInfo: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  coverTitleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  cardBody: {
    padding: 14,
  },
  adminInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminInfoText: {
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },
  descContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  descHeading: {
    fontSize: 11,
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    lineHeight: 17,
  },
  descToggleBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  descToggleText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    marginTop: 10,
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  gridVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridLbl: {
    fontSize: 10,
    marginTop: 1,
  },
  healthSection: {
    marginTop: 12,
  },
  healthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  healthLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  healthPct: {
    fontSize: 11,
    fontWeight: '800',
  },
  healthTrack: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthFill: {
    height: 6,
    borderRadius: 3,
  },
  joinBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Banner Styles
  bannerContainer: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    marginVertical: 16,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    marginBottom: 10,
  },
  bannerTagText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 14,
  },
  bannerList: {
    gap: 8,
    marginBottom: 18,
  },
  bannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerItemText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bannerBtnText: {
    color: '#022c22',
    fontSize: 13,
    fontWeight: '900',
  },
});
