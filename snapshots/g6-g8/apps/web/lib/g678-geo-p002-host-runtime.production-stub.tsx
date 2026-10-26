'use client';

/** Production route closure: the P002 host probe and its source assets never
 * enter a public client bundle. The route itself also returns 404. */
export const GEO_L06_P002_RUNTIME_ADAPTER = Object.freeze({
  animationId: 'shared-geo001-l06-p002',
  audioEnabled: false,
  Component: () => null,
});
