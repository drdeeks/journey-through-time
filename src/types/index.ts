import { Contract, ContractTransactionResponse } from 'ethers';
import React from 'react';

export interface Letter {
  id: number;
  title: string;
  unlockTime: number;
  createdAt: number;
  isRead: boolean;
  isUnlocked: boolean;
  isPublic: boolean;
  mood: string;
  encryptedContent?: string;
  publicKey?: string;
  imageUrl?: string;
}

export interface UserProfile {
  letterCount: number;
  lastLetterTime: number;
  reminderEnabled: boolean;
  preferredReminderDays: number;
}

export interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  contract: Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
  mainDomain: string | null;
  isConnected: boolean;
}

// Letter form data interface
export interface LetterFormData {
  content: string;
  unlockTime: bigint;
  isPublic: boolean;
  title: string;
  mood: ValidMood;
}

// Letter validation errors interface
export interface LetterValidationErrors {
  content?: string;
  unlockTime?: string;
  title?: string;
  mood?: string;
}

// Contract interface with proper typing
export interface FutureLettersContract {
  writeLetter: (
    encryptedContent: Uint8Array | string,
    unlockTime: bigint,
    publicKey: string,
    isPublic: boolean,
    title: string,
    mood: string
  ) => Promise<ContractTransactionResponse>;

  readLetter: (letterId: bigint) => Promise<[string, string]>;

  getMyLetters: () => Promise<
    [
      bigint[], // letterIds
      bigint[], // unlockTimes
      bigint[], // createdTimes
      boolean[], // isPublic
      boolean[], // isUnlocked
      boolean[], // isRead
      string[], // titles
      string[], // moods
    ]
  >;

  getLetterInfo: (letterId: bigint) => Promise<
    [
      bigint, // unlockTime
      bigint, // createdTime
      boolean, // isPublic
      boolean, // isUnlocked
      boolean, // isRead
      string, // title
      string, // mood
    ]
  >;

  getUserStats: () => Promise<
    [
      bigint, // totalLetters
      bigint, // unlockedLetters
      bigint, // readLetters
      boolean, // reminderEnabled
      bigint, // reminderDays
    ]
  >;

  readPublicLetter: (
    author: string,
    letterId: bigint
  ) => Promise<
    [
      string, // content
      string, // publicKey
      string, // title
      string, // mood
      bigint, // unlockTime
      bigint, // createdTime
    ]
  >;

  updateReminderSettings: (enabled: boolean, days: bigint) => Promise<ContractTransactionResponse>;

  // Event filtering methods (ethers.js auto-generated)
  filters: {
    LetterCreated: (...args: any[]) => any;
    LetterRead: (...args: any[]) => any;
    ReminderSettingsUpdated: (...args: any[]) => any;
  };

  // Additional ethers.js methods
  queryFilter: (filter: any) => Promise<any[]>;
  getAddress: () => Promise<string>;
}

export interface EncryptionKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedContent {
  encryptedContent: string;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Valid moods for letters
export const VALID_MOODS = [
  'happy',
  'sad',
  'angry',
  'excited',
  'nostalgic',
  'grateful',
  'anxious',
  'hopeful',
] as const;

export type ValidMood = (typeof VALID_MOODS)[number];

// Event type definitions
export type TabChangeEvent = React.SyntheticEvent;
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;

// Smart contract event interfaces
export interface LetterCreatedEvent {
  letterId: number;
  author: string;
  unlockTime: number;
  isPublic: boolean;
}

export interface LetterReadEvent {
  letterId: number;
  author: string;
  reader: string;
}

// Time constants (in seconds)
export const MIN_LOCK_TIME = 3 * 24 * 60 * 60; // 3 days
export const MAX_LOCK_TIME = 50 * 365 * 24 * 60 * 60; // 50 years

// Theme and styling types
export interface ThemeMode {
  mode: 'light' | 'dark';
}

// Test utilities and mock types
export interface MockContractMethods {
  getMyLetters: jest.Mock;
  readLetter: jest.Mock;
  writeLetter: jest.Mock;
  getLetterInfo: jest.Mock;
  getUserStats: jest.Mock;
  readPublicLetter: jest.Mock;
  updateReminderSettings: jest.Mock;
}
