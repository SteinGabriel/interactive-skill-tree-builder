import React from 'react'
import PropTypes from 'prop-types'
import { Handle, Position } from 'reactflow'

import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { CheckIcon } from '@/components/ui/icons/CheckIcon'
import { EditIcon } from '@/components/ui/icons/EditIcon'
import { OpenLockIcon } from '@/components/ui/icons/OpenLockIcon'
import { joinClassNames } from '@/lib/utils'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

/**
 * @param {SkillStatus} status
 */
function getStatusLabel(status) {
  if (status === 'completed') {
    return 'Completed'
  }
  if (status === 'unlocked') {
    return 'Active'
  }
  if (status === 'unlockable') {
    return 'Available'
  }
  return 'Locked'
}

/**
 * @param {SkillStatus} status
 */
function getStatusVisualConfig(status) {
  if (status === 'unlockable') {
    return {
      containerClass: 'bg-white border-sky-400',
      railClass: 'bg-sky-200',
      pillClass: 'bg-sky-50 text-sky-900',
      dotClass: 'bg-sky-500',
    }
  }

  if (status === 'unlocked') {
    return {
      containerClass: 'bg-white border-violet-300',
      railClass: 'bg-violet-200',
      pillClass: 'bg-violet-50 text-violet-800',
      dotClass: 'bg-violet-500',
    }
  }

  if (status === 'completed') {
    return {
      containerClass: 'bg-white border-emerald-200',
      railClass: 'bg-emerald-100',
      pillClass: 'bg-emerald-50 text-emerald-900',
      dotClass: 'bg-emerald-500',
    }
  }

  return {
    containerClass: 'bg-slate-50 border-slate-300',
    railClass: 'bg-slate-400',
    pillClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-500',
  }
}

/**
 * @param {{
 *   data: {
 *     title?: string,
 *     status?: SkillStatus,
 *     cost?: number,
 *     level?: number,
 *     onEdit?: () => void,
 *     search?: { match?: boolean, highlighted?: boolean, dimmed?: boolean },
 *   },
 *   selected?: boolean,
 * }} props
 */
export function SkillNode({ data, selected }) {
  const title = typeof data?.title === 'string' && data.title.trim() ? data.title : 'Untitled'
  const status = data?.status ?? 'locked'
  const statusLabel = getStatusLabel(status)
  const statusVisual = getStatusVisualConfig(status)
  const searchMatch = data?.search?.match === true
  const searchHighlighted = data?.search?.highlighted === true
  const searchDimmed = data?.search?.dimmed === true
  const actionButtonClass = 'h-7 px-2 text-xs'

  const metaParts = []
  if (typeof data?.cost === 'number') metaParts.push(`Cost: ${data.cost}`)
  if (typeof data?.level === 'number') metaParts.push(`Level: ${data.level}`)

  return (
    <div
      className={joinClassNames(
        'relative min-w-56 w-max overflow-hidden rounded-lg border px-3 py-2 shadow-sm',
        statusVisual.containerClass,
        searchDimmed ? 'opacity-30' : null,
        selected ? 'ring-2 ring-sky-200' : null,
        !selected && searchMatch ? 'ring-2 ring-fuchsia-200 shadow-md' : null,
        !selected && !searchMatch && searchHighlighted ? 'ring-1 ring-sky-100 shadow-md' : null,
      )}
    >
      <div
        className={joinClassNames('absolute left-0 top-0 h-full w-1.5', statusVisual.railClass)}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />
      <div className="w-full flex flex-row items-start justify-start gap-2">
        <div className="min-w-0 w-full">
          <div className="w-full flex flex-row items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
            <div className="mr-6">
              <IconButton
                aria-label="Edit skill"
                title="Edit"
                size="sm"
                variant="ghost"
                onClick={data.onEdit}
                disabled={!data.onEdit}
                className="h-7 w-7"
              >
                <EditIcon className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="nodrag flex items-center gap-1.5">
              <div
                className={joinClassNames(
                  'rounded-full px-2 py-0.5 inline-flex items-center gap-1.5',
                  statusVisual.pillClass,
                )}
              >
                <span className={joinClassNames('h-2 w-2 rounded-full', statusVisual.dotClass)} />
                <span className={joinClassNames('text-xs font-medium', statusVisual.pillClass)}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          {metaParts.length ? (
            <div className="mt-0.5 text-xs text-slate-600">{metaParts.join(' • ')}</div>
          ) : null}
        </div>
      </div>
      {status === 'unlockable' ? (
        <div className="nodrag mt-4 flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className={actionButtonClass}
            onClick={data.onUnlock}
          >
            <OpenLockIcon className="h-4 w-4" />
            Unlock
          </Button>
        </div>
      ) : null}
      {status === 'unlocked' ? (
        <div className="nodrag mt-2 flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className={actionButtonClass}
            onClick={data.onComplete}
          >
            <CheckIcon className="h-4 w-4" />
            Complete
          </Button>
        </div>
      ) : null}
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
    onComplete: PropTypes.func,
    onEdit: PropTypes.func,
    onUnlock: PropTypes.func,
    search: PropTypes.shape({
      dimmed: PropTypes.bool,
      highlighted: PropTypes.bool,
      match: PropTypes.bool,
    }),
    status: PropTypes.oneOf(['locked', 'unlockable', 'unlocked', 'completed']),
    title: PropTypes.string,
  }),
  selected: PropTypes.bool,
}
