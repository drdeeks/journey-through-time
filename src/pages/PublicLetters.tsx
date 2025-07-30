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
  CircularProgress,
  Alert,
  Skeleton,
  Pagination,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { formatDistanceToNow } from 'date-fns';
import { Letter, FutureLettersContract, LoadingState, ErrorState } from '../types';

interface PublicLetter {
  author: string;
  letterId: number;
  title: string;
  mood: string;
  createdAt: number;
  unlockedAt: number;
}

const ITEMS_PER_PAGE = 12;

const PublicLetters: React.FC = () => {
  const { contract, account, isConnected } = useWeb3();
  const [publicLetters, setPublicLetters] = useState<PublicLetter[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: true });
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLetters, setTotalLetters] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [notifications, setNotifications] = useState({
    show: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Memoized filtered letters for performance
  const filteredLetters = useMemo(() => {
    let filtered = publicLetters;

    // Filter by search term (title or author)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (letter) =>
          letter.title.toLowerCase().includes(term) ||
          letter.author.toLowerCase().includes(term)
      );
    }

    // Filter by mood
    if (selectedMood) {
      filtered = filtered.filter((letter) => letter.mood === selectedMood);
    }

    return filtered;
  }, [publicLetters, searchTerm, selectedMood]);

  const fetchPublicLetters = useCallback(async () => {
    if (!contract || !isConnected) {
      setLoadingState({ isLoading: false });
      return;
    }

    try {
      setLoadingState({ isLoading: true, message: 'Fetching public letters...' });
      setErrorState({ hasError: false });

      const typedContract = contract as unknown as FutureLettersContract;
      
      // Get total count first
      const totalCount = await typedContract.getPublicLetterCount();
      setTotalLetters(Number(totalCount));
      setTotalPages(Math.ceil(Number(totalCount) / ITEMS_PER_PAGE));

      // Calculate offset for current page
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      // Fetch public letters with pagination
      const [
        authors,
        letterIds,
        titles,
        moods,
        createdAts,
        unlockedAts,
      ] = await typedContract.getPublicLetters(offset, ITEMS_PER_PAGE);

      const letters: PublicLetter[] = [];
      for (let i = 0; i < authors.length; i++) {
        letters.push({
          author: authors[i],
          letterId: Number(letterIds[i]),
          title: titles[i],
          mood: moods[i],
          createdAt: Number(createdAts[i]),
          unlockedAt: Number(unlockedAts[i]),
        });
      }

      setPublicLetters(letters);
      setLoadingState({ isLoading: false });
    } catch (error) {
      console.error('Failed to fetch public letters:', error);
      setErrorState({
        hasError: true,
        message: 'Failed to fetch public letters. Please try again.',
      });
      setLoadingState({ isLoading: false });
    }
  }, [contract, isConnected, currentPage]);

  useEffect(() => {
    fetchPublicLetters();
  }, [fetchPublicLetters]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleMoodFilter = (mood: string) => {
    setSelectedMood(selectedMood === mood ? '' : mood);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMood('');
  };

  const handleRefresh = () => {
    fetchPublicLetters();
    setNotifications({
      show: true,
      message: 'Public letters refreshed successfully!',
      severity: 'success',
    });
  };

  const handleCloseNotification = () => {
    setNotifications({ ...notifications, show: false });
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      happy: '#4caf50',
      sad: '#2196f3',
      angry: '#f44336',
      excited: '#ff9800',
      nostalgic: '#9c27b0',
      grateful: '#4caf50',
      anxious: '#ff9800',
      hopeful: '#4caf50',
      lost: '#607d8b',
      confused: '#9e9e9e',
      worried: '#ff9800',
      melancholy: '#607d8b',
      depressed: '#3f51b5',
      joyful: '#4caf50',
      irate: '#f44336',
    };
    return moodColors[mood] || '#757575';
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      excited: '🤩',
      nostalgic: '🥺',
      grateful: '🙏',
      anxious: '😰',
      hopeful: '✨',
      lost: '😵',
      confused: '🤔',
      worried: '😟',
      melancholy: '😔',
      depressed: '😞',
      joyful: '😄',
      irate: '😤',
    };
    return moodEmojis[mood] || '📝';
  };

  const renderLetterCard = (letter: PublicLetter) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={`${letter.author}-${letter.letterId}`}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PublicIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3" noWrap>
              {letter.title}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {letter.author.slice(0, 6)}...{letter.author.slice(-4)}
            </Typography>
          </Box>

          <Chip
            label={`${getMoodEmoji(letter.mood)} ${letter.mood}`}
            size="small"
            sx={{
              backgroundColor: getMoodColor(letter.mood),
              color: 'white',
              fontWeight: 'bold',
              mb: 2,
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Unlocked {formatDistanceToNow(letter.unlockedAt * 1000, { addSuffix: true })}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Created {formatDistanceToNow(letter.createdAt * 1000, { addSuffix: true })}
          </Typography>
        </CardContent>

        <CardActions sx={{ pt: 0 }}>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={() => {
              // TODO: Implement letter reading functionality
              setNotifications({
                show: true,
                message: 'Letter reading feature coming soon!',
                severity: 'info',
              });
            }}
          >
            Read Letter
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );

  const renderSkeletonCards = () => (
    <>
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Skeleton variant="text" width="80%" height={32} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="rectangular" width="40%" height={32} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={20} />
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </>
  );

  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please connect your wallet to view public letters.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Public Letters
        </Typography>
        <Tooltip title="Refresh public letters">
          <IconButton onClick={handleRefresh} disabled={loadingState.isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['happy', 'sad', 'excited', 'nostalgic', 'grateful', 'hopeful'].map((mood) => (
                <Chip
                  key={mood}
                  label={getMoodEmoji(mood)}
                  size="small"
                  clickable
                  color={selectedMood === mood ? 'primary' : 'default'}
                  onClick={() => handleMoodFilter(mood)}
                  sx={{
                    backgroundColor: selectedMood === mood ? getMoodColor(mood) : 'transparent',
                    color: selectedMood === mood ? 'white' : 'inherit',
                  }}
                />
              ))}
              {(searchTerm || selectedMood) && (
                <Chip
                  label="Clear"
                  size="small"
                  clickable
                  onClick={handleClearFilters}
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {loadingState.isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {loadingState.message}
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {errorState.hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorState.message}
        </Alert>
      )}

      {/* Results Summary */}
      {!loadingState.isLoading && !errorState.hasError && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredLetters.length} of {totalLetters} public letters
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedMood && ` with mood "${selectedMood}"`}
          </Typography>
        </Box>
      )}

      {/* Letters Grid */}
      {!loadingState.isLoading && !errorState.hasError && (
        <>
          {filteredLetters.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No public letters found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || selectedMood
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to share a public letter!'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredLetters.map(renderLetterCard)}
            </Grid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Loading Skeletons */}
      {loadingState.isLoading && (
        <Grid container spacing={3}>
          {renderSkeletonCards()}
        </Grid>
      )}

      {/* Notifications */}
      <Snackbar
        open={notifications.show}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notifications.severity}
          sx={{ width: '100%' }}
        >
          {notifications.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PublicLetters;
