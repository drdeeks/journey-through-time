import hre from "hardhat";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { FutureLetters } from "../typechain-types/FutureLetters";
import { toUtf8Bytes } from "ethers";

// Loadfixture utility
export function loadFixture<T>(fixture: () => Promise<T>): Promise<T> {
  return fixture();
}

export interface TestLetter {
  encryptedContent: string;
  unlockTime: number;
  publicKey: string;
  isPublic: boolean;
  title: string;
  mood: string;
}

export const MIN_LOCK_TIME = 3 * 24 * 60 * 60; // 3 days in seconds
export const MAX_LOCK_TIME = 50 * 365 * 24 * 60 * 60; // 50 years in seconds

export async function deployContract(): Promise<FutureLetters> {
  const FutureLetters = await ethers.getContractFactory("FutureLetters");
  const contract = await FutureLetters.deploy();
  await contract.waitForDeployment();
  return contract as FutureLetters;
}

export async function getCurrentTimestamp(): Promise<number> {
  const block = await hre.ethers.provider.getBlock('latest');
  if (!block) {
    throw new Error('Failed to get latest block');
  }
  return block.timestamp;
}

export async function createValidLetter(
  options: Partial<TestLetter> = {}
): Promise<TestLetter> {
  const currentTime = await getCurrentTimestamp();
  
  return {
    encryptedContent: generateRandomHex(),
    unlockTime: currentTime + MIN_LOCK_TIME + 100,
    publicKey: generateRandomHex(),
    isPublic: false,
    title: "Test Letter",
    mood: "happy",
    ...options
  };
}

export async function createLetter(
  contract: FutureLetters,
  signer: SignerWithAddress,
  options: Partial<TestLetter> = {}
): Promise<any> {
  const letterData = await createValidLetter(options);
  
  const tx = await contract.connect(signer).writeLetter(
    letterData.encryptedContent,
    letterData.unlockTime,
    letterData.publicKey,
    letterData.isPublic,
    letterData.title,
    letterData.mood
  );

  return tx.wait();
}

export async function timeTravel(seconds: number): Promise<void> {
  await hre.ethers.provider.send("evm_increaseTime", [seconds]);
  await hre.ethers.provider.send("evm_mine", []);
}

export async function getCurrentBlock(): Promise<any> {
  const block = await hre.ethers.provider.getBlock("latest");
  return block;
}

export async function expectRevert(promise: Promise<any>, errorMessage: string): Promise<void> {
  try {
    await promise;
    throw new Error("Expected transaction to revert");
  } catch (error: any) {
    if (error.message.includes(errorMessage)) {
      return; // Expected revert
    }
    throw error; // Unexpected error
  }
}

export function generateRandomAddress(): string {
  return hre.ethers.Wallet.createRandom().address;
}

export function generateRandomBytes32(): string {
  return hre.ethers.hexlify(hre.ethers.randomBytes(32));
}

export const VALID_MOODS = [
  "happy", "sad", "angry", "excited", "nostalgic", 
  "grateful", "anxious", "hopeful"
] as const;

export function getRandomMood(): string {
  const mood = VALID_MOODS[Math.floor(Math.random() * VALID_MOODS.length)];
  return mood || 'happy';
}

export function getValidUnlockTime(offsetSeconds: number = 0): number {
  return Math.floor(Date.now() / 1000) + MIN_LOCK_TIME + 100 + offsetSeconds;
}

export function getInvalidShortUnlockTime(): number {
  return Math.floor(Date.now() / 1000) + MIN_LOCK_TIME - 100;
}

export function getInvalidLongUnlockTime(): number {
  return Math.floor(Date.now() / 1000) + MAX_LOCK_TIME + 100;
} 

// Utility to generate a random hex string of the given byte length (default 32 bytes)
export function generateRandomHex(bytes: number = 32): string {
  return hre.ethers.hexlify(hre.ethers.randomBytes(bytes));
} 