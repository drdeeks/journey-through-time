import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Web3ReactProvider } from '@web3-react/core';
import { BrowserProvider } from 'ethers';

// Components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { LazyLoadWrapper, LoadingFallback } from './components/LazyLoadWrapper';
import { lazyWithRetry } from './utils/lazyLoad';
import { Web3Provider } from './contexts/Web3Context';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { EngagementProvider } from './contexts/EngagementContext';

// Lazy load pages
const Home = lazyWithRetry(() => import('./pages/Home'));
const WriteLetter = lazyWithRetry(() => import('./pages/WriteLetter'));
const MyLetters = lazyWithRetry(() => import('./pages/MyLetters'));
const PublicLetters = lazyWithRetry(() => import('./pages/PublicLetters'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function getLibrary(provider: any) {
  return new BrowserProvider(provider);
}

function App() {
  return (
    <ErrorBoundary>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3Provider>
          <UserProfileProvider>
            <EngagementProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                  <Layout>
                    <LazyLoadWrapper fallback={<LoadingFallback variant="skeleton" />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/write" element={<WriteLetter />} />
                        <Route path="/my-letters" element={<MyLetters />} />
                        <Route path="/public-letters" element={<PublicLetters />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                      </Routes>
                    </LazyLoadWrapper>
                  </Layout>
                </Router>
              </ThemeProvider>
            </EngagementProvider>
          </UserProfileProvider>
        </Web3Provider>
      </Web3ReactProvider>
    </ErrorBoundary>
  );
}

export default App;
