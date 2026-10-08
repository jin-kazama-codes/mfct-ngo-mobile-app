import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Linking,
  Platform,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../src/context/AppStateProvider';
import { getUserById } from '../../src/services/userService';
import { KycUpdateModal } from '../../src/components/KycUpdateModal';
import { User } from '../../src/types';
import { getLanguageCode } from '../../src/lib/translateEntity';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Edit3,
  UserPlus,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react-native';

export default function UnderReviewScreen() {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const topInset = Math.max(insets.top, statusBarHeight);

  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { activeUser, handleUpdateActiveUser, handleLogout } = useAppState();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(activeUser);
  const [isTerminated, setIsTerminated] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollTimerRef = useRef<any>(null);
  const isCheckingRef = useRef(false);
  const activeUserRef = useRef(activeUser);
  const handleUpdateActiveUserRef = useRef(handleUpdateActiveUser);

  useEffect(() => {
    activeUserRef.current = activeUser;
    handleUpdateActiveUserRef.current = handleUpdateActiveUser;
  }, [activeUser, handleUpdateActiveUser]);

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  // Keep currentUser synced with activeUser without triggering loops
  useEffect(() => {
    if (activeUser) {
      setCurrentUser(prev => {
        if (
          prev?.id === activeUser.id &&
          prev?.status === activeUser.status &&
          prev?.isVerified === activeUser.isVerified &&
          prev?.role === activeUser.role &&
          prev?.rejectionReason === activeUser.rejectionReason
        ) {
          return prev;
        }
        return activeUser;
      });
    }
  }, [activeUser]);

  // Pulse animation for pending badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Status check function - completely stable reference, no dependencies that mutate on update
  const checkStatus = useCallback(async (showIndicator = false) => {
    if (isCheckingRef.current) return;
    const current = activeUserRef.current;
    const userId = current?.id;
    if (!userId) return;

    isCheckingRef.current = true;
    if (showIndicator) setIsRefreshing(true);

    try {
      const freshUser = await getUserById(userId);
      setLastChecked(new Date());

      if (!freshUser) {
        // User record was deleted or not found in DB -> Terminated
        setIsTerminated(true);
        return;
      }

      setIsTerminated(false);

      // Only update state if data actually changed
      const hasChanged =
        freshUser.status !== current?.status ||
        freshUser.isVerified !== current?.isVerified ||
        freshUser.role !== current?.role ||
        freshUser.rejectionReason !== current?.rejectionReason;

      if (hasChanged) {
        setCurrentUser(freshUser);
        if (handleUpdateActiveUserRef.current) {
          await handleUpdateActiveUserRef.current(freshUser);
        }
      }

      // If approved or admin / community admin, redirect to dashboard
      const isPrivileged =
        freshUser.role === 'super_admin' ||
        freshUser.role === 'executive_admin' ||
        freshUser.role === 'community_admin' ||
        freshUser.district_role === 'community_admin' ||
        !!(freshUser.district_role || freshUser.districtRole);

      const isApproved =
        isPrivileged ||
        freshUser.status === 'approved' ||
        (freshUser.isVerified && freshUser.status !== 'reject' && freshUser.status !== 'rejected' && freshUser.status !== 'pending');

      if (isApproved) {
        setTimeout(() => {
          router.replace('/(drawer)/dashboard');
        }, 1200);
      }
    } catch (err) {
      console.warn('Failed to check user status:', err);
    } finally {
      isCheckingRef.current = false;
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Initial check and periodic polling (every 12 seconds)
  useEffect(() => {
    checkStatus(false);

    pollTimerRef.current = setInterval(() => {
      checkStatus(false);
    }, 12000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkStatus]);

  // Re-check whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkStatus(false);
    }, [checkStatus])
  );

  // Prevent back navigation to common website or admin while pending
  useEffect(() => {
    const onBackPress = () => {
      if (isPending) {
        return true; // handled, block hardware back navigation
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isPending]);

  const handleLanguageChange = async (targetLang: 'hi' | 'ur' | 'en') => {
    i18n.changeLanguage(targetLang);
    try {
      await AsyncStorage.setItem('mfct_language', targetLang);
    } catch { }
  };

  const handleSignOut = async () => {
    try {
      await handleLogout();
    } catch (e) {
      router.replace('/(auth)/sign-in');
    }
  };

  const handleRegisterAgain = async () => {
    try {
      await handleLogout();
    } catch { }
    router.replace('/(auth)/sign-up');
  };

  // Determine current status state
  const effectiveStatus = currentUser?.status;
  const isApproved =
    !isTerminated &&
    (effectiveStatus === 'approved' ||
      (currentUser?.isVerified && effectiveStatus !== 'reject' && effectiveStatus !== 'rejected'));
  const isRejected = !isTerminated && (effectiveStatus === 'reject' || effectiveStatus === 'rejected');
  const isPending = !isTerminated && !isApproved && !isRejected;

  const rejectionReason =
    currentUser?.rejectionReason ||
    currentUser?.rejection_reason ||
    tr(
      'दस्तावेज़ या विवरण सत्यापन में विसंगति पाई गई।',
      'دستاویزات یا تفصیلات میں نامکمل معلومات پائی گئیں۔',
      'Information or document mismatch during review.'
    );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0f3322"
        translucent={Platform.OS === 'android'}
      />

      {/* Top Header Bar with Safe Area Inset */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset > 0 ? topInset + 8 : (Platform.OS === 'android' ? 36 : 14),
            paddingBottom: 14,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <ShieldCheck color="#f0c868" size={18} />
          </View>
          <View>
            <Text style={styles.headerTitle}>MFCT Trust</Text>
            <Text style={styles.headerSub}>
              {tr('सदस्यता समीक्षा', 'ممبرشپ جائزہ', 'Membership Review')}
            </Text>
          </View>
        </View>

        {/* Language Switcher Buttons */}
        <View style={styles.langRow}>
          {(['hi', 'ur', 'en'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => handleLanguageChange(l)}
              style={[styles.langBtn, lang === l && styles.langBtnActive]}
            >
              <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                {l === 'hi' ? 'हिंदी' : l === 'ur' ? 'اردو' : 'EN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── STATUS CARD ─── */}
        {isApproved ? (
          /* Approved Screen */
          <View style={[styles.card, styles.approvedCard]}>
            <View style={[styles.statusIconCircle, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle2 color="#16a34a" size={42} />
            </View>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusBadgeGreenText}>
                {tr('खाता स्वीकृत', 'اکاؤنٹ منظور ہوا', 'Account Approved')}
              </Text>
            </View>
            <Text style={styles.cardHeading}>
              {tr(
                'मुबारक हो! आपका खाता स्वीकृत हो चुका है',
                'مبارک ہو! آپ کا اکاؤنٹ منظور ہو چکا ہے',
                'Congratulations! Your Account is Approved'
              )}
            </Text>
            <Text style={styles.cardDesc}>
              {tr(
                'अल्हम्दुलिल्लाह, आपका सदस्यता सत्यापन पूरा हो गया है। आपको मुख्य डैशबोर्ड पर भेजा जा रहा है...',
                'الحمدللہ، آپ کی ممبرشپ کی تصدیق مکمل ہو گئی ہے۔ آپ کو ڈیش بورڈ پر منتقل کیا جا رہا ہے...',
                'Your membership KYC has been successfully verified. Redirecting you to the dashboard...'
              )}
            </Text>

            <TouchableOpacity
              onPress={() => router.replace('/(drawer)/dashboard')}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {tr('डैशबोर्ड खोलें', 'ڈیش بورڈ پر جائیں', 'Open Dashboard')}
              </Text>
              <ChevronRight color="#0f3322" size={18} />
            </TouchableOpacity>
          </View>
        ) : isTerminated ? (
          /* Terminated Screen */
          <View style={[styles.card, styles.terminatedCard]}>
            <View style={[styles.statusIconCircle, { backgroundColor: '#fee2e2' }]}>
              <XCircle color="#dc2626" size={42} />
            </View>
            <View style={styles.statusBadgeRed}>
              <Text style={styles.statusBadgeRedText}>
                {tr('खाता समाप्त', 'اکاؤنٹ ختم کیا گیا', 'Account Terminated')}
              </Text>
            </View>
            <Text style={styles.cardHeading}>
              {tr(
                'यह सदस्यता खाता समाप्त कर दिया गया है',
                'یہ ممبرشپ اکاؤنٹ ختم کر دیا گیا ہے',
                'Membership Account Has Been Terminated'
              )}
            </Text>
            <Text style={styles.cardDesc}>
              {tr(
                'प्रशासन द्वारा इस सदस्यता खाते को समाप्त कर दिया गया है। यदि आप नए सिरे से जुड़ना चाहते हैं, तो आप पुनः पंजीकरण कर सकते हैं।',
                'انتظامیہ کی طرف سے یہ اکاؤنٹ ختم کر دیا گیا ہے۔ آپ نئی درخواست کے ساتھ دوبارہ رجسٹریشن کر سکتے ہیں۔',
                'This membership has been terminated by the administration. You may register again with updated details.'
              )}
            </Text>

            <TouchableOpacity
              onPress={handleRegisterAgain}
              style={[styles.primaryBtn, { backgroundColor: '#0f3322' }]}
            >
              <UserPlus color="#f0c868" size={18} />
              <Text style={[styles.primaryBtnText, { color: '#f0c868' }]}>
                {tr('पुनः नया खाता बनाएं', 'دوبارہ نیا اکاؤنٹ بنائیں', 'Register New Account')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isRejected ? (
          /* Rejected Screen */
          <View style={[styles.card, styles.rejectedCard]}>
            <View style={[styles.statusIconCircle, { backgroundColor: '#fee2e2' }]}>
              <AlertTriangle color="#e11d48" size={40} />
            </View>
            <View style={styles.statusBadgeRed}>
              <Text style={styles.statusBadgeRedText}>
                {tr('समीक्षा विफल / अस्वीकृत', 'کے وائی سی مسترد', 'Action Required / Rejected')}
              </Text>
            </View>
            <Text style={styles.cardHeading}>
              {tr(
                'केवाईसी आवेदन में सुधार आवश्यक है',
                'درخواست میں درستگی درکار ہے',
                'KYC Application Needs Correction'
              )}
            </Text>
            <Text style={styles.cardDesc}>
              {tr(
                'आपके दस्तावेज़ों या विवरण में कमी के कारण आवेदन अस्वीकृत किया गया है। कृपया नीचे दिए गए कारण को पढ़कर अपने विवरण में सुधार करें।',
                'آپ کی تفصیلات میں کچھ نقائص کی وجہ سے درخواست مسترد ہوئی ہے۔ برائے مہربانی نیچے دی گئی وجہ دیکھ کر درستگی کریں۔',
                'Your application requires corrections before it can be approved. Please review the reason below and update your details.'
              )}
            </Text>

            {/* Rejection Reason Box */}
            <View style={styles.reasonBox}>
              <View style={styles.reasonBoxHeader}>
                <ShieldAlert color="#e11d48" size={16} />
                <Text style={styles.reasonBoxTitle}>
                  {tr('अस्वीकृति का कारण:', 'مسترد ہونے کی وجہ:', 'Rejection Reason:')}
                </Text>
              </View>
              <Text style={styles.reasonBoxText}>{rejectionReason}</Text>
            </View>

            {/* Action Button: Edit Details */}
            <TouchableOpacity
              onPress={() => setIsKycModalOpen(true)}
              style={[styles.primaryBtn, { backgroundColor: '#0f3322' }]}
            >
              <Edit3 color="#f0c868" size={18} />
              <Text style={[styles.primaryBtnText, { color: '#f0c868' }]}>
                {tr('विवरण सुधारें व पुनः भेजें', 'تفصیلات درست کریں', 'Edit & Resubmit Details')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => checkStatus(true)}
              disabled={isRefreshing}
              style={styles.secondaryBtn}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#0f3322" />
              ) : (
                <>
                  <RefreshCw color="#0f3322" size={16} />
                  <Text style={styles.secondaryBtnText}>
                    {tr('स्थिति पुनः जांचें', 'حیثیت دوبارہ چیک کریں', 'Check Status Again')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Pending Screen */
          <View style={[styles.card, styles.pendingCard]}>
            <Animated.View
              style={[
                styles.statusIconCircle,
                { backgroundColor: '#fef3c7', transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Clock color="#d97706" size={42} />
            </Animated.View>

            <View style={styles.statusBadgeAmber}>
              <View style={styles.amberDot} />
              <Text style={styles.statusBadgeAmberText}>
                {tr('समीक्षाधीन / प्रक्रिया में', 'زیر جائزہ / عمل جاری ہے', 'Under Review / In Progress')}
              </Text>
            </View>

            <Text style={styles.cardHeading}>
              {tr(
                'आपका खाता वर्तमान में समीक्षाधीन है',
                'آپ کا اکاؤنٹ زیر جائزہ ہے',
                'Your Account is Under Review'
              )}
            </Text>

            <Text style={styles.cardDesc}>
              {tr(
                'मोहम्मद फईम चैरिटेबल ट्रस्ट (MFCT) में पंजीकरण के लिए धन्यवाद! हमारी प्रशासनिक टीम आपके केवाईसी दस्तावेज़ों और विवरण का सत्यापन कर रही है।',
                'محمد فہیم چیریٹیبل ٹرسٹ میں رجسٹریشن کا شکریہ! ہماری انتظامی کمیٹی آپ کی تفصیلات اور دستاویزات کی تصدیق کر رہی ہے۔',
                'Thank you for registering with Mohammad Faeem Charitable Trust (MFCT). Our administrative committee is currently verifying your submitted documents.'
              )}
            </Text>

            {/* Live Polling Info Banner */}
            <View style={styles.pollingInfoBox}>
              <RefreshCw color="#92400e" size={14} />
              <Text style={styles.pollingInfoText}>
                {tr(
                  'यह स्क्रीन हर 12 सेकंड में स्वचालित रूप से स्थिति अपडेट करती है।',
                  'یہ اسکرین خود بخود ہر 12 سیکنڈ بعد اپ ڈیٹ ہوتی ہے۔',
                  'Auto-refreshing status every 12 seconds.'
                )}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnStack}>
              <TouchableOpacity
                onPress={() => checkStatus(true)}
                disabled={isRefreshing}
                style={[styles.primaryBtn, { backgroundColor: '#0f3322' }]}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#f0c868" />
                ) : (
                  <>
                    <RefreshCw color="#f0c868" size={18} />
                    <Text style={[styles.primaryBtnText, { color: '#f0c868' }]}>
                      {tr('अभी स्थिति जांचें', 'ابھی اسٹیٹس چیک کریں', 'Refresh Status Now')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── USER SUMMARY CARD ─── */}
        {currentUser && !isTerminated && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {tr('पंजीकृत सदस्य जानकारी', 'رجسٹرڈ ممبر معلومات', 'Registered Member Info')}
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{tr('नाम', 'نام', 'Name')}:</Text>
              <Text style={styles.summaryValue}>{currentUser.name || 'Member'}</Text>
            </View>

            {currentUser.phone ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tr('मोबाइल', 'موبائل', 'Phone')}:</Text>
                <Text style={styles.summaryValue}>{currentUser.phone}</Text>
              </View>
            ) : null}

            {currentUser.email ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tr('ईमेल', 'ای میل', 'Email')}:</Text>
                <Text style={styles.summaryValue}>{currentUser.email}</Text>
              </View>
            ) : null}

            {currentUser.communityName ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tr('कम्युनिटी', 'کمیونٹی', 'Community')}:</Text>
                <Text style={styles.summaryValue}>{currentUser.communityName}</Text>
              </View>
            ) : null}

            {currentUser.membershipId ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tr('सदस्यता आईडी', 'ممبرشپ نمبر', 'Member ID')}:</Text>
                <Text style={[styles.summaryValue, { color: '#0f3322', fontWeight: '700' }]}>
                  {currentUser.membershipId}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ─── HELP & SUPPORT BOX ─── */}
        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>
            {tr('मदद चाहिए? संपर्क करें', 'مدد درکار ہے؟', 'Need Assistance?')}
          </Text>
          <Text style={styles.supportDesc}>
            {tr(
              'यदि सत्यापन में 24 घंटे से अधिक समय लग रहा है, तो कृपया ट्रस्ट हेल्पलाइन पर संपर्क करें।',
              'اگر تصدیق میں 24 گھنٹے سے زیادہ وقت لگے تو ہیلپ لائن پر رابطہ کریں۔',
              'If your review is pending for more than 24 hours, contact the MFCT administration helpline.'
            )}
          </Text>

          <View style={styles.supportActions}>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:919999999999')}
              style={styles.supportContactBtn}
            >
              <Phone color="#0f3322" size={14} />
              <Text style={styles.supportContactText}>+91 99999 99999</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:info@mfcttrust.com')}
              style={styles.supportContactBtn}
            >
              <Mail color="#0f3322" size={14} />
              <Text style={styles.supportContactText}>info@mfcttrust.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── LOGOUT BUTTON ─── */}
        {/* <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <LogOut color="#64748b" size={16} />
          <Text style={styles.signOutText}>
            {tr('खाते से साइन आउट करें', 'سائن آؤٹ کریں', 'Sign Out of Account')}
          </Text>
        </TouchableOpacity> */}
      </ScrollView>

      {/* KYC Update Modal */}
      {currentUser && (
        <KycUpdateModal
          visible={isKycModalOpen}
          user={currentUser}
          onClose={() => setIsKycModalOpen(false)}
          onUpdated={async (updated) => {
            setCurrentUser(updated);
            if (handleUpdateActiveUser) {
              await handleUpdateActiveUser(updated);
            }
            setIsKycModalOpen(false);
            // Refresh right after update
            checkStatus(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f3322',
  },
  header: {
    backgroundColor: '#0f3322',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 200, 104, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 200, 104, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(240, 200, 104, 0.4)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#f0c868',
    fontSize: 11,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  langBtnActive: {
    backgroundColor: '#f0c868',
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  langTextActive: {
    color: '#0f3322',
    fontWeight: '800',
  },
  logoutHeaderBtn: {
    padding: 6,
    marginLeft: 4,
  },
  scrollContent: {
    backgroundColor: '#f8f6f1',
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    marginBottom: 16,
  },
  pendingCard: {
    borderColor: '#fde68a',
  },
  rejectedCard: {
    borderColor: '#fecdd3',
  },
  approvedCard: {
    borderColor: '#bbf7d0',
  },
  terminatedCard: {
    borderColor: '#cbd5e1',
  },
  statusIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusBadgeAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  amberDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d97706',
  },
  statusBadgeAmberText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeRed: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  statusBadgeRedText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusBadgeGreenText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 25,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  pollingInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  pollingInfoText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  reasonBox: {
    width: '100%',
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 16,
  },
  reasonBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reasonBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#be123c',
  },
  reasonBoxText: {
    fontSize: 13,
    color: '#4c0519',
    lineHeight: 18,
    fontWeight: '500',
  },
  btnStack: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryBtnText: {
    color: '#0f3322',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  supportBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  supportDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 12,
  },
  supportActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  supportContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  supportContactText: {
    fontSize: 12,
    color: '#0f3322',
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
});
