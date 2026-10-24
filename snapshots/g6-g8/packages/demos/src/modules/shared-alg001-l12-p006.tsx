'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {SHARED_ALG001_L12_P006_CONFIG, SHARED_ALG001_L12_P006_SOURCE} from '../timelines/shared-alg001-l12-p006';
import {P006_TEXT_BINDING, p006TextSnapshot} from '../alg-l12-p006-typography';
import {P006TypographyRenderer} from '../alg-l12-p006-typography-renderer';
import {loadP006TypographyAsset} from '../alg-l12-p006-typography-asset';
import type {RuntimeContext} from '../contract';
const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P006_CONFIG);
export {SHARED_ALG001_L12_P006_SOURCE};
export const SHARED_ALG001_L12_P006_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P006_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P006_RENDERER = candidate.Renderer;
export default Object.freeze({...candidate.module, textPresentation: Object.freeze({
  schemaVersion: 1 as const, binding: P006_TEXT_BINDING,
  Renderer: P006TypographyRenderer,
  reducedMotionFrameByDomain: Object.freeze({'sprite-53': 1}),
  prepare: async () => {await loadP006TypographyAsset();},
  getSnapshot: (_state: unknown, context: RuntimeContext) => p006TextSnapshot(context),
})});
