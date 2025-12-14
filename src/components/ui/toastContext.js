import React from 'react'

/**
 * @typedef {'info' | 'success' | 'error'} ToastVariant
 *
 * @typedef {object} ToastContextValue
 * @property {(args: { message: string, variant?: ToastVariant, durationMs?: number }) => string} pushToast
 * @property {(toastId: string) => void} dismissToast
 * @property {() => void} clearToasts
 */

/** @type {React.Context<ToastContextValue | null>} */
export const ToastContext = React.createContext(null)

