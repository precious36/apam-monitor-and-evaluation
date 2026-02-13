import Button from './Button'

function getUserInitials(name) {
  if (!name) {
    return 'AU'
  }

  const [first = '', second = ''] = name.split(' ')
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
}

function getRoleLabel(user) {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    return user.roles.join(', ')
  }

  return 'Authenticated user'
}

export default function Topbar({ user, onLogout }) {
  const displayName = user?.userName || user?.email || 'Authenticated User'
  const roleLabel = getRoleLabel(user)
  const initials = getUserInitials(displayName)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search">
          <span className="search-icon">Search</span>
          <input
            type="search"
            className="search-input"
            placeholder="Search members, cases, or reports"
          />
        </div>
      </div>
      <div className="topbar-filters">
        <label className="filter">
          <span>District</span>
          <select>
            <option>All districts</option>
            <option>North</option>
            <option>Central</option>
            <option>South</option>
          </select>
        </label>
        <label className="filter">
          <span>Date</span>
          <input type="date" />
        </label>
        <label className="filter">
          <span>Program</span>
          <select>
            <option>All programs</option>
            <option>Skills uplift</option>
            <option>Livelihoods</option>
            <option>Protection</option>
          </select>
        </label>
      </div>
      <div className="topbar-profile">
        <div className="profile-chip">
          <div className="profile-avatar">{initials}</div>
          <div>
            <p className="profile-name">{displayName}</p>
            <p className="profile-role">{roleLabel}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
