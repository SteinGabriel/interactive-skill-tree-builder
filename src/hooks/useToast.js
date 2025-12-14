import React from 'react'
import { ToastContext } from '@/components/ui/toastContext'

/**
 * @returns {import('@/components/ui/toastContext').ToastContextValue}
 */
export function useToast() {
  const value = React.useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

