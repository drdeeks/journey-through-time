import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
  Edit as EditIcon,
  Mail as MailIcon,
  Explore as ExploreIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isConnected } = useWeb3();

  const features = [
    {
      icon: <ScheduleIcon color="primary" fontSize="large" />,
      title: 'Time-Locked Letters',
      description: 'Write letters that can only be opened after a specified date in the future.',
    },
    {
      icon: <SecurityIcon color="primary" fontSize="large" />,
      title: 'End-to-End Encryption',
      description: 'Your letters are encrypted client-side before being stored on the blockchain.',
    },
    {
      icon: <PublicIcon color="primary" fontSize="large" />,
      title: 'Public & Private Options',
      description: 'Choose whether your letters become public or remain private after unlocking.',
    },
  ];

  const steps = [
    {
      icon: <EditIcon />,
      title: 'Write Your Letter',
      description: 'Compose a message to your future self with title, content, and mood.',
    },
    {
      icon: <LockIcon />,
      title: 'Set Unlock Time',
      description: 'Choose when your letter should be unlocked (3 days to 50 years).',
    },
    {
      icon: <KeyIcon />,
      title: 'Secure Encryption',
      description: 'Your letter is encrypted and a private key is generated for decryption.',
    },
    {
      icon: <TimelineIcon />,
      title: 'Wait & Discover',
      description: 'When the time comes, use your private key to unlock and read your letter.',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          Journey Through Time
        </Typography>

        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Write encrypted letters to your future self, secured by blockchain technology and unlocked
          only when the time is right.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isConnected ? (
            <>
              <Button
                variant="contained"
                size="large"
                startIcon={<EditIcon />}
                onClick={() => navigate('/write')}
                sx={{ px: 4, py: 1.5 }}
              >
                Write Your First Letter
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<MailIcon />}
                onClick={() => navigate('/my-letters')}
                sx={{ px: 4, py: 1.5 }}
              >
                View My Letters
              </Button>
            </>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Connect your wallet to start your time travel journey
              </Typography>
              <Chip
                label="Web3 Wallet Required"
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Features
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          How It Works
        </Typography>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {step.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {index + 1}. {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Technology Section */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Built on Modern Technology
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Blockchain Security
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Immutable Storage"
                    secondary="Letters are stored permanently on the blockchain"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Time-Lock Contracts"
                    secondary="Smart contracts enforce unlock times automatically"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <KeyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cryptographic Keys"
                    secondary="Only you can decrypt your letters with your private key"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom color="primary">
                User Experience
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EditIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Intuitive Interface"
                    secondary="Easy-to-use interface for writing and managing letters"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ExploreIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Public Discovery"
                    secondary="Explore public letters from other time travelers"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimelineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Time Management"
                    secondary="Track your letters and upcoming unlock dates"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Call to Action */}
      {isConnected && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 6,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Ready to Start Your Journey?
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
            >
              Write your first letter to yourself and discover what you'll think when you read it in
              the future.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<EditIcon />}
              onClick={() => navigate('/write')}
              sx={{ px: 6, py: 2 }}
            >
              Write Your First Letter
            </Button>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Home;
