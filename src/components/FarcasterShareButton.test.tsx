import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FarcasterShareButton from './FarcasterShareButton';

describe('FarcasterShareButton', () => {
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    openSpy.mockClear();
  });

  afterAll(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    }
    openSpy.mockRestore();
  });

  it('disables the button when frame URL is missing', () => {
    render(<FarcasterShareButton frameUrl="" />);

    const button = screen.getByRole('button', { name: /share on farcaster/i });
    expect(button).toBeDisabled();
  });

  it('opens Warpcast compose with the frame embed', async () => {
    const frameUrl = 'https://frames.example.com/frame';

    render(<FarcasterShareButton frameUrl={frameUrl} />);

    const button = screen.getByRole('button', { name: /share on farcaster/i });
    fireEvent.click(button);

    const expectedUrl = `https://warpcast.com/~/compose?embeds[]=${encodeURIComponent(frameUrl)}`;
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(expectedUrl, '_blank', 'noopener,noreferrer');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
