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

export type TabChangeEvent = React.SyntheticEvent<Element, Event>;
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export interface ContractWithMethods extends Contract {
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
  readLetter: (id: number) => Promise<[string, string]>;
  writeLetter: (
    title: string,
    content: string,
    unlockTime: number,
    isPublic: boolean,
    mood: string,
    publicKey: string
  ) => Promise<any>;
} 