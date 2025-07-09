import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Buffer } from 'buffer';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Skeleton,
  Snackbar,
  AlertTitle,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Public as PublicIcon,
  LockPerson as PrivateIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { decryptLetter, validatePrivateKey, clearSensitiveData } from '../utils/encryption';
import EngagementSection from '../components/EngagementSection';
import { formatDistanceToNow } from 'date-fns';
import { Letter, FutureLettersContract, TabChangeEvent, LoadingState, ErrorState } from '../types';

const MyLetters: React.FC = () => {
  const { contract, account, isConnected } = useWeb3();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: true });
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState({
    decrypting: false,
    copying: false,
    downloading: false,
    fetching: false,
  });
  const [notifications, setNotifications] = useState({
    copy: { show: false, success: false, message: '' },
    download: { show: false, success: false, message: '' },
  });

  // Memoized filtered letters for performance
  const filteredLetters = useMemo(() => {
    switch (selectedTab) {
      case 0: // All letters
        return letters;
      case 1: // Locked letters
        return letters.filter((letter) => !letter.isUnlocked);
      case 2: // Unlocked letters
        return letters.filter((letter) => letter.isUnlocked);
      case 3: // Public letters
        return letters.filter((letter) => letter.isPublic);
      default:
        return letters;
    }
  }, [letters, selectedTab]);

  const fetchLetters = useCallback(async () => {
    if (!contract || !account || !isConnected) {
      setLoadingState({ isLoading: false });
      return;
    }

    try {
      setLoadingState({ isLoading: true, message: 'Fetching your letters...' });
      setErrorState({ hasError: false });

      const typedContract = contract as unknown as FutureLettersContract;
      const [
        letterIds,
        unlockTimes,
        createdAts,
        isReadArray,
        isUnlockedArray,
        isPublicArray,
        titles,
        moods,
      ] = await typedContract.getMyLetters();

      const lettersData: Letter[] = letterIds.map((id: bigint, index: number) => ({
        id: Number(id),
        title: titles[index] || 'Untitled Letter',
        unlockTime: Number(unlockTimes[index]),
        createdAt: Number(createdAts[index]),
        isRead: isReadArray[index] ?? false,
        isUnlocked: isUnlockedArray[index] ?? false,
        isPublic: isPublicArray[index] ?? false,
        mood: moods[index] || 'neutral',
      }));

      // Sort letters by creation time (newest first)
      lettersData.sort((a, b) => b.createdAt - a.createdAt);

      setLetters(lettersData);

      // Fetch tokenURI for locked letters to get image thumbnails
      try {
        const lockedLetters = lettersData.filter((l) => !l.isUnlocked);
        const typedContract = contract as unknown as FutureLettersContract;
        const updated: Letter[] = await Promise.all(
          lockedLetters.map(async (letter) => {
            try {
              const tokenUri: string = await (typedContract as any).tokenURI(BigInt(letter.id));
              const metaBase64 = tokenUri.split(',')[1];
              if (!metaBase64) return letter;
              const jsonStr =
                typeof window !== 'undefined' && (window as any).atob
                  ? (window as any).atob(metaBase64)
                  : Buffer.from(metaBase64, 'base64').toString('utf-8');
              const meta = JSON.parse(jsonStr);
              return { ...letter, imageUrl: meta.image } as Letter;
            } catch {
              return letter;
            }
          })
        );

        // Merge thumbnails back into letters list
        setLetters((prev) => {
          const map = new Map(prev.map((l) => [l.id, l]));
          updated.forEach((u) => map.set(u.id, { ...map.get(u.id)!, ...u }));
          return Array.from(map.values());
        });
      } catch (err) {
        console.warn('Failed to fetch token URIs', err);
      }

      setLoadingState({ isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch letters:', err);
      setErrorState({
        hasError: true,
        message: err.message || 'Failed to fetch letters',
        code: err.code,
      });
      setLoadingState({ isLoading: false });
    }
  }, [contract, account, isConnected]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleTabChange = (_: TabChangeEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleReadLetter = async (letter: Letter) => {
    if (!contract || !account || !isConnected) {
      setErrorState({ hasError: true, message: 'Please connect your wallet to read letters' });
      return;
    }

    try {
      setSelectedLetter(letter);
      setShowReadDialog(true);
      setDecryptedContent(null);
      setPrivateKey('');
      setErrorState({ hasError: false });

      // If letter is unlocked and not read, fetch its content
      if (letter.isUnlocked && !letter.isRead) {
        setOperationStates((prev) => ({ ...prev, fetching: true }));

        const typedContract = contract as unknown as FutureLettersContract;
        const [content, publicKey] = await typedContract.readLetter(BigInt(letter.id));

        setSelectedLetter((prev) =>
          prev
            ? {
                ...prev,
                encryptedContent: content,
                publicKey,
              }
            : null
        );

        setOperationStates((prev) => ({ ...prev, fetching: false }));
      }
    } catch (err: any) {
      console.error('Failed to fetch letter content:', err);
      setErrorState({
        hasError: true,
        message: err.message || 'Failed to fetch letter content',
        code: err.code,
      });
      setOperationStates((prev) => ({ ...prev, fetching: false }));
    }
  };

  const handleDecrypt = async () => {
    if (!selectedLetter?.encryptedContent || !privateKey) {
      setErrorState({
        hasError: true,
        message: 'Both encrypted content and private key are required',
      });
      return;
    }

    // Validate private key format
    if (!validatePrivateKey(privateKey)) {
      setErrorState({
        hasError: true,
        message: 'Invalid private key format. Please check your key.',
      });
      return;
    }

    try {
      setOperationStates((prev) => ({ ...prev, decrypting: true }));
      setErrorState({ hasError: false });

      const content = await decryptLetter(selectedLetter.encryptedContent, privateKey);
      setDecryptedContent(content);
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setErrorState({
        hasError: true,
        message: 'Failed to decrypt letter. Please verify your private key is correct.',
        code: 'DECRYPTION_FAILED',
      });
    } finally {
      setOperationStates((prev) => ({ ...prev, decrypting: false }));
    }
  };

  const handleCopyContent = async () => {
    if (!decryptedContent) {
      setNotifications((prev) => ({
        ...prev,
        copy: { show: true, success: false, message: 'No content to copy' },
      }));
      return;
    }

    try {
      setOperationStates((prev) => ({ ...prev, copying: true }));
      await navigator.clipboard.writeText(decryptedContent);
      setNotifications((prev) => ({
        ...prev,
        copy: { show: true, success: true, message: 'Content copied to clipboard' },
      }));
    } catch (err) {
      console.error('Copy failed:', err);
      setNotifications((prev) => ({
        ...prev,
        copy: { show: true, success: false, message: 'Failed to copy content' },
      }));
    } finally {
      setOperationStates((prev) => ({ ...prev, copying: false }));
    }
  };

  const handleDownloadLetter = () => {
    if (!selectedLetter || !decryptedContent) {
      setNotifications((prev) => ({
        ...prev,
        download: { show: true, success: false, message: 'No content to download' },
      }));
      return;
    }

    try {
      setOperationStates((prev) => ({ ...prev, downloading: true }));

      const letterData = {
        title: selectedLetter.title,
        content: decryptedContent,
        unlockTime: new Date(selectedLetter.unlockTime * 1000).toISOString(),
        createdAt: new Date(selectedLetter.createdAt * 1000).toISOString(),
        mood: selectedLetter.mood,
        isPublic: selectedLetter.isPublic,
      };

      const blob = new Blob([JSON.stringify(letterData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `letter-${selectedLetter.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotifications((prev) => ({
        ...prev,
        download: { show: true, success: true, message: 'Letter downloaded successfully' },
      }));
    } catch (err) {
      console.error('Download failed:', err);
      setNotifications((prev) => ({
        ...prev,
        download: { show: true, success: false, message: 'Failed to download letter' },
      }));
    } finally {
      setOperationStates((prev) => ({ ...prev, downloading: false }));
    }
  };

  const handleCloseDialog = () => {
    setShowReadDialog(false);
    setSelectedLetter(null);
    setDecryptedContent(null);

    // Clear sensitive data
    clearSensitiveData(privateKey);
    clearSensitiveData(decryptedContent);
    setPrivateKey('');
    setErrorState({ hasError: false });
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      happy: '#4CAF50',
      sad: '#2196F3',
      angry: '#F44336',
      excited: '#FF9800',
      nostalgic: '#9C27B0',
      grateful: '#8BC34A',
      anxious: '#FF5722',
      hopeful: '#00BCD4',
    };
    return moodColors[mood] || '#757575';
  };

  const getTimeDisplayText = (letter: Letter) => {
    const unlockDate = new Date(letter.unlockTime * 1000);

    if (letter.isUnlocked) {
      return `Unlocked ${formatDistanceToNow(unlockDate)} ago`;
    } else {
      return `Unlocks in ${formatDistanceToNow(unlockDate)}`;
    }
  };

  if (!isConnected) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', mt: 4 }}>
        <Alert severity="info" icon={<ErrorIcon />}>
          <AlertTitle>Wallet Not Connected</AlertTitle>
          Please connect your wallet to view your letters.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            My Letters ({letters.length})
          </Typography>
          <Tooltip title="Refresh letters">
            <IconButton onClick={fetchLetters} disabled={loadingState.isLoading} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {errorState.hasError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorState({ hasError: false })}>
            <AlertTitle>Error</AlertTitle>
            {errorState.message}
            {errorState.code && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Error Code: {errorState.code}
              </Typography>
            )}
          </Alert>
        )}

        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={`All (${letters.length})`} />
          <Tab label={`Locked (${letters.filter((l) => !l.isUnlocked).length})`} />
          <Tab label={`Unlocked (${letters.filter((l) => l.isUnlocked).length})`} />
          <Tab label={`Public (${letters.filter((l) => l.isPublic).length})`} />
        </Tabs>

        {loadingState.isLoading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
                    <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" width={100} height={36} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredLetters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {selectedTab === 0
                ? "You haven't written any letters yet"
                : 'No letters in this category'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedTab === 0 && 'Start by writing your first letter to your future self'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredLetters.map((letter) => (
              <Grid item xs={12} md={6} lg={4} key={letter.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {letter.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {letter.isUnlocked ? (
                          <LockOpenIcon color="success" fontSize="small" />
                        ) : (
                          <LockIcon color="action" fontSize="small" />
                        )}
                        {letter.isPublic ? (
                          <PublicIcon color="primary" fontSize="small" />
                        ) : (
                          <PrivateIcon color="action" fontSize="small" />
                        )}
                      </Box>
                    </Box>

                    {!letter.isUnlocked && letter.imageUrl && (
                      <Box sx={{ mb: 1, textAlign: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={letter.imageUrl}
                          alt={letter.title}
                          style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }}
                        />
                      </Box>
                    )}

                    <Chip
                      label={letter.mood.charAt(0).toUpperCase() + letter.mood.slice(1)}
                      size="small"
                      sx={{
                        backgroundColor: getMoodColor(letter.mood),
                        color: 'white',
                        mb: 2,
                      }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Created: {new Date(letter.createdAt * 1000).toLocaleDateString()}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {getTimeDisplayText(letter)}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleReadLetter(letter)}
                      disabled={!letter.isUnlocked}
                      variant={letter.isUnlocked ? 'contained' : 'outlined'}
                      fullWidth
                    >
                      {letter.isUnlocked ? 'Read' : 'Locked'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Read Letter Dialog */}
      <Dialog
        open={showReadDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: 400 } }}
      >
        <DialogTitle>
          {selectedLetter?.title}
          {operationStates.fetching && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent>
          {errorState.hasError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorState.message}
            </Alert>
          )}

          {selectedLetter && !selectedLetter.encryptedContent && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This letter needs to be unlocked first by reading it from the blockchain.
            </Alert>
          )}

          {selectedLetter?.encryptedContent && !decryptedContent && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enter your private key to decrypt this letter:
              </Typography>
              <TextField
                fullWidth
                label="Private Key"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                error={Boolean(errorState.hasError && errorState.code === 'DECRYPTION_FAILED')}
                helperText={
                  errorState.hasError && errorState.code === 'DECRYPTION_FAILED'
                    ? errorState.message
                    : 'This is the private key you received when creating the letter'
                }
                sx={{ mb: 2 }}
                autoComplete="off"
              />
              <Button
                variant="contained"
                onClick={handleDecrypt}
                disabled={!privateKey || operationStates.decrypting}
                fullWidth
              >
                {operationStates.decrypting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Decrypting...
                  </>
                ) : (
                  'Decrypt Letter'
                )}
              </Button>
            </Box>
          )}

          {decryptedContent && (
            <>
              <TextField
                multiline
                fullWidth
                minRows={6}
                value={decryptedContent}
                InputProps={{ readOnly: true }}
                sx={{ mt: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Tooltip title="Copy to clipboard">
                  <IconButton onClick={handleCopyContent} size="small">
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download as JSON">
                  <IconButton onClick={handleDownloadLetter} size="small">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              {selectedLetter && (
                <EngagementSection letterId={selectedLetter.id} title={selectedLetter.title} />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={notifications.copy.show}
        autoHideDuration={3000}
        onClose={() =>
          setNotifications((prev) => ({ ...prev, copy: { ...prev.copy, show: false } }))
        }
      >
        <Alert
          severity={notifications.copy.success ? 'success' : 'error'}
          onClose={() =>
            setNotifications((prev) => ({ ...prev, copy: { ...prev.copy, show: false } }))
          }
        >
          {notifications.copy.message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={notifications.download.show}
        autoHideDuration={3000}
        onClose={() =>
          setNotifications((prev) => ({ ...prev, download: { ...prev.download, show: false } }))
        }
      >
        <Alert
          severity={notifications.download.success ? 'success' : 'error'}
          onClose={() =>
            setNotifications((prev) => ({ ...prev, download: { ...prev.download, show: false } }))
          }
        >
          {notifications.download.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyLetters;
