import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    Image, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAppState } from '../../src/context/AppStateProvider';
import { AccountDetails, Community, User } from '../../src/types';
import { getCommunities } from '../../src/services/communityService';
import { getAccountDetails } from '../../src/services/adminService';
import { createUser } from '../../src/services/userService';
import { uploadImageToSupabase } from '../../src/services/storageService';
import { hashPassword } from '../../src/lib/auth';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
    Sparkles, ArrowLeft, ArrowRight, UserCheck, Eye, EyeOff,
    Upload, ChevronDown, Check, Copy, Camera, Image as ImageIcon,
    Trash2, FileText, CheckCircle2, AlertCircle, X, Globe, ShieldCheck, HeartHandshake,
    HandHeart, Building2, MapPin, Mail, Phone, Lock, User as UserIcon,
    Home, Building, Landmark
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
    const [fatherName, setFatherName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [houseNo, setHouseNo] = useState('');
    const [villageTown, setVillageTown] = useState('');
    const [postOffice, setPostOffice] = useState('');
    const [block, setBlock] = useState('');
    const [tehsil, setTehsil] = useState('');
    const [district, setDistrict] = useState('');
    const [state, setState] = useState('');
    const city = (villageTown.trim() || district.trim());
    const [religion, setReligion] = useState<'Hindu' | 'Muslim' | 'Sikh' | 'Christian' | ''>('');
    const [isMalikENisab, setIsMalikENisab] = useState<boolean | null>(null);
    const [helpType, setHelpType] = useState<'Zakat' | 'Sadaka' | 'Fitra' | 'Other' | ''>('');
    const [helpDetails, setHelpDetails] = useState('');
    const [communities, setCommunities] = useState<Community[]>([]);
    const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
    const [accountDetailsLoading, setAccountDetailsLoading] = useState(true);
    const [selectedCommunityId, setSelectedCommunityId] = useState('');
    const [showCommunityPicker, setShowCommunityPicker] = useState(false);
    const [showAllInPicker, setShowAllInPicker] = useState(false);
    const [showReligionPicker, setShowReligionPicker] = useState(false);

    // Media upload states
    const [avatarUri, setAvatarUri] = useState<string>('');
    const [avatarFileName, setAvatarFileName] = useState<string>('');

    const [aadhaarFrontUri, setAadhaarFrontUri] = useState<string>('');
    const [aadhaarFrontFileName, setAadhaarFrontFileName] = useState<string>('');

    const [aadhaarBackUri, setAadhaarBackUri] = useState<string>('');
    const [aadhaarBackFileName, setAadhaarBackFileName] = useState<string>('');

    const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('Bank Transfer');
    const [utrNumber, setUtrNumber] = useState('');
    const [screenshotUri, setScreenshotUri] = useState<string>('');
    const [screenshotFileName, setScreenshotFileName] = useState<string>('');
    const [isFeePaid, setIsFeePaid] = useState(false);

    // Media picker modal
    const [pickerTarget, setPickerTarget] = useState<'avatar' | 'aadhaarFront' | 'aadhaarBack' | 'screenshot' | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const [registeredUser, setRegisteredUser] = useState<User | null>(null);
    const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    const saveDraftState = async (currentTarget?: string) => {
        try {
            const draft = {
                step,
                fullName,
                fatherName,
                phone,
                email,
                password,
                houseNo,
                villageTown,
                postOffice,
                block,
                tehsil,
                district,
                state,
                religion,
                isMalikENisab,
                helpType,
                helpDetails,
                selectedCommunityId,
                paymentMethod,
                utrNumber,
                isFeePaid,
                avatarUri,
                avatarFileName,
                aadhaarFrontUri,
                aadhaarFrontFileName,
                aadhaarBackUri,
                aadhaarBackFileName,
                screenshotUri,
                screenshotFileName,
            };
            await AsyncStorage.setItem('@signup_form_draft', JSON.stringify(draft));
            if (currentTarget) {
                await AsyncStorage.setItem('@camera_active_target', currentTarget);
                await AsyncStorage.setItem('@camera_launch_origin', '/(auth)/sign-up');
            }
        } catch (e) {
            console.warn('Failed to save sign-up draft:', e);
        }
    };

    // Restore draft form & recover camera asset if Android killed activity
    useEffect(() => {
        const restoreDraftAndPendingImage = async () => {
            try {
                const draftStr = await AsyncStorage.getItem('@signup_form_draft');
                if (draftStr) {
                    const d = JSON.parse(draftStr);
                    if (d.step) setStep(d.step);
                    if (d.fullName) setFullName(d.fullName);
                    if (d.fatherName) setFatherName(d.fatherName);
                    if (d.phone) setPhone(d.phone);
                    if (d.email) setEmail(d.email);
                    if (d.password) setPassword(d.password);
                    if (d.houseNo) setHouseNo(d.houseNo);
                    if (d.villageTown) setVillageTown(d.villageTown);
                    if (d.postOffice) setPostOffice(d.postOffice);
                    if (d.block) setBlock(d.block);
                    if (d.tehsil) setTehsil(d.tehsil);
                    if (d.district) setDistrict(d.district);
                    if (d.state) setState(d.state);
                    if (d.religion) setReligion(d.religion);
                    if (d.isMalikENisab !== undefined) setIsMalikENisab(d.isMalikENisab);
                    if (d.helpType) setHelpType(d.helpType);
                    if (d.helpDetails) setHelpDetails(d.helpDetails);
                    if (d.selectedCommunityId) setSelectedCommunityId(d.selectedCommunityId);
                    if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
                    if (d.utrNumber) setUtrNumber(d.utrNumber);
                    if (d.isFeePaid !== undefined) setIsFeePaid(d.isFeePaid);
                    if (d.avatarUri) setAvatarUri(d.avatarUri);
                    if (d.avatarFileName) setAvatarFileName(d.avatarFileName);
                    if (d.aadhaarFrontUri) setAadhaarFrontUri(d.aadhaarFrontUri);
                    if (d.aadhaarFrontFileName) setAadhaarFrontFileName(d.aadhaarFrontFileName);
                    if (d.aadhaarBackUri) setAadhaarBackUri(d.aadhaarBackUri);
                    if (d.aadhaarBackFileName) setAadhaarBackFileName(d.aadhaarBackFileName);
                    if (d.screenshotUri) setScreenshotUri(d.screenshotUri);
                    if (d.screenshotFileName) setScreenshotFileName(d.screenshotFileName);
                }

                if (Platform.OS === 'android') {
                    const pendingResult = await ImagePicker.getPendingResultAsync();
                    const pendingTarget = await AsyncStorage.getItem('@camera_active_target');

                    await AsyncStorage.removeItem('@camera_launch_origin');
                    await AsyncStorage.removeItem('@camera_active_target');

                    if (
                        pendingResult &&
                        !('canceled' in pendingResult && pendingResult.canceled) &&
                        'assets' in pendingResult &&
                        pendingResult.assets &&
                        pendingResult.assets.length > 0
                    ) {
                        const asset = pendingResult.assets[0];
                        const defaultName = pendingTarget === 'avatar'
                            ? 'profile_photo.jpg'
                            : pendingTarget === 'aadhaarFront'
                                ? 'aadhaar_front.jpg'
                                : pendingTarget === 'aadhaarBack'
                                    ? 'aadhaar_back.jpg'
                                    : 'payment_receipt.jpg';
                        const fname = asset.fileName || defaultName;

                        if (pendingTarget === 'avatar') {
                            setAvatarUri(asset.uri);
                            setAvatarFileName(fname);
                            showToast(tr('प्रोफ़ाइल फ़ोटो कैप्चर की गई!', 'پروفائل تصویر لی گئی!', 'Profile photo captured!'), 'success');
                        } else if (pendingTarget === 'aadhaarFront') {
                            setAadhaarFrontUri(asset.uri);
                            setAadhaarFrontFileName(fname);
                            showToast(tr('आधार सामने का भाग कैप्चर किया गया!', 'آدھار سامنے کا حصہ لیا گیا!', 'Aadhaar front captured!'), 'success');
                        } else if (pendingTarget === 'aadhaarBack') {
                            setAadhaarBackUri(asset.uri);
                            setAadhaarBackFileName(fname);
                            showToast(tr('आधार पीछे का भाग कैप्चर किया गया!', 'آدھار پیچھے کا حصہ لیا گیا!', 'Aadhaar back captured!'), 'success');
                        } else if (pendingTarget === 'screenshot') {
                            setScreenshotUri(asset.uri);
                            setScreenshotFileName(fname);
                            showToast(tr('रसीद कैप्चर की गई!', 'رسید لی گئی!', 'Receipt captured!'), 'success');
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to restore sign up draft or camera asset:', e);
            }
        };

        restoreDraftAndPendingImage();
    }, []);

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const copyToClipboard = (text: string, label: string) => {
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(text);
            }
        } catch { }
        showToast(tr(`${label} कॉपी किया गया!`, `${label} کاپی ہو گیا!`, `${label} copied!`), 'success');
    };

    useEffect(() => {
        getCommunities().then((data) => {
            setCommunities(data);
            if (data.length > 0) setSelectedCommunityId(data[0].id);
        }).catch(console.error);

        getAccountDetails().then((data) => {
            setAccountDetails(data[0] || null);
        }).catch(console.error).finally(() => {
            setAccountDetailsLoading(false);
        });
    }, []);

    // Filter communities strictly by village/town or district typed by user
    const filteredCommunities = useMemo(() => {
        const qCity = villageTown.trim().toLowerCase();
        const qDist = district.trim().toLowerCase();
        if (!qCity && !qDist) return communities;
        return communities.filter((c) => {
            const cCity = (c.city || '').trim().toLowerCase();
            const cDist = (c.district || '').trim().toLowerCase();
            const matchCity = qCity.length > 0 && cCity.length > 0 && (cCity.includes(qCity) || qCity.includes(cCity));
            const matchDist = qDist.length > 0 && cDist.length > 0 && (cDist.includes(qDist) || qDist.includes(cDist));
            const crossCity = qDist.length > 0 && cCity.length > 0 && (cCity.includes(qDist) || qDist.includes(cCity));
            const crossDist = qCity.length > 0 && cDist.length > 0 && (cDist.includes(qCity) || qCity.includes(cDist));
            return matchCity || matchDist || crossCity || crossDist;
        });
    }, [communities, villageTown, district]);

    const hasCitySpecificCommunities = useMemo(() => {
        return city.trim().length > 0 && filteredCommunities.length > 0;
    }, [city, filteredCommunities]);

    // Auto-select first matching community when city changes
    useEffect(() => {
        if (filteredCommunities.length > 0) {
            const exists = filteredCommunities.some((c) => c.id === selectedCommunityId);
            if (!exists) {
                setSelectedCommunityId(filteredCommunities[0].id);
            }
        } else if (communities.length > 0) {
            const exists = communities.some((c) => c.id === selectedCommunityId);
            if (!exists) {
                setSelectedCommunityId(communities[0].id);
            }
        }
    }, [filteredCommunities, communities, selectedCommunityId]);

    const activeCommunity =
        filteredCommunities.find((c) => c.id === selectedCommunityId) ||
        communities.find((c) => c.id === selectedCommunityId) ||
        communities[0];

    const bankDetails = [
        {
            label: tr('खाताधारक का नाम:', 'کھاتہ دار کا نام:', 'Account Holder:'),
            value: accountDetails?.account_holder_name || '',
        },
        {
            label: tr('बैंक का नाम:', 'بینک کا نام:', 'Bank Name:'),
            value: accountDetails?.bank_name || '',
        },
        {
            label: tr('शाखा का नाम:', 'برانچ کا نام:', 'Branch Name:'),
            value: accountDetails?.branch_name || '',
        },
        {
            label: tr('खाता संख्या:', 'اکاؤنٹ نمبر:', 'Account Number:'),
            value: accountDetails?.account_number || '',
        },
        {
            label: tr('IFSC कोड:', 'آئی ایف ایس سی کوڈ:', 'IFSC Code:'),
            value: accountDetails?.ifsc_code || '',
        },
    ].filter((detail) => detail.value.trim().length > 0);

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

        // Persist draft form state and camera lock flags before opening picker
        await saveDraftState(target);

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
                    quality: 0.7,
                });

                await AsyncStorage.removeItem('@camera_launch_origin');
                await AsyncStorage.removeItem('@camera_active_target');

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
                    quality: 0.7,
                });

                await AsyncStorage.removeItem('@camera_launch_origin');
                await AsyncStorage.removeItem('@camera_active_target');

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
        if (!email.trim()) {
            showToast(
                tr(
                    'ईमेल फ़ील्ड आवश्यक है। कृपया अपना ईमेल पता दर्ज करें।',
                    'ای میل کا خانہ ضروری ہے۔ براہ کرم اپنا ای میل درج کریں۔',
                    'Email field is required. Please enter your email address.'
                ),
                'error'
            );
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            showToast(
                tr(
                    'कृपया एक वैध ईमेल पता दर्ज करें।',
                    'براہ کرم درست ای میل درج کریں۔',
                    'Please enter a valid email address.'
                ),
                'error'
            );
            return;
        }

        const missingFields: string[] = [];
        if (!fullName.trim()) missingFields.push(tr('पूरा नाम', 'مکمل نام', 'Full Name'));
        if (!fatherName.trim()) missingFields.push(tr('पिता का नाम', 'والد کا نام', "Father's Name"));
        if (!phone.trim()) missingFields.push(tr('मोबाइल नंबर', 'موبائل نمبر', 'Mobile Number'));
        if (!password) missingFields.push(tr('पासवर्ड', 'پاس ورڈ', 'Password'));
        if (!houseNo.trim()) missingFields.push(tr('मकान संख्या (H.No.)', 'مکان نمبر (H.No.)', 'House No. (H.No.)'));
        if (!villageTown.trim()) missingFields.push(tr('गाँव / कस्बा (Village / Town)', 'گاؤں / قصبہ (Village / Town)', 'Village / Town'));
        if (!postOffice.trim()) missingFields.push(tr('डाकघर (Post Office)', 'پوسٹ آفس (Post Office)', 'Post Office'));
        if (!block.trim()) missingFields.push(tr('ब्लॉक (Block)', 'بلاک (Block)', 'Block'));
        if (!tehsil.trim()) missingFields.push(tr('तहसील (Tehsil)', 'تحصیل (Tehsil)', 'Tehsil'));
        if (!district.trim()) missingFields.push(tr('ज़िला (District)', 'ضلع (District)', 'District'));
        if (!state.trim()) missingFields.push(tr('राज्य (State)', 'ریاست (State)', 'State'));
        if (!religion) missingFields.push(tr('धर्म', 'مذہب', 'Religion'));
        if (!avatarUri) missingFields.push(tr('प्रोफ़ाइल फ़ोटो', 'پروفائل تصویر', 'Profile Photo'));
        if (!aadhaarFrontUri) missingFields.push(tr('आधार कार्ड (सामने)', 'آدھار کارڈ (सामने)', 'Aadhaar Card (Front)'));
        if (!aadhaarBackUri) missingFields.push(tr('आधार कार्ड (पीछे)', 'آدھار کارڈ (पीछे)', 'Aadhaar Card (Back)'));

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
            // Upload local images to Supabase storage IMAGES bucket so they get public HTTPS URLs
            const [uploadedAvatar, uploadedScreenshot, uploadedAadhaarFront, uploadedAadhaarBack] = await Promise.all([
                avatarUri ? uploadImageToSupabase(avatarUri, 'users') : Promise.resolve(''),
                screenshotUri ? uploadImageToSupabase(screenshotUri, 'receipts') : Promise.resolve(''),
                aadhaarFrontUri ? uploadImageToSupabase(aadhaarFrontUri, 'kyc') : Promise.resolve(''),
                aadhaarBackUri ? uploadImageToSupabase(aadhaarBackUri, 'kyc') : Promise.resolve(''),
            ]);

            const hashedPassword = await hashPassword(password);
            const userCity = (villageTown.trim() || district.trim() || activeCommunity.city || '').trim();
            const fullAddress = [
                houseNo ? `H.No: ${houseNo.trim()}` : '',
                villageTown ? `Village/Town: ${villageTown.trim()}` : '',
                postOffice ? `PO: ${postOffice.trim()}` : '',
                block ? `Block: ${block.trim()}` : '',
                tehsil ? `Tehsil: ${tehsil.trim()}` : '',
                district ? `Dist: ${district.trim()}` : '',
                state ? `State: ${state.trim()}` : ''
            ].filter(Boolean).join(', ');

            const newMember: User = {
                id: `usr_new_${Date.now()}`,
                name: fullName.trim(),
                fatherName: fatherName.trim(),
                father_name: fatherName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                city: userCity,
                state: state.trim(),
                address: fullAddress,
                houseNo: houseNo.trim(),
                house_no: houseNo.trim(),
                villageTown: villageTown.trim(),
                village_town: villageTown.trim(),
                postOffice: postOffice.trim(),
                post_office: postOffice.trim(),
                block: block.trim(),
                tehsil: tehsil.trim(),
                district: district.trim(),
                role: 'member',
                avatar: uploadedAvatar || avatarUri,
                communityId: activeCommunity.id,
                communityName: activeCommunity.name,
                membershipId: '',
                membershipFee: 100,
                status: 'pending',
                isVerified: false,
                joinDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                passwordHash: hashedPassword,
                paymentMethod: paymentMethod,
                paymentUtr: utrNumber.trim() || undefined,
                paymentScreenshotUrl: uploadedScreenshot || screenshotUri || undefined,
                aadhaarFrontUrl: uploadedAadhaarFront || aadhaarFrontUri || undefined,
                aadhaarBackUrl: uploadedAadhaarBack || aadhaarBackUri || undefined,
                religion: religion || undefined,
                isMalikENisab: religion === 'Muslim' ? (isMalikENisab ?? undefined) : undefined,
                is_malik_e_nisab: religion === 'Muslim' ? (isMalikENisab ?? undefined) : undefined,
                helpType: religion === 'Muslim' && isMalikENisab === false ? helpType || undefined : undefined,
                help_type: religion === 'Muslim' && isMalikENisab === false ? helpType || undefined : undefined,
                helpDetails: religion === 'Muslim' && isMalikENisab === false && helpType === 'Other' ? helpDetails.trim() || undefined : undefined,
                help_details: religion === 'Muslim' && isMalikENisab === false && helpType === 'Other' ? helpDetails.trim() || undefined : undefined,
            };

            const created = await createUser({ ...newMember });
            const finalUser = created || newMember;

            setRegisteredUser(finalUser);
            setStep(3);

            // Clean up drafts from storage upon successful registration
            try {
                await AsyncStorage.removeItem('@signup_form_draft');
                await AsyncStorage.removeItem('@camera_active_target');
                await AsyncStorage.removeItem('@camera_launch_origin');
            } catch { }

            // Auto redirect to Under Review screen after allowing user to view Step 3
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
            redirectTimerRef.current = setTimeout(async () => {
                await handleCompleteAndNavigate(finalUser);
            }, 3000);
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err?.code === '23505' && (err?.message?.includes('users_email_key') || err?.details?.includes('email'))) {
                showToast(
                    tr('यह ईमेल पता पहले से पंजीकृत है। कृपया दूसरा ईमेल दर्ज करें।', 'یہ ای میل ایڈریس پہلے سے رجسٹرڈ ہے۔ براہ کرم دوسرا ای میل درج کریں۔', 'This email is already registered. Please use another email.'),
                    'error'
                );
            } else if (err?.code === '23505' && (err?.message?.includes('phone') || err?.details?.includes('phone'))) {
                showToast(
                    tr('यह फोन नंबर पहले से पंजीकृत है।', 'یہ فون نمبر پہلے سے رجسٹرڈ ہے۔', 'This phone number is already registered.'),
                    'error'
                );
            } else {
                showToast(
                    tr('पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।', 'رجسٹریشن ناکام رہی۔ دوبارہ کوشش کریں۔', 'Registration failed. Please try again.'),
                    'error'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCompleteAndNavigate = async (userOverride?: User) => {
        if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
        }
        const userToSave = userOverride || registeredUser;
        if (userToSave) {
            await handleRegisterSession(userToSave);
        }
        try {
            await AsyncStorage.removeItem('@signup_form_draft');
            await AsyncStorage.removeItem('@camera_active_target');
            await AsyncStorage.removeItem('@camera_launch_origin');
        } catch { }
        router.replace('/(auth)/under-review');
    };

    const dynamicSubText = isDark ? '#94a3b8' : '#64748b';
    const placeholderColor = isDark ? '#64748b' : '#94a3b8';

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#f8f6f1] dark:bg-[#020617]"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View className="border-b border-slate-200 bg-white px-5 pb-[18px] pt-12 dark:border-slate-800 dark:bg-slate-900">
                <View className="mb-3 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => {
                            if (step > 1 && step < 3) {
                                setStep((step - 1) as 1 | 2);
                            } else {
                                router.back();
                            }
                        }}
                        className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    >
                        <ArrowLeft color={dynamicSubText} size={20} />
                    </TouchableOpacity>

                    {/* Stepper badge indicator */}
                    {step < 3 && (
                        <View className="flex-row items-center gap-1.5">
                            <View className={`rounded-xl px-2.5 py-1 ${step === 1 ? 'bg-[#0f3322]' : 'bg-green-100'}`}>
                                <Text className={`text-[11px] font-bold ${step === 1 ? 'text-[#f0c868]' : 'text-green-800'}`}>
                                    1. {tr('व्यक्तिगत विवरण', 'ذاتی معلومات', 'Personal Info')}
                                </Text>
                            </View>
                            <View className={`rounded-xl px-2.5 py-1 ${step === 2 ? 'bg-[#0f3322]' : 'bg-slate-200'}`}>
                                <Text className={`text-[11px] font-bold ${step === 2 ? 'text-[#f0c868]' : 'text-slate-500'}`}>
                                    2. {tr('₹100 शुल्क', 'فیس ادائیگی', '₹100 Fee')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View className="mb-2 flex-row self-start items-center gap-1.5 rounded-full border border-amber-600/40 bg-amber-500/[0.15] px-3 py-1">
                    <Sparkles color="#d97706" size={14} />
                    <Text className={`text-[11px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        {tr('सदस्यता एकजुटता कार्यक्रम', 'ممبرشپ یکجہتی پروگرام', '₹100 Membership Solidarity Program')}
                    </Text>
                </View>
                <Text className={`text-[22px] font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                    {step === 1 && tr('सदस्यता पंजीकरण', 'ممبرشپ رجسٹریشن', 'Member Registration')}
                    {step === 2 && tr('सदस्यता शुल्क भुगतान', 'ممبرشپ فیس ادائیگی', 'Solidarity Fee Payment')}
                    {step === 3 && tr('पंजीकरण पूर्ण हुआ!', 'رجسٹریشن مکمل ہو گئی!', 'Registration Complete!')}
                </Text>
                <Text className={`mt-1 text-xs leading-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {step === 1 && tr('कृपया अपना व्यक्तिगत, पते व धर्म का विवरण दर्ज करें।', 'براہ کرم ذاتی، رہائشی و مذہبی تفصیلات درج کریں۔', 'Enter your personal details to create your verified member profile.')}
                    {step === 2 && tr('₹100 की वार्षिक सदस्यता शुल्क का भुगतान पूरा करें।', 'سالانہ ممبرشپ کے लिए ₹100 ادا کریں۔', 'Complete the ₹100 annual solidarity fee via UPI or Direct Bank Transfer.')}
                    {step === 3 && tr('आपका अनुरोध सफलतापूर्वक दर्ज कर लिया गया है।', 'آپ کی ممبرشپ کامیابی سے درج کر لی گئی ہے۔', 'Your registration request has been submitted successfully.')}
                </Text>
            </View>

            {/* Toast Notification */}
            {toast && (
                <View className={`mx-4 mt-3 rounded-xl border p-3 ${toast.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <Text className={`text-xs font-bold ${toast.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                        {toast.type === 'error' ? '⚠️ ' : '✓ '}
                        {toast.message}
                    </Text>
                </View>
            )}

            <ScrollView contentContainerClassName="flex-grow pb-10" keyboardShouldPersistTaps="handled">

                {/* ════════════════════════════════════════════════════════════════
                    STEP 1: Personal Details & Islamic Welfare Declaration
                   ════════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <View className="gap-4 p-5">
                        {/* Full Name */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('पूरा नाम (आधार के अनुसार) *', 'مکمل نام (آدھار کے مطابق) *', 'Full Name (as per ID) *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <UserIcon color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. मोहम्मद तारिक', 'مثال: محمد طارق', 'e.g. Mohammad Tariq')}
                                    placeholderTextColor={placeholderColor}
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        {/* Father's Name */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('पिता का नाम *', 'والد کا نام *', "Father's Name *")}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <UserIcon color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('पिता का नाम दर्ज करें', 'والد کا نام درج کریں', "Enter father's name")}
                                    placeholderTextColor={placeholderColor}
                                    value={fatherName}
                                    onChangeText={setFatherName}
                                />
                            </View>
                        </View>

                        {/* Mobile Number */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('मोबाइल नंबर *', 'موبائل نمبر *', 'Mobile Number *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Phone color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
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
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('ईमेल पता *', 'ای میل ایڈریس *', 'Email Address *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Mail color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
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
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('पासवर्ड बनाएं *', 'پاس ورڈ بنائیں *', 'Create Password *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Lock color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('कम से कम 6 अक्षर', 'کم از کم 6 حروف', 'Min. 6 characters')}
                                    placeholderTextColor={placeholderColor}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    className="px-1.5 py-3"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff color={placeholderColor} size={18} />
                                        : <Eye color={placeholderColor} size={18} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Residential Address Details */}
                        <View className="mt-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                            <Text className={`text-xs font-bold uppercase tracking-[0.6px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {tr('स्थानीय पता विवरण *', 'رہائشی پتے کی تفصیلات *', 'Residential Address Details *')}
                            </Text>
                            <Text className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('कृपया अपने आधार कार्ड के अनुसार संपूर्ण पता भरें', 'براہ کرم آدھار کارڈ کے مطابق مکمل پتہ درج کریں', 'Please enter your complete address as per Aadhaar')}
                            </Text>
                        </View>

                        {/* House No */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('मकान संख्या (H.No.) *', 'مکان نمبر (H.No.) *', 'House No. (H.No.) *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Home color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. 124/B या गली नं. 4', 'مثال: 124/B', 'e.g. 124/B or Flat 4')}
                                    placeholderTextColor={placeholderColor}
                                    value={houseNo}
                                    onChangeText={setHouseNo}
                                />
                            </View>
                        </View>

                        {/* Village / Town */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('गाँव / कस्बा (Village / Town) *', 'گاؤں / قصبہ (Village / Town) *', 'Village / Town *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Building2 color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. रामपुर', 'مثال: رام پور', 'e.g. Rampur')}
                                    placeholderTextColor={placeholderColor}
                                    value={villageTown}
                                    onChangeText={setVillageTown}
                                />
                            </View>
                        </View>

                        {/* Post Office */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('डाकघर (Post Office) *', 'پوسٹ آفس (Post Office) *', 'Post Office *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Mail color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. मुख्य डाकघर', 'مثال: ڈاکخانہ', 'e.g. Head Post Office')}
                                    placeholderTextColor={placeholderColor}
                                    value={postOffice}
                                    onChangeText={setPostOffice}
                                />
                            </View>
                        </View>

                        {/* Block */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('ब्लॉक / प्रखंड (Block) *', 'بلاک (Block) *', 'Block *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Building color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. सदर', 'مثال: صدر', 'e.g. Sadar')}
                                    placeholderTextColor={placeholderColor}
                                    value={block}
                                    onChangeText={setBlock}
                                />
                            </View>
                        </View>

                        {/* Tehsil */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('तहसील (Tehsil) *', 'تحصیل (Tehsil) *', 'Tehsil *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <Landmark color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. सदर तहसील', 'مثال: تحصیل صدر', 'e.g. Sadar Tehsil')}
                                    placeholderTextColor={placeholderColor}
                                    value={tehsil}
                                    onChangeText={setTehsil}
                                />
                            </View>
                        </View>

                        {/* District */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('ज़िला (District) *', 'ضلع (District) *', 'District *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <MapPin color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. बरेली', 'مثال: بریلی', 'e.g. Bareilly')}
                                    placeholderTextColor={placeholderColor}
                                    value={district}
                                    onChangeText={setDistrict}
                                />
                            </View>
                        </View>

                        {/* State */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('राज्य (State) *', 'ریاست (State) *', 'State *')}
                            </Text>
                            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-800">
                                <MapPin color={placeholderColor} size={18} />
                                <TextInput
                                    className={`flex-1 px-2 py-3 text-sm ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                    placeholder={tr('उदा. उत्तर प्रदेश', 'مثال: اتر پردیش', 'e.g. Uttar Pradesh')}
                                    placeholderTextColor={placeholderColor}
                                    value={state}
                                    onChangeText={setState}
                                />
                            </View>
                        </View>

                        {/* Local Community & Religion Selectors */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('स्थानीय समुदाय *', 'مقامی کمیونٹی *', 'Local Community *')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAllInPicker(false);
                                    setShowCommunityPicker(true);
                                }}
                                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800"
                            >
                                <Text className={`mr-2 flex-1 text-sm font-medium ${activeCommunity ? (isDark ? 'text-slate-50' : 'text-slate-900') : (isDark ? 'text-slate-500' : 'text-slate-400')}`} numberOfLines={1}>
                                    {activeCommunity ? `${activeCommunity.name} (${activeCommunity.city})` : tr('समुदाय चुनें', 'کمیونٹی منتخب کریں', 'Select Community')}
                                </Text>
                                <ChevronDown color={placeholderColor} size={18} />
                            </TouchableOpacity>

                            {city.trim() ? (
                                hasCitySpecificCommunities ? (
                                    <View className="mt-1 flex-row items-center gap-1">
                                        <CheckCircle2 color="#10b981" size={13} />
                                        <Text className="text-[11px] font-semibold text-emerald-500">
                                            {tr(
                                                `"${city.trim()}" के लिए ${filteredCommunities.length} समुदाय उपलब्ध`,
                                                `"${city.trim()}" کے لیے ${filteredCommunities.length} کمیونٹیز دستیاب`,
                                                `${filteredCommunities.length} communities available for "${city.trim()}"`
                                            )}
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="mt-1 flex-row items-center gap-1">
                                        <AlertCircle color={isDark ? '#fbbf24' : '#d97706'} size={13} />
                                        <Text className={`text-[11px] font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                            {tr(
                                                `"${city.trim()}" के लिए कोई विशिष्ट समुदाय नहीं, सभी दिखाए जा रहे हैं`,
                                                `"${city.trim()}" کے لیے کوئی مخصوص کمیونٹی نہیں، تمام دکھائی جا رہی ہیں`,
                                                `No specific community for "${city.trim()}", showing all communities`
                                            )}
                                        </Text>
                                    </View>
                                )
                            ) : null}
                        </View>

                        {/* Religion Field */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('धर्म *', 'مذہب *', 'Religion *')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowReligionPicker(true)}
                                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800"
                            >
                                <Text className={`mr-2 flex-1 text-sm font-medium ${religion ? (isDark ? 'text-slate-50' : 'text-slate-900') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
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
                            <View className="gap-3 rounded-[20px] border border-amber-200 bg-[#fcf9f2] p-4 dark:border-emerald-900 dark:bg-[#14281f]">
                                <View className="flex-row items-center gap-2 border-b border-amber-600/25 pb-2.5">
                                    <Sparkles color="#d97706" size={16} />
                                    <Text className={`text-[13px] font-extrabold uppercase tracking-[0.5px] ${isDark ? 'text-[#f0c868]' : 'text-[#0f3322]'}`}>
                                        {tr('इस्लामी कल्याण एवं निसब घोषणा', 'اسلامی فلاحی و نصاب اقرار نامہ', 'Islamic Welfare & Nisab Declaration')}
                                    </Text>
                                </View>

                                <View className="gap-2.5">
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('क्या आप मालिक-ए-निसब (साहिब-ए-निसब) हैं? *', 'کیا آپ صاحبِ نصاب / مالکِ نصاب ہیں؟ *', 'Are you Malik-e-Nisab (Sahib-e-Nisab)? *')}
                                    </Text>
                                    <Text className={`text-[11px] leading-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr(
                                            'क्या आपके पास बुनियादी ज़रूरतों के अलावा 52.5 तोले चांदी (या इसके बराबर नकदी/माल) मौजूद है?',
                                            'کیا آپ کے پاس اپنی بنیادی ضروریات سے زائد ساڑھے باون تولہ چاندی (یا مساوی مال/رقم) موجود ہے؟',
                                            'Do you possess wealth exceeding the Nisab threshold (52.5 tolas silver / equivalent value)?'
                                        )}
                                    </Text>

                                    <View className="mt-1 flex-row gap-2.5">
                                        <TouchableOpacity
                                            onPress={() => handleMalikENisabChange(true)}
                                            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-2 py-3 ${isMalikENisab === true ? 'border-amber-600 bg-amber-100 dark:bg-emerald-900' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                                        >
                                            <View className={`h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${isMalikENisab === true ? 'border-amber-600' : 'border-slate-400'}`}>
                                                {isMalikENisab === true && <View className="h-2 w-2 rounded-full bg-amber-600" />}
                                            </View>
                                            <Text className={`text-xs font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                {tr('हाँ (मालिक-ए-निसब)', 'ہاں (صاحبِ نصاب)', 'Yes (Malik-e-Nisab)')}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleMalikENisabChange(false)}
                                            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-2 py-3 ${isMalikENisab === false ? 'border-amber-600 bg-amber-100 dark:bg-emerald-900' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                                        >
                                            <View className={`h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${isMalikENisab === false ? 'border-amber-600' : 'border-slate-400'}`}>
                                                {isMalikENisab === false && <View className="h-2 w-2 rounded-full bg-amber-600" />}
                                            </View>
                                            <Text className={`text-xs font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                {tr('नहीं (गैर-निसबदार)', 'نہیں (غیر نصاب)', 'No (Non-Nisab)')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* If Nisab Yes */}
                                    {isMalikENisab === true && (
                                        <View className="mt-1 flex-row items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950">
                                            <CheckCircle2 color="#059669" size={18} />
                                            <Text className="flex-1 text-xs font-semibold leading-[18px] text-emerald-800 dark:text-emerald-300">
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
                                        <View className="mt-1.5 gap-2.5 border-t border-amber-600/20 pt-2.5">
                                            <Text className={`text-xs font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                {tr('आपको किस प्रकार की सहायता / इमदाद की आवश्यकता है? *', 'آپ کو کس قسم کی مدد / امداد کی ضرورت ہے؟ *', 'What kind of help / assistance do you need? *')}
                                            </Text>

                                            <View className="flex-row flex-wrap gap-2">
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
                                                            className={`w-[48.5%] gap-1 rounded-xl border p-2.5 ${isSelected ? 'border-amber-600 bg-amber-100 dark:bg-emerald-900' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
                                                        >
                                                            <View className="flex-row items-center justify-between">
                                                                <Text className={`text-xs font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                                    {tr(item.hi, item.ur, item.en)}
                                                                </Text>
                                                                <View className={`h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] ${isSelected ? 'border-amber-600' : 'border-slate-400'}`}>
                                                                    {isSelected && <View className="h-1.5 w-1.5 rounded-full bg-amber-600" />}
                                                                </View>
                                                            </View>
                                                            <Text className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {item.desc}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>

                                            {/* Details if 'Other' */}
                                            {helpType === 'Other' && (
                                                <View className="mt-1 gap-1.5">
                                                    <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {tr('सहायता का विवरण दर्ज करें *', 'درکار امداد کی تفصیل لکھیں *', 'Specify Details of Help Needed *')}
                                                    </Text>
                                                    <TextInput
                                                        className={`rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800 ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
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
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('प्रोफ़ाइल फ़ोटो *', 'پروفائل تصویر *', 'Profile Photo *')}
                            </Text>
                            {avatarUri ? (
                                <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950">
                                    <Image source={{ uri: avatarUri }} className="h-[50px] w-[50px] rounded-full bg-slate-300" />
                                    <View className="flex-1 gap-1">
                                        <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`} numberOfLines={1}>
                                            {avatarFileName || 'profile_photo.jpg'}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text className="text-[11px] font-semibold text-emerald-600">
                                                {tr('फ़ोटो संलग्न है', 'تصویر منسلک ہے', 'Photo Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('avatar')}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-emerald-200 bg-white dark:bg-slate-900"
                                        >
                                            <Camera color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAvatarUri('');
                                                setAvatarFileName('');
                                            }}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-red-200 bg-red-50"
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('avatar')}
                                    className="items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-1.5 h-[42px] w-[42px] items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                                        <Camera color="#059669" size={20} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('प्रोफ़ाइल फ़ोटो अपलोड करें *', 'پروفائل تصویر اپلوڈ کریں *', 'Upload Profile Photo *')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('फ़ोटो खींचें या गैलरी से चुनें', 'تصویر لیں یا گیلری سے منتخب کریں', 'Take photo or choose from gallery')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Aadhaar Front Upload */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('आधार कार्ड - सामने *', 'آدھار کارڈ - سامنے *', 'Aadhaar Front *')}
                            </Text>
                            {aadhaarFrontUri ? (
                                <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950">
                                    <Image source={{ uri: aadhaarFrontUri }} className="h-[50px] w-[50px] rounded-[10px] bg-slate-300" />
                                    <View className="flex-1 gap-1">
                                        <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`} numberOfLines={1}>
                                            {aadhaarFrontFileName || 'aadhaar_front.jpg'}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text className="text-[11px] font-semibold text-emerald-600">
                                                {tr('आधार सामने का भाग संलग्न है', 'آدھار سامنے کا حصہ منسلک ہے', 'Aadhaar Front Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('aadhaarFront')}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-emerald-200 bg-white dark:bg-slate-900"
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAadhaarFrontUri('');
                                                setAadhaarFrontFileName('');
                                            }}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-red-200 bg-red-50"
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('aadhaarFront')}
                                    className="items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-1.5 h-[42px] w-[42px] items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                                        <FileText color="#059669" size={20} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('आधार सामने का भाग अपलोड करें *', 'آدھار سامنے کا حصہ اپلوڈ کریں *', 'Upload Aadhaar Front *')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('आधार के सामने की साफ़ तस्वीर या स्कैन', 'آدھار کے سامنے کی صاف تصویر', 'Clear photo or scan of Aadhaar front')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Aadhaar Back Upload */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('आधार कार्ड - पीछे *', 'آدھار کارڈ - پیچھے *', 'Aadhaar Back *')}
                            </Text>
                            {aadhaarBackUri ? (
                                <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950">
                                    <Image source={{ uri: aadhaarBackUri }} className="h-[50px] w-[50px] rounded-[10px] bg-slate-300" />
                                    <View className="flex-1 gap-1">
                                        <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`} numberOfLines={1}>
                                            {aadhaarBackFileName || 'aadhaar_back.jpg'}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text className="text-[11px] font-semibold text-emerald-600">
                                                {tr('आधार पीछे का भाग संलग्न है', 'آدھار پیچھے کا حصہ منسلک ہے', 'Aadhaar Back Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('aadhaarBack')}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-emerald-200 bg-white dark:bg-slate-900"
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setAadhaarBackUri('');
                                                setAadhaarBackFileName('');
                                            }}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-red-200 bg-red-50"
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('aadhaarBack')}
                                    className="items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-1.5 h-[42px] w-[42px] items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                                        <FileText color="#059669" size={20} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('आधार पीछे का भाग अपलोड करें *', 'آدھار پیچھے کا حصہ اپلوڈ کریں *', 'Upload Aadhaar Back *')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('आधार के पीछे (पते वाले भाग) की साफ़ तस्वीर', 'آدھار کے پتے والے حصے کی تصویر', 'Clear photo of Aadhaar back (Address side)')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity onPress={handleNextStep1} className="mt-1.5 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0f3322] py-4 shadow-md">
                            <Text className="text-[15px] font-extrabold text-[#f0c868]">
                                {tr('आगे बढ़ें: ₹100 सदस्यता शुल्क', 'آگے بڑھیں: ₹100 ممبرشپ فیس', 'Proceed to Pay ₹100 Fee')}
                            </Text>
                            <ArrowRight color="#f0c868" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/sign-in')}
                            className="mt-1 items-center"
                        >
                            <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('पहले से सदस्य हैं? ', 'پہلے سے ممبر ہیں؟ ', 'Already registered? ')}
                                <Text className="font-extrabold text-[#0f3322] underline">
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
                    <View className="gap-4 p-5">

                        {/* Payment Tabs */}
                        {/* QR/UPI tab hidden — MFCT does not have a QR code */}
                        {/* <View className="flex-row rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('UPI')}
                                className="flex-1 items-center rounded-xl py-2.5"
                                style={{
                                    backgroundColor: paymentMethod === 'UPI' ? (isDark ? '#0f172a' : '#ffffff') : 'transparent',
                                    shadowColor: '#000000',
                                    shadowOpacity: paymentMethod === 'UPI' ? 0.08 : 0,
                                    shadowRadius: paymentMethod === 'UPI' ? 4 : 0,
                                    elevation: paymentMethod === 'UPI' ? 2 : 0,
                                }}
                            >
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: paymentMethod === 'UPI' ? '#0f3322' : (isDark ? '#94a3b8' : '#64748b') }}
                                >
                                    {tr('UPI / QR स्कैन', 'UPI / QR اسکین', 'Instant UPI / QR')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod('Bank Transfer')}
                                className="flex-1 items-center rounded-xl py-2.5"
                                style={{
                                    backgroundColor: paymentMethod === 'Bank Transfer' ? (isDark ? '#0f172a' : '#ffffff') : 'transparent',
                                    shadowColor: '#000000',
                                    shadowOpacity: paymentMethod === 'Bank Transfer' ? 0.08 : 0,
                                    shadowRadius: paymentMethod === 'Bank Transfer' ? 4 : 0,
                                    elevation: paymentMethod === 'Bank Transfer' ? 2 : 0,
                                }}
                            >
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: paymentMethod === 'Bank Transfer' ? '#0f3322' : (isDark ? '#94a3b8' : '#64748b') }}
                                >
                                    {tr('बैंक ट्रांसफर (NEFT)', 'بینک ٹرانسفر (NEFT)', 'Bank Transfer (NEFT)')}
                                </Text>
                            </TouchableOpacity>
                        </View> */}

                        {/* UPI Panel hidden — MFCT does not have a QR code */}
                        {/* {paymentMethod === 'UPI' && (
                            <View className="items-center gap-3 rounded-[20px] border border-amber-500/30 bg-[#0f3322] p-5">
                                <View className="h-[162px] w-[162px] items-center justify-center rounded-2xl bg-white p-4">
                                    {accountDetailsLoading ? (
                                        <ActivityIndicator color="#059669" />
                                    ) : accountDetails?.qr_code_url ? (
                                        <Image
                                            source={{ uri: accountDetails.qr_code_url }}
                                            className="h-[130px] w-[130px]"
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <Text className="text-center text-xs font-medium text-slate-600">
                                            {tr('QR कोड उपलब्ध नहीं है', 'QR کوڈ دستیاب نہیں ہے', 'QR code is not available')}
                                        </Text>
                                    )}
                                </View>
                                <Text className="text-[11px] font-bold uppercase tracking-[0.8px] text-[#f0c868]">
                                    {tr('प्रत्यक्ष एस्क्रो के लिए UPI ID', 'براہ راست ادائیگی کے لیے UPI ID', 'UPI ID for Direct Escrow')}
                                </Text>
                                {accountDetails?.upi_id ? (
                                    <TouchableOpacity
                                        onPress={() => copyToClipboard(accountDetails.upi_id, 'UPI ID')}
                                        className="flex-row items-center gap-2 rounded-[10px] border border-white/20 bg-white/10 px-3.5 py-2"
                                    >
                                        <Text className="font-mono text-[15px] font-extrabold text-[#f0c868]">{accountDetails.upi_id}</Text>
                                        <Copy color="#34d399" size={16} />
                                    </TouchableOpacity>
                                ) : (
                                    <Text className="text-xs font-medium text-slate-300">
                                        {tr('UPI ID उपलब्ध नहीं है', 'UPI ID دستیاب نہیں ہے', 'UPI ID is not available')}
                                    </Text>
                                )}
                                <Text className="text-center text-[11px] text-slate-400">
                                    {tr('Google Pay, PhonePe, Paytm या BHIM UPI द्वारा स्कैन करें', 'Google Pay, PhonePe, Paytm کے ذریعے اسکین کریں', 'Scan using Google Pay, PhonePe, Paytm, or BHIM UPI')}
                                </Text>
                            </View>
                        )} */}

                        {/* Bank Panel */}
                        {paymentMethod === 'Bank Transfer' && (
                            <View className="items-center gap-3 rounded-[20px] border border-amber-500/30 bg-[#0f3322] p-5">
                                {bankDetails.length > 0 ? bankDetails.map(({ label, value }, index) => (
                                    <React.Fragment key={label}>
                                        {index > 0 && <View className="h-px w-full bg-white/10" />}
                                        <TouchableOpacity
                                            onPress={() => copyToClipboard(value, label.replace(/:$/, ''))}
                                            className="w-full flex-row items-center justify-between gap-3"
                                        >
                                            <Text className="flex-1 text-xs text-slate-400">{label}</Text>
                                            <View className="max-w-[70%] flex-row items-center gap-1.5">
                                                <Text className="flex-1 text-right font-mono text-xs font-bold text-[#f0c868]">{value}</Text>
                                                <Copy color="#6ee7b7" size={13} />
                                            </View>
                                        </TouchableOpacity>
                                    </React.Fragment>
                                )) : (
                                    <Text className="py-2 text-center text-xs text-slate-300">
                                        {tr('बैंक विवरण अभी उपलब्ध नहीं है।', 'بینک کی تفصیلات دستیاب نہیں ہیں۔', 'Bank details are not available yet.')}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* UTR Input */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('12 अंकों का बैंक UTR / संदर्भ संख्या *', '12 ہندسوں کا UTR / ریفرنس نمبر *', '12-Digit Bank UTR / Transaction Ref No *')}
                            </Text>
                            <TextInput
                                className={`rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-800 dark:bg-slate-800 ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
                                placeholder={tr('उदा. 420199381029', 'مثال: 420199381029', 'e.g. 420199381029')}
                                placeholderTextColor={placeholderColor}
                                value={utrNumber}
                                onChangeText={setUtrNumber}
                            />
                        </View>

                        {/* Screenshot Upload */}
                        <View className="gap-1.5">
                            <Text className={`text-[11px] font-bold uppercase tracking-[0.6px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr('भुगतान रसीद / स्क्रीनशॉट *', 'ادائیگی کی رسید / اسکرین شاٹ *', 'Payment Screenshot / Receipt *')}
                            </Text>
                            {screenshotUri ? (
                                <View className="flex-row items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-600 dark:bg-emerald-950">
                                    <Image source={{ uri: screenshotUri }} className="h-[50px] w-[50px] rounded-[10px] bg-slate-300" />
                                    <View className="flex-1 gap-1">
                                        <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`} numberOfLines={1}>
                                            {screenshotFileName || 'payment_receipt.jpg'}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            <CheckCircle2 color="#059669" size={12} />
                                            <Text className="text-[11px] font-semibold text-emerald-600">
                                                {tr('भुगतान रसीद संलग्न है', 'رسید منسلک ہے', 'Payment Receipt Attached')}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <TouchableOpacity
                                            onPress={() => setPickerTarget('screenshot')}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-emerald-200 bg-white dark:bg-slate-900"
                                        >
                                            <Upload color="#059669" size={16} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setScreenshotUri('');
                                                setScreenshotFileName('');
                                            }}
                                            className="h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-red-200 bg-red-50"
                                        >
                                            <Trash2 color="#ef4444" size={16} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setPickerTarget('screenshot')}
                                    className="items-center justify-center rounded-2xl border-[1.5px] border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-1.5 h-[42px] w-[42px] items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                                        <Upload color="#059669" size={20} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('भुगतान रसीद अपलोड करने के लिए क्लिक करें *', 'ادائیگی کی رسید اپلوڈ کریں *', 'Click to upload payment receipt *')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('गैलरी या कैमरे से रसीद संलग्न करें', 'گیلری یا کیمرے سے رسید منسلک کریں', 'Attach receipt from gallery or camera')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Agreement */}
                        <TouchableOpacity
                            onPress={() => setIsFeePaid(!isFeePaid)}
                            className="flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800"
                            activeOpacity={0.7}
                        >
                            <View className={`h-5 w-5 items-center justify-center rounded-md border-2 ${isFeePaid ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                                {isFeePaid && <Check color="#fff" size={14} />}
                            </View>
                            <Text className={`flex-1 text-xs font-medium leading-[18px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {tr(
                                    'मैंने ₹100 का भुगतान पूरा कर लिया है और MFCT सामुदायिक दिशानिर्देशों से सहमत हूँ।',
                                    'میں نے ₹100 کی ادائیگی مکمل کر لی ہے اور MFCT اصولوں سے متفق ہوں۔',
                                    'I have completed the ₹100 payment and agree to MFCT community guidelines.'
                                )}
                            </Text>
                        </TouchableOpacity>

                        {/* Action Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                className={`items-center justify-center rounded-2xl px-5 py-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                            >
                                <Text className={`text-sm font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                    ← {tr('वापस', 'واپس', 'Back')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleFinishRegistration}
                                disabled={!isFeePaid || submitting}
                                className={`flex-1 items-center justify-center rounded-2xl py-4 ${(!isFeePaid || submitting) ? 'bg-slate-300' : 'bg-[#0f3322]'}`}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#f0c868" size="small" />
                                    : <View className="flex-row items-center justify-center gap-1.5">
                                        <Text className="text-sm font-extrabold text-[#f0c868]">
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
                    <View className="mt-4 items-center gap-4 p-6">
                        <View className="h-[84px] w-[84px] items-center justify-center rounded-full border-2 border-emerald-500 bg-green-100">
                            <UserCheck color="#047857" size={48} />
                        </View>
                        <Text className={`text-center text-[22px] font-black ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                            {tr('पंजीकरण अनुरोध सबमिट हुआ!', 'درخواست کامیابی سے جمع ہوئی!', 'Registration Submitted!')}
                        </Text>
                        <Text className={`text-center text-sm leading-[22px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {tr(
                                `अल्हम्दुलिल्लाह! आप अब ${activeCommunity?.name} के एक पंजीकृत सदस्य हैं।`,
                                `الحمدللہ! آپ اب ${activeCommunity?.name} کے رجسٹرڈ ممبر بن چکے ہیں۔`,
                                `You are now a registered member of ${activeCommunity?.name}.`
                            )}
                        </Text>

                        {/* Trust Badges */}
                        <View className="my-1 flex-row flex-wrap justify-center gap-2">
                            {[
                                { icon: ShieldCheck, hi: 'सत्यापित सदस्य', ur: 'تصدیق شدہ ممبر', en: 'Verified Member' },
                                { icon: CheckCircle2, hi: 'UTR रिकॉर्ड', ur: 'UTR ریکارڈ', en: 'UTR Recorded' },
                                { icon: HandHeart, hi: 'राहत के पात्र', ur: 'امداد के اہل', en: 'Relief Eligible' },
                            ].map(({ icon: Icon, hi, ur, en }) => (
                                <View key={en} className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                                    <Icon color="#059669" size={16} />
                                    <Text className={`text-[11px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr(hi, ur, en)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View className="my-0.5 w-full items-center">
                            <Text className="text-xs font-bold text-emerald-600">
                                {tr(
                                    'समीक्षा स्थिति पृष्ठ पर स्वतः भेजा जा रहा है…',
                                    'آپ کو خود بخود جائزہ صفحہ پر لے جایا جا رہا ہے…',
                                    'Automatically redirecting to Under Review page…'
                                )}
                            </Text>
                        </View>

                        <TouchableOpacity onPress={() => handleCompleteAndNavigate()} className="mt-1.5 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0f3322] py-4 shadow-md">
                            <ActivityIndicator size="small" color="#f0c868" />
                            <Text className="text-[15px] font-extrabold text-[#f0c868]">
                                {tr('खाता समीक्षा स्थिति देखें', 'اکاؤنٹ اسٹیٹس دیکھیں', 'View Account Review Status')}
                            </Text>
                            <ArrowRight color="#f0c868" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/sign-in')}
                            className="mt-1 items-center"
                        >
                            <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                        className="flex-1 justify-end bg-slate-900/[0.65]"
                        activeOpacity={1}
                        onPress={() => setPickerTarget(null)}
                    >
                        <View className={`rounded-t-3xl p-5 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                            <View className="mb-4 flex-row items-center justify-between">
                                <Text className={`text-base font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
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
                                    className={`h-8 w-8 items-center justify-center rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                                >
                                    <X color={dynamicSubText} size={18} />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4 flex-row gap-3">
                                <TouchableOpacity
                                    className={`flex-1 items-center justify-center rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white'}`}
                                    onPress={() => handlePickMedia('camera')}
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                                        <Camera color="#059669" size={24} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('कैमरा का उपयोग करें', 'کیمرا استعمال کریں', 'Use Camera')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('नई तस्वीर लें', 'نئی تصویر لیں', 'Take a new photo')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 items-center justify-center rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-white'}`}
                                    onPress={() => handlePickMedia('gallery')}
                                    activeOpacity={0.7}
                                >
                                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                                        <ImageIcon color="#2563eb" size={24} />
                                    </View>
                                    <Text className={`text-[13px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('गैलरी से चुनें', 'گیلری سے منتخب کریں', 'Choose from Gallery')}
                                    </Text>
                                    <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {tr('फ़ाइल / छवि चुनें', 'فائل / تصویر منتخب کریں', 'Select file / image')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => setPickerTarget(null)}
                                className={`items-center justify-center rounded-[14px] py-3.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                            >
                                <Text className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                        className="flex-1 justify-end bg-slate-900/[0.65]"
                        activeOpacity={1}
                        onPress={() => setShowReligionPicker(false)}
                    >
                        <View className={`rounded-t-3xl p-5 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                            <View className="mb-4 flex-row items-center justify-between">
                                <Text className={`text-base font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                    {tr('धर्म चुनें', 'مذہب منتخب کریں', 'Select Religion')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowReligionPicker(false)}
                                    className={`h-8 w-8 items-center justify-center rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                                >
                                    <X color={dynamicSubText} size={18} />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4 gap-2.5">
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
                                            className={`flex-row items-center justify-between rounded-[14px] border p-4 ${isSelected ? 'border-amber-600 bg-amber-50 dark:bg-[#14281f]' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800'}`}
                                        >
                                            <Text className={`text-sm font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                {tr(item.hi, item.ur, item.en)}
                                            </Text>
                                            {isSelected && <Check color="#059669" size={20} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowReligionPicker(false)}
                                className={`items-center justify-center rounded-[14px] py-3.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                            >
                                <Text className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Community Picker Modal */}
            {showCommunityPicker && (() => {
                const displayCommunities = (hasCitySpecificCommunities && !showAllInPicker) ? filteredCommunities : communities;

                return (
                    <Modal
                        visible={showCommunityPicker}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowCommunityPicker(false)}
                    >
                        <TouchableOpacity
                            className="flex-1 justify-end bg-slate-900/[0.65]"
                            activeOpacity={1}
                            onPress={() => setShowCommunityPicker(false)}
                        >
                            <View className={`max-h-[75%] rounded-t-3xl p-5 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                                <View className={`flex-row items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <Text className={`text-base font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                        {tr('अपना स्थानीय समुदाय चुनें', 'اپنی مقامی کمیونٹی منتخب کریں', 'Select Your Local Community')}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setShowCommunityPicker(false)}
                                        className={`rounded-full p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                                    >
                                        <X color={dynamicSubText} size={18} />
                                    </TouchableOpacity>
                                </View>

                                {city.trim() ? (
                                    <View className={`flex-row items-center justify-between border-b px-5 py-2.5 ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                                        <View className="flex-1 flex-row items-center gap-1">
                                            {hasCitySpecificCommunities ? (
                                                <CheckCircle2 color="#10b981" size={14} />
                                            ) : (
                                                <AlertCircle color={isDark ? '#fbbf24' : '#d97706'} size={14} />
                                            )}
                                            <Text className={`text-xs font-bold ${hasCitySpecificCommunities ? 'text-emerald-500' : (isDark ? 'text-amber-300' : 'text-amber-700')}`}>
                                                {hasCitySpecificCommunities && !showAllInPicker
                                                    ? tr(`"${city.trim()}" के समुदाय (${filteredCommunities.length})`, `"${city.trim()}" کی کمیونٹیز (${filteredCommunities.length})`, `"${city.trim()}" Communities (${filteredCommunities.length})`)
                                                    : tr('सभी समुदाय', 'تمام کمیونٹیز', 'All Communities')}
                                            </Text>
                                        </View>
                                        {hasCitySpecificCommunities && (
                                            <TouchableOpacity
                                                onPress={() => setShowAllInPicker(!showAllInPicker)}
                                                className={`rounded-lg px-2.5 py-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                                            >
                                                <Text className={`text-[11px] font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                                    {showAllInPicker
                                                        ? tr(`केवल ${city.trim()}`, `صرف ${city.trim()}`, `Only ${city.trim()}`)
                                                        : tr('सभी दिखाएं', 'تمام دکھائیں', 'Show All')}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : null}

                                <ScrollView className="mt-3">
                                    {displayCommunities.map((item) => {
                                        const isSelected = item.id === selectedCommunityId;
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                onPress={() => {
                                                    setSelectedCommunityId(item.id);
                                                    setShowCommunityPicker(false);
                                                }}
                                                className={`mb-2.5 flex-row items-center justify-between rounded-2xl border p-4 ${isSelected ? 'border-emerald-600 bg-emerald-50 dark:bg-[#14281f]' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800'}`}
                                            >
                                                <View className="flex-1">
                                                    <Text className={`text-sm font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{item.name}</Text>
                                                    <Text className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                );
            })()}
        </KeyboardAvoidingView>
    );
}
