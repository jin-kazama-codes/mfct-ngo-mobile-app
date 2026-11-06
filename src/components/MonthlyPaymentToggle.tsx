import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { User, Donation } from '../types';
import { getDonations } from '../services/donationService';
import { updateUser } from '../services/userService';
import { useAppState } from '../context/AppStateProvider';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Calendar, Heart, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';

interface MonthlyPaymentToggleProps {
  user: User | null;
  onPaymentUpdated?: (updated: User) => void;
  onPayPressed?: () => void;
  showSwitch?: boolean;
}

export const MonthlyPaymentToggle: React.FC<MonthlyPaymentToggleProps> = ({
  user,
  onPaymentUpdated,
  onPayPressed,
  showSwitch = true,
}) => {
  const { handleUpdateActiveUser } = useAppState();
  const { i18n } = useTranslation();
  const router = useRouter();

  const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi')
    ? 'hi'
    : (i18n.resolvedLanguage || i18n.language || 'en').startsWith('ur')
      ? 'ur'
      : 'en';

  const tr = (hi: string, ur: string, en: string) => {
    if (currentLang === 'hi') return hi;
    if (currentLang === 'ur') return ur;
    return en;
  };

  const getMonthName = (monthIdx: number, lang: string) => {
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const hiMonths = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'];
    const urMonths = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];
    if (lang === 'hi') return hiMonths[monthIdx];
    if (lang === 'ur') return urMonths[monthIdx];
    return enMonths[monthIdx];
  };

  const initialVal = Boolean(
    user?.monthlyPayment === 'yes' ||
    user?.monthly_payment === 'yes' ||
    user?.monthlyPayment === true ||
    user?.monthly_payment === true
  );

  const [isMonthly, setIsMonthly] = useState<boolean>(initialVal);
  const [updating, setUpdating] = useState<boolean>(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState<boolean>(false);

  useEffect(() => {
    setIsMonthly(
      Boolean(
        user?.monthlyPayment === 'yes' ||
        user?.monthly_payment === 'yes' ||
        user?.monthlyPayment === true ||
        user?.monthly_payment === true
      )
    );
  }, [user?.monthlyPayment, user?.monthly_payment]);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      setLoadingDonations(true);
      getDonations(user.id)
        .then((data) => {
          if (isMounted) setDonations(data || []);
        })
        .catch((err) => {
          console.warn('Error fetching donations for monthly payment:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingDonations(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggle = async (val: boolean) => {
    if (!user?.id || updating) return;
    const nextStr = val ? 'yes' : 'no';
    setIsMonthly(val);
    setUpdating(true);

    try {
      const updatedUser: User = {
        ...user,
        monthlyPayment: nextStr,
        monthly_payment: nextStr,
      };
      await handleUpdateActiveUser(updatedUser);
      await updateUser(user.id, {
        monthlyPayment: nextStr,
        monthly_payment: nextStr,
      });
      onPaymentUpdated?.(updatedUser);
    } catch (err) {
      console.warn('Failed to update monthly payment in toggle:', err);
      setIsMonthly(!val);
    } finally {
      setUpdating(false);
    }
  };

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
  const lastMonthYear = currentMonthIdx === 0 ? currentYear - 1 : currentYear;

  const currentMonthName = getMonthName(currentMonthIdx, currentLang);
  const lastMonthName = getMonthName(lastMonthIdx, currentLang);

  const validDonations = donations.filter((d) => d.status !== 'rejected');
  const latestDonation = validDonations.length > 0 ? validDonations[0] : null;

  let latestPaymentDate: Date | null = null;
  let latestPaymentAmount = 0;

  if (latestDonation) {
    if (latestDonation.date) {
      const t = new Date(latestDonation.date).getTime();
      if (!isNaN(t) && t > 0) latestPaymentDate = new Date(t);
    }
    latestPaymentAmount = latestDonation.amountINR || 0;
  } else if (user?.monthly_payment_date || user?.monthlyPaymentDate) {
    const dStr = (user.monthly_payment_date || user.monthlyPaymentDate) as string;
    const parsed = new Date(dStr);
    if (!isNaN(parsed.getTime())) latestPaymentDate = parsed;
    latestPaymentAmount = user.monthly_payment_amount || user.monthlyPaymentAmount || 0;
  } else if (user?.paymentUtr && (user?.joinDate || (user as any)?.created_at)) {
    const parsed = new Date(user.joinDate || (user as any)?.created_at);
    if (!isNaN(parsed.getTime())) latestPaymentDate = parsed;
    latestPaymentAmount = user.membershipFee || 0;
  }

  const isPaidThisMonth = Boolean(
    latestPaymentDate &&
    latestPaymentDate.getMonth() === currentMonthIdx &&
    latestPaymentDate.getFullYear() === currentYear
  );

  const isPaidLastMonth = Boolean(
    latestPaymentDate &&
    latestPaymentDate.getMonth() === lastMonthIdx &&
    latestPaymentDate.getFullYear() === lastMonthYear
  );

  const shouldShowDetails = !showSwitch || isMonthly;

  const formattedPaymentDate = latestPaymentDate
    ? latestPaymentDate.toLocaleDateString(currentLang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  // If in drawer mode (showSwitch = false) and monthly payment is OFF, do not show at all!
  if (!showSwitch && !isMonthly) {
    return null;
  }

  const handlePay = () => {
    if (onPayPressed) {
      onPayPressed();
    } else {
      router.push('/(stacks)/donation');
    }
  };

  return (
    <View
      style={{
        borderRadius: 16,
        padding: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.25)',
      }}
    >
      {/* Switch Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Calendar color="#10b981" size={17} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
              {tr('मासिक भुगतान', 'ماہانہ ادائیگی', 'Monthly Payment')}
            </Text>
            <Text style={{ fontSize: 10, color: '#64748b' }} numberOfLines={1}>
              {tr('नियमित सहयोग योगदान', 'باقاعدہ امدادی تعاون', 'Regular Support')}
            </Text>
          </View>
        </View>

        {showSwitch ? (
          /* Yes/No Switch */
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: isMonthly ? '#059669' : '#64748b' }}>
              {isMonthly ? tr('हाँ', 'ہاں', 'YES') : tr('नहीं', 'نہیں', 'NO')}
            </Text>
            <Switch
              value={isMonthly}
              onValueChange={handleToggle}
              disabled={updating}
              trackColor={{ false: '#cbd5e1', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        ) : (
          /* Status Badge when switch is hidden in drawer */
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: isPaidThisMonth ? 'rgba(16, 185, 129, 0.15)' : '#fef3c7',
              borderWidth: 1,
              borderColor: isPaidThisMonth ? 'rgba(16, 185, 129, 0.3)' : '#fde68a',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: isPaidThisMonth ? '#047857' : '#92400e',
              }}
            >
              {isPaidThisMonth ? tr('पूर्ण ✓', 'مکمل ✓', 'Paid ✓') : tr('बाकी', 'واجب الادا', 'Due')}
            </Text>
          </View>
        )}
      </View>

      {/* Details Box */}
      {shouldShowDetails && (
        <View
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(16, 185, 129, 0.2)',
          }}
        >
          {loadingDonations ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={{ fontSize: 11, color: '#64748b' }}>
                {tr('जांच हो रही है...', 'جانچ جاری ہے...', 'Checking status...')}
              </Text>
            </View>
          ) : isPaidThisMonth ? (
            /* PAID THIS MONTH */
            <View style={{ gap: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  alignSelf: 'flex-start',
                }}
              >
                <CheckCircle2 color="#059669" size={14} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>
                  {tr(
                    `${currentMonthName} माह: भुगतान पूर्ण ✓`,
                    `${currentMonthName} کی ادائیگی: مکمل ✓`,
                    `${currentMonthName}: Paid ✓`
                  )}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: '#64748b', paddingLeft: 4 }}>
                {tr('भुगतान तारीख:', 'تاریخ:', 'Paid on:')} <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formattedPaymentDate}</Text>
                {latestPaymentAmount > 0 ? ` (₹${latestPaymentAmount.toLocaleString('en-IN')})` : ''}
              </Text>
            </View>
          ) : isPaidLastMonth ? (
            /* PAID LAST MONTH -> SHOW DETAILS & INDICATE THIS MONTH DUE */
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: '#fef3c7',
                  alignSelf: 'flex-start',
                }}
              >
                <Clock color="#b45309" size={14} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>
                  {tr(
                    `${currentMonthName} माह: भुगतान बाकी है`,
                    `${currentMonthName} کی ادائیگی: واجب الادا`,
                    `${currentMonthName}: Due`
                  )}
                </Text>
              </View>

              {/* Last month payment details */}
              <View
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: '#fde68a',
                }}
              >
                <Text style={{ fontSize: 11, color: '#475569' }}>
                  <Text style={{ fontWeight: '700', color: '#b45309' }}>
                    {tr('पिछला भुगतान:', 'پچھلی ادائیگی:', 'Last Payment:')}{' '}
                  </Text>
                  {lastMonthName} {lastMonthYear}
                </Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {tr('तारीख:', 'تاریخ:', 'Date:')} {formattedPaymentDate}
                  {latestPaymentAmount > 0 ? ` • ₹${latestPaymentAmount.toLocaleString('en-IN')}` : ''}
                </Text>
              </View>

              {/* Pay CTA */}
              <TouchableOpacity
                onPress={handlePay}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: '#10b981',
                }}
              >
                <Heart color="#ffffff" size={13} fill="#ffffff" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                  {tr(
                    `${currentMonthName} माह का भुगतान करें`,
                    `${currentMonthName} کی ادائیگی کریں`,
                    `Pay for ${currentMonthName}`
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* NO RECORD / OLDER -> DUE */
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: '#fef3c7',
                  alignSelf: 'flex-start',
                }}
              >
                <AlertCircle color="#b45309" size={14} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>
                  {tr(
                    `${currentMonthName} माह: भुगतान बाकी है`,
                    `${currentMonthName} کی ادائیگی: واجب الادا`,
                    `${currentMonthName}: Due`
                  )}
                </Text>
              </View>

              {latestPaymentDate && (
                <Text style={{ fontSize: 10, color: '#64748b', paddingLeft: 4 }}>
                  {tr('अंतिम भुगतान:', 'آخری ادائیگی:', 'Last record:')} {formattedPaymentDate}
                </Text>
              )}

              <TouchableOpacity
                onPress={handlePay}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: '#10b981',
                }}
              >
                <Heart color="#ffffff" size={13} fill="#ffffff" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>
                  {tr(
                    `${currentMonthName} माह का भुगतान करें`,
                    `${currentMonthName} کی ادائیگی کریں`,
                    `Pay for ${currentMonthName}`
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

