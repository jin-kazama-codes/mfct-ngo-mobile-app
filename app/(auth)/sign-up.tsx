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
    Trash2, FileText, CheckCircle2, X, Globe, ShieldCheck, HeartHandshake,
    HandHeart, Building2, MapPin, Mail, Phone, Lock, User as UserIcon
} from 'lucide-react-native';

export default function SignUpScreen() {
    const { handleRegisterSession } = useAppState();
    const { colorScheme } = useColorScheme();
    const { t, i18n } = useTranslation();
    const isDark = colorScheme === 'dark';

    const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    const isHindi = lang.startsWith('hi');
    const isUrdu = lang.startsWith('ur');

    const tr = (hi: string, ur: string, en: string) => {
        if (isHindi) return hi;
        if (isUrdu) return ur;
        return en;
    };

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [address, setAddress] = useState('');
    const [religion, setReligion] = useState<'Hindu' | 'Muslim' | 'Sikh' | 'Christian' | ''>('');
    const [isMalikENisab, setIsMalikENisab] = useState<boolean | null>(null);
    const [helpType, setHelpType] = useState<'Zakat' | 'Sadaka' | 'Fitra' | 'Other' | ''>('');
    const [helpDetails, setHelpDetails] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState('');
    const [showCommunityPicker, setShowCommunityPicker] = useState(false);
    const [showReligionPicker, setShowReligionPicker] = useState(false);

    // Media upload states
    const [avatarUri, setAvatarUri] = useState<string>('');
    const [avatarFileName, setAvatarFileName] = useState<string>('');

    const [aadhaarFrontUri, setAadhaarFrontUri] = useState<string>('');
    const [aadhaarFrontFileName, setAadhaarFrontFileName] = useState<string>('');

    const [aadhaarBackUri, setAadhaarBackUri] = useState<string>('');
    const [aadhaarBackFileName, setAadhaarBackFileName] = useState<string>('');

    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
    const [utrNumber, setUtrNumber] = useState('');
    const [screenshotUri, setScreenshotUri] = useState<string>('');
    const [screenshotFileName, setScreenshotFileName] = useState<string>('');
    const [isFeePaid, setIsFeePaid] = useState(false);

    // Media picker modal
    const [pickerTarget, setPickerTarget] = useState<'avatar' | 'aadhaarFront' | 'aadhaarBack' | 'screenshot' | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const [registeredUser, setRegisteredUser] = useState<User | null>(null);

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const copyToClipboard = (text: string, label: string) => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(text);
            }
        } catch {}
        showToast(tr(`${label} कॉपी किया गया!`, `${label} کاپی ہو گیا!`, `${label} copied!`), 'success');
    };

    useEffect(() => {
        getCommunities().then((data) => {
            setCommunities(data);
            if (data.length > 0) setSelectedCommunityId(data[0].id);
        }).catch(console.error);
    }, []);

    const activeCommunity = communities.find((c) => c.id === selectedCommunityId) || communities[0];

    const handleReligionChange = (newRel: 'Hindu' | 'Muslim' | 'Sikh' | 'Christian' | '') => {
        setReligion(newRel);
        setShowReligionPicker(false);
        if (newRel !== 'Muslim') {
            setIsMalikENisab(null);
            setHelpType('');
            setHelpDetails('');
        }
    };

    const handleMalikENisabChange = (isNisab: boolean) => {
        setIsMalikENisab(isNisab);
        if (isNisab) {
            setHelpType('');
            setHelpDetails('');
        }
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
                        tr('अनुमति आवश्यक', 'اجازت درکار ہے', 'Permission Required'),
                        tr('फोटो लेने के लिए कैमरे की अनुमति आवश्यक है।', 'تصویر لینے کے لیے کیمرے کی اجازت درکار ہے۔', 'Camera permission is required to take photos.')
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
                    const defaultName = target === 'avatar'
                        ? 'profile_photo.jpg'
                        : target === 'aadhaarFront'
                            ? 'aadhaar_front.jpg'
                            : target === 'aadhaarBack'
                                ? 'aadhaar_back.jpg'
                                : 'payment_receipt.jpg';
                    const fname = asset.fileName || defaultName;

                    if (target === 'avatar') {
                        setAvatarUri(asset.uri);
                        setAvatarFileName(fname);
                        showToast(tr('प्रोफ़ाइल फ़ोटो कैप्चर की गई!', 'پروفائل تصویر لی گئی!', 'Profile photo captured!'), 'success');
                    } else if (target === 'aadhaarFront') {
                        setAadhaarFrontUri(asset.uri);
                        setAadhaarFrontFileName(fname);
                        showToast(tr('आधार सामने का भाग कैप्चर किया गया!', 'آدھار سامنے کا حصہ لیا گیا!', 'Aadhaar front captured!'), 'success');
                    } else if (target === 'aadhaarBack') {
                        setAadhaarBackUri(asset.uri);
                        setAadhaarBackFileName(fname);
                        showToast(tr('आधार पीछे का भाग कैप्चर किया गया!', 'آدھار پیچھے کا حصہ لیا گیا!', 'Aadhaar back captured!'), 'success');
                    } else if (target === 'screenshot') {
                        setScreenshotUri(asset.uri);
                        setScreenshotFileName(fname);
                        showToast(tr('रसीद कैप्चर की गई!', 'رسید لی گئی!', 'Receipt captured!'), 'success');
                    }
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        tr('अनुमति आवश्यक', 'اجازت درکار ہے', 'Permission Required'),
                        tr('गैलरी से चयन के लिए अनुमति आवश्यक है।', 'گیلری سے انتخاب کے لیے اجازت درکار ہے۔', 'Gallery permission is required to select photos.')
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
                    const defaultName = target === 'avatar'
                        ? 'profile_photo.jpg'
                        : target === 'aadhaarFront'
                            ? 'aadhaar_front.jpg'
                            : target === 'aadhaarBack'
                                ? 'aadhaar_back.jpg'
                                : 'payment_receipt.jpg';
                    const fname = asset.fileName || defaultName;

                    if (target === 'avatar') {
                        setAvatarUri(asset.uri);
                        setAvatarFileName(fname);
                        showToast(tr('प्रोफ़ाइल फ़ोटो चुनी गई!', 'پروفائل تصویر منتخب کی گئی!', 'Profile photo selected!'), 'success');
                    } else if (target === 'aadhaarFront') {
                        setAadhaarFrontUri(asset.uri);
                        setAadhaarFrontFileName(fname);
                        showToast(tr('आधार सामने का भाग संलग्न किया गया!', 'آدھار سامنے کا حصہ منسلک کیا گیا!', 'Aadhaar front attached!'), 'success');
                    } else if (target === 'aadhaarBack') {
                        setAadhaarBackUri(asset.uri);
                        setAadhaarBackFileName(fname);
                        showToast(tr('आधार पीछे का भाग संलग्न किया गया!', 'آدھار پیچھے کا حصہ منسلک کیا گیا!', 'Aadhaar back attached!'), 'success');
                    } else if (target === 'screenshot') {
                        setScreenshotUri(asset.uri);
                        setScreenshotFileName(fname);
                        showToast(tr('भुगतान स्क्रीनशॉट संलग्न किया गया!', 'ادائیگی کی رسید منسلک کی گئی!', 'Payment screenshot attached!'), 'success');
                    }
                }
            }
        } catch (err) {
            console.warn('Image picker error:', err);
            showToast(tr('मीडिया खोलने में विफल।', 'میڈیا کھولنے میں ناکام۔', 'Failed to open media.'), 'error');
        }
    };

    const handleNextStep1 = () => {
        const missingFields: string[] = [];
        if (!fullName.trim()) missingFields.push(tr('पूरा नाम', 'مکمل نام', 'Full Name'));
        if (!phone.trim()) missingFields.push(tr('मोबाइल नंबर', 'موبائل نمبر', 'Mobile Number'));
        if (!password) missingFields.push(tr('पासवर्ड', 'پاس ورڈ', 'Password'));
        if (!state.trim()) missingFields.push(tr('राज्य', 'ریاست', 'State'));
        if (!city.trim()) missingFields.push(tr('शहर', 'شہر', 'City'));
        if (!address.trim()) missingFields.push(tr('पूरा पता', 'مکمل پتہ', 'Full Address'));
        if (!religion) missingFields.push(tr('धर्म', 'مذہب', 'Religion'));
        if (!avatarUri) missingFields.push(tr('प्रोफ़ाइल फ़ोटो', 'پروفائل تصویر', 'Profile Photo'));

        if (missingFields.length > 0) {
            showToast(
                tr(
                    `कृपया आवश्यक फ़ील्ड भरें: ${missingFields.join(', ')}`,
                    `براہ کرم تمام ضروری خانے پر کریں: ${missingFields.join(', ')}`,
                    `Please fill required fields: ${missingFields.join(', ')}`
                ),
                'error'
            );
            return;
        }
        if (phone.trim().length < 10) {
            showToast(
                tr(
                    'मोबाइल नंबर कम से कम 10 अंकों का होना चाहिए।',
                    'موبائل نمبر 10 ہندسوں کا ہونا چاہیے۔',
                    'Mobile number must be at least 10 digits.'
                ),
                'error'
            );
            return;
        }
        if (password.length < 6) {
            showToast(
                tr(
                    'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
                    'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔',
                    'Password must be at least 6 characters.'
                ),
                'error'
            );
            return;
        }

        if (religion === 'Muslim') {
            if (isMalikENisab === null) {
                showToast(
                    tr(
                        'कृपया बताएं कि क्या आप मालिक-ए-निसब हैं।',
                        'براہ کرم بتائیں کہ کیا آپ صاحبِ نصاب ہیں۔',
                        'Please indicate whether you are Malik-e-Nisab.'
                    ),
                    'error'
                );
                return;
            }
            if (isMalikENisab === false && !helpType) {
                showToast(
                    tr(
                        'कृपया सहायता का प्रकार चुनें।',
                        'براہ کرم درکار امداد کی قسم منتخب کریں۔',
                        'Please select the type of help needed.'
                    ),
                    'error'
                );
                return;
            }
            if (isMalikENisab === false && helpType === 'Other' && !helpDetails.trim()) {
                showToast(
                    tr(
                        'कृपया सहायता का विवरण दर्ज करें।',
                        'براہ کرم درکار امداد کی تفصیل لکھیں۔',
                        'Please specify the details of assistance needed.'
                    ),
                    'error'
                );
                return;
            }
        }

        setStep(2);
    };

    const handleFinishRegistration = async () => {
        if (!activeCommunity) return;
        if (!utrNumber.trim()) {
            showToast(
                tr(
                    'कृपया 12 अंकों का UTR नंबर दर्ज करें।',
                    'براہ کرم 12 ہندسوں کا UTR نمبر درج کریں۔',
                    'Please enter 12-digit Bank UTR / Reference number.'
                ),
                'error'
            );
            return;
        }
        if (!screenshotUri) {
            showToast(
                tr(
                    'कृपया भुगतान स्क्रीनशॉट अपलोड करें।',
                    'براہ کرم ادائیگی کی رسید اپلوڈ کریں۔',
                    'Please upload payment screenshot.'
                ),
                'error'
            );
            return;
        }
        if (!isFeePaid) {
            showToast(
                tr(
                    'कृपया भुगतान और दिशानिर्देशों की पुष्टि करें।',
                    'براہ کرم ادائیگی کی تصدیق کریں۔',
                    'Please confirm payment and guidelines agreement.'
                ),
                'error'
            );
            return;
        }

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
                address: address.trim(),
                role: 'member',
                avatar: avatarUri,
                communityId: activeCommunity.id,
                communityName: activeCommunity.name,
                membershipId: `SS-${userCity.substring(0, 3).toUpperCase()}-2024-${Math.floor(1000 + Math.random() * 9000)}`,
                isVerified: false,
                isPremium: false,
                joinDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                passwordHash: hashedPassword,
                paymentMethod: paymentMethod,
                paymentUtr: utrNumber.trim() || undefined,
                paymentScreenshotUrl: screenshotUri || undefined,
                aadhaarFrontUrl: aadhaarFrontUri || undefined,
                aadhaarBackUrl: aadhaarBackUri || undefined,
                religion: religion || undefined,
                isMalikENisab: religion === 'Muslim' ? (isMalikENisab ?? undefined) : undefined,
                is_malik_e_nisab: religion === 'Muslim' ? (isMalikENisab ?? undefined) : undefined,
                helpType: religion === 'Muslim' && isMalikENisab === false ? helpType || undefined : undefined,
                help_type: religion === 'Muslim' && isMalikENisab === false ? helpType || undefined : undefined,
                helpDetails: religion === 'Muslim' && isMalikENisab === false && helpType === 'Other' ? helpDetails.trim() || undefined : undefined,
                help_details: religion === 'Muslim' && isMalikENisab === false && helpType === 'Other' ? helpDetails.trim() || undefined : undefined,
            };

            const created = await createUser({ ...newMember });

            setRegisteredUser(created || newMember);
            setStep(3);
        } catch (err) {
            console.error('Registration error:', err);
            showToast(
                tr('पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।', 'رجسٹریشن ناکام رہی۔ دوبارہ کوشش کریں۔', 'Registration failed. Please try again.'),
                'error'
            );
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

    const dynamicBg = isDark ? '#020617' : '#f8f6f1';
    const dynamicCardBg = isDark ? '#0f172a' : '#ffffff';
    const dynamicHeaderBg = isDark ? '#0f172a' : '#ffffff';
    const dynamicBorder = isDark ? '#1e293b' : '#e2e8f0';
    const dynamicText = isDark ? '#f8fafc' : '#0f172a';
    const dynamicSubText = isDark ? '#94a3b8' : '#64748b';
    const dynamicInputBg = isDark ? '#1e293b' : '#ffffff';
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

                    {/* Stepper badge indicator */}
                    {step < 3 && (
                        <View style={s.stepBadgeContainer}>
                            <View style={[s.stepBadgePill, step === 1 ? s.stepBadgePillActive : s.stepBadgePillDone]}>
                                <Text style={[s.stepBadgePillText, step === 1 ? s.stepBadgePillTextActive : s.stepBadgePillTextDone]}>
                                    1. {tr('व्यक्तिगत विवरण', 'ذاتی معلومات', 'Personal Info')}
                                </Text>
                            </View>
                            <View style={[s.stepBadgePill, step === 2 ? s.stepBadgePillActive : s.stepBadgePillIdle]}>
                                <Text style={[s.stepBadgePillText, step === 2 ? s.stepBadgePillTextActive : s.stepBadgePillTextIdle]}>
                                    2. {tr('₹100 शुल्क', 'فیس ادائیگی', '₹100 Fee')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={[s.heroBadge, { backgroundColor: isDark ? 'rgba(200,168,75,0.15)' : 'rgba(200,168,75,0.15)', borderColor: 'rgba(200,168,75,0.4)' }]}>
                    <Sparkles color="#d97706" size={14} />
                    <Text style={[s.heroBadgeText, { color: isDark ? '#fbbf24' : '#b45309' }]}>
                        {tr('सदस्यता एकजुटता कार्यक्रम', 'ممبرشپ یکجہتی پروگرام', '₹100 Membership Solidarity Program')}
                    </Text>
                </View>
                <Text style={[s.heroTitle, { color: dynamicText }]}>
                    {step === 1 && tr('सदस्यता पंजीकरण', 'ممبرشپ رجسٹریشن', 'Member Registration')}
                    {step === 2 && tr('सदस्यता शुल्क भुगतान', 'ممبرشپ فیس ادائیگی', 'Solidarity Fee Payment')}
                    {step === 3 && tr('पंजीकरण पूर्ण हुआ!', 'رجسٹریشن مکمل ہو گئی!', 'Registration Complete!')}
                </Text>
                <Text style={[s.heroSubtitle, { color: dynamicSubText }]}>
                    {step === 1 && tr('कृपया अपना व्यक्तिगत, पते व धर्म का विवरण दर्ज करें।', 'براہ کرم ذاتی، رہائشی و مذہبی تفصیلات درج کریں۔', 'Enter your personal details to create your verified member profile.')}
                    {step === 2 && tr('₹100 की वार्षिक सदस्यता शुल्क का भुगतान पूरा करें।', 'سالانہ ممبرشپ کے लिए ₹100 ادا کریں۔', 'Complete the ₹100 annual solidarity fee via UPI or Direct Bank Transfer.')}
                    {step === 3 && tr('आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।', 'آپ کی ممبرشپ کامیابی سے درج کر لی گئی ہے۔', 'Your registration request has been submitted successfully.')}
                </Text>
            </View>

            {/* Toast Notification */}
            {toast && (
                <View style={[s.toast, toast.type === 'error' ? s.toastError : s.toastSuccess]}>
                    <Text style={[s.toastText, toast.type === 'error' ? s.toastTextError : s.toastTextSuccess]}>
                        {toast.type === 'error' ? '⚠️ ' : '✓ '}
                        {toast.message}
                    </Text>
                </View>
            )}

            <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

                {/* ════════════════════════════════════════════════════════════════
                    STEP 1: Personal Details & Islamic Welfare Declaration
                   ════════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <View style={s.stepContainer}>
                        {/* Full Name */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('पूरा नाम (आधार के अनुसार) *', 'مکمل نام (آدھار کے مطابق) *', 'Full Name (as per ID) *')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <UserIcon color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, { color: dynamicText }]}
                                    placeholder={tr('उदा. मोहम्मद तारिक', 'مثال: محمد طارق', 'e.g. Mohammad Tariq')}
                                    placeholderTextColor={placeholderColor}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        {/* Mobile Number */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('मोबाइल नंबर *', 'موبائل نمبر *', 'Mobile Number *')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <Phone color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, { color: dynamicText }]}
                                    placeholder="9876543210"
                                    placeholderTextColor={placeholderColor}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                                />
                            </View>
                        </View>

                        {/* Email Address */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('ईमेल पता (वैकल्पिक)', 'ای میل (اختیاری)', 'Email Address (Optional)')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <Mail color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, { color: dynamicText }]}
                                    placeholder="tariq@example.com"
                                    placeholderTextColor={placeholderColor}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('पासवर्ड बनाएं *', 'پاس ورڈ بنائیں *', 'Create Password *')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <Lock color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, s.flex1, { color: dynamicText }]}
                                    placeholder={tr('कम से कम 6 अक्षर', 'کم از کم 6 حروف', 'Min. 6 characters')}
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

                        {/* State */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('राज्य *', 'ریاست *', 'State *')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <MapPin color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, { color: dynamicText }]}
                                    placeholder={tr('उदा. उत्तर प्रदेश', 'مثال: اتر پردیش', 'e.g. Uttar Pradesh')}
                                    placeholderTextColor={placeholderColor}
                                    value={state}
                                    onChangeText={setState}
                                />
                            </View>
                        </View>

                        {/* City */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('शहर / कस्बा *', 'شہر / قصبہ *', 'City / Town *')}
                            </Text>
                            <View style={[s.inputWithIcon, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}>
                                <Building2 color={placeholderColor} size={18} />
                                <TextInput
                                    style={[s.inputClean, { color: dynamicText }]}
                                    placeholder={tr('उदा. बरेली', 'مثال: بریلی', 'e.g. Bareilly')}
                                    placeholderTextColor={placeholderColor}
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>
                        </View>

                        {/* Full Address */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('पूरा पता *', 'مکمل پتہ *', 'Full Address *')}
                            </Text>
                            <TextInput
                                style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText, minHeight: 64, textAlignVertical: 'top' }]}
                                placeholder={tr('मकान संख्या, गली / मोहल्ला, लैंडमार्क, पिन कोड', 'مکان نمبر، گلی / محلہ، پن کوڈ', 'House No., Street / Area, Landmark, Pincode')}
                                placeholderTextColor={placeholderColor}
                                multiline
                                numberOfLines={2}
                                value={address}
                                onChangeText={setAddress}
                            />
                        </View>

                        {/* Local Community & Religion Selectors */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('स्थानीय समुदाय *', 'مقامی کمیونٹی *', 'Local Community *')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCommunityPicker(true)}
                                style={[s.pickerTrigger, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                            >
                                <Text style={[s.pickerTriggerText, { color: activeCommunity ? dynamicText : placeholderColor }]} numberOfLines={1}>
                                    {activeCommunity ? `${activeCommunity.name} (${activeCommunity.city})` : tr('समुदाय चुनें', 'کمیونٹی منتخب کریں', 'Select Community')}
                                </Text>
                                <ChevronDown color={placeholderColor} size={18} />
                            </TouchableOpacity>
                        </View>

                        {/* Religion Field */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('धर्म *', 'مذہب *', 'Religion *')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowReligionPicker(true)}
                                style={[s.pickerTrigger, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                            >
                                <Text style={[s.pickerTriggerText, { color: religion ? dynamicText : placeholderColor }]}>
                                    {religion === 'Hindu' && tr('हिन्दू (Hindu)', 'ہندو (Hindu)', 'Hindu')}
                                    {religion === 'Muslim' && tr('मुस्लिम (Muslim)', 'مسلم (Muslim)', 'Muslim')}
                                    {religion === 'Sikh' && tr('सिख (Sikh)', 'سکھ (Sikh)', 'Sikh')}
                                    {religion === 'Christian' && tr('ईसाई (Christian)', 'عیسائی (Christian)', 'Christian')}
                                    {!religion && tr('-- धर्म चुनें --', '-- مذہب منتخب کریں --', '-- Select Religion --')}
                                </Text>
                                <ChevronDown color={placeholderColor} size={18} />
                            </TouchableOpacity>
                        </View>

                        {/* ── Islamic Welfare & Nisab Declaration (Only if Muslim) ── */}
                        {religion === 'Muslim' && (
                            <View style={[s.nisabCard, { backgroundColor: isDark ? '#14281f' : '#fcf9f2', borderColor: isDark ? '#2d5a42' : '#e6d3a3' }]}>
                                <View style={s.nisabHeader}>
                                    <Sparkles color="#d97706" size={16} />
                                    <Text style={[s.nisabTitle, { color: isDark ? '#f0c868' : '#0f3322' }]}>
                                        {tr('इस्लामी कल्याण एवं निसब घोषणा', 'اسلامی فلاحی و نصاب اقرار نامہ', 'Islamic Welfare & Nisab Declaration')}
                                    </Text>
                                </View>

                                <View style={s.nisabContent}>
                                    <Text style={[s.nisabQuestion, { color: dynamicText }]}>
                                        {tr('क्या आप मालिक-ए-निसब (साहिब-ए-निसब) हैं? *', 'کیا آپ صاحبِ نصاب / مالکِ نصاب ہیں؟ *', 'Are you Malik-e-Nisab (Sahib-e-Nisab)? *')}
                                    </Text>
                                    <Text style={[s.nisabHint, { color: dynamicSubText }]}>
                                        {tr(
                                            'क्या आपके पास बुनियादी ज़रूरतों के अलावा 52.5 तोले चांदी (या इसके बराबर नकदी/माल) मौजूद है?',
                                            'کیا آپ کے پاس اپنی بنیادی ضروریات سے زائد ساڑھے باون تولہ چاندی (یا مساوی مال/رقم) موجود ہے؟',
                                            'Do you possess wealth exceeding the Nisab threshold (52.5 tolas silver / equivalent value)?'
                                        )}
                                    </Text>

                                    <View style={s.nisabOptionRow}>
                                        <TouchableOpacity
                                            onPress={() => handleMalikENisabChange(true)}
                                            style={[
                                                s.nisabOptionBtn,
                                                isMalikENisab === true
                                                    ? [s.nisabOptionBtnActive, { backgroundColor: isDark ? '#1b4332' : '#fef3c7', borderColor: '#d97706' }]
                                                    : [s.nisabOptionBtnIdle, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]
                                            ]}
                                        >
                                            <View style={[s.radioCircle, isMalikENisab === true && s.radioCircleActive]}>
                                                {isMalikENisab === true && <View style={s.radioDot} />}
                                            </View>
                                            <Text style={[s.nisabOptionText, { color: dynamicText }]}>
                                                {tr('हाँ (मालिक-ए-निसब)', 'ہاں (صاحبِ نصاب)', 'Yes (Malik-e-Nisab)')}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleMalikENisabChange(false)}
                                            style={[
                                                s.nisabOptionBtn,
                                                isMalikENisab === false
                                                    ? [s.nisabOptionBtnActive, { backgroundColor: isDark ? '#1b4332' : '#fef3c7', borderColor: '#d97706' }]
                                                    : [s.nisabOptionBtnIdle, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]
                                            ]}
                                        >
                                            <View style={[s.radioCircle, isMalikENisab === false && s.radioCircleActive]}>
                                                {isMalikENisab === false && <View style={s.radioDot} />}
                                            </View>
                                            <Text style={[s.nisabOptionText, { color: dynamicText }]}>
                                                {tr('नहीं (गैर-निसबदार)', 'نہیں (غیر نصاب)', 'No (Non-Nisab)')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* If Nisab Yes */}
                                    {isMalikENisab === true && (
                                        <View style={[s.nisabSuccessBanner, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#059669' : '#a7f3d0' }]}>
                                            <CheckCircle2 color="#059669" size={18} />
                                            <Text style={[s.nisabSuccessText, { color: isDark ? '#6ee7b7' : '#065f46' }]}>
                                                {tr(
                                                    'अल्हम्दुलिल्लाह! आप एक सक्षम दाता/सदस्य के रूप में आगे बढ़ सकते हैं।',
                                                    'الحمدللہ! آپ بطور صاحبِ استطاعت ممبر آگے بڑھ سکتے ہیں۔',
                                                    'Alhamdulillah! You can proceed as a contributing donor/member.'
                                                )}
                                            </Text>
                                        </View>
                                    )}

                                    {/* If Nisab No -> Help Type Selection */}
                                    {isMalikENisab === false && (
                                        <View style={s.helpSelectionContainer}>
                                            <Text style={[s.helpSectionLabel, { color: dynamicText }]}>
                                                {tr('आपको किस प्रकार की सहायता / इमदाद की आवश्यकता है? *', 'آپ کو کس قسم کی مدد / امداد کی ضرورت ہے؟ *', 'What kind of help / assistance do you need? *')}
                                            </Text>

                                            <View style={s.helpGrid}>
                                                {[
                                                    { id: 'Zakat', hi: 'ज़कात', ur: 'زکوٰۃ', en: 'Zakat', desc: tr('अनिवार्य इस्लामी सहायता', 'واجب مالی امداد', 'Mandatory relief') },
                                                    { id: 'Sadaka', hi: 'सदका', ur: 'صدقہ', en: 'Sadaka', desc: tr('सामान्य/आपात राहत', 'نفلی/ہنگامی امداد', 'Voluntary relief') },
                                                    { id: 'Fitra', hi: 'फ़ितरा', ur: 'فطرہ', en: 'Fitra', desc: tr('निर्वाह व ईद सहायता', 'عید و راشن امداد', 'Sustenance & Eid') },
                                                    { id: 'Other', hi: 'अन्य', ur: 'دیگر', en: 'Other', desc: tr('इलाज, राशन, फीस', 'علاج، راشن، تعلیم', 'Custom assistance') },
                                                ].map((item) => {
                                                    const isSelected = helpType === item.id;
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => setHelpType(item.id as any)}
                                                            style={[
                                                                s.helpCard,
                                                                isSelected
                                                                    ? [s.helpCardActive, { backgroundColor: isDark ? '#2e4a3c' : '#fef3c7', borderColor: '#d97706' }]
                                                                    : [s.helpCardIdle, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]
                                                            ]}
                                                        >
                                                            <View style={s.helpCardHeader}>
                                                                <Text style={[s.helpCardTitle, { color: dynamicText }]}>
                                                                    {tr(item.hi, item.ur, item.en)}
                                                                </Text>
                                                                <View style={[s.radioCircleSmall, isSelected && s.radioCircleActive]}>
                                                                    {isSelected && <View style={s.radioDotSmall} />}
                                                                </View>
                                                            </View>
                                                            <Text style={[s.helpCardDesc, { color: dynamicSubText }]}>
                                                                {item.desc}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            {/* Details if 'Other' */}
                                            {helpType === 'Other' && (
                                                <View style={s.helpDetailsBox}>
                                                    <Text style={[s.label, { color: dynamicSubText }]}>
                                                        {tr('सहायता का विवरण दर्ज करें *', 'درکار امداد کی تفصیل لکھیں *', 'Specify Details of Help Needed *')}
                                                    </Text>
                                                    <TextInput
                                                        style={[s.input, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                                        placeholder={tr('उदा. चिकित्सा खर्च, राशन, बच्चों की फीस', 'مثلاً علاج کا خرچہ، راشن', 'e.g. Medical expenses, ration, children fees')}
                                                        placeholderTextColor={placeholderColor}
                                                        value={helpDetails}
                                                        onChangeText={setHelpDetails}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Profile Picture Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('प्रोफ़ाइल फ़ोटो *', 'پروفائل تصویر *', 'Profile Photo *')}
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
                                                {tr('फ़ोटो संलग्न है', 'تصویر منسلک ہے', 'Photo Attached')}
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
                                        {tr('प्रोफ़ाइल फ़ोटो अपलोड करें *', 'پروفائل تصویر اپلوڈ کریں *', 'Upload Profile Photo *')}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {tr('फ़ोटो खींचें या गैलरी से चुनें', 'تصویر لیں یا گیلری سے منتخب کریں', 'Take photo or choose from gallery')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Aadhaar Front Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('आधार कार्ड - सामने (वैकल्पिक)', 'آدھار کارڈ - سامنے (اختیاری)', 'Aadhaar Front (Optional)')}
                            </Text>
                            {aadhaarFrontUri ? (
                                <View style={[s.previewCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#86efac' }]}>
                                    <Image source={{ uri: aadhaarFrontUri }} style={s.docPreview} />
                                    <View style={s.previewMeta}>
                                        <Text style={[s.previewFileName, { color: dynamicText }]} numberOfLines={1}>
                                            {aadhaarFrontFileName || 'aadhaar_front.jpg'}
                                        </Text>
                                        <View style={s.badgeAttached}>
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text style={s.badgeAttachedText}>
                                                {tr('आधार सामने का भाग संलग्न है', 'آدھار سامنے کا حصہ منسلک ہے', 'Aadhaar Front Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={s.previewActions}>
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('aadhaarFront')}
                                            style={[s.changeBtn, { backgroundColor: dynamicCardBg, borderColor: '#a7f3d0' }]}
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAadhaarFrontUri('');
                                                setAadhaarFrontFileName('');
                                            }}
                                            style={s.deleteBtn}
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('aadhaarFront')}
                                    style={[s.uploadBox, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.uploadIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <FileText color="#059669" size={20} />
                                    </View>
                                    <Text style={[s.uploadTitle, { color: dynamicText }]}>
                                        {tr('आधार सामने का भाग अपलोड करें', 'آدھار سامنے کا حصہ اپلوڈ کریں', 'Upload Aadhaar Front')}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {tr('आधार के सामने की साफ़ तस्वीर या स्कैन', 'آدھار کے سامنے کی صاف تصویر', 'Clear photo or scan of Aadhaar front')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Aadhaar Back Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('आधार कार्ड - पीछे (वैकल्पिक)', 'آدھار کارڈ - پیچھے (اختیاری)', 'Aadhaar Back (Optional)')}
                            </Text>
                            {aadhaarBackUri ? (
                                <View style={[s.previewCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: isDark ? '#059669' : '#86efac' }]}>
                                    <Image source={{ uri: aadhaarBackUri }} style={s.docPreview} />
                                    <View style={s.previewMeta}>
                                        <Text style={[s.previewFileName, { color: dynamicText }]} numberOfLines={1}>
                                            {aadhaarBackFileName || 'aadhaar_back.jpg'}
                                        </Text>
                                        <View style={s.badgeAttached}>
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text style={s.badgeAttachedText}>
                                                {tr('आधार पीछे का भाग संलग्न है', 'آدھار پیچھے کا حصہ منسلک ہے', 'Aadhaar Back Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={s.previewActions}>
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('aadhaarBack')}
                                            style={[s.changeBtn, { backgroundColor: dynamicCardBg, borderColor: '#a7f3d0' }]}
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAadhaarBackUri('');
                                                setAadhaarBackFileName('');
                                            }}
                                            style={s.deleteBtn}
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('aadhaarBack')}
                                    style={[s.uploadBox, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]}
                                    activeOpacity={0.7}
                                >
                                    <View style={[s.uploadIconCircle, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                        <FileText color="#059669" size={20} />
                                    </View>
                                    <Text style={[s.uploadTitle, { color: dynamicText }]}>
                                        {tr('आधार पीछे का भाग अपलोड करें', 'آدھار پیچھے کا حصہ اپلوڈ کریں', 'Upload Aadhaar Back')}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {tr('आधार के पीछे (पते वाले भाग) की साफ़ तस्वीर', 'آدھار کے پتے والے حصے کی تصویر', 'Clear photo of Aadhaar back (Address side)')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity onPress={handleNextStep1} style={s.primaryBtn}>
                            <Text style={s.primaryBtnText}>
                                {tr('आगे बढ़ें: ₹100 सदस्यता शुल्क', 'آگے بڑھیں: ₹100 ممبرشپ فیس', 'Proceed to Pay ₹100 Fee')}
                            </Text>
                            <ArrowRight color="#f0c868" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/sign-in')}
                            style={s.linkBtn}
                        >
                            <Text style={[s.linkText, { color: dynamicSubText }]}>
                                {tr('पहले से सदस्य हैं? ', 'پہلے سے ممبر ہیں؟ ', 'Already registered? ')}
                                <Text style={s.linkTextBold}>
                                    {tr('साइन इन करें', 'سائن ان کریں', 'Sign In')}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    STEP 2: Payment and Verification
                   ════════════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <View style={s.stepContainer}>
                        {/* Fee Banner */}
                        <View style={[s.feeBanner, { backgroundColor: isDark ? '#14281f' : '#fef9e7', borderColor: isDark ? '#2d5a42' : '#e6d3a3' }]}>
                            <View style={s.feeRow}>
                                <Text style={[s.feeBannerTitle, { color: isDark ? '#f8fafc' : '#0f3322' }]}>
                                    {tr('वार्षिक सदस्यता एकजुटता शुल्क', 'سالانہ ممبرشپ فیس', 'Annual Membership Solidarity Fee')}
                                </Text>
                                <Text style={s.feeAmount}>₹100</Text>
                            </View>
                            <Text style={[s.feeBannerDesc, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                                {tr(
                                    `यह ₹100 शुल्क आपकी सदस्यता को ${activeCommunity?.name} में सक्रिय करता है और आपातकालीन सहायता व मतदान का अधिकार देता है।`,
                                    `یہ فیس آپ کی ممبرشپ کو ${activeCommunity?.name} میں فعال کرتی ہے۔`,
                                    `Activates membership in ${activeCommunity?.name} for direct priority emergency relief.`
                                )}
                            </Text>
                        </View>

                        {/* Payment Tabs */}
                        <View style={[s.tabRow, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('UPI')}
                                style={[s.tab, paymentMethod === 'UPI' ? [s.tabActive, { backgroundColor: dynamicCardBg }] : s.tabInactive]}
                            >
                                <Text style={[s.tabText, paymentMethod === 'UPI' ? [s.tabTextActive, { color: '#0f3322' }] : [s.tabTextInactive, { color: dynamicSubText }]]}>
                                    {tr('UPI / QR स्कैन', 'UPI / QR اسکین', 'Instant UPI / QR')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('Bank Transfer')}
                                style={[s.tab, paymentMethod === 'Bank Transfer' ? [s.tabActive, { backgroundColor: dynamicCardBg }] : s.tabInactive]}
                            >
                                <Text style={[s.tabText, paymentMethod === 'Bank Transfer' ? [s.tabTextActive, { color: '#0f3322' }] : [s.tabTextInactive, { color: dynamicSubText }]]}>
                                    {tr('बैंक ट्रांसफर (NEFT)', 'بینک ٹرانسفر (NEFT)', 'Bank Transfer (NEFT)')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* UPI Panel */}
                        {paymentMethod === 'UPI' && (
                            <View style={s.darkPanel}>
                                <View style={s.qrBox}>
                                    <QrCode color="#0f172a" size={130} />
                                </View>
                                <Text style={s.upiLabel}>
                                    {tr('प्रत्यक्ष एस्क्रो के लिए UPI ID', 'براہ راست ادائیگی کے لیے UPI ID', 'UPI ID for Direct Escrow')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('mfct@okicici', 'UPI ID')}
                                    style={s.upiRow}
                                >
                                    <Text style={s.upiId}>mfct@okicici</Text>
                                    <Copy color="#34d399" size={16} />
                                </TouchableOpacity>
                                <Text style={s.upiHint}>
                                    {tr('Google Pay, PhonePe, Paytm या BHIM UPI द्वारा स्कैन करें', 'Google Pay, PhonePe, Paytm کے ذریعے اسکین کریں', 'Scan using Google Pay, PhonePe, Paytm, or BHIM UPI')}
                                </Text>
                            </View>
                        )}

                        {/* Bank Panel */}
                        {paymentMethod === 'Bank Transfer' && (
                            <View style={s.darkPanel}>
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('Mohammad Faeem Charitable Trust', tr('खाता नाम', 'کھاتہ نام', 'Account Name'))}
                                    style={s.bankRow}
                                >
                                    <Text style={s.bankLabel}>{tr('खाता नाम:', 'کھاتہ نام:', 'Account Name:')}</Text>
                                    <View style={s.copyRow}>
                                        <Text style={s.bankValueGreen}>Mohammad Faeem Charitable Trust</Text>
                                        <Copy color="#6ee7b7" size={13} />
                                    </View>
                                </TouchableOpacity>
                                <View style={s.bankDivider} />
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('ICICI Bank Ltd', tr('बैंक नाम', 'بینک نام', 'Bank Name'))}
                                    style={s.bankRow}
                                >
                                    <Text style={s.bankLabel}>{tr('बैंक का नाम:', 'بینک نام:', 'Bank Name:')}</Text>
                                    <View style={s.copyRow}>
                                        <Text style={s.bankValue}>ICICI Bank Ltd</Text>
                                        <Copy color="#6ee7b7" size={13} />
                                    </View>
                                </TouchableOpacity>
                                <View style={s.bankDivider} />
                                <TouchableOpacity
                                    onPress={() => copyToClipboard('000405018892', tr('खाता संख्या', 'اکاؤنٹ نمبر', 'Account Number'))}
                                    style={s.bankRow}
                                >
                                    <Text style={s.bankLabel}>{tr('खाता संख्या:', 'اکاؤنٹ نمبر:', 'Account Number:')}</Text>
                                    <View style={s.copyRow}>
                                        <Text style={s.bankValueGreen}>000405018892</Text>
                                        <Copy color="#6ee7b7" size={13} />
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
                                        <Copy color="#6ee7b7" size={13} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* UTR Input */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('12 अंकों का बैंक UTR / संदर्भ संख्या *', '12 ہندسوں کا UTR / ریفرنس نمبر *', '12-Digit Bank UTR / Transaction Ref No *')}
                            </Text>
                            <TextInput
                                style={[s.input, s.inputMono, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder, color: dynamicText }]}
                                placeholder={tr('उदा. 420199381029', 'مثال: 420199381029', 'e.g. 420199381029')}
                                placeholderTextColor={placeholderColor}
                                value={utrNumber}
                                onChangeText={setUtrNumber}
                            />
                        </View>

                        {/* Screenshot Upload */}
                        <View style={s.fieldGroup}>
                            <Text style={[s.label, { color: dynamicSubText }]}>
                                {tr('भुगतान रसीद / स्क्रीनशॉट *', 'ادائیگی کی رسید / اسکرین شاٹ *', 'Payment Screenshot / Receipt *')}
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
                                                {tr('भुगतान रसीद संलग्न है', 'رسید منسلک ہے', 'Payment Receipt Attached')}
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
                                        {tr('भुगतान रसीद अपलोड करने के लिए क्लिक करें *', 'ادائیگی کی رسید اپلوڈ کریں *', 'Click to upload payment receipt *')}
                                    </Text>
                                    <Text style={[s.uploadSubtitle, { color: dynamicSubText }]}>
                                        {tr('गैलरी या कैमरे से रसीद संलग्न करें', 'گیلری یا کیمرے سے رسید منسلک کریں', 'Attach receipt from gallery or camera')}
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
                                {tr(
                                    'मैंने ₹100 का भुगतान पूरा कर लिया है और MFCT सामुदायिक दिशानिर्देशों से सहमत हूँ।',
                                    'میں نے ₹100 کی ادائیگی مکمل کر لی ہے اور MFCT اصولوں سے متفق ہوں۔',
                                    'I have completed the ₹100 payment and agree to MFCT community guidelines.'
                                )}
                            </Text>
                        </TouchableOpacity>

                        {/* Action Buttons */}
                        <View style={s.actionRow}>
                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                style={[s.backSecondaryBtn, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
                            >
                                <Text style={[s.backSecondaryText, { color: dynamicText }]}>
                                    ← {tr('वापस', 'واپس', 'Back')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleFinishRegistration}
                                disabled={!isFeePaid || submitting}
                                style={[s.submitBtn, (!isFeePaid || submitting) ? s.submitBtnDisabled : s.submitBtnEnabled]}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#f0c868" size="small" />
                                    : <View style={s.rowCenter}>
                                        <Text style={s.submitBtnText}>
                                            {tr('सदस्यता पंजीकरण पूर्ण करें', 'ممبرشپ رجسٹریشن مکمل کریں', 'Complete Registration')}
                                        </Text>
                                        <ArrowRight color="#f0c868" size={16} />
                                    </View>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    STEP 3: Registration Success Screen
                   ════════════════════════════════════════════════════════════════ */}
                {step === 3 && (
                    <View style={s.successContainer}>
                        <View style={s.successIcon}>
                            <UserCheck color="#047857" size={48} />
                        </View>
                        <Text style={[s.successTitle, { color: dynamicText }]}>
                            {tr('पंजीकरण अनुरोध सबमिट हुआ!', 'درخواست کامیابی سے جمع ہوئی!', 'Registration Submitted!')}
                        </Text>
                        <Text style={[s.successSubtitle, { color: dynamicSubText }]}>
                            {tr(
                                `अल्हम्दुलिल्लाह! आप अब ${activeCommunity?.name} के एक पंजीकृत सदस्य हैं।`,
                                `الحمدللہ! آپ اب ${activeCommunity?.name} کے رجسٹرڈ ممبر بن چکے ہیں۔`,
                                `You are now a registered member of ${activeCommunity?.name}.`
                            )}
                        </Text>

                        {/* Trust Badges */}
                        <View style={s.badgesRow}>
                            {[
                                { icon: ShieldCheck, hi: 'सत्यापित सदस्य', ur: 'تصدیق شدہ ممبر', en: 'Verified Member' },
                                { icon: CheckCircle2, hi: 'UTR रिकॉर्ड', ur: 'UTR ریکارڈ', en: 'UTR Recorded' },
                                { icon: HandHeart, hi: 'राहत के पात्र', ur: 'امداد के اہل', en: 'Relief Eligible' },
                            ].map(({ icon: Icon, hi, ur, en }) => (
                                <View key={en} style={[s.trustBadge, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                                    <Icon color="#059669" size={16} />
                                    <Text style={[s.trustBadgeText, { color: dynamicText }]}>
                                        {tr(hi, ur, en)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity onPress={handleCompleteAndNavigate} style={s.primaryBtn}>
                            <Text style={s.primaryBtnText}>
                                {tr('होम डैशबोर्ड पर जाएं', 'ہوم ڈیش بورڈ پر جائیں', 'Go to Home Dashboard')}
                            </Text>
                            <ArrowRight color="#f0c868" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/sign-in')}
                            style={s.linkBtn}
                        >
                            <Text style={[s.linkText, { color: dynamicSubText }]}>
                                {tr('साइन इन पृष्ठ पर जाएं', 'سائن ان پر جائیں', 'Go to Sign In page')} →
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ════════════════════════════════════════════════════════════════
                MODALS: Media Picker, Religion Picker, Community Picker
               ════════════════════════════════════════════════════════════════ */}

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
                                        ? tr('प्रोफ़ाइल फ़ोटो अपलोड करें', 'پروفائل تصویر اپلوڈ کریں', 'Upload Profile Photo')
                                        : pickerTarget === 'aadhaarFront'
                                            ? tr('आधार कार्ड - सामने (Front)', 'آدھار کارڈ - سامنے', 'Aadhaar Card (Front)')
                                            : pickerTarget === 'aadhaarBack'
                                                ? tr('आधार कार्ड - पीछे (Back)', 'آدھار کارڈ - پیچھے', 'Aadhaar Card (Back)')
                                                : tr('भुगतान स्क्रीनशॉट अपलोड करें', 'ادائیگی کی رسید اپلوڈ کریں', 'Upload Payment Screenshot')}
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
                                        {tr('कैमरा का उपयोग करें', 'کیمرا استعمال کریں', 'Use Camera')}
                                    </Text>
                                    <Text style={[s.optionSub, { color: dynamicSubText }]}>
                                        {tr('नई तस्वीर लें', 'نئی تصویر لیں', 'Take a new photo')}
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
                                        {tr('गैलरी से चुनें', 'گیلری سے منتخب کریں', 'Choose from Gallery')}
                                    </Text>
                                    <Text style={[s.optionSub, { color: dynamicSubText }]}>
                                        {tr('फ़ाइल / छवि चुनें', 'فائل / تصویر منتخب کریں', 'Select file / image')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => setPickerTarget(null)}
                                style={[s.cancelBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                            >
                                <Text style={[s.cancelBtnText, { color: dynamicSubText }]}>
                                    {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Religion Picker Sheet Modal */}
            {showReligionPicker && (
                <Modal
                    visible={showReligionPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowReligionPicker(false)}
                >
                    <TouchableOpacity
                        style={s.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowReligionPicker(false)}
                    >
                        <View style={[s.modalSheet, { backgroundColor: dynamicCardBg }]}>
                            <View style={s.sheetHeader}>
                                <Text style={[s.sheetTitle, { color: dynamicText }]}>
                                    {tr('धर्म चुनें', 'مذہب منتخب کریں', 'Select Religion')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowReligionPicker(false)}
                                    style={[s.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                                >
                                    <X color={dynamicSubText} size={18} />
                                </TouchableOpacity>
                            </View>

                            <View style={s.pickerVerticalList}>
                                {[
                                    { id: 'Hindu', hi: 'हिन्दू (Hindu)', ur: 'ہندو (Hindu)', en: 'Hindu' },
                                    { id: 'Muslim', hi: 'मुस्लिम (Muslim)', ur: 'مسلم (Muslim)', en: 'Muslim' },
                                    { id: 'Sikh', hi: 'सिख (Sikh)', ur: 'سکھ (Sikh)', en: 'Sikh' },
                                    { id: 'Christian', hi: 'ईसाई (Christian)', ur: 'عیسائی (Christian)', en: 'Christian' },
                                ].map((item) => {
                                    const isSelected = religion === item.id;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => handleReligionChange(item.id as any)}
                                            style={[
                                                s.selectionItem,
                                                isSelected
                                                    ? [s.selectionItemActive, { backgroundColor: isDark ? '#14281f' : '#fef9e7', borderColor: '#d97706' }]
                                                    : [s.selectionItemIdle, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]
                                            ]}
                                        >
                                            <Text style={[s.selectionItemText, { color: dynamicText }]}>
                                                {tr(item.hi, item.ur, item.en)}
                                            </Text>
                                            {isSelected && <Check color="#059669" size={20} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowReligionPicker(false)}
                                style={[s.cancelBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                            >
                                <Text style={[s.cancelBtnText, { color: dynamicSubText }]}>
                                    {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Community Picker Modal */}
            {showCommunityPicker && (
                <Modal
                    visible={showCommunityPicker}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowCommunityPicker(false)}
                >
                    <TouchableOpacity
                        style={s.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowCommunityPicker(false)}
                    >
                        <View style={[s.pickerSheet, { backgroundColor: dynamicCardBg }]}>
                            <View style={[s.pickerHeader, { borderBottomColor: dynamicBorder }]}>
                                <Text style={[s.pickerTitle, { color: dynamicText }]}>
                                    {tr('अपना स्थानीय समुदाय चुनें', 'اپنی مقامی کمیونٹی منتخب کریں', 'Select Your Local Community')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowCommunityPicker(false)}
                                    style={[s.pickerClose, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                                >
                                    <X color={dynamicSubText} size={18} />
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
                                            style={[
                                                s.communityItem,
                                                isSelected
                                                    ? [s.communityItemActive, { backgroundColor: isDark ? '#14281f' : '#ecfdf5', borderColor: '#059669' }]
                                                    : [s.communityItemIdle, { backgroundColor: dynamicInputBg, borderColor: dynamicBorder }]
                                            ]}
                                        >
                                            <View style={s.flex1}>
                                                <Text style={[s.communityItemName, { color: dynamicText }]}>{item.name}</Text>
                                                <Text style={[s.communityItemSub, { color: dynamicSubText }]}>
                                                    {item.city} • {tr('प्रशासक:', 'ایڈمن:', 'Admin:')} {item.adminName}
                                                </Text>
                                            </View>
                                            {isSelected && <Check color="#059669" size={20} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    flex1: { flex: 1 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    // Header
    header: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 18, borderBottomWidth: 1 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    stepBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    stepBadgePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    stepBadgePillActive: { backgroundColor: '#0f3322' },
    stepBadgePillDone: { backgroundColor: '#dcfce7' },
    stepBadgePillIdle: { backgroundColor: '#e2e8f0' },
    stepBadgePillText: { fontSize: 11, fontWeight: '700' },
    stepBadgePillTextActive: { color: '#f0c868' },
    stepBadgePillTextDone: { color: '#166534' },
    stepBadgePillTextIdle: { color: '#64748b' },
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
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
    inputClean: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
    inputMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    eyeBtn: { paddingHorizontal: 6, paddingVertical: 12 },
    row: { flexDirection: 'row' },
    gap12: { width: 12 },
    // Pickers triggers
    pickerTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 },
    pickerTriggerText: { fontWeight: '500', fontSize: 14, flex: 1, marginRight: 8 },
    // Nisab Card
    nisabCard: {
        borderWidth: 1.5,
        borderRadius: 20,
        padding: 16,
        gap: 12,
    },
    nisabHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(217, 119, 6, 0.25)',
    },
    nisabTitle: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nisabContent: {
        gap: 10,
    },
    nisabQuestion: {
        fontSize: 13,
        fontWeight: '700',
    },
    nisabHint: {
        fontSize: 11,
        lineHeight: 16,
    },
    nisabOptionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    nisabOptionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    nisabOptionBtnIdle: {},
    nisabOptionBtnActive: {},
    nisabOptionText: {
        fontSize: 12,
        fontWeight: '700',
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#94a3b8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleActive: {
        borderColor: '#d97706',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#d97706',
    },
    nisabSuccessBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 4,
    },
    nisabSuccessText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
        lineHeight: 18,
    },
    helpSelectionContainer: {
        marginTop: 6,
        gap: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(217, 119, 6, 0.2)',
    },
    helpSectionLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    helpGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    helpCard: {
        width: '48.5%',
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        gap: 4,
    },
    helpCardIdle: {},
    helpCardActive: {},
    helpCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    helpCardTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    helpCardDesc: {
        fontSize: 10,
    },
    radioCircleSmall: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: '#94a3b8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#d97706',
    },
    helpDetailsBox: {
        gap: 6,
        marginTop: 4,
    },
    // Upload Box
    uploadBox: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
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
    // Buttons
    primaryBtn: {
        backgroundColor: '#0f3322',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryBtnText: {
        color: '#f0c868',
        fontWeight: '800',
        fontSize: 15,
    },
    linkBtn: {
        alignItems: 'center',
        marginTop: 4,
    },
    linkText: {
        fontSize: 12,
        fontWeight: '500',
    },
    linkTextBold: {
        color: '#0f3322',
        fontWeight: '800',
        textDecorationLine: 'underline',
    },
    // Fee banner
    feeBanner: {
        padding: 16,
        borderWidth: 1.5,
        borderRadius: 16,
        gap: 4,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feeBannerTitle: {
        fontWeight: '800',
        fontSize: 13,
        textTransform: 'uppercase',
    },
    feeAmount: {
        color: '#0f3322',
        fontWeight: '900',
        fontSize: 22,
    },
    feeBannerDesc: {
        fontSize: 12,
        lineHeight: 18,
    },
    // Tabs
    tabRow: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabActive: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    tabInactive: {
        backgroundColor: 'transparent',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tabTextActive: {},
    tabTextInactive: {},
    // Dark panel (UPI / Bank)
    darkPanel: {
        backgroundColor: '#0f3322',
        borderRadius: 20,
        padding: 20,
        gap: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(200,168,75,0.3)',
    },
    qrBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
    },
    upiLabel: {
        color: '#f0c868',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    upiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    upiId: {
        color: '#f0c868',
        fontWeight: '800',
        fontSize: 15,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    upiHint: {
        color: '#94a3b8',
        fontSize: 11,
        textAlign: 'center',
    },
    bankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    bankLabel: {
        color: '#94a3b8',
        fontSize: 12,
    },
    bankValue: {
        color: '#e2e8f0',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    bankValueGreen: {
        color: '#f0c868',
        fontWeight: '700',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    bankDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
    },
    copyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '65%',
    },
    // Checkbox
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    checkboxIdle: {},
    checkboxActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    checkLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 18,
    },
    // Action
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    backSecondaryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backSecondaryText: {
        fontWeight: '700',
        fontSize: 14,
    },
    submitBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnEnabled: {
        backgroundColor: '#0f3322',
    },
    submitBtnDisabled: {
        backgroundColor: '#cbd5e1',
    },
    submitBtnText: {
        color: '#f0c868',
        fontWeight: '800',
        fontSize: 14,
    },
    // Success
    successContainer: {
        padding: 24,
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
    },
    successIcon: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 4,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    trustBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    // Modal Sheets
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
    pickerVerticalList: {
        gap: 10,
        marginBottom: 16,
    },
    selectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    selectionItemIdle: {},
    selectionItemActive: {},
    selectionItemText: {
        fontSize: 14,
        fontWeight: '700',
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
    // Community Sheet
    pickerSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '75%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    pickerClose: {
        padding: 8,
        borderRadius: 20,
    },
    pickerList: {
        marginTop: 12,
    },
    communityItem: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    communityItemIdle: {},
    communityItemActive: {},
    communityItemName: {
        fontWeight: '700',
        fontSize: 14,
    },
    communityItemSub: {
        fontSize: 12,
        marginTop: 2,
    },
});
