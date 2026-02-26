import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Modal from './components/Modal'
import Button from './components/Button'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Programs from './pages/Programs'
import Cases from './pages/Cases'
import Reports from './pages/Reports'
import UsersSettings from './pages/UsersSettings'
import Login from './pages/Login'
import { useNotify } from './hooks/useNotify'
import { filterAccessiblePages, getFirstAccessiblePage } from './lib/permissions'

const AUTH_STORAGE_KEY = 'apam.me.auth'

const NAV_ITEMS = [
  'Dashboard',
  'Members',
  'Programs',
  'Cases',
  'Reports',
  'Users & Settings',
]

const PAGE_COMPONENTS = {
  Dashboard,
  Members,
  Programs,
  Cases,
  Reports,
  'Users & Settings': UsersSettings,
}

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const serializedSession = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!serializedSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(serializedSession)

    if (!parsedSession?.accessToken) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    const isExpired =
      parsedSession.expiresAtUtc &&
      new Date(parsedSession.expiresAtUtc).getTime() <= Date.now()

    if (isExpired) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsedSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function storeSession(session) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

function App() {
  const notify = useNotify()
  const [session, setSession] = useState(readStoredSession)
  const [activePage, setActivePage] = useState('Dashboard')
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const visibleNavItems = useMemo(
    () => (session ? filterAccessiblePages(NAV_ITEMS, session) : NAV_ITEMS),
    [session],
  )
  const ActivePage = useMemo(() => PAGE_COMPONENTS[activePage], [activePage])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : previousOverflow

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  useEffect(() => {
    if (!isMobileNavOpen || typeof window === 'undefined') {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileNavOpen])

  useEffect(() => {
    if (!session) {
      return
    }

    if (visibleNavItems.length === 0) {
      return
    }

    if (!visibleNavItems.includes(activePage)) {
      setActivePage(visibleNavItems[0])
    }
  }, [activePage, session, visibleNavItems])

  function handleLogin(nextSession) {
    storeSession(nextSession)
    setSession(nextSession)
    const firstAccessiblePage = getFirstAccessiblePage(NAV_ITEMS, nextSession)
    if (firstAccessiblePage) {
      setActivePage(firstAccessiblePage)
    }
  }

  function handleSelectPage(page) {
    setActivePage(page)
    setIsMobileNavOpen(false)
  }

  function handleLogoutRequest() {
    setIsMobileNavOpen(false)
    setIsSignOutModalOpen(true)
  }

  function handleCancelLogout() {
    setIsSignOutModalOpen(false)
  }

  function handleConfirmLogout() {
    clearSession()
    setIsSignOutModalOpen(false)
    setIsMobileNavOpen(false)
    setSession(null)
    notify.success('Signed out successfully.')
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  if (visibleNavItems.length === 0) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <div className="page">
            <div className="page-header">
              <div>
                <p className="eyebrow">Access control</p>
                <h1 className="page-title">No features assigned</h1>
                <p className="page-subtitle">
                  Your account is signed in but has no feature permissions. Contact an administrator.
                </p>
              </div>
              <div className="page-actions">
                <Button variant="danger" onClick={handleLogoutRequest}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Modal
          open={isSignOutModalOpen}
          title="Sign out"
          subtitle="Are you sure you want to sign out?"
          onClose={handleCancelLogout}
          footer={
            <div className="modal-actions modal-actions-split">
              <Button variant="ghost" onClick={handleCancelLogout}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmLogout}>
                Sign out
              </Button>
            </div>
          }
        >
          <p className="table-meta">You will need to sign in again to continue.</p>
        </Modal>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={visibleNavItems}
        active={activePage}
        onSelect={handleSelectPage}
        user={session.user}
        onLogout={handleLogoutRequest}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      {isMobileNavOpen ? (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}
      <Topbar
        activePage={activePage}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />
      <main className="app-main">
        <ActivePage session={session} />
      </main>
      <Modal
        open={isSignOutModalOpen}
        title="Sign out"
        subtitle="Are you sure you want to sign out?"
        onClose={handleCancelLogout}
        footer={
          <div className="modal-actions modal-actions-split">
            <Button variant="ghost" onClick={handleCancelLogout}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmLogout}>
              Sign out
            </Button>
          </div>
        }
      >
        <p className="table-meta">You will need to sign in again to continue.</p>
      </Modal>
    </div>
  )
}

export default App
