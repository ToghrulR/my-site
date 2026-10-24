export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  /** Upper bound for devicePixelRatio. */
  maxPixelRatio: number;
  /** MSAA samples for the composer target. */
  samples: number;
  bloom: boolean;
  curveSegments: number;
  bevelSegments: number;
}

const SETTINGS: Record<QualityTier, Omit<QualitySettings, 'tier'>> = {
  low: { maxPixelRatio: 1, samples: 0, bloom: false, curveSegments: 10, bevelSegments: 3 },
  medium: { maxPixelRatio: 1.5, samples: 2, bloom: true, curveSegments: 18, bevelSegments: 5 },
  high: { maxPixelRatio: 2, samples: 4, bloom: true, curveSegments: 28, bevelSegments: 7 },
};

/** Heuristic device-capability tier. Errs on the side of a smooth frame rate. */
export function detectQuality(): QualitySettings {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const saveData = nav.connection?.saveData === true;

  let tier: QualityTier = 'high';
  if (saveData || memory <= 2 || cores <= 2) tier = 'low';
  else if (coarse || memory <= 4 || cores <= 4) tier = 'medium';

  return { tier, ...SETTINGS[tier] };
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const ok = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}
