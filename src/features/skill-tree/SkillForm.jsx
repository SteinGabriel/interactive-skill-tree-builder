import React from 'react'

import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { TextInput } from '@/components/ui/TextInput'

function normalizeTitle(rawTitle) {
  return rawTitle.trim().toLowerCase()
}

/**
 * @param {{
 *   existingTitles: string[],
 *   initialValues?: { title?: string, description?: string, cost?: number, level?: number },
 *   submitLabel?: string,
 *   onSubmit: (args: { title: string, description?: string, cost?: number, level?: number }) => boolean,
 * }} props
 */
export function SkillForm({
  existingTitles,
  initialValues,
  submitLabel = 'Create skill',
  onSubmit,
}) {
  const createDefaults = React.useMemo(() => ({ cost: 1, level: 1 }), [])

  const [title, setTitle] = React.useState(initialValues?.title ?? '')
  const [description, setDescription] = React.useState(initialValues?.description ?? '')
  const [cost, setCost] = React.useState(() => {
    if (typeof initialValues?.cost === 'number') return String(initialValues.cost)
    if (initialValues) return ''
    return String(createDefaults.cost)
  })
  const [level, setLevel] = React.useState(() => {
    if (typeof initialValues?.level === 'number') return String(initialValues.level)
    if (initialValues) return ''
    return String(createDefaults.level)
  })

  React.useEffect(() => {
    setTitle(initialValues?.title ?? '')
    setDescription(initialValues?.description ?? '')
    setCost(() => {
      if (typeof initialValues?.cost === 'number') return String(initialValues.cost)
      if (initialValues) return ''
      return String(createDefaults.cost)
    })
    setLevel(() => {
      if (typeof initialValues?.level === 'number') return String(initialValues.level)
      if (initialValues) return ''
      return String(createDefaults.level)
    })
  }, [createDefaults.cost, createDefaults.level, initialValues])

  const normalizedTitles = React.useMemo(() => {
    return new Set(existingTitles.map(normalizeTitle))
  }, [existingTitles])

  const titleError = React.useMemo(() => {
    const normalized = normalizeTitle(title)
    if (title.length === 0) return undefined
    if (normalized.length === 0) return 'Title is required.'
    if (normalizedTitles.has(normalized)) return 'Title must be unique.'
    return undefined
  }, [normalizedTitles, title])

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextTitle = title.trim()
    if (!nextTitle) return
    if (normalizedTitles.has(normalizeTitle(nextTitle))) return

    const nextCost = cost.trim() ? Number(cost) : undefined
    const nextLevel = level.trim() ? Number(level) : undefined

    const saved = onSubmit({
      title: nextTitle,
      description: description.trim() ? description.trim() : undefined,
      cost: Number.isFinite(nextCost) ? nextCost : undefined,
      level: Number.isFinite(nextLevel) ? nextLevel : undefined,
    })

    if (saved) {
      setTitle('')
      setDescription('')
      setCost(String(createDefaults.cost))
      setLevel(String(createDefaults.level))
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. OAuth Basics"
        hint="Titles must be unique (case-insensitive)."
        error={titleError}
        required
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput
          label="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="e.g. 2"
        />
        <TextInput
          label="Level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="e.g. 1"
        />
      </div>
      <TextArea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description…"
      />
      <div className="flex items-center justify-end">
        <Button type="submit" disabled={Boolean(titleError) || !title.trim()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
