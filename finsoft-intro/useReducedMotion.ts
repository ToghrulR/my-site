import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * When `true`, the OS "Reduce motion" setting switches the intro to a quiet,
 * opacity-only reveal. Off by default so the brand intro always plays in full;
 * set to `true` if your accessibility policy requires honouring the setting.
 */
export const RESPECT_OS_REDUCED_MOTION = false;

/** `?motion=reduce` forces the reduced-motion experience (QA). */
function forced(): boolean {
  return new URLSearchParams(window.location.search).get('motion') === 'reduce';
}

const initial = () => forced() || (RESPECT_OS_REDUCED_MOTION && window.matchMedia(QUERY).matches);

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(initial);

  useEffect(() => {
    if (forced() || !RESPECT_OS_REDUCED_MOTION) return;
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
