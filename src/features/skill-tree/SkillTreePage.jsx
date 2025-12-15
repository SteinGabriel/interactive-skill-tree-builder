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
  DEFAULT_SKILL_POINTS_TOTAL,
  loadFromLocalStorage,
  saveToLocalStorage,
  SKILL_TREE_STORAGE_KEY,
} from '@/lib/helpers/persistence'
import { SkillForm } from '@/features/skill-tree/SkillForm'
import { SkillNode } from '@/features/skill-tree/SkillNode'
import { deriveNodeStatuses } from '@/lib/helpers/graph'
import { getSkillPointsRequiredForNodeData, getSkillPointsSpent } from '@/lib/helpers/skillPoints'

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
  const skillPointsTotal =
    typeof persisted.skillPointsTotal === 'number'
      ? persisted.skillPointsTotal
      : DEFAULT_SKILL_POINTS_TOTAL

  const hasPersistedGraph = persisted.nodes.length > 0 || persisted.edges.length > 0
  if (!hasPersistedGraph) {
    return { ...createDefaultCanvasState(), skillPointsTotal }
  }

  return {
    skillPointsTotal,
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
  const totalPointsInputId = React.useId()
  const toolbarRef = React.useRef(null)
  const connectSourceNodeIdRef = React.useRef(/** @type {string | null} */ (null))
  const connectSourceHandleTypeRef = React.useRef(/** @type {'source' | 'target' | null} */ (null))
  const [pendingNewNodeId, setPendingNewNodeId] = React.useState(/** @type {string | null} */ (null))
  const [searchQuery, setSearchQuery] = React.useState('')
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null)
  const [createSkillModalOpen, setCreateSkillModalOpen] = React.useState(false)
  const [editingNodeId, setEditingNodeId] = React.useState(null)
  const [skillPointsTotal, setSkillPointsTotal] = React.useState(() => {
    return typeof initialState.skillPointsTotal === 'number'
      ? initialState.skillPointsTotal
      : DEFAULT_SKILL_POINTS_TOTAL
  })
  const [skillPointsTotalDraft, setSkillPointsTotalDraft] = React.useState(() => {
    return String(
      typeof initialState.skillPointsTotal === 'number'
        ? initialState.skillPointsTotal
        : DEFAULT_SKILL_POINTS_TOTAL,
    )
  })

  const [nodes, setNodes, onNodesChange] = useNodesState(() => initialState.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => initialState.edges)

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const skillPointsSpent = React.useMemo(() => getSkillPointsSpent(nodes), [nodes])
  const formattedSkillPointsSpent = React.useMemo(() => {
    return Number.isInteger(skillPointsSpent)
      ? String(skillPointsSpent)
      : skillPointsSpent.toFixed(1)
  }, [skillPointsSpent])

  React.useEffect(() => {
    if (createSkillModalOpen) return

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return
      if (event.key !== 'Tab' || event.shiftKey) return

      const active = document.activeElement
      const isPageLevelFocus =
        !active || active === document.body || active === document.documentElement

      const toolbar = toolbarRef.current
      if (!toolbar) return

      const candidates = Array.from(
        toolbar.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      )

      const focusables = candidates.filter((element) => {
        if (!(element instanceof HTMLElement)) return false
        if (element.getAttribute('disabled') !== null) return false
        if (element.getAttribute('aria-disabled') === 'true') return false
        return element.tabIndex >= 0
      })

      if (focusables.length === 0) return

      if (isPageLevelFocus) {
        event.preventDefault()
        focusables[0].focus()
        return
      }

      const lastFocusable = focusables[focusables.length - 1]
      if (active !== lastFocusable) return

      const firstNodeId = nodes[0]?.id
      if (typeof firstNodeId !== 'string' || firstNodeId.trim() === '') return

      const firstNodeElement = /** @type {HTMLElement | null} */ (
        document.querySelector(`[data-skill-node-id="${firstNodeId}"]`)
      )
      if (!firstNodeElement) return

      event.preventDefault()
      firstNodeElement.focus()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [createSkillModalOpen, nodes])

  React.useEffect(() => {
    setSkillPointsTotalDraft(String(skillPointsTotal))
  }, [skillPointsTotal])

  const commitSkillPointsTotalDraft = React.useCallback(() => {
    const raw = skillPointsTotalDraft.trim()
    if (raw === '') {
      setSkillPointsTotalDraft(String(skillPointsTotal))
      return
    }

    const nextNumber = Number(raw)
    if (!Number.isFinite(nextNumber)) {
      setSkillPointsTotalDraft(String(skillPointsTotal))
      return
    }

    let nextTotal = Math.max(0, Math.floor(nextNumber))
    if (nextTotal < skillPointsSpent) {
      pushToast({
        variant: 'error',
        message: `Total skill points cannot be less than spent points (${skillPointsSpent}).`,
      })
      nextTotal = Math.ceil(skillPointsSpent)
    }

    setSkillPointsTotal(nextTotal)
    setSkillPointsTotalDraft(String(nextTotal))
  }, [pushToast, skillPointsSpent, skillPointsTotal, skillPointsTotalDraft])

  const handleUnlockSkill = React.useCallback(
    (nodeId) => {
      const targetNode = nodes.find((node) => node.id === nodeId)
      if (!targetNode) return

      if (targetNode.data.status !== 'unlockable') {
        pushToast({ variant: 'error', message: 'That skill is not unlockable yet.' })
        return
      }

      const requiredPoints = getSkillPointsRequiredForNodeData(targetNode.data)
      const pointsSpent = getSkillPointsSpent(nodes)
      const pointsAvailable = skillPointsTotal - pointsSpent

      if (requiredPoints > pointsAvailable) {
        pushToast({
          variant: 'error',
          message: `Not enough skill points. Need ${requiredPoints}, but only ${pointsAvailable} available.`,
        })
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
    [nodes, pushToast, setNodes, skillPointsTotal],
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
        onEdit: () => {
          setEditingNodeId(node.id)
          setCreateSkillModalOpen(true)
        },
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
    saveToLocalStorage({ nodes, edges, skillPointsTotal })
  }, [edges, nodes, skillPointsTotal])

  const existingTitles = React.useMemo(() => {
    return nodes.map((node) => node?.data?.title).filter((title) => typeof title === 'string')
  }, [nodes])

  const getNextNewSkillTitle = React.useCallback(() => {
    const existing = new Set(existingTitles.map((title) => title.trim().toLowerCase()))
    const base = 'New Skill'
    const baseNormalized = base.toLowerCase()
    if (!existing.has(baseNormalized)) return base

    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = `${base} ${suffix}`
      if (!existing.has(candidate.toLowerCase())) return candidate
    }

    return `${base} ${createId().slice(0, 6)}`
  }, [existingTitles])

  const editingNode = React.useMemo(() => {
    if (!editingNodeId) return null
    return nodes.find((node) => node.id === editingNodeId) ?? null
  }, [editingNodeId, nodes])

  const titlesExcludingEditingNode = React.useMemo(() => {
    if (!editingNodeId) return existingTitles

    return nodes
      .filter((node) => node.id !== editingNodeId)
      .map((node) => node?.data?.title)
      .filter((title) => typeof title === 'string')
  }, [editingNodeId, existingTitles, nodes])

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
      if (created) {
        setCreateSkillModalOpen(false)
        setEditingNodeId(null)
      }
      return created
    },
    [handleCreateSkill],
  )

  const handleEditSkillFromModal = React.useCallback(
    ({ title, description, cost, level }) => {
      if (!editingNodeId) return false
      const wasPendingNewSkill = pendingNewNodeId === editingNodeId

      const normalizedNewTitle = title.trim().toLowerCase()
      const existing = new Set(titlesExcludingEditingNode.map((t) => t.trim().toLowerCase()))
      if (!normalizedNewTitle) {
        pushToast({ variant: 'error', message: 'Title is required.' })
        return false
      }
      if (existing.has(normalizedNewTitle)) {
        pushToast({ variant: 'error', message: 'Title must be unique.' })
        return false
      }

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== editingNodeId) return node
          return {
            ...node,
            data: {
              ...node.data,
              title,
              label: title,
              description,
              cost,
              level,
            },
          }
        }),
      )

      if (wasPendingNewSkill) {
        setPendingNewNodeId(null)
      }

      setCreateSkillModalOpen(false)
      setEditingNodeId(null)
      pushToast({
        variant: 'success',
        message: wasPendingNewSkill ? `Created skill “${title}”.` : `Updated skill “${title}”.`,
      })
      return true
    },
    [editingNodeId, pendingNewNodeId, pushToast, setNodes, titlesExcludingEditingNode],
  )

  const handleResetTree = React.useCallback(() => {
    const confirmed = window.confirm('Reset skill tree? This clears all skills and prerequisites.')
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
    setEditingNodeId(null)
    setSearchQuery('')
    setSkillPointsTotal(DEFAULT_SKILL_POINTS_TOTAL)
    setSkillPointsTotalDraft(String(DEFAULT_SKILL_POINTS_TOTAL))
    pushToast({ variant: 'success', message: 'Skill tree reset.' })
    reactFlowInstance?.fitView?.({ padding: 0.25 })
  }, [pushToast, reactFlowInstance, setEdges, setNodes])

  const onConnectStart = React.useCallback((_, params) => {
    connectSourceNodeIdRef.current = params?.nodeId ?? null
    connectSourceHandleTypeRef.current = params?.handleType ?? null
  }, [])

  const onConnectEnd = React.useCallback(
    (event) => {
      const sourceNodeId = connectSourceNodeIdRef.current
      const handleType = connectSourceHandleTypeRef.current
      connectSourceNodeIdRef.current = null
      connectSourceHandleTypeRef.current = null

      if (!sourceNodeId) return
      if (handleType !== 'source') return
      if (!reactFlowInstance) return

      const target = /** @type {HTMLElement | null} */ (event?.target ?? null)
      if (target?.closest?.('.react-flow__handle')) return
      if (target?.closest?.('.react-flow__node')) return

      const droppedOnPane = Boolean(target?.closest?.('.react-flow__pane'))
      if (!droppedOnPane) return

      let clientX = 0
      let clientY = 0

      if ('changedTouches' in event && event.changedTouches?.length) {
        clientX = event.changedTouches[0].clientX
        clientY = event.changedTouches[0].clientY
      } else if ('clientX' in event && 'clientY' in event) {
        clientX = event.clientX
        clientY = event.clientY
      } else {
        return
      }

      const screenToFlowPosition =
        reactFlowInstance.screenToFlowPosition ?? reactFlowInstance.project
      if (typeof screenToFlowPosition !== 'function') return

      const position = screenToFlowPosition({ x: clientX, y: clientY })

      const newNodeId = createId()
      const newNodeTitle = getNextNewSkillTitle()

      setPendingNewNodeId(newNodeId)

      setNodes((current) => [
        ...current,
        {
          id: newNodeId,
          position,
          type: 'skill',
          data: {
            title: newNodeTitle,
            label: newNodeTitle,
            description: '',
            cost: 1,
            level: 1,
            status: /** @type {SkillStatus} */ ('locked'),
          },
        },
      ])

      setEdges((current) => {
        const validation = validateEdgeCreation({
          source: sourceNodeId,
          target: newNodeId,
          edges: current.map((edge) => ({ source: edge.source, target: edge.target })),
        })

        if (!validation.ok) return current

        return addEdge(
          {
            id: createId(),
            source: sourceNodeId,
            target: newNodeId,
            type: 'smoothstep',
          },
          current,
        )
      })

      setEditingNodeId(newNodeId)
      setCreateSkillModalOpen(true)
    },
    [getNextNewSkillTitle, reactFlowInstance, setEdges, setNodes, setPendingNewNodeId],
  )

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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={setReactFlowInstance}
          fitView
          className="h-full w-full"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <Panel
        ref={toolbarRef}
        className="absolute left-4 right-4 top-4 z-10 mx-auto px-2 py-2 shadow-md w-fit max-w-full"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-1 text-sm font-semibold text-slate-900">Skill Tree</div>
          <div
            className="flex items-center rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-700"
            aria-label={`Skill points spent ${formattedSkillPointsSpent} of ${skillPointsTotal}`}
          >
            <span className="font-medium text-slate-900">{formattedSkillPointsSpent}</span>
            <span className="mx-1 text-slate-500" aria-hidden="true">
              /
            </span>
            <label htmlFor={totalPointsInputId} className="sr-only">
              Total skill points
            </label>
            <input
              id={totalPointsInputId}
              aria-label="Total skill points"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={skillPointsTotalDraft}
              onChange={(event) => {
                setSkillPointsTotalDraft(event.target.value)
              }}
              onBlur={commitSkillPointsTotalDraft}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitSkillPointsTotalDraft()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setSkillPointsTotalDraft(String(skillPointsTotal))
                }
              }}
              className="h-6 w-14 rounded-md border border-slate-200 bg-white px-1 text-right text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ring-offset-white"
            />
            <span className="ml-1 text-slate-600">points</span>
          </div>
          <div className="h-5 w-px bg-slate-200" aria-hidden />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setEditingNodeId(null)
              setCreateSkillModalOpen(true)
            }}
          >
            Add Skill
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
          <div className="h-5 w-px bg-slate-200" aria-hidden />
          <Button size="sm" variant="secondary" onClick={handleResetTree}>
            Reset Skill Tree
          </Button>
        </div>
      </Panel>

      <Modal
        open={createSkillModalOpen}
        title={editingNodeId && pendingNewNodeId !== editingNodeId ? 'Edit skill' : 'New skill'}
        onClose={() => {
          if (pendingNewNodeId && pendingNewNodeId === editingNodeId) {
            setPendingNewNodeId(null)
            setNodes((current) => current.filter((node) => node.id !== pendingNewNodeId))
            setEdges((current) =>
              current.filter(
                (edge) => edge.source !== pendingNewNodeId && edge.target !== pendingNewNodeId,
              ),
            )
          }
          setCreateSkillModalOpen(false)
          setEditingNodeId(null)
        }}
      >
        <SkillForm
          existingTitles={editingNodeId ? titlesExcludingEditingNode : existingTitles}
          initialValues={
            editingNodeId
              ? {
                  title: editingNode?.data?.title,
                  description: editingNode?.data?.description,
                  cost: editingNode?.data?.cost,
                  level: editingNode?.data?.level,
                }
              : undefined
          }
          submitLabel={
            editingNodeId && pendingNewNodeId !== editingNodeId ? 'Save changes' : 'Create skill'
          }
          onSubmit={editingNodeId ? handleEditSkillFromModal : handleCreateSkillFromModal}
        />
      </Modal>
    </div>
  )
}
