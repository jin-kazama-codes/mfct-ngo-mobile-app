import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Clock,
  Upload,
  CheckCircle2,
  FileText,
  CreditCard,
  Camera,
  Image as ImageIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { User } from '../types';
import { updateUser } from '../services/userService';
import { uploadImageToSupabase } from '../services/storageService';
import { useAppState } from '../context/AppStateProvider';
import { getLanguageCode } from '../lib/translateEntity';

interface KycUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  user?: User | null;
  onUpdated?: (updatedUser: User) => void;
}

export const KycUpdateModal: React.FC<KycUpdateModalProps> = ({
  visible,
  onClose,
  user,
  onUpdated,
}) => {
  const { colorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const isDark = colorScheme === 'dark';
  const { activeUser, handleUpdateActiveUser } = useAppState();

  const currentUser = user || activeUser;

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const isApproved = currentUser?.status === 'approved' || (currentUser?.isVerified && currentUser?.status !== 'reject' && currentUser?.status !== 'rejected');
  const isRejected = currentUser?.status === 'reject' || currentUser?.status === 'rejected';
  const isPending = currentUser?.status === 'pending' || (!isApproved && !isRejected);
  const reason = currentUser?.rejectionReason || currentUser?.rejection_reason;

  // Form states
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [state, setState] = useState(currentUser?.state || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [avatarUri, setAvatarUri] = useState(currentUser?.avatar || '');
  const [showDocs, setShowDocs] = useState(false);
  const [paymentUtr, setPaymentUtr] = useState(currentUser?.paymentUtr || '');

  // Document URIs
  const [aadhaarFrontUri, setAadhaarFrontUri] = useState(currentUser?.aadhaarFrontUrl || currentUser?.documentUrl || '');
  const [aadhaarBackUri, setAadhaarBackUri] = useState(currentUser?.aadhaarBackUrl || '');
  const [paymentReceiptUri, setPaymentReceiptUri] = useState(currentUser?.paymentScreenshotUrl || '');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'avatar' | 'front' | 'back' | 'receipt' | null>(null);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name && currentUser.name !== 'No User' ? currentUser.name : '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || (currentUser as any).district || '');
      setState(currentUser.state || '');
      setAddress(currentUser.address || '');
      setAvatarUri(currentUser.avatar || '');
      setPaymentUtr(currentUser.paymentUtr || '');
      setAadhaarFrontUri(currentUser.aadhaarFrontUrl || currentUser.documentUrl || '');
      setAadhaarBackUri(currentUser.aadhaarBackUrl || '');
      setPaymentReceiptUri(currentUser.paymentScreenshotUrl || '');
    }
  }, [currentUser, visible]);

  const resolveImageUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset?.uri) {
      return asset.uri;
    }
    return '';
  };

  const openMediaPicker = (field: 'avatar' | 'front' | 'back' | 'receipt') => {
    setMediaPickerTarget(field);
  };

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    const target = mediaPickerTarget;
    setMediaPickerTarget(null);
    if (!target) return;

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            tr('अनुमति आवश्यक', 'اجازت درکار ہے', 'Permission Needed'),
            tr('फोटो लेने के लिए कैमरे की अनुमति आवश्यक है।', 'تصویر لینے کے لیے کیمرے کی اجازت درکار ہے۔', 'Camera permission is required to take photo.')
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: target === 'avatar',
          aspect: target === 'avatar' ? [1, 1] : undefined,
          quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const finalUri = await resolveImageUri(asset);

          if (target === 'avatar') setAvatarUri(finalUri);
          else if (target === 'front') setAadhaarFrontUri(finalUri);
          else if (target === 'back') setAadhaarBackUri(finalUri);
          else if (target === 'receipt') setPaymentReceiptUri(finalUri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            tr('अनुमति आवश्यक', 'اجازت درکار है', 'Permission Needed'),
            tr('गैलरी से चयन के लिए अनुमति आवश्यक है।', 'گیلری سے انتخاب کے لیے اجازت درکار ہے۔', 'Gallery permission is required to select photos.')
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: target === 'avatar',
          aspect: target === 'avatar' ? [1, 1] : undefined,
          quality: target === 'avatar' ? 0.6 : 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const finalUri = await resolveImageUri(asset);

          if (target === 'avatar') setAvatarUri(finalUri);
          else if (target === 'front') setAadhaarFrontUri(finalUri);
          else if (target === 'back') setAadhaarBackUri(finalUri);
          else if (target === 'receipt') setPaymentReceiptUri(finalUri);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!fullName.trim()) {
      setErrorMsg(tr('कृपया पूरा नाम दर्ज करें।', 'براہ کرم پورا نام درج کریں۔', 'Please enter full name.'));
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(tr('कृपया मोबाइल नंबर दर्ज करें।', 'براہ کرم موبائل نمبر درج کریں۔', 'Please enter phone number.'));
      return;
    }

    setSubmitting(true);
    try {
      const [upAvatar, upFront, upBack, upReceipt] = await Promise.all([
        avatarUri ? uploadImageToSupabase(avatarUri, 'users') : Promise.resolve(''),
        aadhaarFrontUri ? uploadImageToSupabase(aadhaarFrontUri, 'kyc') : Promise.resolve(''),
        aadhaarBackUri ? uploadImageToSupabase(aadhaarBackUri, 'kyc') : Promise.resolve(''),
        paymentReceiptUri ? uploadImageToSupabase(paymentReceiptUri, 'receipts') : Promise.resolve(''),
      ]);

      const payload: Partial<User> = {
        name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        address: address.trim(),
        avatar: upAvatar || avatarUri || undefined,
      };

      if (isRejected) {
        payload.status = 'pending';
        payload.rejectionReason = '';
        payload.aadhaarFrontUrl = upFront || aadhaarFrontUri || undefined;
        payload.aadhaarBackUrl = upBack || aadhaarBackUri || undefined;
        payload.paymentScreenshotUrl = upReceipt || paymentReceiptUri || undefined;
        payload.documentUrl = upFront || aadhaarFrontUri || undefined;
        payload.paymentUtr = paymentUtr.trim() || undefined;
      } else if (isPending) {
        payload.status = 'pending';
        if (upFront || aadhaarFrontUri) payload.aadhaarFrontUrl = upFront || aadhaarFrontUri;
        if (upBack || aadhaarBackUri) payload.aadhaarBackUrl = upBack || aadhaarBackUri;
        if (upReceipt || paymentReceiptUri) payload.paymentScreenshotUrl = upReceipt || paymentReceiptUri;
        if (paymentUtr.trim()) payload.paymentUtr = paymentUtr.trim();
      }

      const updated = await updateUser(currentUser.id, payload);

      const updatedUserObj: User = {
        ...currentUser,
        ...updated,
        ...payload,
        ...(isApproved
          ? { status: 'approved', isVerified: true }
          : { status: 'pending', isVerified: false, rejectionReason: '' }),
      };

      if (handleUpdateActiveUser) {
        await handleUpdateActiveUser(updatedUserObj);
      }

      if (onUpdated) {
        onUpdated(updatedUserObj);
      }

      Alert.alert(
        tr('सफलता', 'کامیابی', 'Success'),
        isApproved
          ? tr('प्रोफ़ाइल सफलतापूर्वक अपडेट कर दी गई है!', 'پروفائل اپ ڈیٹ ہو گئی۔', 'Profile updated successfully!')
          : tr(
            'विवरण सफलतापूर्वक अपडेट कर दिया गया है! सत्यापन समीक्षाधीन है।',
            'تفصیلات اپ ڈیٹ ہو گئیں۔',
            'Details updated successfully! Under admin review.'
          ),
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (err: any) {
      console.error('Failed to update KYC/Profile in mobile:', err);
      setErrorMsg(err?.message || 'Failed to update details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !currentUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)' }]}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                {isApproved ? (
                  <UserIcon color="#10b981" size={20} />
                ) : (
                  <ShieldCheck color="#10b981" size={20} />
                )}
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {isApproved
                    ? tr('प्रोफ़ाइल विवरण संपादित करें', 'پروفائل تبدیل کریں', 'Edit Profile')
                    : tr('केवाईसी विवरण अपडेट करें', 'کے وائی سی اپ ڈیٹ کریں', 'Update KYC Details')}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                  {currentUser.membershipId ? `ID: ${currentUser.membershipId}` : (currentUser.email || currentUser.name)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Status Alert Banner */}
            {isRejected && (
              <View style={styles.rejectAlertBox}>
                <AlertCircle color="#ef4444" size={18} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectAlertTitle}>
                    {tr('केवाईसी अस्वीकार किया गया', 'کے وائی سی مسترد', 'KYC Application Rejected')}
                  </Text>
                  {reason ? (
                    <View style={styles.reasonCard}>
                      <Text style={styles.reasonLabel}>
                        {tr('कारण:', 'وجہ:', 'Reason:')}{' '}
                        <Text style={{ fontWeight: '500', color: '#334155' }}>{reason}</Text>
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.rejectAlertSub}>
                    {tr(
                      'कृपया सही विवरण व दस्तावेज़ पुनः अपलोड करें।',
                      'براہ کرم درست معلومات اور دستاویزات اپلوڈ کریں۔',
                      'Please update corrected information & documents below.'
                    )}
                  </Text>
                </View>
              </View>
            )}

            {isPending && (
              <View style={styles.pendingAlertBox}>
                <Clock color="#f59e0b" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingAlertTitle}>
                    {tr('केवाईसी समीक्षाधीन है', 'کے وائی سی زیر جائزہ ہے', 'KYC Status: Pending Review')}
                  </Text>
                  <Text style={styles.pendingAlertSub}>
                    {tr(
                      'आप अपनी जानकारी नीचे सुधार सकते हैं।',
                      'آپ اپنی معلومات درست کر سکتے ہیں۔',
                      'You can review or update your details below before final approval.'
                    )}
                  </Text>
                </View>
              </View>
            )}

            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#ef4444" size={14} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Basic Info */}
            <Text style={[styles.sectionLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {tr('व्यक्तिगत विवरण', 'ذاتی تفصیلات', 'Personal Information')}
            </Text>

            {/* Profile Picture Upload Card */}
            <View
              style={[
                styles.avatarCard,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                },
              ]}
            >
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image key={avatarUri} source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <UserIcon color="#94a3b8" size={32} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '700' }]}>
                  {tr('प्रोफ़ाइल फ़ोटो', 'پروفائل تصویر', 'Profile Photo')}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6 }}>
                  {tr('JPG, PNG स्वीकार्य', 'JPG، PNG قابل قبول', 'JPG or PNG format')}
                </Text>
                <TouchableOpacity
                  style={[styles.pickBtn, { alignSelf: 'flex-start', paddingHorizontal: 12 }]}
                  onPress={() => openMediaPicker('avatar')}
                  activeOpacity={0.8}
                >
                  <Camera color="#10b981" size={14} />
                  <Text style={styles.pickBtnText}>
                    {avatarUri ? tr('फ़ोटो बदलें', 'تصویر تبدیل کریں', 'Change Photo') : tr('फ़ोटो चुनें', 'تصویر منتخب کریں', 'Select Photo')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('पूरा नाम *', 'پورا نام *', 'Full Name *')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('ईमेल पता', 'ای میل پتہ', 'Email Address')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('मोबाइल नंबर *', 'موبائل نمبر *', 'Phone Number *')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Enter phone number"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* City and State */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                  {tr('शहर / जिला', 'شہر', 'City / District')}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                  {tr('राज्य', 'ریاست', 'State')}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('पूरा पता', 'مکمل پتہ', 'Full Address')}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full address"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Document and Payment Section */}
            {isPending && (
              <TouchableOpacity
                onPress={() => setShowDocs(!showDocs)}
                style={[
                  styles.toggleDocsBtn,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f0fdf4',
                    borderColor: isDark ? '#10b98150' : '#86efac',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.toggleDocsText}>
                  {showDocs
                    ? tr('दस्तावेज़ छुपाएं ▲', 'دستاویزات چھپائیں ▲', 'Hide ID Documents ▲')
                    : tr('दस्तावेज़ या रसीद भी बदलें (वैकल्पिक) ▼', 'دستاویزات یا رسید تبدیل کریں (اختیاری) ▼', 'Update ID Documents / Receipt (Optional) ▼')}
                </Text>
              </TouchableOpacity>
            )}

            {(isRejected || (isPending && showDocs)) && (
              <View style={{ marginTop: 10 }}>
                {/* Document Uploads */}
                <Text style={[styles.sectionLabel, { color: isDark ? '#f8fafc' : '#0f172a', marginTop: 10 }]}>
                  {tr('आधार कार्ड / पहचान प्रमाण', 'شناختی دستاویز', 'ID Proof / Aadhaar Photos')}
                </Text>

                {/* Aadhaar Front */}
                <View style={styles.uploadCard}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '700' }]}>
                    {tr('आधार कार्ड (सामने का भाग)', 'آدھار کارڈ (سامنے کا حصہ)', 'Aadhaar Card (Front)')}
                  </Text>
                  {aadhaarFrontUri ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: aadhaarFrontUri }} style={styles.previewImg} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[styles.noImgBox, { borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                      <FileText color="#94a3b8" size={24} />
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No front image</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => openMediaPicker('front')}
                    activeOpacity={0.8}
                  >
                    <Upload color="#10b981" size={14} />
                    <Text style={styles.pickBtnText}>
                      {aadhaarFrontUri ? tr('फ़ोटो बदलें', 'تبدیل کریں', 'Replace Front Photo') : tr('फ़ोटो चुनें', 'منتخب کریں', 'Select Front Photo')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Aadhaar Back */}
                <View style={styles.uploadCard}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '700' }]}>
                    {tr('आधार कार्ड (पीछे का भाग)', 'آدھار کارڈ (پیچھے کا حصہ)', 'Aadhaar Card (Back)')}
                  </Text>
                  {aadhaarBackUri ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: aadhaarBackUri }} style={styles.previewImg} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[styles.noImgBox, { borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                      <FileText color="#94a3b8" size={24} />
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No back image</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => openMediaPicker('back')}
                    activeOpacity={0.8}
                  >
                    <Upload color="#10b981" size={14} />
                    <Text style={styles.pickBtnText}>
                      {aadhaarBackUri ? tr('फ़ोटो बदलें', 'تبدیل کریں', 'Replace Back Photo') : tr('फ़ोटो चुनें', 'منتخب کریں', 'Select Back Photo')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Details */}
                <Text style={[styles.sectionLabel, { color: isDark ? '#f8fafc' : '#0f172a', marginTop: 14 }]}>
                  {tr('भुगतान सत्यापन', 'ادائیگی کی تفصیلات', 'Payment Details')}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                    {tr('बैंक UTR / रेफ़रेंस नंबर', 'بینک UTR नंबर', 'Bank UTR / Reference')}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                      },
                    ]}
                    value={paymentUtr}
                    onChangeText={setPaymentUtr}
                    placeholder="12-digit UTR"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Payment Screenshot */}
                <View style={styles.uploadCard}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '700' }]}>
                    {tr('भुगतान रसीद / स्क्रीनशॉट', 'ادائیگی کی رسید', 'Payment Screenshot')}
                  </Text>
                  {paymentReceiptUri ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: paymentReceiptUri }} style={styles.previewImg} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[styles.noImgBox, { borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                      <CreditCard color="#94a3b8" size={24} />
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No receipt uploaded</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => openMediaPicker('receipt')}
                    activeOpacity={0.8}
                  >
                    <Upload color="#10b981" size={14} />
                    <Text style={styles.pickBtnText}>
                      {paymentReceiptUri ? tr('रसीद बदलें', 'تبدیل کریں', 'Replace Screenshot') : tr('रसीद चुनें', 'منتخب کریں', 'Select Screenshot')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#ffffff" size={16} />
                  <Text style={styles.submitBtnText}>
                    {isApproved
                      ? tr('अपडेट करें', 'اپ ڈیٹ کریں', 'Update')
                      : tr('पुनः सत्यापन हेतु भेजें', 'دوبارہ تصدیق के लिए भीजें', 'Submit for Review')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Picker Sheet Overlay (matching sign-up screen) */}
        {mediaPickerTarget !== null && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              style={styles.sheetBackdrop}
              activeOpacity={1}
              onPress={() => setMediaPickerTarget(null)}
            />
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderTopColor: isDark ? '#334155' : '#e2e8f0',
                },
              ]}
            >
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {mediaPickerTarget === 'avatar'
                    ? tr('प्रोफ़ाइल फ़ोटो चुनें', 'پروفائل تصویر منتخب کریں', 'Upload Profile Photo')
                    : mediaPickerTarget === 'front'
                      ? tr('आधार कार्ड - सामने (Front)', 'آدھار کارڈ - سامنے', 'Aadhaar Card (Front)')
                      : mediaPickerTarget === 'back'
                        ? tr('आधार कार्ड - पीछे (Back)', 'آدھار کارڈ - پیچھے', 'Aadhaar Card (Back)')
                        : tr('भुगतान स्क्रीनशॉट अपलोड करें', 'ادائیگی کی رسید اپلوڈ کریں', 'Upload Payment Screenshot')}
                </Text>
                <TouchableOpacity
                  onPress={() => setMediaPickerTarget(null)}
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                >
                  <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerOptionsRow}>
                {/* Option 1: Camera */}
                <TouchableOpacity
                  style={[
                    styles.pickerOptionCard,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                  onPress={() => handlePickMedia('camera')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconCircle,
                      { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' },
                    ]}
                  >
                    <Camera color="#059669" size={24} />
                  </View>
                  <Text style={[styles.optionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {tr('कैमरा का उपयोग करें', 'کیمرا استعمال کریں', 'Use Camera')}
                  </Text>
                  <Text style={[styles.optionSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {tr('नई तस्वीर लें', 'نئی تصویر لیں', 'Take a new photo')}
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Gallery */}
                <TouchableOpacity
                  style={[
                    styles.pickerOptionCard,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                  onPress={() => handlePickMedia('gallery')}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconCircle,
                      { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' },
                    ]}
                  >
                    <ImageIcon color="#2563eb" size={24} />
                  </View>
                  <Text style={[styles.optionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {tr('गैलरी से चुनें', 'گیلری سے منتخب کریں', 'Choose from Gallery')}
                  </Text>
                  <Text style={[styles.optionSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {tr('फ़ाइल / छवि चुनें', 'فائل / تصویر منتخب کریں', 'Select file / image')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setMediaPickerTarget(null)}
                style={[styles.sheetCancelBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              >
                <Text style={[styles.sheetCancelBtnText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#0f172a20',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  toggleDocsBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  toggleDocsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: Dimensions.get('window').height * 0.88,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  rejectAlertBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 14,
  },
  rejectAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  reasonCard: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 4,
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  rejectAlertSub: {
    fontSize: 11,
    color: '#b91c1c',
    marginTop: 2,
  },
  pendingAlertBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  pendingAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  pendingAlertSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  previewContainer: {
    height: 140,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  noImgBox: {
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#10b98115',
    borderWidth: 1,
    borderColor: '#10b98135',
  },
  pickBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Media Picker Bottom Sheet (matching sign-up)
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 20,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerOptionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sheetCancelBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
