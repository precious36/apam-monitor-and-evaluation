import { useMemo, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Programs from './pages/Programs'
import SkillsLivelihoods from './pages/SkillsLivelihoods'
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
  'Skills & Livelihoods',
  'Cases',
  'Reports',
  'Users & Settings',
]

const PAGE_COMPONENTS = {
  Dashboard,
  Members,
  Programs,
  'Skills & Livelihoods': SkillsLivelihoods,
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
  const ActivePage = useMemo(() => PAGE_COMPONENTS[activePage], [activePage])

  function handleLogin(nextSession) {
    storeSession(nextSession)
    setSession(nextSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    notify.success('Signed out successfully.')
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      <Sidebar items={NAV_ITEMS} active={activePage} onSelect={setActivePage} />
      <Topbar user={session.user} onLogout={handleLogout} />
      <main className="app-main">
        <ActivePage session={session} />
      </main>
    </div>
  )
}

export default App

