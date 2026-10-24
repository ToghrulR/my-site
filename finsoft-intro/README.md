# FinSoft intro (React + Three.js)

3-second logo intro: outlines trace → fill → particles from the F form "FinSoft" → loader with live percentage.

## Install
Copy this whole folder into your project (e.g. `src/finsoft-intro/`) and add the dependency:

```bash
npm i three
npm i -D @types/three
```

Requires React 18+, TypeScript, and any bundler that supports dynamic `import()` (Vite, Next.js, webpack, CRA).
No images, fonts or SVG imports are needed — the logo geometry is embedded in `logoParts.ts`.

## Use
```tsx
import { useState } from 'react';
import { FinSoftIntro } from './finsoft-intro';

export function Root() {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <FinSoftIntro onComplete={() => setReady(true)} />}
      {ready && <App />}
    </>
  );
}
```

Props: `onComplete` (fires at 100%), `inline` (fill the parent instead of the viewport),
`steps` (status lines), `className`.

To keep the finished logo on screen for a moment, delay `setReady`:
`onComplete={() => setTimeout(() => setReady(true), 400)}`.

## Next.js
Render it from a client component: put `'use client';` at the top of `FinSoftIntro.tsx`
(or wrap it in your own client component). It uses `window`, so do not render it on the server.

## Settings
- `useReducedMotion.ts` → `RESPECT_OS_REDUCED_MOTION` (default `false`: full animation always plays;
  `true`: users with "Reduce motion" get a quiet fade instead).
- `createLogoAssembly.ts` → `INTRO_DURATION` and the `T` timeline object (timings in seconds).
  Keep `INTRO_MS` in `FinSoftIntro.tsx` equal to `INTRO_DURATION * 1000`.
- `finsoft-intro.css` → `--fsi-bg` (background gradient), `--fsi-navy`, `--fsi-mint`.
- `Loader.tsx` → `DEFAULT_STEPS` (status lines). `setProgress()` also accepts real load progress.

## Behaviour
- Falls back to a CSS/SVG animation if WebGL is unavailable or the context is lost.
- Pixel ratio is capped by device tier; rendering stops after the intro.
- QA query params: `?t=2.4` (freeze at a moment), `?webgl=0` (fallback), `?motion=reduce`.
