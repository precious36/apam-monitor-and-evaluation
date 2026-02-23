export default function HorizontalBarChart({ data = [] }) {
  if (!data.length) {
    return <p className="table-meta">No chart data available.</p>
  }

  const maxValue = Math.max(1, ...data.map((item) => Number(item.value ?? 0)))

  return (
    <div className="chart chart-horizontal" role="img" aria-label="Horizontal bar chart summary">
      {data.map((item) => {
        const value = Number(item.value ?? 0)
        const width = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0

        return (
          <div className="chart-row" key={item.label}>
            <div className="chart-row-head">
              <span className="chart-label">{item.label}</span>
              <span className="chart-row-value">{value.toLocaleString()}</span>
            </div>
            <div className="chart-bar-track" aria-hidden="true">
              <div className="chart-bar" style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
