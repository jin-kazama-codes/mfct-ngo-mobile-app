import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform, Image,
    Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../src/context/AppStateProvider';
import {
    Phone, Mail, Lock, LogIn, Eye, EyeOff, Globe,
    ArrowLeft, ShieldCheck, AlertCircle
} from 'lucide-react-native';

export default function SignInScreen() {
    const { t, i18n } = useTranslation();
    const currentLang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    const isHindi = currentLang.startsWith('hi');

    const tr = (hi: string, en: string) => isHindi ? hi : en;

    const handleToggleLanguage = async () => {
        const next = isHindi ? 'en' : 'hi';
        i18n.changeLanguage(next);
        try {
            await AsyncStorage.setItem('mfct_language', next);
        } catch { }
    };

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordInputRef = useRef<TextInput>(null);
    const { handleLogin } = useAppState();

    const onLoginPress = async () => {
        Keyboard.dismiss();
        if (!identifier.trim() || !password) {
            setError(
                tr(
                    'कृपया अपना मोबाइल नंबर और पासवर्ड दर्ज करें।',
                    'Please enter your phone number and password.'
                )
            );
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await handleLogin(identifier.trim(), password);
            setIsLoading(false);

            if (result.success) {
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

                            {/* Phone Input */}
                            <View className="gap-1">
                                <Text className="text-slate-700 dark:text-slate-300 font-semibold text-xs ml-1">
                                    {tr('मोबाइल नंबर / ईमेल', 'Phone Number / Email')}
                                </Text>
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5">
                                    <Phone color="#94a3b8" size={17} />
                                    <TextInput
                                        className="flex-1 text-slate-900 dark:text-white px-3 py-3 text-sm"
                                        placeholder={tr('मोबाइल नंबर दर्ज करें', 'Enter 10-digit phone number')}
                                        placeholderTextColor="#94a3b8"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="default"
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
        </KeyboardAvoidingView>
    );
}
