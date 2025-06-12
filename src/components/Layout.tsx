import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Mail as MailIcon,
  Public as PublicIcon,
  Settings as SettingsIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { account, connect, disconnect, isConnecting } = useWeb3();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Write Letter', icon: <EditIcon />, path: '/write' },
    { text: 'My Letters', icon: <MailIcon />, path: '/my-letters' },
    { text: 'Public Letters', icon: <PublicIcon />, path: '/public-letters' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Future Letters
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderBottom: location.pathname === item.path ? 2 : 0,
                    borderColor: 'secondary.main',
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          <Button
            color="inherit"
            startIcon={<WalletIcon />}
            onClick={account ? disconnect : connect}
            disabled={isConnecting}
            sx={{ ml: 2 }}
          >
            {account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : 'Connect Wallet'}
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        {drawer}
      </Drawer>

      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Future Letters dApp
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 