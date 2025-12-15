import React from 'react'
import { joinClassNames } from '@/lib/utils'

const BASE_CLASSES =
  'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-white'

const VARIANT_CLASSES = {
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
  danger: 'text-rose-700 hover:bg-rose-50 hover:text-rose-800',
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

/**
 * Accessible icon-only button.
 *
 * Note: pass `aria-label` when the contents are non-textual (or provide
 * `aria-labelledby`).
 *
 * @param {{
 *   variant?: 'ghost' | 'secondary' | 'danger',
 *   size?: 'sm' | 'md' | 'lg',
 * } & React.ComponentPropsWithoutRef<'button'>} props
 */
export const IconButton = React.forwardRef(function IconButton(
  { variant = 'ghost', size = 'md', className, type = 'button', ...props },
  ref,
) {
  const hasAriaLabel =
    typeof props['aria-label'] === 'string' && props['aria-label'].trim() !== ''
  const hasAriaLabelledBy =
    typeof props['aria-labelledby'] === 'string' &&
    props['aria-labelledby'].trim() !== ''

  const isDev = Boolean(import.meta?.env?.DEV)
  if (isDev && !hasAriaLabel && !hasAriaLabelledBy) {
    console.warn(
      'IconButton requires an accessible name via `aria-label` or `aria-labelledby`.',
    )
  }

  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.ghost
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md

  return (
    <button
      ref={ref}
      type={type}
      className={joinClassNames(BASE_CLASSES, variantClass, sizeClass, className)}
      {...props}
    />
  )
})
