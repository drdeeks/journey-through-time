import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock Web3 provider
jest.mock('../contexts/Web3Context', () => ({
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

describe('App Integration Tests', () => {
  it('should render home page by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Journey Through Time/i)).toBeInTheDocument();
    });
  });

  it('should navigate between pages', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Journey Through Time/i)).toBeInTheDocument();
    });

    // Navigate to Write Letter page
    const writeButton = screen.getByRole('link', { name: /write letter/i });
    await user.click(writeButton);

    await waitFor(() => {
      expect(screen.getByText(/Write a Letter/i)).toBeInTheDocument();
    });
  });

  it('should handle lazy loading errors gracefully', async () => {
    // Mock a failed lazy load
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Journey Through Time/i)).toBeInTheDocument();
    });

    consoleError.mockRestore();
  });

  it('should maintain context across navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Journey Through Time/i)).toBeInTheDocument();
    });

    // Navigate to profile
    const profileLink = screen.getByRole('link', { name: /profile/i });
    await user.click(profileLink);

    await waitFor(() => {
      expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
    });

    // Navigate back to home
    const homeLink = screen.getByRole('link', { name: /home/i });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByText(/Journey Through Time/i)).toBeInTheDocument();
    });
  });
});
