import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { BRAND, LOGO_PARTS, LOGO_VIEWBOX } from './logoParts';
import type { QualitySettings } from './quality';

export interface LogoAssemblyOptions {
  quality: QualitySettings;
  onReady?: () => void;
  /** Intro progress, 0 → 1, reported every frame. */
  onProgress?: (progress: number) => void;
  /** Fired once when the intro has finished. */
  onComplete?: () => void;
  onContextLost?: () => void;
  /** Renders a single frame at this time (seconds) instead of playing. QA aid. */
  freezeAt?: number;
}

export interface LogoAssemblyHandle {
  replay: () => void;
  dispose: () => void;
}

/* Timeline (seconds) — the whole intro takes exactly INTRO_DURATION. ----- */
export const INTRO_DURATION = 3;
const T = {
  traceStart: 0.08,
  traceEnd: 0.9,
  fillDuration: 0.36, // the inside fills the moment the outlines close
  wordStart: 1.08, // first particles leave the symbol
  particleSpread: 0.55, // left-to-right launch window across the wordmark
  particleJitter: 0.12,
  particleFlight: 0.72,
  letterDelay: 0.42, // after its particles launch, a letter starts to materialise
  letterDuration: 0.42,
  sweepStart: 2.4,
  sweepDuration: 0.6,
};

const FOV = 22;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progress = (t: number, start: number, duration: number) => clamp01((t - start) / duration);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Flat logo material: exact brand colour, with an optional diagonal fill
   wipe (symbol), a noise dissolve (letters) and a shared gloss sweep. ---- */
const CAP_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const CAP_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uEdge;
  uniform float uReveal;     // wipe line in world px (y + 0.5x)
  uniform float uDissolve;   // 0 = invisible, 1 = solid
  uniform float uCell;       // dissolve grain in world px
  uniform float uSweep;
  uniform float uSweepWidth;
  uniform float uSweepStrength;
  varying vec3 vWorldPos;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec3 col = uColor;

    float d = vWorldPos.y + vWorldPos.x * 0.5;
    if (d > uReveal) discard;
    col = mix(col, uEdge, (1.0 - smoothstep(0.0, 7.0, uReveal - d)) * 0.65);

    // Dissolve: grainy noise threshold with a bright mint rim at the frontier.
    float n = noise(vWorldPos.xy / uCell) * 0.7 + hash(floor(vWorldPos.xy / (uCell * 0.35))) * 0.3;
    float threshold = uDissolve * 1.12 - 0.06;
    if (n > threshold) discard;
    col = mix(col, uEdge, smoothstep(threshold - 0.09, threshold, n) * step(uDissolve, 0.999));

    float band = exp(-pow((vWorldPos.x + vWorldPos.y * 0.45 - uSweep) / uSweepWidth, 2.0));
    col = mix(col, vec3(1.0), band * uSweepStrength);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* Particles that stream out of the symbol and gather into the letters. -- */
const PARTICLE_VERT = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aControl;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uTime;
  uniform float uFlight;
  uniform float uSize;
  uniform float uScale;
  varying float vT;
  varying float vSeed;

  void main() {
    float t = clamp((uTime - aDelay) / uFlight, 0.0, 1.0);
    // Ease-in-out flight along a quadratic Bezier arc.
    float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
    vec3 p = mix(mix(aStart, aControl, e), mix(aControl, position, e), e);
    vT = t;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * mix(0.7, 1.35, aSeed) * (1.0 - 0.55 * smoothstep(0.75, 1.0, t));
    gl_PointSize = size * uScale * step(0.0001, t);
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  uniform vec3 uMint;
  uniform vec3 uNavy;
  uniform float uFade;
  varying float vT;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.15, r);
    // Mint in flight, settling to navy on arrival.
    vec3 col = mix(uMint, uNavy, smoothstep(0.55, 1.0, vT));
    alpha *= smoothstep(0.0, 0.08, vT) * uFade;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

/* Geometry helpers -------------------------------------------------------- */

/** Drops repeated points — the source paths contain zero-length curve
    segments that otherwise break triangulation. */
function dedupe(points: THREE.Vector2[]): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  for (const p of points) if (!out.length || out[out.length - 1].distanceToSquared(p) > 0.01) out.push(p);
  if (out.length > 2 && out[0].distanceToSquared(out[out.length - 1]) <= 0.01) out.pop();
  return out;
}

