import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Container,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AlertTitle,
} from '@mui/material';
import {
  Public as PublicIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import type { Letter } from '../types';
import { VALID_MOODS } from '../types';

const PublicLetters: React.FC = () => {
  const { contract, isConnected } = useWeb3();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  // Mock data for demonstration (until public letter tracking is implemented in the contract)
  const mockPublicLetters: Letter[] = [
    {
      id: 1,
      title: 'To My Future Self in 2030',
      unlockTime: Date.now() / 1000 - 86400, // Already unlocked
      createdAt: Date.now() / 1000 - 86400 * 30, // 30 days ago
      isRead: true,
      isUnlocked: true,
      isPublic: true,
      mood: 'hopeful',
    },
    {
      id: 2,
      title: 'Reflections on a Difficult Year',
      unlockTime: Date.now() / 1000 - 3600, // Recently unlocked
      createdAt: Date.now() / 1000 - 86400 * 365, // 1 year ago
      isRead: true,
      isUnlocked: true,
      isPublic: true,
      mood: 'nostalgic',
    },
    {
      id: 3,
      title: 'Dreams and Aspirations',
      unlockTime: Date.now() / 1000 - 86400 * 7, // Week ago
      createdAt: Date.now() / 1000 - 86400 * 90, // 3 months ago
      isRead: true,
      isUnlocked: true,
      isPublic: true,
      mood: 'excited',
    },
  ];

  const fetchPublicLetters = useCallback(async () => {
    if (!contract || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement actual contract call when public letter tracking is available
      // For now, using mock data
      setTimeout(() => {
        setLetters(mockPublicLetters);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to fetch public letters:', err);
      setError(err.message || 'Failed to fetch public letters');
      setLoading(false);
    }
  }, [contract, isConnected]);

  useEffect(() => {
    fetchPublicLetters();
  }, [fetchPublicLetters]);

  const filteredLetters = letters.filter((letter) => {
    const matchesSearch = letter.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = selectedMood === 'all' || letter.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

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

  if (!isConnected) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Alert severity="info">
            <AlertTitle>Wallet Not Connected</AlertTitle>
            Please connect your wallet to explore public letters from the community.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PublicIcon sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            Public Letters
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover letters that community members have chosen to share publicly after unlocking.
          These personal time capsules offer glimpses into hopes, dreams, and reflections from the
          past.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Filter Controls */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search letters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Mood</InputLabel>
                <Select
                  value={selectedMood}
                  label="Filter by Mood"
                  onChange={(e) => setSelectedMood(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Moods</MenuItem>
                  {VALID_MOODS.map((mood) => (
                    <MenuItem key={mood} value={mood}>
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchPublicLetters}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredLetters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm || selectedMood !== 'all'
                ? 'No letters match your search criteria'
                : 'No public letters available yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || selectedMood !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Be the first to share a public letter with the community!'}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Found {filteredLetters.length} public letter{filteredLetters.length !== 1 ? 's' : ''}
            </Typography>

            <Grid container spacing={3}>
              {filteredLetters.map((letter) => (
                <Grid item xs={12} md={6} lg={4} key={letter.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            flex: 1,
                            mr: 1,
                          }}
                        >
                          {letter.title}
                        </Typography>
                        <PublicIcon color="primary" fontSize="small" />
                      </Box>

                      <Chip
                        label={letter.mood.charAt(0).toUpperCase() + letter.mood.slice(1)}
                        size="small"
                        sx={{
                          backgroundColor: getMoodColor(letter.mood),
                          color: 'white',
                          mb: 2,
                        }}
                      />

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Anonymous Author
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Written {formatDistanceToNow(new Date(letter.createdAt * 1000))} ago
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        Unlocked {formatDistanceToNow(new Date(letter.unlockTime * 1000))} ago
                      </Typography>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        disabled
                        sx={{ opacity: 0.6 }}
                      >
                        Read Letter (Coming Soon)
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Feature Notice */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <AlertTitle>Coming Soon</AlertTitle>
          The ability to read full public letter content is currently being developed. This feature
          will allow you to explore the thoughts and experiences shared by other time travelers.
        </Alert>
      </Paper>
    </Container>
  );
};

export default PublicLetters;
