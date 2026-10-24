'use client';

import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {SHARED_ALG001_L12_P009_CONFIG} from '../timelines/shared-alg001-l12-p009';
import {P009_TEXT_BINDING, p009TextSnapshot} from '../alg-l12-p009-typography';
import {P009TypographyRenderer} from '../alg-l12-p009-typography-renderer';
import {loadP009TypographyAsset} from '../alg-l12-p009-typography-asset';
import type {RuntimeContext} from '../contract';

export {SHARED_ALG001_L12_P009_SOURCE} from '../timelines/shared-alg001-l12-p009';
const candidate = createSourceStaticCanvasCandidate(SHARED_ALG001_L12_P009_CONFIG);
export const SHARED_ALG001_L12_P009_MOVIE = candidate.movie;
export const SHARED_ALG001_L12_P009_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L12_P009_RENDERER = P009TypographyRenderer;

export default Object.freeze({...candidate.module,
  Renderer: P009TypographyRenderer,
  reducedMotionFrame: 394,
  textPresentation: Object.freeze({
    schemaVersion: 1 as const, binding: P009_TEXT_BINDING,
    Renderer: P009TypographyRenderer,
    reducedMotionFrameByDomain: Object.freeze({'sprite-62': 394}),
    prepare: async () => {await loadP009TypographyAsset();},
    getSnapshot: (_state: unknown, context: RuntimeContext) => p009TextSnapshot(context),
  }),
});
