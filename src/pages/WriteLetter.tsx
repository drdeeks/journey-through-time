import React, { useState, useCallback } from 'react';
import { Buffer } from 'buffer';
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
import { toUtf8Bytes } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { generateKeyPair, encryptLetter } from '../utils/encryption';
import {
  VALID_MOODS,
  type ValidMood,
  type FutureLettersContract,
  type LetterFormData,
  type LetterValidationErrors,
} from '../types';
import { useEngagement } from '../contexts/EngagementContext';

const steps = ['Write Letter', 'Set Unlock Time', 'Choose Visibility', 'Review & Submit'];

const WriteLetter: React.FC = () => {
  const navigate = useNavigate();
  const { contract, account, isConnected } = useWeb3();
  const { addLock } = useEngagement();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    unlockTime: undefined as bigint | undefined,
    isPublic: false,
    mood: 'happy' as ValidMood,
  });
  const [errors, setErrors] = useState<LetterValidationErrors>({});
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);
  const [mintedCapsule, setMintedCapsule] = useState<{
    tokenId: bigint;
    createdAt: number;
    unlockTime: number;
  } | null>(null);

  const validateStep = useCallback(() => {
    const newErrors: LetterValidationErrors = {};

    switch (activeStep) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.content.trim()) newErrors.content = 'Content is required';
        break;
      case 1:
        if (!formData.unlockTime) {
          newErrors.unlockTime = 'Unlock time is required';
        } else if (
          formData.unlockTime &&
          !isAfter(new Date(Number(formData.unlockTime) * 1000), addDays(new Date(), 3))
        ) {
          newErrors.unlockTime = 'Unlock time must be at least 3 days in the future';
        } else if (
          formData.unlockTime &&
          !isBefore(new Date(Number(formData.unlockTime) * 1000), addYears(new Date(), 50))
        ) {
          newErrors.unlockTime = 'Unlock time cannot exceed 50 years';
        }
        break;
      case 2:
        if (!formData.mood) newErrors.mood = 'Mood is required';
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [activeStep, formData]);

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        setShowConfirmDialog(true);
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!contract || !account || !formData.unlockTime || !isConnected) {
      setError('Please connect your wallet to submit a letter');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate encryption keys
      const { publicKey, privateKey: newPrivateKey } = await generateKeyPair();

      // Encrypt content
      const { encryptedContent } = await encryptLetter(formData.content, publicKey);

      // Convert content to bytes for contract (ethers v6 syntax)
      const contentBytes = toUtf8Bytes(encryptedContent);

      // Submit to contract
      const typedContract = contract as unknown as FutureLettersContract;
      const tx = await typedContract.writeLetter(
        contentBytes,
        formData.unlockTime!,
        publicKey,
        formData.isPublic,
        formData.title,
        formData.mood
      );

      const receipt = await tx.wait();

      if (!receipt) throw new Error('Transaction failed or was not mined');

      let mintedId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = (typedContract as any).interface.parseLog(log);
          if (parsed?.name === 'LetterCreated') {
            mintedId = parsed.args[1] as bigint; // letterId is second indexed arg
            break;
          }
        } catch {}
      }

      if (mintedId !== null) {
        try {
          // tokenURI is inherited from ERC721URIStorage
          const tokenUri: string = await (typedContract as any).tokenURI(mintedId);
          const base64 = tokenUri.split(',')[1];
          if (!base64) throw new Error('Invalid token URI');

          const jsonStr =
            typeof window !== 'undefined' && (window as any).atob
              ? (window as any).atob(base64)
              : Buffer.from(base64, 'base64').toString('utf-8');
          const meta = JSON.parse(jsonStr);
          const createdAttr = meta.attributes.find((a: any) => a.trait_type === 'Created At');
          const unlockAttr = meta.attributes.find((a: any) => a.trait_type === 'Unlock Time');
          setMintedCapsule({
            tokenId: mintedId,
            createdAt: createdAttr?.value || Date.now() / 1000,
            unlockTime: unlockAttr?.value || Number(formData.unlockTime),
          });
          // record lock activity
          addLock(
            Number(mintedId),
            formData.title,
            mintedId.toString(),
            Number(formData.unlockTime),
            Date.now() / 1000
          );
        } catch (e) {
          console.warn('Failed to fetch/parse token URI', e);
        }
      }

      // Show private key dialog
      setPrivateKey(newPrivateKey);
      setShowPrivateKeyDialog(true);
      setShowConfirmDialog(false);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateKeyAcknowledged = () => {
    setShowPrivateKeyDialog(false);
    // Clear sensitive data
    setPrivateKey(null);
    navigate('/my-letters');
  };

  const handleInputChange =
    (field: keyof LetterFormData) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } }
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear field error when user starts typing
      if (errors[field as keyof LetterValidationErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Letter Title"
              value={formData.title}
              onChange={handleInputChange('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
              required
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              fullWidth
              label="Letter Content"
              multiline
              rows={8}
              value={formData.content}
              onChange={handleInputChange('content')}
              error={Boolean(errors.content)}
              helperText={
                errors.content ||
                'Remember: Once submitted, this letter cannot be modified or deleted'
              }
              required
              inputProps={{ maxLength: 5000 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Unlock Time"
                value={formData.unlockTime ? new Date(Number(formData.unlockTime) * 1000) : null}
                onChange={(newValue) => {
                  const bigintValue = newValue
                    ? BigInt(Math.floor(newValue.getTime() / 1000))
                    : undefined;
                  setFormData((prev) => ({ ...prev, unlockTime: bigintValue }));
                  if (errors.unlockTime) {
                    setErrors((prev) => ({ ...prev, unlockTime: '' }));
                  }
                }}
                minDateTime={addDays(new Date(), 3)}
                maxDateTime={addYears(new Date(), 50)}
                sx={{ width: '100%' }}
                slotProps={{
                  textField: {
                    error: Boolean(errors.unlockTime),
                    helperText: errors.unlockTime,
                  },
                }}
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
            <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(errors.mood)}>
              <InputLabel>Mood</InputLabel>
              <Select
                value={formData.mood}
                label="Mood"
                onChange={handleInputChange('mood')}
                required
              >
                {VALID_MOODS.map((mood) => (
                  <MenuItem key={mood} value={mood}>
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              {errors.mood && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.mood}
                </Typography>
              )}
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="Make letter public after unlocking"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {formData.isPublic
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
                <Typography variant="subtitle1" fontWeight="bold">
                  Title
                </Typography>
                <Typography variant="body1">{formData.title}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Unlock Time
                </Typography>
                <Typography variant="body1">{formData.unlockTime?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Mood
                </Typography>
                <Typography variant="body1">
                  {formData.mood.charAt(0).toUpperCase() + formData.mood.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Visibility
                </Typography>
                <Typography variant="body1">{formData.isPublic ? 'Public' : 'Private'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Content Preview
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    maxHeight: 100,
                    overflow: 'auto',
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  {formData.content.substring(0, 200)}
                  {formData.content.length > 200 && '...'}
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

  if (!isConnected) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', mt: 4 }}>
        <Alert severity="info">
          Please connect your wallet to write a letter to your future self.
        </Alert>
      </Box>
    );
  }

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
          <Button disabled={activeStep === 0 || loading} onClick={handleBack} variant="outlined">
            Back
          </Button>
          <Button variant="contained" onClick={handleNext} disabled={loading}>
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Letter Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please review the information below. Once you confirm, the transaction will be sent
            to the blockchain and <strong>cannot be undone</strong>.
            <ul>
              <li>The letter cannot be modified or deleted.</li>
              <li>You cannot access it before the unlock time.</li>
              <li>You will receive a private key to decrypt it later – <strong>store it safely!</strong></li>
              <li>Regardless of the privacy setting, the following details are <em>always</em>
              visible on-chain:
                <ul>
                  <li>Title: "{formData.title}"</li>
                  <li>Mood: {formData.mood}</li>
                  <li>Unlock Time: {formData.unlockTime ? new Date(Number(formData.unlockTime)*1000).toLocaleString() : ''}</li>
                </ul>
              </li>
              <li>
                The <strong>content of the letter</strong> is {formData.isPublic ? 'publicly readable after unlock' : 'only readable by you after unlock'}.
              </li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Submit Letter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Private Key Dialog */}
      <Dialog
        open={showPrivateKeyDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{ sx: { minWidth: 400 } }}
      >
        <DialogTitle>IMPORTANT: Save Your Private Key</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This is your private key. You will need it to decrypt your letter when it unlocks.
            <strong> Save it somewhere safe - it cannot be recovered if lost!</strong>
          </DialogContentText>
          {mintedCapsule && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Capsule NFT Minted!
              </Typography>
              <Typography variant="body2">Token ID: {mintedCapsule.tokenId.toString()}</Typography>
              <Typography variant="body2">
                Created At: {new Date(mintedCapsule.createdAt * 1000).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Unlock Time: {new Date(mintedCapsule.unlockTime * 1000).toLocaleString()}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            value={privateKey || ''}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mt: 2 }}
            multiline
            rows={3}
            variant="outlined"
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Copy this key to a secure location before continuing!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handlePrivateKeyAcknowledged}
            variant="contained"
            color="primary"
            fullWidth
          >
            I have saved my private key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WriteLetter;
