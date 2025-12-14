import React from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/hooks/useToast'
import { createId } from '@/lib/utils'
import { CreateSkillForm } from '@/features/skill-tree/CreateSkillForm'
import { SkillNode } from '@/features/skill-tree/SkillNode'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

/**
 * @returns {React.ReactNode}
 */
export function SkillTreePage() {
  const { pushToast } = useToast()

  const nodeTypes = React.useMemo(() => ({ skill: SkillNode }), [])

  const [nodes, setNodes, onNodesChange] = useNodesState(() => [
    {
      id: 'root',
      position: { x: 0, y: 0 },
      type: 'skill',
      data: {
        title: 'Root Skill',
        label: 'Root Skill',
        status: /** @type {SkillStatus} */ ('unlockable'),
      },
    },
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = React.useCallback(
    (connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: createId(),
            type: 'smoothstep',
          },
          current,
        ),
      )
    },
    [setEdges],
  )

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
          type: 'skill',
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
    <div className="grid h-dvh grid-cols-1 grid-rows-[auto_1fr] gap-4 p-4 lg:grid-cols-[360px_1fr] lg:grid-rows-1">
      <Panel className="max-h-[40dvh] overflow-auto p-4 lg:max-h-none">
        <h2 className="text-lg font-semibold text-slate-900">Create skill</h2>
        <div className="mt-4">
          <CreateSkillForm existingTitles={existingTitles} onCreate={handleCreateSkill} />
        </div>
      </Panel>
      <Panel className="relative min-h-0 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="h-full w-full"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Panel>
    </div>
  )
}
