import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Simple UUID generator to avoid external dependency
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface LikeActivity {
  letterId: number;
  title: string;
  timestamp: number;
}

interface CommentActivity {
  id: string;
  letterId: number;
  title: string;
  comment: string;
  timestamp: number;
}

interface LockActivity {
  letterId: number;
  title: string;
  tokenId: string;
  unlockTime: number;
  createdAt: number;
  timestamp: number;
}

export interface EngagementContextType {
  likes: LikeActivity[];
  comments: CommentActivity[];
  locks: LockActivity[];
  toggleLike: (letterId: number, title: string) => void;
  addComment: (letterId: number, title: string, comment: string) => void;
  addLock: (
    letterId: number,
    title: string,
    tokenId: string,
    unlockTime: number,
    createdAt: number
  ) => void;
}

const STORAGE_KEY = 'jt_engagements_v1';

const EngagementContext = createContext<EngagementContextType>({
  likes: [],
  comments: [],
  locks: [],
  toggleLike: () => {},
  addComment: () => {},
  addLock: () => {},
});

export const useEngagement = () => useContext(EngagementContext);

export const EngagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [likes, setLikes] = useState<LikeActivity[]>([]);
  const [comments, setComments] = useState<CommentActivity[]>([]);
  const [locks, setLocks] = useState<LockActivity[]>([]);

  // Load persisted state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate structure before using
        if (parsed && typeof parsed === 'object') {
          setLikes(Array.isArray(parsed.likes) ? parsed.likes : []);
          setComments(Array.isArray(parsed.comments) ? parsed.comments : []);
          setLocks(Array.isArray(parsed.locks) ? parsed.locks : []);
        }
      }
    } catch (err) {
      console.warn('Failed to parse engagements from storage', err);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persist = (next: { likes: LikeActivity[]; comments: CommentActivity[]; locks: LockActivity[] }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('Failed to persist engagements', err);
      // Notify user if quota exceeded
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please clear some data.');
        // TODO: Show user notification
      }
    }
  };

  const toggleLike = (letterId: number, title: string) => {
    setLikes((prev) => {
      const existing = prev.find((l) => l.letterId === letterId);
      let next: LikeActivity[];
      if (existing) {
        next = prev.filter((l) => l.letterId !== letterId);
      } else {
        next = [...prev, { letterId, title, timestamp: Date.now() }];
      }
      return next;
    });
  };

  const addComment = (letterId: number, title: string, comment: string) => {
    const newComment: CommentActivity = {
      id: generateId(),
      letterId,
      title,
      comment,
      timestamp: Date.now(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  const addLock = (
    letterId: number,
    title: string,
    tokenId: string,
    unlockTime: number,
    createdAt: number
  ) => {
    const newLock: LockActivity = {
      letterId,
      title,
      tokenId,
      unlockTime,
      createdAt,
      timestamp: Date.now(),
    };
    setLocks((prev) => [...prev, newLock]);
  };

  // Persist whenever state changes
  useEffect(() => {
    persist({ likes, comments, locks });
  }, [likes, comments, locks]);

  return (
    <EngagementContext.Provider value={{ likes, comments, locks, toggleLike, addComment, addLock }}>
      {children}
    </EngagementContext.Provider>
  );
}; 