import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface LoaderHandle {
  /** 0 → 1. Updates the DOM directly so it can be called every frame. */
  setProgress: (progress: number) => void;
}

interface LoaderProps {
  visible: boolean;
  /** Accessible name of the progress bar. */
  label?: string;
  /** Status lines, shown in order as progress advances. The last one is shown at 100%. */
  steps?: string[];
}

const DEFAULT_STEPS = ['Preparing workspace', 'Securing connection', 'Syncing your data', 'Ready'];

/** Compact determinate loader: status line, live percentage, slim gradient bar. */
export const Loader = forwardRef<LoaderHandle, LoaderProps>(function Loader(
  { visible, label = 'Loading', steps = DEFAULT_STEPS },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const last = useRef({ percent: -1, step: -1 });

  useImperativeHandle(ref, () => ({
    setProgress(progress) {
      const p = Math.min(1, Math.max(0, progress));
      const percent = Math.round(p * 100);
      barRef.current?.style.setProperty('width', `${p * 100}%`);
      if (percent === last.current.percent) return;
      last.current.percent = percent;

      const done = percent === 100;
      // Last step is reserved for completion; the others share 0–99%.
      const step = done ? steps.length - 1 : Math.min(steps.length - 2, Math.floor(p * (steps.length - 1)));
      if (valueRef.current) valueRef.current.textContent = String(percent);
      const root = rootRef.current;
      root?.setAttribute('aria-valuenow', String(percent));
      root?.setAttribute('aria-valuetext', `${percent}% — ${steps[step]}`);
      root?.toggleAttribute('data-done', done);

      if (step !== last.current.step && statusRef.current) {
        last.current.step = step;
        const el = statusRef.current;
        el.textContent = steps[step];
        // Restart the fade-in for the new line.
        el.classList.remove('is-swapping');
        void el.offsetWidth;
        el.classList.add('is-swapping');
      }
    },
  }));

  return (
    <div
      ref={rootRef}
      className="fsi-loader"
      data-visible={visible}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className="fsi-loader__top" aria-hidden="true">
        <span className="fsi-loader__status">
          <svg className="fsi-loader__check" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 8.5 3 3 6-6.5" />
          </svg>
          <span ref={statusRef} className="fsi-loader__text">
            {steps[0]}
          </span>
        </span>
        <span className="fsi-loader__percent">
          <span ref={valueRef}>0</span>%
        </span>
      </div>
      <div className="fsi-loader__track" aria-hidden="true">
        <span ref={barRef} className="fsi-loader__bar" />
      </div>
    </div>
  );
});
