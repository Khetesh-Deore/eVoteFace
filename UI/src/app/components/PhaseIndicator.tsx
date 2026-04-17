interface PhaseIndicatorProps {
  phase: 'registration' | 'voting' | 'completed';
  className?: string;
}

export default function PhaseIndicator({ phase, className = '' }: PhaseIndicatorProps) {
  const phaseConfig = {
    registration: { label: 'Registration', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
    voting: { label: 'Voting', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    completed: { label: 'Completed', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-100' },
  };

  const config = phaseConfig[phase];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.textColor} ${config.bgColor} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${config.color} ${phase === 'voting' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}
