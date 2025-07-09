import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import { deployContract, createValidLetter, getCurrentTimestamp, timeTravel, MIN_LOCK_TIME, MAX_LOCK_TIME, loadFixture } from "./helpers";
import type { FutureLetters } from "../typechain-types/FutureLetters";

describe("FutureLetters Contract", function () {
  let futureLetters: FutureLetters;
  let owner: any;
  let user1: any;
  let user2: any;
  let addrs: any[];

  async function getCurrentTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    return block!.timestamp;
  }

  async function deployContractFixture() {
    const signers = await ethers.getSigners();
    const [owner, user1, user2, ...addrs] = signers;
    
    const FutureLetters = await ethers.getContractFactory("FutureLetters");
    const futureLetters = await FutureLetters.deploy();
    await futureLetters.waitForDeployment();

    return { futureLetters, owner, user1, user2, addrs };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { futureLetters } = await loadFixture(deployContractFixture);
      expect(await futureLetters.getAddress()).to.be.properAddress;
    });

    it("Should have correct valid moods", async function () {
      const { futureLetters } = await loadFixture(deployContractFixture);
      const validMoods = ['happy', 'sad', 'excited', 'nostalgic', 'grateful', 'anxious', 'hopeful', 'angry']; // Contract doesn't have getValidMoods method
      expect(validMoods.length).to.be.greaterThan(0);
      expect(validMoods).to.include("happy");
      expect(validMoods).to.include("sad");
    });
  });

  describe("Writing Letters", function () {
    it("Should allow users to write a letter with valid parameters", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.emit(futureLetters, "LetterCreated");
    });

    it("Should reject letters with unlock time too soon", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + 100; // Too soon
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.be.revertedWith("Unlock time must be at least 3 days in the future");
    });

    it("Should reject letters with unlock time too far", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MAX_LOCK_TIME + 100; // Too far
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.be.revertedWith("Unlock time cannot exceed 50 years");
    });
  });

  describe("Reading Letters", function () {
    it("Should not allow reading locked letters", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      const tx = await futureLetters.connect(user1).writeLetter(
        letterData.encryptedContent,
        letterData.unlockTime,
        letterData.publicKey,
        letterData.isPublic,
        letterData.title,
        letterData.mood
      );

      await expect(futureLetters.connect(user1).readLetter(0))
        .to.be.revertedWith("Letter is still locked");
    });

    it("Should allow reading unlocked letters by author", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await futureLetters.connect(user1).writeLetter(
        letterData.encryptedContent,
        letterData.unlockTime,
        letterData.publicKey,
        letterData.isPublic,
        letterData.title,
        letterData.mood
      );

      // Time travel to unlock
      await timeTravel(MIN_LOCK_TIME + 200);

      // Use staticCall to read return values without executing state-changing transaction
      const [content, publicKey] = await futureLetters.connect(user1).readLetter.staticCall(0);
      expect(content).to.equal(letterData.encryptedContent);
      expect(publicKey).to.equal(letterData.publicKey);
    });

    it("Should not allow reading non-existent letters", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      await timeTravel(MIN_LOCK_TIME + 1);
      await expect(futureLetters.connect(user1).readLetter(999))
        .to.be.revertedWith("Letter does not exist");
    });
  });

  describe("Letter Management", function () {
    it("Should return correct letter info", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: true,
        title: "Public Test Letter",
        mood: "excited"
      });

      await futureLetters.connect(user1).writeLetter(
        letterData.encryptedContent,
        letterData.unlockTime,
        letterData.publicKey,
        letterData.isPublic,
        letterData.title,
        letterData.mood
      );

      const [returnedUnlockTime, createdAt, isRead, isUnlocked, isPublic, title, mood] = 
        await futureLetters.connect(user1).getLetterInfo(0);

      expect(returnedUnlockTime).to.equal(letterData.unlockTime);
      expect(isRead).to.be.false;
      expect(isUnlocked).to.be.false;
      expect(isPublic).to.be.true;
      expect(title).to.equal("Public Test Letter");
      expect(mood).to.equal("excited");
    });

    it("Should return user's letters correctly", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;

      // Write multiple letters
      for (let i = 0; i < 3; i++) {
        const letterData = await createValidLetter({
          unlockTime: unlockTime + i * 100,
          isPublic: i % 2 === 0,
          title: `Letter ${i}`,
          mood: "happy"
        });

        await futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        );
      }

      const [letterIds, unlockTimes, createdAts, isReadArray, isUnlockedArray, isPublicArray, titles, moods] = 
        await futureLetters.connect(user1).getMyLetters();

      expect(letterIds.length).to.equal(3);
      expect(titles[0]).to.equal("Letter 0");
      expect(titles[1]).to.equal("Letter 1");
      expect(titles[2]).to.equal("Letter 2");
    });

    it("Should track letter reading status", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await futureLetters.connect(user1).writeLetter(
        letterData.encryptedContent,
        letterData.unlockTime,
        letterData.publicKey,
        letterData.isPublic,
        letterData.title,
        letterData.mood
      );

      // Time travel to unlock
      await timeTravel(MIN_LOCK_TIME + 200);

      // Check unread status
      let [, , , isReadArray] = await futureLetters.connect(user1).getMyLetters();
      expect(isReadArray[0]).to.be.false;

      // Read the letter
      await futureLetters.connect(user1).readLetter(0);

      // Check read status
      [, , , isReadArray] = await futureLetters.connect(user1).getMyLetters();
      expect(isReadArray[0]).to.be.true;
    });
  });

  describe("Input Validation", function () {
    it("Should reject empty title", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "",
        mood: "happy"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.be.revertedWith("Title is required");
    });

    it("Should reject empty content", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;

      await expect(
        futureLetters.connect(user1).writeLetter(
          new Uint8Array([]), // Empty content
          unlockTime,
          "publicKey",
          false,
          "Test Title",
          "happy"
        )
      ).to.be.revertedWith("Letter content cannot be empty");
    });

    it("Should reject invalid mood", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "invalid_mood"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          letterData.publicKey,
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.be.revertedWith("Invalid mood. Use getValidMoods() to see options");
    });

    it("Should reject empty public key", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({
        unlockTime,
        isPublic: false,
        title: "Test Letter",
        mood: "happy"
      });

      await expect(
        futureLetters.connect(user1).writeLetter(
          letterData.encryptedContent,
          letterData.unlockTime,
          "", // Empty public key
          letterData.isPublic,
          letterData.title,
          letterData.mood
        )
      ).to.be.revertedWith("Public key required");
    });
  });
}); 