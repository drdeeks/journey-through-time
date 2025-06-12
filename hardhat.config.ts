import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETH_RPC_URL = process.env.ETH_RPC_URL || "https://rpc.testnet.monad.xyz";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    "monadTestnet": {
      url: ETH_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 10143, // Monad testnet chain ID
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://explorer.testnet.monad.xyz/api",
          browserURL: "https://explorer.testnet.monad.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config; 