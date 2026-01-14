import React, { Suspense, lazy } from 'react';

interface LoadingFallbackProps {
  className?: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded-lg h-32 mb-4"></div>
    <div className="bg-gray-200 rounded h-4 mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-3/4"></div>
  </div>
);

/**
 * Higher-order component for lazy loading components
 * @param importFn - Function that imports the component
 * @param fallback - Optional custom loading component
 */
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  const FallbackComponent = fallback || LoadingFallback;

  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad<T extends HTMLElement>(
  threshold: number = 0.1
) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [ref, setRef] = React.useState<T | null>(null);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, isVisible };
}
