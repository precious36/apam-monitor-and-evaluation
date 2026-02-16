import { useMemo, useState } from 'react'
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
  const ActivePage = useMemo(() => PAGE_COMPONENTS[activePage], [activePage])

  function handleLogin(nextSession) {
    storeSession(nextSession)
    setSession(nextSession)
  }

  function handleLogoutRequest() {
    setIsSignOutModalOpen(true)
  }

  function handleCancelLogout() {
    setIsSignOutModalOpen(false)
  }

  function handleConfirmLogout() {
    clearSession()
    setIsSignOutModalOpen(false)
    setSession(null)
    notify.success('Signed out successfully.')
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={NAV_ITEMS}
        active={activePage}
        onSelect={setActivePage}
        user={session.user}
        onLogout={handleLogoutRequest}
      />
      <Topbar activePage={activePage} />
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

