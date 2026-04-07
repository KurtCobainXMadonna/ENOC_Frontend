interface StepButtonProps {
  active: boolean;
  beat: boolean;
  playing: boolean;
  accent: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function StepButton({ active, beat, playing, accent, disabled = false, onClick }: StepButtonProps) {
  const classes = [
    'step-btn',
    active ? 'on' : 'off',
    beat && !active ? 'beat' : '',
    active && accent ? 'accent' : '',
    playing ? 'playing' : '',
  ].filter(Boolean).join(' ');

  return <button className={classes} onClick={onClick} disabled={disabled} style={disabled ? { cursor: 'not-allowed', opacity: 0.5 } : undefined} />;
}

interface StepGridProps {
  steps: boolean[];
  currentStep: number;
  isPlaying: boolean;
  disabled?: boolean;
  onToggleStep: (idx: number) => void;
}

export function StepGrid({ steps, currentStep, isPlaying, disabled = false, onToggleStep }: StepGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 3 }}>
      {steps.map((active, stepIdx) => (
        <StepButton
          key={stepIdx}
          active={active}
          beat={stepIdx % 4 === 0}
          playing={isPlaying && currentStep === stepIdx}
          accent={active && Math.floor(stepIdx / 4) % 2 === 1}
          disabled={disabled}
          onClick={() => onToggleStep(stepIdx)}
        />
      ))}
    </div>
  );
}