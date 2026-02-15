import { useCallback, useMemo, useRef, useState } from 'react'
import { NotificationContext } from '../context/notificationContext'

function createNotificationMessage(message) {
  if (typeof message !== 'string') {
    return ''
  }

  return message.trim()
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const push = useCallback((type, message, duration = 4500) => {
    const normalizedMessage = createNotificationMessage(message)
    if (!normalizedMessage) {
      return
    }

    idRef.current += 1
    const id = idRef.current

    setNotifications((prev) => [...prev, { id, type, message: normalizedMessage }])

    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        remove(id)
      }, duration)
    }
  }, [remove])

  const contextValue = useMemo(
    () => ({
      success: (message, duration) => push('success', message, duration),
      error: (message, duration = 6000) => push('error', message, duration),
      info: (message, duration) => push('info', message, duration),
    }),
    [push],
  )

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="notify-stack" aria-live="polite" aria-atomic="true">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notify notify-${notification.type}`} role="status">
            <p>{notification.message}</p>
            <button
              type="button"
              className="notify-close"
              onClick={() => remove(notification.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
