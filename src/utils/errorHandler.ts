export enum ErrorCategory {
  NETWORK = 'NETWORK',
  CONTRACT = 'CONTRACT',
  VALIDATION = 'VALIDATION',
  ENCRYPTION = 'ENCRYPTION',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  category: ErrorCategory;
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private readonly MAX_LOG_SIZE = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('contract') || message.includes('transaction') || message.includes('revert')) {
      return ErrorCategory.CONTRACT;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('encrypt') || message.includes('decrypt') || message.includes('key')) {
      return ErrorCategory.ENCRYPTION;
    }
    if (message.includes('storage') || message.includes('localstorage')) {
      return ErrorCategory.STORAGE;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  handleError(error: Error, context?: Record<string, unknown>): AppError {
    const appError: AppError = {
      category: this.categorizeError(error),
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      timestamp: Date.now(),
      ...(context ? { context } : {}),
    };

    this.logError(appError);
    
    if (process.env['NODE_ENV'] === 'production') {
      this.reportToService(appError);
    }

    return appError;
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.shift();
    }

    console.error(`[${error.category}] ${error.message}`, error.context);
  }

  private reportToService(_error: AppError): void {
    // Placeholder for external error reporting service
    // TODO: Integrate with Sentry, LogRocket, or similar
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  getUserFriendlyMessage(error: AppError): string {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet and try again.';
      case ErrorCategory.CONTRACT:
        return 'Blockchain transaction failed. Please try again or check your wallet.';
      case ErrorCategory.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ErrorCategory.ENCRYPTION:
        return 'Encryption error. Please verify your keys and try again.';
      case ErrorCategory.STORAGE:
        return 'Storage error. Please check your browser settings.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = errorHandler.handleError(error as Error, context);
      throw appError;
    }
  }) as T;
};
