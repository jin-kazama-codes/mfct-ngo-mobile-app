import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from '../../../src/context/AppStateProvider';
import { AccountDetails } from '../../../src/types';
import {
  getAccountDetails,
  createAccountDetails,
  updateAccountDetails,
  deleteAccountDetails,
} from '../../../src/services/adminService';
import { uploadImageToSupabase } from '../../../src/services/storageService';
import { getLanguageCode } from '../../../src/lib/translateEntity';
import { AccountDetailsSkeleton } from '../../../src/components/SkeletonLoader';
import {
  Building2,
  Building,
  Hash,
  Code,
  Smartphone,
  QrCode,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  X,
  Lock,
  Save,
} from 'lucide-react-native';

export default function AccountDetailsScreen() {
  const { activeUser, currentRole } = useAppState();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  // Role security check: Only Super Admin and Executive Admin
  const userRole = (activeUser?.role || currentRole || '').toString().toLowerCase();
  const isAuthorized = userRole === 'super_admin' || userRole === 'executive_admin';

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create'>('list');
  const [accountDetails, setAccountDetails] = useState<AccountDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  // Form State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeFileName, setQrCodeFileName] = useState('');

  // Media picker modal & Fallback
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  // Feedback & Modal state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchAccountDetails();
    } else {
      setLoading(false);
    }
  }, [isAuthorized]);

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
      const data = await getAccountDetails();
      setAccountDetails(data || []);
    } catch (err) {
      console.error('Failed to fetch account details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (details: AccountDetails) => {
    setCurrentEditId(details.id);
    setBankName(details.bank_name || '');
    setAccountNumber(details.account_number || '');
    setIfscCode(details.ifsc_code || '');
    setUpiId(details.upi_id || '');
    setQrCodeUrl(details.qr_code_url || '');
    setQrCodeFileName(details.qr_code_url ? 'qr_code_image.jpg' : '');
    setActiveSubTab('create');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancel = () => {
    setCurrentEditId(null);
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
    setQrCodeUrl('');
    setQrCodeFileName('');
    setShowUrlFallback(false);
    setErrorMsg('');
  };

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    setShowMediaPicker(false);
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to snap QR code.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setQrCodeUrl(asset.uri);
          setQrCodeFileName(asset.fileName || `qr_${Date.now()}.jpg`);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is required to choose QR code image.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setQrCodeUrl(asset.uri);
          setQrCodeFileName(asset.fileName || `qr_${Date.now()}.jpg`);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('Error', 'Unable to pick image on this device.');
    }
  };

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !upiId.trim()) {
      setErrorMsg(
        tr(
          'कृपया सभी आवश्यक फ़ील्ड भरें और एक क्यूआर कोड अपलोड करें',
          'براہ کرم تمام مطلوبہ فیلڈز کو پُر کریں اور ایک QR کوڈ اپ لوڈ کریں',
          'Please fill out all required fields and upload a QR Code'
        )
      );
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const finalQrCodeUrl = qrCodeUrl.trim()
        ? await uploadImageToSupabase(qrCodeUrl.trim(), 'receipts')
        : '';

      if (currentEditId) {
        await updateAccountDetails({
          id: currentEditId,
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim(),
          upi_id: upiId.trim(),
          qr_code_url: finalQrCodeUrl || qrCodeUrl.trim() || undefined,
        });
        setSuccessMsg(
          tr(
            'खाता विवरण सफलतापूर्वक अपडेट हो गया',
            'اکاؤنٹ کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں',
            'Account details updated successfully'
          )
        );
      } else {
        await createAccountDetails({
          bank_name: bankName.trim(),
          account_number: accountNumber.trim(),
          ifsc_code: ifscCode.trim(),
          upi_id: upiId.trim(),
          qr_code_url: finalQrCodeUrl || qrCodeUrl.trim() || '',
        });
        setSuccessMsg(
          tr(
            'खाता विवरण सफलतापूर्वक सुरक्षित हो गया',
            'اکاؤنٹ کی تفصیلات کامیابی سے شامل ہو گئیں',
            'Account details created successfully'
          )
        );
      }

      handleCancel();
      setActiveSubTab('list');
      fetchAccountDetails();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          tr(
            'खाता विवरण सुरक्षित करने में विफल',
            'اکاؤنٹ کی تفصیلات محفوظ کرنے میں ناکام',
            'Failed to save account details'
          )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      await deleteAccountDetails(deleteConfirmId);
      setDeleteConfirmId(null);
      setSuccessMsg(
        tr(
          'सफलतापूर्वक हटा दिया गया',
          'کامیابی سے حذف ہو گیا',
          'Deleted successfully'
        )
      );
      fetchAccountDetails();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || tr('हटाने में विफल', 'حذف کرنے میں ناکام', 'Failed to delete')
      );
    } finally {
      setDeletingId(null);
    }
  };

  // If user is not Super Admin or Executive Admin
  if (!isAuthorized) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <View className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl items-center shadow-sm">
          <View className="w-16 h-16 rounded-full bg-rose-500/10 items-center justify-center mb-4">
            <Lock color="#ef4444" size={32} />
          </View>
          <Text className="text-lg font-black text-slate-900 dark:text-white mb-2">
            {tr('एक्सेस प्रतिबंधित', 'رسائی ممانعت', 'Access Restricted')}
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center leading-5">
            {tr(
              'यह सुविधा केवल मुख्य प्रशासक (Executive Admin) और सुपर एडमिन के लिए उपलब्ध है।',
              'یہ خصوصیت صرف ایگزیکٹو ایڈمن اور سپر ایڈمن کے لیے دستیاب ہے۔',
              'This feature is restricted to Executive Admins and Super Admins.'
            )}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <AccountDetailsSkeleton isDark={isDark} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* ── Sub-Tab Navigation Bar (Consistent with Campaigns/Communities/Gallery) ── */}
      <View className="flex-row p-2 gap-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => setActiveSubTab('list')}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
            activeSubTab === 'list' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
          }`}
          activeOpacity={0.8}
        >
          <Building2 color={activeSubTab === 'list' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-[13px] font-bold ${activeSubTab === 'list' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {tr('खाता सूची', 'اکاؤنٹس کی فہرست', 'Accounts')} ({accountDetails.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (activeSubTab !== 'create') {
              handleCancel();
            }
            setActiveSubTab('create');
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center gap-1.5 ${
            activeSubTab === 'create' ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
          }`}
          activeOpacity={0.8}
        >
          <Plus color={activeSubTab === 'create' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} size={15} />
          <Text className={`text-[13px] font-bold ${activeSubTab === 'create' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            {currentEditId ? tr('संपादित करें', 'ترمیم کریں', 'Edit Account') : tr('नया खाता जोड़ें', 'نیا اکاؤنٹ شامل کریں', 'Add Account')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        {/* Alerts */}
        {errorMsg !== '' && (
          <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 rounded-xl mb-4 gap-2.5">
            <AlertCircle color="#ef4444" size={18} />
            <Text className="text-xs font-bold text-rose-600 dark:text-rose-400 flex-1">{errorMsg}</Text>
          </View>
        )}

        {successMsg !== '' && (
          <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3.5 rounded-xl mb-4 gap-2.5">
            <CheckCircle2 color="#10b981" size={18} />
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-1">{successMsg}</Text>
          </View>
        )}

        {/* ── CREATE / EDIT FORM ── */}
        {activeSubTab === 'create' ? (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mb-6">
            <View className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <Text className="text-base font-extrabold text-slate-900 dark:text-white">
                {currentEditId
                  ? tr('खाता विवरण संपादित करें', 'اکاؤنٹ کی تفصیلات میں ترمیم کریں', 'Edit Account Details')
                  : tr('खाता विवरण जोड़ें', 'اکاؤنٹ की تفصیلات شامل کریں', 'Add Account Details')}
              </Text>
            </View>

            <View className="p-4 gap-4">
              {/* 1. Bank Name */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr('बैंक का नाम *', 'بینک کا नाम *', 'Bank Name *')}
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                  <Building color={isDark ? '#94a3b8' : '#64748b'} size={18} className="mr-2" />
                  <TextInput
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-900 dark:text-white"
                    placeholder={tr('उदा. स्टेट बैंक ऑफ इंडिया', 'مثلاً اسٹیٹ بینک آف انڈیا', 'e.g. State Bank of India')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={bankName}
                    onChangeText={setBankName}
                  />
                </View>
              </View>

              {/* 2. Account Number */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr('खाता संख्या *', 'اکاؤنٹ نمبر *', 'Account Number *')}
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                  <Hash color={isDark ? '#94a3b8' : '#64748b'} size={18} className="mr-2" />
                  <TextInput
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-900 dark:text-white"
                    placeholder={tr('खाता संख्या दर्ज करें', 'اکاؤنٹ نمبر درج کریں', 'Enter Account Number')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>
              </View>

              {/* 3. IFSC Code */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr('आईएफएससी कोड *', 'IFSC کوڈ *', 'IFSC Code *')}
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                  <Code color={isDark ? '#94a3b8' : '#64748b'} size={18} className="mr-2" />
                  <TextInput
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-900 dark:text-white uppercase"
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    autoCapitalize="characters"
                    value={ifscCode}
                    onChangeText={setIfscCode}
                  />
                </View>
              </View>

              {/* 4. UPI ID */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr('यूपीआई आईडी *', 'UPI شناخت *', 'UPI ID *')}
                </Text>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3">
                  <Smartphone color={isDark ? '#94a3b8' : '#64748b'} size={18} className="mr-2" />
                  <TextInput
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-900 dark:text-white"
                    placeholder="e.g. ngo@okbank"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    autoCapitalize="none"
                    value={upiId}
                    onChangeText={setUpiId}
                  />
                </View>
              </View>

              {/* 5. QR Code Image Picker */}
              <View className="gap-1.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr('क्यूआर कोड छवि *', 'QR کوڈ کی تصویر *', 'QR Code Image *')}
                </Text>

                {qrCodeUrl ? (
                  <View className="flex-row items-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-2.5 rounded-xl gap-3">
                    <Image source={{ uri: qrCodeUrl }} className="w-12 h-12 rounded-lg bg-white" resizeMode="contain" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                        {qrCodeFileName || 'QR Code Attached'}
                      </Text>
                      <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">✓ Ready for payment scan</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowMediaPicker(true)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                      <Camera color="#10b981" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setQrCodeUrl('');
                        setQrCodeFileName('');
                      }}
                      className="p-2"
                    >
                      <X color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowMediaPicker(true)}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <View className="w-11 h-11 rounded-full bg-emerald-500/10 items-center justify-center mb-2">
                      <Upload color="#10b981" size={20} />
                    </View>
                    <Text className="text-xs font-bold text-slate-900 dark:text-white">
                      {tr('क्यूआर कोड अपलोड करें', 'QR کوڈ اپ لوڈ کریں', 'Upload QR Code')}
                    </Text>
                    <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {tr('फोटो खींचें या गैलरी से चुनें', 'تصویر لیں یا گیلری سے منتخب کریں', 'Take photo or choose from gallery')}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Optional URL Toggle */}
                <TouchableOpacity
                  onPress={() => setShowUrlFallback(!showUrlFallback)}
                  className="mt-1"
                >
                  <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {showUrlFallback ? '▲ Hide Direct Image URL' : '▼ Or enter direct QR Image URL'}
                  </Text>
                </TouchableOpacity>

                {showUrlFallback && (
                  <View className="mt-2">
                    <TextInput
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                      placeholder="https://..."
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={qrCodeUrl}
                      onChangeText={(txt) => {
                        setQrCodeUrl(txt);
                        setQrCodeFileName('qr_direct_url.jpg');
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Form Buttons */}
              <View className="flex-row justify-end gap-2.5 mt-2">
                <TouchableOpacity
                  onPress={() => {
                    handleCancel();
                    setActiveSubTab('list');
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  disabled={saving}
                >
                  <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  className={`flex-row items-center bg-emerald-600 active:bg-emerald-700 px-4 py-2.5 rounded-xl gap-1.5 shadow-sm ${saving ? 'opacity-60' : ''}`}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Save color="#ffffff" size={16} />
                      <Text className="text-xs font-extrabold text-white">
                        {tr('विवरण सुरक्षित करें', 'تفصیلات محفوظ کریں', 'Save Details')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ── DISPLAY ACCOUNTS LIST ── */
          <View className="gap-4">
            {accountDetails.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-3xl p-8 items-center">
                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-3">
                  <Building2 color={isDark ? '#64748b' : '#94a3b8'} size={34} />
                </View>
                <Text className="text-base font-black text-slate-900 dark:text-white mb-1">
                  {tr('कोई खाता विवरण नहीं', 'کوئی اکاؤنٹ تفصیلات नहीं', 'No Account Details')}
                </Text>
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center leading-5 mb-5 max-w-xs">
                  {tr(
                    'सदस्यों को सीधे संगठन में सुरक्षित रूप से दान स्थानांतरित करने की अनुमति देने के लिए बैंक खाता और यूपीआई विवरण जोड़ें।',
                    'ممبران کو براہ راست تنظیم کو محفوظ طریقے سے عطیات منتقل کرنے کی اجازت دینے کے لیے بینک اکاؤنٹ اور UPI تفصیلات شامل کریں۔',
                    'Add bank account and UPI details to allow members to securely transfer donations directly to the organisation.'
                  )}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleCancel();
                    setActiveSubTab('create');
                  }}
                  className="flex-row items-center bg-emerald-600 active:bg-emerald-700 px-4 py-2.5 rounded-xl gap-1.5 shadow-sm"
                  activeOpacity={0.8}
                >
                  <Plus color="#ffffff" size={16} />
                  <Text className="text-xs font-bold text-white">
                    {tr('खाता विवरण जोड़ें', 'اکاؤنٹ کی تفصیلات شامل کریں', 'Add Account Details')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              accountDetails.map((item) => (
                <View
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-2"
                >
                  {/* Card Header */}
                  <View className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center shadow-md">
                        <Building color="#ffffff" size={20} />
                      </View>
                      <View>
                        <Text className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {item.bank_name}
                        </Text>
                        <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {tr('आधिकारिक बैंक खाता', 'سرکاری بینک اکاؤنٹ', 'Official Bank Account')}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                      >
                        <Edit2 color="#10b981" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDeleteConfirmId(item.id)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl"
                      >
                        <Trash2 color="#ef4444" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View className="p-4 gap-3">
                    <View className="flex-row gap-3">
                      <View className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-row items-center">
                          <Hash size={11} color={isDark ? '#94a3b8' : '#64748b'} /> {tr('खाता संख्या', 'اکاؤنٹ نمبر', 'Account Number')}
                        </Text>
                        <Text className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wider mt-1">
                          {item.account_number}
                        </Text>
                      </View>

                      <View className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-row items-center">
                          <Code size={11} color={isDark ? '#94a3b8' : '#64748b'} /> {tr('आईएफएससी कोड', 'IFSC کوڈ', 'IFSC Code')}
                        </Text>
                        <Text className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wider mt-1">
                          {item.ifsc_code}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 p-3 rounded-2xl">
                      <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex-row items-center">
                        <Smartphone size={12} color="#10b981" /> {tr('यूपीआई आईडी', 'UPI شناخت', 'UPI ID')}
                      </Text>
                      <Text className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wide mt-1">
                        {item.upi_id}
                      </Text>
                    </View>

                    {item.qr_code_url ? (
                      <View className="items-center bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mt-1">
                        <View className="w-32 h-32 bg-white rounded-xl p-2 shadow-xs mb-2">
                          <Image source={{ uri: item.qr_code_url }} className="w-full h-full" resizeMode="contain" />
                        </View>
                        <View className="flex-row items-center gap-1">
                          <QrCode size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            {tr('भुगतान के लिए स्कैन करें', 'ادائیگی کے لیے اسکین کریں', 'Scan to Pay')}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── MEDIA PICKER MODAL (Camera or Gallery) ── */}
      <Modal
        visible={showMediaPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMediaPicker(false)}
      >
        <View className="flex-1 justify-center items-center p-5 bg-black/70">
          <View className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Select QR Code Image</Text>
              <TouchableOpacity onPress={() => setShowMediaPicker(false)}>
                <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handlePickMedia('camera')}
                className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl items-center gap-2"
              >
                <Camera color="#10b981" size={26} />
                <Text className="text-xs font-bold text-slate-900 dark:text-white">Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePickMedia('gallery')}
                className="flex-1 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl items-center gap-2"
              >
                <Upload color="#10b981" size={26} />
                <Text className="text-xs font-bold text-slate-900 dark:text-white">From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal
        visible={!!deleteConfirmId}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmId(null)}
      >
        <View className="flex-1 justify-center items-center p-5 bg-black/70">
          <View className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 items-center">
            <View className="w-14 h-14 rounded-full bg-rose-500/10 items-center justify-center mb-3">
              <Trash2 color="#ef4444" size={28} />
            </View>

            <Text className="text-base font-black text-slate-900 dark:text-white mb-1">
              {tr('खाता विवरण हटाएं?', 'اکاؤنٹ کی تفصیل حذف کریں؟', 'Delete Account Detail?')}
            </Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400 text-center leading-5 mb-5">
              {tr(
                'क्या आप वाकई इस खाता विवरण को हटाना चाहते हैं?',
                'کیا آپ واقعی اس اکاؤنٹ کی تفصیل کو حذف کرنا چاہتے ہیں؟',
                'Are you sure you want to delete this bank account detail?'
              )}
            </Text>

            <View className="flex-row gap-2.5 w-full">
              <TouchableOpacity
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl items-center"
                onPress={() => setDeleteConfirmId(null)}
                disabled={deletingId !== null}
              >
                <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-rose-600 active:bg-rose-700 py-3 rounded-xl items-center"
                onPress={handleConfirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-xs font-extrabold text-white">
                    {tr('हटाएं', 'حذف کریں', 'Delete')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
