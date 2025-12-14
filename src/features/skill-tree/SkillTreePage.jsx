import React from 'react'
import ReactFlow, { Background, Controls, useEdgesState, useNodesState } from 'reactflow'
import 'reactflow/dist/style.css'

import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/hooks/useToast'
import { createId } from '@/lib/utils'
import { CreateSkillForm } from '@/features/skill-tree/CreateSkillForm'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

/**
 * @returns {React.ReactNode}
 */
export function SkillTreePage() {
  const { pushToast } = useToast()

  const [nodes, setNodes, onNodesChange] = useNodesState(() => [
    {
      id: 'root',
      position: { x: 0, y: 0 },
      data: {
        title: 'Root Skill',
        label: 'Root Skill',
        status: /** @type {SkillStatus} */ ('unlockable'),
      },
    },
  ])
  const [edges, _setEdges, onEdgesChange] = useEdgesState([])

  const existingTitles = React.useMemo(() => {
    return nodes
      .map((node) => node?.data?.title)
      .filter((title) => typeof title === 'string')
  }, [nodes])

  const handleCreateSkill = React.useCallback(
    ({ title, description, cost, level }) => {
      const normalizedNewTitle = title.trim().toLowerCase()
      const existing = new Set(existingTitles.map((t) => t.trim().toLowerCase()))
      if (!normalizedNewTitle) {
        pushToast({ variant: 'error', message: 'Title is required.' })
        return
      }
      if (existing.has(normalizedNewTitle)) {
        pushToast({ variant: 'error', message: 'Title must be unique.' })
        return
      }

      const index = nodes.length
      const nextPosition = {
        x: (index % 4) * 220,
        y: Math.floor(index / 4) * 140,
      }

      setNodes((current) => [
        ...current,
        {
          id: createId(),
          position: nextPosition,
          data: {
            title,
            label: title,
            description,
            cost,
            level,
            status: /** @type {SkillStatus} */ ('unlockable'),
          },
        },
      ])

      pushToast({ variant: 'success', message: `Created skill “${title}”.` })
    },
    [existingTitles, nodes.length, pushToast, setNodes],
  )

  return (
    <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
      <Panel className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Create skill</h2>
        <div className="mt-4">
          <CreateSkillForm existingTitles={existingTitles} onCreate={handleCreateSkill} />
        </div>
      </Panel>
      <Panel className="relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Panel>
    </div>
  )
}
