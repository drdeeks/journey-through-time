import { ethers } from 'ethers';

export interface EncryptionResult {
  encryptedContent: string;
  publicKey: string;
}

/**
 * Generates a new encryption key pair
 */
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  const wallet = ethers.Wallet.createRandom();
  return {
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
  };
};

/**
 * Encrypts letter content using the provided public key
 */
export const encryptLetter = async (
  content: string,
  publicKey: string
): Promise<EncryptionResult> => {
  try {
    // Convert content to bytes
    const contentBytes = ethers.utils.toUtf8Bytes(content);
    
    // Create a temporary wallet to encrypt the content
    const tempWallet = new ethers.Wallet(publicKey);
    
    // Encrypt the content
    const encryptedContent = await tempWallet.encrypt(contentBytes);
    
    return {
      encryptedContent: JSON.stringify(encryptedContent),
      publicKey,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt letter content');
  }
};

/**
 * Decrypts letter content using the private key
 */
export const decryptLetter = async (
  encryptedContent: string,
  privateKey: string
): Promise<string> => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const decryptedBytes = await wallet.decrypt(JSON.parse(encryptedContent));
    return ethers.utils.toUtf8String(decryptedBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt letter content');
  }
}; 