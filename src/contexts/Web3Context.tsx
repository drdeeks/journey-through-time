import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { ethers } from 'ethers';
import FutureLetters from '../artifacts/contracts/journey-through-time.sol/FutureLetters.json';

// Initialize injected connector
export const injected = new InjectedConnector({
  supportedChainIds: [1337], // Replace with actual Monad testnet chain ID
});

// Contract ABI and address
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const contractABI = FutureLetters.abi;

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  contract: ethers.Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  contract: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  error: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activate, deactivate, account, chainId, library, active, error: web3Error } = useWeb3React();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (library && account) {
      const signer = library.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
      setContract(contractInstance);
    }
  }, [library, account]);

  useEffect(() => {
    if (web3Error) {
      setError(web3Error.message);
    }
  }, [web3Error]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await activate(injected);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    try {
      deactivate();
      setContract(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connect();
        }
      }
    };
    checkConnection();
  }, []);

  const value = {
    account: account || null,
    chainId: chainId || null,
    contract,
    connect,
    disconnect,
    isConnecting,
    error,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}; 