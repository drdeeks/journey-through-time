import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Custom hook for debouncing function calls
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
};

/**
 * Custom hook for throttling function calls
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef(0);
  const lastCallTimerRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        callback(...args);
        lastCallRef.current = now;
      } else {
        if (lastCallTimerRef.current) {
          clearTimeout(lastCallTimerRef.current);
        }
        lastCallTimerRef.current = setTimeout(() => {
          callback(...args);
          lastCallRef.current = Date.now();
        }, delay - (now - lastCallRef.current));
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Custom hook for memoizing expensive calculations with cache
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  dependencies: React.DependencyList,
  cacheKey?: string
): T => {
  const cacheRef = useRef<Map<string, { value: T; deps: React.DependencyList; timestamp: number }>>(new Map());
  const MAX_CACHE_SIZE = 50;
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(dependencies);
    const cached = cacheRef.current.get(key);
    
    if (cached && JSON.stringify(cached.deps) === JSON.stringify(dependencies)) {
      // Update timestamp for LRU
      cached.timestamp = Date.now();
      return cached.value;
    }
    
    const value = factory();
    
    // Implement LRU eviction if cache is full
    if (cacheRef.current.size >= MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      cacheRef.current.forEach((entry, k) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      });
      
      if (oldestKey) {
        cacheRef.current.delete(oldestKey);
      }
    }
    
    cacheRef.current.set(key, { value, deps: [...dependencies], timestamp: Date.now() });
    
    return value;
  }, dependencies);
};

/**
 * Custom hook for intersection observer (lazy loading)
 */
export const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...optionsRef.current,
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback]);

  const observe = useCallback((element: Element | null) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element | null) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);

  return { observe, unobserve };
};

/**
 * Custom hook for measuring component render performance
 */
export const useRenderTimer = (componentName: string) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    renderCountRef.current++;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCountRef.current}: ${duration.toFixed(2)}ms`);
    }

    // Log slow renders
    if (duration > 16) { // 60fps threshold
      console.warn(`${componentName} slow render: ${duration.toFixed(2)}ms`);
    }

    startTimeRef.current = performance.now();
  });
};

/**
 * Utility for creating stable object references
 */
export const createStableObject = <T extends Record<string, any>>(obj: T): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => obj, [JSON.stringify(obj)]);
};

/**
 * Utility for memoizing array operations
 */
export const useMemoizedArray = <T>(
  array: T[],
  keyExtractor: (item: T, index: number) => string | number
): T[] => {
  return useMemo(() => {
    const seen = new Set<string | number>();
    return array.filter((item, index) => {
      const key = keyExtractor(item, index);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [array, keyExtractor]);
};

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const metrics = this.metrics.get(label)!;
    metrics.push(value);
    
    // Limit metrics array size to prevent memory leak
    const MAX_METRICS = 1000;
    if (metrics.length > MAX_METRICS) {
      metrics.shift(); // Remove oldest entry
    }
  }

  getMetrics(label?: string): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    const labels = label ? [label] : Array.from(this.metrics.keys());
    
    labels.forEach(l => {
      const values = this.metrics.get(l);
      if (values && values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        result[l] = { avg, min, max, count: values.length };
      }
    });
    
    return result;
  }

  clearMetrics(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }

  logMetrics(label?: string): void {
    const metrics = this.getMetrics(label);
    console.table(metrics);
  }
}

/**
 * Utility for optimizing list rendering
 */
export const createVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(window.scrollY / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  return {
    items: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalHeight,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Utility for batch processing
 */
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delay: number = 0
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

/**
 * Utility for memory management
 */
export const useMemoryCleanup = (cleanupFn: () => void, dependencies: React.DependencyList = []) => {
  useEffect(() => {
    return () => {
      cleanupFn();
    };
  }, dependencies);
};

/**
 * Utility for preventing memory leaks in async operations
 * NOTE: AbortController is created but asyncFn must handle the signal.
 * This hook provides the abort capability but doesn't automatically cancel operations.
 */
export const useAsyncOperation = <T>(
  asyncFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    mountedRef.current = true;
    abortControllerRef.current = new AbortController();
    
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, dependencies);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      const result = await asyncFn();
      return mountedRef.current ? result : null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      if (!mountedRef.current) {
        return null;
      }
      throw error;
    }
  }, [asyncFn]);

  return { 
    execute, 
    abort: () => abortControllerRef.current?.abort(),
    signal: abortControllerRef.current?.signal
  };
};