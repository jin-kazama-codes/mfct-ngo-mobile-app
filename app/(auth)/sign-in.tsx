import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform, Image,
    Keyboard, TouchableWithoutFeedback, Modal
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../src/context/AppStateProvider';
import { useColorScheme } from 'nativewind';
import {
    CreditCard, Mail, Lock, LogIn, Eye, EyeOff, Globe,
    ArrowLeft, ShieldCheck, AlertCircle, X, CheckCircle2,
    RotateCcw, Sparkles, Check, KeyRound
} from 'lucide-react-native';
import {
    getUserByEmail,
    getUserByMembershipId,
    getUserByPhone,
    updateUser,
} from '../../src/services/userService';

export default function SignInScreen() {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    const isHindi = currentLang.startsWith('hi');
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const tr = (hi: string, en: string) => isHindi ? hi : en;

    const handleToggleLanguage = async () => {
        const next = isHindi ? 'en' : 'hi';
        i18n.changeLanguage(next);
        try {
            await AsyncStorage.setItem('mfct_language', next);
        } catch { }
    };

    // --- Sign In State ---
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordInputRef = useRef<TextInput>(null);
    const { handleLogin } = useAppState();

    // --- Forgot Password Modal State ---
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState<1 | 2>(1);

    // Step 1: Email & OTP
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [previewOtp, setPreviewOtp] = useState<string | null>(null);
    const [targetUserId, setTargetUserId] = useState<string | null>(null);

    // Step 2: New Password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Forgot Password Status
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    const forgotScrollViewRef = useRef<ScrollView>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Track keyboard visibility for dynamic padding
    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Helper to scroll input smoothly above keyboard
    const scrollToForgotInput = (yOffset: number = 80) => {
        setTimeout(() => {
            forgotScrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        }, 150);
    };

    // OTP Resend cooldown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const openForgotModal = async () => {
        setForgotError('');
        setForgotSuccess('');
        setForgotOtp('');
        setGeneratedOtp(null);
        setOtpSent(false);
        setPreviewOtp(null);
        setNewPassword('');
        setConfirmPassword('');
        setForgotStep(1);
        setCountdown(0);
        setTargetUserId(null);

        // Pre-fill email if user already entered email or phone
        const trimmed = identifier.trim();
        if (trimmed.includes('@')) {
            setForgotEmail(trimmed.toLowerCase());
        } else if (trimmed.length >= 10) {
            try {
                const u = await getUserByMembershipId(trimmed) || await getUserByPhone(trimmed);
                if (u?.email) {
                    setForgotEmail(u.email);
                } else {
                    setForgotEmail('');
                }
            } catch {
                setForgotEmail('');
            }
        } else {
            setForgotEmail('');
        }

        setIsForgotModalOpen(true);
        scrollToForgotInput(0);
    };

    const closeForgotModal = () => {
        Keyboard.dismiss();
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotError('');
        setForgotSuccess('');
    };

    // Step 1: Send OTP to email
    const handleSendForgotOtp = async () => {
        Keyboard.dismiss();
        setForgotError('');
        setForgotSuccess('');

        const targetEmail = forgotEmail.trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) {
            setForgotError(
                tr(
                    'कृपया एक मान्य ईमेल पता दर्ज करें।',
                    'Please enter a valid email address.'
                )
            );
            return;
        }

        setSendingOtp(true);

        try {
            // Verify user exists in database
            const user = await getUserByEmail(targetEmail);
            if (!user) {
                setForgotError(
                    tr(
                        'इस ईमेल से जुड़ा कोई खाता नहीं मिला। कृपया अपना पंजीकृत ईमेल दर्ज करें।',
                        'No account found with this email. Please enter your registered email.'
                    )
                );
                setSendingOtp(false);
                return;
            }

            setTargetUserId(user.id);

            // Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(code);

            const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
            const EMAIL_FROM = process.env.EXPO_PUBLIC_EMAIL_FROM || 'MFCT Portal <info@mfcttrust.com>';

            let emailDelivered = false;
            let resendNotice = '';

            if (RESEND_API_KEY) {
                try {
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: EMAIL_FROM,
                            to: targetEmail,
                            subject: `${code} is your MFCT Password Reset Code`,
                            html: `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                                  <h2 style="color: #0f3322; margin: 0 0 10px;">MFCT Mobile Portal</h2>
                                  <p style="color: #475569; font-size: 14px;">Your password reset verification code is:</p>
                                  <div style="margin: 20px 0; background: #ecfdf5; border: 1.5px dashed #10b981; padding: 14px 24px; border-radius: 10px; text-align: center;">
                                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f3322;">${code}</span>
                                  </div>
                                  <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
                                </div>
                            `,
                        }),
                    });

                    const resData = await res.json().catch(() => ({}));
                    if (res.ok) {
                        emailDelivered = true;
                    } else {
                        resendNotice = resData?.message || `Resend code: ${res.status}`;
                    }
                } catch (err: any) {
                    resendNotice = err?.message || 'Network error reaching Resend';
                }
            }

            setOtpSent(true);
            setCountdown(60);

            if (emailDelivered) {
                setPreviewOtp(null);
                setForgotSuccess(
                    tr(
                        `OTP आपके ईमेल (${targetEmail}) पर भेजा गया है। कृपया इनबॉक्स जांचें।`,
                        `OTP has been sent to your email (${targetEmail}). Please check your inbox.`
                    )
                );
            } else {
                setPreviewOtp(code);
                if (resendNotice) {
                    setForgotError(`Resend notice: ${resendNotice}`);
                } else {
                    setForgotSuccess(
                        tr(
                            'सत्यापन कोड उत्पन्न हुआ (टेस्ट मोड)।',
                            'Verification code generated (Test mode).'
                        )
                    );
                }
            }
        } catch (err: any) {
            setForgotError(err?.message || 'Error processing request');
        } finally {
            setSendingOtp(false);
        }
    };

    // Step 1: Verify OTP
    const handleVerifyForgotOtp = () => {
        Keyboard.dismiss();
        setForgotError('');
        setForgotSuccess('');

        if (!otpSent) {
            setForgotError(
                tr(
                    'कृपया पहले "OTP भेजें" पर टैप करें।',
                    'Please tap "Send OTP" first to receive your code.'
                )
            );
            return;
        }

        if (!forgotOtp || forgotOtp.trim().length !== 6) {
            setForgotError(
                tr(
                    'कृपया 6 अंकों का OTP दर्ज करें।',
                    'Please enter the 6-digit OTP code.'
                )
            );
            return;
        }

        setVerifyingOtp(true);

        if (forgotOtp.trim() !== generatedOtp) {
            setVerifyingOtp(false);
            setForgotError(
                tr(
                    'अमान्य OTP कोड। कृपया पुनः जांचें।',
                    'Invalid OTP code. Please check and try again.'
                )
            );
            return;
        }

        setVerifyingOtp(false);
        setForgotSuccess(
            tr(
                'OTP सत्यापित हुआ! अब अपना नया पासवर्ड बनाएं।',
                'OTP verified successfully! Now create your new password.'
            )
        );
        setForgotStep(2);
        scrollToForgotInput(0);
    };

    // Step 2: Save New Password
    const handleSaveForgotNewPassword = async () => {
        Keyboard.dismiss();
        setForgotError('');
        setForgotSuccess('');

        if (!newPassword) {
            setForgotError(
                tr(
                    'कृपया नया पासवर्ड दर्ज करें।',
                    'Please enter new password.'
                )
            );
            return;
        }

        if (newPassword.length < 6) {
            setForgotError(
                tr(
                    'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
                    'Password must be at least 6 characters.'
                )
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setForgotError(
                tr(
                    'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।',
                    'New password and confirmation do not match.'
                )
            );
            return;
        }

        if (!targetUserId) {
            setForgotError(
                tr(
                    'उपयोगकर्ता खाता नहीं मिला। कृपया पुनः प्रयास करें।',
                    'User account not found. Please try again.'
                )
            );
            return;
        }

        setSavingPassword(true);

        try {
            await updateUser(targetUserId, {
                password: newPassword,
            });

            setForgotSuccess(
                tr(
                    'पासवर्ड सफलतापूर्वक रीसेट कर दिया गया है! अब आप लॉगिन कर सकते हैं।',
                    'Password has been reset successfully! You can now sign in.'
                )
            );

            setTimeout(() => {
                closeForgotModal();
                setPassword(newPassword);
            }, 1500);
        } catch (err: any) {
            console.error('Password reset error:', err);
            setForgotError(err?.message || 'Failed to reset password.');
        } finally {
            setSavingPassword(false);
        }
    };

    const onLoginPress = async () => {
        Keyboard.dismiss();
        if (!identifier.trim() || !password) {
            setError(
                tr(
                    'कृपया अपनी सदस्यता आईडी और पासवर्ड दर्ज करें।',
                    'Please enter your membership ID and password.'
                )
            );
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await handleLogin(identifier.trim(), password);
            setIsLoading(false);

            if (result.success && result.user) {
                const u = result.user;
                const isDistrictOfficer = !!(u.district_role || u.districtRole);
                const isAdmin = u.role === 'super_admin' || u.role === 'executive_admin' || u.role === 'community_admin' || isDistrictOfficer;
                const isApproved = u.status === 'approved' || (u.isVerified && u.status !== 'reject' && u.status !== 'rejected');

                if (isAdmin || isApproved) {
                    router.replace('/(drawer)/dashboard');
                } else {
                    router.replace('/(auth)/under-review');
                }
            } else if (result.success) {
                router.replace('/(drawer)/dashboard');
            } else {
                setError(
                    result.error ||
                    tr(
                        'लॉगिन विफल रहा। कृपया अपना विवरण जांचें।',
                        'Login failed. Please check your credentials.'
                    )
                );
            }
        } catch (err: any) {
            setIsLoading(false);
            setError(err?.message || 'Login error');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-slate-50 dark:bg-slate-950"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
                    keyboardShouldPersistTaps="always"
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    alwaysBounceVertical={true}
                    nestedScrollEnabled={true}
                >
                    {/* Header with Background Gradient & Brand */}
                    <View className="bg-emerald-600 dark:bg-emerald-700 px-5 pt-12 pb-5 rounded-b-3xl shadow-md">
                        {/* Top navigation row */}
                        <View className="flex-row items-center justify-between mb-3">
                            <TouchableOpacity
                                onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
                                className="w-9 h-9 rounded-full bg-white/20 items-center justify-center backdrop-blur-md"
                                activeOpacity={0.7}
                            >
                                <ArrowLeft color="#ffffff" size={18} />
                            </TouchableOpacity>

                            {/* Language Switcher (English <-> Hindi) */}
                            <TouchableOpacity
                                onPress={handleToggleLanguage}
                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30"
                                activeOpacity={0.7}
                            >
                                <Globe color="#ffffff" size={14} />
                                <Text className="text-xs font-bold text-white uppercase">
                                    {isHindi ? 'हिंदी' : 'English'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Logo & Single-Line Title */}
                        <View className="items-center">
                            <View className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md mb-2 items-center justify-center">
                                <Image
                                    source={require('../../assets/images/ngo-logo.png')}
                                    className="w-full h-full rounded-xl"
                                    resizeMode="contain"
                                />
                            </View>
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.75}
                                className="text-[17px] font-black text-white text-center tracking-tight px-1"
                            >
                                {tr(
                                    'मोहम्मद फहीम चैरिटेबल ट्रस्ट',
                                    'Mohammad Faeem Charitable Trust'
                                )}
                            </Text>
                            <Text className="text-emerald-100 text-xs font-medium text-center mt-0.5">
                                {tr(
                                    'खाते में साइन इन करें',
                                    'Sign in to your account'
                                )}
                            </Text>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View className="w-full px-4 pt-4 pb-6">
                        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 gap-3.5">
                            <View>
                                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                                    {tr('लॉगिन करें', 'Welcome Back')}
                                </Text>
                                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {tr(
                                        'अपने सदस्य या व्यवस्थापक खाते में प्रवेश करें',
                                        'Enter credentials for your Member or Admin account'
                                    )}
                                </Text>
                            </View>

                            {/* Error Banner */}
                            {error ? (
                                <View className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 p-3 rounded-2xl flex-row items-center gap-2.5">
                                    <AlertCircle color="#ef4444" size={16} />
                                    <Text className="flex-1 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
                                        {error}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Membership ID / legacy phone or email input */}
                            <View className="gap-1">
                                <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                    {tr('सदस्यता आईडी / मोबाइल / ईमेल', 'Membership ID / Phone / Email')}
                                </Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5">
                                    <CreditCard color="#94a3b8" size={17} />
                                    <TextInput
                                        className="flex-1 text-slate-900 dark:text-white px-3 py-3 text-sm"
                                        placeholder={tr('MFCT-00001 या मोबाइल / ईमेल', 'MFCT-00001 or phone / email')}
                                        placeholderTextColor="#94a3b8"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                        value={identifier}
                                        onChangeText={(txt) => {
                                            setIdentifier(txt);
                                            if (error) setError('');
                                        }}
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                        blurOnSubmit={false}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View className="gap-1">
                                <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                    {tr('पासवर्ड', 'Password')}
                                </Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5">
                                    <Lock color="#94a3b8" size={17} />
                                    <TextInput
                                        ref={passwordInputRef}
                                        className="flex-1 text-slate-900 dark:text-white px-3 py-3 text-sm"
                                        placeholder="••••••••"
                                        placeholderTextColor="#94a3b8"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                        value={password}
                                        onChangeText={(txt) => {
                                            setPassword(txt);
                                            if (error) setError('');
                                        }}
                                        onSubmitEditing={onLoginPress}
                                    />
                                    <TouchableOpacity
                                        className="p-2"
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword
                                            ? <EyeOff color="#94a3b8" size={17} />
                                            : <Eye color="#94a3b8" size={17} />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password Link */}
                            <View className="flex-row justify-end -mt-1">
                                <TouchableOpacity
                                    onPress={openForgotModal}
                                    activeOpacity={0.7}
                                    className="py-1 px-1"
                                >
                                    <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        {tr('पासवर्ड भूल गए?', 'Forgot Password?')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sign In Button */}
                            <TouchableOpacity
                                style={{ minHeight: 50 }}
                                className="bg-emerald-600 active:bg-emerald-700 w-full py-3 px-4 rounded-2xl items-center justify-center shadow-md shadow-emerald-600/30 mt-1"
                                onPress={onLoginPress}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <View className="flex-row items-center justify-center gap-2" pointerEvents="none">
                                        <LogIn color="#fff" size={18} />
                                        <Text
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.85}
                                            className="text-white font-bold text-base text-center"
                                        >
                                            {tr('साइन इन करें', 'Sign In')}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <TouchableOpacity
                                className="mt-1 items-center py-2"
                                onPress={() => router.push('/(auth)/sign-up')}
                                activeOpacity={0.7}
                            >
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium text-center">
                                    {tr('खाता नहीं है? ', "Don't have an account? ")}
                                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold underline">
                                        {tr('सदस्य के रूप में पंजीकरण करें', 'Register as Member')}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom guest / back option */}
                        <TouchableOpacity
                            className="mt-4 items-center py-2"
                            onPress={() => router.replace('/(tabs)')}
                            activeOpacity={0.7}
                        >
                            <Text className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                                {tr('← होम पेज पर वापस जाएं', '← Back to Home')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* ============================================================== */}
            {/* FORGOT PASSWORD MODAL (2-STEP: OTP -> NEW PASSWORD)            */}
            {/* ============================================================== */}
            <Modal
                visible={isForgotModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={closeForgotModal}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    </TouchableWithoutFeedback>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
                        style={{ width: '100%', maxHeight: '92%' }}
                    >
                        <View className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden" style={{ maxHeight: '100%' }}>
                            {/* Drag handle */}
                            <View className="items-center pt-3 pb-1">
                                <View className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            </View>

                            <ScrollView
                                ref={forgotScrollViewRef}
                                contentContainerStyle={{
                                    paddingHorizontal: 20,
                                    paddingTop: 10,
                                    paddingBottom: keyboardVisible ? (Platform.OS === 'ios' ? 280 : 360) : 40,
                                    flexGrow: 1,
                                }}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Modal Header */}
                                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <View className="flex-row items-center gap-2.5">
                                        <View className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 items-center justify-center border border-emerald-300 dark:border-emerald-800">
                                            <KeyRound color="#059669" size={20} />
                                        </View>
                                        <View>
                                            <Text className="text-base font-bold text-slate-900 dark:text-white">
                                                {tr('पासवर्ड रीसेट करें', 'Reset Password')}
                                            </Text>
                                            <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {forgotStep === 1
                                                    ? tr('चरण 1: ईमेल OTP सत्यापन', 'Step 1: Email OTP Verification')
                                                    : tr('चरण 2: नया पासवर्ड बनाएं', 'Step 2: Create New Password')}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={closeForgotModal}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                                        activeOpacity={0.7}
                                    >
                                        <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
                                    </TouchableOpacity>
                                </View>

                                {/* 2-Step Stepper */}
                                <View className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2.5 my-3.5">
                                    <View className="flex-row items-center justify-between">
                                        {/* Step 1 Pill */}
                                        <View className="flex-row items-center gap-1.5">
                                            <View
                                                className={`w-6 h-6 rounded-full items-center justify-center ${
                                                    forgotStep === 1
                                                        ? 'bg-emerald-600'
                                                        : 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-500'
                                                }`}
                                            >
                                                {forgotStep > 1 ? (
                                                    <Check color={isDark ? '#34d399' : '#059669'} size={14} />
                                                ) : (
                                                    <Text className="text-xs font-bold text-white">1</Text>
                                                )}
                                            </View>
                                            <Text
                                                className={`text-xs font-bold ${
                                                    forgotStep === 1
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {tr('OTP सत्यापन', 'Verify OTP')}
                                            </Text>
                                        </View>

                                        {/* Line */}
                                        <View
                                            className={`flex-1 mx-3 h-0.5 rounded-full ${
                                                forgotStep === 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                        />

                                        {/* Step 2 Pill */}
                                        <View className="flex-row items-center gap-1.5">
                                            <View
                                                className={`w-6 h-6 rounded-full items-center justify-center ${
                                                    forgotStep === 2
                                                        ? 'bg-emerald-600'
                                                        : 'bg-slate-200 dark:bg-slate-800'
                                                }`}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        forgotStep === 2 ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                                                    }`}
                                                >
                                                    2
                                                </Text>
                                            </View>
                                            <Text
                                                className={`text-xs font-bold ${
                                                    forgotStep === 2
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                }`}
                                            >
                                                {tr('नया पासवर्ड', 'New Password')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Error Banner */}
                                {forgotError ? (
                                    <View className="flex-row items-center gap-2 p-3 mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                                        <AlertCircle color="#e11d48" size={17} />
                                        <Text className="flex-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                                            {forgotError}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* Success Banner */}
                                {forgotSuccess ? (
                                    <View className="flex-row items-center gap-2 p-3 mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900">
                                        <CheckCircle2 color="#059669" size={17} />
                                        <Text className="flex-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                            {forgotSuccess}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* Test OTP Banner */}
                                {forgotStep === 1 && previewOtp ? (
                                    <View className="flex-row items-center justify-between p-3 mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900">
                                        <View className="flex-row items-center gap-2 flex-1">
                                            <Sparkles color="#d97706" size={16} />
                                            <Text className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                                OTP:{' '}
                                                <Text className="font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-300">
                                                    {previewOtp}
                                                </Text>
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setForgotOtp(previewOtp)}
                                            className="bg-amber-200/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg"
                                        >
                                            <Text className="text-[11px] font-bold text-amber-900 dark:text-amber-100">
                                                {tr('ऑटो भरें', 'Auto Fill')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}

                                {/* STEP 1: Email + Send OTP + Enter OTP */}
                                {forgotStep === 1 && (
                                    <View className="gap-3">
                                        {/* Registered Email Input */}
                                        <View className="gap-1">
                                            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                                {tr('पंजीकृत ईमेल *', 'Registered Email *')}
                                            </Text>
                                            <View className="flex-row gap-2">
                                                <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-1">
                                                    <Mail color="#94a3b8" size={17} />
                                                    <TextInput
                                                        value={forgotEmail}
                                                        onChangeText={(t) => {
                                                            setForgotEmail(t);
                                                            if (forgotError) setForgotError('');
                                                        }}
                                                        onFocus={() => scrollToForgotInput(70)}
                                                        keyboardType="email-address"
                                                        autoCapitalize="none"
                                                        autoCorrect={false}
                                                        placeholder="name@example.com"
                                                        placeholderTextColor="#94a3b8"
                                                        className="flex-1 text-slate-900 dark:text-white px-2.5 py-2.5 text-sm"
                                                        returnKeyType="next"
                                                    />
                                                </View>

                                                <TouchableOpacity
                                                    onPress={handleSendForgotOtp}
                                                    disabled={sendingOtp || countdown > 0}
                                                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 justify-center items-center flex-row gap-1.5 active:bg-emerald-700 disabled:opacity-60"
                                                    activeOpacity={0.8}
                                                >
                                                    {sendingOtp ? (
                                                        <ActivityIndicator color="#ffffff" size="small" />
                                                    ) : countdown > 0 ? (
                                                        <Text className="text-xs font-bold text-white">{countdown}s</Text>
                                                    ) : (
                                                        <>
                                                            <RotateCcw color="#ffffff" size={14} />
                                                            <Text className="text-xs font-bold text-white">
                                                                {otpSent ? tr('पुनः भेजें', 'Resend') : tr('OTP भेजें', 'Send OTP')}
                                                            </Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* 6-Digit OTP */}
                                        <View className="gap-1 mt-1">
                                            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                                {tr('6 अंकों का OTP दर्ज करें *', 'Enter 6-Digit OTP *')}
                                            </Text>
                                            <TextInput
                                                value={forgotOtp}
                                                onChangeText={(t) => {
                                                    setForgotOtp(t.replace(/\D/g, ''));
                                                    if (forgotError) setForgotError('');
                                                }}
                                                onFocus={() => scrollToForgotInput(150)}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                                placeholder="------"
                                                placeholderTextColor="#94a3b8"
                                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-center font-mono font-bold text-xl tracking-widest text-slate-900 dark:text-white"
                                            />
                                        </View>

                                        {/* Step 1 Button */}
                                        <TouchableOpacity
                                            onPress={handleVerifyForgotOtp}
                                            disabled={verifyingOtp || !otpSent || forgotOtp.length !== 6}
                                            className="bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md shadow-emerald-600/30 mt-2 disabled:opacity-50"
                                            activeOpacity={0.85}
                                        >
                                            {verifyingOtp ? (
                                                <ActivityIndicator color="#ffffff" size="small" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 color="#ffffff" size={18} />
                                                    <Text className="text-white font-bold text-base">
                                                        {tr('OTP सत्यापित करें & आगे बढ़ें', 'Verify OTP & Continue')}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* STEP 2: Create New Password */}
                                {forgotStep === 2 && (
                                    <View className="gap-3">
                                        {/* Verified Email Banner */}
                                        <View className="flex-row items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                                            <View className="flex-row items-center gap-2 flex-1">
                                                <CheckCircle2 color="#059669" size={17} />
                                                <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                                                    {tr('सत्यापित ईमेल:', 'Verified:')}{' '}
                                                    <Text className="font-mono">{forgotEmail}</Text>
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setForgotStep(1);
                                                    setForgotError('');
                                                    setForgotSuccess('');
                                                }}
                                                className="bg-emerald-200/60 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg"
                                            >
                                                <Text className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                                                    {tr('बदलें', 'Change')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* New Password */}
                                        <View className="gap-1">
                                            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                                {tr('नया पासवर्ड * (कम से कम 6 अक्षर)', 'New Password * (Min 6 characters)')}
                                            </Text>
                                            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5">
                                                <Lock color="#94a3b8" size={17} />
                                                <TextInput
                                                    secureTextEntry={!showNewPassword}
                                                    value={newPassword}
                                                    onChangeText={(t) => {
                                                        setNewPassword(t);
                                                        if (forgotError) setForgotError('');
                                                    }}
                                                    onFocus={() => scrollToForgotInput(70)}
                                                    placeholder="••••••••"
                                                    placeholderTextColor="#94a3b8"
                                                    className="flex-1 text-slate-900 dark:text-white px-3 py-3 text-sm"
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                                    className="p-2"
                                                >
                                                    {showNewPassword ? <EyeOff color="#94a3b8" size={17} /> : <Eye color="#94a3b8" size={17} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Confirm Password */}
                                        <View className="gap-1">
                                            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                                {tr('नए पासवर्ड की पुष्टि करें *', 'Confirm New Password *')}
                                            </Text>
                                            <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5">
                                                <Lock color="#94a3b8" size={17} />
                                                <TextInput
                                                    secureTextEntry={!showConfirmPassword}
                                                    value={confirmPassword}
                                                    onChangeText={(t) => {
                                                        setConfirmPassword(t);
                                                        if (forgotError) setForgotError('');
                                                    }}
                                                    onFocus={() => scrollToForgotInput(140)}
                                                    placeholder="••••••••"
                                                    placeholderTextColor="#94a3b8"
                                                    className="flex-1 text-slate-900 dark:text-white px-3 py-3 text-sm"
                                                    autoCapitalize="none"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="p-2"
                                                >
                                                    {showConfirmPassword ? <EyeOff color="#94a3b8" size={17} /> : <Eye color="#94a3b8" size={17} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Step 2 Submit Button */}
                                        <TouchableOpacity
                                            onPress={handleSaveForgotNewPassword}
                                            disabled={savingPassword}
                                            className="bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md shadow-emerald-600/30 mt-2 disabled:opacity-60"
                                            activeOpacity={0.85}
                                        >
                                            {savingPassword ? (
                                                <ActivityIndicator color="#ffffff" size="small" />
                                            ) : (
                                                <>
                                                    <Lock color="#ffffff" size={18} />
                                                    <Text className="text-white font-bold text-base">
                                                        {tr('पासवर्ड रीसेट करें', 'Reset Password')}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Cancel / Back to login */}
                                <TouchableOpacity
                                    onPress={closeForgotModal}
                                    className="py-3 mt-2 items-center justify-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        ← {tr('लॉगिन पर वापस जाएं', 'Back to Sign In')}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
