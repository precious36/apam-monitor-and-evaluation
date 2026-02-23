export default function ColumnChart({ data = [] }) {
  if (!data.length) {
    return <p className="table-meta">No chart data available.</p>
  }

  const maxValue = Math.max(1, ...data.map((item) => Number(item.value ?? 0)))

  return (
    <div className="chart chart-columns" role="img" aria-label="Column chart summary">
      {data.map((item) => {
        const value = Number(item.value ?? 0)
        const height = value > 0 ? Math.max((value / maxValue) * 100, 6) : 0

        return (
          <div className="chart-column" key={item.label}>
            <div className="chart-column-bar" aria-hidden="true">
              <div className="chart-column-fill" style={{ height: `${height}%` }} />
            </div>
            <span className="chart-column-label">{item.label}</span>
            <span className="chart-column-value">{value.toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}
