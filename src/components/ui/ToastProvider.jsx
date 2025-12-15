import React from 'react'
import { ToastContext } from '@/components/ui/toastContext'
import { joinClassNames } from '@/lib/utils'

const MAX_TOASTS = 3

/**
 * @typedef {'info' | 'success' | 'error'} ToastVariant
 *
 * @typedef {object} Toast
 * @property {string} id
 * @property {ToastVariant} variant
 * @property {string} message
 * @property {number} createdAtMs
 * @property {number} durationMs
 */

/**
 * @param {ToastVariant} variant
 */
function getToastClasses(variant) {
  if (variant === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-950'
  }
  if (variant === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-950'
  }
  return 'border-sky-200 bg-sky-50 text-sky-950'
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export function ToastProvider({ children }) {
  const counterRef = React.useRef(0)
  const timersRef = React.useRef(new Map())

  const [toasts, setToasts] = React.useState([])

  const dismissToast = React.useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  const pushToast = React.useCallback(({ message, variant = 'info', durationMs = 4500 }) => {
    const id = `toast_${Date.now()}_${(counterRef.current += 1)}`
    const nextToast = {
      id,
      message,
      variant,
      createdAtMs: Date.now(),
      durationMs,
    }

    setToasts((current) => [...current, nextToast].slice(-MAX_TOASTS))
    return id
  }, [])

  React.useEffect(() => {
    for (const toast of toasts) {
      if (timersRef.current.has(toast.id)) continue
      const timeoutId = window.setTimeout(() => {
        dismissToast(toast.id)
      }, toast.durationMs)
      timersRef.current.set(toast.id, timeoutId)
    }

    for (const [toastId, timeoutId] of timersRef.current.entries()) {
      const stillExists = toasts.some((toast) => toast.id === toastId)
      if (stillExists) continue
      window.clearTimeout(timeoutId)
      timersRef.current.delete(toastId)
    }
  }, [dismissToast, toasts])

  const value = React.useMemo(
    () => ({ pushToast, dismissToast, clearToasts }),
    [pushToast, dismissToast, clearToasts],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
            className={joinClassNames(
              'pointer-events-auto rounded-lg border p-3 shadow-sm',
              getToastClasses(toast.variant),
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-5">{toast.message}</p>
              <button
                type="button"
                className="rounded-md p-1 text-current/80 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ring-offset-white"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
