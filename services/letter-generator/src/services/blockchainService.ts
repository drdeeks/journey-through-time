// ============================================
// Journey Through Time - Letter Generator Backend
// Blockchain Service
// ============================================

import { ethers } from 'ethers';
import config, { PAYMENT_CONFIG, FEATURES } from '../config';
import {
  GenerateLetterRequest,
  GenerateLetterResponse,
  PaymentOption,
  X402PaymentData,
} from '../types';
import { templateManager } from './contentTemplates';
import { contentTruncator } from '../utils/contentTruncator';

// ========== CONTRACT ABI ==========

// Simplified ABI for FutureLettersV2 contract
const FUTURE_LETTERS_V2_ABI = [
  // writeLetter
  {
    "inputs": [
      { "internalType": "bytes", "name": "_encryptedContent", "type": "bytes" },
      { "internalType": "uint256", "name": "_unlockTime", "type": "uint256" },
      { "internalType": "string", "name": "_publicKey", "type": "string" },
      { "internalType": "bool", "name": "_isPublic", "type": "bool" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_mood", "type": "string" },
    ],
    "name": "writeLetter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function",
  },
  // mintLetter (payable)
  {
    "inputs": [
      { "internalType": "bytes", "name": "_encryptedContent", "type": "bytes" },
      { "internalType": "uint256", "name": "_unlockTime", "type": "uint256" },
      { "internalType": "string", "name": "_publicKey", "type": "string" },
      { "internalType": "bool", "name": "_isPublic", "type": "bool" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_mood", "type": "string" },
      { "internalType": "address", "name": "_paymentToken", "type": "address" },
      { "internalType": "bytes", "name": "_x402Signature", "type": "bytes" },
    ],
    "name": "mintLetter",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
  },
  // createAutoLetter (for Matthew/auto-gen)
  {
    "inputs": [
      { "internalType": "bytes", "name": "_encryptedContent", "type": "bytes" },
      { "internalType": "uint256", "name": "_unlockTime", "type": "uint256" },
      { "internalType": "string", "name": "_publicKey", "type": "string" },
      { "internalType": "bool", "name": "_isPublic", "type": "bool" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_mood", "type": "string" },
      { "internalType": "string", "name": "_fullText", "type": "string" },
      { "internalType": "bool", "name": "_mintWithPayment", "type": "bool" },
    ],
    "name": "createAutoLetter",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
  },
  // getLetterInfo
  {
    "inputs": [{ "internalType": "uint256", "name": "_letterId", "type": "uint256" }],
    "name": "getLetterInfo",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string", "name": "", "type": "string" },
    ],
    "stateMutability": "view",
    "type": "function",
  },
  // getUserStats
  {
    "inputs": [],
    "name": "getUserStats",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "bool", "name": "", "type": "bool" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
    ],
    "stateMutability": "view",
    "type": "function",
  },
  // LetterCreated event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "letterId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "unlockTime", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isPublic", "type": "bool" },
      { "indexed": false, "internalType": "string", "name": "mood", "type": "string" },
      { "indexed": false, "internalType": "bool", "name": "isMinted", "type": "bool" },
    ],
    "name": "LetterCreated",
    "type": "event",
  },
  // LetterMinted event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "letterId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amountPaid", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "paidWithX402", "type": "bool" },
      { "indexed": false, "internalType": "address", "name": "paymentToken", "type": "address" },
    ],
    "name": "LetterMinted",
    "type": "event",
  },
];

// ERC-20 ABI (minimal)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function",
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function",
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function",
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" },
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function",
  },
];

// ERC-165 ABI
const ERC165_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "interfaceId", "type": "bytes4" }],
    "name": "supportsInterface",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function",
  },
];

const INTERFACE_ID_ERC402 = '0x4e3e3310';

