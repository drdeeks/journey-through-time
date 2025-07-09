import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Contract, BrowserProvider } from 'ethers';
import FutureLetters from '../artifacts/contracts/FutureLetters.sol/FutureLetters.json';
import type { Web3ContextType } from '../types';
import { TldParser, NetworkWithRpc } from '@onsol/tldparser';

// Initialize injected connector
export const injected = new InjectedConnector({
  supportedChainIds: [1337, 10143], // Local hardhat and Monad testnet
});

// Contract ABI and address
const contractAddress = process.env['REACT_APP_CONTRACT_ADDRESS'] || '';
const contractABI = FutureLetters.abi;

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  contract: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  error: null,
  mainDomain: null,
  isConnected: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activate,
    deactivate,
    account,
    chainId,
    library,
    active,
    error: web3Error,
  } = useWeb3React();
  const [contract, setContract] = useState<Contract | null>(null);
  const [mainDomain, setMainDomain] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initContract = async () => {
      if (library && account && contractAddress) {
        try {
          // Get signer for ethers v6
          const provider = library as BrowserProvider;
          const signer = await provider.getSigner();
          const contractInstance = new Contract(contractAddress, contractABI, signer);
          setContract(contractInstance);
          setError(null);
        } catch (err: any) {
          console.error('Failed to initialize contract:', err);
          setError('Failed to initialize contract');
        }
      } else {
        setContract(null);
      }
    };

    initContract();
  }, [library, account]);

  // Fetch main domain when account changes
  useEffect(() => {
    const fetchDomain = async () => {
      if (!account) {
        setMainDomain(null);
        return;
      }
      try {
        const settings = new NetworkWithRpc(
          'monad',
          10143,
          process.env['ETH_RPC_URL'] || 'https://testnet-rpc.monad.xyz'
        );
        const parser = new TldParser(settings, 'monad');
        const domain = await parser.getMainDomain(account);
        setMainDomain(domain || null);
      } catch (err) {
        console.warn('Domain fetch failed:', err);
        setMainDomain(null);
      }
    };
    fetchDomain();
  }, [account]);

  useEffect(() => {
    if (web3Error) {
      setError(web3Error.message);
      setIsConnecting(false);
    }
  }, [web3Error]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      await activate(injected);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    try {
      deactivate();
      setContract(null);
      setError(null);
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError(err.message || 'Failed to disconnect wallet');
    }
  };

  // Auto-connect if previously connected (but avoid infinite loops)
  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      if (!mounted || isConnecting) return;

      try {
        if (window.ethereum && !active) {
          const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
          if (accounts.length > 0 && mounted) {
            await connect();
          }
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
        // Don't set error state for auto-connect failures
      }
    };

    // Small delay to avoid race conditions
    const timeoutId = setTimeout(checkConnection, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array to run only once

  const value: Web3ContextType = {
    account: account || null,
    chainId: chainId || null,
    contract,
    connect,
    disconnect,
    isConnecting,
    error,
    mainDomain,
    isConnected: Boolean(active && account && contract),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
