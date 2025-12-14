import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { TextInput } from '@/components/ui/TextInput'

function normalizeTitle(rawTitle) {
  return rawTitle.trim().toLowerCase()
}

/**
 * @param {{
 *   existingTitles: string[],
 *   onCreate: (args: { title: string, description?: string, cost?: number, level?: number }) => boolean,
 * }} props
 */
export function CreateSkillForm({ existingTitles, onCreate }) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [cost, setCost] = React.useState('')
  const [level, setLevel] = React.useState('')

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

    const created = onCreate({
      title: nextTitle,
      description: description.trim() ? description.trim() : undefined,
      cost: Number.isFinite(nextCost) ? nextCost : undefined,
      level: Number.isFinite(nextLevel) ? nextLevel : undefined,
    })

    if (created) {
      setTitle('')
      setDescription('')
      setCost('')
      setLevel('')
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
          Create skill
        </Button>
      </div>
    </form>
  )
}

CreateSkillForm.propTypes = {
  existingTitles: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCreate: PropTypes.func.isRequired,
}
