import React from 'react'
import { Panel } from '@/components/ui/Panel'
import { joinClassNames } from '@/lib/utils'

const BASE_CLASSES = 'p-4'

/**
 * Convenience wrapper over `Panel` with default padding.
 * @param {React.ComponentPropsWithoutRef<'div'>} props
 */
export function Card({ className, ...props }) {
  return <Panel className={joinClassNames(BASE_CLASSES, className)} {...props} />
}
