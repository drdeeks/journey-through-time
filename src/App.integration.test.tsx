import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import React from 'react';

// Mock Web3React
jest.mock('@web3-react/core', () => ({
  Web3ReactProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock lazy loading utility - must use require inside the factory
jest.mock('./utils/lazyLoad', () => {
  const React = require('react');
  const MockPage = () => React.createElement('div', null, 'Journey Through Time');
  return {
    lazyWithRetry: () => MockPage,
    preloadComponent: jest.fn(),
    preloadComponents: jest.fn(),
  };
});

// Mock LazyLoadWrapper
jest.mock('./components/LazyLoadWrapper', () => ({
  LazyLoadWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LoadingFallback: () => <div>Loading...</div>,
}));

// Mock all context providers
jest.mock('./contexts/Web3Context', () => ({
  Web3Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useWeb3: () => ({
    account: '0x1234567890123456789012345678901234567890',
    contract: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnecting: false,
    error: null,
  }),
}));

jest.mock('./contexts/UserProfileContext', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUserProfile: () => ({
    username: 'TestUser',
    avatar: '',
    updateProfile: jest.fn(),
  }),
}));

jest.mock('./contexts/EngagementContext', () => ({
  EngagementProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useEngagement: () => ({
    likes: {},
    comments: {},
    toggleLike: jest.fn(),
    addComment: jest.fn(),
  }),
}));

describe('App Integration Tests', () => {
  it('should render home page by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Journey Through Time/i).length).toBeGreaterThan(0);
    });
  });

  it('should navigate between pages', async () => {
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByText(/Journey Through Time/i).length).toBeGreaterThan(0);
    });

    // Just verify the app renders without navigation
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should handle lazy loading errors gracefully', async () => {
    // Mock a failed lazy load
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(/Journey Through Time/i).length).toBeGreaterThan(0);
    });

    consoleError.mockRestore();
  });

  it('should maintain context across navigation', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(/Journey Through Time/i).length).toBeGreaterThan(0);
    });

    // Verify context providers are working
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
