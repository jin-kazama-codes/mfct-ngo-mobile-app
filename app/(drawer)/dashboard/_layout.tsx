import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Drawer, DrawerContentScrollView, DrawerItem } from 'expo-router/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../../../src/context/AppStateProvider';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
  getLanguageCode,
  translateRole,
} from '../../../src/lib/translateEntity';
import {
  LayoutDashboard, CreditCard, PlusCircle, Users,
  ShieldCheck, TrendingUp, Image as ImageIcon, MessageSquare,
  Building2, IdCardLanyard, UserCheck, LogOut
} from 'lucide-react-native';
import { UserRole } from '@/src/types';

function CustomDrawerContent(props: any) {
  const { currentRole, activeUser, handleLogout } = useAppState();
  const { colorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0f172a' : '#ffffff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const activeColor = '#10b981';
  const activeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';

  const rawRole = (activeUser?.role || currentRole || 'member') as string;
  let userRole = rawRole.toLowerCase().trim().replace(/ /g, '_') as UserRole;
  if (userRole.includes('executive')) userRole = 'executive_admin';
  else if (userRole.includes('community')) userRole = 'community_admin';
  else if (userRole.includes('super')) userRole = 'super_admin';
  else if (userRole.includes('member')) userRole = 'member';

  const isMember = userRole === 'member';
  const isCommunityAdmin = userRole === 'community_admin';
  const isExecOrSuper = userRole === 'executive_admin' || userRole === 'super_admin';

  const showFinancialAnalytics = isCommunityAdmin || isExecOrSuper;
  const showKyc = isCommunityAdmin || isExecOrSuper;
  const showUtr = isCommunityAdmin || isExecOrSuper;
  const showCommunityMembers = isCommunityAdmin || isMember;
  const showCampaigns = isCommunityAdmin || isExecOrSuper;
  const showCommunities = isExecOrSuper;
  const showGallery = isCommunityAdmin || isExecOrSuper;
  const showMessages = isExecOrSuper;
  const showUsers = isExecOrSuper;

  const menuItems = [
    { name: 'index', label: t('admin.tabOverview', 'Dashboard'), icon: LayoutDashboard, show: true },
    { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
    { name: 'myDonation', label: t('admin.tabDonations', 'My Donations'), icon: CreditCard, show: isMember },
    { name: 'financial-analytics', label: t('admin.tabFinancialAnalytics', 'Financial Analytics'), icon: TrendingUp, show: showFinancialAnalytics },
    { name: 'utr-aproved', label: t('admin.tabUtrAudit', 'UTR Payment Desk'), icon: ShieldCheck, show: showUtr },
    { name: 'kyc-aproved', label: t('admin.tabKycQueue', 'KYC Approval'), icon: UserCheck, show: showKyc },
    { name: 'community-members', label: t('admin.tabMembers', 'Community Members'), icon: Users, show: showCommunityMembers },
    { name: 'gallery', label: t('admin.tabGalleryManage', 'Manage Gallery'), icon: ImageIcon, show: showGallery },
    { name: 'impact-stories', label: t('admin.tabTestimonialsManage', 'Impact Stories'), icon: MessageSquare, show: showGallery },
    { name: 'contact-messages', label: t('admin.tabContactMessages', 'Contact Messages'), icon: MessageSquare, show: showMessages },
  ];

  const currentRouteName = props.state.routes[props.state.index]?.name;

  const handleItemPress = (itemName: string) => {
    const route = props.state.routes.find((r: any) => r.name === itemName || r.name.trim() === itemName.trim());
    const isFocused = currentRouteName === itemName || currentRouteName?.trim() === itemName.trim();

    if (route) {
      const event = props.navigation.emit({
        type: 'drawerItemPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        props.navigation.dispatch({
          ...(isFocused
            ? { type: 'CLOSE_DRAWER' }
            : { type: 'NAVIGATE', payload: { name: route.name, params: route.params } }),
          target: props.state.key,
        });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[s.scrollContent, { backgroundColor: bg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header in Drawer */}
        <View style={[s.headerCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.avatarRow}>
            {activeUser?.avatar ? (
              <Image source={{ uri: activeUser.avatar }} style={s.avatarImg} />
            ) : (
              <View style={[s.avatarFallback, { backgroundColor: activeBg }]}>
                <Text style={[s.avatarInitial, { color: activeColor }]}>
                  {activeUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.userName, { color: textPrimary }]} numberOfLines={1}>
                {activeUser?.name || 'MFCT Member'}
              </Text>
              <View style={s.rolePill}>
                <Text style={s.roleText}>
                  {translateRole(rawRole, lang)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Menu List */}
        <View style={s.menuList}>
          {menuItems
            .filter(item => item.show)
            .map(item => {
              const isFocused = currentRouteName === item.name;
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    s.menuItem,
                    isFocused && { backgroundColor: activeBg, borderColor: activeColor },
                  ]}
                  onPress={() => handleItemPress(item.name)}
                  activeOpacity={0.7}
                >
                  <Icon
                    color={isFocused ? activeColor : textSecondary}
                    size={19}
                  />
                  <Text
                    style={[
                      s.menuLabel,
                      { color: isFocused ? activeColor : textPrimary },
                      isFocused && { fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Logout Button at Bottom */}
        <View style={[s.footer, { borderTopColor: border }]}>
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={async () => {
              props.navigation.dispatch({
                type: 'CLOSE_DRAWER',
                target: props.state.key,
              });
              await handleLogout();
            }}
            activeOpacity={0.7}
          >
            <LogOut color="#ef4444" size={18} />
            <Text style={s.logoutText}>{t('nav.logout', 'Sign Out')}</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default function DashboardDrawerLayout() {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#ffffff' : '#020617';
  const active = '#10b981';
  const inactive = isDark ? '#94a3b8' : '#64748b';

  return (
    <Drawer
      defaultStatus="closed"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerType: 'front',
        swipeEnabled: false,
        swipeEdgeWidth: 0,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        drawerStyle: { backgroundColor: bg, width: 280 },
        drawerActiveTintColor: active,
        drawerInactiveTintColor: inactive,
        drawerLabelStyle: { fontWeight: '600', fontSize: 14 },
      }}
    >
      <Drawer.Screen name="index" options={{ title: t('admin.tabOverview', 'Dashboard') }} />
      <Drawer.Screen name="my-id-card" options={{ title: t('nav.myCard', 'My ID Card') }} />
      <Drawer.Screen name="myDonation" options={{ title: t('admin.tabDonations', 'My Donations') }} />
      <Drawer.Screen name="financial-analytics" options={{ title: t('admin.tabFinancialAnalytics', 'Financial Analytics') }} />
      <Drawer.Screen name="utr-aproved" options={{ title: t('admin.tabUtrAudit', 'UTR Payment Desk') }} />
      <Drawer.Screen name="kyc-aproved" options={{ title: t('admin.tabKycQueue', 'KYC Approval') }} />
      <Drawer.Screen name="community-members" options={{ title: t('admin.tabMembers', 'Community Members') }} />
      <Drawer.Screen name="gallery" options={{ title: t('admin.tabGalleryManage', 'Manage Gallery') }} />
      <Drawer.Screen name="impact-stories" options={{ title: t('admin.tabTestimonialsManage', 'Impact Stories') }} />
      <Drawer.Screen name="contact-messages" options={{ title: t('admin.tabContactMessages', 'Contact Messages') }} />
    </Drawer>
  );
}

const s = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerCard: {
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b98120',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
