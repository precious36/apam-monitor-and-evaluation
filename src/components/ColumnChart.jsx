export default function ColumnChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="chart chart-columns">
      {data.map((item) => (
        <div className="chart-column" key={item.label}>
          <div className="chart-column-bar">
            <div
              className="chart-column-fill"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="chart-column-label">{item.label}</span>
          <span className="chart-column-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
