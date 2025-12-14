/**
 * Joins className strings, ignoring falsy values.
 * @param {...(string | false | null | undefined)} values
 * @returns {string}
 */
export function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

/**
 * Generates a reasonably-unique id for client-side usage.
 * Prefers `crypto.randomUUID()` when available.
 * @returns {string}
 */
export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}
