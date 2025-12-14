import React from 'react'
import PropTypes from 'prop-types'

const LABEL_CLASSES = 'text-sm font-medium text-slate-900'
const HELP_TEXT_CLASSES = 'text-sm text-slate-600'
const ERROR_TEXT_CLASSES = 'text-sm text-rose-700'

const BASE_INPUT_CLASSES =
  'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ring-offset-white'

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

/**
 * @param {{
 *   label?: string,
 *   hint?: string,
 *   error?: string,
 * } & React.ComponentPropsWithoutRef<'input'>} props
 */
export const TextInput = React.forwardRef(function TextInput(
  { label, hint, error, id, className, ...props },
  ref,
) {
  const autoId = React.useId()
  const inputId = id ?? autoId

  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const borderClasses = error ? 'border-rose-400' : 'border-slate-200'

  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={inputId} className={LABEL_CLASSES}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={joinClassNames(BASE_INPUT_CLASSES, borderClasses, className)}
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

TextInput.propTypes = {
  className: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
}
