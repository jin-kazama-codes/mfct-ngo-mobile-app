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
import { MemberNominee } from '../../../src/types';
import {
  getMemberNominees,
  saveMemberNominee,
  updateMemberNominee,
  deleteMemberNominee,
} from '../../../src/services/memberService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import { NomineeCardSkeleton } from '../../../src/components/SkeletonLoader';
import {
  UserCheck,
  Heart,
  ShieldCheck,
  Phone,
  Calendar,
  Hash,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
  X,
  Camera,
  FileText,
  Percent,
  CheckCircle2,
} from 'lucide-react-native';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

const RELATION_OPTIONS = [
  { value: 'Spouse', labelEn: 'Spouse (Wife / Husband)', labelHi: 'जीवनसाथी (पत्नी / पति)', labelUr: 'شریک حیات (بیوی / شوہر)' },
  { value: 'Father', labelEn: 'Father', labelHi: 'पिता', labelUr: 'والد' },
  { value: 'Mother', labelEn: 'Mother', labelHi: 'माता', labelUr: 'والدہ' },
  { value: 'Son', labelEn: 'Son', labelHi: 'पुत्र (बेटा)', labelUr: 'بیٹا' },
  { value: 'Daughter', labelEn: 'Daughter', labelHi: 'पुत्री (बेटी)', labelUr: 'بیٹی' },
  { value: 'Brother', labelEn: 'Brother', labelHi: 'भाई', labelUr: 'بھائی' },
  { value: 'Sister', labelEn: 'Sister', labelHi: 'बहन', labelUr: 'بہن' },
  { value: 'Other', labelEn: 'Other Dependent', labelHi: 'अन्य रिश्तेदार / आश्रित', labelUr: 'دیگر رشتہ دار' },
];

