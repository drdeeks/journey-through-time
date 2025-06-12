import { ethers } from "ethers";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function generateKeystore() {
  try {
    // Create keystore directory if it doesn't exist
    const keystoreDir = join(__dirname, "../keystore");
    mkdirSync(keystoreDir, { recursive: true });

    // Get private key from user
    const privateKey = await new Promise<string>((resolve) => {
      rl.question("Enter your private key (without 0x prefix): ", (answer) => {
        resolve(answer.trim());
      });
    });

    // Get password from user
    const password = await new Promise<string>((resolve) => {
      rl.question("Enter a password to encrypt the keystore: ", (answer) => {
        resolve(answer.trim());
      });
    });

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);

    // Generate keystore
    const keystore = await wallet.encrypt(password, {
      scrypt: {
        N: 131072,
        r: 8,
        p: 1
      }
    });

    // Save keystore to file
    const keystorePath = join(keystoreDir, `deployer-${wallet.address}.json`);
    writeFileSync(keystorePath, keystore);

    console.log("\nKeystore generated successfully!");
    console.log("Keystore file:", keystorePath);
    console.log("Wallet address:", wallet.address);
    console.log("\nIMPORTANT: Keep your password safe! You'll need it for deployment.");
    console.log("IMPORTANT: Delete the keystore file after deployment for security.");

  } catch (error) {
    console.error("Error generating keystore:", error);
  } finally {
    rl.close();
  }
}

generateKeystore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 