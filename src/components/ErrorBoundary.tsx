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

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error logging service (e.g., Sentry, LogRocket)
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

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
                  We encountered an unexpected error. Don't worry, your data is safe. 
                  You can try refreshing the page or go back to the home page.
                </Typography>

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