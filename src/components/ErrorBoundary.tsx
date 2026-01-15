import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Stack,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { errorHandler, ErrorCategory } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCategory: ErrorCategory | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Use centralized error handler
    const appError = errorHandler.handleError(error, {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    this.setState({
      error,
      errorInfo,
      errorCategory: appError.category,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getUserFriendlyMessage(): string {
    if (this.state.errorCategory) {
      return errorHandler.getUserFriendlyMessage({
        category: this.state.errorCategory,
        message: this.state.error?.message || '',
        timestamp: Date.now(),
      });
    }
    return 'An unexpected error occurred. Please try again.';
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md">
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Stack spacing={3} alignItems="center">
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
                
                <Typography variant="h4" component="h1" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                  {this.getUserFriendlyMessage()}
                </Typography>

                {this.state.errorCategory && (
                  <Alert severity="warning" sx={{ width: '100%', maxWidth: 600 }}>
                    <AlertTitle>Error Type: {this.state.errorCategory}</AlertTitle>
                    Your data is safe. You can try refreshing the page or go back to the home page.
                  </Alert>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
                    <AlertTitle>Error Details (Development)</AlertTitle>
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                    </Typography>
                  </Alert>
                )}

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRetry}
                    size="large"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    size="large"
                  >
                    Go Home
                  </Button>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  If this problem persists, please contact support with error ID: {Date.now()}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;