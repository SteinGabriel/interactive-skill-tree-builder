import React from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

import { Panel } from '@/components/ui/Panel'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

/**
 * @returns {React.ReactNode}
 */
export function SkillTreePage() {
  const initialNodes = React.useMemo(
    () => [
      {
        id: 'root',
        position: { x: 0, y: 0 },
        data: { status: /** @type {SkillStatus} */ ('unlockable') },
      },
    ],
    [],
  )

  return (
    <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
      <Panel className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Controls</h2>
        <p className="mt-2 text-sm text-slate-600">
          Skill creation and search will live here.
        </p>
      </Panel>
      <Panel className="relative overflow-hidden">
        <ReactFlow nodes={initialNodes} edges={[]} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </Panel>
    </div>
  )
}

