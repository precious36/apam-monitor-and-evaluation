export default function HorizontalBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="chart chart-horizontal">
      {data.map((item) => (
        <div className="chart-row" key={item.label}>
          <span className="chart-label">{item.label}</span>
          <div className="chart-bar-track">
            <div
              className="chart-bar"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <span>{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
