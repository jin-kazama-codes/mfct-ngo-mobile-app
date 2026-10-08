import React, { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, User, Campaign, Donation } from '../types';
import { getCampaigns } from '../services/campaignService';
import { authenticateUser, getUserById } from '../services/userService';

interface AppStateContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  currentRole: UserRole;
  activeUser: User | null;
  campaignsList: Campaign[];
  handleLogin: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  handleRegisterSession: (user: User) => Promise<void>;
  handleUpdateActiveUser: (user: User) => Promise<void>;
  refreshCurrentUserStatus: () => Promise<User | null>;
  handleLogout: () => Promise<void>;
  handleCampaignCreated: (newCampaign: Campaign) => void;
  handleCampaignUpdated: (updatedCamp: Campaign) => void;
  handleDonationSuccess: (donation: Donation) => void;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

const STORAGE_KEYS = {
  IS_LOGGED_IN: 'mfct_is_logged_in',
  USER_DATA: 'mfct_user_data',
};

// Helper to resolve effective role (handling district officer assignments stored in district_role / districtRole)
export const resolveEffectiveUserRole = (user: User | null | undefined): UserRole => {
  if (!user) return 'member';
  if (user.role === 'super_admin') return 'super_admin';
  if (user.role === 'executive_admin') return 'executive_admin';
  if (user.role === 'community_admin') return 'community_admin';

  const raw = (
    user.district_role ||
    user.districtRole ||
    (user.role as string) ||
    ''
  )
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  if (raw === 'community_admin' || raw.includes('community')) {
    return 'community_admin';
  }
  if (raw === 'district_president' || raw.includes('president') || raw.includes('अध्यक्ष') || raw.includes('صدر')) {
    return 'district_president';
  }
  if (raw === 'district_coordinator' || raw.includes('coordinator') || raw.includes('संयोजक') || raw.includes('समन्वयक') || raw.includes('کوآرڈینیٹر')) {
    return 'district_coordinator';
  }
  if (raw === 'district_gen_secretary' || raw.includes('gen_sec') || raw.includes('general') || raw.includes('महासचिव') || raw.includes('جنرل')) {
    return 'district_gen_secretary';
  }
  if (raw === 'district_secretary' || raw.includes('secretary') || raw.includes('सचिव') || raw.includes('سیکرٹری')) {
    return 'district_secretary';
  }
  if (raw === 'district_finance_coord' || raw.includes('finance') || raw.includes('वित्त') || raw.includes('فنانس') || raw.includes('कोषाध्यक्ष')) {
    return 'district_finance_coord';
  }

  return (user.role as UserRole) || 'member';
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);

  // Load public campaigns on mount
  useEffect(() => {
    getCampaigns().then(setCampaignsList).catch(console.error);
  }, []);

  // Restore session from AsyncStorage
  useEffect(() => {
    const init = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
        if (isLoggedIn === 'true') {
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
          if (userDataStr) {
            const user = JSON.parse(userDataStr) as User;
            setActiveUser(user);
            setCurrentRole(resolveEffectiveUserRole(user));
            setIsAuthenticated(true);

            // Proactively fetch latest KYC status from database
            if (user.id) {
              getUserById(user.id).then(async (fresh) => {
                if (fresh) {
                  setActiveUser(fresh);
                  setCurrentRole(resolveEffectiveUserRole(fresh));
                  await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(fresh));
                }
              }).catch((e) => {
                console.warn('Failed to refresh user on mobile startup:', e);
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  const handleLogin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    const result = await authenticateUser(email, password);
    if (!result.success || !result.user) {
      return { success: false, error: result.error };
    }

    const user = result.user;
    setIsAuthenticated(true);
    setCurrentRole(resolveEffectiveUserRole(user));
    setActiveUser(user);

    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { success: true, user };
  };

  const handleRegisterSession = async (user: User) => {
    setIsAuthenticated(true);
    setCurrentRole(resolveEffectiveUserRole(user));
    setActiveUser(user);

    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  };

  const handleUpdateActiveUser = useCallback(async (user: User) => {
    const updated = { ...user };
    setActiveUser(updated);
    setCurrentRole(resolveEffectiveUserRole(updated));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
  }, []);

  const refreshCurrentUserStatus = async (): Promise<User | null> => {
    if (!activeUser?.id) return null;
    try {
      const fresh = await getUserById(activeUser.id);
      if (fresh) {
        setActiveUser(fresh);
        setCurrentRole(resolveEffectiveUserRole(fresh));
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(fresh));
        return fresh;
      }
      return null;
    } catch (e) {
      console.warn('refreshCurrentUserStatus error:', e);
      return null;
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setActiveUser(null);
    setCurrentRole('member');

    await AsyncStorage.multiRemove([STORAGE_KEYS.IS_LOGGED_IN, STORAGE_KEYS.USER_DATA]);
    router.replace('/(tabs)');
  };

  const handleCampaignCreated = (newCampaign: Campaign) => {
    setCampaignsList(prev => [newCampaign, ...prev]);
  };

  const handleCampaignUpdated = (updatedCamp: Campaign) => {
    setCampaignsList(prev => prev.map(c => c.id === updatedCamp.id ? updatedCamp : c));
  };

  const handleDonationSuccess = (newDonation: Donation) => {
    setCampaignsList(prev =>
      prev.map(c => c.id === newDonation.campaignId ? {
        ...c, raisedINR: c.raisedINR + newDonation.amountINR, donorsCount: c.donorsCount + 1
      } : c)
    );
  };

  return (
    <AppStateContext.Provider value={{
      isInitialized,
      isAuthenticated,
      currentRole,
      activeUser,
      campaignsList,
      handleLogin,
      handleRegisterSession,
      handleUpdateActiveUser,
      refreshCurrentUserStatus,
      handleLogout,
      handleCampaignCreated,
      handleCampaignUpdated,
      handleDonationSuccess,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}
