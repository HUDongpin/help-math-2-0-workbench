'use client';

import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {SHARED_ALG001_L12_P010_CONFIG} from '../timelines/shared-alg001-l12-p010';
import {P010_TEXT_BINDING, p010TextSnapshot} from '../alg-l12-p010-typography';
import {P010TypographyRenderer} from '../alg-l12-p010-typography-renderer';
import {loadP010TypographyAsset} from '../alg-l12-p010-typography-asset';
import type {RuntimeContext} from '../contract';

export {SHARED_ALG001_L12_P010_SOURCE} from '../timelines/shared-alg001-l12-p010';
const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P010_CONFIG);
export const SHARED_ALG001_L12_P010_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P010_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P010_RENDERER = P010TypographyRenderer;

export default Object.freeze({...candidate.module,
  Renderer: P010TypographyRenderer,
  reducedMotionFrame: 465,
  textPresentation: Object.freeze({
    schemaVersion: 1 as const, binding: P010_TEXT_BINDING,
    Renderer: P010TypographyRenderer,
    reducedMotionFrameByDomain: Object.freeze({'sprite-96': 465}),
    prepare: async () => {await loadP010TypographyAsset();},
    getSnapshot: (_state: unknown, context: RuntimeContext) => p010TextSnapshot(context),
  }),
});
