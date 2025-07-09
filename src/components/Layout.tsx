import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountBalanceWallet as WalletIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Mail as MailIcon,
  Public as PublicIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import type { LayoutProps } from '../types';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { account, mainDomain, connect, disconnect, isConnecting, error, isConnected, chainId } =
    useWeb3();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showError, setShowError] = useState(false);

  const menuItems = [
    { text: 'Home', path: '/', icon: <HomeIcon /> },
    { text: 'Write Letter', path: '/write', icon: <EditIcon /> },
    { text: 'My Letters', path: '/my-letters', icon: <MailIcon /> },
    { text: 'Public Letters', path: '/public-letters', icon: <PublicIcon /> },
    { text: 'Profile', path: '/profile', icon: <AccountCircleIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleNavigation = useCallback(
    (path: string) => {
      navigate(path);
      if (isMobile) {
        setDrawerOpen(false);
      }
    },
    [navigate, isMobile]
  );

  const handleWalletAction = useCallback(async () => {
    try {
      if (isConnected) {
        disconnect();
      } else {
        await connect();
      }
    } catch (err) {
      console.error('Wallet action failed:', err);
      setShowError(true);
    }
  }, [isConnected, connect, disconnect]);

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1337:
        return 'Local';
      case 10143:
        return 'Monad Testnet';
      case 1:
        return 'Ethereum';
      default:
        return 'Unknown';
    }
  };

  const getWalletButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (!account) return 'Connect Wallet';
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  };

  const getWalletButtonColor = () => {
    if (error) return 'error';
    if (isConnected) return 'success';
    return 'inherit';
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }} role="navigation" aria-label="Main navigation">
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'inherit' : undefined,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open navigation menu"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Journey Through Time
          </Typography>

          {/* Network indicator */}
          {isConnected && chainId && (
            <Chip
              label={getNetworkName(chainId)}
              size="small"
              variant="outlined"
              sx={{
                color: 'inherit',
                borderColor: 'rgba(255,255,255,0.3)',
                mr: 2,
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  startIcon={item.icon}
                  sx={{
                    borderBottom: location.pathname === item.path ? 2 : 0,
                    borderColor: 'secondary.main',
                    borderRadius: 0,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* Wallet Connection Button */}
          <Tooltip
            title={
              error
                ? `Connection Error: ${error}`
                : isConnected
                  ? 'Click to disconnect wallet'
                  : 'Click to connect wallet'
            }
          >
            <Button
              color={getWalletButtonColor()}
              variant={isConnected ? 'contained' : 'outlined'}
              startIcon={
                isConnecting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : error ? (
                  <WarningIcon />
                ) : (
                  <WalletIcon />
                )
              }
              onClick={handleWalletAction}
              disabled={isConnecting}
              sx={{
                ml: 1,
                minWidth: { xs: 'auto', sm: 140 },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              }}
              aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {mainDomain ??
                  (account
                    ? account.slice(0, 6) + '...' + account.slice(-4)
                    : getWalletButtonText())}
              </Box>
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                {isConnecting ? '' : isConnected ? '✓' : 'Connect'}
              </Box>
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="h2">
            Navigation
          </Typography>
          <IconButton onClick={toggleDrawer} aria-label="close navigation menu">
            <CloseIcon />
          </IconButton>
        </Box>
        {drawer}

        {/* Mobile wallet info */}
        {isConnected && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Connected Account:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {account}
            </Typography>
            {chainId && <Chip label={getNetworkName(chainId)} size="small" sx={{ mt: 1 }} />}
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          px: { xs: 2, sm: 3 },
        }}
        maxWidth="xl"
      >
        {/* Connection Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Reload
              </Button>
            }
          >
            Wallet connection error: {error}
          </Alert>
        )}

        {children}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: 3,
          px: 2,
          mt: 'auto',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Journey Through Time dApp
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Built with ❤️ for time travelers
              </Typography>
              {isConnected && (
                <Typography variant="body2" color="text.secondary">
                  Network: {getNetworkName(chainId)}
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" variant="filled">
          Wallet operation failed. Please try again.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout;
