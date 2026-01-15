import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useAsync = <T extends (...args: any[]) => Promise<any>>(
  asyncFunction: T,
  options: UseAsyncOptions = {}
) => {
  const { onSuccess, onError } = options;
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      try {
        const result = await asyncFunction(...args);
        if (isMountedRef.current && onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (error) {
        if (isMountedRef.current && onError) {
          onError(error as Error);
        }
        throw error;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  return execute;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());
  const lastResult = useRef<ReturnType<T>>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        lastResult.current = callback(...args);
      }
      return lastResult.current;
    },
    [callback, delay]
  ) as T;
};

