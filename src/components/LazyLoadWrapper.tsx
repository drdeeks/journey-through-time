import { Suspense, ComponentType, ReactNode, Component, ErrorInfo } from 'react';
import { Box, CircularProgress, Skeleton, Stack, Button, Typography, Alert } from '@mui/material';

interface LoadingFallbackProps {
  variant?: 'spinner' | 'skeleton';
  height?: number | string;
}

export const LoadingFallback = ({ variant = 'spinner', height = 400 }: LoadingFallbackProps) => {
  if (variant === 'skeleton') {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={height} />
          <Skeleton variant="rectangular" height={40} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: height,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

interface LazyLoadWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<{ children: ReactNode }, LazyErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Failed to load component
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {this.state.error?.message || 'An error occurred while loading this page'}
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const LazyLoadWrapper = ({ children, fallback }: LazyLoadWrapperProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={fallback || <LoadingFallback />}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const withLazyLoad = <P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <LazyLoadWrapper fallback={fallback}>
      <Component {...props} />
    </LazyLoadWrapper>
  );
};
