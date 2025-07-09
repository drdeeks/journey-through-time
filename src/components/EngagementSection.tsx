import React, { useState } from 'react';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { Favorite, FavoriteBorder, Send } from '@mui/icons-material';
import { useEngagement } from '../contexts/EngagementContext';
import { useUserProfile } from '../contexts/UserProfileContext';

interface Props {
  letterId: number;
  title: string;
}

const EngagementSection: React.FC<Props> = ({ letterId, title }) => {
  const { likes, comments, toggleLike, addComment } = useEngagement();
  const { username } = useUserProfile();
  const liked = likes.some((l) => l.letterId === letterId);
  const [commentInput, setCommentInput] = useState('');

  const letterComments = comments.filter((c) => c.letterId === letterId);

  return (
    <Box sx={{ mt: 3 }}>
      {/* Like button */}
      <IconButton onClick={() => toggleLike(letterId, title)} aria-label="Like letter">
        {liked ? <Favorite color="error" /> : <FavoriteBorder />}
      </IconButton>
      <Typography variant="caption" sx={{ ml: 1 }}>
        {liked ? 'You liked this' : 'Like'}
      </Typography>

      {/* Comments */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Comments
        </Typography>
        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
          {letterComments.length === 0 && (
            <ListItem>
              <ListItemText primary="No comments yet. Be the first!" />
            </ListItem>
          )}
          {letterComments.map((c) => (
            <ListItem key={c.id} alignItems="flex-start">
              <ListItemText
                primary={c.comment}
                secondary={`${username} • ${new Date(c.timestamp).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />
          <Button
            variant="contained"
            endIcon={<Send />}
            disabled={!commentInput.trim()}
            onClick={() => {
              addComment(letterId, title, commentInput.trim());
              setCommentInput('');
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EngagementSection; 