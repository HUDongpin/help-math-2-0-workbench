'use client';

import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {
  SHARED_ALG001_L12_P002_CONFIG,
  SHARED_ALG001_L12_P002_SOURCE,
} from '../timelines/shared-alg001-l12-p002';

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P002_CONFIG);
const animationModule = Object.freeze({
  ...candidate.module,
  maturity: 'private-current-js' as const,
});

export {SHARED_ALG001_L12_P002_SOURCE};
export const SHARED_ALG001_L12_P002_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P002_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P002_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L12_P002_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L12_P002_RENDERER = candidate.Renderer;
export default animationModule;