function shapesFrom(d: string, divisions = 12): THREE.Shape[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${d}"/></svg>`;
  return new SVGLoader()
    .parse(svg)
    .paths.flatMap((p) => SVGLoader.createShapes(p))
    .map((shape) => {
      const { shape: outer, holes } = shape.extractPoints(divisions);
      const clean = new THREE.Shape(dedupe(outer));
      clean.holes = holes.map((h) => new THREE.Path(dedupe(h)));
      return clean;
    });
}

/** SVG space (y-down) → centred, y-up logo space. */
const CX = LOGO_VIEWBOX.x + LOGO_VIEWBOX.width / 2;
const CY = LOGO_VIEWBOX.y + LOGO_VIEWBOX.height / 2;
const toLogo = (x: number, y: number) => new THREE.Vector3(x - CX, -(y - CY), 0);

/** Flat geometry on the logo plane, facing the camera. A 1-unit extrusion
    flipped in y and z keeps a valid winding (the flip is a rotation). */
function flatGeometry(shapes: THREE.Shape[]) {
  const g = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false });
  g.translate(-CX, -CY, 0);
  g.scale(1, -1, -1);
  return g;
}

function outlinePoints(shapes: THREE.Shape[], divisions: number): number[] {
  const pts: number[] = [];
  for (const s of shapes) for (const p of s.getSpacedPoints(divisions)) pts.push(p.x - CX, -(p.y - CY), 1);
  return pts;
}

/** Area-weighted random points inside the given shapes (logo space). */
function samplePoints(shapes: THREE.Shape[], count: number): THREE.Vector3[] {
  const g = new THREE.ShapeGeometry(shapes).toNonIndexed();
  const pos = g.getAttribute('position');
  const tris: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; area: number }[] = [];
  let total = 0;
  for (let i = 0; i < pos.count; i += 3) {
    const a = toLogo(pos.getX(i), pos.getY(i));
    const b = toLogo(pos.getX(i + 1), pos.getY(i + 1));
    const c = toLogo(pos.getX(i + 2), pos.getY(i + 2));
    const area = new THREE.Triangle(a, b, c).getArea();
    if (area <= 0) continue;
    total += area;
    tris.push({ a, b, c, area: total });
  }
  g.dispose();
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * total;
    let lo = 0;
    let hi = tris.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tris[mid].area < r) lo = mid + 1;
      else hi = mid;
    }
    const { a, b, c } = tris[lo];
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    out.push(a.clone().addScaledVector(b.clone().sub(a), u).addScaledVector(c.clone().sub(a), v));
  }
  return out;
}

/* Scene ------------------------------------------------------------------- */

