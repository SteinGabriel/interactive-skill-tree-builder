/**
 * Joins className strings, ignoring falsy values.
 * @param {...(string | false | null | undefined)} values
 * @returns {string}
 */
export function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

