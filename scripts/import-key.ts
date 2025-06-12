import { ethers } from "ethers";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptForInput(question: string, isSecret: boolean = false): Promise<string> {
  return new Promise((resolve) => {
    if (isSecret) {
      // Hide input for sensitive data
      const stdin = process.openStdin();
      process.stdin.on("data", (char) => {
        const str = char + "";
        switch (str) {
          case "\n":
          case "\r":
          case "\u0004":
            stdin.pause();
            break;
          default:
            process.stdout.write("\x1B[2K\x1B[200D" + question + Array(rl.line.length + 1).join("*"));
            break;
        }
      });
    }

    rl.question(question, (answer) => {
      if (isSecret) {
        // Clear the line after getting the secret
        process.stdout.write("\x1B[2K\x1B[200D");
      }
      resolve(answer.trim());
    });
  });
}

async function importPrivateKey() {
  try {
    console.log("=== Private Key Import Tool ===\n");

    // Create keystore directory if it doesn't exist
    const keystoreDir = join(__dirname, "../keystore");
    mkdirSync(keystoreDir, { recursive: true });

    // Get private key
    const privateKeyInput = await promptForInput("Enter your private key (with or without 0x prefix): ", true);
    const privateKey = privateKeyInput.startsWith("0x") ? privateKeyInput : `0x${privateKeyInput}`;

    // Validate private key
    try {
      const wallet = new ethers.Wallet(privateKey);
      console.log("\nValid private key. Wallet address:", wallet.address);
    } catch (error) {
      throw new Error("Invalid private key format");
    }

    // Get password for keystore
    const password = await promptForInput("\nEnter a password to encrypt the keystore: ", true);
    const confirmPassword = await promptForInput("Confirm password: ", true);

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Create wallet and encrypt
    const wallet = new ethers.Wallet(privateKey);
    const keystore = await wallet.encrypt(password, {
      scrypt: {
        N: 131072, // CPU/memory cost parameter
        r: 8,      // Block size parameter
        p: 1       // Parallelization parameter
      }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const keystorePath = join(keystoreDir, `deployer-${wallet.address}-${timestamp}.json`);

    // Check if keystore already exists for this address
    const existingKeystores = existsSync(keystoreDir) 
      ? readFileSync(keystoreDir, "utf8").split("\n").filter(f => f.includes(wallet.address))
      : [];

    if (existingKeystores.length > 0) {
      const overwrite = await promptForInput(
        `\nFound existing keystore(s) for address ${wallet.address}. Overwrite? (y/N): `
      );
      if (overwrite.toLowerCase() !== "y") {
        console.log("\nImport cancelled.");
        return;
      }
    }

    // Save keystore
    writeFileSync(keystorePath, keystore);

    console.log("\n=== Import Successful ===");
    console.log("Keystore saved to:", keystorePath);
    console.log("Wallet address:", wallet.address);
    console.log("\nIMPORTANT SECURITY NOTES:");
    console.log("1. Keep your password safe! You'll need it for deployment.");
    console.log("2. Delete the keystore file after deployment.");
    console.log("3. Never share your keystore file or password.");
    console.log("4. Consider using a hardware wallet for production deployments.");

  } catch (error: any) {
    console.error("\nError:", error.message);
  } finally {
    rl.close();
  }
}

// Run import
importPrivateKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 