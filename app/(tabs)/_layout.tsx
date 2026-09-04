import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { LayoutDashboard, Megaphone, Users, Image as ImageIcon, BookOpen, Globe, Moon, Sun, User, LogIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../src/context/AppStateProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { isAuthenticated } = useAppState();

  const isDark = colorScheme === 'dark';
  const tabBgColor = isDark ? '#0f172a' : '#f8fafc';
  const borderCol  = isDark ? '#1e293b' : '#e2e8f0';
  const activeColor   = '#10b981';
  const inactiveColor = isDark ? '#64748b' : '#94a3b8';
  const textColor  = isDark ? '#ffffff' : '#020617';
  const headerIconColor = isDark ? '#94a3b8' : '#475569';

  // Toggle theme and persist choice
  const handleToggleTheme = async () => {
    toggleColorScheme();
    const next = isDark ? 'light' : 'dark';
    try { await AsyncStorage.setItem('mfct_theme', next); } catch {}
  };

  // Toggle language and persist choice
  const handleToggleLanguage = async () => {
    const next = i18n.language === 'hi' ? 'ur' : 'hi';
    i18n.changeLanguage(next);
    try { await AsyncStorage.setItem('mfct_language', next); } catch {}
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: { backgroundColor: tabBgColor, borderTopColor: borderCol },
        headerStyle: { backgroundColor: tabBgColor },
        headerTintColor: textColor,
        tabBarLabelStyle: { fontSize: 9, marginTop: -4, marginBottom: 4 },
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 16, alignItems: 'center' }}>
            {/* Language toggle - EN / HI */}
            <TouchableOpacity onPress={handleToggleLanguage}>
              <Globe color={headerIconColor} size={22} />
            </TouchableOpacity>

            {/* Theme toggle - Light / Dark */}
            <TouchableOpacity onPress={handleToggleTheme}>
              {isDark
                ? <Sun color={headerIconColor} size={22} />
                : <Moon color={headerIconColor} size={22} />
              }
            </TouchableOpacity>

            {/* Auth icon: Dashboard when logged in, Login when not */}
            {isAuthenticated ? (
              <TouchableOpacity onPress={() => router.push('/(drawer)/dashboard')}>
                <LayoutDashboard color={activeColor} size={22} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <User color={headerIconColor} size={22} />
              </TouchableOpacity>
            )}
          </View>
        ),
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={18} />,
        }}
      />

      <Tabs.Screen
        name="campaigns"
        options={{
          title: t('tabs.campaigns'),
          tabBarIcon: ({ color }) => <Megaphone color={color} size={18} />,
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.communities'),
          tabBarIcon: ({ color }) => <Users color={color} size={18} />,
        }}
      />

      <Tabs.Screen
        name="gallery"
        options={{
          title: t('tabs.gallery'),
          tabBarIcon: ({ color }) => <ImageIcon color={color} size={18} />,
        }}
      />

      <Tabs.Screen
        name="impact-stories"
        options={{
          title: t('tabs.impact'),
          tabBarIcon: ({ color }) => <BookOpen color={color} size={18} />,
        }}
      />
    </Tabs>
  );
}
