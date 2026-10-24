import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Loader, type LoaderHandle } from './Loader';
import { StaticLogo } from './StaticLogo';
import type { LogoAssemblyHandle } from './createLogoAssembly';
import { useReducedMotion } from './useReducedMotion';
import './finsoft-intro.css';

type Mode = 'loading' | 'webgl' | 'css' | 'static';

/** Total intro length in ms (the 3D timeline in createLogoAssembly.ts matches). */
const INTRO_MS = 3000;

/** `?webgl=0` forces the non-WebGL fallback (QA). */
const webglDisabledByQuery = () => new URLSearchParams(window.location.search).get('webgl') === '0';

/** `?t=2.4` freezes the WebGL animation at that moment (QA). */
const freezeAtFromQuery = () => {
  const t = new URLSearchParams(window.location.search).get('t');
  return t !== null && !Number.isNaN(Number(t)) ? Number(t) : undefined;
};

function runTimer(onProgress: (p: number) => void): () => void {
  let raf = 0;
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / INTRO_MS);
    onProgress(p);
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export interface FinSoftIntroProps {
  /** Called once when the intro reaches 100%. Use it to reveal your app. */
  onComplete?: () => void;
  /** Fill the parent (position: absolute) instead of the whole viewport. */
  inline?: boolean;
  /** Status lines under the logo; the last one is shown at 100%. */
  steps?: string[];
  className?: string;
}

export function FinSoftIntro({ onComplete, inline = false, steps, className }: FinSoftIntroProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<LoaderHandle>(null);
  const handleRef = useRef<LogoAssemblyHandle | null>(null);
  const complete = useEffectEvent(() => onComplete?.());
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<Mode>(reducedMotion ? 'static' : 'loading');
  const [loaderVisible, setLoaderVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stopTimer: (() => void) | undefined;
    let completed = false;
    const setProgress = (p: number) => {
      loaderRef.current?.setProgress(p);
      if (p >= 1 && !completed) {
        completed = true;
        complete();
      }
    };
    const showTimer = window.setTimeout(() => {
      setLoaderVisible(true);
      if (reducedMotion) setMode('static');
    }, reducedMotion ? 0 : 150);

    if (reducedMotion) {
      stopTimer = runTimer(setProgress);
      return () => {
        window.clearTimeout(showTimer);
        stopTimer?.();
      };
    }

    const host = hostRef.current;
    const fallBack = () => {
      if (cancelled) return;
      setMode('css');
      stopTimer?.();
      stopTimer = runTimer(setProgress);
    };

    (async () => {
      // Loaded lazily so the page is interactive before any 3D code arrives.
      const { detectQuality, isWebGLAvailable } = await import('./quality');
      if (cancelled || !host) return;
      if (webglDisabledByQuery() || !isWebGLAvailable()) return fallBack();
      try {
        const { createLogoAssembly } = await import('./createLogoAssembly');
        if (cancelled) return;
        handleRef.current = createLogoAssembly(host, {
          quality: detectQuality(),
          onReady: () => !cancelled && setMode('webgl'),
          onProgress: setProgress,
          onContextLost: fallBack,
          freezeAt: freezeAtFromQuery(),
        });
      } catch (error) {
        console.warn('[FinSoft] WebGL unavailable, using SVG animation.', error);
        fallBack();
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      stopTimer?.();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <div
      className={`fsi ${inline ? 'fsi--inline' : ''} ${className ?? ''}`}
      data-mode={mode}
      data-motion={reducedMotion ? 'reduce' : 'full'}
    >
      <div className="fsi__visual" role="img" aria-label="FinSoft logo">
        <div ref={hostRef} className="fsi__canvas" />
        {(mode === 'css' || mode === 'static') && (
          <StaticLogo animated={mode === 'css'} fade={mode === 'static'} className="fsi__svg" />
        )}
      </div>
      <Loader ref={loaderRef} visible={loaderVisible} steps={steps} />
    </div>
  );
}
