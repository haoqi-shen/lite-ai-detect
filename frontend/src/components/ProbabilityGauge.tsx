import type { Label } from '../types';

export function ProbabilityGauge({ value, label }: { value?: number | null; label: Label }) {
  const v = Math.max(0, Math.min(1, value ?? 0));
  const C = 2 * Math.PI * 45; // circumference for r=45
  const dash = `${C * v} ${C - C * v}`;
  const color = label === 'AI' ? '#ef4444' : label === 'HUMAN' ? '#22c55e' : '#eab308';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg width="100" height="100" viewBox="0 0 100 100" role="img" aria-label={`Probability ${label}`}>
        <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={dash}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
          transform="rotate(-90 50 50)"
          fill="none"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="500" fill={color}>{label}</text>
      </svg>
    </div>
  );
}



