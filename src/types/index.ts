import { Contract } from 'ethers';

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
}

export interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  contract: Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

export interface ContractWithMethods extends Contract {
  writeLetter: (
    encryptedContent: Uint8Array,
    unlockTime: number,
    publicKey: string,
    isPublic: boolean,
    title: string,
    mood: string
  ) => Promise<any>;
  
  readLetter: (letterId: number) => Promise<[string, string]>;
  
  getMyLetters: () => Promise<[
    number[],
    number[],
    number[],
    boolean[],
    boolean[],
    boolean[],
    string[],
    string[]
  ]>;
}

export type TabChangeEvent = React.SyntheticEvent<Element, Event>;
export type TabChangeHandler = (event: TabChangeEvent, newValue: number) => void;
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
export type InputChangeHandler = (event: InputChangeEvent) => void; 