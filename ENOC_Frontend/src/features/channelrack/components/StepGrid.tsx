interface StepButtonProps {
  active: boolean;
  beat: boolean;
  playing: boolean;
  accent: boolean;
  onClick: () => void;
}

export function StepButton({ active, beat, playing, accent, onClick }: StepButtonProps) {
  const classes = [
    'step-btn',
    active ? 'on' : 'off',
    beat && !active ? 'beat' : '',
    active && accent ? 'accent' : '',
    playing ? 'playing' : '',
  ].filter(Boolean).join(' ');

  return <button className={classes} onClick={onClick} />;
}

interface StepGridProps {
  steps: boolean[];
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (idx: number) => void;
}

export function StepGrid({ steps, currentStep, isPlaying, onToggleStep }: StepGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 3 }}>
      {steps.map((active, stepIdx) => (
        <StepButton
          key={stepIdx}
          active={active}
          beat={stepIdx % 4 === 0}
          playing={isPlaying && currentStep === stepIdx}
          accent={active && stepIdx % 4 === 0}
          onClick={() => onToggleStep(stepIdx)}
        />
      ))}
    </div>
  );
}