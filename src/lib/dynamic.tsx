import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';

/** `dynamic(() => import(...))` as used under Next: a lazily loaded component with its own fallback. */
export default function dynamic<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  options: { loading?: () => ReactNode; ssr?: boolean } = {}
) {
  const Lazy = lazy(load);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={options.loading?.() ?? null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
