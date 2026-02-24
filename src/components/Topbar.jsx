function MenuIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mobile-nav-toggle-icon">
      {isOpen ? (
        <path d="M6.7 5.3 12 10.6l5.3-5.3 1.4 1.4L13.4 12l5.3 5.3-1.4 1.4L12 13.4l-5.3 5.3-1.4-1.4L10.6 12 5.3 6.7l1.4-1.4Z" />
      ) : (
        <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
      )}
    </svg>
  )
}

export default function Topbar({ activePage, isMobileNavOpen, onToggleMobileNav }) {
  return (
    <header className="topbar topbar-minimal">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileNavOpen}
          aria-controls="app-sidebar"
          onClick={onToggleMobileNav}
        >
          <MenuIcon isOpen={isMobileNavOpen} />
        </button>
        <p className="topbar-title">{activePage}</p>
      </div>
    </header>
  )
}
