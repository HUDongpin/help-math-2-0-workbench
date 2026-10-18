/** Registry group for an animation key: its lesson (`g04-l03`) or `misc`. Mirrored by scripts/generate-registry.mjs. */
export function animationRegistryGroupForKey(key: string): string {
  return /^course-(g0\d-l\d\d)-/u.exec(key)?.[1] ?? 'misc';
}
