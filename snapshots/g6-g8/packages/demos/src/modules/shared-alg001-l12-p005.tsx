'use client';

import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {SHARED_ALG001_L12_P005_CONFIG, SHARED_ALG001_L12_P005_SOURCE} from '../timelines/shared-alg001-l12-p005';
import {P005_TEXT_BINDING, p005TextSnapshot} from '../alg-l12-p005-typography';
import {P005TypographyRenderer} from '../alg-l12-p005-typography-renderer';
import {loadP005TypographyAsset} from '../alg-l12-p005-typography-asset';
import type {RuntimeContext} from '../contract';

const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P005_CONFIG);
export {SHARED_ALG001_L12_P005_SOURCE};
export const SHARED_ALG001_L12_P005_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P005_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P005_RENDERER = candidate.Renderer;
export default Object.freeze({...candidate.module, textPresentation: Object.freeze({
  schemaVersion: 1 as const, binding: P005_TEXT_BINDING,
  Renderer: P005TypographyRenderer,
  reducedMotionFrameByDomain: Object.freeze({'sprite-391': 1}),
  prepare: async () => {await loadP005TypographyAsset();},
  getSnapshot: (_state: unknown, context: RuntimeContext) => p005TextSnapshot(context),
})});
