import { Tabs, router } from 'expo-router';
import { LayoutDashboard, User, Heart, Users, Building2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../src/context/AppStateProvider';

export default function DrawerGroupLayout() {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const { activeUser } = useAppState();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (activeUser) {
      const status = (activeUser.status || '').toLowerCase();
      const isApproved =
        status === 'approved' ||
        (activeUser.isVerified && status !== 'pending' && status !== 'reject' && status !== 'rejected');
      if (status === 'pending' || status === 'reject' || status === 'rejected' || !isApproved) {
        router.replace('/(auth)/under-review');
      }
    }
  }, [activeUser]);

  const tabBgColor = isDark ? '#0f172a' : '#ffffff';
  const borderCol = isDark ? '#1e293b' : '#e2e8f0';
  const activeColor = '#10b981';
  const inactiveColor = isDark ? '#64748b' : '#94a3b8';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBgColor,
          borderTopColor: borderCol,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.dashboard', 'Dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile', 'Profile'),
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
