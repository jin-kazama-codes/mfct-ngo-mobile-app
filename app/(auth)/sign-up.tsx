import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
    Image, Modal, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAppState } from '../../src/context/AppStateProvider';
import { Community, User } from '../../src/types';
import { getCommunities } from '../../src/services/communityService';
import { createUser } from '../../src/services/userService';
import { hashPassword } from '../../src/lib/auth';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
    Sparkles, ArrowLeft, ArrowRight, UserCheck, Eye, EyeOff,
    Upload, QrCode, ChevronDown, Check, Copy, Camera, Image as ImageIcon,
    Trash2, FileText, CheckCircle2, X
} from 'lucide-react-native';

export default function SignUpScreen() {
    const { handleRegisterSession } = useAppState();
    const { colorScheme } = useColorScheme();
    const { t, i18n } = useTranslation();
    const isDark = colorScheme === 'dark';
    const isHindi = i18n.language === 'hi';

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState('');
    const [showCommunityPicker, setShowCommunityPicker] = useState(false);

    // Media upload states
    const [avatarUri, setAvatarUri] = useState<string>('');
    const [avatarFileName, setAvatarFileName] = useState<string>('');

    const [kycDocUri, setKycDocUri] = useState<string>('');
    const [kycFileName, setKycFileName] = useState<string>('');

    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
    const [utrNumber, setUtrNumber] = useState('');
    const [screenshotUri, setScreenshotUri] = useState<string>('');
    const [screenshotFileName, setScreenshotFileName] = useState<string>('');
    const [isFeePaid, setIsFeePaid] = useState(false);

    // Media picker modal
    const [pickerTarget, setPickerTarget] = useState<'avatar' | 'document' | 'screenshot' | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const [registeredUser, setRegisteredUser] = useState<User | null>(null);

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        getCommunities().then((data) => {
            setCommunities(data);
            if (data.length > 0) setSelectedCommunityId(data[0].id);
        }).catch(console.error);
    }, []);

    const activeCommunity = communities.find((c) => c.id === selectedCommunityId) || communities[0];

    const copyToClipboard = (text: string, label: string) => {
        showToast(
            isHindi ? `${label} कॉपी किया गया!` : `!کاپی ہو گیا ${label}`,
            'success'
        );
    };

    const handlePickMedia = async (source: 'camera' | 'gallery') => {
        const target = pickerTarget;
        setPickerTarget(null);
        if (!target) return;

        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        isHindi ? 'अनुमति आवश्यक' : 'اجازت درکار ہے',
                        isHindi ? 'फोटो लेने के लिए कैमरे की अनुमति आवश्यक है।' : 'تصویر لینے کے لیے کیمرے کی اجازت ضروری ہے۔'
                    );
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    allowsEditing: target === 'avatar',
                    aspect: target === 'avatar' ? [1, 1] : undefined,
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    const defaultName = target === 'avatar' ? 'profile_photo.jpg' : target === 'document' ? 'identity_document.jpg' : 'payment_receipt.jpg';
                    const fname = asset.fileName || defaultName;

                    if (target === 'avatar') {
                        setAvatarUri(asset.uri);
                        setAvatarFileName(fname);
                        showToast(isHindi ? 'प्रोफ़ाइल फ़ोटो कैप्चर की गई!' : '!پروفائل تصویر کیپچر ہو گئی', 'success');
                    } else if (target === 'document') {
                        setKycDocUri(asset.uri);
                        setKycFileName(fname);
                        showToast(isHindi ? 'दस्तावेज कैप्चर किया गया!' : '!دستاویز کیپچر ہو گئی', 'success');
                    } else if (target === 'screenshot') {
                        setScreenshotUri(asset.uri);
                        setScreenshotFileName(fname);
                        showToast(isHindi ? 'रसीद कैप्चर की गई!' : '!رسید کیپچر ہو گئی', 'success');
                    }
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        isHindi ? 'अनुमति आवश्यक' : 'اجازت درکار ہے',
                        isHindi ? 'गैलरी से चयन के लिए अनुमति आवश्यक है।' : 'گیلری تک رسائی کی اجازت ضروری ہے۔'
                    );
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: target === 'avatar',
                    aspect: target === 'avatar' ? [1, 1] : undefined,
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    const defaultName = target === 'avatar' ? 'profile_photo.jpg' : target === 'document' ? 'identity_document.jpg' : 'payment_receipt.jpg';
                    const fname = asset.fileName || defaultName;

                    if (target === 'avatar') {
                        setAvatarUri(asset.uri);
                        setAvatarFileName(fname);
                        showToast(isHindi ? 'प्रोफ़ाइल फ़ोटो चुनी गई!' : '!پروفائل تصویر منتخب ہو گئی', 'success');
                    } else if (target === 'document') {
                        setKycDocUri(asset.uri);
                        setKycFileName(fname);
                        showToast(isHindi ? 'पहचान दस्तावेज संलग्न किया गया!' : '!شناختی دستاویز منسلک ہو گئی', 'success');
                    } else if (target === 'screenshot') {
                        setScreenshotUri(asset.uri);
                        setScreenshotFileName(fname);
                        showToast(isHindi ? 'भुगतान स्क्रीनशॉट संलग्न किया गया!' : '!ادائیگی کی رسید منسلک ہو گئی', 'success');
                    }
                }
            }
        } catch (err) {
            console.warn('Image picker error:', err);
            showToast(isHindi ? 'मीडिया खोलने में विफल।' : 'میڈیا اوپن کرنے میں ناکامی۔', 'error');
        }
    };

    const handleNextStep1 = () => {
        const missingFields: string[] = [];
        if (!fullName.trim()) missingFields.push(isHindi ? 'पूरा नाम' : 'مکمل نام');
        if (!phone.trim()) missingFields.push(isHindi ? 'मोबाइल नंबर' : 'موبائل نمبر');
        if (!password) missingFields.push(isHindi ? 'पासवर्ड' : 'پاس ورڈ');
        if (!state.trim()) missingFields.push(isHindi ? 'राज्य' : 'ریاست');
        if (!city.trim()) missingFields.push(isHindi ? 'शहर' : 'شہر');
        if (!kycDocUri) missingFields.push(isHindi ? 'पहचान दस्तावेज' : 'شناختی دستاویز');

        if (missingFields.length > 0) {
            showToast(
                isHindi
                    ? `कृपया भरें: ${missingFields.join(', ')}`
                    : `براہ کرم درج کریں: ${missingFields.join(', ')}`
            );
            return;
        }
        if (phone.trim().length < 10) {
            showToast(isHindi ? 'मोबाइल नंबर 10 अंकों का होना चाहिए।' : 'موبائل نمبر 10 ہندسوں کا ہونا چاہیے۔');
            return;
        }
        if (password.length < 6) {
            showToast(isHindi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔');
            return;
        }
        setStep(2);
    };

    const handleFinishRegistration = async () => {
        if (!activeCommunity) return;
        setSubmitting(true);
        try {
            const hashedPassword = await hashPassword(password);
            const userCity = city.trim() || 'Bareilly';

            const newMember: User = {
                id: `usr_new_${Date.now()}`,
                name: fullName.trim(),
                email: email.trim() ? email.trim().toLowerCase() : undefined,
                phone: phone.trim(),
                city: userCity,
                state: state.trim(),
                role: 'member',
                avatar: avatarUri,
                communityId: activeCommunity.id,
                communityName: activeCommunity.name,
                membershipId: `MFCT-${userCity.substring(0, 3).toUpperCase()}-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                isVerified: false,
                joinDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                passwordHash: hashedPassword,
                paymentMethod: paymentMethod,
                paymentUtr: utrNumber.trim() || undefined,
                paymentScreenshotUrl: screenshotUri || undefined,
                documentUrl: kycDocUri || undefined,
            };

            const created = await createUser({
                ...newMember,
                kycDocumentUrl: newMember.documentUrl,
            });

            setRegisteredUser(created || newMember);
            setStep(3);
        } catch (err) {
            console.error('Registration error:', err);
            showToast(isHindi ? 'पंजीकरण विफल रहा। पुनः प्रयास करें।' : 'رجسٹریشن ناکام رہی۔ دوبارہ کوشش کریں۔', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteAndNavigate = async () => {
        if (registeredUser) {
            await handleRegisterSession(registeredUser);
        }
        router.replace('/(drawer)/dashboard');
    };

    const dynamicBg = isDark ? '#020617' : '#ffffff';
    const dynamicCardBg = isDark ? '#0f172a' : '#ffffff';
    const dynamicHeaderBg = isDark ? '#0f172a' : '#f8fafc';
    const dynamicBorder = isDark ? '#1e293b' : '#e2e8f0';
    const dynamicText = isDark ? '#f8fafc' : '#0f172a';
    const dynamicSubText = isDark ? '#94a3b8' : '#64748b';
    const dynamicInputBg = isDark ? '#1e293b' : '#f8fafc';
    const placeholderColor = isDark ? '#64748b' : '#94a3b8';

    return (
        <KeyboardAvoidingView
            style={[s.flex1, { backgroundColor: dynamicBg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[s.header, { backgroundColor: dynamicHeaderBg, borderBottomColor: dynamicBorder }]}>
                <View style={s.headerTop}>
                    <TouchableOpacity
                        onPress={() => {
                            if (step > 1 && step < 3) {
                                setStep((step - 1) as 1 | 2);
                            } else {
                                router.back();
                            }
                        }}
                        style={[s.backBtn, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}
                    >
                        <ArrowLeft color={dynamicSubText} size={20} />
                    </TouchableOpacity>
                    <View style={[s.stepBadge, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <Text style={[s.stepText, { color: dynamicSubText }]}>
                            {isHindi ? `चरण ${step} / 3` : `مرحلہ ${step} از 3`}
                        </Text>
                    </View>
                </View>

                <View style={[s.heroBadge, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#059669' : '#a7f3d0' }]}>
                    <Sparkles color="#059669" size={14} />
                    <Text style={[s.heroBadgeText, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                        {isHindi ? '₹50 सदस्यता एकजुटता कार्यक्रम' : '₹50 ممبرشپ یکجہتی پروگرام'}
                    </Text>
                </View>
                <Text style={[s.heroTitle, { color: dynamicText }]}>
                    {isHindi ? 'सत्यापित सदस्य बनें' : 'تصدیق شدہ ممبر بنیں'}
                </Text>
                <Text style={[s.heroSubtitle, { color: dynamicSubText }]}>
                    {isHindi
                        ? 'अपने स्थानीय समुदाय से जुड़ें। दानकर्ता बनें और आपातकालीन सहायता के पात्र भी।'
                        : 'اپنی مقامی کمیونٹی میں شامل ہوں۔ عطیہ دہندہ بنیں اور ہنگامی امداد کے اہل بھی۔'}
                </Text>
            </View>

            {/* Toast */}
            {toast && (
                <View style={[s.toast, toast.type === 'error' ? s.toastError : s.toastSuccess]}>
                    <Text style={[s.toastText, toast.type === 'error' ? s.toastTextError : s.toastTextSuccess]}>
                        {toast.message}
                    </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

                {/* ── STEP 1 ── */}
                {step === 1 && (
                    <View style={s.stepContainer}>
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'पूरा नाम (आधार के अनुसार) *' : 'مکمل نام (آدھار کے مطابق) *'}
                            </Text>
                            <TextInput
                                style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                placeholder={isHindi ? 'उदा. मोहम्मद तारिक' : 'مثال: محمد طارق'}
                                placeholderTextColor={placeholderColor}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'मोबाइल नंबर *' : 'موبائل نمبر *'}
                            </Text>
                            <TextInput
                                style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                placeholder="+91 98765 43210"
                                placeholderTextColor={placeholderColor}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                            />
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'ईमेल पता (वैकल्पिक)' : 'ای میل ایڈریس (اختیاری)'}
                            </Text>
                            <TextInput
                                style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                placeholder={isHindi ? 'उदा. tariq@example.com' : 'tariq@example.com'}
                                placeholderTextColor={placeholderColor}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'पासवर्ड बनाएं *' : 'پاس ورڈ بنائیں *'}
                            </Text>
                            <View style={[s.inputRow, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <TextInput
                                    style={[s.input, s.inputFlex, { backgroundColor: 'transparent', borderWidth: 0, color: dynamicText }]}
                                    placeholder={isHindi ? 'कम से कम 6 अक्षर' : 'کم از کم 6 حروف'}
                                    placeholderTextColor={placeholderColor}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    style={s.eyeBtn}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff color={placeholderColor} size={18} />
                                        : <Eye color={placeholderColor} size={18} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={s.row}>
                            <View style={s.flex1}>
                                <Text style={[s.label, { color: dynamicSubText }]}>
                                    {isHindi ? 'राज्य *' : 'ریاست *'}
                                </Text>
                                <TextInput
                                    style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                    placeholder={isHindi ? 'उदा. उत्तर प्रदेश' : 'مثال: اتر پردیش'}
                                    placeholderTextColor={placeholderColor}
                                    value={state}
                                    onChangeText={setState}
                                />
                            </View>
                            <View style={s.gap12} />
                            <View style={s.flex1}>
                                <Text style={[s.label, { color: dynamicSubText }]}>
                                    {isHindi ? 'शहर / कस्बा *' : 'شہر / قصبہ *'}
                                </Text>
                                <TextInput
                                    style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                    placeholder={isHindi ? 'उदा. बरेली' : 'مثال: بریلی'}
                                    placeholderTextColor={placeholderColor}
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>
                        </View>

                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'अपना स्थानीय समुदाय चुनें *' : 'اپنی مقامی کمیونٹی منتخب کریں *'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCommunityPicker(true)}
                                style={[s.communityPicker, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                            >
                                <Text style={[s.communityPickerText, { color: dynamicText }]} numberOfLines={1}>
                                    {activeCommunity ? activeCommunity.name : (isHindi ? 'समुदाय चुनें' : 'کمیونٹی منتخب کریں')}
                                </Text>
                                <ChevronDown color={placeholderColor} size={18} />
                            </TouchableOpacity>
                        </View>

                        {/* Profile Picture Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'प्रोफ़ाइल फ़ोटो (वैकल्पिक)' : 'پروفائل تصویر (اختیاری)'}
                            </Text>
                            {avatarUri ? (
                                <View style={[s.previewCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#86efac' }]}>
                                    <Image source={{ uri: avatarUri }} style={s.avatarPreview} />
                                    <View style={s.previewMeta}>
                                        <Text style={[s.previewFileName, { color: dynamicText }]} numberOfLines={1}>
                                            {avatarFileName || 'profile_photo.jpg'}
                                        </Text>
                                        <View style={s.badgeAttached}>
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text style={s.badgeAttachedText}>
                                                {isHindi ? 'फ़ोटो संलग्न है' : 'تصویر منسلک ہے'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={s.previewActions}>
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('avatar')}
                                            style={[s.changeBtn, { backgroundColor: dynamicCardBg, borderColor: '#a7f3d0' }]}
                                        >
                                            <Camera color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAvatarUri('');
                                                setAvatarFileName('');
                                            }}
                                            style={s.deleteBtn}
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('avatar')}
                                    style={[s.uploadBox, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.uploadIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <Camera color="#059669" size={20} />
                                    </View>
                                    <Text style={[s.uploadTitle, { color: dynamicText }]}>
                                        {isHindi ? 'प्रोफ़ाइल फ़ोटो अपलोड करें' : 'پروفائل تصویر اپلوڈ کریں'}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {isHindi ? 'फ़ोटो खींचें या गैलरी से चुनें' : 'تصویر لیں یا گیلری سے منتخب کریں'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Identity Document Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'पहचान दस्तावेज (आधार / वोटर आईडी) *' : 'شناختی دستاویز (آدھار / ووٹر کارڈ) *'}
                            </Text>
                            {kycDocUri ? (
                                <View style={[s.previewCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#86efac' }]}>
                                    <Image source={{ uri: kycDocUri }} style={s.docPreview} />
                                    <View style={s.previewMeta}>
                                        <Text style={[s.previewFileName, { color: dynamicText }]} numberOfLines={1}>
                                            {kycFileName || 'identity_doc.jpg'}
                                        </Text>
                                        <View style={s.badgeAttached}>
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text style={s.badgeAttachedText}>
                                                {isHindi ? 'केवाईसी दस्तावेज संलग्न है' : 'دستاویز منسلک ہے'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={s.previewActions}>
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('document')}
                                            style={[s.changeBtn, { backgroundColor: dynamicCardBg, borderColor: '#a7f3d0' }]}
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setKycDocUri('');
                                                setKycFileName('');
                                            }}
                                            style={s.deleteBtn}
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('document')}
                                    style={[s.uploadBox, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.uploadIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <FileText color="#059669" size={20} />
                                    </View>
                                    <Text style={[s.uploadTitle, { color: dynamicText }]}>
                                        {isHindi ? 'पहचान दस्तावेज अपलोड करें' : 'شناختی دستاویز اپلوڈ کریں'}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {isHindi ? 'आधार, वोटर आईडी या कैमरा स्कैन संलग्न करें' : 'آدھار، ووٹر کارڈ یا کیمرہ اسکین اپلوڈ کریں'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity onPress={handleNextStep1} style={s.primaryBtn}>
                            <Text style={s.primaryBtnText}>
                                {isHindi ? 'आगे बढ़ें: ₹50 सदस्यता शुल्क का भुगतान करें' : 'آگے بڑھیں: ₹50 ممبرشپ فیس ادا کریں'}
                            </Text>
                            <ArrowRight color="#fff" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/sign-in')}
                            style={s.linkBtn}
                        >
                            <Text style={[s.linkText, { color: dynamicSubText }]}>
                                {isHindi ? 'पहले से खाता है? ' : 'پہلے سے اکاؤنٹ ہے؟ '}
                                <Text style={s.linkTextBold}>
                                    {isHindi ? 'साइन इन करें' : 'لاگ ان کریں'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <View style={s.stepContainer}>
                        {/* Fee Banner */}
                        <View style={[s.feeBanner, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#a7f3d0' }]}>
                            <View style={s.feeRow}>
                                <Text style={[s.feeBannerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                                    {isHindi ? 'वार्षिक सदस्यता एकजुटता शुल्क:' : 'سالانہ ممبرشپ فیس:'}
                                </Text>
                                <Text style={s.feeAmount}>₹50</Text>
                            </View>
                            <Text style={[s.feeBannerDesc, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
                                {isHindi
                                    ? `यह नाममात्र ₹50 शुल्क आपकी सदस्यता को ${activeCommunity?.name} में सक्रिय करता है और आपातकालीन सहायता व मतदान का अधिकार देता है।`
                                    : `یہ ₹50 فیس ${activeCommunity?.name} میں آپ کی ممبرشپ فعال کرتی ہے اور ہنگامی امداد کی اہلیت دیتی ہے۔`}
                            </Text>
                        </View>

                        {/* Payment Tabs */}
                        <View style={[s.tabRow, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('UPI')}
                                style={[s.tab, paymentMethod === 'UPI' ? [s.tabActive, { backgroundColor: dynamicCardBg }] : s.tabInactive]}
                            >
                                <Text style={[s.tabText, paymentMethod === 'UPI' ? [s.tabTextActive, { color: dynamicText }] : [s.tabTextInactive, { color: dynamicSubText }]]}>
                                    {isHindi ? 'तुरंत UPI / QR स्कैन' : 'فوری UPI / کیو آر اسکین'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('Bank Transfer')}
                                style={[s.tab, paymentMethod === 'Bank Transfer' ? [s.tabActive, { backgroundColor: dynamicCardBg }] : s.tabInactive]}
                            >
                                <Text style={[s.tabText, paymentMethod === 'Bank Transfer' ? [s.tabTextActive, { color: dynamicText }] : [s.tabTextInactive, { color: dynamicSubText }]]}>
                                    {isHindi ? 'बैंक NEFT / RTGS' : 'بینک ٹرانسفر / RTGS'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* UPI Panel */}
                        {paymentMethod === 'UPI' && (
                            <View style={s.darkPanel}>
                                <View style={s.qrBox}>
                                    <QrCode color="#0f172a" size={120} />
                                </View>
                                <Text style={s.upiLabel}>
                                    {isHindi ? 'प्रत्यक्ष एस्क्रो के लिए UPI ID' : 'براہ راست ادائیگی کے لیے UPI ID'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('mfct@okicici', 'UPI ID')}
                                    style={s.upiRow}
                                >
                                    <Text style={s.upiId}>mfct@okicici</Text>
                                    <Copy color="#34d399" size={16} />
                                </TouchableOpacity>
                                <Text style={s.upiHint}>
                                    {isHindi ? 'Google Pay, PhonePe, Paytm या BHIM UPI द्वारा स्कैन करें' : 'Google Pay, PhonePe, Paytm کے ذریعے اسکین کریں'}
                                </Text>
                            </View>
                        )}

                        {/* Bank Panel */}
                        {paymentMethod === 'Bank Transfer' && (
                            <View style={s.darkPanel}>
                                <View style={s.bankRow}>
                                    <Text style={s.bankLabel}>{isHindi ? 'खाता नाम:' : 'کھاتہ نام:'}</Text>
                                    <Text style={s.bankValueGreen}>MFCT Community Foundation</Text>
                                </View>
                                <View style={s.bankDivider} />
                                <View style={s.bankRow}>
                                    <Text style={s.bankLabel}>{isHindi ? 'बैंक का नाम:' : 'بینک کا نام:'}</Text>
                                    <Text style={s.bankValue}>ICICI Bank Ltd</Text>
                                </View>
                                <View style={s.bankDivider} />
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('000405018892', isHindi ? 'खाता संख्या' : 'اکاؤنٹ نمبر')}
                                    style={s.bankRow}
                                >
                                    <Text style={s.bankLabel}>{isHindi ? 'खाता संख्या:' : 'اکاؤنٹ نمبر:'}</Text>
                                    <View style={s.copyRow}>
                                        <Text style={s.bankValueGreen}>000405018892</Text>
                                        <Copy color="#6ee7b7" size={14} />
                                    </View>
                                </TouchableOpacity>
                                <View style={s.bankDivider} />
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('ICIC0000004', 'IFSC')}
                                    style={s.bankRow}
                                >
                                    <Text style={s.bankLabel}>IFSC Code:</Text>
                                    <View style={s.copyRow}>
                                        <Text style={s.bankValueGreen}>ICIC0000004</Text>
                                        <Copy color="#6ee7b7" size={14} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* UTR Input */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? '12 अंकों का बैंक UTR / संदर्भ संख्या' : '12 ہندسوں کا بینک UTR / ریفرنس نمبر'}
                            </Text>
                            <TextInput
                                style={[s.input, s.inputMono, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                placeholder="e.g. 420199381029"
                                placeholderTextColor={placeholderColor}
                                value={utrNumber}
                                onChangeText={setUtrNumber}
                            />
                        </View>

                        {/* Screenshot Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {isHindi ? 'या भुगतान का स्क्रीनशॉट अपलोड करें' : 'یا ادائیگی کی رسید اپلوڈ کریں'}
                            </Text>
                            {screenshotUri ? (
                                <View style={[s.previewCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#86efac' }]}>
                                    <Image source={{ uri: screenshotUri }} style={s.docPreview} />
                                    <View style={s.previewMeta}>
                                        <Text style={[s.previewFileName, { color: dynamicText }]} numberOfLines={1}>
                                            {screenshotFileName || 'payment_receipt.jpg'}
                                        </Text>
                                        <View style={s.badgeAttached}>
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text style={s.badgeAttachedText}>
                                                {isHindi ? 'भुगतान रसीद संलग्न है' : 'رسید منسلک ہے'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={s.previewActions}>
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('screenshot')}
                                            style={[s.changeBtn, { backgroundColor: dynamicCardBg, borderColor: '#a7f3d0' }]}
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setScreenshotUri('');
                                                setScreenshotFileName('');
                                            }}
                                            style={s.deleteBtn}
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('screenshot')}
                                    style={[s.uploadBox, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.uploadIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <Upload color="#059669" size={20} />
                                    </View>
                                    <Text style={[s.uploadTitle, { color: dynamicText }]}>
                                        {isHindi ? 'भुगतान स्क्रीनशॉट अपलोड करें' : 'ادائیگی کی رسید اپلوڈ کریں'}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {isHindi ? 'गैलरी या कैमरे से रसीद संलग्न करें' : 'گیلری یا کیمرے سے رسید منسلک کریں'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Agreement */}
                        <TouchableOpacity
                            onPress={() => setIsFeePaid(!isFeePaid)}
                            style={[s.checkRow, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                            activeOpacity={0.7}
                        >
                            <View style={[s.checkbox, isFeePaid ? s.checkboxActive : [s.checkboxIdle, { borderColor: placeholderColor }]]}>
                                {isFeePaid && <Check color="#fff" size={14} />}
                            </View>
                            <Text style={[s.checkLabel, { color: dynamicSubText }]}>
                                {isHindi
                                    ? 'मैंने ₹50 का UPI भुगतान पूरा कर लिया है और सामुदायिक दिशानिर्देशों से सहमत हूँ।'
                                    : 'میں نے ₹50 کی ادائیگی مکمل کر لی ہے اور فلاحی اصولوں سے متفق ہوں۔'}
                            </Text>
                        </TouchableOpacity>

                        {/* Action Buttons */}
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                style={[s.backSecondaryBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                            >
                                <Text style={[s.backSecondaryText, { color: dynamicSubText }]}>
                                    {isHindi ? 'वापस' : 'واپس'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleFinishRegistration}
                                disabled={!isFeePaid || submitting}
                                style={[s.submitBtn, (!isFeePaid || submitting) ? s.submitBtnDisabled : s.submitBtnEnabled]}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={s.submitBtnText}>
                                        {isHindi ? 'सदस्यता पंजीकरण पूर्ण करें' : 'ممبرشپ رجسٹریشن مکمل کریں'}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── STEP 3 ── */}
                {step === 3 && (
                    <View style={s.successContainer}>
                        <View style={s.successIcon}>
                            <UserCheck color="#059669" size={44} />
                        </View>
                        <Text style={[s.successTitle, { color: dynamicText }]}>
                            {isHindi ? 'MFCT में आपका स्वागत है!' : 'MFCT میں خوش آمدید!'}
                        </Text>
                        <Text style={[s.successSubtitle, { color: dynamicSubText }]}>
                            {isHindi ? (
                                <>अब आप <Text style={s.successCommunity}>{activeCommunity?.name}</Text> के एक सत्यापित सदस्य हैं।</>
                            ) : (
                                <>اب آپ <Text style={s.successCommunity}>{activeCommunity?.name}</Text> کے تصدیق شدہ ممبر بن چکے ہیں۔</>
                            )}
                        </Text>
                        <TouchableOpacity onPress={handleCompleteAndNavigate} style={s.primaryBtn}>
                            <Text style={s.primaryBtnText}>
                                {isHindi ? 'सदस्य डैशबोर्ड खोलें' : 'ممبر ڈیش بورڈ کھولیں'}
                            </Text>
                            <ArrowRight color="#fff" size={18} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Media Picker Sheet Modal */}
            {pickerTarget !== null && (
                <Modal
                    visible={pickerTarget !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPickerTarget(null)}
                >
                    <TouchableOpacity
                        style={s.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setPickerTarget(null)}
                    >
                        <View style={[s.modalSheet, { backgroundColor: dynamicCardBg }]}>
                            <View style={s.sheetHeader}>
                                <Text style={[s.sheetTitle, { color: dynamicText }]}>
                                    {pickerTarget === 'avatar'
                                        ? (isHindi ? 'प्रोफ़ाइल फ़ोटो अपलोड करें' : 'پروفائل تصویر اپلوڈ کریں')
                                        : pickerTarget === 'document'
                                            ? (isHindi ? 'पहचान दस्तावेज अपलोड करें' : 'شناختی دستاویز اپلوڈ کریں')
                                            : (isHindi ? 'भुगतान स्क्रीनशॉट अपलोड करें' : 'ادائیگی کی رسید اپلوڈ کریں')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setPickerTarget(null)}
                                    style={[s.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                                >
                                    <X color={dynamicSubText} size={18} />
                                </TouchableOpacity>
                            </View>

                            <View style={s.pickerOptionsRow}>
                                <TouchableOpacity
                                    style={[s.pickerOptionCard, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    onPress={() => handlePickMedia('camera')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.optionIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <Camera color="#059669" size={24} />
                                    </View>
                                    <Text style={[s.optionTitle, { color: dynamicText }]}>
                                        {isHindi ? 'कैमरा का उपयोग करें' : 'کیمرہ استعمال کریں'}
                                    </Text>
                                    <Text style={[s.optionSub, { color: dynamicSubText }]}>
                                        {isHindi ? 'नई तस्वीर लें' : 'نئی تصویر لیں'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.pickerOptionCard, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    onPress={() => handlePickMedia('gallery')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.optionIconCircle, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}>
                                        <ImageIcon color="#2563eb" size={24} />
                                    </View>
                                    <Text style={[s.optionTitle, { color: dynamicText }]}>
                                        {isHindi ? 'गैलरी से चुनें' : 'گیلری سے منتخب کریں'}
                                    </Text>
                                    <Text style={[s.optionSub, { color: dynamicSubText }]}>
                                        {isHindi ? 'फ़ाइल / छवि चुनें' : 'تصویر منتخب کریں'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => setPickerTarget(null)}
                                style={[s.cancelBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                            >
                                <Text style={[s.cancelBtnText, { color: dynamicSubText }]}>
                                    {isHindi ? 'रद्द करें' : 'منسوخ'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Community Picker Overlay */}
            {showCommunityPicker && (
                <View style={s.overlay}>
                    <View style={[s.pickerSheet, { backgroundColor: dynamicCardBg }]}>
                        <View style={[s.pickerHeader, { borderBottomColor: dynamicBorder }]}>
                            <Text style={[s.pickerTitle, { color: dynamicText }]}>
                                {isHindi ? 'अपना स्थानीय समुदाय चुनें' : 'اپنی مقامی کمیونٹی منتخب کریں'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCommunityPicker(false)}
                                style={[s.pickerClose, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                            >
                                <Text style={[s.pickerCloseText, { color: dynamicSubText }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={s.pickerList}>
                            {communities.map((item) => {
                                const isSelected = item.id === selectedCommunityId;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => {
                                            setSelectedCommunityId(item.id);
                                            setShowCommunityPicker(false);
                                        }}
                                        style={[s.communityItem, isSelected ? s.communityItemActive : [s.communityItemIdle, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]]}
                                    >
                                        <View style={s.flex1}>
                                            <Text style={[s.communityItemName, { color: dynamicText }]}>{item.name}</Text>
                                            <Text style={[s.communityItemSub, { color: dynamicSubText }]}>
                                                {item.city} • {isHindi ? 'प्रशासक:' : 'ایڈمن:'} {item.adminName}
                                            </Text>
                                        </View>
                                        {isSelected && <Check color="#059669" size={20} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    flex1: { flex: 1 },
    // Header
    header: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 20, borderBottomWidth: 1 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    stepBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    stepText: { fontSize: 12, fontWeight: '700' },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 8 },
    heroBadgeText: { fontSize: 11, fontWeight: '700' },
    heroTitle: { fontSize: 22, fontWeight: '800' },
    heroSubtitle: { fontSize: 12, marginTop: 4, lineHeight: 18 },
    // Toast
    toast: { marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
    toastError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    toastSuccess: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    toastText: { fontSize: 12, fontWeight: '700' },
    toastTextError: { color: '#b91c1c' },
    toastTextSuccess: { color: '#15803d' },
    // Scroll
    scrollContent: { flexGrow: 1, paddingBottom: 40 },
    stepContainer: { padding: 20, gap: 16 },
    // Fields
    fieldGroup: { gap: 6 },
    label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    input: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 14 },
    inputFlex: { flex: 1 },
    inputMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
    eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
    row: { flexDirection: 'row' },
    gap12: { width: 12 },
    // Community picker trigger
    communityPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 },
    communityPickerText: { fontWeight: '500', fontSize: 14, flex: 1, marginRight: 8 },
    // Upload Box
    uploadBox: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    uploadTitle: {
        fontSize: 13,
        fontWeight: '700',
    },
    uploadSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    // Preview Cards
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    avatarPreview: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#cbd5e1',
    },
    docPreview: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#cbd5e1',
    },
    previewMeta: {
        flex: 1,
        gap: 4,
    },
    previewFileName: {
        fontSize: 13,
        fontWeight: '700',
    },
    badgeAttached: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeAttachedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    previewActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    changeBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Media Picker Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
        fontSize: 16,
        fontWeight: '800',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
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
    cancelBtn: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Buttons
    primaryBtn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    linkBtn: { alignItems: 'center', marginTop: 4 },
    linkText: { fontSize: 12, fontWeight: '500' },
    linkTextBold: { color: '#059669', fontWeight: '700' },
    // Fee banner
    feeBanner: { padding: 16, borderWidth: 1, borderRadius: 16, gap: 4 },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    feeBannerTitle: { fontWeight: '700', fontSize: 14 },
    feeAmount: { color: '#047857', fontWeight: '800', fontSize: 18 },
    feeBannerDesc: { fontSize: 12, lineHeight: 18 },
    // Tabs
    tabRow: { flexDirection: 'row', padding: 4, borderRadius: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    tabActive: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabInactive: { backgroundColor: 'transparent' },
    tabText: { fontSize: 12, fontWeight: '700' },
    tabTextActive: {},
    tabTextInactive: {},
    // Dark panel (UPI / Bank)
    darkPanel: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, gap: 12, alignItems: 'center' },
    qrBox: { backgroundColor: '#fff', padding: 16, borderRadius: 16 },
    upiLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    upiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    upiId: { color: '#34d399', fontWeight: '700', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    upiHint: { color: '#64748b', fontSize: 11, textAlign: 'center' },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    bankLabel: { color: '#94a3b8', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    bankValue: { color: '#e2e8f0', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    bankValueGreen: { color: '#6ee7b7', fontWeight: '700', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    bankDivider: { height: 1, backgroundColor: '#1e293b', width: '100%' },
    copyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    // Checkbox
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
    checkbox: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    checkboxIdle: {},
    checkboxActive: { backgroundColor: '#059669', borderColor: '#059669' },
    checkLabel: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 18 },
    // Action
    actionRow: { flexDirection: 'row', gap: 12 },
    backSecondaryBtn: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    backSecondaryText: { fontWeight: '700', fontSize: 14 },
    submitBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    submitBtnEnabled: { backgroundColor: '#059669' },
    submitBtnDisabled: { backgroundColor: '#cbd5e1' },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    // Success
    successContainer: { padding: 24, alignItems: 'center', gap: 16, marginTop: 24 },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#34d399' },
    successTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    successSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
    successCommunity: { fontWeight: '700', color: '#047857' },
    // Overlay
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 50 },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 16, fontWeight: '700' },
    pickerClose: { padding: 8, borderRadius: 20 },
    pickerCloseText: { fontWeight: '700' },
    pickerList: { marginTop: 12 },
    communityItem: { padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    communityItemIdle: {},
    communityItemActive: { backgroundColor: '#f0fdf4', borderColor: '#059669' },
    communityItemName: { fontWeight: '700', fontSize: 14 },
    communityItemSub: { fontSize: 12, marginTop: 2 },
});
