// ============================================
// Journey Through Time - Letter Generator Backend
// Types and Interfaces
// ============================================

import { Request, Response, NextFunction } from 'express';

// ========== ENVIRONMENT & CONFIGURATION ==========

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONAD_RPC_URL: string;
  MONAD_CHAIN_ID: number;
  CONTRACT_ADDRESS: string;
  MATRIX_ADDRESS: string; // Matthew's special address
  PRIVATE_KEY: string; // Backend wallet private key
  API_KEY: string; // Optional API key for rate limiting
  MAX_CONTENT_LENGTH: number; // Max characters for auto-generated letters
  LOG_LEVEL: string;
}

// ========== LETTER_types ==========

export interface LetterTemplate {
  id: string;
  name: string;
  title: string;
  mood: string;
  content: string;
  isPublic: boolean;
  minLockDays: number;
  maxLockDays: number;
  tags: string[];
  author?: string; // Default author (Matthew if not specified)
}

export interface GenerateLetterRequest {
  templateId?: string; // Optional template ID
  customContent?: string; // Optional custom content (overrides template)
  title?: string; // Optional custom title
  mood?: string; // Optional custom mood
  unlockTime?: string; // ISO date string for unlock time
  isPublic?: boolean;
  recipientAddress?: string; // Address to create letter for (defaults to Matrix)
  mintWithPayment?: boolean; // Whether to mint with payment
  useX402?: boolean; // Whether to use X402 payment
  paymentToken?: string; // Token address for payment (native if not specified)
}

export interface GenerateLetterResponse {
  success: boolean;
  letterId?: number;
  transactionHash?: string;
  tokenId?: number; // NFT token ID if minted
  content: string;
  wasTruncated: boolean;
  originalLength?: number;
  truncatedLength?: number;
  error?: string;
  warnings?: string[];
}

export interface LetterResult {
  id: number;
  title: string;
  mood: string;
  contentPreview: string; // First 200 chars
  isPublic: boolean;
  unlockTime: string; // ISO date
  createdAt: string; // ISO date
  isMinted: boolean;
  transactionHash: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  blockchain: {
    connected: boolean;
    chainId: number;
    latestBlock?: number;
    contractAddress: string;
  };
  checks: {
    rpcConnection: boolean;
    contractDeployment: boolean;
    walletBalance: boolean;
  };
  uptime: number;
}

// ========== PAYMENT TYPES ==========

export interface PaymentOption {
  type: 'native' | 'erc20' | 'x402';
  tokenAddress: string; // address(0) for native
  symbol: string;
  decimals: number;
  amountRequired: string; // Human-readable amount (e.g., "0.05")
  amountWei: string; // Amount in smallest units (e.g., "50000" for USDC)
}

export interface X402PaymentData {
  version: number; // x402Version
  scheme: string; // 'exact' or other
  network: string; // e.g., 'eip155:143' for Monad mainnet
  payload: {
    client: string; // Payer address
    maxAmount: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

export interface PaymentVerificationRequest {
  paymentData: X402PaymentData;
  tokenAddress: string;
  amountUSD: number; // in cents
}

export interface PaymentVerificationResponse {
  isValid: boolean;
  error?: string;
  tokenInfo?: {
    name: string;
    version: string;
    chainId: number;
  };
}

// ========== MATRIX/USER TYPES ==========

export interface UserProfile {
  address: string;
  letterCount: number;
  mintedCount: number;
  autoGenAllowed: boolean;
  lastAutoGen?: string; // ISO date
}

export interface TruncationConfig {
  enabled: boolean;
  maxLength: number;
  truncationMarker: string; // e.g., "... (truncated)"
  preserveWords: boolean; // Try to truncate at word boundaries
}

// ========== DATABASE TYPES (for future persistence) ==========

export interface StoredLetter {
  id: string;
  templateId: string;
  recipientAddress: string;
  title: string;
  mood: string;
  fullContent: string;
  encryptedContent: string; // After encryption
  publicKey: string;
  unlockTime: number; // Unix timestamp
  isPublic: boolean;
  isMinted: boolean;
  transactionHash: string;
  tokenId?: number;
  createdAt: number; // Unix timestamp
  wasTruncated: boolean;
  originalLength: number;
}

// ========== ERROR TYPES ==========

export class LetterGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LetterGenerationError';
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly paymentType: string,
    public readonly amount?: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ContentTruncationWarning extends Error {
  constructor(
    message: string,
    public readonly originalLength: number,
    public readonly truncatedLength: number,
  ) {
    super(message);
    this.name = 'ContentTruncationWarning';
  }
}

// ========== MIDDLEWARE TYPES ==========

export interface RequestContext {
  requestId: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

export interface AuthenticatedRequest extends Request {
  context: RequestContext;
  auth?: {
    address: string;
    isMatrix: boolean;
    isAutoGenAllowed: boolean;
  };
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

// ========== API RESPONSE TYPES ==========

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  warnings?: string[];
  meta?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export type APIHandler<TReq, TRes> = (
  req: Request,
  res: Response<TRes>,
) => Promise<void>;

// ========== CONTRACT INTERFACE TYPES ==========

export interface ContractABI {
  methods: Record<string, any>;
  events: Record<string, any>;
}

export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
}
