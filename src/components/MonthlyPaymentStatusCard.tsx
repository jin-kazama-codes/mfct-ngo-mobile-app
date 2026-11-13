import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { Donation, FemaleFamilyMember, Language, User } from '../types';
import { getDonations } from '../services/donationService';
import { getFemaleFamilyMembers } from '../services/memberService';
import { updateUser } from '../services/userService';
import {
  MONTHLY_EVENTS,
  emitDonationsUpdated,
  emitUserUpdated,
  useAppState,
} from '../context/AppStateProvider';
import { getLanguageCode } from '../lib/translateEntity';
import { DynamicText } from './DynamicText';
import {
  FEMALE_MONTHLY_FEE_INR,
  PRIMARY_MONTHLY_FEE_INR,
  formatBillingMonthLabel,
  formatShortDate,
  getMonthlySummary,
} from '../lib/monthlyPaymentUtils';

interface MonthlyPaymentStatusCardProps {
  user: User;
  variant?: 'compact' | 'full';
  onPayPress?: (dueTargetIds: string[]) => void;
  onViewDetailsPress?: () => void;
}

export const MonthlyPaymentStatusCard: React.FC<MonthlyPaymentStatusCardProps> = ({
  user,
  variant = 'compact',
  onPayPress,
  onViewDetailsPress,
}) => {
  const { handleUpdateActiveUser } = useAppState();
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language) as Language;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = useCallback(
    (hi: string, ur: string, en: string) =>
      lang === 'hi' ? hi : lang === 'ur' ? ur : en,
    [lang]
  );

  const [donations, setDonations] = useState<Donation[]>([]);
  const [femaleMembers, setFemaleMembers] = useState<FemaleFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPrimaryToggle, setUpdatingPrimaryToggle] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [donList, famList] = await Promise.all([
        getDonations(user.id),
        getFemaleFamilyMembers(user.id),
      ]);
      setDonations(donList || []);
      setFemaleMembers(famList || []);
    } catch (err) {
      console.warn('MonthlyPaymentStatusCard loadData warning:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener(
      MONTHLY_EVENTS.DONATIONS_UPDATED,
      loadData
    );
    const sub2 = DeviceEventEmitter.addListener(
      MONTHLY_EVENTS.FEMALE_MEMBERS_UPDATED,
      loadData
    );
    const sub3 = DeviceEventEmitter.addListener(
      MONTHLY_EVENTS.USER_UPDATED,
      loadData
    );
    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
    };
  }, [loadData]);

  const summary = useMemo(
    () => getMonthlySummary(user, femaleMembers, donations),
    [user, femaleMembers, donations]
  );

  const optedInFemaleStatuses = useMemo(
    () => summary.femaleStatuses.filter((fs) => fs.isOptedIn),
    [summary.femaleStatuses]
  );

  const currentMonthLabel = useMemo(
    () => formatBillingMonthLabel(summary.currentMonthKey, lang),
    [summary.currentMonthKey, lang]
  );

  const handleTogglePrimaryMonthly = async (val: boolean) => {
    if (!user?.id || updatingPrimaryToggle) return;
    const nextStr = val ? 'yes' : 'no';
    setUpdatingPrimaryToggle(true);
    try {
      await updateUser(user.id, {
        monthlyPayment: nextStr,
        monthly_payment: nextStr,
      });
      await handleUpdateActiveUser({
        ...user,
        monthlyPayment: nextStr,
        monthly_payment: nextStr,
      });
      emitUserUpdated({ id: user.id, monthlyPayment: nextStr, monthly_payment: nextStr });
      emitDonationsUpdated();
    } catch (err) {
      console.warn('Failed to toggle user monthly payment:', err);
    } finally {
      setUpdatingPrimaryToggle(false);
    }
  };

  const handlePay = (targetIds: string[]) => {
    if (onPayPress) {
      onPayPress(targetIds);
      return;
    }
    router.push({
      pathname: '/(stacks)/donation',
      params: {
        initialMode: 'monthly_fee',
        preselectedIds: targetIds.join(','),
      },
    });
  };

  const handleViewDetails = () => {
    if (onViewDetailsPress) {
      onViewDetailsPress();
      return;
    }
    router.push('/(drawer)/dashboard/female-members');
  };

  const renderStatusPill = (status: string) => {
    if (status === 'not_opted_in') {
      return (
        <View style={[s.pill, { backgroundColor: isDark ? 'rgba(148,163,184,0.14)' : '#f1f5f9', borderColor: '#94a3b840' }]}>
          <Text style={[s.pillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {tr('बंद (नहीं)', 'بند (نہیں)', 'Off (No)')}
          </Text>
        </View>
      );
    }
    if (status === 'paid') {
      return (
        <View style={[s.pill, { backgroundColor: isDark ? 'rgba(16,185,129,0.18)' : '#ecfdf5', borderColor: '#10b98140' }]}>
          <CheckCircle2 color="#10b981" size={11} />
          <Text style={[s.pillText, { color: '#10b981' }]}>
            {tr('भुगतान पूर्ण', 'ادائیگی مکمل', 'Paid')}
          </Text>
        </View>
      );
    }
    if (status === 'pending_verification') {
      return (
        <View style={[s.pill, { backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : '#fffbeb', borderColor: '#f59e0b40' }]}>
          <Clock color="#f59e0b" size={11} />
          <Text style={[s.pillText, { color: '#d97706' }]}>
            {tr('सत्यापन लंबित', 'تصدیق زیرِ غور', 'Pending')}
          </Text>
        </View>
      );
    }
    if (status === 'kyc_pending') {
      return (
        <View style={[s.pill, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#eef2ff', borderColor: '#6366f140' }]}>
          <ShieldAlert color="#6366f1" size={11} />
          <Text style={[s.pillText, { color: '#6366f1' }]}>
            {tr('KYC लंबित', 'KYC زیرِ غور', 'KYC Pending')}
          </Text>
        </View>
      );
    }
    if (status === 'rejected') {
      return (
        <View style={[s.pill, { backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : '#fef2f2', borderColor: '#ef444440' }]}>
          <AlertCircle color="#ef4444" size={11} />
          <Text style={[s.pillText, { color: '#ef4444' }]}>
            {tr('अस्वीकृत', 'مسترد', 'Rejected')}
          </Text>
        </View>
      );
    }
    return (
      <View style={[s.pill, { backgroundColor: isDark ? 'rgba(244,63,94,0.18)' : '#fff1f2', borderColor: '#f43f5e40' }]}>
        <AlertCircle color="#f43f5e" size={11} />
        <Text style={[s.pillText, { color: '#e11d48' }]}>
          {tr('बकाया', 'باقی', 'Due')}
        </Text>
      </View>
    );
  };

  const palette = {
    cardBg: isDark ? '#0f172a' : '#ffffff',
    cardBorder: isDark ? '#1e293b' : '#e2e8f0',
    subCardBg: isDark ? '#162033' : '#f8fafc',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textSub: isDark ? '#94a3b8' : '#64748b',
    divider: isDark ? '#1e293b' : '#f1f5f9',
  };

  const maxCompactFemales = 4;
  const displayedFemales =
    variant === 'compact'
      ? optedInFemaleStatuses.slice(0, maxCompactFemales)
      : optedInFemaleStatuses;
  const hiddenFemaleCount =
    variant === 'compact'
      ? Math.max(0, optedInFemaleStatuses.length - maxCompactFemales)
      : 0;

  return (
    <View style={[s.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={[s.iconBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#ecfdf5' }]}>
            <CalendarCheck2 color="#10b981" size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: palette.textMain }]} numberOfLines={1}>
              {tr('मासिक सहयोग', 'ماہانہ چندہ', 'Monthly Contribution')}
            </Text>
            <Text style={[s.subtitle, { color: palette.textSub }]} numberOfLines={1}>
              {currentMonthLabel}
            </Text>
          </View>
        </View>

        <View
          style={[
            s.countBadge,
            {
              backgroundColor:
                summary.totalEligibleCount === 0
                  ? isDark
                    ? 'rgba(148,163,184,0.16)'
                    : '#f1f5f9'
                  : summary.totalDueCount === 0
                    ? isDark
                      ? 'rgba(16,185,129,0.2)'
                      : '#d1fae5'
                    : isDark
                      ? 'rgba(245,158,11,0.18)'
                      : '#fef3c7',
            },
          ]}
        >
          <Text
            style={[
              s.countBadgeText,
              {
                color:
                  summary.totalEligibleCount === 0
                    ? palette.textSub
                    : summary.totalDueCount === 0
                      ? '#10b981'
                      : '#d97706',
              },
            ]}
          >
            {summary.totalEligibleCount === 0
              ? tr('बंद (No)', 'بند (No)', 'Off (No)')
              : `${summary.totalPaidCount}/${summary.totalEligibleCount} ${tr('पूर्ण', 'مکمل', 'Paid')}`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={[s.loadingText, { color: palette.textSub }]}>
            {tr('स्थिति लोड हो रही है...', 'لوڈ ہو رہا ہے...', 'Checking status...')}
          </Text>
        </View>
      ) : (
        <>
          {/* Primary Member Toggle + Status Box */}
          <View style={[s.entityCard, { backgroundColor: palette.subCardBg, borderColor: palette.divider }]}>
            <View style={s.entityTopRow}>
              <View style={s.entityNameWrap}>
                <UserCheck color="#10b981" size={14} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.entityLabel, { color: palette.textMain }]} numberOfLines={1}>
                    {tr('मुख्य सदस्य', 'بنیادی رکن', 'Primary Member')} (₹{PRIMARY_MONTHLY_FEE_INR}/mo)
                  </Text>
                  <DynamicText
                    text={user.name || tr('सदस्य', 'رکن', 'Member')}
                    style={[s.entitySub, { color: palette.textSub }]}
                    numberOfLines={1}
                  />
                </View>
              </View>
              <Switch
                value={summary.primary.isOptedIn}
                disabled={updatingPrimaryToggle}
                onValueChange={handleTogglePrimaryMonthly}
                trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            {summary.primary.isOptedIn ? (
              <View style={s.metaRow}>
                <View style={{ flex: 1 }}>
                  {summary.primary.latestDate ? (
                    <Text style={[s.metaText, { color: palette.textSub }]}>
                      {summary.primary.status === 'pending_verification'
                        ? tr('लंबित:', 'زیرِ غور:', 'Submitted:')
                        : tr('अंतिम भुगतान:', 'آخری ادائیگی:', 'Last paid:')}{' '}
                      {formatShortDate(summary.primary.latestDate, lang)}
                      {summary.primary.latestAmount > 0 ? ` • ₹${summary.primary.latestAmount}` : ''}
                    </Text>
                  ) : (
                    <Text style={[s.metaText, { color: palette.textSub }]}>
                      {tr('कोई मासिक शुल्क रिकॉर्ड नहीं', 'کوئی ریکارڈ نہیں', 'No monthly fee record yet')}
                    </Text>
                  )}
                </View>

                {renderStatusPill(summary.primary.status)}

                {variant === 'full' && summary.primary.status === 'due' && (
                  <TouchableOpacity
                    onPress={() => handlePay(['primary'])}
                    style={s.miniPayBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={s.miniPayBtnText}>
                      {tr(`₹${PRIMARY_MONTHLY_FEE_INR} जमा करें`, `₹${PRIMARY_MONTHLY_FEE_INR} ادا کریں`, `Pay ₹${PRIMARY_MONTHLY_FEE_INR}`)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={s.metaRow}>
                <Text style={[s.metaText, { color: palette.textSub }]}>
                  {tr(
                    'मासिक शुल्क बंद (नहीं) है — चालू करने के लिए टॉगल ऑन करें',
                    'ماہانہ فیس بند (نہیں) ہے — آن کرنے کے لیے ٹوگل دبائیں',
                    'Monthly fee is OFF (No) — toggle ON above to opt in'
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Female Family Members Section (only tracks opted-in 'yes' female members) */}
          <View style={[s.femaleHeader, { borderTopColor: palette.divider }]}>
            <View style={s.femaleTitleWrap}>
              <Heart color="#ec4899" size={13} />
              <Text style={[s.femaleSectionTitle, { color: palette.textMain }]}>
                {tr('महिला परिवार सदस्य', 'خواتین اہل خانہ', 'Female Family Members')} (₹{FEMALE_MONTHLY_FEE_INR}/mo)
              </Text>
            </View>
            <TouchableOpacity onPress={handleViewDetails} style={s.manageLink} activeOpacity={0.7}>
              <Text style={s.manageLinkText}>
                {summary.femaleStatuses.length > 0
                  ? tr('प्रबंधित करें', 'منظم کریں', 'Manage')
                  : tr('जोड़ें', 'شامل کریں', 'Add')}
              </Text>
              <ChevronRight color="#10b981" size={13} />
            </TouchableOpacity>
          </View>

          {optedInFemaleStatuses.length === 0 ? (
            <View style={[s.emptyFemaleBox, { backgroundColor: palette.subCardBg, borderColor: palette.divider }]}>
              <Users color={palette.textSub} size={15} />
              <Text style={[s.emptyFemaleText, { color: palette.textSub }]}>
                {summary.femaleTotalCount > 0
                  ? tr(
                    `${summary.femaleTotalCount} महिला सदस्य दर्ज हैं (मासिक शुल्क: नहीं) — बदलने के लिए "प्रबंधित करें" खोलें`,
                    `${summary.femaleTotalCount} خواتین اراکین درج ہیں (ماہانہ فیس: نہیں) — تبدیلی کے لیے کھولیں`,
                    `${summary.femaleTotalCount} female member(s) registered with Monthly Fee = No`
                  )
                  : tr(
                    'कोई महिला परिवार सदस्य मासिक शुल्क के लिए सक्रिय नहीं है',
                    'کوئی خاتون رکن ماہانہ فیس کے لیے فعال نہیں ہے',
                    'No female family members opted into monthly fee'
                  )}
              </Text>
            </View>
          ) : (
            <View style={s.femaleList}>
              {displayedFemales.map((fs) => (
                <View
                  key={fs.member.id}
                  style={[s.femaleRow, { backgroundColor: palette.subCardBg, borderColor: palette.divider }]}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <DynamicText
                      text={fs.member.name}
                      style={[s.femaleName, { color: palette.textMain }]}
                      numberOfLines={1}
                    />
                    <Text style={[s.femaleMeta, { color: palette.textSub }]} numberOfLines={1}>
                      {fs.member.relation} • ₹{FEMALE_MONTHLY_FEE_INR}/mo
                      {fs.latestDate ? ` • ${formatShortDate(fs.latestDate, lang)}` : ''}
                    </Text>
                  </View>

                  <View style={s.femaleRight}>
                    {renderStatusPill(fs.status)}
                    {variant === 'full' && fs.status === 'due' && (
                      <TouchableOpacity
                        onPress={() => handlePay([fs.member.id])}
                        style={[s.miniPayBtn, { marginLeft: 6 }]}
                        activeOpacity={0.8}
                      >
                        <Text style={s.miniPayBtnText}>₹{FEMALE_MONTHLY_FEE_INR}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {hiddenFemaleCount > 0 && (
                <TouchableOpacity onPress={handleViewDetails} style={s.moreLinkBtn}>
                  <Text style={s.moreLinkText}>
                    +{hiddenFemaleCount} {tr('और महिला सदस्य देखें', 'مزید خواتین اراکین دیکھیں', 'more female members')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action / Summary Banner (only shown when at least 1 target is opted in) */}
          {summary.totalEligibleCount === 0 ? null : summary.totalDueCount > 0 ? (
            <TouchableOpacity
              style={s.primaryPayBtn}
              onPress={() => handlePay(summary.dueTargetIds)}
              activeOpacity={0.85}
            >
              <CreditCard color="#ffffff" size={16} />
              <Text style={s.primaryPayBtnText}>
                {tr(
                  `मासिक शुल्क जमा करें (₹${summary.suggestedDueAmount})`,
                  `ماہانہ فیس ادا کریں (₹${summary.suggestedDueAmount})`,
                  `Pay Monthly Fee (₹${summary.suggestedDueAmount})`
                )}
              </Text>
            </TouchableOpacity>
          ) : summary.totalPendingCount > 0 ? (
            <View style={[s.infoBanner, { backgroundColor: isDark ? 'rgba(245,158,11,0.14)' : '#fffbeb', borderColor: '#f59e0b40' }]}>
              <Clock color="#d97706" size={14} />
              <Text style={[s.infoBannerText, { color: '#d97706' }]}>
                {tr(
                  'मासिक शुल्क भुगतान एडमिन सत्यापन के लिए लंबित है',
                  'ماہانہ فیس کی ادائیگی ایڈمن تصدیق کے لیے زیرِ غور ہے',
                  'Monthly fee payment is awaiting admin verification'
                )}
              </Text>
            </View>
          ) : (
            <View style={[s.infoBanner, { backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : '#ecfdf5', borderColor: '#10b98140' }]}>
              <CheckCircle2 color="#10b981" size={14} />
              <Text style={[s.infoBannerText, { color: '#10b981' }]}>
                {tr(
                  'इस माह का सभी पात्र शुल्क जमा हो चुका है',
                  'اس ماہ کی تمام اہل فیس ادا ہو چکی ہے',
                  'All eligible monthly fees are paid for this month'
                )}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  entityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  entityNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 7,
  },
  entityLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  entitySub: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  metaText: {
    fontSize: 10.5,
    fontWeight: '500',
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  miniPayBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniPayBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  femaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 6,
    borderTopWidth: 1,
  },
  femaleTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  femaleSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageLinkText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyFemaleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  emptyFemaleText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  femaleList: {
    gap: 6,
    marginBottom: 10,
  },
  femaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  femaleName: {
    fontSize: 12,
    fontWeight: '700',
  },
  femaleMeta: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  femaleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreLinkBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  primaryPayBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryPayBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  infoBanner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  infoBannerText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
});

export default MonthlyPaymentStatusCard;
