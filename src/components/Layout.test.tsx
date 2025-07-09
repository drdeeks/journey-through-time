import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';

// Mock the Web3Context using the centralized mock
jest.mock('../contexts/Web3Context', () => ({
  __esModule: true,
  useWeb3: jest.fn(() => ({
    account: null,
    chainId: null,
    contract: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnecting: false,
    error: null,
    isConnected: false,
    mainDomain: null,
  })),
}));

// Mock the useMediaQuery hook
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false, // Desktop by default
}));

// Import after mocks are set up
import Layout from './Layout';
import { useWeb3 } from '../contexts/Web3Context';

// Create a theme for testing
const theme = createTheme();

// Wrapper component for providing necessary context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWeb3 as jest.MockedFunction<typeof useWeb3>).mockReturnValue({
      account: null,
      chainId: null,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: null,
      isConnected: false,
      mainDomain: null,
    });
  });

  it('renders app title correctly', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    expect(screen.getByText('Journey Through Time')).toBeInTheDocument();
  });

  it('renders navigation buttons in desktop view', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    // Check for navigation items by their unique text
    expect(screen.getAllByText('Write Letter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('My Letters').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Public Letters').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('shows connect wallet button when not connected', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );
    expect(screen.getByLabelText('Connect wallet')).toBeInTheDocument();
  });

  it('shows connected wallet when connected', () => {
    // Mock connected state
    const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>;
    mockUseWeb3.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      chainId: 1337,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: null,
      isConnected: true,
      mainDomain: null,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByLabelText('Disconnect wallet')).toBeInTheDocument();
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
  });

  it('shows loading state when connecting', () => {
    // Mock connecting state
    const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>;
    mockUseWeb3.mockReturnValue({
      account: null,
      chainId: null,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: true,
      error: null,
      isConnected: false,
      mainDomain: null,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows error state when connection fails', () => {
    // Mock error state
    const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>;
    mockUseWeb3.mockReturnValue({
      account: null,
      chainId: null,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: 'Connection failed',
      isConnected: false,
      mainDomain: null,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('Wallet connection error: Connection failed')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </TestWrapper>
    );
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('shows network indicator when connected', () => {
    // Mock connected state with chainId
    const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>;
    mockUseWeb3.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      chainId: 1337,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: null,
      isConnected: true,
      mainDomain: null,
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getAllByText('Local').length).toBeGreaterThan(0);
  });

  it('shows main domain when available', () => {
    // Mock domain value
    const mockUseWeb3 = useWeb3 as jest.MockedFunction<typeof useWeb3>;
    mockUseWeb3.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      chainId: 1337,
      contract: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnecting: false,
      error: null,
      isConnected: true,
      mainDomain: 'alice.mon',
    });

    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('alice.mon')).toBeInTheDocument();
  });
});
