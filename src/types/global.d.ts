/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Removed custom Jest type overrides to avoid conflicts with built-in typings.
// Only augmenting browser and Web3 related globals here.

declare global {
  // Web3 globals
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }

  // Clipboard API
  interface Navigator {
    clipboard: {
      writeText(data: string): Promise<void>;
      readText(): Promise<string>;
    };
  }

  // Web Crypto API
  interface Crypto {
    subtle: {
      encrypt(algorithm: any, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>;
      decrypt(algorithm: any, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer>;
      importKey(
        format: string,
        keyData: ArrayBuffer,
        algorithm: any,
        extractable: boolean,
        keyUsages: string[]
      ): Promise<CryptoKey>;
      digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer>;
    };
  }

  // URL API extensions
  interface URL {
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
  }
}

// Typed environment variables to comply with noPropertyAccessFromIndexSignature

declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ProcessEnv {
    ETH_RPC_URL?: string;
    REACT_APP_CONTRACT_ADDRESS?: string;
    HARDHAT_NETWORK?: string;
    PRIVATE_KEY?: string;
    ETHERSCAN_API_KEY?: string;
    REPORT_GAS?: string;
  }
}

export {};
