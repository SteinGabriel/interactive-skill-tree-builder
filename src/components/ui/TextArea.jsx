import React from 'react'
import { joinClassNames } from '@/lib/utils'

const LABEL_CLASSES = 'text-sm font-medium text-slate-900'
const HELP_TEXT_CLASSES = 'text-sm text-slate-600'
const ERROR_TEXT_CLASSES = 'text-sm text-rose-700'

const BASE_TEXTAREA_CLASSES =
  'block w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-white'

/**
 * @param {{
 *   label?: string,
 *   hint?: string,
 *   error?: string,
 * } & React.ComponentPropsWithoutRef<'textarea'>} props
 */
export const TextArea = React.forwardRef(function TextArea(
  { label, hint, error, id, className, rows = 4, ...props },
  ref,
) {
  const autoId = React.useId()
  const textAreaId = id ?? autoId

  const hintId = hint ? `${textAreaId}-hint` : undefined
  const errorId = error ? `${textAreaId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const borderClasses = error ? 'border-rose-400' : 'border-slate-200'

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={textAreaId} className={LABEL_CLASSES}>
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textAreaId}
        rows={rows}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={joinClassNames(
          BASE_TEXTAREA_CLASSES,
          borderClasses,
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className={HELP_TEXT_CLASSES}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={ERROR_TEXT_CLASSES}>
          {error}
        </p>
      ) : null}
    </div>
  )
})
