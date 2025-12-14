import React from 'react'
import PropTypes from 'prop-types'
import { Handle, Position } from 'reactflow'

import { joinClassNames } from '@/lib/utils'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

/**
 * @param {SkillStatus} status
 */
function getStatusConfig(status) {
  if (status === 'completed') {
    return {
      label: 'Completed',
      badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }
  if (status === 'unlocked') {
    return {
      label: 'Unlocked',
      badgeClass: 'border-sky-200 bg-sky-50 text-sky-900',
    }
  }
  if (status === 'unlockable') {
    return {
      label: 'Unlockable',
      badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  }
  return {
    label: 'Locked',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
  }
}

/**
 * @param {{
 *   data: { title?: string, status?: SkillStatus, cost?: number, level?: number },
 *   selected?: boolean,
 * }} props
 */
export function SkillNode({ data, selected }) {
  const title = typeof data?.title === 'string' && data.title.trim() ? data.title : 'Untitled'
  const status = data?.status ?? 'locked'
  const statusConfig = getStatusConfig(status)

  const metaParts = []
  if (typeof data?.cost === 'number') metaParts.push(`Cost: ${data.cost}`)
  if (typeof data?.level === 'number') metaParts.push(`Level: ${data.level}`)

  return (
    <div
      className={joinClassNames(
        'w-56 rounded-lg border bg-white px-3 py-2 shadow-sm',
        selected ? 'border-sky-400 ring-2 ring-sky-200' : 'border-slate-200',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
          {metaParts.length ? (
            <div className="mt-0.5 text-xs text-slate-600">{metaParts.join(' • ')}</div>
          ) : null}
        </div>
        <span
          className={joinClassNames(
            'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
            statusConfig.badgeClass,
          )}
          aria-label={`Status: ${statusConfig.label}`}
        >
          {statusConfig.label}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-600"
      />
    </div>
  )
}

SkillNode.propTypes = {
  data: PropTypes.shape({
    cost: PropTypes.number,
    level: PropTypes.number,
    status: PropTypes.oneOf(['locked', 'unlockable', 'unlocked', 'completed']),
    title: PropTypes.string,
  }),
  selected: PropTypes.bool,
}

