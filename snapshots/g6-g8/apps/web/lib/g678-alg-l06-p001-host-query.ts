/** The private My Lesson language link adds mode=focus to its local host URL. */
export function isP001LocalHostQuery(query: Record<string, string | string[] | undefined>): boolean {
  return query.host === '1' &&
    Object.keys(query).every(key => key === 'host' || key === 'mode') &&
    (query.mode === undefined || query.mode === 'focus');
}
