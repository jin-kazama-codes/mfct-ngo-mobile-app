import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { useAppState } from '../../src/context/AppStateProvider';
import { updateUser } from '../../src/services/userService';
import { verifyPassword } from '../../src/lib/auth';
import { getLanguageCode } from '../../src/lib/translateEntity';

export default function ChangePasswordScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const { activeUser } = useAppState();

  const scrollViewRef = useRef<ScrollView>(null);

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  // Modes: 'change' (requires current password) | 'forgot' (2-step: 1. Verify OTP -> 2. Create Password)
  const [mode, setMode] = useState<'change' | 'forgot'>('change');
  // 2-step state for forgot password flow
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email OTP states
  const [email, setEmail] = useState(activeUser?.email || '');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeUser?.email) {
      setEmail(activeUser.email);
    }
  }, [activeUser]);

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Helper to scroll input into clear view above keyboard
  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 150);
  };

  // Resend API Configuration
  const RESEND_API_KEY =
    process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
  const EMAIL_FROM =
    process.env.EXPO_PUBLIC_EMAIL_FROM || 'MFCT Portal <info@mfcttrust.com>';

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setOtpSent(false);
    setPreviewOtp(null);
    setForgotStep(1);
  };

  // 1. Send Email OTP
  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = (email || activeUser?.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg(
        tr(
          'कृपया एक मान्य ईमेल पता दर्ज करें।',
          'براہ کرم ایک درست ای میل پتہ درج کریں۔',
          'Please enter a valid email address.'
        )
      );
      return;
    }

    setSendingOtp(true);

    // 1. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    let emailDelivered = false;
    let resendNotice = '';

    // 2. Dispatch real email via Resend
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

    setOtpSent(true);
    setCountdown(60);

    if (emailDelivered) {
      setPreviewOtp(null);
      setSuccessMsg(
        tr(
          `OTP आपके ईमेल (${targetEmail}) पर भेजा गया है। कृपया इनबॉक्स जांचें।`,
          `او ٹی پی آپ کے ای میل (${targetEmail}) پر بھیج دیا گیا ہے۔`,
          `OTP has been sent to your email (${targetEmail}). Please check your inbox.`
        )
      );
    } else {
      setPreviewOtp(code);
      if (resendNotice) {
        setErrorMsg(`Resend notice: ${resendNotice}`);
      } else {
        setSuccessMsg(
          tr(
            'सत्यापन कोड उत्पन्न हुआ (टेस्ट मोड)।',
            'تصدیقی کوڈ جنریٹ ہو گیا۔',
            'Verification code generated (Test mode).'
          )
        );
      }
    }

    setSendingOtp(false);
  };

  // 2. Step 1: Verify OTP
  const handleVerifyOtp = () => {
    Keyboard.dismiss();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = (email || activeUser?.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg(
        tr(
          'कृपया एक मान्य ईमेल पता दर्ज करें।',
          'براہ کرم ایک درست ای میل پتہ درج کریں۔',
          'Please enter a valid email address.'
        )
      );
      return;
    }

    if (!otpSent) {
      setErrorMsg(
        tr(
          'कृपया पहले "OTP भेजें" पर टैप करें।',
          'براہ کرم پہلے او ٹی پی بھیجیں۔',
          'Please tap "Send OTP" first to receive your code.'
        )
      );
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setErrorMsg(
        tr(
          'कृपया 6 अंकों का OTP दर्ज करें।',
          'براہ کرم 6 ہندسوں کا OTP درج کریں۔',
          'Please enter the 6-digit OTP code.'
        )
      );
      return;
    }

    setVerifyingOtp(true);

    if (otp.trim() !== generatedOtp) {
      setVerifyingOtp(false);
      setErrorMsg(
        tr(
          'अमान्य OTP कोड। कृपया पुनः जांचें।',
          'غلط او ٹی پی کوڈ۔ براہ کرم دوبارہ چیک کریں۔',
          'Invalid OTP code. Please check and try again.'
        )
      );
      return;
    }

    setVerifyingOtp(false);
    setSuccessMsg(
      tr(
        'OTP सत्यापित हुआ! अब अपना नया पासवर्ड बनाएं।',
        'او ٹی پی تصدیق شدہ! اب اپنا نیا پاس ورڈ بنائیں۔',
        'OTP verified successfully! Now create your new password.'
      )
    );
    setForgotStep(2);
    scrollToInput(0);
  };

  // 3. Step 2 / Normal Mode: Submit Password Change
  const handleSavePassword = async () => {
    Keyboard.dismiss();
    if (!activeUser) return;
    setErrorMsg('');
    setSuccessMsg('');

    // --- Validation in Normal Mode ---
    if (mode === 'change' && activeUser.passwordHash) {
      if (!currentPassword) {
        setErrorMsg(
          tr(
            'कृपया वर्तमान पासवर्ड दर्ज करें।',
            'براہ کرم موجودہ پاس ورڈ درج کریں۔',
            'Please enter current password.'
          )
        );
        return;
      }
    }

    // --- Password Validation ---
    if (!newPassword) {
      setErrorMsg(
        tr(
          'कृपया नया पासवर्ड दर्ज करें।',
          'براہ کرم نیا پاس ورڈ درج کریں۔',
          'Please enter new password.'
        )
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg(
        tr(
          'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
          'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔',
          'Password must be at least 6 characters.'
        )
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        tr(
          'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।',
          'پاس ورڈ مماثل نہیں ہے۔',
          'New password and confirmation do not match.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      // If Normal Mode, verify current password first
      if (mode === 'change' && activeUser.passwordHash) {
        const isValid = await verifyPassword(currentPassword, activeUser.passwordHash);
        if (!isValid) {
          setErrorMsg(
            tr(
              'वर्तमान पासवर्ड गलत है। यदि आप भूल गए हैं, तो "पासवर्ड भूल गए?" पर टैप करें।',
              'موجودہ پاس ورڈ غلط ہے۔ اگر آپ بھول گئے ہیں تو "پاس ورڈ بھول گئے؟" پر ٹیپ کریں۔',
              'Current password is incorrect. If forgotten, tap "Forgot Password?".'
            )
          );
          setSubmitting(false);
          return;
        }

        if (currentPassword === newPassword) {
          setErrorMsg(
            tr(
              'नया पासवर्ड वर्तमान से अलग होना चाहिए।',
              'نیا پاس ورڈ مختلف ہونا چاہیے۔',
              'New password cannot be the same as current password.'
            )
          );
          setSubmitting(false);
          return;
        }
      }

      // Update in database (userService.updateUser auto-hashes password)
      await updateUser(activeUser.id, {
        password: newPassword,
      });

      Alert.alert(
        tr('सफलता', 'کامیابی', 'Success'),
        mode === 'forgot'
          ? tr(
              'पासवर्ड सफलतापूर्वक रीसेट कर दिया गया है!',
              'پاس ورڈ کامیابی سے ری سیٹ کر دیا گیا ہے!',
              'Password has been reset successfully!'
            )
          : tr(
              'पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है!',
              'پاس ورڈ کامیابی से اپ ڈیٹ کر دیا گیا ہے!',
              'Password has been updated successfully!'
            ),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Password change error on mobile:', err);
      setErrorMsg(err?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      style={{ flex: 1 }}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      {/* Top Header */}
      <View className="pt-12 pb-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => {
            if (mode === 'forgot' && forgotStep === 2) {
              setForgotStep(1);
              setErrorMsg('');
              setSuccessMsg('');
            } else {
              router.back();
            }
          }}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <ArrowLeft color={isDark ? '#cbd5e1' : '#334155'} size={20} />
        </TouchableOpacity>

        <View className="flex-1 mx-3 items-center">
          <Text className="font-bold text-base text-slate-900 dark:text-white">
            {mode === 'change'
              ? tr('पासवर्ड बदलें', 'پاس ورڈ تبدیل کریں', 'Change Password')
              : tr('पासवर्ड भूल गए (OTP रीसेट)', 'پاس ورڈ بھول گئے (او ٹی پی)', 'Forgot Password (OTP Reset)')}
          </Text>
          <Text className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {activeUser?.email || activeUser?.phone || activeUser?.name}
          </Text>
        </View>

        <View className="w-10" />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 220 : 260,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding Icon Card */}
        <View className="items-center justify-center my-3">
          <View className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 items-center justify-center mb-2 border border-emerald-300 dark:border-emerald-800">
            <KeyRound color="#059669" size={28} />
          </View>
          <Text className="text-base font-bold text-slate-900 dark:text-white text-center">
            {mode === 'change'
              ? tr('सुरक्षित पासवर्ड अपडेट', 'محفوظ پاس ورڈ اپ ڈیٹ', 'Secure Password Update')
              : forgotStep === 1
              ? tr('चरण 1: ईमेल OTP सत्यापन', 'مرحلہ 1: ای میل OTP تصدیق', 'Step 1: Email OTP Verification')
              : tr('चरण 2: नया पासवर्ड बनाएं', 'مرحلہ 2: نیا پاس ورڈ بنائیں', 'Step 2: Create New Password')}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">
            {mode === 'change'
              ? tr(
                  'अपना वर्तमान और नया पासवर्ड दर्ज करें।',
                  'اپنا موجودہ اور نیا پاس ورڈ درج کریں۔',
                  'Enter your current and new password below.'
                )
              : forgotStep === 1
              ? tr(
                  'अपने पंजीकृत ईमेल पर 6 अंकों का कोड प्राप्त करें।',
                  'اپنے رجسٹرڈ ای میل پر 6 ہندسوں کا کوڈ حاصل کریں۔',
                  'Get a 6-digit verification code on your registered email.'
                )
              : tr(
                  'अपने खाते के लिए एक नया सुरक्षित पासवर्ड चुनें।',
                  'اپنے اکاؤنٹ کے لیے ایک نیا محفوظ پاس ورڈ منتخب کریں۔',
                  'Choose a new secure password for your account.'
                )}
          </Text>
        </View>

        {/* 2-Step Stepper (Only in Forgot Password Mode) */}
        {mode === 'forgot' && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 mb-4 shadow-xs">
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
                  {tr('OTP सत्यापन', 'او ٹی پی تصدیق', 'Verify OTP')}
                </Text>
              </View>

              {/* Connecting line */}
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
                  {tr('नया पासवर्ड', 'نیا پاس ورڈ', 'New Password')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Error Alert Box */}
        {errorMsg ? (
          <View className="flex-row items-center gap-2 p-3.5 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
            <AlertCircle color="#e11d48" size={18} />
            <Text className="flex-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* Success Alert Box */}
        {successMsg ? (
          <View className="flex-row items-center gap-2 p-3.5 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 color="#059669" size={18} />
            <Text className="flex-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {successMsg}
            </Text>
          </View>
        ) : null}

        {/* Test Preview OTP Banner (If active) */}
        {mode === 'forgot' && forgotStep === 1 && previewOtp ? (
          <View className="flex-row items-center justify-between p-3.5 mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900">
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
              onPress={() => setOtp(previewOtp)}
              className="bg-amber-200/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg"
            >
              <Text className="text-[11px] font-bold text-amber-900 dark:text-amber-100">
                {tr('ऑटो भरें', 'آٹو فل', 'Auto Fill')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============================================================== */}
        {/* 1. NORMAL MODE: Current Password + New Password               */}
        {/* ============================================================== */}
        {mode === 'change' && (
          <View>
            {activeUser?.passwordHash && (
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr('वर्तमान पासवर्ड *', 'موجودہ پاس ورڈ *', 'Current Password *')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setMode('forgot');
                      resetFormState();
                    }}
                  >
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {tr('पासवर्ड भूल गए?', 'پاس ورڈ بھول گئے؟', 'Forgot Password?')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-xs">
                  <Lock color="#94a3b8" size={18} />
                  <TextInput
                    secureTextEntry={!showCurrent}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    onFocus={() => scrollToInput(60)}
                    placeholder={tr('वर्तमान पासवर्ड दर्ज करें', 'موجودہ پاس ورڈ درج کریں', 'Enter current password')}
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-2.5 text-sm font-medium text-slate-900 dark:text-white py-2.5"
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} className="p-1">
                    {showCurrent ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('नया पासवर्ड *', 'نیا پاس ورڈ *', 'New Password *')}
              </Text>
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-xs">
                <Lock color="#94a3b8" size={18} />
                <TextInput
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => scrollToInput(120)}
                  placeholder={tr('कम से कम 6 अक्षर', 'کم از کم 6 حروف', 'Minimum 6 characters')}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2.5 text-sm font-medium text-slate-900 dark:text-white py-2.5"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} className="p-1">
                  {showNew ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('नए पासवर्ड की पुष्टि करें *', 'نئے پاس ورڈ کی تصدیق کریں *', 'Confirm New Password *')}
              </Text>
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-xs">
                <Lock color="#94a3b8" size={18} />
                <TextInput
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => scrollToInput(180)}
                  placeholder={tr('नया पासवर्ड पुनः दर्ज करें', 'نیا پاس ورڈ دوبارہ درج کریں', 'Re-enter new password')}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2.5 text-sm font-medium text-slate-900 dark:text-white py-2.5"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
                  {showConfirm ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSavePassword}
              disabled={submitting}
              className="bg-emerald-600 dark:bg-emerald-700 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90 disabled:opacity-60 mb-3"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Lock color="#ffffff" size={18} />
                  <Text className="text-white font-bold text-base">
                    {tr('पासवर्ड अपडेट करें', 'پاس ورڈ اپ ڈیٹ کریں', 'Update Password')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* 2. FORGOT MODE - STEP 1: Verify Email OTP                      */}
        {/* ============================================================== */}
        {mode === 'forgot' && forgotStep === 1 && (
          <View>
            <View className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 shadow-xs">
              {/* Email Field */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {tr('पंजीकृत ईमेल *', 'رجسٹرڈ ای میل *', 'Registered Email *')}
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1">
                    <Mail color="#94a3b8" size={16} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => scrollToInput(60)}
                      placeholder="email@example.com"
                      placeholderTextColor="#94a3b8"
                      className="flex-1 ml-2 text-xs font-medium text-slate-900 dark:text-white py-2"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={sendingOtp || countdown > 0}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 justify-center items-center flex-row gap-1 disabled:opacity-60"
                  >
                    {sendingOtp ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : countdown > 0 ? (
                      <Text className="text-xs font-bold text-white">{countdown}s</Text>
                    ) : (
                      <>
                        <RotateCcw color="#ffffff" size={14} />
                        <Text className="text-xs font-bold text-white">
                          {otpSent ? tr('पुनः भेजें', 'دوبارہ', 'Resend') : tr('OTP भेजें', 'او ٹی پی', 'Send OTP')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* 6-Digit OTP */}
              <View>
                <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {tr('6 अंकों का OTP दर्ज करें *', '6 ہندسوں کا OTP درج کریں *', 'Enter 6-Digit OTP *')}
                </Text>
                <TextInput
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
                  onFocus={() => scrollToInput(120)}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="------"
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-center font-mono font-bold text-lg tracking-widest text-slate-900 dark:text-white"
                />
              </View>
            </View>

            {/* Step 1 Submit Button: Verify OTP */}
            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={verifyingOtp || !otpSent || otp.length !== 6}
              className="bg-emerald-600 dark:bg-emerald-700 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90 disabled:opacity-60 mb-3"
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#ffffff" size={18} />
                  <Text className="text-white font-bold text-base">
                    {tr('OTP सत्यापित करें & आगे बढ़ें', 'او ٹی پی تصدیق کریں & آگے بڑھیں', 'Verify OTP & Continue')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Back to Normal Mode */}
            <TouchableOpacity
              onPress={() => {
                setMode('change');
                resetFormState();
              }}
              className="py-3 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ← {tr('सामान्य पासवर्ड मोड पर लौटें', 'عام پاس ورڈ موڈ پر واپس جائیں', 'Back to Normal Change Password')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================== */}
        {/* 3. FORGOT MODE - STEP 2: Create New Password                   */}
        {/* ============================================================== */}
        {mode === 'forgot' && forgotStep === 2 && (
          <View>
            {/* Verified Email Banner */}
            <View className="flex-row items-center justify-between p-3.5 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <View className="flex-row items-center gap-2 flex-1">
                <CheckCircle2 color="#059669" size={18} />
                <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  {tr('ईमेल सत्यापित:', 'ای میل تصدیق شدہ:', 'Verified:')}{' '}
                  <Text className="font-mono">{email}</Text>
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setForgotStep(1);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="bg-emerald-200/60 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg"
              >
                <Text className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                  {tr('बदलें', 'تبدیل', 'Change')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('नया पासवर्ड बनाएं *', 'نیا پاس ورڈ بنائیں *', 'Create New Password *')}
              </Text>
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-xs">
                <Lock color="#94a3b8" size={18} />
                <TextInput
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => scrollToInput(60)}
                  placeholder={tr('कम से कम 6 अक्षर', 'کم از کم 6 حروف', 'Minimum 6 characters')}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2.5 text-sm font-medium text-slate-900 dark:text-white py-2.5"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} className="p-1">
                  {showNew ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('नए पासवर्ड की पुष्टि करें *', 'نئے پاس ورڈ کی تصدیق کریں *', 'Confirm New Password *')}
              </Text>
              <View className="flex-row items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-1.5 shadow-xs">
                <Lock color="#94a3b8" size={18} />
                <TextInput
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => scrollToInput(120)}
                  placeholder={tr('नया पासवर्ड पुनः दर्ज करें', 'نیا پاس ورڈ دوبارہ درج کریں', 'Re-enter new password')}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2.5 text-sm font-medium text-slate-900 dark:text-white py-2.5"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
                  {showConfirm ? <EyeOff color="#94a3b8" size={18} /> : <Eye color="#94a3b8" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSavePassword}
              disabled={submitting}
              className="bg-emerald-600 dark:bg-emerald-700 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 shadow-md active:opacity-90 disabled:opacity-60 mb-3"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <ShieldCheck color="#ffffff" size={20} />
                  <Text className="text-white font-bold text-base">
                    {tr('नया पासवर्ड सहेजें', 'نیا پاس ورڈ محفوظ کریں', 'Set New Password')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Back to Step 1 */}
            <TouchableOpacity
              onPress={() => {
                setForgotStep(1);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="py-3 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ← {tr('चरण 1 पर लौटें', 'مرحلہ 1 پر واپس جائیں', 'Back to Step 1 (Verify OTP)')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
