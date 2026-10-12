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
          backgroundColor: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#dc2626' : '#0284c7',
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />}
      >
        {/* Header Hero Banner */}
        <View
          style={{
            backgroundColor: isDark ? '#064e3b' : '#047857',
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#10b98140', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#a7f3d0', fontSize: 11, fontWeight: '700' }}>
                {tr('ट्रस्ट नियम 13 - नॉमिनी सुरक्षा', 'قاعدہ 13 - نامزد تحفظ', 'Rule 13 - Solace Protection')}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '900', marginBottom: 6 }}>
            {tr('सदस्य नॉमिनी विवरण', 'ممبر نامزد تفصیلات', 'Member Nominee Details')}
          </Text>
          <Text style={{ color: '#d1fae5', fontSize: 12, lineHeight: 18 }}>
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
          style={{
            backgroundColor: '#10b981',
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            shadowColor: '#10b981',
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
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
              <Heart size={30} color="#10b981" />
            </View>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 4 }}>
              {tr('कोई नॉमिनी दर्ज नहीं है', 'کوئی نامزد درج نہیں ہے', 'No Nominee Registered Yet')}
            </Text>
            <Text style={{ color: textSecondary, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
              {tr(
                'नियमावली के तहत सहायता के लिए नॉमिनी का विवरण अनिवार्य है। कृपया अपने परिवार की सुरक्षा हेतु नॉमिनी जोड़ें।',
                'قواعد کے مطابق نامزد کی تفصیلات لازمی ہیں۔ براہ کرم نامزد شامل کریں۔',
                'Designating a verified nominee is required so mutual relief can be smoothly granted.'
              )}
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              style={{
                backgroundColor: '#10b981',
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
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
                        backgroundColor: '#10b98120',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserCheck size={22} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' }}>
                        {nom.nominee_name}
                      </Text>
                      <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        {displayRelation} • {idx === 0 ? tr('मुख्य', 'اہم', 'Primary') : tr('सह-नॉमिनी', 'شریک', 'Co-Nominee')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(nom)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                    >
                      <Edit2 size={16} color={textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteConfirmId(nom.id)}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: '#ef444420' }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Details grid */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} color="#10b981" />
                      <Text style={{ color: textSecondary, fontSize: 12 }}>{tr('फ़ोन नंबर', 'فون نمبر', 'Phone')}</Text>
                    </View>
                    <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '700' }}>{nom.phone}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Percent size={14} color="#10b981" />
                      <Text style={{ color: textSecondary, fontSize: 12 }}>{tr('हिस्सेदारी', 'حصہ داری', 'Share %')}</Text>
                    </View>
                    <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '700' }}>{nom.share_percentage || 100}%</Text>
                  </View>

                  {nom.aadhaar_number && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Hash size={14} color="#10b981" />
                        <Text style={{ color: textSecondary, fontSize: 12 }}>{tr('पहचान पत्र / आधार', 'آدھار کارڈ', 'ID Number')}</Text>
                      </View>
                      <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '700' }}>
                        •••• •••• {nom.aadhaar_number.slice(-4)}
                      </Text>
                    </View>
                  )}

                  {(nom.date_of_birth || nom.age) && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="#10b981" />
                        <Text style={{ color: textSecondary, fontSize: 12 }}>{tr('जन्म तिथि / आयु', 'عمر / پیدائش', 'DOB / Age')}</Text>
                      </View>
                      <Text style={{ color: textPrimary, fontSize: 13, fontWeight: '700' }}>
                        {nom.date_of_birth || `${nom.age} Yrs`}
                      </Text>
                    </View>
                  )}

                  {nom.address && (
                    <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <MapPin size={14} color="#10b981" />
                        <Text style={{ color: textSecondary, fontSize: 12 }}>{tr('पता', 'پتہ', 'Address')}</Text>
                      </View>
                      <Text style={{ color: textPrimary, fontSize: 12, fontWeight: '600' }}>{nom.address}</Text>
                    </View>
                  )}

                  {nom.id_proof_url && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#10b98115', padding: 10, borderRadius: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#10b981" />
                        <Text style={{ color: '#059669', fontSize: 12, fontWeight: '700' }}>
                          {tr('पहचान पत्र संलग्न है', 'دستاویز منسلک ہے', 'ID Proof Attached')}
                        </Text>
                      </View>
                      <Image source={{ uri: nom.id_proof_url }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    </View>
                  )}
                </View>

                {/* Status footer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: border }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700' }}>
                    {tr('ट्रस्ट रिकॉर्ड में सुरक्षित व संलग्न', 'ریکارڈ میں محفوظ', 'Secured & Linked in Trust Database')}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Nominee Modal */}
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
                {editingNominee
                  ? tr('नॉमिनी विवरण संपादित करें', 'نامزد تفصیلات میں ترمیم', 'Edit Nominee Details')
                  : tr('नया नॉमिनी जोड़ें', 'نیا نامزد شامل کریں', 'Register New Nominee')}
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
              {/* Full Name */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('नॉमिनी का पूरा नाम *', 'مکمل نام *', 'Nominee Full Name *')}
                </Text>
                <TextInput
                  value={nomineeName}
                  onChangeText={setNomineeName}
                  placeholder={tr('उदा. फातिमा खान', 'مثلاً فاطمہ خان', 'e.g. Fatima Khan')}
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

              {/* Relationship options */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
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
                        style={{
                          backgroundColor: isSelected ? '#10b981' : isDark ? '#0f172a' : '#f1f5f9',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isSelected ? '#10b981' : border,
                        }}
                      >
                        <Text style={{ color: isSelected ? '#ffffff' : textPrimary, fontSize: 12, fontWeight: '700' }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Phone & Share % */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('मोबाइल नंबर *', 'موبائل نمبر *', 'Mobile Number *')}
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="9876543210"
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

                <View style={{ width: 100 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('हिस्सा %', 'حصہ %', 'Share %')}
                  </Text>
                  <TextInput
                    value={sharePercentage}
                    onChangeText={setSharePercentage}
                    keyboardType="numeric"
                    placeholder="100"
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
              </View>

              {/* Aadhaar & Age */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('आधार संख्या (वैकल्पिक)', 'آدھار نمبر', 'Aadhaar / Govt ID')}
                  </Text>
                  <TextInput
                    value={aadhaarNumber}
                    onChangeText={(val) => setAadhaarNumber(val.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    maxLength={12}
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

                <View style={{ width: 90 }}>
                  <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                    {tr('आयु (वर्ष)', 'عمر', 'Age')}
                  </Text>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="25"
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
              </View>

              {/* Address */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('नॉमिनी का पता', 'پتہ', 'Nominee Address')}
                </Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                  placeholder={tr('पता दर्ज करें...', 'پتہ درج کریں...', 'Enter house, street, city...')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: textPrimary,
                    fontSize: 13,
                    minHeight: 50,
                  }}
                />
              </View>

              {/* Photo / ID proof picker */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>
                  {tr('पहचान पत्र की फोटो (वैकल्पिक)', 'شناختی ثبوت کی تصویر', 'ID Proof Photo (Optional)')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMediaPicker(true)}
                  style={{
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: idProofUri ? '#10b981' : border,
                    borderRadius: 12,
                    padding: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  }}
                >
                  {idProofUri ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Image source={{ uri: idProofUri }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                      <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700' }}>
                        {tr('दस्तावेज़ चुना गया (बदलने के लिए क्लिक करें)', 'دستاویز منتخب', 'Document Selected (Tap to change)')}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Camera size={18} color="#10b981" />
                      <Text style={{ color: textSecondary, fontSize: 13, fontWeight: '600' }}>
                        {tr('आधार या पहचान पत्र चुनें', 'تصویر منتخب کریں', 'Choose Aadhaar / Photo ID')}
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
                    backgroundColor: '#10b981',
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
                    {editingNominee
                      ? tr('अपडेट सहेजें', 'اپ ڈیٹ محفوظ کریں', 'Save Updates')
                      : tr('नॉमिनी सुरक्षित करें', 'نامزد محفوظ کریں', 'Save Nominee')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker source modal */}
      <Modal visible={showMediaPicker} transparent animationType="fade" onRequestClose={() => setShowMediaPicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMediaPicker(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={{ width: '85%', backgroundColor: cardBg, borderRadius: 20, padding: 20, gap: 14 }}>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
              {tr('दस्तावेज़ अपलोड करें', 'دستاویز اپ لوڈ کریں', 'Upload ID Document')}
            </Text>
            <TouchableOpacity
              onPress={() => handlePickMedia('camera')}
              style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center' }}
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
              {tr('नॉमिनी हटाएं?', 'نامزد حذف کریں؟', 'Delete Nominee?')}
            </Text>
            <Text style={{ fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20, color: textSecondary }}>
              {tr('क्या आप वाकई इस नॉमिनी को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।', 'کیا آپ واقعی اس نامزد کو ہٹانا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا۔', 'Are you sure you want to remove this nominee? This action cannot be undone.')}
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
