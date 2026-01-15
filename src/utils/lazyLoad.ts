import { lazy, ComponentType, LazyExoticComponent } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
}

export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> => {
  const { maxRetries = 3, delay = 1000 } = options;

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let retries = 0;

      const attemptImport = () => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            retries++;
            if (retries < maxRetries) {
              setTimeout(attemptImport, delay * retries);
            } else {
              console.error(`Failed to load component after ${maxRetries} retries:`, error);
              reject(error);
            }
          });
      };

      attemptImport();
    });
  });
};

export const preloadComponent = (importFunc: () => Promise<any>): void => {
  importFunc();
};
