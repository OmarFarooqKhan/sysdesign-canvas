/** One clickable dot per step; the active one stretches into a neon pill.
 *  Split from PlaythroughPanel.tsx to keep it under the line cap. */
export function ProgressDots({ count, active, onJump }: {
  count: number;
  active: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="walk-dots">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to step ${i + 1}`}
          aria-current={i === active || undefined}
          className={i === active ? 'walk-progress-dot active' : 'walk-progress-dot'}
          onClick={() => onJump(i)}
        />
      ))}
    </div>
  );
}
