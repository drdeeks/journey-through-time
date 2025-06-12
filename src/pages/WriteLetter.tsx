import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, addYears, isAfter, isBefore } from 'date-fns';
import { useWeb3 } from '../contexts/Web3Context';
import { generateKeyPair, encryptLetter } from '../utils/encryption';

const steps = ['Write Letter', 'Set Unlock Time', 'Choose Visibility', 'Review & Submit'];

const validMoods = [
  'happy',
  'sad',
  'angry',
  'lost',
  'confused',
  'worried',
  'melancholy',
  'depressed',
  'joyful',
  'irate',
  'excited',
  'anxious',
  'grateful',
  'hopeful',
  'nostalgic',
];

const WriteLetter: React.FC = () => {
  const navigate = useNavigate();
  const { contract, account } = useWeb3();
  const [activeStep, setActiveStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockTime, setUnlockTime] = useState<Date | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [mood, setMood] = useState('');
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);

  const validateStep = useCallback(() => {
    switch (activeStep) {
      case 0:
        return title.trim().length > 0 && content.trim().length > 0;
      case 1:
        return unlockTime !== null && 
               isAfter(unlockTime, addDays(new Date(), 3)) && 
               isBefore(unlockTime, addYears(new Date(), 50));
      case 2:
        return mood !== '';
      default:
        return true;
    }
  }, [activeStep, title, content, unlockTime, mood]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setShowConfirmDialog(true);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!contract || !account || !unlockTime) return;

    try {
      setLoading(true);
      setError(null);

      // Generate encryption keys
      const { publicKey, privateKey: newPrivateKey } = await generateKeyPair();
      
      // Encrypt content
      const { encryptedContent } = await encryptLetter(content, publicKey);

      // Convert content to bytes for contract
      const contentBytes = ethers.utils.toUtf8Bytes(encryptedContent);

      // Submit to contract
      const tx = await contract.writeLetter(
        contentBytes,
        Math.floor(unlockTime.getTime() / 1000),
        publicKey,
        isPublic,
        title,
        mood
      );

      await tx.wait();

      // Show private key dialog
      setPrivateKey(newPrivateKey);
      setShowPrivateKeyDialog(true);
      setShowConfirmDialog(false);

    } catch (err: any) {
      setError(err.message || 'Failed to submit letter');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateKeyAcknowledged = () => {
    setShowPrivateKeyDialog(false);
    navigate('/my-letters');
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Letter Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Letter Content"
              multiline
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              helperText="Remember: Once submitted, this letter cannot be modified or deleted"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Unlock Time"
                value={unlockTime}
                onChange={(newValue) => setUnlockTime(newValue)}
                minDateTime={addDays(new Date(), 3)}
                maxDateTime={addYears(new Date(), 50)}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The letter will be locked until this time. You cannot access it before then.
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Mood</InputLabel>
              <Select
                value={mood}
                label="Mood"
                onChange={(e) => setMood(e.target.value)}
                required
              >
                {validMoods.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label="Make letter public after unlocking"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {isPublic
                ? 'This letter will be visible to everyone after it unlocks'
                : 'This letter will remain private and only accessible to you'}
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Letter
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Title</Typography>
                <Typography variant="body1">{title}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Unlock Time</Typography>
                <Typography variant="body1">
                  {unlockTime?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Mood</Typography>
                <Typography variant="body1">
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Visibility</Typography>
                <Typography variant="body1">
                  {isPublic ? 'Public' : 'Private'}
                </Typography>
              </Grid>
            </Grid>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please review carefully. Once submitted, this letter cannot be modified or deleted.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Write a Letter to Your Future Self
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!validateStep() || loading}
          >
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Letter Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this letter? Once submitted:
            <ul>
              <li>The letter cannot be modified or deleted</li>
              <li>You cannot access it before the unlock time</li>
              <li>You will receive a private key to decrypt it later</li>
              <li>
                The letter will be {isPublic ? 'publicly visible' : 'private'} after unlocking
              </li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {loading ? <CircularProgress size={24} /> : 'Submit Letter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Private Key Dialog */}
      <Dialog open={showPrivateKeyDialog} onClose={() => {}}>
        <DialogTitle>IMPORTANT: Save Your Private Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is your private key. You will need it to decrypt your letter when it unlocks.
            <strong> Save it somewhere safe - it cannot be recovered if lost!</strong>
          </DialogContentText>
          <TextField
            fullWidth
            value={privateKey || ''}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handlePrivateKeyAcknowledged}
            variant="contained"
            color="primary"
          >
            I have saved my private key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WriteLetter; 