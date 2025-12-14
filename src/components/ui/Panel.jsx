import React from 'react'
import PropTypes from 'prop-types'

const BASE_CLASSES = 'rounded-lg border border-slate-200 bg-white shadow-sm'

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

/**
 * @param {React.ComponentPropsWithoutRef<'div'>} props
 */
export function Panel({ className, ...props }) {
  return <div className={joinClassNames(BASE_CLASSES, className)} {...props} />
}

Panel.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

