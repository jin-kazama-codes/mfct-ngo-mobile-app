import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../../../src/context/AppStateProvider';
import { MemberBankDetails } from '../../../src/types';
import {
  getMemberBankDetails,
  saveMemberBankDetails,
  updateMemberBankDetails,
  deleteMemberBankDetails,
} from '../../../src/services/memberService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import { MemberBankCardSkeleton } from '../../../src/components/SkeletonLoader';
import {
  Building2,
  Building,
  CreditCard,
  Hash,
  Code,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Camera,
  FileText,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react-native';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

const COMMON_BANKS = [
  'State Bank of India (SBI)',
  'Punjab National Bank (PNB)',
  'Bank of Baroda (BOB)',
  'Canara Bank',
  'Union Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Central Bank of India',
  'Indian Bank',
  'UCO Bank',
  'Paytm Payments Bank',
  'India Post Payments Bank (IPPB)',
  'Other Bank',
];

export default function MemberBankDetailsScreen() {
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

  const [bankAccounts, setBankAccounts] = useState<MemberBankDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MemberBankDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Toast & Delete modal state
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Form states
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountType, setAccountType] = useState<'Savings' | 'Current'>('Savings');
  const [upiId, setUpiId] = useState('');
  const [passbookUri, setPassbookUri] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Mask toggle
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (!activeUser?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMemberBankDetails(activeUser.id);
      setBankAccounts(data || []);
    } catch (err) {
      console.warn('Error loading member bank accounts in mobile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setAccountHolderName(activeUser?.name || '');
    setBankName('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscCode('');
    setBranchName('');
    setAccountType('Savings');
    setUpiId('');
    setPassbookUri('');
    setIsPrimary(bankAccounts.length === 0);
    setErrorMsg('');
    setModalVisible(true);
  };

  const openEditModal = (acc: MemberBankDetails) => {
    setEditingAccount(acc);
    setAccountHolderName(acc.account_holder_name);
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setConfirmAccountNumber(acc.account_number);
    setIfscCode(acc.ifsc_code);
    setBranchName(acc.branch_name || '');
    setAccountType(acc.account_type || 'Savings');
    setUpiId(acc.upi_id || '');
    setPassbookUri(acc.passbook_or_cheque_url || '');
    setIsPrimary(Boolean(acc.is_primary));
    setErrorMsg('');
    setModalVisible(true);
  };

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    setShowMediaPicker(false);
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast(tr('कैमरा एक्सेस की अनुमति आवश्यक है', 'کیمرے کی اجازت درکار ہے', 'Camera access permission is required'), 'error');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPassbookUri(result.assets[0].uri);
          showToast(tr('फोटो कैप्चर हो गई', 'تصویر حاصل ہو گئی', 'Photo captured successfully'), 'info');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToast(tr('गैलरी एक्सेस की अनुमति आवश्यक है', 'میڈیا کی اجازت درکار ہے', 'Media access permission is required'), 'error');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPassbookUri(result.assets[0].uri);
          showToast(tr('पासबुक प्रति चुनी गई', 'دستاویز منتخب', 'Passbook copy selected'), 'info');
        }
      }
    } catch (e) {
      console.warn('Pick media error:', e);
      showToast(tr('फ़ाइल चुनने में विफल', 'فائل منتخب کرنے میں ناکام', 'Failed to pick image'), 'error');
    }
  };

  const handleSave = async () => {
    if (!accountHolderName.trim()) {
      const err = tr('कृपया खाताधारक का नाम दर्ज करें', 'اکاؤنٹ ہولڈر کا نام درج کریں', 'Please enter account holder name');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }
    if (!bankName.trim()) {
      const err = tr('कृपया बैंक का नाम चुनें या दर्ज करें', 'بینک کا نام منتخب کریں', 'Please select or enter bank name');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }
    if (!accountNumber.trim()) {
      const err = tr('कृपया खाता संख्या दर्ज करें', 'اکاؤنٹ نمبر درج کریں', 'Please enter account number');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }
    if (!editingAccount && accountNumber.trim() !== confirmAccountNumber.trim()) {
      const err = tr('खाता संख्या मेल नहीं खाती है', 'اکاؤنٹ نمبر مماثل نہیں ہے', 'Account numbers do not match');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }
    if (!ifscCode.trim() || ifscCode.trim().length !== 11) {
      const err = tr('कृपया मान्य 11-अक्षरों का आईएफएससी कोड दर्ज करें', 'درست 11 ہندسوں کا IFSC کوڈ درج کریں', 'Please enter valid 11-digit IFSC code');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let uploadedPassbookUrl = passbookUri;
      if (passbookUri && (passbookUri.startsWith('file://') || passbookUri.startsWith('content://'))) {
        try {
          uploadedPassbookUrl = await uploadImageToSupabase(passbookUri, 'kyc');
        } catch (e) {
          console.warn('Passbook upload error:', e);
        }
      }

      const payload: Partial<MemberBankDetails> = {
        user_id: activeUser!.id,
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        branch_name: branchName.trim(),
        account_type: accountType,
        upi_id: upiId.trim(),
        is_primary: isPrimary,
        passbook_or_cheque_url: uploadedPassbookUrl,
      };

      if (editingAccount) {
        await updateMemberBankDetails(editingAccount.id, payload);
      } else {
        await saveMemberBankDetails(payload as any);
      }

      setModalVisible(false);
      await loadData();
      showToast(
        editingAccount
          ? tr('बैंक खाता विवरण अपडेट हो गया', 'بینک تفصیلات اپ ڈیٹ ہو گئیں', 'Bank details updated successfully')
          : tr('बैंक खाता सफलतापूर्वक सुरक्षित हुआ', 'بینک اکاؤنٹ محفوظ ہو گیا', 'Bank account saved successfully'),
        'success'
      );
    } catch (err: any) {
      const errTxt = err.message || 'Failed to save';
      setErrorMsg(errTxt);
      showToast(errTxt, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteMemberBankDetails(deleteConfirmId);
      showToast(tr('बैंक खाता हटा दिया गया', 'بینک اکاؤنٹ حذف کر دیا گیا', 'Bank account removed successfully'), 'success');
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || tr('हटाने में विफल', 'حذف کرنے میں ناکام', 'Failed to remove bank account'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const renderToast = () => {
    if (!toast) return null;
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          zIndex: 99999,
          elevation: 20,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          backgroundColor: toast.type === 'success' ? '#0f766e' : toast.type === 'error' ? '#dc2626' : '#0284c7',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        {toast.type === 'success' && <CheckCircle2 color="#ffffff" size={20} />}
        {toast.type === 'error' && <AlertCircle color="#ffffff" size={20} />}
        {toast.type === 'info' && <ShieldCheck color="#ffffff" size={20} />}
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800', textAlign: 'center', flexShrink: 1 }}>
          {toast.message}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Centered Floating Toast Notification */}
      {renderToast()}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />}
      >
        {/* Header Hero Banner */}
        <View
          style={{
            backgroundColor: isDark ? '#0f172a' : '#0f766e',
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
            borderWidth: 1,
            borderColor: isDark ? '#1e293b' : '#115e59',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#14b8a640', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#99f6e4', fontSize: 11, fontWeight: '700' }}>
                {tr('निजी सदस्य वॉल्ट (अलग तालिका)', 'نجی ممبر والٹ', 'Private Member Vault')}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
            {tr('मेरा बैंक खाता विवरण', 'میری بینک تفصیلات', 'My Bank Account Details')}
          </Text>
          <Text style={{ color: '#ccfbf1', fontSize: 12, lineHeight: 18 }}>
            {tr(
              'यह आपका निजी खाता है। किसी भी सहायता राशि या रिफंड अंतरण हेतु ट्रस्ट केवल इस खाते का उपयोग करता है। यह ट्रस्ट के आधिकारिक दान खातों से पूर्णतः अलग है।',
              'یہ آپ کا ذاتی اکاؤنٹ ہے۔ امدادی رقم یا ریفنڈ کی منتقلی کے لیے ٹرسٹ صرف اس اکاؤنٹ کا استعمال کرتا ہے۔',
              'This is your personal bank account. The Trust uses this verified account exclusively for disbursing mutual assistance relief or processing refunds.'
            )}
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={openAddModal}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#0f766e',
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            shadowColor: '#0f766e',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
            {tr('बैंक खाता जोड़ें', 'بینک اکاؤنٹ شامل کریں', 'Add Bank Account')}
          </Text>
        </TouchableOpacity>

        {/* List of Bank Accounts */}
        {loading ? (
          <View>
            <MemberBankCardSkeleton isDark={isDark} />
            <MemberBankCardSkeleton isDark={isDark} />
          </View>
        ) : bankAccounts.length === 0 ? (
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: border,
              borderStyle: 'dashed',
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: isDark ? '#334155' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Building size={30} color="#0f766e" />
            </View>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
              {tr('कोई बैंक खाता नहीं है', 'کوئی بینک اکاؤنٹ نہیں ہے', 'No Bank Account Saved Yet')}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              {tr(
                'सहायता वितरण एवं सत्यापन के लिए कृपया अपना बैंक खाता विवरण सुरक्षित रूप से जोड़ें।',
                'امدادی ادائیگیوں اور تصدیق کے لیے براہ کرم اپنا بینک اکاؤنٹ محفوظ طریقے سے شامل کریں۔',
                'Please add your bank account details so mutual assistance can be transferred promptly.'
              )}
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              style={{
                backgroundColor: '#0f766e',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                {tr('अभी बैंक खाता जोड़ें', 'ابھی شامل کریں', 'Add Bank Account Now')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          bankAccounts.map((acc) => {
            const isRevealed = Boolean(revealedIds[acc.id]);
            const maskedAcc = isRevealed
              ? acc.account_number
              : `•••• •••• •••• ${acc.account_number.slice(-4)}`;

            return (
              <View
                key={acc.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: border,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Header row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#0f766e20',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={22} color="#0f766e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', textTransform: 'uppercase' }}>
                        {acc.bank_name}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                        {acc.account_holder_name} ({acc.account_type || 'Savings'})
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(acc)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                    >
                      <Edit2 size={16} color={textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmId(acc.id)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: '#ef444420' }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Account Number Box with mask toggle */}
                <View
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                      {tr('खाता संख्या', 'اکاؤنٹ نمبر', 'Account Number')}
                    </Text>
                    <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '800', letterSpacing: 1 }}>
                      {maskedAcc}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleReveal(acc.id)} style={{ padding: 6 }}>
                    {isRevealed ? <EyeOff size={18} color={textSecondary} /> : <Eye size={18} color={textSecondary} />}
                  </TouchableOpacity>
                </View>

                {/* IFSC & Branch */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                      {tr('आईएफएससी कोड', 'IFSC کوڈ', 'IFSC Code')}
                    </Text>
                    <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '800' }}>{acc.ifsc_code}</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                    <Text style={{ color: textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>
                      {tr('शाखा', 'برانچ', 'Branch')}
                    </Text>
                    <Text style={{ color: textPrimary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                      {acc.branch_name || 'Main Branch'}
                    </Text>
                  </View>
                </View>

                {/* UPI if present */}
                {acc.upi_id && (
                  <View style={{ backgroundColor: '#0f766e15', padding: 10, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Smartphone size={14} color="#0f766e" />
                    <Text style={{ color: '#0f766e', fontSize: 12, fontWeight: '700' }}>UPI: {acc.upi_id}</Text>
                  </View>
                )}

                {/* Passbook / Cheque photo if present */}
                {acc.passbook_or_cheque_url && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color="#0f766e" />
                      <Text style={{ color: textPrimary, fontSize: 12, fontWeight: '700' }}>
                        {tr('पासबुक / चेक संलग्न', 'پاس بک منسلک ہے', 'Passbook Attached')}
                      </Text>
                    </View>
                    <Image source={{ uri: acc.passbook_or_cheque_url }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                  </View>
                )}

                {/* Status footer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} color="#0f766e" />
                    <Text style={{ color: '#0f766e', fontSize: 11, fontWeight: '700' }}>
                      {tr('सत्यापित व सुरक्षित', 'محفوظ اور تصدیق شدہ', 'Verified & Encrypted')}
                    </Text>
                  </View>
                  {acc.is_primary && (
                    <View style={{ backgroundColor: '#0f766e20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: '#0f766e', fontSize: 10, fontWeight: '800' }}>
                        {tr('प्राथमिक खाता', 'بنیادی اکاؤنٹ', 'Primary')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Bank Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          {renderToast()}
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
              padding: 20,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '900' }}>
                {editingAccount
                  ? tr('बैंक खाता विवरण संपादित करें', 'بینک اکاؤنٹ میں ترمیم', 'Edit Bank Details')
                  : tr('नया बैंक खाता जोड़ें', 'نیا بینک اکاؤنٹ شامل کریں', 'Add Member Bank Account')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 6 }}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View style={{ backgroundColor: '#ef444420', padding: 10, borderRadius: 10, marginBottom: 12 }}>
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>{errorMsg}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Holder Name */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('खाताधारक का नाम * (पासबुक के अनुसार)', 'اکاؤنٹ ہولڈر کا نام *', 'Account Holder Name *')}
                </Text>
                <TextInput
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder={activeUser?.name || 'Mohammad Faeem'}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                />
              </View>

              {/* Bank Name Selector / Input */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('बैंक का नाम *', 'بینک کا نام *', 'Bank Name *')}
                </Text>
                <TextInput
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder={tr('उदा. स्टेट बैंक ऑफ इंडिया (SBI)', 'مثلاً اسٹیٹ بینک آف انڈیا', 'e.g. State Bank of India')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {COMMON_BANKS.slice(0, 6).map((b) => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => setBankName(b)}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text style={{ color: textPrimary, fontSize: 11, fontWeight: '600' }}>{b.split('(')[0].trim()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Account Number & Confirm */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('बैंक खाता संख्या *', 'اکاؤنٹ نمبر *', 'Bank Account Number *')}
                </Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={(val) => setAccountNumber(val.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="123456789012"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                />
              </View>

              {!editingAccount && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('खाता संख्या दोबारा दर्ज करें *', 'اکاؤنٹ نمبر کی تصدیق کریں *', 'Confirm Account Number *')}
                  </Text>
                  <TextInput
                    value={confirmAccountNumber}
                    onChangeText={(val) => setConfirmAccountNumber(val.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholder="123456789012"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 12,
                      padding: 12,
                      color: textPrimary,
                      fontSize: 14,
                      fontWeight: '700',
                    }}
                  />
                </View>
              )}

              {/* IFSC & Branch */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('आईएफएससी कोड *', 'IFSC کوڈ *', 'IFSC Code *')}
                  </Text>
                  <TextInput
                    value={ifscCode}
                    onChangeText={(val) => setIfscCode(val.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={11}
                    placeholder="SBIN0001234"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 12,
                      padding: 12,
                      color: textPrimary,
                      fontSize: 14,
                      fontWeight: '700',
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('शाखा का नाम', 'برانچ', 'Branch Name')}
                  </Text>
                  <TextInput
                    value={branchName}
                    onChangeText={setBranchName}
                    placeholder={tr('उदा. मुख्य शाखा', 'مثلاً مین برانچ', 'e.g. Main Branch')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 12,
                      padding: 12,
                      color: textPrimary,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  />
                </View>
              </View>

              {/* Account Type & UPI */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('खाता प्रकार', 'اکاؤنٹ کی قسم', 'Account Type')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setAccountType('Savings')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: accountType === 'Savings' ? '#0f766e' : isDark ? '#0f172a' : '#f1f5f9',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: accountType === 'Savings' ? '#0f766e' : border,
                      }}
                    >
                      <Text style={{ color: accountType === 'Savings' ? '#ffffff' : textPrimary, fontSize: 11, fontWeight: '700' }}>
                        {tr('बचत', 'سیونگز', 'Savings')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAccountType('Current')}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: accountType === 'Current' ? '#0f766e' : isDark ? '#0f172a' : '#f1f5f9',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: accountType === 'Current' ? '#0f766e' : border,
                      }}
                    >
                      <Text style={{ color: accountType === 'Current' ? '#ffffff' : textPrimary, fontSize: 11, fontWeight: '700' }}>
                        {tr('चालू', 'کرنٹ', 'Current')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('यूपीआई आईडी (वैकल्पिक)', 'UPI شناخت', 'UPI ID')}
                  </Text>
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="name@upi"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 12,
                      padding: 12,
                      color: textPrimary,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  />
                </View>
              </View>

              {/* Passbook Photo picker */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('पासबुक या कैंसिल चेक की फोटो (वैकल्पिक)', 'پاس بک یا چیک کی تصویر', 'Passbook / Cheque Photo')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMediaPicker(true)}
                  style={{
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: passbookUri ? '#0f766e' : border,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  }}
                >
                  {passbookUri ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Image source={{ uri: passbookUri }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                      <Text style={{ color: '#0f766e', fontSize: 13, fontWeight: '700' }}>
                        {tr('दस्तावेज़ चुना गया (बदलने के लिए क्लिक करें)', 'دستاویز منتخب', 'Document Selected')}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Camera size={18} color="#0f766e" />
                      <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '600' }}>
                        {tr('पासबुक या चेक चुनें', 'تصویر منتخب کریں', 'Choose Passbook or Cheque')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: textSecondary, fontSize: 14, fontWeight: '700' }}>
                    {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2,
                    backgroundColor: '#0f766e',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving && <ActivityIndicator color="#ffffff" size="small" />}
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                    {editingAccount
                      ? tr('खाता अपडेट करें', 'اپ ڈیٹ محفوظ کریں', 'Update Account')
                      : tr('खाता सुरक्षित करें', 'محفوظ کریں', 'Save Bank Account')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker modal */}
      <Modal visible={showMediaPicker} transparent animationType="fade" onRequestClose={() => setShowMediaPicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMediaPicker(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={{ width: '85%', backgroundColor: cardBg, borderRadius: 20, padding: 20, gap: 14 }}>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
              {tr('पासबुक / चेक अपलोड करें', 'دستاویز اپ لوڈ کریں', 'Upload Passbook or Cheque')}
            </Text>
            <TouchableOpacity
              onPress={() => handlePickMedia('camera')}
              style={{ backgroundColor: '#0f766e', padding: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>{tr('कैमरे से फोटो लें', 'کیمرہ استعمال کریں', 'Take Photo with Camera')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePickMedia('gallery')}
              style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', padding: 14, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: textPrimary, fontWeight: '700' }}>{tr('गैलरी से चुनें', 'گیلری سے منتخب کریں', 'Choose from Gallery')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: border,
              padding: 24,
              alignItems: 'center',
              backgroundColor: cardBg,
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: '#ef444420' }}>
              <Trash2 color="#ef4444" size={28} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center', color: textPrimary }}>
              {tr('बैंक खाता हटाएं?', 'بینک اکاؤنٹ حذف کریں؟', 'Delete Bank Account?')}
            </Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20, color: textSecondary }}>
              {tr('क्या आप वाकई इस बैंक खाते को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'کیا آپ واقعی اس بینک اکاؤنٹ کو ہٹانا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔', 'Are you sure you want to remove this bank account? This action cannot be undone.')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', borderTopWidth: 1, borderTopColor: border, paddingTop: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: textSecondary }}>
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ef4444' }}
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Trash2 color="#ffffff" size={16} />
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                      {tr('हां, हटाएं', 'ہاں، حذف کریں', 'Yes, Delete')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
