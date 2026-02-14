import Button from './Button'
import apamLogo from '../assets/apam-logo.png'

export default function Sidebar({ items, active, onSelect }) {
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
              {item}
            </Button>
          ))}
        </nav>
      </div>
      <div className="sidebar-footer">
        <span className="status-dot" />
        <div>
          <p className="footer-label">System status</p>
          <p className="footer-value">Operational</p>
        </div>
      </div>
    </aside>
  )
}
