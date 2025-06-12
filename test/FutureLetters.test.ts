import { expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { FutureLetters } from "../typechain-types/FutureLetters";
import { FutureLetters__factory } from "../typechain-types/factories/FutureLetters__factory";

const MIN_LOCK_TIME = 3 * 24 * 60 * 60; // 3 days in seconds
const MAX_LOCK_TIME = 50 * 365 * 24 * 60 * 60; // 50 years in seconds

async function getFutureUnlockTime(offset: number = 0): Promise<number> {
  // Add a 10 second buffer to ensure unlockTime is always valid
  const block = await hre.ethers.provider.getBlock('latest');
  if (!block) {
    throw new Error('Failed to get latest block');
  }
  return block.timestamp + MIN_LOCK_TIME + 10 + offset;
}

describe("FutureLetters", function () {
  let futureLetters: FutureLetters;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ...addrs] = await hre.ethers.getSigners();

    // Deploy contract
    const FutureLetters = await hre.ethers.getContractFactory("FutureLetters");
    const deployedContract = await FutureLetters.deploy();
    await deployedContract.waitForDeployment();
    futureLetters = await FutureLetters__factory.connect(
      await deployedContract.getAddress(),
      owner
    );
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await futureLetters.getAddress()).to.be.properAddress;
    });
  });

  describe("Letter Writing", function () {
    const title = "Test Letter";
    const content = "This is a test letter content";
    const mood = "happy";
    const publicKey = "0x1234567890abcdef";

    it("Should allow writing a letter with valid parameters", async function () {
      const unlockTime = await getFutureUnlockTime(1);
      const tx = await futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        false,
        title,
        mood
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LetterCreated"
      );
      
      expect(event).to.not.be.undefined;
      if (event) {
        const parsedLog = futureLetters.interface.parseLog(event);
        expect(parsedLog?.args[0]).to.equal(user1.address); // user
        expect(parsedLog?.args[1]).to.equal(0); // letterId
        expect(parsedLog?.args[2]).to.equal(unlockTime); // unlockTime
        expect(parsedLog?.args[4]).to.equal(false); // isPublic
        expect(parsedLog?.args[5]).to.equal(mood); // mood
      }

      const [unlockTime_, createdAt, isRead, isUnlocked, isPublic, title_, mood_] = 
        await futureLetters.connect(user1).getLetterInfo(0);
      expect(title_).to.equal(title);
      expect(isPublic).to.equal(false);
      expect(mood_).to.equal(mood);
    });
    it("Should not allow writing a letter with invalid lock time", async function () {
      const block = await hre.ethers.provider.getBlock('latest');
      if (!block) throw new Error("Failed to get latest block");
      const unlockTime = block.timestamp + MIN_LOCK_TIME - 10;
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        false,
        title,
        mood
      )).to.be.revertedWith("Unlock time must be at least 3 days in the future");
    });
    it("Should not allow writing a letter with too long lock time", async function () {
      const block = await hre.ethers.provider.getBlock('latest');
      if (!block) throw new Error("Failed to get latest block");
      const unlockTime = block.timestamp + MAX_LOCK_TIME + 10;
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        false,
        title,
        mood
      )).to.be.revertedWith("Unlock time cannot exceed 50 years");
    });
  });

  describe("Letter Reading", function () {
    const title = "Test Letter";
    const content = "This is a test letter content";
    const mood = "happy";
    const publicKey = "0x1234567890abcdef";

    beforeEach(async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        false,
        title,
        mood
      );
    });

    it("Should not allow reading a locked letter", async function () {
      await expect(futureLetters.connect(user1).readLetter(0))
        .to.be.revertedWith("Letter is still locked");
    });

    it("Should allow reading an unlocked letter by the owner", async function () {
      // Fast forward time to unlock the letter
      const [unlockTime] = await futureLetters.connect(user1).getLetterInfo(0);
      const currentBlock = await hre.ethers.provider.getBlock('latest');
      const timeToAdvance = Number(unlockTime) - currentBlock.timestamp + 1;
      await hre.ethers.provider.send("evm_increaseTime", [timeToAdvance]);
      await hre.ethers.provider.send("evm_mine");

      // Read the letter
      const tx = await futureLetters.connect(user1).readLetter(0);
      const receipt = await tx.wait();
      
      // Get the event data
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = futureLetters.interface.parseLog(log);
          return parsedLog?.name === "LetterUnlocked";
        } catch {
          return false;
        }
      });
      if (!event) {
        console.log('Receipt:', receipt);
        console.log('Logs:', receipt?.logs);
        throw new Error("LetterUnlocked event not found");
      }
      
      const parsedLog = futureLetters.interface.parseLog(event);
      if (!parsedLog) throw new Error("Failed to parse LetterUnlocked event");
      const [user, letterId, unlockedAt, isPublic, mood] = parsedLog.args;
      expect(user).to.equal(user1.address);
      expect(letterId).to.equal(0);
      expect(isPublic).to.equal(false);
      expect(mood).to.equal(mood);
    });

    it("Should not allow reading a private letter by non-owner", async function () {
      // Fast forward time
      await hre.ethers.provider.send("evm_increaseTime", [MIN_LOCK_TIME + 1]);
      await hre.ethers.provider.send("evm_mine");

      await expect(futureLetters.connect(user2).readLetter(0))
        .to.be.revertedWith("Letter does not exist");
    });
  });

  describe("Letter Management", function () {
    const title = "Test Letter";
    const content = "This is a test letter content";
    const mood = "happy";
    const publicKey = "0x1234567890abcdef";

    beforeEach(async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        false,
        title,
        mood
      );
    });

    it("Should return correct letter count for user", async function () {
      const [totalLetters, unreadLetters] = await futureLetters.connect(user1).getUserStats();
      expect(totalLetters).to.equal(1);
    });

    it("Should return empty letter count for user with no letters", async function () {
      const [totalLetters, unreadLetters] = await futureLetters.connect(user2).getUserStats();
      expect(totalLetters).to.equal(0);
    });

    it("Should return correct letter details in getMyLetters", async function () {
      const [
        ids,
        unlockTimes,
        createdAts,
        isRead,
        isUnlocked,
        isPublic,
        titles,
        moods
      ] = await futureLetters.connect(user1).getMyLetters();

      expect(ids[0]).to.equal(0);
      expect(titles[0]).to.equal(title);
      expect(moods[0]).to.equal(mood);
      expect(isPublic[0]).to.equal(false);
      expect(isUnlocked[0]).to.equal(false);
      expect(isRead[0]).to.equal(false);
    });
  });

  describe("Public Letters", function () {
    const title = "Public Test Letter";
    const content = "This is a public test letter content";
    const mood = "happy";
    const publicKey = "0x1234567890abcdef";

    beforeEach(async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(content),
        unlockTime,
        publicKey,
        true, // isPublic
        title,
        mood
      );
    });

    it("Should allow reading a public letter by anyone after unlock", async function () {
      // Fetch unlockTime from contract
      const [unlockTime] = await futureLetters.connect(user1).getLetterInfo(0);
      const currentBlock = await hre.ethers.provider.getBlock('latest');
      if (!currentBlock) {
        throw new Error('Failed to get latest block');
      }
      const timeToAdvance = Number(unlockTime) - currentBlock.timestamp + 1;
      await hre.ethers.provider.send("evm_increaseTime", [timeToAdvance]);
      await hre.ethers.provider.send("evm_mine");

      // First, owner must read it to unlock it
      await futureLetters.connect(user1).readLetter(0);

      // Then others can read it
      const [retrievedContent, retrievedPublicKey, retrievedTitle, retrievedMood, createdAt, unlockedAt] = 
        await futureLetters.connect(user2).readPublicLetter(user1.address, 0);
      expect(ethers.toUtf8String(retrievedContent)).to.equal(content);
      expect(retrievedPublicKey).to.equal(publicKey);
      expect(retrievedTitle).to.equal(title);
      expect(retrievedMood).to.equal(mood);
    });

    it("Should return correct public status in getMyLetters", async function () {
      const [, , , , , isPublic] = await futureLetters.connect(user1).getMyLetters();
      expect(isPublic[0]).to.equal(true);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty title", async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes("content"),
        unlockTime,
        "0x123",
        false,
        "",
        "happy"
      )).to.be.revertedWith("Title is required");
    });

    it("Should handle empty content", async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes(""),
        unlockTime,
        "0x123",
        false,
        "title",
        "happy"
      )).to.be.revertedWith("Letter content cannot be empty");
    });

    it("Should handle invalid mood", async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes("content"),
        unlockTime,
        "0x123",
        false,
        "title",
        "InvalidMood"
      )).to.be.revertedWith("Invalid mood. Use getValidMoods() to see options");
    });

    it("Should handle empty public key", async function () {
      const unlockTime = await getFutureUnlockTime(1);
      await expect(futureLetters.connect(user1).writeLetter(
        ethers.toUtf8Bytes("content"),
        unlockTime,
        "",
        false,
        "title",
        "happy"
      )).to.be.revertedWith("Public key required");
    });
  });
}); 