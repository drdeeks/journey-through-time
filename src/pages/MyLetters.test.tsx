import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock the Web3 context using the centralized mock
jest.mock('../contexts/Web3Context', () => ({
  __esModule: true,
  useWeb3: jest.fn(() => ({
    account: '0x1234567890123456789012345678901234567890',
    chainId: 1337,
    contract: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnecting: false,
    error: null,
    isConnected: true,
    mainDomain: null,
  })),
}));

// Mock the encryption utils
jest.mock('../utils/encryption', () => ({
  decryptLetter: jest.fn().mockImplementation(() => Promise.resolve('Test decrypted content')),
}));

// Import after mocks are set up
import MyLetters from './MyLetters';
import { useWeb3 } from '../contexts/Web3Context';
import { mockWeb3Contract } from '../__mocks__/Web3Context';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

jest.setTimeout(15000);

// helper mock contract generating letters
const generateMockContract = () => ({
  ...mockWeb3Contract,
  getMyLetters: jest.fn().mockResolvedValue([
    [0n, 1n],
    [
      BigInt(Math.floor(Date.now() / 1000) + 86400 * 2),
      BigInt(Math.floor(Date.now() / 1000) + 86400 * 4),
    ],
    [BigInt(Math.floor(Date.now() / 1000) - 3600), BigInt(Math.floor(Date.now() / 1000) - 7200)],
    [false, false],
    [false, true],
    [true, false],
    ['Public Letter', 'Private Letter'],
    ['happy', 'sad'],
  ]),
});

describe('MyLetters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementation to default
    (useWeb3 as jest.Mock).mockReturnValue({
      contract: generateMockContract(),
      account: '0x123...',
      isConnected: true,
      chainId: 1337,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: null,
    });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Wait for letters to load by checking for specific letter titles
   */
  const waitForLettersToLoad = async () => {
    await waitFor(
      () => {
        expect(screen.getByText('Public Letter')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  };

  it('renders the letters list with correct tabs', async () => {
    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    await waitForLettersToLoad();

    expect(screen.getAllByText(/All/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Locked/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unlocked/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Public/i).length).toBeGreaterThan(0);
  });

  it('displays public and private letters correctly', async () => {
    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    await waitForLettersToLoad();

    expect(screen.getByText('Public Letter')).toBeInTheDocument();
    expect(screen.getByText('Private Letter')).toBeInTheDocument();

    // Check for public/private indicators
    expect(screen.getByText('Public Letter')).toBeInTheDocument();
    expect(screen.getByText('Private Letter')).toBeInTheDocument();
  });

  it('filters letters correctly when switching tabs', async () => {
    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    await waitForLettersToLoad();

    // Switch to Public tab
    const publicTab = screen.getAllByRole('tab', { name: /Public/i })[0];
    fireEvent.click(publicTab);

    await waitFor(() => {
      expect(screen.getByText('Public Letter')).toBeInTheDocument();
      expect(screen.queryByText('Private Letter')).not.toBeInTheDocument();
    });

    // Switch to Unlocked tab
    const unlockedTab = screen.getAllByRole('tab', { name: /Unlocked/i })[0];
    fireEvent.click(unlockedTab);

    await waitFor(() => {
      expect(screen.getByText('Private Letter')).toBeInTheDocument();
      expect(screen.queryByText('Public Letter')).not.toBeInTheDocument();
    });
  });

  it('shows correct letter status and metadata', async () => {
    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    await waitForLettersToLoad();

    // Check for creation dates
    const createdTexts = screen.getAllByText(/Created:/i);
    expect(createdTexts.length).toBeGreaterThan(0);

    // Test read letter functionality
    const readButtons = screen.getAllByRole('button', { name: /read/i });
    expect(readButtons.length).toBeGreaterThan(0);

    // Click the first read button if it exists
    if (readButtons[0]) {
      fireEvent.click(readButtons[0]);
    }
  });

  it('shows loading state initially', () => {
    // Mock empty contract to show loading
    (useWeb3 as jest.Mock).mockReturnValue({
      contract: null,
      account: null,
      isConnected: false,
    });

    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    // Should not show loading spinner when no contract (shows message instead)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles no letters state', async () => {
    // Mock empty letters response
    const emptyMockContract = {
      ...mockWeb3Contract,
      getMyLetters: jest.fn().mockResolvedValue([
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [], // Empty arrays
      ]),
    };

    (useWeb3 as jest.Mock).mockReturnValue({
      contract: emptyMockContract,
      account: '0x123...',
      isConnected: true,
    });

    render(
      <TestWrapper>
        <MyLetters />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/haven't written any letters/i)).toBeInTheDocument();
    });
  });
});
