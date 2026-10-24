'use client';
import type {AnimationModule} from '../contract';
import {GeoL07P001Renderer} from '../geo-l07-p001-renderer-v1';
import {GEO_L07_P001_SOURCE, geoL07P001Frame, type GeoL07P001FrameState} from '../geo-l07-p001-timeline-v1';
import {GEO_L07_P001_TEXT_BINDING, geoL07P001TextSnapshot} from '../geo-l07-p001-text-v1';

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
  frameCount: 10, durationMs: 10000 / 12});
const animationModule: AnimationModule<GeoL07P001FrameState> &
  {privateGeoL07Introduction: typeof GEO_L07_P001_SOURCE} = Object.freeze({
  key: 'shared-geo001-l07-p001', movie, maturity: 'private-current-js',
  runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-142',
    frameDomains: Object.freeze([{id: 'root', frameCount: 10},
      {id: 'sprite-142', frameCount: 130, rootFrame: 6}])}),
  playbackMode: 'once', reducedMotionFrame: 129,
  scenarios: Object.freeze([{id: 'source-introduction', label: 'Volume and Surface Area: Introduction'}]),
  defaultScenarioByFrameDomain: Object.freeze({root: 'source-introduction',
    'sprite-142': 'source-introduction'}),
  audioCues: Object.freeze([]), Renderer: GeoL07P001Renderer, getFrameState: geoL07P001Frame,
  textPresentation: Object.freeze({schemaVersion: 1, binding: GEO_L07_P001_TEXT_BINDING,
    Renderer: GeoL07P001Renderer, getSnapshot: geoL07P001TextSnapshot,
    reducedMotionFrameByDomain: Object.freeze({'sprite-142': 129}),
    async prepare() {
      if (typeof document === 'undefined') return;
      const font = await document.fonts.load('28px "HELP Math Fredoka"');
      if (font.length === 0) return;
      await document.fonts.ready;
    },
  }),
  privateGeoL07Introduction: GEO_L07_P001_SOURCE,
});
export default animationModule;
