import React from 'react'
import { joinClassNames } from '@/lib/utils'

const BASE_CLASSES = 'rounded-lg border border-slate-200 bg-white shadow-sm'

/**
 * @param {React.ComponentPropsWithoutRef<'div'>} props
 */
export function Panel({ className, ...props }) {
  return <div className={joinClassNames(BASE_CLASSES, className)} {...props} />
}
