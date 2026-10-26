/** Install with the exact current renderer surface selector, never runtime-stage.
 * Qualification must bind real browser results, not merely set these fields. */
export function createG678CommittedRuntimeAdapter({surfaceSelector, timerOwnership = 'unsupported', asyncOwnership = 'unsupported'}) {
  return Object.freeze({id: 'g678-product-commit-v1', capabilities: {timerOwnership, asyncOwnership},
    read() {
      const matches = document.querySelectorAll(surfaceSelector);
      if (matches.length > 1) return {status: 'unsupported'};
      const surface = matches[0];
      if (typeof surface?.__g678TechnicalRead === 'function') return surface.__g678TechnicalRead();
      const claimsReady = surface?.getAttribute('data-render-state') === 'ready' || surface?.getAttribute('data-canvas-status') === 'ready' || surface?.hasAttribute('data-p060-phase');
      return {status: claimsReady ? 'unsupported' : 'loading'};
    },
    ownerForOperation(_kind, resource) {
      if (typeof window.__g678ReadOperationOwner !== 'function') return null;
      return window.__g678ReadOperationOwner(resource) ?? window.__g678ReadOperationOwner(resource?.context);
    }});
}
