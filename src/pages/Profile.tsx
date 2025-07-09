import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Upload as UploadIcon } from '@mui/icons-material';
import MyLetters from './MyLetters';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useEngagement } from '../contexts/EngagementContext';
import {
  Favorite,
  ChatBubbleOutline,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';

const Profile: React.FC = () => {
  const { username, profilePicUrl, updateUsername, updateProfilePic } = useUserProfile();
  const { likes, comments, locks } = useEngagement();
  const { account } = useWeb3();

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [tempPic, setTempPic] = useState<File | null>(null);

  const handleSave = () => {
    updateUsername(tempName.trim() || (account ?? ''));
    if (tempPic) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateProfilePic(e.target?.result as string);
      };
      reader.readAsDataURL(tempPic);
    }
    setEditOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Profile header */}
      <Grid container alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Avatar
            alt={username}
            sx={{ width: 96, height: 96 }}
            {...(profilePicUrl ? { src: profilePicUrl } : {})}
          >
            {username?.charAt(0).toUpperCase()}
          </Avatar>
        </Grid>
        <Grid item xs>
          <Typography variant="h5">{username}</Typography>
          {account && (
            <Typography variant="caption" color="text.secondary">
              {account}
            </Typography>
          )}
        </Grid>
        <Grid item>
          <IconButton onClick={() => setEditOpen(true)} color="primary">
            <EditIcon />
          </IconButton>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Letters" />
        <Tab label="Activity" />
      </Tabs>

      {tab === 0 && <MyLetters />} {/* Reuse existing component */}
      {tab === 1 && (
        <Box>
          {likes.length === 0 && comments.length === 0 && locks.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              No activity yet.
            </Typography>
          )}

          {likes.map((l) => (
            <Box key={`like-${l.letterId}`} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite color="error" sx={{ mr: 1 }} />
              <Typography variant="body2">
                You liked "{l.title}" ({new Date(l.timestamp).toLocaleDateString()})
              </Typography>
            </Box>
          ))}

          {comments.map((c) => (
            <Box key={`comment-${c.id}`} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ChatBubbleOutline sx={{ mr: 1 }} />
              <Typography variant="body2">
                You commented on "{c.title}": "{c.comment}" ({
                  new Date(c.timestamp).toLocaleDateString()
                })
              </Typography>
            </Box>
          ))}

          {locks.map((lk) => (
            <Box key={`lock-${lk.tokenId}`} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <LockIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                You locked "{lk.title}" (Unlocks {new Date(lk.unlockTime * 1000).toLocaleDateString()})
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Username"
            fullWidth
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />
          <Button component="label" startIcon={<UploadIcon />} sx={{ mt: 2 }}>
            Upload Profile Picture
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setTempPic(e.target.files[0]);
                }
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 