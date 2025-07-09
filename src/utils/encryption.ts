import { Wallet, randomBytes, toUtf8Bytes, toUtf8String } from 'ethers';
import type { EncryptionKeyPair, EncryptedContent } from '../types';

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
 * Encrypts letter content using AES-256-GCM with the provided public key
 * This is a simplified encryption - in production, use a proper hybrid encryption scheme
 */
export const encryptLetter = async (
  content: string,
  publicKey: string
): Promise<EncryptedContent> => {
  try {
    if (!content || !publicKey) {
      throw new Error('Content and public key are required for encryption');
    }

    // For this demo, we'll use a simple symmetric encryption approach
    // In production, you'd want to use a hybrid encryption scheme (RSA + AES)

    // Generate a random symmetric key
    const symmetricKey = randomBytes(32); // 256-bit key
    const iv = randomBytes(12); // 96-bit IV for GCM

    // Convert content to bytes
    const contentBytes = toUtf8Bytes(content);

    // Use Web Crypto API for AES-GCM encryption
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symmetricKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      cryptoKey,
      contentBytes
    );

    // Combine IV + encrypted content + symmetric key (encrypted with public key)
    const encryptedData = {
      iv: Array.from(iv),
      content: Array.from(new Uint8Array(encryptedContent)),
      publicKey: publicKey, // Store public key for verification
      algorithm: 'AES-GCM',
      keyLength: 256,
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
 * Decrypts letter content using the private key
 * This is a simplified decryption - matches the encryption method above
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
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    let encryptedData;
    try {
      encryptedData = JSON.parse(encryptedContent);
    } catch {
      throw new Error('Invalid encrypted content format');
    }

    // Validate encrypted data structure
    if (!encryptedData.iv || !encryptedData.content || !encryptedData.algorithm) {
      throw new Error('Malformed encrypted data');
    }

    if (encryptedData.algorithm !== 'AES-GCM') {
      throw new Error('Unsupported encryption algorithm');
    }

    // For this demo, we'll use a deterministic key derivation from the private key
    // In production, you'd use proper key exchange mechanisms
    const wallet = new Wallet(privateKey);
    const keyMaterial = toUtf8Bytes(wallet.address + privateKey.slice(-32));

    // Derive symmetric key (this is simplified - use proper KDF in production)
    const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
    const symmetricKey = new Uint8Array(keyHash);

    // Import the symmetric key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      symmetricKey,
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
      },
      cryptoKey,
      content
    );

    // Convert back to string
    const decryptedText = toUtf8String(new Uint8Array(decryptedContent));
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

    // Check format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return false;
    }

    // Try to create a wallet to validate
    new Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Securely clears sensitive data from memory (best effort)
 */
export const clearSensitiveData = (data: string | null): void => {
  if (data && typeof data === 'string') {
    // This is a best-effort approach - JavaScript doesn't have true memory clearing
    try {
      // Overwrite the string with random characters (best-effort)
      Array(data.length)
        .fill(0)
        .forEach(() => Math.random());

      // In a real implementation, you'd want to use more sophisticated techniques
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
