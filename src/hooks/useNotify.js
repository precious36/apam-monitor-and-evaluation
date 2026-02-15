import { useContext } from 'react'
import { NotificationContext } from '../context/notificationContext'

export function useNotify() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotify must be used within NotificationProvider.')
  }

  return context
}
