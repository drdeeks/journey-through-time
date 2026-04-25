import { useCallback, useMemo, useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Public as PublicIcon } from '@mui/icons-material';

interface FarcasterShareButtonProps {
  label?: string;
  frameUrl: string;
}

const FarcasterShareButton = ({ label = 'Share on Farcaster', frameUrl }: FarcasterShareButtonProps) => {
  const [notification, setNotification] = useState<{ open: boolean; message: string }>(
    { open: false, message: '' }
  );

  const shareUrl = useMemo(() => {
    const encodedFrame = encodeURIComponent(frameUrl);
    return `https://warpcast.com/~/compose?embeds[]=${encodedFrame}`;
  }, [frameUrl]);

  const handleShare = useCallback(async () => {
    if (!frameUrl) {
      setNotification({ open: true, message: 'Frame URL is not configured.' });
      return;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setNotification({ open: true, message: 'Warpcast share link copied to clipboard.' });
      }
    } catch {
      setNotification({ open: true, message: 'Unable to copy share link. Please open manually.' });
    }

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, [frameUrl, shareUrl]);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<PublicIcon />}
        onClick={handleShare}
        disabled={!frameUrl}
      >
        {label}
      </Button>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ open: false, message: '' })}
          severity="info"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FarcasterShareButton;
