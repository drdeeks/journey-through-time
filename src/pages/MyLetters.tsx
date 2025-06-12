import React, { useState, useEffect, useCallback } from 'react';
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
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Public as PublicIcon,
  Private as PrivateIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { decryptLetter } from '../utils/encryption';
import { formatDistanceToNow } from 'date-fns';
import { Letter, TabChangeEvent, InputChangeEvent, ContractWithMethods } from '../types';

const MyLetters: React.FC = () => {
  const { contract, account } = useWeb3();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showReadDialog, setShowReadDialog] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const fetchLetters = useCallback(async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);

      const typedContract = contract as ContractWithMethods;
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

      const lettersData: Letter[] = letterIds.map((id: number, index: number) => ({
        id: Number(id),
        title: titles[index],
        unlockTime: Number(unlockTimes[index]),
        createdAt: Number(createdAts[index]),
        isRead: isReadArray[index],
        isUnlocked: isUnlockedArray[index],
        isPublic: isPublicArray[index],
        mood: moods[index],
      }));

      setLetters(lettersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch letters');
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleTabChange = (_: TabChangeEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleReadLetter = async (letter: Letter) => {
    if (!contract || !account) return;

    try {
      setSelectedLetter(letter);
      setShowReadDialog(true);
      setDecryptedContent(null);
      setPrivateKey('');

      // If letter is unlocked, fetch its content
      if (letter.isUnlocked && !letter.isRead) {
        const typedContract = contract as ContractWithMethods;
        const [content, publicKey] = await typedContract.readLetter(letter.id);
        setSelectedLetter((prev: Letter | null) => prev ? { ...prev, encryptedContent: content, publicKey } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch letter content');
    }
  };

  const handleDecrypt = async () => {
    if (!selectedLetter?.encryptedContent || !privateKey) return;

    try {
      setDecrypting(true);
      const content = await decryptLetter(selectedLetter.encryptedContent, privateKey);
      setDecryptedContent(content);
    } catch (err: any) {
      setError('Failed to decrypt letter. Please check your private key.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleDownloadLetter = () => {
    if (!decryptedContent || !selectedLetter) return;

    const letterData = {
      title: selectedLetter.title,
      content: decryptedContent,
      createdAt: new Date(selectedLetter.createdAt * 1000).toISOString(),
      unlockedAt: new Date(selectedLetter.unlockTime * 1000).toISOString(),
      mood: selectedLetter.mood,
    };

    const blob = new Blob([JSON.stringify(letterData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letter-${selectedLetter.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrivateKeyChange = (e: InputChangeEvent) => {
    setPrivateKey(e.target.value);
  };

  const filteredLetters = letters.filter((letter: Letter) => {
    switch (selectedTab) {
      case 0: // All
        return true;
      case 1: // Locked
        return !letter.isUnlocked;
      case 2: // Unlocked
        return letter.isUnlocked;
      case 3: // Public
        return letter.isPublic;
      default:
        return true;
    }
  });

  const renderLetterCard = (letter: Letter) => (
    <Grid item xs={12} sm={6} md={4} key={letter.id}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word' }}>
              {letter.title}
            </Typography>
            <Box>
              {letter.isPublic && (
                <Tooltip title="Public Letter">
                  <PublicIcon color="primary" sx={{ ml: 1 }} />
                </Tooltip>
              )}
              {!letter.isPublic && (
                <Tooltip title="Private Letter">
                  <PrivateIcon color="action" sx={{ ml: 1 }} />
                </Tooltip>
              )}
            </Box>
          </Box>
          
          <Chip
            label={letter.mood}
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Created: {formatDistanceToNow(letter.createdAt * 1000, { addSuffix: true })}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {letter.isUnlocked
              ? `Unlocked ${formatDistanceToNow(letter.unlockTime * 1000, { addSuffix: true })}`
              : `Unlocks ${formatDistanceToNow(letter.unlockTime * 1000, { addSuffix: true })}`}
          </Typography>
        </CardContent>
        
        <CardActions>
          <Button
            size="small"
            onClick={() => handleReadLetter(letter)}
            disabled={!letter.isUnlocked}
            startIcon={letter.isUnlocked ? <LockOpenIcon /> : <LockIcon />}
          >
            {letter.isUnlocked ? (letter.isRead ? 'Read Again' : 'Read') : 'Locked'}
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Letters
        </Typography>
        
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="All" />
          <Tab label="Locked" />
          <Tab label="Unlocked" />
          <Tab label="Public" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredLetters.length > 0 ? (
              filteredLetters.map(renderLetterCard)
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" align="center">
                  No letters found in this category
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* Read Letter Dialog */}
      <Dialog
        open={showReadDialog}
        onClose={() => setShowReadDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedLetter?.title}
          {selectedLetter?.isPublic && (
            <Tooltip title="Public Letter">
              <PublicIcon color="primary" sx={{ ml: 1, verticalAlign: 'middle' }} />
            </Tooltip>
          )}
        </DialogTitle>
        
        <DialogContent>
          {!decryptedContent ? (
            <>
              <DialogContentText gutterBottom>
                Enter your private key to decrypt the letter:
              </DialogContentText>
              <TextField
                fullWidth
                label="Private Key"
                value={privateKey}
                onChange={handlePrivateKeyChange}
                type="password"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleDecrypt}
                disabled={!privateKey || decrypting}
                fullWidth
              >
                {decrypting ? <CircularProgress size={24} /> : 'Decrypt Letter'}
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created: {new Date(selectedLetter!.createdAt * 1000).toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Unlocked: {new Date(selectedLetter!.unlockTime * 1000).toLocaleString()}
                </Typography>
                <Chip
                  label={selectedLetter!.mood}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2, whiteSpace: 'pre-wrap' }}>
                {decryptedContent}
              </Paper>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="Copy Content">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(decryptedContent);
                    }}
                  >
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Letter">
                  <IconButton onClick={handleDownloadLetter}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowReadDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyLetters; 