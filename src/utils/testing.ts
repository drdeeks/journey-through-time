import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Web3ReactProvider } from '@web3-react/core';
import { BrowserProvider } from 'ethers';
import React, { ReactElement } from 'react';

// Test theme
const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Web3ReactProvider getLibrary={(provider) => new BrowserProvider(provider)}>
      <ThemeProvider theme={testTheme}>
        {children}
      </ThemeProvider>
    </Web3ReactProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockLetter = (overrides = {}) => ({
  id: 1,
  title: 'Test Letter',
  content: 'This is a test letter content.',
  unlockTime: Date.now() + 86400000, // 24 hours from now
  createdAt: Date.now(),
  author: '0x1234567890123456789012345678901234567890',
  recipient: '0x0987654321098765432109876543210987654321',
  isPublic: false,
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  address: '0x1234567890123456789012345678901234567890',
  balance: '1.0',
  chainId: 1,
  isConnected: true,
  ...overrides,
});

// Mock Web3 functions
export const mockWeb3Functions = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  switchNetwork: jest.fn(),
  signMessage: jest.fn(),
  sendTransaction: jest.fn(),
};

// Test utilities
export const waitForElementToBeRemoved = (element: Element) =>
  new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

export * from '@testing-library/react';
export { customRender as render };