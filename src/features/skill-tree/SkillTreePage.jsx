import React from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/hooks/useToast'
import { createId } from '@/lib/utils'
import { validateEdgeCreation } from '@/lib/helpers/graph'
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/helpers/persistence'
import { CreateSkillForm } from '@/features/skill-tree/CreateSkillForm'
import { SkillNode } from '@/features/skill-tree/SkillNode'
import { deriveNodeStatuses } from '@/lib/helpers/graph'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

function getInitialState() {
  const persisted = loadFromLocalStorage()
  const hasPersistedState = persisted.nodes.length > 0 || persisted.edges.length > 0

  if (!hasPersistedState) {
    return {
      nodes: [
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
      ],
      edges: [],
    }
  }

  return {
    nodes: persisted.nodes.map((node) => ({
      ...node,
      type: 'skill',
      data: {
        ...node.data,
        label: node.data.title,
      },
    })),
    edges: persisted.edges.map((edge) => ({
      ...edge,
      type: 'smoothstep',
    })),
  }
}

/**
 * @returns {React.ReactNode}
 */
export function SkillTreePage() {
  const { pushToast } = useToast()

  const nodeTypes = React.useMemo(() => ({ skill: SkillNode }), [])

  const [initialState] = React.useState(() => getInitialState())

  const [nodes, setNodes, onNodesChange] = useNodesState(
    () => initialState.nodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    () => initialState.edges,
  )

  const handleUnlockSkill = React.useCallback(
    (nodeId) => {
      const targetNode = nodes.find((node) => node.id === nodeId)
      if (!targetNode) return

      if (targetNode.data.status !== 'unlockable') {
        pushToast({ variant: 'error', message: 'That skill is not unlockable yet.' })
        return
      }

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node
          return {
            ...node,
            data: {
              ...node.data,
              status: /** @type {SkillStatus} */ ('unlocked'),
            },
          }
        }),
      )
    },
    [nodes, pushToast, setNodes],
  )

  const handleCompleteSkill = React.useCallback(
    (nodeId) => {
      const targetNode = nodes.find((node) => node.id === nodeId)
      if (!targetNode) return

      if (targetNode.data.status !== 'unlocked') {
        pushToast({ variant: 'error', message: 'That skill is not unlocked yet.' })
        return
      }

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node
          return {
            ...node,
            data: {
              ...node.data,
              status: /** @type {SkillStatus} */ ('completed'),
            },
          }
        }),
      )
    },
    [nodes, pushToast, setNodes],
  )

  const nodesForRender = React.useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onUnlock: () => handleUnlockSkill(node.id),
        onComplete: () => handleCompleteSkill(node.id),
      },
    }))
  }, [handleCompleteSkill, handleUnlockSkill, nodes])

  const onConnect = React.useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return

      setEdges((current) => {
        const validation = validateEdgeCreation({
          source: connection.source,
          target: connection.target,
          edges: current.map((edge) => ({ source: edge.source, target: edge.target })),
        })

        if (!validation.ok) {
          const messageByReason = {
            self_loop: 'A skill cannot require itself.',
            duplicate: 'That prerequisite already exists.',
            direct_cycle: 'That prerequisite would create a direct cycle.',
          }

          pushToast({
            variant: 'error',
            message: messageByReason[validation.reason] ?? 'Invalid prerequisite.',
          })
          return current
        }

        return addEdge(
          {
            ...connection,
            id: createId(),
            type: 'smoothstep',
          },
          current,
        )
      })
    },
    [pushToast, setEdges],
  )

  React.useEffect(() => {
    const simplifiedEdges = edges.map((edge) => ({ source: edge.source, target: edge.target }))
    const derivedNodes = deriveNodeStatuses(nodes, simplifiedEdges)
    const hasChanges = derivedNodes.some((node, index) => node !== nodes[index])
    if (!hasChanges) return
    setNodes(derivedNodes)
  }, [edges, nodes, setNodes])

  React.useEffect(() => {
    saveToLocalStorage({ nodes, edges })
  }, [edges, nodes])

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
          nodes={nodesForRender}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            style: { stroke: '#64748b', strokeWidth: 2 },
          }}
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
