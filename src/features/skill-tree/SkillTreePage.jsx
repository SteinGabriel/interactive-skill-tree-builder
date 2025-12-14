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
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { TextInput } from '@/components/ui/TextInput'
import { useToast } from '@/hooks/useToast'
import { createId } from '@/lib/utils'
import { getSearchHighlightSets, validateEdgeCreation } from '@/lib/helpers/graph'
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  SKILL_TREE_STORAGE_KEY,
} from '@/lib/helpers/persistence'
import { CreateSkillForm } from '@/features/skill-tree/CreateSkillForm'
import { SkillNode } from '@/features/skill-tree/SkillNode'
import { deriveNodeStatuses } from '@/lib/helpers/graph'

/**
 * @typedef {import('@/lib/types').SkillStatus} SkillStatus
 */

function createDefaultCanvasState() {
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

function getInitialState() {
  const persisted = loadFromLocalStorage()
  const hasPersistedState = persisted.nodes.length > 0 || persisted.edges.length > 0

  if (!hasPersistedState) {
    return createDefaultCanvasState()
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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null)
  const [createSkillModalOpen, setCreateSkillModalOpen] = React.useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState(
    () => initialState.nodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    () => initialState.edges,
  )

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

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

  const simplifiedEdges = React.useMemo(() => {
    return edges.map((edge) => ({ source: edge.source, target: edge.target }))
  }, [edges])

  const searchHighlight = React.useMemo(() => {
    return getSearchHighlightSets({
      nodes: nodes.map((node) => ({ id: node.id, data: { title: node?.data?.title } })),
      edges: simplifiedEdges,
      query: normalizedSearchQuery,
    })
  }, [nodes, normalizedSearchQuery, simplifiedEdges])

  const searchHasMatches = normalizedSearchQuery && searchHighlight.matchNodeIds.size > 0

  const handleFitView = React.useCallback(() => {
    reactFlowInstance?.fitView?.({ padding: 0.25 })
  }, [reactFlowInstance])

  const handleZoomIn = React.useCallback(() => {
    reactFlowInstance?.zoomIn?.()
  }, [reactFlowInstance])

  const handleZoomOut = React.useCallback(() => {
    reactFlowInstance?.zoomOut?.()
  }, [reactFlowInstance])

  const nodesForRender = React.useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onUnlock: () => handleUnlockSkill(node.id),
        onComplete: () => handleCompleteSkill(node.id),
        search: searchHasMatches
          ? {
              match: searchHighlight.matchNodeIds.has(node.id),
              highlighted: searchHighlight.highlightedNodeIds.has(node.id),
              dimmed: !searchHighlight.highlightedNodeIds.has(node.id),
            }
          : undefined,
      },
    }))
  }, [handleCompleteSkill, handleUnlockSkill, nodes, searchHasMatches, searchHighlight])

  const edgesForRender = React.useMemo(() => {
    if (!searchHasMatches) return edges

    return edges.map((edge) => {
      const edgeKey = `${edge.source}->${edge.target}`
      const highlighted = searchHighlight.highlightedEdgeKeys.has(edgeKey)

      const style = highlighted
        ? { ...edge.style, opacity: 0.9, stroke: '#0ea5e9', strokeWidth: 3 }
        : { ...edge.style, opacity: 0.15, stroke: '#94a3b8', strokeWidth: 2 }

      const markerEnd = highlighted
        ? { type: MarkerType.ArrowClosed, color: '#0ea5e9' }
        : { type: MarkerType.ArrowClosed, color: '#94a3b8' }

      return {
        ...edge,
        style,
        markerEnd,
      }
    })
  }, [edges, searchHasMatches, searchHighlight])

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
    const derivedNodes = deriveNodeStatuses(nodes, simplifiedEdges)
    const hasChanges = derivedNodes.some((node, index) => node !== nodes[index])
    if (!hasChanges) return
    setNodes(derivedNodes)
  }, [nodes, setNodes, simplifiedEdges])

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
        return false
      }
      if (existing.has(normalizedNewTitle)) {
        pushToast({ variant: 'error', message: 'Title must be unique.' })
        return false
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
      return true
    },
    [existingTitles, nodes.length, pushToast, setNodes],
  )

  const handleCreateSkillFromModal = React.useCallback(
    (args) => {
      const created = handleCreateSkill(args)
      if (created) setCreateSkillModalOpen(false)
      return created
    },
    [handleCreateSkill],
  )

  const handleResetTree = React.useCallback(() => {
    const confirmed = window.confirm(
      'Reset skill tree? This clears all skills and prerequisites.',
    )
    if (!confirmed) return

    try {
      window.localStorage.removeItem(SKILL_TREE_STORAGE_KEY)
    } catch {
      // ignore storage errors; we still reset in-memory state
    }

    const defaults = createDefaultCanvasState()
    setNodes(defaults.nodes)
    setEdges(defaults.edges)
    setCreateSkillModalOpen(false)
    setSearchQuery('')
    pushToast({ variant: 'success', message: 'Skill tree reset.' })
    reactFlowInstance?.fitView?.({ padding: 0.25 })
  }, [pushToast, reactFlowInstance, setEdges, setNodes])

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-slate-50">
      <div className="absolute inset-0">
        <ReactFlow
          nodes={nodesForRender}
          edges={edgesForRender}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
            style: { stroke: '#64748b', strokeWidth: 2 },
          }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          fitView
          className="h-full w-full"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <Panel className="absolute left-1/2 top-4 z-10 -translate-x-1/2 px-2 py-2 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-1 text-sm font-semibold text-slate-900">Skill Tree</div>
          <div className="h-5 w-px bg-slate-200" aria-hidden />
          <div className="w-full sm:w-56">
            <TextInput
              aria-label="Search skills"
              type="search"
              autoComplete="off"
              placeholder="Search…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-8 px-2 py-1"
            />
          </div>
          {searchHasMatches ? (
            <div className="px-1 text-sm text-slate-600">
              Matches {searchHighlight.matchNodeIds.size} • Highlighting{' '}
              {searchHighlight.highlightedNodeIds.size}
            </div>
          ) : normalizedSearchQuery ? (
            <div className="px-1 text-sm text-slate-600">No matches</div>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setCreateSkillModalOpen(true)}>
            New Skill
          </Button>
          <Button size="sm" variant="secondary" onClick={handleResetTree}>
            Reset
          </Button>
          <div className="h-5 w-px bg-slate-200" aria-hidden />
          <IconButton
            aria-label="Zoom out"
            title="Zoom out"
            size="sm"
            variant="secondary"
            onClick={handleZoomOut}
          >
            −
          </IconButton>
          <IconButton
            aria-label="Zoom in"
            title="Zoom in"
            size="sm"
            variant="secondary"
            onClick={handleZoomIn}
          >
            +
          </IconButton>
          <IconButton
            aria-label="Fit view"
            title="Fit view"
            size="sm"
            variant="secondary"
            onClick={handleFitView}
          >
            Fit
          </IconButton>
        </div>
      </Panel>

      <Modal
        open={createSkillModalOpen}
        title="New skill"
        onClose={() => setCreateSkillModalOpen(false)}
      >
        <CreateSkillForm existingTitles={existingTitles} onCreate={handleCreateSkillFromModal} />
      </Modal>
    </div>
  )
}
