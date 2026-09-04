import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { useAppState } from '../../src/context/AppStateProvider';
import { UserRole } from '../../src/types';
import {
    Shield, Users, TrendingUp, Crown, Star,
    ChevronRight, ArrowLeft, LogIn, Eye, EyeOff
} from 'lucide-react-native';

interface RoleOption {
    role: UserRole;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        role: 'member',
        label: 'Member',
        description: 'View campaigns, donate, track your impact',
        icon: <Users color="#3b82f6" size={22} />,
        color: '#3b82f6',
        bg: '#eff6ff',
    },
    {
        role: 'community_admin',
        label: 'Community Admin',
        description: 'Manage your community campaigns & members',
        icon: <Users color="#10b981" size={22} />,
        color: '#10b981',
        bg: '#ecfdf5',
    },
    {
        role: 'executive_admin',
        label: 'Executive Admin',
        description: 'Oversee multiple communities & finances',
        icon: <TrendingUp color="#8b5cf6" size={22} />,
        color: '#8b5cf6',
        bg: '#f5f3ff',
    },
    {
        role: 'super_admin',
        label: 'Super Admin',
        description: 'Full platform access & system control',
        icon: <Crown color="#ef4444" size={22} />,
        color: '#ef4444',
        bg: '#fef2f2',
    },
];

export default function SignInScreen() {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { handleLogin } = useAppState();

    const onRoleSelect = (role: RoleOption) => {
        setSelectedRole(role);
        setStep(2);
        setError('');
    };

    const onBack = () => {
        setStep(1);
        setError('');
    };

    const onLoginPress = async () => {
        if (!phone.trim() || !password) {
            setError('Please enter your phone number and password');
            return;
        }
        setIsLoading(true);
        setError('');

        const result = await handleLogin(phone.trim(), password);
        setIsLoading(false);

        if (result.success) {
            router.replace('/(drawer)/dashboard');
        } else {
            setError(result.error || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white dark:bg-slate-950"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View className="bg-slate-50 dark:bg-slate-900 px-6 pt-16 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <View className="w-14 h-14 rounded-2xl bg-emerald-500 items-center justify-center mb-4">
                        <Shield color="#fff" size={28} />
                    </View>
                    <Text className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</Text>
                    <Text className="text-slate-500 dark:text-slate-400 mt-1">
                        {step === 1 ? 'Select your role to continue' : `Sign in as ${selectedRole?.label}`}
                    </Text>
                </View>

                {step === 1 ? (
                    /* STEP 1: Role Selection */
                    <View className="p-5 gap-3">
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                            Choose Your Role
                        </Text>
                        {ROLE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.role}
                                className="flex-row items-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                                onPress={() => onRoleSelect(option)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={{ backgroundColor: option.bg }}
                                    className="w-11 h-11 rounded-xl items-center justify-center mr-4"
                                >
                                    {option.icon}
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-slate-900 dark:text-white text-base">{option.label}</Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{option.description}</Text>
                                </View>
                                <ChevronRight color="#94a3b8" size={18} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    /* STEP 2: Phone + Password */
                    <View className="p-5 gap-4">
                        {/* Back Button */}
                        <TouchableOpacity
                            className="flex-row items-center gap-2 mb-2"
                            onPress={onBack}
                        >
                            <ArrowLeft color="#64748b" size={18} />
                            <Text className="text-slate-500 dark:text-slate-400 font-medium">Change role</Text>
                        </TouchableOpacity>

                        {/* Selected Role Badge */}
                        {selectedRole && (
                            <View
                                style={{ backgroundColor: selectedRole.bg, borderColor: selectedRole.color + '40' }}
                                className="flex-row items-center gap-3 p-3 rounded-xl border"
                            >
                                {selectedRole.icon}
                                <Text style={{ color: selectedRole.color }} className="font-bold">
                                    {selectedRole.label}
                                </Text>
                            </View>
                        )}

                        {/* Error Message */}
                        {error ? (
                            <View className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-3 rounded-xl">
                                <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>
                            </View>
                        ) : null}

                        {/* Phone Number Field */}
                        <View>
                            <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
                                Phone Number
                            </Text>
                            <TextInput
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3.5 rounded-xl text-base"
                                placeholder="Enter 10-digit phone number"
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="none"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        {/* Password Field */}
                        <View>
                            <Text className="text-slate-700 dark:text-slate-300 font-semibold mb-2 text-sm">
                                Password
                            </Text>
                            <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <TextInput
                                    className="flex-1 text-slate-900 dark:text-white px-4 py-3.5 text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    onSubmitEditing={onLoginPress}
                                />
                                <TouchableOpacity
                                    className="px-4 py-3"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff color="#94a3b8" size={20} />
                                        : <Eye color="#94a3b8" size={20} />
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            className="bg-emerald-500 py-4 rounded-xl items-center flex-row justify-center gap-2 mt-2"
                            onPress={onLoginPress}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <>
                                    <LogIn color="#fff" size={20} />
                                    <Text className="text-white font-bold text-base">Sign In</Text>
                                </>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="mt-4 items-center py-2"
                            onPress={() => router.push('/(auth)/sign-up')}
                        >
                            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Don't have a member account? <Text className="text-emerald-600 dark:text-emerald-400 font-bold">Register as Member</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