export function createLogoAssembly(host: HTMLElement, options: LogoAssemblyOptions): LogoAssemblyHandle {
  const { quality } = options;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: false });
  renderer.setClearColor('#ffffff', 0); // transparent: the page gradient shows through
  renderer.toneMapping = THREE.NoToneMapping;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 20000);
  const root = new THREE.Group();
  scene.add(root);

  /* Materials --------------------------------------------------------------- */
  const shared = {
    uSweep: { value: -1e9 },
    uSweepWidth: { value: 40 },
    uSweepStrength: { value: 0 },
    uCell: { value: 6 },
  };
  const capMaterial = (hex: string, edgeHex: string, reveal: { value: number }, dissolve: { value: number }) =>
    new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        uColor: { value: new THREE.Color(hex) },
        uEdge: { value: new THREE.Color(edgeHex) },
        uReveal: reveal,
        uDissolve: dissolve,
      },
      vertexShader: CAP_VERT,
      fragmentShader: CAP_FRAG,
    });

  /* Symbol: flat, revealed by a diagonal fill wipe ------------------------- */
  const navyShapes = shapesFrom(LOGO_PARTS.navySymbol, quality.curveSegments);
  const mintShapes = shapesFrom(LOGO_PARTS.mintSymbol, quality.curveSegments);
  const symbolReveal = { value: -1e9 };
  const solid = { value: 1 };
  const navyEdge = new THREE.Color(BRAND.navy).lerp(new THREE.Color('#ffffff'), 0.45).getStyle();
  const mintEdge = new THREE.Color(BRAND.mint).lerp(new THREE.Color('#ffffff'), 0.45).getStyle();
  root.add(new THREE.Mesh(flatGeometry(navyShapes), capMaterial(BRAND.navy, navyEdge, symbolReveal, solid)));
  root.add(new THREE.Mesh(flatGeometry(mintShapes), capMaterial(BRAND.mint, mintEdge, symbolReveal, solid)));
  // Range of the wipe coordinate (y + 0.5x) across the symbol, in logo units.
  const WIPE_FROM = -172 + 0.5 * (270 - CX) - 12;
  const WIPE_TO = 172 + 0.5 * (603 - CX) + 12;

  /* Outline trace ----------------------------------------------------------- */
  const traceMaterials: LineMaterial[] = [];
  const traces: { line: Line2; segments: number }[] = [];
  for (const [shapes, color] of [
    [navyShapes, BRAND.navy],
    [mintShapes, BRAND.mint],
  ] as const) {
    const positions = outlinePoints(shapes, 220);
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    const material = new LineMaterial({ color, linewidth: 1.6, transparent: true, worldUnits: false });
    traceMaterials.push(material);
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    root.add(line);
    traces.push({ line, segments: positions.length / 3 - 1 });
  }

  /* Wordmark letters: each materialises via its own dissolve -------------- */
  const wordShapes = shapesFrom(LOGO_PARTS.wordmark, quality.curveSegments);
  const letterGroups: { shapes: THREE.Shape[]; minX: number; maxX: number }[] = [];
  wordShapes
    .map((shape) => {
      const xs = shape.getPoints().map((p) => p.x);
      return { shape, minX: Math.min(...xs), maxX: Math.max(...xs) };
    })
    .sort((a, b) => a.minX - b.minX)
    .forEach((s) => {
      const last = letterGroups[letterGroups.length - 1];
      // Overlapping x-ranges belong to one glyph (the dot and stem of the "i").
      if (last && s.minX < last.maxX - 2) {
        last.shapes.push(s.shape);
        last.maxX = Math.max(last.maxX, s.maxX);
      } else letterGroups.push({ shapes: [s.shape], minX: s.minX, maxX: s.maxX });
    });

  const wordMinX = letterGroups[0].minX;
  const wordMaxX = letterGroups[letterGroups.length - 1].maxX;
  /** Launch time for a point at SVG x within the wordmark. */
  const launchAt = (svgX: number) => T.wordStart + ((svgX - wordMinX) / (wordMaxX - wordMinX)) * T.particleSpread;

  const noWipe = { value: 1e9 };
  const letters = letterGroups.map((g) => {
    const dissolve = { value: 0 };
    root.add(new THREE.Mesh(flatGeometry(g.shapes), capMaterial(BRAND.navy, '#7fe3c4', noWipe, dissolve)));
    return { dissolve, start: launchAt((g.minX + g.maxX) / 2) + T.letterDelay };
  });

  /* Particles ---------------------------------------------------------------- */
  const count = { low: 1400, medium: 2600, high: 4200 }[quality.tier];
  const targets = samplePoints(wordShapes, count);
  // Launch area: the symbol, biased towards its right-hand tips.
  const symMin = toLogo(300, 600);
  const symMax = toLogo(600, 280);
  const positions = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const controls = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const seeds = new Float32Array(count);
  targets.forEach((t, i) => {
    const s = new THREE.Vector3(
      THREE.MathUtils.lerp(symMin.x, symMax.x, Math.sqrt(Math.random())),
      THREE.MathUtils.lerp(symMin.y, symMax.y, Math.random()),
      0,
    );
    // Arc control point: midway, lifted above or dipped below the baseline,
    // and pulled towards the camera for a sense of depth in flight.
    const mid = s.clone().lerp(t, 0.5);
    const lift = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 170);
    const c = new THREE.Vector3(mid.x + (Math.random() - 0.5) * 120, mid.y + lift, 80 + Math.random() * 260);
    t.toArray(positions, i * 3);
    s.toArray(starts, i * 3);
    c.toArray(controls, i * 3);
    delays[i] = launchAt(t.x + CX) + Math.random() * T.particleJitter - T.particleJitter / 2;
    seeds[i] = Math.random();
  });
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aStart', new THREE.BufferAttribute(starts, 3));
  particleGeometry.setAttribute('aControl', new THREE.BufferAttribute(controls, 3));
  particleGeometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
  particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const particleUniforms = {
    uTime: { value: 0 },
    uFlight: { value: T.particleFlight },
    uSize: { value: 2.6 },
    uScale: { value: 1 },
    uFade: { value: 1 },
    uMint: { value: new THREE.Color(BRAND.mint) },
    uNavy: { value: new THREE.Color(BRAND.navy) },
  };
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.ShaderMaterial({
      uniforms: particleUniforms,
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
    }),
  );
  particles.frustumCulled = false;
  particles.renderOrder = 2;
  root.add(particles);

  /* Layout -------------------------------------------------------------------- */
  let logoScale = 1;
  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    // Camera distance where 1 world unit == 1 CSS pixel on the logo plane,
    // so the finished frame is a pixel-faithful rendition of the SVG.
    camera.aspect = width / height;
    camera.position.set(0, 0, height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.near = camera.position.z / 20;
    camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();

    const target = Math.min(width * (width < 640 ? 0.62 : 0.34), 420, height * 1.1);
    logoScale = target / LOGO_VIEWBOX.width;
    root.scale.setScalar(logoScale);
    shared.uCell.value = Math.max(3, 9 * logoScale);
    particleUniforms.uScale.value = pixelRatio * Math.max(0.75, logoScale * 1.4);

    renderer.setSize(width, height, false);
    traceMaterials.forEach((m) => m.resolution.set(width, height));
    if (!running) render();
  }

  /* Animation ------------------------------------------------------------------ */
  let time = 0;
  let running = false;
  let completed = false;
  let rafId = 0;
  let lastNow = 0;
  let readyFired = false;
  let disposed = false;

  function render() {
    // 1. Outline trace, fading once the fill has passed.
    const trace = easeInOutCubic(progress(time, T.traceStart, T.traceEnd - T.traceStart));
    const traceFade = 1 - progress(time, T.traceEnd + T.fillDuration * 0.6, 0.3);
    traces.forEach(({ line, segments }) => {
      line.geometry.instanceCount = Math.max(0, Math.floor(segments * trace));
      line.visible = trace > 0 && traceFade > 0;
    });
    traceMaterials.forEach((m) => (m.opacity = traceFade));

    // 2. Fill wipe the moment the outlines close.
    const fill = easeInOutCubic(progress(time, T.traceEnd, T.fillDuration));
    symbolReveal.value = THREE.MathUtils.lerp(WIPE_FROM, WIPE_TO, fill) * logoScale;

    // 3. Particles stream to the letters; letters dissolve in as they land.
    particleUniforms.uTime.value = time;
    const lastLetter = letters[letters.length - 1];
    particleUniforms.uFade.value = 1 - progress(time, lastLetter.start + T.letterDuration * 0.4, 0.35);
    particles.visible = time > T.wordStart - T.particleJitter && particleUniforms.uFade.value > 0;
    letters.forEach((l) => (l.dissolve.value = easeInOutCubic(progress(time, l.start, T.letterDuration))));

    // 4. Gloss sweep across the whole mark, once.
    const s = progress(time, T.sweepStart, T.sweepDuration);
    const halfW = (LOGO_VIEWBOX.width / 2) * logoScale;
    shared.uSweep.value = THREE.MathUtils.lerp(-halfW - 200, halfW + 260, easeInOutCubic(s));
    shared.uSweepWidth.value = 60 * logoScale;
    shared.uSweepStrength.value = s > 0 && s < 1 ? 0.24 * Math.sin(Math.PI * s) : 0;

    renderer.render(scene, camera);
    options.onProgress?.(clamp01(time / INTRO_DURATION));

    if (!readyFired) {
      readyFired = true;
      options.onReady?.();
    }
  }

  function finish() {
    running = false;
    if (!completed) {
      completed = true;
      options.onComplete?.();
    }
  }

  function tick(now: number) {
    if (!running) return;
    // rAF pauses itself in hidden tabs. Time follows the wall clock so the intro
    // keeps pace when frames arrive sparsely or visibility flaps; only a long
    // hidden gap is capped, so the animation resumes instead of skipping.
    const dt = Math.min(0.5, (now - (lastNow || now)) / 1000);
    lastNow = now;
    time = Math.min(INTRO_DURATION, time + dt);
    render();
    // The finished frame is static: stop drawing to save battery.
    if (time >= INTRO_DURATION) return finish();
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (disposed) return;
    cancelAnimationFrame(rafId);
    running = true;
    lastNow = 0;
    rafId = requestAnimationFrame(tick);
  }

  const resizeObserver = new ResizeObserver(() => resize());
  const onContextLost = (e: Event) => {
    e.preventDefault();
    running = false;
    cancelAnimationFrame(rafId);
    options.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  resizeObserver.observe(host);

  resize();
  if (options.freezeAt !== undefined) {
    time = Math.min(INTRO_DURATION, options.freezeAt);
    render();
    if (time >= INTRO_DURATION) finish();
  } else {
    render();
    play();
  }

  return {
    replay() {
      time = 0;
      completed = false;
      play();
    },
    dispose() {
      disposed = true;
      running = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      resizeObserver.disconnect();
      const materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: THREE.Material) => materials.add(m));
        }
      });
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
