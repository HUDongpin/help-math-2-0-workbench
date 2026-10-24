/** Canvas repainting must not reset the already initialized transport clock. */
export function p006TransportReady(previous: boolean, canvasStatus: string | null | undefined): boolean {
  return canvasStatus === 'ready' || (previous && canvasStatus === 'updating');
}

/** Reduced motion suppresses automatic startup, not an explicit user Play. */
export function p006ShouldPause(input: {
  requestedPause: boolean;
  ready: boolean;
  glossaryPending: boolean;
  automaticStart?: boolean;
  reducedMotion?: boolean;
}): boolean {
  return input.requestedPause || !input.ready || input.glossaryPending ||
    (input.automaticStart === true && input.reducedMotion === true);
}
