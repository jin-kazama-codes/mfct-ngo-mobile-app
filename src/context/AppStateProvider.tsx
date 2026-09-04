import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, User, Campaign, Donation } from '../types';
import { getCampaigns } from '../services/campaignService';
import { authenticateUser } from '../services/userService';

interface AppStateContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  currentRole: UserRole;
  activeUser: User | null;
  campaignsList: Campaign[];
  handleLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  handleRegisterSession: (user: User) => Promise<void>;
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
            setCurrentRole(user.role);
            setIsAuthenticated(true);
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
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await authenticateUser(email, password);
    if (!result.success || !result.user) {
      return { success: false, error: result.error };
    }

    const user = result.user;
    setIsAuthenticated(true);
    setCurrentRole(user.role);
    setActiveUser(user);

    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { success: true };
  };

  const handleRegisterSession = async (user: User) => {
    setIsAuthenticated(true);
    setCurrentRole(user.role);
    setActiveUser(user);

    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
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
      handleLogout,
      handleCampaignCreated,
      handleCampaignUpdated,
      handleDonationSuccess,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}
