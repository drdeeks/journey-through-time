import React from 'react';

// Central mock contract used across tests
export const mockWeb3Contract = {
  getMyLetters: jest.fn().mockResolvedValue([
    // letterIds
    [0n, 1n],
    // unlockTimes (future)
    [
      BigInt(Math.floor(Date.now() / 1000) + 86400 * 10),
      BigInt(Math.floor(Date.now() / 1000) + 86400 * 20),
    ],
    // createdAts
    [BigInt(Math.floor(Date.now() / 1000) - 3600), BigInt(Math.floor(Date.now() / 1000) - 7200)],
    // isReadArray
    [false, true],
    // isUnlockedArray
    [false, true],
    // isPublicArray
    [true, false],
    // titles
    ['Public Letter', 'Private Letter'],
    // moods
    ['happy', 'neutral'],
  ]),
  readLetter: jest.fn().mockResolvedValue(['encryptedContent', 'publicKey']),
  writeLetter: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({ status: 1 }) }),
  getLetterInfo: jest
    .fn()
    .mockResolvedValue([1708560000, 1706745600, false, false, true, 'Test Letter', 'happy']),
};

export const useWeb3 = jest.fn(() => ({
  account: null,
  chainId: null,
  contract: mockWeb3Contract,
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnecting: false,
  error: null,
  isConnected: false,
  mainDomain: null,
}));

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default { Web3Provider, useWeb3, mockWeb3Contract };