/**
 * Blockchain Service
 * Handles all blockchain interactions for the letter generator
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private chainId: number;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.MONAD_RPC_URL);
    this.chainId = config.MONAD_CHAIN_ID;

    // Initialize contract if address is available
    if (config.CONTRACT_ADDRESS) {
      this.contract = new ethers.Contract(
        config.CONTRACT_ADDRESS,
        FUTURE_LETTERS_V2_ABI,
        this.provider,
      );
    }

    // Initialize signer if private key is available
    if (config.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(config.PRIVATE_KEY, this.provider);
    }
  }

  /**
   * Check if blockchain is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    return await this.provider.getFeeData().then((feeData) => feeData.gasPrice ?? 0n);
  }

  /**
   * Get contract instance with signer
   */
  private getContractWithSigner(): ethers.Contract {
    if (!this.signer) {
      throw new Error('Signer not initialized. Check PRIVATE_KEY configuration.');
    }
    if (!this.contract) {
      throw new Error('Contract not initialized. Check CONTRACT_ADDRESS configuration.');
    }
    return this.contract.connect(this.signer) as ethers.Contract;
  }

  /**
   * Generate a letter on-chain
   */
  async generateLetter(
    request: GenerateLetterRequest,
  ): Promise<GenerateLetterResponse> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validate request
      if (!request.recipientAddress) {
        request.recipientAddress = config.MATRIX_ADDRESS;
      }

      // Get template or use custom content
      let template;
      let content: string;
      let title: string;
      let mood: string;
      let isPublic: boolean;

      if (request.templateId) {
        template = templateManager.getTemplate(request.templateId);
        if (!template) {
          errors.push(`Template not found: ${request.templateId}`);
          return this.createErrorResponse(errors, warnings);
        }
        content = request.customContent ?? template.content;
        title = request.title ?? template.title;
        mood = request.mood ?? template.mood;
        isPublic = request.isPublic ?? template.isPublic;
      } else if (request.customContent) {
        content = request.customContent;
        title = request.title ?? 'Untitled Letter';
        mood = request.mood ?? 'hopeful';
        isPublic = request.isPublic ?? false;
      } else {
        // Use a random template
        template = templateManager.getRandomTemplate();
        content = template.content;
        title = template.title;
        mood = template.mood;
        isPublic = template.isPublic;
      }

      // Truncate content if needed
      const truncationResult = contentTruncator.truncateForMatrix(
        content,
        !request.templateId || !request.templateId.startsWith('matic_'),
      );

      if (truncationResult.wasTruncated) {
        warnings.push(
          `Content truncated from ${truncationResult.originalLength} to ${truncationResult.truncatedLength} characters`,
        );
        content = truncationResult.content;
      }

      // Calculate unlock time
      const unlockTime = this.calculateUnlockTime(request.unlockTime);

      // For now, we'll use the backend wallet to create letters
      // In a full implementation, we'd allow users to sign their own transactions
      const contractWithSigner = this.getContractWithSigner();

      // Check if we should mint with payment
      const shouldMint = request.mintWithPayment ?? false;

      if (shouldMint) {
        // Calculate payment amount
        const paymentAmount = this.calculateMintFee();

        // Build transaction based on payment method
        let tx:
          | Promise<ethers.ContractTransactionResponse>
          | undefined = undefined;

        if (request.useX402 && FEATURES.ENABLE_X402_PAYMENTS) {
          // X402 payment (signature-based)
          // In a full implementation, this would construct the X402 signature
          throw new Error('X402 payments not yet fully implemented');
        } else {
          // Standard payment (native token or ERC-20)
          const paymentToken = request.paymentToken
            ? request.paymentToken
            : ethers.ZeroAddress;

          tx = contractWithSigner.mintLetter(
            ethers.hexlify(ethers.toUtf8Bytes(content)),
            unlockTime,
            'publicKeyPlaceholder', // Would use actual public key in real implementation
            isPublic,
            title,
            mood,
            paymentToken,
            '0x', // Empty X402 signature
            {
              value: paymentAmount,
            },
          );
        }

        if (!tx) {
          errors.push('Failed to build minting transaction');
          return this.createErrorResponse(errors, warnings);
        }

        // Execute transaction
        const txResponse = await tx;
        const receipt = await txResponse.wait();

        // Extract letter ID and token ID from events
        let letterId: number | undefined;
        let tokenId: number | undefined;

        if (receipt) {
          for (const log of receipt.logs) {
            try {
              const event = contractWithSigner.interface.parseLog(log);
              if (event?.name === 'LetterCreated') {
                letterId = Number(event.args.letterId);
              } else if (event?.name === 'LetterMinted') {
                letterId = Number(event.args.letterId);
                tokenId = Number(event.args.tokenId);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }

        return {
          success: true,
          letterId,
          transactionHash: txResponse.hash,
          tokenId,
          content: truncationResult.content,
          wasTruncated: truncationResult.wasTruncated,
          originalLength: truncationResult.originalLength,
          truncatedLength: truncationResult.truncatedLength,
          warnings,
        };
      } else {
        // Gas-only letter creation (no minting)
        const tx = await contractWithSigner.writeLetter(
          ethers.hexlify(ethers.toUtf8Bytes(content)),
          unlockTime,
          'publicKeyPlaceholder',
          isPublic,
          title,
          mood,
        );

        const receipt = await tx.wait();

        // Extract letter ID from event
        let letterId: number | undefined;
        if (receipt) {
          for (const log of receipt.logs) {
            try {
              const event = contractWithSigner.interface.parseLog(log);
              if (event?.name === 'LetterCreated') {
                letterId = Number(event.args.letterId);
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }

        return {
          success: true,
          letterId,
          transactionHash: tx.hash,
          content: truncationResult.content,
          wasTruncated: truncationResult.wasTruncated,
          originalLength: truncationResult.originalLength,
          truncatedLength: truncationResult.truncatedLength,
          warnings,
        };
      }
    } catch (error) {
      errors.push((error as Error).message);
      return this.createErrorResponse(errors, warnings);
    }
  }

  /**
   * Calculate unlock time from ISO date string or days from now
   */
  private calculateUnlockTime(unlockTime?: string): number {
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp

    if (!unlockTime) {
      // Default to 30 days from now
      return now + 30 * 24 * 60 * 60;
    }

    // Try to parse as ISO date
    try {
      const date = new Date(unlockTime);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000);
      }
    } catch {
      // Not an ISO date, try parsing as days
    }

    // Try to parse as number of days
    try {
      const days = parseInt(unlockTime, 10);
      if (!isNaN(days)) {
        return now + days * 24 * 60 * 60;
      }
    } catch {
      // Fall back to default
    }

    // Default: 30 days from now
    return now + 30 * 24 * 60 * 60;
  }

  /**
   * Calculate mint fee in native token wei
   * Note: This is a placeholder. In production, use a price feed.
   */
  private calculateMintFee(): bigint {
    // For now, use a fixed amount based on approximate USD value
    // $0.05 USD worth of MON (Monad token)
    // Assuming MON is ~$1.00 (placeholder), $0.05 = 0.05 MON = 50000000000000000 wei
    
    // In production, this would query a price feed for the MON/USD rate
    // and calculate the exact amount
    return ethers.parseEther('0.05'); // 0.05 MON = 50000000000000000 wei
  }

  /**
   * Get payment options for minting
   */
  async getPaymentOptions(): Promise<PaymentOption[]> {
    const options: PaymentOption[] = [];

    // Native token option
    options.push({
      type: 'native',
      tokenAddress: ethers.ZeroAddress,
      symbol: PAYMENT_CONFIG.NATIVE_TOKEN_SYMBOL,
      decimals: 18,
      amountRequired: '0.05',
      amountWei: ethers.parseEther('0.05').toString(),
    });

    // ERC-20 options (if enabled)
    if (FEATURES.ENABLE_ERC20_PAYMENTS) {
      for (const [tokenAddress, symbol] of Object.entries(
        PAYMENT_CONFIG.SUPPORTED_TOKENS,
      )) {
        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ERC20_ABI,
            this.provider,
          );
          const decimals = (await tokenContract.decimals()) as number;
          
          // For stablecoins, $0.05 = 0.05 * 10^decimals
          const amountWei = ethers
            .parseUnits('0.05', decimals)
            .toString();

          options.push({
            type: 'erc20',
            tokenAddress,
            symbol,
            decimals,
            amountRequired: '0.05',
            amountWei,
          });
        } catch {
          // Skip tokens that fail to load
        }
      }
    }

    // X402 options (if enabled)
    if (FEATURES.ENABLE_X402_PAYMENTS) {
      for (const [tokenAddress] of Object.entries(PAYMENT_CONFIG.X402_TOKENS)) {
        // Check if token supports ERC-402 interface
        try {
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ERC165_ABI,
            this.provider,
          );
          const supportsERC402 = (await tokenContract.supportsInterface(
            INTERFACE_ID_ERC402,
          )) as boolean;

          if (supportsERC402) {
            // For X402, we need to get token info
            const erc20Contract = new ethers.Contract(
              tokenAddress,
              ERC20_ABI,
              this.provider,
            );
            const [symbol, decimals] = (await Promise.all([
              erc20Contract.symbol(),
              erc20Contract.decimals(),
            ])) as [string, number];

            const amountWei = ethers
              .parseUnits('0.05', decimals)
              .toString();

            options.push({
              type: 'x402',
              tokenAddress,
              symbol,
              decimals,
              amountRequired: '0.05',
              amountWei,
            });
          }
        } catch {
          // Skip tokens that fail to load
        }
      }
    }

    return options;
  }

  /**
   * Validate X402 payment signature
   * Note: This is a placeholder. Full implementation requires EIP-712.
   */
  async validateX402Payment(
    paymentData: X402PaymentData,
    tokenAddress: string,
    amountUSD: number,
  ): Promise<boolean> {
    if (!FEATURES.ENABLE_X402_PAYMENTS) {
      return false;
    }

    try {
      // Check if token supports ERC-402
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC165_ABI,
        this.provider,
      );
      const supportsERC402 = (await tokenContract.supportsInterface(
        INTERFACE_ID_ERC402,
      )) as boolean;

      if (!supportsERC402) {
        return false;
      }

      // In a full implementation, we would:
      // 1. Verify the EIP-712 signature
      // 2. Check that the payload matches the required amount
      // 3. Validate the nonce and time window
      // 4. Ensure the token contract accepts the signature

      // For now, just check basic structure
      return (
        paymentData.version === 2 &&
        paymentData.scheme === 'exact' &&
        paymentData.payload.maxAmount === String(amountUSD * 100) && // Convert to cents
        paymentData.payload.validBefore > paymentData.payload.validAfter
      );
    } catch {
      return false;
    }
  }

  /**
   * Get user statistics from contract
   */
  async getUserStats(address: string): Promise<any> {
    const contractWithSigner = this.getContractWithSigner();
    
    // Call the contract's getUserStats function
    // Note: This requires the user's address, but the function is view-only
    // so we can call it without a signer
    const stats = await this.contract?.getUserStats();
    return stats;
  }

  /**
   * Get contract balance
   */
  async getContractBalance(): Promise<bigint> {
    return await this.provider.getBalance(config.CONTRACT_ADDRESS || '');
  }

  /**
   * Get letter info
   */
  async getLetterInfo(letterId: number, userAddress: string): Promise<any> {
    // In the contract, getLetterInfo requires the caller to be the letter owner
    // For now, we'll just return mock data or implement a view function
    // that doesn't require authentication
    
    // This is a placeholder - in a full implementation, we'd need to:
    // 1. Call the contract as the user (via meta-transaction or direct call)
    // 2. Or implement a backend function that can read any user's letters
    
    return {
      id: letterId,
      title: 'Sample Letter',
      mood: 'hopeful',
      unlockTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
      createdAt: Math.floor(Date.now() / 1000),
      isRead: false,
      isUnlocked: false,
      isPublic: false,
      isMinted: false,
    };
  }

  /**
   * Get current blockchain info
   */
  async getBlockchainInfo() {
    const blockNumber = await this.provider.getBlockNumber();
    const block = await this.provider.getBlock(blockNumber);
    const gasPrice = await this.getGasPrice();

    return {
      chainId: this.chainId,
      blockNumber,
      blockTimestamp: block?.timestamp,
      gasPrice: gasPrice.toString(),
      contractAddress: config.CONTRACT_ADDRESS,
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    errors: string[],
    warnings: string[],
  ): GenerateLetterResponse {
    return {
      success: false,
      error: errors.join('; '),
      warnings,
    };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;
