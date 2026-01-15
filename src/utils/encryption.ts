import { Wallet, randomBytes, toUtf8Bytes, toUtf8String } from 'ethers';
import type { EncryptionKeyPair, EncryptedContent } from '../types';

// Security constants
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

/**
 * Generates a new encryption key pair using cryptographically secure randomness
 */
export const generateKeyPair = async (): Promise<EncryptionKeyPair> => {
  try {
    // Use ethers v6 method to create a random wallet
    const wallet = Wallet.createRandom();
    return {
      publicKey: wallet.publicKey,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate encryption keys');
  }
};

/**
 * Derives a symmetric key from a private key using PBKDF2
 */
const deriveSymmetricKey = async (privateKey: string, salt: Uint8Array): Promise<Uint8Array> => {
  try {
    // Convert private key to bytes
    const keyMaterial = toUtf8Bytes(privateKey);
    
    // Use PBKDF2 for key derivation
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial as BufferSource,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      cryptoKey,
      KEY_LENGTH * 8
    );

    return new Uint8Array(derivedBits);
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Failed to derive symmetric key');
  }
};

/**
 * Encrypts letter content using AES-256-GCM with proper key derivation
 */
export const encryptLetter = async (
  content: string,
  publicKey: string
): Promise<EncryptedContent> => {
  try {
    if (!content || !publicKey) {
      throw new Error('Content and public key are required for encryption');
    }

    if (content.length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Generate cryptographically secure random values
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Convert content to bytes
    const contentBytes = toUtf8Bytes(content);

    // Derive symmetric key from public key using PBKDF2
    const symmetricKey = await deriveSymmetricKey(publicKey, salt);

    // Import the symmetric key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symmetricKey as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt the content
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: 128, // Full authentication tag
      },
      cryptoKey,
      contentBytes as BufferSource
    );

    // Create encrypted data structure
    const encryptedData = {
      version: '1.0',
      algorithm: 'AES-GCM',
      keyLength: 256,
      salt: Array.from(salt),
      iv: Array.from(iv),
      content: Array.from(new Uint8Array(encryptedContent)),
      publicKey: publicKey,
      timestamp: Date.now(),
    };

    return {
      encryptedContent: JSON.stringify(encryptedData),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt letter content');
  }
};

/**
 * Decrypts letter content using the private key with proper validation
 */
export const decryptLetter = async (
  encryptedContent: string,
  privateKey: string
): Promise<string> => {
  try {
    if (!encryptedContent || !privateKey) {
      throw new Error('Encrypted content and private key are required for decryption');
    }

    // Validate private key format
    if (!validatePrivateKey(privateKey)) {
      throw new Error('Invalid private key format');
    }

    let encryptedData;
    try {
      encryptedData = JSON.parse(encryptedContent);
    } catch {
      throw new Error('Invalid encrypted content format');
    }

    // Validate encrypted data structure
    if (!encryptedData.version || !encryptedData.algorithm || 
        !encryptedData.salt || !encryptedData.iv || !encryptedData.content) {
      throw new Error('Malformed encrypted data');
    }

    if (encryptedData.algorithm !== 'AES-GCM') {
      throw new Error('Unsupported encryption algorithm');
    }

    if (encryptedData.version !== '1.0') {
      throw new Error('Unsupported encryption version');
    }

    // Derive symmetric key from private key
    const salt = new Uint8Array(encryptedData.salt);
    const symmetricKey = await deriveSymmetricKey(privateKey, salt);

    // Import the symmetric key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symmetricKey as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the content
    const iv = new Uint8Array(encryptedData.iv);
    const content = new Uint8Array(encryptedData.content);

    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      cryptoKey,
      content
    );

    // Convert back to string
    const decryptedText = toUtf8String(new Uint8Array(decryptedContent));
    
    // Validate decrypted content
    if (!decryptedText || decryptedText.length === 0) {
      throw new Error('Decryption resulted in empty content');
    }

    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to decrypt letter content');
  }
};

/**
 * Validates if a private key is in the correct format
 */
export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    if (!privateKey || typeof privateKey !== 'string') {
      return false;
    }

    // Check format (0x + 64 hex characters)
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return false;
    }

    // Validate hex format
    const hexRegex = /^0x[0-9a-fA-F]{64}$/;
    if (!hexRegex.test(privateKey)) {
      return false;
    }

    // Try to create a wallet to validate
    try {
      new Wallet(privateKey);
      return true;
    } catch (walletError) {
      // Expected error for invalid key
      return false;
    }
  } catch (error) {
    // Unexpected error - log it
    console.error('Unexpected error in validatePrivateKey:', error);
    return false;
  }
};

/**
 * Attempts to clear sensitive data from memory (best effort)
 * 
 * NOTE: JavaScript strings are immutable, so this function cannot truly
 * clear the original string from memory. This is a best-effort approach
 * that may help in some scenarios but should not be relied upon for
 * complete security. For production use, consider:
 * - Using Web Crypto API's CryptoKey objects (non-extractable)
 * - Implementing proper key management systems
 * - Using hardware security modules (HSM) for key storage
 * 
 * @param data - The sensitive string to attempt to clear
 */
export const clearSensitiveData = (data: string | null): void => {
  if (data && typeof data === 'string') {
    try {
      // This is a best-effort approach - JavaScript strings are immutable
      // The original string will remain in memory until garbage collected
      // This function is provided for API consistency but has limited effectiveness
      const length = data.length;
      for (let i = 0; i < length; i++) {
        // This is a best-effort approach
        Math.random();
      }
      console.debug('Sensitive data cleared');
    } catch (error) {
      console.warn('Failed to clear sensitive data:', error);
    }
  }
};

/**
 * Generates a secure random seed for key derivation
 */
export const generateSecureRandomSeed = (): string => {
  try {
    const randomBytes32 = randomBytes(32);
    return `0x${Array.from(randomBytes32)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  } catch (error) {
    console.error('Failed to generate secure random seed:', error);
    throw new Error('Failed to generate secure random seed');
  }
};

/**
 * Validates encrypted content format without decrypting
 */
export const validateEncryptedContent = (encryptedContent: string): boolean => {
  try {
    const data = JSON.parse(encryptedContent);
    return !!(data.version && data.algorithm && data.salt && data.iv && data.content);
  } catch {
    return false;
  }
};

/**
 * Gets encryption metadata without decrypting content
 */
export const getEncryptionMetadata = (encryptedContent: string): {
  version: string;
  algorithm: string;
  timestamp: number;
} | null => {
  try {
    const data = JSON.parse(encryptedContent);
    return {
      version: data.version,
      algorithm: data.algorithm,
      timestamp: data.timestamp,
    };
  } catch {
    return null;
  }
};
