import './ProgressBar.css';

export interface ProgressBarProps {
  value: number;
  maxValue?: number;
  color?: string;
  testId?: string;
}

/** A simple clamped horizontal progress bar, purely derived from props. */
export function ProgressBar({
  value,
  maxValue = 100,
  color = 'var(--gold)',
  testId,
}: ProgressBarProps) {
  const clamped = Math.min(maxValue, Math.max(0, value));
  const percent = maxValue === 0 ? 0 : (clamped / maxValue) * 100;

  return (
    <div className="progressBar" data-testid={testId}>
      <span
        className="fill"
        data-testid={testId ? `${testId}-fill` : undefined}
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}
