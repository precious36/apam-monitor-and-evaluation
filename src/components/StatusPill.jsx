const STATUS_MAP = {
  Critical: 'status-critical',
  Ongoing: 'status-ongoing',
  Closed: 'status-closed',
}

export default function StatusPill({ value }) {
  return <span className={`status-pill ${STATUS_MAP[value] || ''}`}>{value}</span>
}
