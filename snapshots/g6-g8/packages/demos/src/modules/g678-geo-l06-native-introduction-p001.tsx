'use client';
import type {AnimationModule} from '../contract';
import {GeoL06P001Renderer} from '../geo-l06-p001-renderer-v1';
import {GEO_L06_P001_SOURCE, geoL06P001Frame, type GeoL06P001FrameState} from '../geo-l06-p001-timeline-v1';
import {GEO_L06_P001_TEXT_BINDING, geoL06P001TextSnapshot} from '../geo-l06-p001-text-v1';

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
  frameCount: 10, durationMs: 10000 / 12});
const animationModule: AnimationModule<GeoL06P001FrameState> & {privateGeoL06Introduction: typeof GEO_L06_P001_SOURCE} = Object.freeze({
  key: 'shared-geo001-l06-p001', movie, maturity: 'private-current-js',
  runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-142',
    frameDomains: Object.freeze([{id: 'root', frameCount: 10}, {id: 'sprite-142', frameCount: 130, rootFrame: 6}])}),
  playbackMode: 'once', reducedMotionFrame: 129,
  scenarios: Object.freeze([{id: 'source-introduction', label: 'Circles: Introduction'}]),
  defaultScenarioByFrameDomain: Object.freeze({root: 'source-introduction', 'sprite-142': 'source-introduction'}),
  audioCues: Object.freeze([]), Renderer: GeoL06P001Renderer, getFrameState: geoL06P001Frame,
  textPresentation: Object.freeze({schemaVersion: 1, binding: GEO_L06_P001_TEXT_BINDING,
    Renderer: GeoL06P001Renderer, getSnapshot: geoL06P001TextSnapshot,
    reducedMotionFrameByDomain: Object.freeze({'sprite-142': 129}),
    async prepare() {
      if (typeof document === 'undefined') return;
      await document.fonts.load('28px "HELP Math Fredoka"');
      await document.fonts.ready;
    },
  }),
  privateGeoL06Introduction: GEO_L06_P001_SOURCE,
});
export default animationModule;
