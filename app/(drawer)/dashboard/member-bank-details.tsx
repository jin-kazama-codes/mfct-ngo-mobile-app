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
  Keyboard,
  TouchableWithoutFeedback,
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

  // Keyboard avoidance helpers
  const formScrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (yOffset: number) => {
    setTimeout(() => {
      formScrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 120);
  };

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

      Keyboard.dismiss();
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

  const renderToast = () => {
    if (!toast) return null;
    const bgClass =
      toast.type === 'success'
        ? 'bg-teal-600'
        : toast.type === 'error'
        ? 'bg-rose-600'
        : 'bg-sky-600';

    return (
      <View
        pointerEvents="none"
        className={`absolute top-5 left-5 right-5 z-50 rounded-2xl py-3.5 px-5 flex-row items-center justify-center gap-2.5 shadow-xl ${bgClass}`}
        style={{ elevation: 20 }}
      >
        {toast.type === 'success' && <CheckCircle2 color="#ffffff" size={20} />}
        {toast.type === 'error' && <AlertCircle color="#ffffff" size={20} />}
        {toast.type === 'info' && <ShieldCheck color="#ffffff" size={20} />}
        <Text className="text-white text-xs font-extrabold text-center shrink">
          {toast.message}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Centered Floating Toast Notification */}
      {renderToast()}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />}
      >
        {/* Header Hero Banner */}
        <View className="bg-teal-700 dark:bg-teal-900 rounded-3xl p-5 mb-5 shadow-sm border border-teal-600/30 dark:border-teal-800">
          <View className="flex-row items-center gap-1.5 mb-2">
            <View className="bg-teal-500/20 px-2 py-1 rounded-lg">
              <Text className="text-teal-200 text-[11px] font-bold">
                {tr('निजी सदस्य वॉल्ट (अलग तालिका)', 'نجی ممبر والٹ', 'Private Member Vault')}
              </Text>
            </View>
          </View>
          <Text className="text-white text-xl font-black mb-1.5">
            {tr('मेरा बैंक खाता विवरण', 'میری بینک تفصیلات', 'My Bank Account Details')}
          </Text>
          <Text className="text-teal-100 text-xs leading-relaxed">
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
          className="bg-teal-600 active:bg-teal-700 rounded-2xl py-3.5 px-5 flex-row items-center justify-center gap-2 mb-5 shadow-sm"
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
          <Text className="text-white text-sm font-extrabold">
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
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-7 items-center border border-dashed border-slate-300 dark:border-slate-800">
            <View className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3.5">
              <Building size={28} color="#0f766e" />
            </View>
            <Text className="text-slate-900 dark:text-white text-base font-extrabold mb-1">
              {tr('कोई बैंक खाता नहीं है', 'کوئی بینک اکاؤنٹ نہیں ہے', 'No Bank Account Saved Yet')}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center leading-relaxed mb-4">
              {tr(
                'सहायता वितरण एवं सत्यापन के लिए कृपया अपना बैंक खाता विवरण सुरक्षित रूप से जोड़ें।',
                'امدادی ادائیگیوں اور تصدیق کے لیے براہ کرم اپنا بینک اکاؤنٹ محفوظ طریقے سے شامل کریں۔',
                'Please add your bank account details so mutual assistance can be transferred promptly.'
              )}
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              className="bg-teal-600 active:bg-teal-700 px-5 py-2.5 rounded-xl shadow-xs"
            >
              <Text className="text-white text-xs font-bold">
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
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-4 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                {/* Header row */}
                <View className="flex-row justify-between items-start mb-3.5">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 rounded-2xl bg-teal-500/10 items-center justify-center">
                      <Building2 size={22} color="#0f766e" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white text-base font-extrabold uppercase">
                        {acc.bank_name}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">
                        {acc.account_holder_name} ({acc.account_type || 'Savings'})
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-1.5">
                    <TouchableOpacity
                      onPress={() => openEditModal(acc)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <Edit2 size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmId(acc.id)}
                      className="p-2 rounded-xl bg-rose-500/10"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Account Number Box with mask toggle */}
                <View className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl mb-2 flex-row items-center justify-between border border-slate-100 dark:border-slate-800/80">
                  <View>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-0.5">
                      {tr('खाता संख्या', 'اکاؤنٹ نمبر', 'Account Number')}
                    </Text>
                    <Text className="text-slate-900 dark:text-white text-sm font-extrabold tracking-wider">
                      {maskedAcc}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleReveal(acc.id)} className="p-1.5">
                    {isRevealed ? (
                      <EyeOff size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    ) : (
                      <Eye size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* IFSC & Branch */}
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-0.5">
                      {tr('आईएफएससी कोड', 'IFSC کوڈ', 'IFSC Code')}
                    </Text>
                    <Text className="text-slate-900 dark:text-white text-xs font-extrabold">{acc.ifsc_code}</Text>
                  </View>

                  <View className="flex-1 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-0.5">
                      {tr('शाखा', 'برانچ', 'Branch')}
                    </Text>
                    <Text className="text-slate-900 dark:text-white text-xs font-semibold" numberOfLines={1}>
                      {acc.branch_name || 'Main Branch'}
                    </Text>
                  </View>
                </View>

                {/* UPI if present */}
                {acc.upi_id ? (
                  <View className="bg-teal-500/10 p-2.5 rounded-xl mb-2 flex-row items-center gap-1.5">
                    <Smartphone size={14} color="#0f766e" />
                    <Text className="text-teal-700 dark:text-teal-300 text-xs font-bold">UPI: {acc.upi_id}</Text>
                  </View>
                ) : null}

                {/* Passbook / Cheque photo if present */}
                {acc.passbook_or_cheque_url ? (
                  <View className="flex-row items-center justify-between bg-teal-500/10 p-2.5 rounded-xl mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <FileText size={14} color="#0f766e" />
                      <Text className="text-teal-700 dark:text-teal-300 text-xs font-bold">
                        {tr('पासबुक / चेक संलग्न', 'پاس بک منسلک ہے', 'Passbook Attached')}
                      </Text>
                    </View>
                    <Image source={{ uri: acc.passbook_or_cheque_url }} className="w-7 h-7 rounded-md" />
                  </View>
                ) : null}

                {/* Status footer */}
                <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                  <View className="flex-row items-center gap-1">
                    <ShieldCheck size={14} color="#0f766e" />
                    <Text className="text-teal-600 dark:text-teal-400 text-[11px] font-bold">
                      {tr('सत्यापित व सुरक्षित', 'محفوظ اور تصدیق شدہ', 'Verified & Encrypted')}
                    </Text>
                  </View>
                  {acc.is_primary ? (
                    <View className="bg-teal-500/15 px-2 py-0.5 rounded-md">
                      <Text className="text-teal-700 dark:text-teal-300 text-[10px] font-extrabold">
                        {tr('प्राथमिक खाता', 'بنیادی اکاؤنٹ', 'Primary')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Bank Account Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/60 justify-end">
          {/* Backdrop tap to dismiss keyboard */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            className="w-full max-h-[92%]"
          >
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-full">
              {/* Drag handle */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </View>

              {/* Modal Header */}
              <View className="flex-row justify-between items-center px-5 py-2">
                <Text className="text-slate-900 dark:text-white text-lg font-black">
                  {editingAccount
                    ? tr('बैंक खाता विवरण संपादित करें', 'بینک اکاؤنٹ میں ترمیم', 'Edit Bank Details')
                    : tr('नया बैंक खाता जोड़ें', 'نیا بینک اکاؤنٹ شامل کریں', 'Add Member Bank Account')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <X size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View className="mx-5 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-2 flex-row items-center gap-2">
                  <AlertCircle size={16} color="#ef4444" />
                  <Text className="text-rose-600 dark:text-rose-400 text-xs font-bold flex-1">{errorMsg}</Text>
                </View>
              ) : null}

              <ScrollView
                ref={formScrollViewRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 8,
                  paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 260 : 320) : 40,
                }}
              >
                {/* Account Holder Name */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('खाताधारक का नाम * (पासबुक के अनुसार)', 'اکاؤنٹ ہولڈر کا نام *', 'Account Holder Name *')}
                  </Text>
                  <TextInput
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    onFocus={() => scrollToField(0)}
                    placeholder={activeUser?.name || 'Mohammad Faeem'}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-semibold"
                  />
                </View>

                {/* Bank Name Selector / Input */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('बैंक का नाम *', 'بینک کا نام *', 'Bank Name *')}
                  </Text>
                  <TextInput
                    value={bankName}
                    onChangeText={setBankName}
                    onFocus={() => scrollToField(60)}
                    placeholder={tr('उदा. स्टेट बैंक ऑफ इंडिया (SBI)', 'مثلاً اسٹیٹ بینک آف انڈیا', 'e.g. State Bank of India')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-semibold mb-2"
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {COMMON_BANKS.slice(0, 6).map((b) => (
                      <TouchableOpacity
                        key={b}
                        onPress={() => setBankName(b)}
                        className={`px-2.5 py-1.5 rounded-lg border ${
                          bankName === b
                            ? 'bg-teal-600 border-teal-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            bankName === b ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {b.split('(')[0].trim()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Account Number */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('बैंक खाता संख्या *', 'اکاؤنٹ نمبر *', 'Bank Account Number *')}
                  </Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={(val) => setAccountNumber(val.replace(/\D/g, ''))}
                    onFocus={() => scrollToField(140)}
                    keyboardType="numeric"
                    placeholder="123456789012"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold"
                  />
                </View>

                {!editingAccount && (
                  <View className="mb-3">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('खाता संख्या दोबारा दर्ज करें *', 'اکاؤنٹ نمبر کی تصدیق کریں *', 'Confirm Account Number *')}
                    </Text>
                    <TextInput
                      value={confirmAccountNumber}
                      onChangeText={(val) => setConfirmAccountNumber(val.replace(/\D/g, ''))}
                      onFocus={() => scrollToField(200)}
                      keyboardType="numeric"
                      placeholder="123456789012"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </View>
                )}

                {/* IFSC & Branch */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('आईएफएससी कोड *', 'IFSC کوڈ *', 'IFSC Code *')}
                    </Text>
                    <TextInput
                      value={ifscCode}
                      onChangeText={(val) => setIfscCode(val.toUpperCase())}
                      onFocus={() => scrollToField(280)}
                      autoCapitalize="characters"
                      maxLength={11}
                      placeholder="SBIN0001234"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('शाखा का नाम', 'برانچ', 'Branch Name')}
                    </Text>
                    <TextInput
                      value={branchName}
                      onChangeText={setBranchName}
                      onFocus={() => scrollToField(280)}
                      placeholder={tr('उदा. मुख्य शाखा', 'مثلاً مین برانچ', 'e.g. Main Branch')}
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-semibold"
                    />
                  </View>
                </View>

                {/* Account Type & UPI */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('खाता प्रकार', 'اکاؤنٹ کی قسم', 'Account Type')}
                    </Text>
                    <View className="flex-row gap-1.5">
                      <TouchableOpacity
                        onPress={() => setAccountType('Savings')}
                        className={`flex-1 py-2.5 rounded-xl items-center border ${
                          accountType === 'Savings'
                            ? 'bg-teal-600 border-teal-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            accountType === 'Savings' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {tr('बचत', 'سیونگز', 'Savings')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setAccountType('Current')}
                        className={`flex-1 py-2.5 rounded-xl items-center border ${
                          accountType === 'Current'
                            ? 'bg-teal-600 border-teal-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            accountType === 'Current' ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {tr('चालू', 'کرنٹ', 'Current')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('यूपीआई आईडी (वैकल्पिक)', 'UPI شناخت', 'UPI ID')}
                    </Text>
                    <TextInput
                      value={upiId}
                      onChangeText={setUpiId}
                      onFocus={() => scrollToField(340)}
                      placeholder="name@upi"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Passbook Photo picker */}
                <View className="mb-5">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('पासबुक या कैंसिल चेक की फोटो (वैकल्पिक)', 'پاس بک یا چیک کی تصویر', 'Passbook / Cheque Photo')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowMediaPicker(true);
                    }}
                    className={`border border-dashed rounded-xl p-3.5 items-center justify-center ${
                      passbookUri
                        ? 'border-teal-600 bg-teal-500/5'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                    }`}
                  >
                    {passbookUri ? (
                      <View className="flex-row items-center gap-2.5">
                        <Image source={{ uri: passbookUri }} className="w-10 h-10 rounded-lg" />
                        <Text className="text-teal-700 dark:text-teal-400 text-xs font-bold">
                          {tr('दस्तावेज़ चुना गया (बदलने के लिए क्लिक करें)', 'دستاویز منتخب', 'Document Selected')}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Camera size={18} color="#0f766e" />
                        <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          {tr('पासबुक या चेक चुनें', 'تصویر منتخب کریں', 'Choose Passbook or Cheque')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Action buttons */}
                <View className="flex-row items-center gap-3 pb-5">
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setModalVisible(false);
                    }}
                    style={{ flex: 1 }}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 items-center justify-center bg-slate-100 dark:bg-slate-800"
                  >
                    <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold text-center">
                      {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{ flex: 2 }}
                    className={`flex-[2] py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-teal-600 active:bg-teal-700 shadow-sm ${
                      saving ? 'opacity-70' : ''
                    }`}
                  >
                    {saving && <ActivityIndicator color="#ffffff" size="small" />}
                    <Text className="text-white text-sm font-extrabold text-center">
                      {editingAccount
                        ? tr('खाता अपडेट करें', 'اپ ڈیٹ محفوظ کریں', 'Update Account')
                        : tr('खाता सुरक्षित करें', 'محفوظ کریں', 'Save Bank Account')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Image Picker modal */}
      <Modal visible={showMediaPicker} transparent animationType="fade" onRequestClose={() => setShowMediaPicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMediaPicker(false)}
          className="flex-1 bg-black/50 justify-center items-center p-5"
        >
          <View className="w-[85%] bg-white dark:bg-slate-900 rounded-3xl p-5 gap-3.5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <Text className="text-slate-900 dark:text-white text-base font-extrabold text-center">
              {tr('पासबुक / चेक अपलोड करें', 'دستاویز اپ لوڈ کریں', 'Upload Passbook or Cheque')}
            </Text>
            <TouchableOpacity
              onPress={() => handlePickMedia('camera')}
              className="bg-teal-600 active:bg-teal-700 p-3.5 rounded-xl items-center shadow-xs"
            >
              <Text className="text-white font-bold text-sm">{tr('कैमरे से फोटो लें', 'کیمرہ استعمال کریں', 'Take Photo with Camera')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePickMedia('gallery')}
              className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-xl items-center"
            >
              <Text className="text-slate-900 dark:text-white font-bold text-sm">{tr('गैलरी से चुनें', 'گیلری سے منتخب کریں', 'Choose from Gallery')}</Text>
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
        <View className="flex-1 justify-center items-center p-6 bg-black/70">
          <View className="w-full max-w-[360px] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 items-center bg-white dark:bg-slate-900 shadow-2xl">
            <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-rose-500/15">
              <Trash2 color="#ef4444" size={28} />
            </View>
            <Text className="text-lg font-black mb-2 text-center text-slate-900 dark:text-white">
              {tr('बैंक खाता हटाएं?', 'بینک اکاؤنٹ حذف کریں؟', 'Delete Bank Account?')}
            </Text>
            <Text className="text-xs text-center leading-relaxed mb-5 text-slate-500 dark:text-slate-400">
              {tr('क्या आप वाकई इस बैंक खाते को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'کیا آپ वाकई اس بینک اکاؤنٹ کو ہٹانا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا।', 'Are you sure you want to remove this bank account? This action cannot be undone.')}
            </Text>
            <View className="flex-row gap-3 w-full border-t border-slate-200 dark:border-slate-800 pt-4">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center bg-slate-100 dark:bg-slate-800"
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text className="text-sm font-bold text-slate-600 dark:text-slate-400">
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5 bg-rose-600 active:bg-rose-700 shadow-xs"
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Trash2 color="#ffffff" size={16} />
                    <Text className="text-white text-sm font-bold">
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
