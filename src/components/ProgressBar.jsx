export default function ProgressBar({ steps, current }) {
  const totalSteps = Array.isArray(steps) ? steps.length : 0
  const currentIndex =
    totalSteps > 0 ? Math.min(Math.max(Number(current) || 0, 0), totalSteps - 1) : 0
  const percentComplete =
    totalSteps <= 1 ? (totalSteps === 1 ? 100 : 0) : ((currentIndex + 1) / totalSteps) * 100
  const currentStepLabel = totalSteps > 0 ? steps[currentIndex] : 'Progress'

  return (
    <div className="progress">
      <div className="progress-meta">
        <span>
          Step {totalSteps === 0 ? 0 : currentIndex + 1} of {totalSteps}
        </span>
        <span>{Math.round(percentComplete)}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={totalSteps === 0 ? 0 : currentIndex + 1}
        aria-label="Form progress"
      >
        <div className="progress-fill" style={{ width: `${percentComplete}%` }} />
      </div>
      <p className="progress-label">{currentStepLabel}</p>
    </div>
  )
}
