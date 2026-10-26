'use client';
import type {AnimationModule, RuntimeContext} from '../contract';
import {GeoL06P002Renderer} from '../geo-l06-p002-renderer-v1';
import {GEO_L06_P002_SOURCE, GEO_L06_P002_REDUCED_MOTION_FRAME,
  geoL06P002MainState, geoL06P002RootState,
  type GeoL06P002MainState, type GeoL06P002RootState} from '../geo-l06-p002-display-state-v1';

type State = GeoL06P002MainState | GeoL06P002RootState;
const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}),
  fps: 12, frameCount: 10, durationMs: 10000 / 12});

function getFrameState(frame: number, context: RuntimeContext): State {
  return context.frameDomain === 'root'
    ? geoL06P002RootState(frame, context)
    : geoL06P002MainState(frame, context);
}

/** Private module identity only. The real My Lesson audio/glossary adapter and
 * exact source/asset freeze are required before registry admission. */
const animationModule: AnimationModule<State> & {privateGeoL06Area: typeof GEO_L06_P002_SOURCE} = Object.freeze({
  key: 'shared-geo001-l06-p002', movie, maturity: 'private-current-js',
  runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-230',
    frameDomains: Object.freeze([{id: 'root', frameCount: 10},
      {id: 'sprite-230', frameCount: 1216, rootFrame: 6}])}),
  playbackMode: 'once', playbackEndFrameByDomain: Object.freeze({root: 1, 'sprite-230': 1216}),
  reducedMotionFrame: GEO_L06_P002_REDUCED_MOTION_FRAME,
  scenarios: Object.freeze([{id: 'default', label: 'Area in a two-dimensional figure'}]),
  defaultScenarioByFrameDomain: Object.freeze({root: 'default', 'sprite-230': 'default'}),
  audioCues: Object.freeze([]),
  lessonHost: Object.freeze({capabilities: Object.freeze(['glossary'] as const),
    legacyOperations: 'blocked' as const, auditStorage: 'memory-only' as const,
    storesPersonalData: false as const}),
  Renderer: GeoL06P002Renderer, getFrameState,
  privateGeoL06Area: GEO_L06_P002_SOURCE,
});
export default animationModule;
