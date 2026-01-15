import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
}

export const usePerformanceMonitoring = (pageName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        try {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            metricsRef.current.fcp = fcpEntry.startTime;
            reportMetric('FCP', fcpEntry.startTime, pageName);
          }
        } catch (error) {
          console.error('FCP observer error:', error);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observers.push(fcpObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        try {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metricsRef.current.lcp = lastEntry.startTime;
          reportMetric('LCP', lastEntry.startTime, pageName);
        } catch (error) {
          console.error('LCP observer error:', error);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        try {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metricsRef.current.fid = entry.processingStart - entry.startTime;
            reportMetric('FID', entry.processingStart - entry.startTime, pageName);
          });
        } catch (error) {
          console.error('FID observer error:', error);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        try {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              metricsRef.current.cls = clsValue;
            }
          });
          reportMetric('CLS', clsValue, pageName);
        } catch (error) {
          console.error('CLS observer error:', error);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // Time to First Byte
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        metricsRef.current.ttfb = navEntry.responseStart - navEntry.requestStart;
        reportMetric('TTFB', metricsRef.current.ttfb, pageName);
      }
    } catch (error) {
      console.error('Performance monitoring setup error:', error);
    }

    return () => {
      observers.forEach((observer) => {
        try {
          observer.disconnect();
        } catch (error) {
          console.error('Observer disconnect error:', error);
        }
      });
    };
  }, [pageName]);

  return metricsRef.current;
};

const reportMetric = (name: string, value: number, pageName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${pageName} - ${name}: ${value.toFixed(2)}ms`);
  }

  // TODO: Send to analytics service
  // Example: analytics.track('performance_metric', { name, value, pageName });
};

export const measureComponentRender = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // TODO: Send to analytics service
  };
};
