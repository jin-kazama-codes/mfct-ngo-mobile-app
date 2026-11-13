import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function RazorpayCallbackScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
        Completing Razorpay Payment...
      </Text>
    </View>
  );
}

