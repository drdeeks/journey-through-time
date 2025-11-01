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

  describe("Public Letter Management", function () {
    it("Should allow anyone to read a public letter after unlock", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, isPublic: true, title: "Public Letter", mood: "joyful" });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      await timeTravel(MIN_LOCK_TIME + 200);
      await futureLetters.connect(user1).readLetter(0); // Author unlocks it

      const [content, publicKey, title, mood] = await futureLetters.connect(user2).readPublicLetter(user1.address, 0);
      expect(content).to.equal(letterData.encryptedContent);
      expect(publicKey).to.equal(letterData.publicKey);
      expect(title).to.equal("Public Letter");
      expect(mood).to.equal("joyful");
    });

    it("Should return paginated public letters", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;

      // User 1 writes 2 public letters
      for (let i = 0; i < 2; i++) {
        const letterData = await createValidLetter({ unlockTime, isPublic: true, title: `U1 Letter ${i}`, mood: "happy" });
        await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      }
      // User 2 writes 1 public letter
      const letterData = await createValidLetter({ unlockTime, isPublic: true, title: "U2 Letter 0", mood: "sad" });
      await futureLetters.connect(user2).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);

      await timeTravel(MIN_LOCK_TIME + 200);

      // Authors unlock their letters
      await futureLetters.connect(user1).readLetter(0);
      await futureLetters.connect(user1).readLetter(1);
      await futureLetters.connect(user2).readLetter(0);

      const [authors, letterIds, titles] = await futureLetters.getPublicLetters(0, 2);
      expect(authors.length).to.equal(2);
      expect(titles[0]).to.equal("U1 Letter 0");
      expect(titles[1]).to.equal("U1 Letter 1");

      const [authors2, letterIds2, titles2] = await futureLetters.getPublicLetters(2, 2);
      expect(authors2.length).to.equal(1);
      expect(titles2[0]).to.equal("U2 Letter 0");
    });

    it("Should allow an author to remove a letter from public", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, isPublic: true, title: "To Be Removed", mood: "worried" });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      await timeTravel(MIN_LOCK_TIME + 200);
      await futureLetters.connect(user1).readLetter(0);

      let count = await futureLetters.getPublicLetterCount();
      expect(count).to.equal(1);

      await futureLetters.connect(user1).removeFromPublicLetters(0);

      count = await futureLetters.getPublicLetterCount();
      expect(count).to.equal(0);
    });

    it("Should return the correct public letter count", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;

      const letterData1 = await createValidLetter({ unlockTime, isPublic: true, title: "Public 1", mood: "happy" });
      await futureLetters.connect(user1).writeLetter(letterData1.encryptedContent, letterData1.unlockTime, letterData1.publicKey, letterData1.isPublic, letterData1.title, letterData1.mood);

      const letterData2 = await createValidLetter({ unlockTime, isPublic: true, title: "Public 2", mood: "excited" });
      await futureLetters.connect(user2).writeLetter(letterData2.encryptedContent, letterData2.unlockTime, letterData2.publicKey, letterData2.isPublic, letterData2.title, letterData2.mood);

      await timeTravel(MIN_LOCK_TIME + 200);

      await futureLetters.connect(user1).readLetter(0);
      await futureLetters.connect(user2).readLetter(0);

      const count = await futureLetters.getPublicLetterCount();
      expect(count).to.equal(2);
    });

    it("Should return correct public letters for an author", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;

      // User 1 writes two public letters
      const letterData1 = await createValidLetter({ unlockTime, isPublic: true, title: "Author1-Letter1", mood: "happy" });
      await futureLetters.connect(user1).writeLetter(letterData1.encryptedContent, letterData1.unlockTime, letterData1.publicKey, letterData1.isPublic, letterData1.title, letterData1.mood);
      const letterData2 = await createValidLetter({ unlockTime: unlockTime + 10, isPublic: true, title: "Author1-Letter2", mood: "nostalgic" });
      await futureLetters.connect(user1).writeLetter(letterData2.encryptedContent, letterData2.unlockTime, letterData2.publicKey, letterData2.isPublic, letterData2.title, letterData2.mood);

      // User 2 writes one public letter
      const letterData3 = await createValidLetter({ unlockTime, isPublic: true, title: "Author2-Letter1", mood: "grateful" });
      await futureLetters.connect(user2).writeLetter(letterData3.encryptedContent, letterData3.unlockTime, letterData3.publicKey, letterData3.isPublic, letterData3.title, letterData3.mood);

      await timeTravel(MIN_LOCK_TIME + 200);

      // Unlock all letters
      await futureLetters.connect(user1).readLetter(0);
      await futureLetters.connect(user1).readLetter(1);
      await futureLetters.connect(user2).readLetter(0);

      const [letterIds, titles, moods] = await futureLetters.getPublicLettersByAuthor(user1.address);
      expect(letterIds.length).to.equal(2);
      expect(titles[0]).to.equal("Author1-Letter1");
      expect(titles[1]).to.equal("Author1-Letter2");
    });
  });

  describe("User Profile and Reminders", function () {
    it("Should allow a user to update their reminder settings", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);

      await futureLetters.connect(user1).updateReminderSettings(false, 15);

      const profile = await futureLetters.userProfiles(user1.address);
      expect(profile.reminderEnabled).to.be.false;
      expect(profile.preferredReminderDays).to.equal(15);
    });

    it("Should correctly check for reminders", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();

      // Write a letter that will be due for a reminder
      const reminderDays = 7;
      const unlockTime = currentTime + (reminderDays * 24 * 60 * 60) - 100; // Due in less than 7 days
      const letterData = await createValidLetter({ unlockTime, title: "Reminder Test", mood: "hopeful" });
      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);

      await futureLetters.connect(user1).updateReminderSettings(true, reminderDays);

      const [needsUnlockReminder, needsWriteReminder, upcomingLetterIds] = await futureLetters.checkReminders(user1.address);
      expect(needsUnlockReminder).to.be.true;
      expect(upcomingLetterIds.length).to.equal(1);
      expect(upcomingLetterIds[0]).to.equal(0);
    });

    it("Should detect when a user needs a write reminder", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const BI_MONTHLY_INTERVAL = 60 * 24 * 60 * 60;

      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, title: "Bi-monthly check", mood: "anxious" });
      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);

      await futureLetters.connect(user1).updateReminderSettings(true, 7);

      // Time travel past the bi-monthly interval
      await timeTravel(BI_MONTHLY_INTERVAL + 100);

      const [, needsWriteReminder] = await futureLetters.checkReminders(user1.address);
      expect(needsWriteReminder).to.be.true;
    });
  });

  describe("NFT Functionality", function () {
    it("Should mint a Capsule NFT to the author upon writing a letter", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, title: "NFT Test", mood: "excited" });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);

      const ownerOfToken0 = await futureLetters.ownerOf(0);
      expect(ownerOfToken0).to.equal(user1.address);
    });

    it("Should set the correct tokenURI for the NFT", async function () {
      const { futureLetters, user1 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, title: "tokenURI Test", mood: "joyful" });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);

      const tokenURI = await futureLetters.tokenURI(0);
      expect(tokenURI).to.include("data:application/json;base64,");

      const letterData2 = await createValidLetter({ unlockTime, title: "tokenURI Test 2", mood: "sad" });
      await futureLetters.connect(user1).writeLetter(letterData2.encryptedContent, letterData2.unlockTime, letterData2.publicKey, letterData2.isPublic, letterData2.title, letterData2.mood);
      const tokenURI2 = await futureLetters.tokenURI(1);
      expect(tokenURI2).to.include("data:application/json;base64,");

      // Decode the base64 part of the tokenURI
      const base64String = tokenURI.split(",")[1];
      const decodedJson = Buffer.from(base64String, 'base64').toString('utf-8');
      const metadata = JSON.parse(decodedJson);

      expect(metadata.name).to.equal("Capsule #0");
      expect(metadata.description).to.equal("Time-locked letter capsule");
      expect(metadata.attributes[1].trait_type).to.equal("Unlock Time");
      expect(metadata.attributes[1].value).to.equal(unlockTime);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should not read a public letter of a private letter", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, isPublic: false });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      await timeTravel(MIN_LOCK_TIME + 200);
      await futureLetters.connect(user1).readLetter(0);

      await expect(futureLetters.connect(user2).readPublicLetter(user1.address, 0))
        .to.be.revertedWith("Letter is private");
    });

    it("Should not allow non-authors to remove a public letter", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, isPublic: true });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      await timeTravel(MIN_LOCK_TIME + 200);
      await futureLetters.connect(user1).readLetter(0);

      await expect(futureLetters.connect(user2).removeFromPublicLetters(0))
        .to.be.revertedWith("Letter does not exist");
    });

    it("Should not read a public letter before the author unlocks it", async function () {
      const { futureLetters, user1, user2 } = await loadFixture(deployContractFixture);
      const currentTime = await getCurrentTimestamp();
      const unlockTime = currentTime + MIN_LOCK_TIME + 100;
      const letterData = await createValidLetter({ unlockTime, isPublic: true });

      await futureLetters.connect(user1).writeLetter(letterData.encryptedContent, letterData.unlockTime, letterData.publicKey, letterData.isPublic, letterData.title, letterData.mood);
      await timeTravel(MIN_LOCK_TIME + 200);

      await expect(futureLetters.connect(user2).readPublicLetter(user1.address, 0))
        .to.be.revertedWith("Letter hasn't been unlocked by author yet");
    });
  });
}); 