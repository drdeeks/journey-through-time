import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Web3ReactProvider } from '@web3-react/core';
import { BrowserProvider } from 'ethers';

// Components
import Layout from './components/Layout';
import Home from './pages/Home';
import WriteLetter from './pages/WriteLetter';
import MyLetters from './pages/MyLetters';
import PublicLetters from './pages/PublicLetters';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { Web3Provider } from './contexts/Web3Context';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { EngagementProvider } from './contexts/EngagementContext';

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
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
  },
});

function getLibrary(provider: any) {
  return new BrowserProvider(provider);
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3Provider>
        <UserProfileProvider>
          <EngagementProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/write" element={<WriteLetter />} />
                    <Route path="/my-letters" element={<MyLetters />} />
                    <Route path="/public-letters" element={<PublicLetters />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                </Layout>
              </Router>
            </ThemeProvider>
          </EngagementProvider>
        </UserProfileProvider>
      </Web3Provider>
    </Web3ReactProvider>
  );
}

export default App;
