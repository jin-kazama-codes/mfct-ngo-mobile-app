import '../global.css';
import { useFonts } from 'expo-font';
import { Stack, useSegments, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppStateProvider, useAppState } from '../src/context/AppStateProvider';
import { useColorScheme } from 'nativewind';
import '../src/i18n';
import { useTranslation } from 'react-i18next';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

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

        // Restore screen if Android OS killed the activity while camera was active
        const cameraOrigin = await AsyncStorage.getItem('@camera_launch_origin');
        if (cameraOrigin) {
          setTimeout(() => {
            router.replace(cameraOrigin as any);
          }, 150);
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

// Guards pending users from accessing common mobile app or admin, locking them to under-review screen only
function AuthRouteGuard() {
  const { isAuthenticated, isInitialized, activeUser } = useAppState();
  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated && activeUser) {
      const status = (activeUser.status || '').toLowerCase();
      const isApproved =
        status === 'approved' ||
        (activeUser.isVerified && status !== 'pending' && status !== 'reject' && status !== 'rejected');
      const isPending = status === 'pending' || status === 'reject' || status === 'rejected' || !isApproved;

      const firstSeg = segments[0];
      const secondSeg = segments[1];
      const onUnderReview = firstSeg === '(auth)' && secondSeg === 'under-review';
      const onSignUp = firstSeg === '(auth)' && secondSeg === 'sign-up';

      // Do not interrupt active registration flow while user is on sign-up screen
      if (isPending && !onUnderReview && !onSignUp) {
        router.replace('/(auth)/under-review');
      }
    }
  }, [isInitialized, isAuthenticated, activeUser, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.warn('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <AppInit />
          <AuthRouteGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="(stacks)" options={{ headerShown: false }} />
          </Stack>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

