import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../../../src/context/AppStateProvider';
import { FemaleFamilyMember, AccountDetails } from '../../../src/types';
import {
  getFemaleFamilyMembers,
  saveFemaleFamilyMember,
  updateFemaleFamilyMember,
  deleteFemaleFamilyMember,
} from '../../../src/services/memberService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { getAccountDetails } from '../../../src/services/adminService';
import { downloadFemaleMemberSlipPdf } from '../../../src/services/receiptPdfService';
import { FemaleMemberCardSkeleton } from '../../../src/components/SkeletonLoader';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import {
  Heart,
  UserCheck,
  ShieldCheck,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Camera,
  CheckCircle2,
  Printer,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Users,
} from 'lucide-react-native';

const FEMALE_RELATION_OPTIONS = [
  { value: 'Daughter', labelEn: 'Daughter (बेटी)', labelHi: 'बेटी (Daughter)', labelUr: 'بیٹی (Daughter)' },
  { value: 'Sister', labelEn: 'Sister (बहन)', labelHi: 'बहन (Sister)', labelUr: 'بہن (Sister)' },
];

export default function FemaleMembersScreen() {
  const { activeUser } = useAppState();
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const [members, setMembers] = useState<FemaleFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<FemaleFamilyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Account details for payment
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Daughter');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Fee payment state (₹50)
  const feeAmount = 50;
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userOwnMembers = members.filter((m) => m.user_id === activeUser?.id);
  const isLimitReached = userOwnMembers.length >= 2;

  const loadData = useCallback(async () => {
    if (!activeUser?.id) return;
    try {
      const isSuperOrExec = activeUser.role === 'super_admin' || activeUser.role === 'executive_admin';
      const data = await getFemaleFamilyMembers(isSuperOrExec ? undefined : activeUser.id);
      setMembers(data);
    } catch (err: any) {
      console.error('Error loading female members:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUser]);

  useEffect(() => {
    loadData();
    getAccountDetails()
      .then((accs) => {
        if (accs && accs.length > 0) {
          setAccountDetails(accs[0]);
        }
      })
      .catch(console.error);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAddModal = () => {
    if (isLimitReached) {
      Alert.alert(
        tr('अधिकतम सीमा पूर्ण', 'زیادہ سے زیادہ حد', 'Maximum Limit Reached'),
        tr(
          'आप केवल अधिकतम 2 महिला सदस्य (2 बेटी / 2 बहन / 1 बहन 1 बेटी) जोड़ सकते हैं।',
          'آپ صرف 2 خواتین ممبر (2 بیٹیاں / 2 بہنیں / 1 بہن 1 بیٹی) شامل کر سکتے ہیں۔',
          'You can only add up to 2 female members (2 Daughters, 2 Sisters, or 1 Sister + 1 Daughter).'
        )
      );
      return;
    }
    setEditingMember(null);
    setName('');
    setRelation('Daughter');
    setPhone('');
    setDob('');
    setAge('');
    setAadhaarNumber('');
    setAddress(activeUser?.city || '');
    setPhotoUri(null);
    setPaymentMethod('UPI');
    setPaymentUtr('');
    setScreenshotUri(null);
    setErrorMsg('');
    setModalVisible(true);
  };

  const openEditModal = (item: FemaleFamilyMember) => {
    setEditingMember(item);
    setName(item.name || '');
    setRelation(item.relation || 'Daughter');
    setPhone(item.phone || '');
    setDob(item.date_of_birth || '');
    setAge(item.age ? String(item.age) : '');
    setAadhaarNumber(item.aadhaar_number || '');
    setAddress(item.address || '');
    setPhotoUri(item.photo_url || null);
    setPaymentMethod((item.payment_method as any) || 'UPI');
    setPaymentUtr(item.payment_utr || '');
    setScreenshotUri(item.payment_screenshot_url || null);
    setErrorMsg('');
    setModalVisible(true);
  };

  const pickImage = async (isReceipt: boolean) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          tr('अनुमति अस्वीकृत', 'اجازت مسترد کر دی گئی', 'Permission Denied'),
          tr('फोटो चुनने के लिए गैलरी अनुमति आवश्यक है।', 'گیلری کی اجازت درکار ہے۔', 'Gallery permission is required to choose photos.')
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        if (isReceipt) {
          setScreenshotUri(uri);
        } else {
          setPhotoUri(uri);
        }
      }
    } catch (err: any) {
      console.warn('Image picker error:', err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    // Basic clipboard helper or alert for mobile
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    if (!relation || !['Daughter', 'Sister'].includes(relation)) {
      setErrorMsg(tr('कृपया मान्य संबंध (बेटी या बहन) चुनें', 'براہ کرم درست رشتہ (بیٹی یا بہن) منتخب کریں', 'Please select valid relation (Daughter or Sister)'));
      return;
    }

    if (!editingMember && isLimitReached) {
      setErrorMsg(
        tr(
          'अधिकतम सीमा पूर्ण: आप केवल 2 महिला सदस्य (2 बेटी / 2 बहन / 1 बहन 1 बेटी) जोड़ सकते हैं।',
          'زیادہ سے زیادہ حد پوری: آپ صرف 2 خواتین ممبر (2 بیٹیاں / 2 بہنیں / 1 بہن 1 بیٹی) شامل کر سکتے ہیں۔',
          'Maximum limit reached: You can only add up to 2 female members (2 Daughters, 2 Sisters, or 1 Sister + 1 Daughter).'
        )
      );
      return;
    }
    if (!name.trim()) {
      setErrorMsg(tr('कृपया महिला सदस्य का नाम दर्ज करें', 'خاتون کا نام درج کریں', 'Please enter member name'));
      return;
    }

    if (!editingMember && !paymentUtr.trim()) {
      setErrorMsg(
        tr('कृपया ₹50 शुल्क का 12-अंकों का बैंक UTR नंबर दर्ज करें', '₹50 فیس کا UTR نمبر درج کریں', 'Please enter 12-digit UTR reference for ₹50 fee')
      );
      return;
    }

    if (!editingMember && !screenshotUri) {
      setErrorMsg(
        tr(
          'कृपया ₹50 भुगतान रसीद का स्क्रीनशॉट संलग्न करें (अनिवार्य)।',
          'براہ کرم ادائیگی رسید کا اسکرین شاٹ منسلک کریں (لازمی)۔',
          'Payment screenshot proof is mandatory. Please attach receipt screenshot.'
        )
      );
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let finalPhotoUrl = photoUri || '';
      let finalScreenshotUrl = screenshotUri || '';

      if (photoUri && !photoUri.startsWith('http')) {
        setUploadingImage(true);
        finalPhotoUrl = await uploadImageToSupabase(photoUri, 'users');
      }

      if (screenshotUri && !screenshotUri.startsWith('http')) {
        setUploadingImage(true);
        finalScreenshotUrl = await uploadImageToSupabase(screenshotUri, 'receipts');
      }

      if (editingMember) {
        await updateFemaleFamilyMember(editingMember.id, {
          name: name.trim(),
          relation,
          phone: phone.trim(),
          date_of_birth: dob,
          age: age ? parseInt(age, 10) : undefined,
          aadhaar_number: aadhaarNumber.trim(),
          address: address.trim(),
          photo_url: finalPhotoUrl,
          payment_method: paymentMethod,
          payment_utr: paymentUtr.trim(),
          payment_screenshot_url: finalScreenshotUrl,
        });
      } else {
        await saveFemaleFamilyMember({
          user_id: activeUser?.id || '',
          name: name.trim(),
          relation,
          phone: phone.trim(),
          date_of_birth: dob,
          age: age ? parseInt(age, 10) : undefined,
          aadhaar_number: aadhaarNumber.trim(),
          address: address.trim(),
          photo_url: finalPhotoUrl,
          fee_amount: feeAmount,
          payment_method: paymentMethod,
          payment_utr: paymentUtr.trim(),
          payment_screenshot_url: finalScreenshotUrl,
          status: 'pending',
        });
      }

      setModalVisible(false);
      await loadData();
    } catch (err: any) {
      console.error('Save female member error:', err);
      setErrorMsg(err.message || 'Failed to save female member');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteFemaleFamilyMember(id);
      setDeleteId(null);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete female member');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadSlip = async (member: FemaleFamilyMember) => {
    if (!activeUser) return;
    try {
      await downloadFemaleMemberSlipPdf(activeUser, member);
    } catch (err: any) {
      Alert.alert('Download Error', err.message || 'Failed to generate payment slip');
    }
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const textPri = isDark ? '#ffffff' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Top Header Card */}
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: isDark ? '#064e3b' : '#0c2b1d',
              borderColor: 'rgba(200,168,75,0.3)',
            },
          ]}
        >
          <View style={s.pillBadge}>
            <Heart color="#c8a84b" size={14} fill="#c8a84b" />
            <Text style={s.pillText}>
              {tr('महिला सशक्तिकरण एवं परिवार सुरक्षा', 'خواتین کو بااختیار بنانا اور خاندانی تحفظ', 'Women Empowerment & Family Welfare')}
            </Text>
          </View>

          <Text style={s.heroTitle}>
            {tr('महिला पारिवारिक सदस्य', 'خواتین خاندانی ارکان', 'Female Family Members')}
          </Text>

          <Text style={s.heroSub}>
            {tr(
              'केवल महिला सदस्य जोड़ सकते हैं। मान्य संयोजन: 2 बेटी, 2 बहन, या 1 बहन 1 बेटी (अधिकतम 2 सदस्य, ₹50 प्रति सदस्य शुल्क)।',
              'صرف خواتین اراکین شامل کر سکتے ہیں۔ جائز مجموعہ: 2 بیٹیاں، 2 بہنیں، یا 1 بہن 1 بیٹی (زیادہ سے زیادہ 2 اراکین، فیس ₹50 فی ممبر)۔',
              'Only female members can be enrolled. Allowed combinations: 2 Daughters, 2 Sisters, or 1 Sister + 1 Daughter (Max 2 members, ₹50 fee).'
            )}
          </Text>

          {isLimitReached ? (
            <View style={[s.heroBtn, { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b' }]}>
              <CheckCircle2 color="#b45309" size={16} />
              <Text style={[s.heroBtnText, { color: '#b45309' }]}>
                {tr('अधिकतम 2 सदस्य पूर्ण (2/2)', 'زیادہ سے زیادہ 2 ارکان مکمل', 'Limit Reached (2/2 Members)')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={s.heroBtn}
              onPress={openAddModal}
              activeOpacity={0.85}
            >
              <Plus color="#0f172a" size={16} strokeWidth={3} />
              <Text style={s.heroBtnText}>
                {tr('नई महिला सदस्य जोड़ें (₹50)', 'نئی خاتون رکن شامل کریں (₹50)', 'Add Female Member (₹50)')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Allowed Combinations Guide */}
        <View style={[s.guideBox, { backgroundColor: isDark ? '#2e106540' : '#fdf2f8', borderColor: isDark ? '#701a75' : '#fbcfe8' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Heart color="#db2777" size={16} fill="#db2777" />
              <Text style={[s.guideTitle, { color: '#db2777' }]}>
                {tr('मान्य संयोजन (अधिकतम 2 सदस्य)', 'جائز مجموعہ (زیادہ سے زیادہ 2 ارکان)', 'Allowed Combinations (Max 2)')}
              </Text>
            </View>
            <View style={[s.slotBadge, { backgroundColor: isLimitReached ? '#fef3c7' : '#dcfce7' }]}>
              <Text style={[s.slotBadgeText, { color: isLimitReached ? '#b45309' : '#15803d' }]}>
                {userOwnMembers.length}/2 {tr('स्थान', 'سیٹیں', 'Slots')}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <View style={s.combChip}>
              <Text style={s.combChipText}>1) 2 {tr('बेटी', 'بیٹیاں', 'Beti')}</Text>
            </View>
            <View style={s.combChip}>
              <Text style={s.combChipText}>2) 2 {tr('बहन', 'بہنیں', 'Behen')}</Text>
            </View>
            <View style={s.combChip}>
              <Text style={s.combChipText}>3) 1 {tr('बहन', 'بہن', 'Behen')} + 1 {tr('बेटी', 'بیٹی', 'Beti')}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={s.statLabel}>{tr('कुल महिला सदस्य', 'کل ارکان', 'Total Members')}</Text>
            {loading ? (
              <View style={{ height: 26, width: 36, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 6, marginTop: 4 }} />
            ) : (
              <Text style={[s.statVal, { color: textPri }]}>{members.length}</Text>
            )}
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={s.statLabel}>{tr('सत्यापित', 'تصدیق شدہ', 'Verified')}</Text>
            {loading ? (
              <View style={{ height: 26, width: 36, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 6, marginTop: 4 }} />
            ) : (
              <Text style={[s.statVal, { color: '#10b981' }]}>
                {members.filter((m) => m.status === 'approved').length}
              </Text>
            )}
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={s.statLabel}>{tr('शुल्क (₹50/सदस्य)', 'کل فیس', 'Total Fees')}</Text>
            {loading ? (
              <View style={{ height: 26, width: 50, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 6, marginTop: 4 }} />
            ) : (
              <Text style={[s.statVal, { color: '#c8a84b' }]}>₹{members.length * 50}</Text>
            )}
          </View>
        </View>

        {/* Section Title */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: textPri }]}>
            {tr('पंजीकृत महिला सदस्य सूची', 'خواتین ارکان کی فہرست', 'Registered Female Members')}
          </Text>
          <Text style={[s.sectionCount, { color: textSec }]}>({members.length})</Text>
        </View>

        {/* Members List */}
        {loading ? (
          <View style={{ marginTop: 4 }}>
            <FemaleMemberCardSkeleton isDark={isDark} />
            <FemaleMemberCardSkeleton isDark={isDark} />
          </View>
        ) : members.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Heart color="#10b981" size={42} />
            <Text style={[s.emptyTitle, { color: textPri }]}>
              {tr('कोई महिला सदस्य नहीं जोड़ी गई है', 'کوئی خاتون رکن شامل نہیں کی گئی', 'No Female Members Added Yet')}
            </Text>
            <Text style={[s.emptySub, { color: textSec }]}>
              {tr(
                'परिवार की महिला सदस्यों (जैसे पत्नी, माँ, बेटी, बहन) को ₹50 शुल्क के साथ जोड़ें।',
                'خاندان کی خواتین کو ₹50 فیس کے ساتھ شامل کریں۔',
                'Add family female members (Wife, Mother, Daughter, Sister) with ₹50 fee.'
              )}
            </Text>
            <TouchableOpacity style={s.addBtnEmpty} onPress={openAddModal}>
              <Plus color="#ffffff" size={16} strokeWidth={3} />
              <Text style={s.addBtnEmptyText}>
                {tr('पहली महिला सदस्य जोड़ें (₹50)', 'پہلی خاتون رکن شامل کریں', 'Add First Female Member')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          members.map((member) => {
            const relObj = FEMALE_RELATION_OPTIONS.find((r) => r.value === member.relation);
            const relLabel = relObj ? (lang === 'hi' ? relObj.labelHi : lang === 'ur' ? relObj.labelUr : relObj.labelEn) : member.relation;
            const isApproved = member.status === 'approved';

            return (
              <View key={member.id} style={[s.memberCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                {/* Member Top Row */}
                <View style={s.cardTopRow}>
                  <View style={s.avatarContainer}>
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={s.avatarImg} />
                    ) : (
                      <View style={[s.avatarFallback, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                        <Text style={s.avatarInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>

                  <View style={s.infoCol}>
                    <Text style={[s.nameText, { color: textPri }]}>{member.name}</Text>
                    <View style={s.relationBadge}>
                      <Text style={s.relationText}>{relLabel}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      s.statusBadge,
                      {
                        backgroundColor: isApproved ? '#10b98120' : '#f59e0b20',
                        borderColor: isApproved ? '#10b98150' : '#f59e0b50',
                      },
                    ]}
                  >
                    <Text style={[s.statusText, { color: isApproved ? '#10b981' : '#f59e0b' }]}>
                      {isApproved ? tr('सत्यापित', 'تصدیق شدہ', 'Verified') : tr('प्रक्रियाधीन', 'زیر جائزہ', 'Pending')}
                    </Text>
                  </View>
                </View>

                {/* Details Breakdown */}
                <View style={[s.detailsBox, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                  {member.age ? (
                    <View style={s.detailRow}>
                      <Text style={[s.detailLabel, { color: textSec }]}>{tr('आयु', 'عمر', 'Age')}:</Text>
                      <Text style={[s.detailVal, { color: textPri }]}>{member.age} {tr('वर्ष', 'سال', 'Years')}</Text>
                    </View>
                  ) : null}

                  {member.phone ? (
                    <View style={s.detailRow}>
                      <Text style={[s.detailLabel, { color: textSec }]}>{tr('मोबाइल', 'موبائل', 'Phone')}:</Text>
                      <Text style={[s.detailVal, { color: textPri }]}>{member.phone}</Text>
                    </View>
                  ) : null}

                  {member.aadhaar_number ? (
                    <View style={s.detailRow}>
                      <Text style={[s.detailLabel, { color: textSec }]}>{tr('आधार', 'آدھار', 'Aadhaar')}:</Text>
                      <Text style={[s.detailVal, { color: textPri }]}>•••• •••• {member.aadhaar_number.slice(-4)}</Text>
                    </View>
                  ) : null}

                  <View style={s.detailRow}>
                    <Text style={[s.detailLabel, { color: textSec }]}>{tr('पंजीकरण शुल्क', 'فیس', 'Fee Paid')}:</Text>
                    <Text style={[s.detailVal, { color: '#10b981', fontWeight: '800' }]}>
                      ₹{member.fee_amount || 50} ({member.payment_method || 'UPI'})
                    </Text>
                  </View>

                  {member.payment_utr ? (
                    <View style={s.detailRow}>
                      <Text style={[s.detailLabel, { color: textSec }]}>{tr('UTR संदर्भ', 'UTR نمبر', 'UTR Ref')}:</Text>
                      <Text style={[s.detailVal, { color: textPri, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                        {member.payment_utr}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Card Actions */}
                <View style={[s.cardActionsRow, { borderTopColor: borderCol }]}>
                  <TouchableOpacity
                    style={s.slipBtn}
                    onPress={() => handleDownloadSlip(member)}
                    activeOpacity={0.7}
                  >
                    <Printer size={15} color="#10b981" />
                    <Text style={s.slipBtnText}>
                      {tr('रसीद डाउनलोड', 'رسید ڈاؤن لوڈ', 'Download Slip')}
                    </Text>
                  </TouchableOpacity>

                  <View style={s.actionIcons}>
                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => openEditModal(member)}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={16} color={textSec} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => setDeleteId(member.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL: ADD / EDIT FEMALE MEMBER */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <View style={[s.modalContent, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalHeaderTitle}>
                  {editingMember
                    ? tr('महिला सदस्य विवरण संपादित करें', 'خاتون رکن میں ترمیم کریں', 'Edit Female Family Member')
                    : tr('नई महिला पारिवारिक सदस्य जोड़ें', 'نئی خاتون خاندانی رکن شامل کریں', 'Add Female Family Member')}
                </Text>
                <Text style={s.modalHeaderFee}>
                  {tr('पंजीकरण शुल्क: ₹50 मात्र', 'رجسٹریشن فیس: صرف ₹50', 'Registration Fee: ₹50 Only')}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.closeModalBtn}>
                <X color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Form */}
            <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
              {errorMsg ? (
                <View style={s.errorBox}>
                  <AlertCircle color="#ef4444" size={16} />
                  <Text style={s.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Section 1: Personal Details */}
              <Text style={[s.formSectionTitle, { color: '#10b981' }]}>
                {tr('1. महिला सदस्य की व्यक्तिगत जानकारी', '1. ذاتی تفصیلات', '1. Personal Details of Female Member')}
              </Text>

              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('महिला सदस्य का पूरा नाम *', 'خاتون کا پورا نام *', 'Female Member Full Name *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol }]}
                placeholder={tr('उदा. फातिमा खातून', 'مثال: فاطمہ خاتون', 'e.g. Fatima Khatoon')}
                placeholderTextColor={textSec}
                value={name}
                onChangeText={setName}
              />

              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('मुख्य सदस्य से संबंध *', 'رشتہ *', 'Relation to Member *')}
              </Text>
              <View style={s.relationGrid}>
                {FEMALE_RELATION_OPTIONS.map((opt) => {
                  const isSelected = relation === opt.value;
                  const label = lang === 'hi' ? opt.labelHi : lang === 'ur' ? opt.labelUr : opt.labelEn;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        s.relationChoice,
                        {
                          backgroundColor: isSelected ? '#10b981' : isDark ? '#0f172a' : '#f1f5f9',
                          borderColor: isSelected ? '#10b981' : borderCol,
                        },
                      ]}
                      onPress={() => setRelation(opt.value)}
                    >
                      <Text
                        style={[
                          s.relationChoiceText,
                          { color: isSelected ? '#ffffff' : textPri, fontWeight: isSelected ? '800' : '600' },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[s.inputLabel, { color: textPri }]}>{tr('आयु (वर्ष)', 'عمر (سال)', 'Age (Years)')}</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol }]}
                    placeholder="28"
                    placeholderTextColor={textSec}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[s.inputLabel, { color: textPri }]}>{tr('जन्म तिथि', 'تاریخ پیدائش', 'DOB')}</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={textSec}
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </View>

              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('मोबाइल नंबर (वैकल्पिक)', 'موبائل نمبر (اختیاری)', 'Mobile Number (Optional)')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol }]}
                placeholder="9876543210"
                placeholderTextColor={textSec}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('आधार संख्या / पहचान पत्र', 'آدھار نمبر', 'Aadhaar / ID Card Number')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol }]}
                placeholder="1234 5678 9012"
                placeholderTextColor={textSec}
                value={aadhaarNumber}
                onChangeText={setAadhaarNumber}
              />

              {/* Photo Upload */}
              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('फोटो / पहचान प्रमाण (वैकल्पिक)', 'تصویر / شناختی ثبوت (اختیاری)', 'Photo / ID Proof (Optional)')}
              </Text>
              <TouchableOpacity
                style={[s.uploadBox, { borderColor: borderCol, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                onPress={() => pickImage(false)}
              >
                {photoUri ? (
                  <View style={s.uploadedRow}>
                    <Image source={{ uri: photoUri }} style={s.previewImg} />
                    <Text style={[s.uploadedText, { color: '#10b981' }]}>
                      {tr('फोटो चुनी गई (बदलने के लिए टैप करें)', 'تصویر منتخب ہو گئی', 'Photo selected (Tap to change)')}
                    </Text>
                  </View>
                ) : (
                  <View style={s.uploadPrompt}>
                    <Camera color="#10b981" size={20} />
                    <Text style={[s.uploadText, { color: textSec }]}>
                      {tr('फोटो चुनने के लिए टैप करें', 'تصویر منتخب کرنے کے لیے ٹیپ کریں', 'Tap to select photo')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Section 2: Fee Payment (₹50) */}
              <View style={s.feeHeaderRow}>
                <Text style={[s.formSectionTitle, { color: '#10b981', marginBottom: 0 }]}>
                  {tr('2. पंजीकरण शुल्क भुगतान (₹50)', '2. فیس کی ادائیگی (₹50)', '2. Registration Fee Payment (₹50)')}
                </Text>
                <View style={s.feePill}>
                  <Text style={s.feePillText}>₹50 Fee</Text>
                </View>
              </View>

              {/* Payment Method Switch */}
              <View style={[s.switchRow, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                <TouchableOpacity
                  style={[s.switchBtn, paymentMethod === 'UPI' && s.switchBtnActive]}
                  onPress={() => setPaymentMethod('UPI')}
                >
                  <Text style={[s.switchText, paymentMethod === 'UPI' && s.switchTextActive]}>
                    UPI / QR Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.switchBtn, paymentMethod === 'Bank Transfer' && s.switchBtnActive]}
                  onPress={() => setPaymentMethod('Bank Transfer')}
                >
                  <Text style={[s.switchText, paymentMethod === 'Bank Transfer' && s.switchTextActive]}>
                    Bank Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* QR / Bank Info Box */}
              {paymentMethod === 'UPI' ? (
                <View style={s.qrBox}>
                  {accountDetails?.qr_code_url ? (
                    <View style={{ width: 140, height: 140, backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Image
                        source={{ uri: accountDetails.qr_code_url }}
                        style={{ width: '100%', height: '100%', transform: [{ scale: 1.46 }] }}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <QrCode color="#ffffff" size={100} />
                  )}
                  <Text style={s.qrTitle}>{tr('₹50 शुल्क का भुगतान करें', '₹50 فیس ادا کریں', 'Scan & Pay ₹50 Fee')}</Text>
                  <Text style={s.qrSub}>
                    {tr('PhonePe, Google Pay, Paytm द्वारा स्कैन करें', 'PhonePe, Google Pay سے اسکین کریں', 'Scan with PhonePe, Google Pay or BHIM')}
                  </Text>
                </View>
              ) : (
                <View style={s.bankBox}>
                  <Text style={s.bankLine}>A/C: {accountDetails?.account_number || 'N/A'}</Text>
                  <Text style={s.bankLine}>IFSC: {accountDetails?.ifsc_code || 'N/A'}</Text>
                  <Text style={s.bankLine}>Bank: {accountDetails?.bank_name || 'HDFC Bank'}</Text>
                  <Text style={s.bankLine}>Name: {accountDetails?.account_holder_name || 'MFCT'}</Text>
                </View>
              )}

              {/* 12-Digit UTR */}
              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('12 अंकों का बैंक UTR / संदर्भ संख्या *', '12 ہندسوں کا UTR نمبر *', '12-Digit Bank UTR / Reference No *')}
              </Text>
              <TextInput
                style={[s.input, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: textPri, borderColor: borderCol, fontWeight: '800' }]}
                placeholder={tr('उदा. 420199381029', 'مثال: 420199381029', 'e.g. 420199381029')}
                placeholderTextColor={textSec}
                keyboardType="numeric"
                value={paymentUtr}
                onChangeText={setPaymentUtr}
              />

              {/* Screenshot Upload */}
              <Text style={[s.inputLabel, { color: textPri }]}>
                {tr('भुगतान रसीद / स्क्रीनशॉट (अनिवार्य) *', 'ادائیگی رسید کا ثبوت (لازمی) *', 'Payment Screenshot Proof (Mandatory) *')}
              </Text>
              <TouchableOpacity
                style={[s.uploadBox, { borderColor: borderCol, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                onPress={() => pickImage(true)}
              >
                {screenshotUri ? (
                  <View style={s.uploadedRow}>
                    <Image source={{ uri: screenshotUri }} style={s.previewImg} />
                    <Text style={[s.uploadedText, { color: '#10b981' }]}>
                      {tr('रसीद चुनी गई (बदलने के लिए टैप करें)', 'رسید منتخب ہو گئی', 'Receipt attached (Tap to change)')}
                    </Text>
                  </View>
                ) : (
                  <View style={s.uploadPrompt}>
                    <Camera color="#10b981" size={20} />
                    <Text style={[s.uploadText, { color: textSec }]}>
                      {tr('स्क्रीनशॉट चुनने के लिए टैप करें', 'اسکرین شاٹ منتخب کریں', 'Tap to select payment screenshot')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Submit Buttons */}
              <View style={s.modalActionRow}>
                <TouchableOpacity
                  style={[s.cancelBtn, { borderColor: borderCol }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[s.cancelBtnText, { color: textSec }]}>{tr('रद्द करें', 'منسوخ', 'Cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.submitBtn, (saving || uploadingImage) && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving || uploadingImage}
                >
                  {saving || uploadingImage ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <Text style={s.submitBtnText}>
                      {editingMember
                        ? tr('अपडेट करें', 'اپ ڈیٹ', 'Update')
                        : tr('महिला सदस्य जोड़ें (₹50)', 'شامل کریں (₹50)', 'Enroll Member (₹50)')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={Boolean(deleteId)} transparent animationType="fade">
        <View style={s.confirmOverlay}>
          <View style={[s.confirmCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Trash2 color="#ef4444" size={32} />
            <Text style={[s.confirmTitle, { color: textPri }]}>
              {tr('महिला सदस्य हटाएं?', 'خاتون رکن کو ہٹائیں؟', 'Remove Female Member?')}
            </Text>
            <Text style={[s.confirmSub, { color: textSec }]}>
              {tr(
                'क्या आप वाकई इस महिला सदस्य को अपने परिवार से हटाना चाहते हैं?',
                'کیا آپ واقعی اس خاتون رکن کو ہٹانا چاہتے ہیں؟',
                'Are you sure you want to remove this female member from your family registry?'
              )}
            </Text>

            <View style={s.confirmActions}>
              <TouchableOpacity
                style={[s.confirmCancelBtn, { borderColor: borderCol }]}
                onPress={() => setDeleteId(null)}
              >
                <Text style={[s.confirmCancelText, { color: textSec }]}>{tr('रद्द करें', 'منسوخ', 'Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.confirmDeleteBtn}
                onPress={() => deleteId && handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={s.confirmDeleteText}>{tr('हटाएं', 'حذف کریں', 'Delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200,168,75,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c8a84b',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#c8a84b',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  addBtnEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 6,
  },
  addBtnEmptyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  memberCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  relationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsBox: {
    padding: 12,
    borderRadius: 14,
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  slipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  slipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 12,
  },
  modalContent: {
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0c2b1d',
    padding: 16,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalHeaderFee: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c8a84b',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  relationChoice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  relationChoiceText: {
    fontSize: 11,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  uploadPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  uploadedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  feePill: {
    backgroundColor: '#0c4a2b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  feePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchBtnActive: {
    backgroundColor: '#ffffff',
  },
  switchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  switchTextActive: {
    color: '#0c2b1d',
  },
  qrBox: {
    backgroundColor: '#0c2b1d',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrImg: {
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
  },
  qrTitle: {
    color: '#c8a84b',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  qrSub: {
    color: '#94a3b8',
    fontSize: 10,
  },
  bankBox: {
    backgroundColor: '#0c2b1d',
    padding: 14,
    borderRadius: 14,
    gap: 4,
    marginBottom: 14,
  },
  bankLine: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#c8a84b',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  confirmSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  guideBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  slotBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  combChip: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  combChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#be185d',
  },
});
