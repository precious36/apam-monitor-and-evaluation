const STATUS_MAP = {
  critical: 'status-critical',
  ongoing: 'status-ongoing',
  closed: 'status-closed',
  underinvestigation: 'status-under-investigation',
  arrestmade: 'status-arrest-made',
  noarrestmade: 'status-no-arrest-made',
  caseonhearingstage: 'status-hearing-stage',
  sentenced: 'status-sentenced',
  acquitted: 'status-acquitted',
  planned: 'status-planned',
  completed: 'status-completed',
}

const normalizeStatusToken = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

export default function StatusPill({ value }) {
  const statusLabel = String(value ?? '').trim() || 'Unknown'
  return (
    <span className={`status-pill ${STATUS_MAP[normalizeStatusToken(statusLabel)] || ''}`}>
      {statusLabel}
    </span>
  )
}
