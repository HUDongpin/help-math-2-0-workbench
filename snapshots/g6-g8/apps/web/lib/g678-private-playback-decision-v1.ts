/** New private adapters may acknowledge the actual paused state. Legacy void
 * controls retain their existing requested-state behavior. */
export function resolvePrivatePlaybackPaused(requested: boolean, acknowledgement: unknown): boolean {
  return typeof acknowledgement === 'boolean' ? acknowledgement : requested;
}
