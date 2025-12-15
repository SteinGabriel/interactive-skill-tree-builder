import React from 'react'
import { joinClassNames } from '@/lib/utils'

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-white'

const VARIANT_CLASSES = {
  primary: 'bg-black text-white hover:bg-sky-700',
  secondary: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

/**
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'danger',
 *   size?: 'sm' | 'md' | 'lg',
 * } & React.ComponentPropsWithoutRef<'button'>} props
 */
export const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary
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
