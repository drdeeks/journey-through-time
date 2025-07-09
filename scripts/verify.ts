import hre from "hardhat";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

async function main() {
  try {
    // Read deployment info
    const network = process.env['HARDHAT_NETWORK'] || "monad-testnet";
    const deploymentFile = join(__dirname, "../deployments", `${network}.json`);

    if (!existsSync(deploymentFile)) {
      throw new Error(`Deployment info not found for network ${network}`);
    }

    const deploymentInfo = JSON.parse(readFileSync(deploymentFile, "utf8"));
    const { contractAddress, transactionHash } = deploymentInfo;

    if (!contractAddress) {
      throw new Error("Contract address not found in deployment info");
    }

    console.log("Verifying contract at:", contractAddress);
    console.log("Network:", network);
    console.log("Transaction:", transactionHash);

    // Get constructor arguments from deployment
    const constructorArguments: any[] = [];

    // Verify contract
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments,
        contract: "contracts/FutureLetters.sol:FutureLetters",
      });
      console.log("Contract verified successfully!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 