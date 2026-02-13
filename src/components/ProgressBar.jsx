export default function ProgressBar({ steps, current }) {
  return (
    <div className="progress">
      {steps.map((step, index) => (
        <div key={step} className={`progress-step ${index <= current ? 'is-active' : ''}`}>
          <span>{index + 1}</span>
          <p>{step}</p>
        </div>
      ))}
    </div>
  )
}
