import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  Container,
  AlertTitle,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import type { FutureLettersContract, UserProfile } from '../types';

const Settings: React.FC = () => {
  const { contract, account, isConnected, chainId, disconnect } = useWeb3();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: false,
    reminderDays: 7,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fetchUserProfile = useCallback(async () => {
    if (!contract || !account || !isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const typedContract = contract as unknown as FutureLettersContract;
      const [totalLetters, _unreadLetters, lastLetterTime, reminderEnabled, reminderDays] =
        await typedContract.getUserStats();

      const profile: UserProfile = {
        letterCount: Number(totalLetters),
        lastLetterTime: Number(lastLetterTime),
        reminderEnabled: Boolean(reminderEnabled),
        preferredReminderDays: Number(reminderDays),
      };

      setUserProfile(profile);
      setReminderSettings({
        enabled: profile.reminderEnabled,
        reminderDays: profile.preferredReminderDays,
      });
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError(err.message || 'Failed to load user settings');
    } finally {
      setLoading(false);
    }
  }, [contract, account, isConnected]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSaveReminderSettings = async () => {
    if (!contract || !isConnected) return;

    try {
      setSaving(true);
      setError(null);

      const typedContract = contract as unknown as FutureLettersContract;
      const tx = await typedContract.updateReminderSettings(
        reminderSettings.enabled,
        BigInt(reminderSettings.reminderDays)
      );

      await tx.wait();

      setNotification({
        show: true,
        message: 'Reminder settings saved successfully!',
        severity: 'success',
      });

      // Refresh profile
      await fetchUserProfile();
    } catch (err: any) {
      console.error('Failed to save reminder settings:', err);
      setError(err.message || 'Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!userProfile || !account) return;

    try {
      const exportData = {
        account,
        profile: userProfile,
        exportDate: new Date().toISOString(),
        reminder: reminderSettings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `journey-through-time-settings-${account.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({
        show: true,
        message: 'Settings exported successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export settings data');
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setShowDisconnectDialog(false);
    setNotification({
      show: true,
      message: 'Wallet disconnected successfully',
      severity: 'success',
    });
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1337:
        return 'Local Network';
      case 10143:
        return 'Monad Testnet';
      case 1:
        return 'Ethereum Mainnet';
      default:
        return 'Unknown Network';
    }
  };

  if (!isConnected) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Alert severity="info">
            <AlertTitle>Wallet Not Connected</AlertTitle>
            Please connect your wallet to access settings and manage your account.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            Settings
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences and application settings.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Account Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <WalletIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Account Information</Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Wallet Address"
                    secondary={account}
                    secondaryTypographyProps={{
                      sx: { fontFamily: 'monospace', wordBreak: 'break-all' },
                    }}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Network"
                    secondary={
                      <Chip
                        label={getNetworkName(chainId)}
                        size="small"
                        color={chainId === 1337 ? 'default' : 'primary'}
                      />
                    }
                  />
                </ListItem>

                {userProfile && (
                  <>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Letters"
                        secondary={`${userProfile.letterCount} letters written`}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Last Letter"
                        secondary={
                          userProfile.lastLetterTime > 0
                            ? new Date(userProfile.lastLetterTime * 1000).toLocaleDateString()
                            : 'No letters yet'
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowDisconnectDialog(true)}
              fullWidth
            >
              Disconnect Wallet
            </Button>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotificationsIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Notification Settings</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={reminderSettings.enabled}
                    onChange={(e) =>
                      setReminderSettings((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    disabled={loading}
                  />
                }
                label="Enable Letter Unlock Reminders"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Get notified when your letters are about to unlock
              </Typography>
            </Box>

            {reminderSettings.enabled && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Reminder Days"
                  type="number"
                  value={reminderSettings.reminderDays}
                  onChange={(e) =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      reminderDays: Math.max(1, Math.min(30, parseInt(e.target.value) || 7)),
                    }))
                  }
                  inputProps={{ min: 1, max: 30 }}
                  helperText="Days before unlock to send reminder (1-30)"
                  fullWidth
                  disabled={loading}
                />
              </Box>
            )}

            <Button
              variant="contained"
              onClick={handleSaveReminderSettings}
              disabled={saving || loading}
              fullWidth
              startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
            >
              {saving ? 'Saving...' : 'Save Reminder Settings'}
            </Button>
          </Paper>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <BackupIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">Data Management</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Export Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download your account settings and preferences as a JSON file.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportData}
                      disabled={!userProfile}
                      fullWidth
                    >
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Backup Your Keys
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Remember to securely backup your private keys for letter decryption.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Private keys cannot be recovered if lost!
                      </Typography>
                    </Alert>
                    <Button variant="outlined" startIcon={<SecurityIcon />} disabled fullWidth>
                      Key Backup (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Security Notice */}
        <Grid item xs={12}>
          <Alert severity="info">
            <AlertTitle>Security Best Practices</AlertTitle>
            <Typography variant="body2">
              • Never share your private keys with anyone
              <br />
              • Keep your wallet software updated
              <br />
              • Use hardware wallets for maximum security
              <br />• Backup your keys in multiple secure locations
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onClose={() => setShowDisconnectDialog(false)}>
        <DialogTitle>Disconnect Wallet</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography>
              Are you sure you want to disconnect your wallet? You'll need to reconnect to access
              your letters.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
          <Button onClick={handleDisconnectWallet} color="error" variant="contained">
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={notification.show}
        autoHideDuration={4000}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
