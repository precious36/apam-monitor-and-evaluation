import { useState } from 'react'
import Button from '../components/Button'
import apamLogo from '../assets/apam-logo.png'
import { useNotify } from '../hooks/useNotify'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function getLoginErrorMessage(payload, status) {
  if (payload?.errors?.length) {
    return payload.errors[0]
  }

  if (payload?.message) {
    return payload.message
  }

  if (status === 401) {
    return 'Invalid credentials. Please verify your login details.'
  }

  return 'Unable to sign in at the moment. Please try again.'
}

export default function Login({ onLogin }) {
  const notify = useNotify()
  const [emailOrUserName, setEmailOrUserName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUserName,
          password,
        }),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok || !responseBody?.succeeded || !responseBody?.data?.accessToken) {
        throw new Error(getLoginErrorMessage(responseBody, response.status))
      }

      notify.success('Signed in successfully.')
      onLogin(responseBody.data)
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : 'Unable to sign in at the moment. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero" aria-hidden="true">
        <div>
          <p className="eyebrow login-eyebrow">APAM Monitoring and Evaluation</p>
          <h1 className="login-hero-title">Field-driven monitoring with secure data access.</h1>
          <p className="login-hero-subtitle">
            Track cases, member outcomes, and livelihoods data in one operational workspace.
          </p>
        </div>
        <div className="login-highlight">
          <p className="login-highlight-label">Platform focus</p>
          <ul className="login-highlight-list">
            <li>Secure access for approved program teams</li>
            <li>Real-time status across districts and interventions</li>
            <li>Centralized reporting for audit and compliance</li>
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <img className="login-logo" src={apamLogo} alt="APAM logo" />
            <p className="eyebrow">Secure access</p>
            <h2 className="login-title">Sign in to APAM M&E</h2>
            <p className="login-subtitle">Use your assigned account credentials to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email or username</span>
              <input
                type="text"
                autoComplete="username"
                value={emailOrUserName}
                onChange={(event) => setEmailOrUserName(event.target.value)}
                placeholder="name@organization.org or username"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <div className="login-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.76-2.16 2.05-4 3.68-5.35" />
                      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-4.08 5.34" />
                      <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </Button>
              </div>
            </label>

            <Button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="login-meta">
            If you cannot access your account, contact the APAM system administrator.
          </p>
        </div>
      </section>
    </div>
  )
}