export default function NomineeDetailsScreen() {
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

  const [nominees, setNominees] = useState<MemberNominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNominee, setEditingNominee] = useState<MemberNominee | null>(null);
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
  const [nomineeName, setNomineeName] = useState('');
  const [relation, setRelation] = useState('Spouse');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [sharePercentage, setSharePercentage] = useState('100');
  const [idProofUri, setIdProofUri] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeUser?.id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMemberNominees(activeUser.id);
      setNominees(data || []);
    } catch (err) {
      console.warn('Error loading member nominees in mobile:', err);
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

  const openAddModal = () => {
    setEditingNominee(null);
    setNomineeName('');
    setRelation('Spouse');
    setPhone('');
    setEmail('');
    setDob('');
    setAge('');
    setAadhaarNumber('');
    setAddress(activeUser?.address || '');
    setSharePercentage('100');
    setIdProofUri('');
    setErrorMsg('');
    setModalVisible(true);
  };

  const openEditModal = (nom: MemberNominee) => {
    setEditingNominee(nom);
    setNomineeName(nom.nominee_name);
    setRelation(nom.relation);
    setPhone(nom.phone);
    setEmail(nom.email || '');
    setDob(nom.date_of_birth || '');
    setAge(nom.age ? nom.age.toString() : '');
    setAadhaarNumber(nom.aadhaar_number || '');
    setAddress(nom.address || '');
    setSharePercentage(nom.share_percentage ? nom.share_percentage.toString() : '100');
    setIdProofUri(nom.id_proof_url || '');
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
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setIdProofUri(result.assets[0].uri);
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
          setIdProofUri(result.assets[0].uri);
          showToast(tr('दस्तावेज़ चुना गया', 'دستاویز منتخب', 'Document selected'), 'info');
        }
      }
    } catch (e) {
      console.warn('Pick media error:', e);
      showToast(tr('फ़ाइल चुनने में विफल', 'فائل منتخب کرنے میں ناکام', 'Failed to pick image'), 'error');
    }
  };

  const handleSave = async () => {
    if (!nomineeName.trim()) {
      const err = tr('कृपया नॉमिनी का पूरा नाम दर्ज करें', 'براہ کرم نامزد کا نام درج کریں', 'Please enter nominee name');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      const err = tr('कृपया मान्य 10-अंकों का मोबाइल नंबर दर्ज करें', 'براہ کرم 10 ہندسوں کا موبائل نمبر درج کریں', 'Please enter valid 10-digit phone number');
      setErrorMsg(err);
      showToast(err, 'error');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let uploadedDocUrl = idProofUri;
      if (idProofUri && (idProofUri.startsWith('file://') || idProofUri.startsWith('content://'))) {
        try {
          uploadedDocUrl = await uploadImageToSupabase(idProofUri, 'kyc');
        } catch (e) {
          console.warn('Doc upload error:', e);
        }
      }

      const payload: Partial<MemberNominee> = {
        user_id: activeUser!.id,
        nominee_name: nomineeName.trim(),
        relation,
        phone: phone.trim(),
        email: email.trim(),
        date_of_birth: dob,
        age: age ? parseInt(age, 10) : undefined,
        aadhaar_number: aadhaarNumber.trim(),
        address: address.trim(),
        share_percentage: sharePercentage ? parseInt(sharePercentage, 10) : 100,
        id_proof_url: uploadedDocUrl,
      };

      if (editingNominee) {
        await updateMemberNominee(editingNominee.id, payload);
      } else {
        await saveMemberNominee(payload as any);
      }

      Keyboard.dismiss();
      setModalVisible(false);
      await loadData();
      showToast(
        editingNominee
          ? tr('नॉमिनी विवरण अपडेट हो गया', 'نامزد تفصیلات اپ ڈیٹ ہو گئیں', 'Nominee updated successfully')
          : tr('नॉमिनी सफलतापूर्वक जोड़ा गया', 'نامزد کامیابی سے شامل کیا گیا', 'Nominee added successfully'),
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
      await deleteMemberNominee(deleteConfirmId);
      showToast(tr('नॉमिनी हटा दिया गया', 'نامزد ہٹا دیا گیا', 'Nominee removed successfully'), 'success');
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || tr('हटाने में विफल', 'حذف کرنے میں ناکام', 'Failed to remove nominee'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const renderToast = () => {
    if (!toast) return null;
    const bgClass =
      toast.type === 'success'
        ? 'bg-emerald-600'
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
      >
        {/* Header Hero Banner */}
        <View className="bg-emerald-700 dark:bg-emerald-900 rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row items-center gap-1.5 mb-2">
            <View className="bg-emerald-500/20 px-2 py-1 rounded-lg">
              <Text className="text-emerald-200 text-[11px] font-bold">
                {tr('ट्रस्ट नियम 13 - नॉमिनी सुरक्षा', 'قاعدہ 13 - نامزد تحفظ', 'Rule 13 - Solace Protection')}
              </Text>
            </View>
          </View>
          <Text className="text-white text-xl font-black mb-1.5">
            {tr('सदस्य नॉमिनी विवरण', 'ممبر نامزد تفصیلات', 'Member Nominee Details')}
          </Text>
          <Text className="text-emerald-100 text-xs leading-relaxed">
            {tr(
              'असामयिक निधन की स्थिति में ट्रस्ट द्वारा पारस्परिक सहयोग राशि सीधे अधिकृत व सत्यापित नॉमिनी के खाते में हस्तांतरित की जाती है।',
              'ناگہانی انتقال کی صورت میں امدادی رقم براہ راست نامزد وارث کے بینک اکاؤنٹ میں منتقل کی جاتی ہے۔',
              'In unfortunate demise events, mutual solace aid is transferred directly to the designated verified nominee.'
            )}
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={openAddModal}
          activeOpacity={0.8}
          className="bg-emerald-500 active:bg-emerald-600 rounded-2xl py-3.5 px-5 flex-row items-center justify-center gap-2 mb-5 shadow-sm"
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
          <Text className="text-white text-sm font-extrabold">
            {nominees.length > 0
              ? tr('दूसरा नॉमिनी जोड़ें', 'دوسرا نامزد شامل کریں', 'Add Co-Nominee')
              : tr('नॉमिनी पंजीकृत करें', 'نامزد شامل کریں', 'Add Nominee')}
          </Text>
        </TouchableOpacity>

        {/* List of Nominees */}
        {loading ? (
          <View>
            <NomineeCardSkeleton isDark={isDark} />
            <NomineeCardSkeleton isDark={isDark} />
          </View>
        ) : nominees.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-7 items-center border border-dashed border-slate-300 dark:border-slate-800">
            <View className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3.5">
              <Heart size={28} color="#10b981" />
            </View>
            <Text className="text-slate-900 dark:text-white text-base font-extrabold mb-1">
              {tr('कोई नॉमिनी दर्ज नहीं है', 'کوئی نامزد درج نہیں ہے', 'No Nominee Registered Yet')}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-xs text-center leading-relaxed mb-4">
              {tr(
                'नियमावली के तहत सहायता के लिए नॉमिनी का विवरण अनिवार्य है। कृपया अपने परिवार की सुरक्षा हेतु नॉमिनी जोड़ें।',
                'قواعد کے مطابق نامزد کی تفصیلات لازمی ہیں۔ براہ کرم نامزد شامل کریں۔',
                'Designating a verified nominee is required so mutual relief can be smoothly granted.'
              )}
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              className="bg-emerald-500 active:bg-emerald-600 px-5 py-2.5 rounded-xl shadow-xs"
            >
              <Text className="text-white text-xs font-bold">
                {tr('अभी जोड़ें', 'ابھی شامل کریں', 'Add Nominee Now')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          nominees.map((nom, idx) => {
            const relObj = RELATION_OPTIONS.find((r) => r.value.toLowerCase() === nom.relation.toLowerCase());
            const displayRelation = relObj
              ? lang === 'hi'
                ? relObj.labelHi
                : lang === 'ur'
                ? relObj.labelUr
                : relObj.labelEn
              : nom.relation;

            return (
              <View
                key={nom.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-4 border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                {/* Header row */}
                <View className="flex-row justify-between items-start mb-3.5">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 rounded-2xl bg-emerald-500/10 items-center justify-center">
                      <UserCheck size={22} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-900 dark:text-white text-base font-extrabold capitalize">
                        {nom.nominee_name}
                      </Text>
                      <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-0.5">
                        {displayRelation} • {idx === 0 ? tr('मुख्य', 'اہم', 'Primary') : tr('सह-नॉमिनी', 'شریک', 'Co-Nominee')}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-1.5">
                    <TouchableOpacity
                      onPress={() => openEditModal(nom)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                    >
                      <Edit2 size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmId(nom.id)}
                      className="p-2 rounded-xl bg-rose-500/10"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Details grid */}
                <View className="gap-2">
                  <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl">
                    <View className="flex-row items-center gap-1.5">
                      <Phone size={14} color="#10b981" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">{tr('फ़ोन नंबर', 'فون نمبر', 'Phone')}</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-xs font-bold">{nom.phone}</Text>
                  </View>

                  <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl">
                    <View className="flex-row items-center gap-1.5">
                      <Percent size={14} color="#10b981" />
                      <Text className="text-slate-500 dark:text-slate-400 text-xs">{tr('हिस्सेदारी', 'حصہ داری', 'Share %')}</Text>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-xs font-bold">{nom.share_percentage || 100}%</Text>
                  </View>

                  {nom.aadhaar_number ? (
                    <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl">
                      <View className="flex-row items-center gap-1.5">
                        <Hash size={14} color="#10b981" />
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">{tr('पहचान पत्र / आधार', 'آدھار کارڈ', 'ID Number')}</Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        •••• •••• {nom.aadhaar_number.slice(-4)}
                      </Text>
                    </View>
                  ) : null}

                  {(nom.date_of_birth || nom.age) ? (
                    <View className="flex-row justify-between items-center bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl">
                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={14} color="#10b981" />
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">{tr('जन्म तिथि / आयु', 'عمر / پیدائش', 'DOB / Age')}</Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white text-xs font-bold">
                        {nom.date_of_birth || `${nom.age} Yrs`}
                      </Text>
                    </View>
                  ) : null}

                  {nom.address ? (
                    <View className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <MapPin size={14} color="#10b981" />
                        <Text className="text-slate-500 dark:text-slate-400 text-xs">{tr('पता', 'پتہ', 'Address')}</Text>
                      </View>
                      <Text className="text-slate-900 dark:text-white text-xs font-semibold leading-relaxed">{nom.address}</Text>
                    </View>
                  ) : null}

                  {nom.id_proof_url ? (
                    <View className="flex-row items-center justify-between bg-emerald-500/10 p-2.5 rounded-xl">
                      <View className="flex-row items-center gap-1.5">
                        <FileText size={14} color="#10b981" />
                        <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          {tr('पहचान पत्र संलग्न है', 'دستاویز منسلک ہے', 'ID Proof Attached')}
                        </Text>
                      </View>
                      <Image source={{ uri: nom.id_proof_url }} className="w-7 h-7 rounded-md" />
                    </View>
                  ) : null}
                </View>

                {/* Status footer */}
                <View className="flex-row items-center gap-1 mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                  <ShieldCheck size={14} color="#10b981" />
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    {tr('ट्रस्ट रिकॉर्ड में सुरक्षित व संलग्न', 'ریکارڈ میں محفوظ', 'Secured & Linked in Trust Database')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Nominee Modal */}
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
              {/* Drag Indicator */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </View>

              {/* Modal Header */}
              <View className="flex-row justify-between items-center px-5 py-2">
                <Text className="text-slate-900 dark:text-white text-lg font-black">
                  {editingNominee
                    ? tr('नॉमिनी विवरण संपादित करें', 'نامزد تفصیلات میں ترمیم', 'Edit Nominee Details')
                    : tr('नया नॉमिनी जोड़ें', 'نیا نامزد شامل کریں', 'Register New Nominee')}
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
                {/* Full Name */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('नॉमिनी का पूरा नाम *', 'مکمل نام *', 'Nominee Full Name *')}
                  </Text>
                  <TextInput
                    value={nomineeName}
                    onChangeText={setNomineeName}
                    onFocus={() => scrollToField(0)}
                    placeholder={tr('उदा. फातिमा खान', 'مثلاً فاطمہ خان', 'e.g. Fatima Khan')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-semibold"
                  />
                </View>

                {/* Relationship options */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('रिश्ता *', 'رشتہ *', 'Relationship *')}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {RELATION_OPTIONS.map((opt) => {
                      const isSelected = relation.toLowerCase() === opt.value.toLowerCase();
                      const label = lang === 'hi' ? opt.labelHi : lang === 'ur' ? opt.labelUr : opt.labelEn;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setRelation(opt.value)}
                          className={`px-3 py-2 rounded-xl border ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Phone & Share % */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('मोबाइल नंबर *', 'موبائل نمبر *', 'Mobile Number *')}
                    </Text>
                    <TextInput
                      value={phone}
                      onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                      onFocus={() => scrollToField(120)}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="9876543210"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </View>

                  <View className="w-24">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('हिस्सा %', 'حصہ %', 'Share %')}
                    </Text>
                    <TextInput
                      value={sharePercentage}
                      onChangeText={setSharePercentage}
                      onFocus={() => scrollToField(120)}
                      keyboardType="numeric"
                      placeholder="100"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold text-center"
                    />
                  </View>
                </View>

                {/* Aadhaar & Age */}
                <View className="flex-row gap-2.5 mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('आधार संख्या (वैकल्पिक)', 'آدھار نمبر', 'Aadhaar / Govt ID')}
                    </Text>
                    <TextInput
                      value={aadhaarNumber}
                      onChangeText={(val) => setAadhaarNumber(val.replace(/\D/g, ''))}
                      onFocus={() => scrollToField(220)}
                      keyboardType="numeric"
                      maxLength={12}
                      placeholder="123456789012"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold"
                    />
                  </View>

                  <View className="w-24">
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                      {tr('आयु (वर्ष)', 'عمر', 'Age')}
                    </Text>
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      onFocus={() => scrollToField(220)}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm font-bold text-center"
                    />
                  </View>
                </View>

                {/* Address (LAST TEXT FIELD - FIXED WITH onFocus AND AMPLE PADDING) */}
                <View className="mb-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('नॉमिनी का पता', 'پتہ', 'Nominee Address')}
                  </Text>
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    onFocus={() => scrollToField(340)}
                    multiline
                    numberOfLines={3}
                    placeholder={tr('पता दर्ज करें...', 'پتہ درج करें...', 'Enter house, street, city...')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-xs min-h-[60px]"
                    textAlignVertical="top"
                  />
                </View>

                {/* Photo / ID proof picker */}
                <View className="mb-5">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase mb-1.5">
                    {tr('पहचान पत्र की फोटो (वैकल्पिक)', 'شناختی ثبوت کی تصویر', 'ID Proof Photo (Optional)')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowMediaPicker(true);
                    }}
                    className={`border border-dashed rounded-xl p-3.5 items-center justify-center ${
                      idProofUri
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
                    }`}
                  >
                    {idProofUri ? (
                      <View className="flex-row items-center gap-2.5">
                        <Image source={{ uri: idProofUri }} className="w-10 h-10 rounded-lg" />
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          {tr('दस्तावेज़ चुना गया (बदलने के लिए क्लिक करें)', 'دستاویز منتخب', 'Document Selected (Tap to change)')}
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Camera size={18} color="#10b981" />
                        <Text className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
                          {tr('आधार या पहचान पत्र चुनें', 'تصویر منتخب کریں', 'Choose Aadhaar / Photo ID')}
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
                    className={`flex-[2] py-3.5 rounded-xl items-center flex-row justify-center gap-2 bg-emerald-500 active:bg-emerald-600 shadow-sm ${
                      saving ? 'opacity-70' : ''
                    }`}
                  >
                    {saving && <ActivityIndicator color="#ffffff" size="small" />}
                    <Text className="text-white text-sm font-extrabold text-center">
                      {editingNominee
                        ? tr('अपडेट सहेजें', 'اپ ڈیٹ محفوظ کریں', 'Save Updates')
                        : tr('नॉमिनी सुरक्षित करें', 'نامزد محفوظ کریں', 'Save Nominee')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Image Picker source modal */}
      <Modal visible={showMediaPicker} transparent animationType="fade" onRequestClose={() => setShowMediaPicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMediaPicker(false)}
          className="flex-1 bg-black/50 justify-center items-center p-5"
        >
          <View className="w-[85%] bg-white dark:bg-slate-900 rounded-3xl p-5 gap-3.5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <Text className="text-slate-900 dark:text-white text-base font-extrabold text-center">
              {tr('दस्तावेज़ अपलोड करें', 'دستاویز اپ لوڈ کریں', 'Upload ID Document')}
            </Text>
            <TouchableOpacity
              onPress={() => handlePickMedia('camera')}
              className="bg-emerald-500 active:bg-emerald-600 p-3.5 rounded-xl items-center shadow-xs"
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
              {tr('नॉमिनी हटाएं?', 'نامزد حذف کریں؟', 'Delete Nominee?')}
            </Text>
            <Text className="text-xs text-center leading-relaxed mb-5 text-slate-500 dark:text-slate-400">
              {tr('क्या आप वाकई इस नॉमिनी को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'کیا آپ वाकई اس نامزد کو ہٹانا چاہتے ہیں؟ یہ عمل واپس نہیں ہو सकता।', 'Are you sure you want to remove this nominee? This action cannot be undone.')}
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
