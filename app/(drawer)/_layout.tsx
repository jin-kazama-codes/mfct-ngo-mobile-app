import { Tabs } from 'expo-router';
import { LayoutDashboard, User, Heart, Users, Building2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../src/context/AppStateProvider';

export default function DrawerGroupLayout() {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';
  const { currentRole, activeUser } = useAppState();

  const rawRole = (activeUser?.role || currentRole || 'member') as string;
  let userRole = rawRole.toLowerCase().trim().replace(/ /g, '_');
  if (userRole.includes('executive')) userRole = 'executive_admin';
  else if (userRole.includes('community')) userRole = 'community_admin';
  else if (userRole.includes('super')) userRole = 'super_admin';
  else if (userRole.includes('member')) userRole = 'member';

  const isAdmin = userRole === 'super_admin' || userRole === 'executive_admin' || userRole === 'community_admin';
  const isSuperOrExec = userRole === 'super_admin' || userRole === 'executive_admin';

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
        name="campaigns"
        options={{
          title: t('nav.campaigns', 'Campaigns'),
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <Heart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="manage-users"
        options={{
          title: t('nav.users', 'Users'),
          href: isSuperOrExec ? undefined : null,
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: t('nav.communities', 'Communities'),
          href: isSuperOrExec ? undefined : null,
          tabBarIcon: ({ color }) => <Building2 color={color} size={22} />,
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
