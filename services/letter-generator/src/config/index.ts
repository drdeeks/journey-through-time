// ============================================
// Journey Through Time - Letter Generator Backend
// Configuration Management
// ============================================

import dotenv from 'dotenv';
import { EnvConfig } from '../types';

// Load environment variables
dotenv.config();

// Default configuration
const DEFAULT_CONFIG: Partial<EnvConfig> = {
  NODE_ENV: 'development',
  PORT: 3001,
  MONAD_RPC_URL: 'https://rpc.monad.xyz',
  MONAD_CHAIN_ID: 143,
  MATRIX_ADDRESS: '0x0000000000000000000000000000000000000000', // Will be required in production
  MAX_CONTENT_LENGTH: 5000, // Characters
  LOG_LEVEL: 'info',
};

// Validate required configuration
function validateConfig(config: Partial<EnvConfig>): EnvConfig {
  const errors: string[] = [];

  // Check required fields in production
  if (config.NODE_ENV === 'production') {
    if (!config.CONTRACT_ADDRESS || config.CONTRACT_ADDRESS === 'your_deployed_contract_address_here') {
      errors.push('CONTRACT_ADDRESS is required in production');
    }
    if (!config.PRIVATE_KEY || config.PRIVATE_KEY === 'your_wallet_private_key_here') {
      errors.push('PRIVATE_KEY is required in production');
    }
    if (!config.MATRIX_ADDRESS || config.MATRIX_ADDRESS === '0x0000000000000000000000000000000000000000') {
      errors.push('MATRIX_ADDRESS is required in production');
    }
  }

  // Check chain ID
  if (config.MONAD_CHAIN_ID !== 143 && config.MONAD_CHAIN_ID !== 10143) {
    console.warn(`Unexpected MONAD_CHAIN_ID: ${config.MONAD_CHAIN_ID}. Expected 143 (mainnet) or 10143 (testnet)`);
  }

  // Check content length
  if (config.MAX_CONTENT_LENGTH && (config.MAX_CONTENT_LENGTH < 100 || config.MAX_CONTENT_LENGTH > 50000)) {
    console.warn(`MAX_CONTENT_LENGTH should be between 100 and 50000. Got: ${config.MAX_CONTENT_LENGTH}`);
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Invalid configuration');
  }

  return config as EnvConfig;
}

// Get configuration
export function getConfig(): EnvConfig {
  const envConfig: Partial<EnvConfig> = {
    NODE_ENV: process.env.NODE_ENV || DEFAULT_CONFIG.NODE_ENV,
    PORT: parseInt(process.env.PORT || String(DEFAULT_CONFIG.PORT), 10),
    MONAD_RPC_URL: process.env.MONAD_RPC_URL || DEFAULT_CONFIG.MONAD_RPC_URL,
    MONAD_CHAIN_ID: parseInt(process.env.MONAD_CHAIN_ID || String(DEFAULT_CONFIG.MONAD_CHAIN_ID), 10),
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
    MATRIX_ADDRESS: process.env.MATRIX_ADDRESS || DEFAULT_CONFIG.MATRIX_ADDRESS,
    PRIVATE_KEY: process.env.PRIVATE_KEY || '',
    API_KEY: process.env.API_KEY || '',
    MAX_CONTENT_LENGTH: parseInt(process.env.MAX_CONTENT_LENGTH || String(DEFAULT_CONFIG.MAX_CONTENT_LENGTH), 10),
    LOG_LEVEL: process.env.LOG_LEVEL || DEFAULT_CONFIG.LOG_LEVEL,
  };

  return validateConfig(envConfig);
}

// Feature flags
export const FEATURES = {
  ENABLE_X402_PAYMENTS: process.env.ENABLE_X402_PAYMENTS !== 'false',
  ENABLE_ERC20_PAYMENTS: process.env.ENABLE_ERC20_PAYMENTS !== 'false',
  ENABLE_AUTO_GENERATION: process.env.ENABLE_AUTO_GENERATION !== 'false',
  ENABLE_CONTENT_TRUNCATION: process.env.ENABLE_CONTENT_TRUNCATION !== 'false',
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === 'true',
};

// Payment configuration
export const PAYMENT_CONFIG = {
  MINT_FEE_USD: 0.05, // $0.05
  MINT_FEE_CENTS: 5, // 5 cents
  NATIVE_TOKEN_SYMBOL: 'MON',
  DEFAULT_PAYMENT_TOKEN: process.env.DEFAULT_PAYMENT_TOKEN || '',
  
  // Supported ERC-20 tokens for payment (address => symbol)
  SUPPORTED_TOKENS: {
    // USDC on Monad (example addresses - update with actual deployment)
    // '0x...': 'USDC',
  },
  
  // X402 enabled tokens (address => enabled)
  X402_TOKENS: {
    // '0x...': true,
  },
};

// Matthew's (Matrix) configuration
export const MATRIX_CONFIG = {
  ADDRESS: process.env.MATRIX_ADDRESS || '',
  DEFAULT_TEMPLATE: 'matic_message',
  ALLOW_CUSTOM_CONTENT: true,
  MAX_WINDOW_LENGTH: 2000, // Max characters for Matthew's letters
};

// Content truncation configuration
export const TRUNCATION_CONFIG = {
  ENABLED: true,
  MAX_LENGTH: 5000,
  TRUNCATION_MARKER: '... (content truncated)',
  PRESERVE_WORDS: true,
  MIN_WORD_LENGTH: 3, // Don't break words shorter than this
};

// API configuration
export const API_CONFIG = {
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['*'],
  API_PREFIX: '/api/v1',
};

// Contract ABI fragments (full ABI imported separately)
export const CONTRACT_ABI_FRAGMENTS = {
  WRITE_LETTER: 'function writeLetter(bytes,uint256,string,bool,string,string)',
  MINT_LETTER: 'function mintLetter(bytes,uint256,string,bool,string,string,address,bytes) payable',
  CREATE_AUTO_LETTER: 'function createAutoLetter(bytes,uint256,string,bool,string,string,string,bool)',
  GET_LETTER_INFO: 'function getLetterInfo(uint256)',
  LETTER_CREATED_EVENT: 'event LetterCreated(address,uint256,uint256,uint256,bool,string,bool)',
  LETTER_MINTED_EVENT: 'event LetterMinted(address,uint256,uint256,uint256,bool,address)',
};

// Export singleton config instance
const config = getConfig();
export default config;
export { config };
