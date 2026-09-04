import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { LayoutDashboard, Megaphone, Users, Image as ImageIcon, BookOpen, Globe, Moon, Sun, User, FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { useAppState } from '../../src/context/AppStateProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ngoLogo = require('../../assets/images/ngo-logo.png');

// ─── MFCT Brand Theme Colors ───────────────────────────────────────────────
const brand = {
  darkGreen: '#091f15',
  richGreen: '#1a4230',
  midGreen: '#0e2a1d',
  gold: '#c8a84b',
  goldLight: '#e2cf86',
  white: '#ffffff',
};

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { isAuthenticated } = useAppState();

  const isDark = colorScheme === 'dark';
  const tabBgColor = brand.darkGreen;
  const borderCol  = 'rgba(200,168,75,0.35)';
  const activeColor   = brand.gold;
  const inactiveColor = 'rgba(255,255,255,0.65)';
  const textColor  = brand.white;
  const headerIconColor = brand.gold;

  // Toggle theme and persist choice
  const handleToggleTheme = async () => {
    toggleColorScheme();
    const next = isDark ? 'light' : 'dark';
    try { await AsyncStorage.setItem('mfct_theme', next); } catch {}
  };

  // Public pages: cycle between Hindi and English only (no Urdu)
  const isHi = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('hi');
  const handleToggleLanguage = async () => {
    const next = isHi ? 'en' : 'hi';
    i18n.changeLanguage(next);
    try { await AsyncStorage.setItem('mfct_language', next); } catch {}
  };

  // Language label shown on the Globe button
  const langLabel = isHi ? 'HI' : 'EN';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBgColor,
          borderTopColor: borderCol,
          borderTopWidth: 1.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        headerStyle: {
          backgroundColor: tabBgColor,
          borderBottomColor: brand.gold,
          borderBottomWidth: 1.5,
          elevation: 4,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        headerTintColor: textColor,
        headerTitle: '',
        headerLeft: () => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 16 }}
          >
            <Image
              source={ngoLogo}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 1.5,
                borderColor: brand.gold,
              }}
              resizeMode="cover"
            />
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '900',
                  color: brand.white,
                  letterSpacing: 0.5,
                  lineHeight: 16,
                }}
              >
                MFCT
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: '800',
                  color: brand.gold,
                  letterSpacing: 0.5,
                  marginTop: 1,
                }}
              >
                CHARITABLE TRUST
              </Text>
            </View>
          </TouchableOpacity>
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 16, alignItems: 'center' }}>
            {/* Language toggle - HI / EN (public: no Urdu) */}
            <TouchableOpacity
              onPress={handleToggleLanguage}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(200,168,75,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.4)',
              }}
            >
              <Globe color={brand.gold} size={15} />
              <Text style={{ color: brand.gold, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
                {langLabel}
              </Text>
            </TouchableOpacity>

            {/* Theme toggle - Light / Dark */}
            <TouchableOpacity
              onPress={handleToggleTheme}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: 'rgba(200,168,75,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.4)',
              }}
            >
              {isDark
                ? <Sun color={brand.gold} size={16} />
                : <Moon color={brand.gold} size={16} />
              }
            </TouchableOpacity>

            {/* Auth icon: Dashboard when logged in, Login when not */}
            {isAuthenticated ? (
              <TouchableOpacity
                onPress={() => router.push('/(drawer)/dashboard')}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: brand.gold,
                }}
              >
                <LayoutDashboard color={brand.darkGreen} size={16} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/sign-in')}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  backgroundColor: 'rgba(200,168,75,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(200,168,75,0.4)',
                }}
              >
                <User color={brand.gold} size={16} />
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
        name="niyamawali"
        options={{
          title: t('tabs.niyamawali'),
          tabBarIcon: ({ color }) => <FileText color={color} size={18} />,
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
