import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
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
  Building2, Building, IdCardLanyard, UserCheck, LogOut, Calendar, Network, Award
} from 'lucide-react-native';
import { UserRole, DistrictRoleKey } from '@/src/types';

function CustomDrawerContent(props: any) {
  const { currentRole, activeUser, handleLogout } = useAppState();
  const { colorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
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

  const bg = isDark ? '#0f172a' : '#ffffff';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const activeColor = '#10b981';
  const activeBg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';

  const distRoleKeys: DistrictRoleKey[] = [
    'district_president',
    'district_coordinator',
    'district_gen_secretary',
    'district_secretary',
    'district_finance_coord',
    'community_admin',
  ];

  const resolveDistrictRole = (val?: string | null): DistrictRoleKey | null => {
    if (!val || typeof val !== 'string') return null;
    const v = val.toLowerCase().trim().replace(/\s+/g, '_');
    if (distRoleKeys.includes(v as DistrictRoleKey)) return v as DistrictRoleKey;
    if (v.includes('community')) return 'community_admin';
    if (v.includes('president') || v.includes('अध्यक्ष') || v.includes('صدر')) return 'district_president';
    if (v.includes('coordinator') || v.includes('संयोजक') || v.includes('समन्वयक') || v.includes('کوآرڈینیٹر')) return 'district_coordinator';
    if (v.includes('gen_sec') || v.includes('general') || v.includes('महासचिव') || v.includes('جنرل')) return 'district_gen_secretary';
    if (v.includes('secretary') || v.includes('सचिव') || v.includes('سیکرٹری')) return 'district_secretary';
    if (v.includes('finance') || v.includes('वित्त') || v.includes('فنانस') || v.includes('कोषाध्यक्ष')) return 'district_finance_coord';
    return null;
  };

  const rawDistrictRole = (activeUser?.district_role || activeUser?.districtRole || (activeUser?.role as string) || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  const effectiveDistrictRole: DistrictRoleKey | null =
    resolveDistrictRole(activeUser?.district_role) ||
    resolveDistrictRole(activeUser?.districtRole) ||
    resolveDistrictRole((activeUser as any)?.districtRoleKey) ||
    resolveDistrictRole(rawDistrictRole);

  const rawCurrentRole = ((currentRole as string) || '').toLowerCase().trim().replace(/\s+/g, '_');
  const previewDistrictRole: DistrictRoleKey | null =
    distRoleKeys.find((k) => k === rawCurrentRole || rawCurrentRole.includes(k.replace('district_', ''))) ||
    resolveDistrictRole(currentRole);

  let normalizedRole: UserRole = 'member';
  if (activeUser?.role === 'super_admin') {
    normalizedRole = 'super_admin';
  } else if (activeUser?.role === 'executive_admin') {
    normalizedRole = 'executive_admin';
  } else if (
    effectiveDistrictRole === 'community_admin' ||
    activeUser?.role === 'community_admin' ||
    (currentRole as string) === 'community_admin' ||
    rawDistrictRole === 'community_admin' ||
    rawDistrictRole.includes('community')
  ) {
    normalizedRole = 'community_admin';
  } else if (effectiveDistrictRole) {
    normalizedRole = effectiveDistrictRole;
  } else if (previewDistrictRole) {
    normalizedRole = previewDistrictRole;
  } else {
    normalizedRole = (currentRole as UserRole) || 'member';
  }

  // Role Badges for Drawer Header matching website
  const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
    member: { label: translateRole('member', lang), bg: '#10b98120', text: '#10b981' },
    community_admin: { label: translateRole('community_admin', lang), bg: '#0284c720', text: '#0284c7' },
    executive_admin: { label: translateRole('executive_admin', lang), bg: '#9333ea20', text: '#9333ea' },
    super_admin: { label: translateRole('super_admin', lang), bg: isDark ? '#334155' : '#0f172a', text: '#fde047' },
    district_president: {
      label: lang === 'hi' ? 'जिला अध्यक्ष' : lang === 'ur' ? 'ضلعی صدر' : 'District President',
      bg: '#d9770625',
      text: '#d97706',
    },
    district_coordinator: {
      label: lang === 'hi' ? 'जिला संयोजक' : lang === 'ur' ? 'ضلعی کوآرڈینیٹر' : 'District Coordinator',
      bg: '#05966925',
      text: '#059669',
    },
    district_gen_secretary: {
      label: lang === 'hi' ? 'जिला महासचिव / संगठन प्रभारी' : lang === 'ur' ? 'ضلعی جنرل سیکرٹری / انچارج تنظیم' : 'District General Secretary',
      bg: '#7c3aed25',
      text: '#7c3aed',
    },
    district_secretary: {
      label: lang === 'hi' ? 'जिला सचिव' : lang === 'ur' ? 'ضلعی سیکرٹری' : 'District Secretary',
      bg: '#2563eb25',
      text: '#2563eb',
    },
    district_finance_coord: {
      label: lang === 'hi' ? 'जिला वित्त समन्वयक' : lang === 'ur' ? 'ضلعی فنانس کوآرڈینیٹر' : 'District Finance Coordinator',
      bg: '#ea580c25',
      text: '#ea580c',
    },
  };

  const currentBadge = roleBadges[normalizedRole] || roleBadges.member;

  // Build menu items matching website AdminPanel.tsx getSidebarMenus()
  const getMenuItems = () => {
    const items: Array<{
      name: string;
      label: string;
      icon: any;
      show: boolean;
    }> = [];

    switch (normalizedRole) {

      // SUPER ADMIN & EXECUTIVE ADMIN
      case 'super_admin':
      case 'executive_admin':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'financial-analytics', label: t('admin.tabFinancialAnalytics', 'Financial Analytics'), icon: TrendingUp, show: true },
          { name: 'kyc-aproved', label: t('admin.tabKycQueue', 'KYC Approvals'), icon: UserCheck, show: true },
          { name: 'utr-aproved', label: t('admin.tabUtrAudit', 'UTR Payment Desk'), icon: ShieldCheck, show: true },
          { name: 'campaigns', label: t('admin.tabCampaigns', 'Manage Campaigns'), icon: PlusCircle, show: true },
          { name: 'communities', label: t('admin.tabCommunitiesManage', 'Manage Communities'), icon: Building2, show: true },
          { name: 'manage-users', label: t('admin.tabUsersManage', 'Manage Users'), icon: Users, show: true },
          { name: 'teams', label: t('admin.tabTeams', 'Block & City Teams'), icon: Network, show: true },
          { name: 'meetings', label: t('admin.tabMeetings', 'Meetings & Minutes'), icon: Calendar, show: true },
          { name: 'impact-stories', label: t('admin.tabTestimonialsManage', 'Impact Stories'), icon: MessageSquare, show: true },
          { name: 'gallery', label: t('admin.tabGalleryManage', 'Manage Gallery'), icon: ImageIcon, show: true },
          { name: 'contact-messages', label: t('admin.tabContactMessages', 'Contact Messages'), icon: MessageSquare, show: true },
          { name: 'account-details', label: t('admin.tabAccountDetails', 'Account Details'), icon: Building2, show: true },
          { name: 'nominee-details', label: t('admin.tabNominee', 'Nominee Details'), icon: UserCheck, show: true },
          { name: 'member-bank-details', label: t('admin.tabMemberBank', 'Bank Account Details'), icon: Building, show: true },
        );
        break;

      // 01. DISTRICT PRESIDENT
      case 'district_president':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'district-committee', label: t('admin.tabDistrictCommittee', 'District Committee'), icon: Award, show: true },
          { name: 'kyc-aproved', label: t('admin.tabKycQueue', 'KYC Approvals'), icon: UserCheck, show: true },
          { name: 'utr-aproved', label: t('admin.tabUtrAudit', 'UTR Payment Desk'), icon: ShieldCheck, show: true },
          { name: 'communities', label: t('admin.tabCommunitiesManage', 'Manage Communities'), icon: Building2, show: true },
          { name: 'campaigns', label: t('admin.tabCampaigns', 'Manage Campaigns'), icon: PlusCircle, show: true },
          { name: 'teams', label: t('admin.tabTeams', 'Block & City Teams'), icon: Network, show: true },
          { name: 'meetings', label: t('admin.tabMeetings', 'Meetings & Minutes'), icon: Calendar, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'District Members'), icon: Users, show: true },
        );
        break;

      // 02. DISTRICT COORDINATOR
      case 'district_coordinator':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'district-committee', label: t('admin.tabDistrictCommittee', 'District Committee'), icon: Award, show: true },
          { name: 'kyc-aproved', label: t('admin.tabKycQueue', 'KYC Approvals'), icon: UserCheck, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'District Members'), icon: Users, show: true },
        );
        break;

      // 03. DISTRICT GENERAL SECRETARY
      case 'district_gen_secretary':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'district-committee', label: t('admin.tabDistrictCommittee', 'District Committee'), icon: Award, show: true },
          { name: 'teams', label: t('admin.tabTeams', 'Block & City Teams'), icon: Network, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'District Members'), icon: Users, show: true },
        );
        break;

      // 04. DISTRICT SECRETARY
      case 'district_secretary':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'district-committee', label: t('admin.tabDistrictCommittee', 'District Committee'), icon: Award, show: true },
          { name: 'meetings', label: t('admin.tabMeetings', 'Meetings & Minutes'), icon: Calendar, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'District Members'), icon: Users, show: true },
        );
        break;

      // 05. DISTRICT FINANCE COORDINATOR
      case 'district_finance_coord':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'district-committee', label: t('admin.tabDistrictCommittee', 'District Committee'), icon: Award, show: true },
          { name: 'financial-analytics', label: t('admin.tabFinancialAnalytics', 'Financial Analytics'), icon: TrendingUp, show: true },
          { name: 'utr-aproved', label: t('admin.tabUtrAudit', 'UTR Payment Desk'), icon: ShieldCheck, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'District Members'), icon: Users, show: true },
        );
        break;

      // COMMUNITY ADMIN
      case 'community_admin':
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'communities', label: t('admin.tabCommunityHub', 'My Community'), icon: Building2, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'Community Members'), icon: Users, show: true },
          { name: 'campaigns', label: t('admin.tabCampaigns', 'Manage Campaigns'), icon: PlusCircle, show: true },
          { name: 'kyc-aproved', label: t('admin.tabKycQueue', 'KYC Approvals'), icon: UserCheck, show: true },
          { name: 'utr-aproved', label: t('admin.tabUtrAudit', 'UTR Payment Desk'), icon: ShieldCheck, show: true },
          { name: 'financial-analytics', label: t('admin.tabFinancialAnalytics', 'Financial Analytics'), icon: TrendingUp, show: true },
          { name: 'impact-stories', label: t('admin.tabTestimonialsManage', 'Impact Stories'), icon: MessageSquare, show: true },
          { name: 'gallery', label: t('admin.tabGalleryManage', 'Manage Gallery'), icon: ImageIcon, show: true },
          { name: 'nominee-details', label: t('admin.tabNominee', 'Nominee Details'), icon: UserCheck, show: true },
          { name: 'member-bank-details', label: t('admin.tabMemberBank', 'Bank Account Details'), icon: Building, show: true },
        );
        break;

      // MEMBER / DONOR
      default:
        items.push(
          { name: 'index', label: t('admin.tabOverview', 'Dashboard Overview'), icon: LayoutDashboard, show: true },
          { name: 'my-id-card', label: t('nav.myCard', 'My ID Card'), icon: IdCardLanyard, show: true },
          { name: 'myDonation', label: t('admin.tabDonations', 'My Donations Receipts'), icon: CreditCard, show: true },
          { name: 'nominee-details', label: t('admin.tabNominee', 'Nominee Details'), icon: UserCheck, show: true },
          { name: 'member-bank-details', label: t('admin.tabMemberBank', 'Bank Account Details'), icon: Building, show: true },
          { name: 'my-community', label: t('admin.tabCommunityHub', 'My Community'), icon: Building2, show: true },
          { name: 'community-members', label: t('admin.tabMembers', 'Community Members'), icon: Users, show: true },
        );
        break;
    }

    return items;
  };

  const menuItems = getMenuItems();

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
              <View style={[s.rolePill, { backgroundColor: currentBadge.bg }]}>
                <Text style={[s.roleText, { color: currentBadge.text }]}>
                  {currentBadge.label}
                </Text>
              </View>

              {activeUser && (activeUser.status === 'pending' || activeUser.status === 'reject' || activeUser.status === 'rejected') && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/under-review')}
                  style={{
                    marginTop: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: activeUser.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    borderWidth: 1,
                    borderColor: activeUser.status === 'pending' ? '#fde68a' : '#fecdd3',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: activeUser.status === 'pending' ? '#92400e' : '#b91c1c',
                    }}
                  >
                    {activeUser.status === 'pending'
                      ? (lang === 'hi' ? '⏳ समीक्षाधीन (देखें)' : lang === 'ur' ? 'زیر جائزہ' : 'Under Review')
                      : (lang === 'hi' ? '⚠️ अस्वीकृत (सुधारें)' : lang === 'ur' ? 'مسترد' : 'Action Required')}
                  </Text>
                </TouchableOpacity>
              )}
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
      <Drawer.Screen name="index" options={{ title: t('admin.tabOverview', 'Dashboard Overview') }} />
      <Drawer.Screen name="district-committee" options={{ title: t('admin.tabDistrictCommittee', 'District Committee') }} />
      <Drawer.Screen name="my-id-card" options={{ title: t('nav.myCard', 'My ID Card') }} />
      <Drawer.Screen name="myDonation" options={{ title: t('admin.tabDonations', 'My Donations Receipts') }} />
      <Drawer.Screen name="financial-analytics" options={{ title: t('admin.tabFinancialAnalytics', 'Financial Analytics') }} />
      <Drawer.Screen name="utr-aproved" options={{ title: t('admin.tabUtrAudit', 'UTR Payment Desk') }} />
      <Drawer.Screen name="kyc-aproved" options={{ title: t('admin.tabKycQueue', 'KYC Approvals') }} />
      <Drawer.Screen name="campaigns" options={{ title: t('admin.tabCampaigns', 'Manage Campaigns') }} />
      <Drawer.Screen name="communities" options={{ title: t('admin.tabCommunitiesManage', 'Manage Communities') }} />
      <Drawer.Screen name="my-community" options={{ title: t('admin.tabCommunityHub', 'My Community') }} />
      <Drawer.Screen name="manage-users" options={{ title: t('admin.tabUsersManage', 'Manage Users') }} />
      <Drawer.Screen name="community-members" options={{ title: t('admin.tabMembers', 'Community Members') }} />
      <Drawer.Screen name="meetings" options={{ title: t('admin.tabMeetings', 'Meetings & Minutes') }} />
      <Drawer.Screen name="teams" options={{ title: t('admin.tabTeams', 'Block & City Teams') }} />
      <Drawer.Screen name="gallery" options={{ title: t('admin.tabGalleryManage', 'Manage Gallery') }} />
      <Drawer.Screen name="impact-stories" options={{ title: t('admin.tabTestimonialsManage', 'Impact Stories') }} />
      <Drawer.Screen name="contact-messages" options={{ title: t('admin.tabContactMessages', 'Contact Messages') }} />
      <Drawer.Screen name="account-details" options={{ title: t('admin.tabAccountDetails', 'Account Details') }} />
      <Drawer.Screen name="nominee-details" options={{ title: t('admin.tabNominee', 'Nominee Details') }} />
      <Drawer.Screen name="member-bank-details" options={{ title: t('admin.tabMemberBank', 'Bank Account Details') }} />
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
