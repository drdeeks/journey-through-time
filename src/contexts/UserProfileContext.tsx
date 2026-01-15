import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWeb3 } from './Web3Context';

export interface UserProfileState {
  username: string;
  profilePicUrl: string | null;
}

export interface UserProfileContextType extends UserProfileState {
  updateUsername: (name: string) => void;
  updateProfilePic: (url: string | null) => void;
  resetProfile: () => void;
}

const DEFAULT_STATE: UserProfileState = {
  username: '',
  profilePicUrl: null,
};

const STORAGE_KEY = 'jt_profile';

const UserProfileContext = createContext<UserProfileContextType>({
  ...DEFAULT_STATE,
  updateUsername: () => {},
  updateProfilePic: () => {},
  resetProfile: () => {},
});

export const useUserProfile = () => useContext(UserProfileContext);

export const UserProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { account, mainDomain } = useWeb3();
  const [profile, setProfile] = useState<UserProfileState>(DEFAULT_STATE);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to parse stored profile:', err);
    }
  }, []);

  // Set default username when wallet connects / changes
  useEffect(() => {
    if (!account) return;

    setProfile((prev) => {
      if (prev.username) return prev; // keep custom username
      const fallback = mainDomain || account;
      return { ...prev, username: fallback };
    });
  }, [account, mainDomain]);

  // Persist profile changes
  useEffect(() => {
    saveToStorage(profile);
  }, [profile]);

  const saveToStorage = (state: UserProfileState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to persist profile:', err);
    }
  };

  const updateUsername = (name: string) => {
    setProfile((prev) => ({ ...prev, username: name }));
  };

  const updateProfilePic = (url: string | null) => {
    setProfile((prev) => ({ ...prev, profilePicUrl: url }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_STATE);
  };

  const contextValue: UserProfileContextType = {
    ...profile,
    updateUsername,
    updateProfilePic,
    resetProfile,
  };

  return <UserProfileContext.Provider value={contextValue}>{children}</UserProfileContext.Provider>;
}; 