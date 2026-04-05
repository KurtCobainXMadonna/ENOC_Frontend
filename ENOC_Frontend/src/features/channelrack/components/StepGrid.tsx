interface StepGridProps {
  steps: boolean[]
  currentStep: number
  isPlaying: boolean
  onToggleStep: (idx: number) => void
}
