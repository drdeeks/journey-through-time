import { ethers, JsonRpcProvider } from "ethers";
import hre from "hardhat";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import * as readline from "readline";
import * as fs from "fs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getKeystorePassword(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("Enter keystore password: ", (password) => {
      resolve(password.trim());
    });
  });
}

async function findKeystoreFile(): Promise<string> {
  const keystoreDir = join(__dirname, "../keystore");
  if (!existsSync(keystoreDir)) {
    throw new Error("Keystore directory not found. Please run generate-keystore first.");
  }

  const files = fs.readdirSync(keystoreDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    throw new Error("No keystore files found. Please run generate-keystore first.");
  }

  if (files.length > 1) {
    console.log("Multiple keystore files found:");
    files.forEach((f, i) => console.log(`${i + 1}. ${f}`));
    const index = await new Promise<number>((resolve) => {
      rl.question("Select a keystore file (number): ", (answer) => {
        resolve(parseInt(answer.trim()) - 1);
      });
    });
    return join(keystoreDir, files[index]);
  }

  return join(keystoreDir, files[0]);
}

async function main() {
  try {
    console.log("Starting deployment process...");

    // Find and load keystore
    const keystorePath = await findKeystoreFile();
    console.log("Using keystore:", keystorePath);
    
    const keystore = readFileSync(keystorePath, "utf8");
    const password = await getKeystorePassword();

    // Create wallet from keystore
    const wallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
    console.log("Wallet address:", wallet.address);

    // Connect to network
    const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);
    const connectedWallet = wallet.connect(provider);

    // Get the contract factory
    const FutureLetters = await hre.ethers.getContractFactory("FutureLetters", connectedWallet);
    console.log("Deploying FutureLetters contract...");

    // Deploy the contract
    const futureLetters = await FutureLetters.deploy();
    console.log("Waiting for deployment transaction receipt...");
    const receipt = await futureLetters.deployTransaction.wait();
    const deployedAddress = await futureLetters.getAddress();
    console.log("FutureLetters deployed to:", deployedAddress);
    const deploymentInfo = {
      contractAddress: deployedAddress,
      network: network.name,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      transactionHash: receipt.hash,
    };

    // Write deployment info to a JSON file
    const deploymentPath = join(__dirname, "../deployments");
    const deploymentFile = join(deploymentPath, `${network.name}.json`);
    
    try {
      writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log("Deployment info saved to:", deploymentFile);
    } catch (error) {
      console.error("Error saving deployment info:", error);
    }

    // Verify the contract on Etherscan (if not on a local network)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      await futureLetters.deployTransaction.wait(6); // Wait for 6 block confirmations

      console.log("Verifying contract on Etherscan...");
      try {
        await run("verify:verify", {
          address: futureLetters.address,
          constructorArguments: [],
        });
        console.log("Contract verified successfully");
      } catch (error) {
        console.error("Error verifying contract:", error);
      }
    }

    // Clean up keystore
    console.log("\nDeployment complete! For security, please delete the keystore file.");
    console.log("Keystore file:", keystorePath);

  } catch (error) {
    console.error("Deployment failed:", error);
  } finally {
    rl.close();
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 