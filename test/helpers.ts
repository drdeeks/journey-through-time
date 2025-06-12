import { ethers } from "ethers";
import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FutureLetters } from "../typechain-types";

export interface TestLetter {
  title: string;
  content: string;
  unlockTime: number;
  isPublic: boolean;
  mood: string;
  publicKey: string;
}

export const MIN_LOCK_TIME = 3 * 24 * 60 * 60; // 3 days in seconds
export const MAX_LOCK_TIME = 50 * 365 * 24 * 60 * 60; // 50 years in seconds

export async function deployContract(): Promise<FutureLetters> {
  const FutureLetters = await hre.ethers.getContractFactory("FutureLetters");
  const contract = await FutureLetters.deploy();
  return contract;
}

export async function createTestLetter(
  contract: FutureLetters,
  signer: SignerWithAddress,
  overrides: Partial<TestLetter> = {}
): Promise<{ letter: TestLetter; letterId: number }> {
  const defaultLetter: TestLetter = {
    title: "Test Letter",
    content: "This is a test letter content",
    unlockTime: Math.floor(Date.now() / 1000) + MIN_LOCK_TIME,
    isPublic: false,
    mood: "Happy",
    publicKey: "0x1234567890abcdef",
  };

  const letter = { ...defaultLetter, ...overrides };
  
  const tx = await contract.connect(signer).writeLetter(
    letter.title,
    letter.content,
    letter.unlockTime,
    letter.isPublic,
    letter.mood,
    letter.publicKey
  );

  const receipt = await tx.wait();
  const event = receipt.events?.find(e => e.event === "LetterWritten");
  const letterId = event?.args?.letterId.toNumber();

  return { letter, letterId };
}

export async function timeTravel(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

export async function getCurrentTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

export function generateTestLetters(count: number): TestLetter[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Test Letter ${i + 1}`,
    content: `This is test letter content ${i + 1}`,
    unlockTime: Math.floor(Date.now() / 1000) + MIN_LOCK_TIME + (i * 24 * 60 * 60), // Each letter unlocks 1 day after the previous
    isPublic: i % 2 === 0, // Alternate between public and private
    mood: ["Happy", "Sad", "Excited", "Reflective"][i % 4],
    publicKey: `0x${(i + 1).toString().padStart(16, "0")}`,
  }));
}

export async function createMultipleLetters(
  contract: FutureLetters,
  signer: SignerWithAddress,
  count: number
): Promise<{ letters: TestLetter[]; letterIds: number[] }> {
  const letters = generateTestLetters(count);
  const letterIds: number[] = [];

  for (const letter of letters) {
    const { letterId } = await createTestLetter(contract, signer, letter);
    letterIds.push(letterId);
  }

  return { letters, letterIds };
}

export async function getLetterDetails(
  contract: FutureLetters,
  letterId: number
): Promise<{
  title: string;
  content: string;
  unlockTime: number;
  isPublic: boolean;
  mood: string;
  isRead: boolean;
  isUnlocked: boolean;
}> {
  const letter = await contract.getLetter(letterId);
  const currentTime = await getCurrentTimestamp();

  return {
    title: letter.title,
    content: letter.content,
    unlockTime: letter.unlockTime.toNumber(),
    isPublic: letter.isPublic,
    mood: letter.mood,
    isRead: letter.isRead,
    isUnlocked: currentTime >= letter.unlockTime.toNumber(),
  };
}

export async function expectRevert(
  promise: Promise<any>,
  expectedError: string
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected promise to reject but it resolved");
  } catch (error: any) {
    if (!error.message.includes(expectedError)) {
      throw new Error(
        `Expected error message to include "${expectedError}" but got "${error.message}"`
      );
    }
  }
} 