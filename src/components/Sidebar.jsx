import Button from './Button'
import apamLogo from '../assets/apam-logo.png'

const NAV_ICON_PATHS = {
  Dashboard:
    'M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm9 0a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V5ZM3 14a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm9 0a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5Z',
  Members:
    'M16 11a4 4 0 1 0-2.8-6.9A4 4 0 0 0 16 11Zm-8 0a4 4 0 1 0-2.8-6.9A4 4 0 0 0 8 11Zm0 2c-3.3 0-6 2.2-6 5v1h8v-1c0-1.9.8-3.7 2.2-5H8Zm8 0c-2.8 0-5 2.2-5 5v1h11v-1c0-2.8-2.2-5-6-5Z',
  Programs:
    'M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5H7Zm7 1.5L17.5 8H14V4.5ZM9 11h6v2H9v-2Zm0 4h6v2H9v-2Z',
  Cases:
    'M12 2 4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3Zm0 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0 12c-1.9-.7-3.6-2.3-4.7-4.4.7-1.5 2.5-2.6 4.7-2.6s4 1.1 4.7 2.6c-1.1 2.1-2.8 3.7-4.7 4.4Z',
  Reports:
    'M4 19h16v2H2V3h2v16Zm3-2V9h3v8H7Zm5 0V6h3v11h-3Zm5 0v-4h3v4h-3Z',
  'Users & Settings':
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4.7v-1.4l-2.1-.5a7.8 7.8 0 0 0-.6-1.5l1.2-1.9-1-1-1.9 1.2c-.5-.2-1-.4-1.5-.6L14.7 3h-1.4l-.5 2.1a7.8 7.8 0 0 0-1.5.6L9.4 4.5l-1 1 1.2 1.9c-.2.5-.4 1-.6 1.5L6.9 9.3v1.4l2.1.5c.1.5.3 1 .6 1.5l-1.2 1.9 1 1 1.9-1.2c.5.2 1 .4 1.5.6l.5 2.1h1.4l.5-2.1c.5-.1 1-.3 1.5-.6l1.9 1.2 1-1-1.2-1.9c.2-.5.4-1 .6-1.5l2.1-.5Z',
}

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

function SidebarIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d={path} />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="signout-icon">
      <path d="M10 4h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v-2H6V6h4V4Zm7.3 7H9v2h8.3l-2.6 2.6 1.4 1.4L21 12l-4.9-5-1.4 1.4L17.3 11Z" />
    </svg>
  )
}

export default function Sidebar({ items, active, onSelect, user, onLogout }) {
  const displayName = user?.userName || user?.email || 'Authenticated User'
  const roleLabel = getRoleLabel(user)
  const initials = getUserInitials(displayName)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="brand-logo" src={apamLogo} alt="APAM logo" />
        <div>
          <p className="brand-title">APAM Monitoring</p>
          <p className="brand-subtitle">Evaluation System</p>
        </div>
      </div>
      <div className="sidebar-section">
        <p className="sidebar-section-title">Navigation</p>
        <nav className="nav-list" aria-label="Primary">
          {items.map((item) => (
            <Button
              key={item}
              variant={item === active ? 'primary' : 'ghost'}
              className={`nav-item ${item === active ? 'is-active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <span className="nav-item-content">
                <SidebarIcon path={NAV_ICON_PATHS[item]} />
                <span>{item}</span>
              </span>
            </Button>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="profile-avatar">{initials}</div>
          <div>
            <p className="sidebar-user-name">{displayName}</p>
            <p className="sidebar-user-role">{roleLabel}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="signout-icon-btn"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOutIcon />
        </Button>
      </div>
    </aside>
  )
}
