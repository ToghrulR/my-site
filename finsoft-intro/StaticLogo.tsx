import { BRAND, LOGO_PARTS, LOGO_VIEWBOX } from './logoParts';

interface StaticLogoProps {
  /** Plays a lightweight CSS build-up (used when WebGL is unavailable). */
  animated?: boolean;
  /** Opacity-only reveal with no movement (reduced-motion preference). */
  fade?: boolean;
  className?: string;
}

/** The FinSoft logo as crisp SVG, assembled from the supplied artwork. */
export function StaticLogo({ animated = false, fade = false, className }: StaticLogoProps) {
  const { x, y, width, height } = LOGO_VIEWBOX;
  return (
    <svg
      className={`fsi-logo ${animated ? 'fsi-logo--animated' : ''} ${fade ? 'fsi-logo--fade' : ''} ${className ?? ''}`}
      viewBox={`${x} ${y} ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className="fsi-logo__symbol" fill={BRAND.navy} stroke={BRAND.navy} pathLength={1} d={LOGO_PARTS.navySymbol} />
      <path className="fsi-logo__symbol" fill={BRAND.mint} stroke={BRAND.mint} pathLength={1} d={LOGO_PARTS.mintSymbol} />
      <path className="fsi-logo__word" fill={BRAND.navy} fillRule="evenodd" d={LOGO_PARTS.wordmark} />
    </svg>
  );
}
