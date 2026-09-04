import '../global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppStateProvider } from '../src/context/AppStateProvider';
import { useColorScheme } from 'nativewind';
import '../src/i18n';
import { useTranslation } from 'react-i18next';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Restores saved theme & language before rendering anything
function AppInit() {
  const { setColorScheme } = useColorScheme();
  const { i18n } = useTranslation();

  useEffect(() => {
    const restore = async () => {
      try {
        const [savedTheme, savedLang] = await Promise.all([
          AsyncStorage.getItem('mfct_theme'),
          AsyncStorage.getItem('mfct_language'),
        ]);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setColorScheme(savedTheme);
        } else {
          setColorScheme('light'); // default
        }
        if (savedLang === 'hi' || savedLang === 'en' || savedLang === 'ur') {
          i18n.changeLanguage(savedLang);
        } else {
          i18n.changeLanguage('hi');
          await AsyncStorage.setItem('mfct_language', 'hi');
        }
      } catch (e) {
        console.error('Failed to restore preferences:', e);
        setColorScheme('light');
        i18n.changeLanguage('hi');
      }
    };
    restore();
  }, []);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <AppInit />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="(stacks)" options={{ headerShown: false }} />
        </Stack>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}

