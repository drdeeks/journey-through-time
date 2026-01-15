import { render, screen, waitFor } from '@testing-library/react';
import { errorHandler, ErrorCategory, withErrorHandling } from './errorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
  });

  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = new Error('Network request failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize contract errors', () => {
      const error = new Error('Transaction reverted');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.CONTRACT);
    });

    it('should categorize validation errors', () => {
      const error = new Error('Invalid input provided');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize encryption errors', () => {
      const error = new Error('Decryption failed');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.ENCRYPTION);
    });

    it('should categorize storage errors', () => {
      const error = new Error('LocalStorage quota exceeded');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.STORAGE);
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Something unexpected happened');
      const category = errorHandler.categorizeError(error);
      expect(category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('handleError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      const appError = errorHandler.handleError(error, context);
      
      expect(appError.message).toBe('Test error');
      expect(appError.context).toEqual(context);
      expect(appError.timestamp).toBeDefined();
      expect(appError.stack).toBeDefined();
    });

    it('should not store circular references', () => {
      const error = new Error('Test error');
      const appError = errorHandler.handleError(error);
      
      // Should be serializable
      expect(() => JSON.stringify(appError)).not.toThrow();
    });

    it('should maintain error log', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorHandler.handleError(error1);
      errorHandler.handleError(error2);
      
      const log = errorHandler.getErrorLog();
      expect(log).toHaveLength(2);
    });

    it('should limit error log size', () => {
      for (let i = 0; i < 150; i++) {
        errorHandler.handleError(new Error(`Error ${i}`));
      }
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for network errors', () => {
      const appError = {
        category: ErrorCategory.NETWORK,
        message: 'Network failed',
        timestamp: Date.now(),
      };
      
      const message = errorHandler.getUserFriendlyMessage(appError);
      expect(message).toContain('Network connection');
    });

    it('should return user-friendly message for contract errors', () => {
      const appError = {
        category: ErrorCategory.CONTRACT,
        message: 'Transaction failed',
        timestamp: Date.now(),
      };
      
      const message = errorHandler.getUserFriendlyMessage(appError);
      expect(message).toContain('Blockchain transaction');
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap async function with error handling', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFn = withErrorHandling(mockFn);
      
      await expect(wrappedFn()).rejects.toHaveProperty('category');
    });

    it('should pass through successful results', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = withErrorHandling(mockFn);
      
      const result = await wrappedFn();
      expect(result).toBe('success');
    });
  });
});
