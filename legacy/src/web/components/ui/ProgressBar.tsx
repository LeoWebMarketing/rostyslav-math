interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  return (
    <div className={`progress-container ${className}`}>
      <div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, value))}%` }}>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}
