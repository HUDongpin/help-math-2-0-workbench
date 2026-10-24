'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P001Renderer, p001ModuleFrame} from '../nms-l02-p001-renderer-v1';
import {P001_TEXT_BINDING, p001TextSnapshot} from '../nms-l02-p001-text-v1';
import type {P001FrameState} from '../nms-l02-p001-timeline-v1';
import {P001_AUDIO_SOURCE} from '../nms-l02-p001-audio-source-v1';
import {P001_AUDIO_URL} from '../nms-l02-p001-audio-loader-v1';
import '../nms-l02-p001-v1.css';

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12,
  frameCount: 10, durationMs: 10000 / 12});
const source = Object.freeze({version: 1 as const,
  sourceSwfSha256: '1985e363a5f283bfde0c9e48718a97d49a055b583220525c8e6ed1e20e6b1b42',
  audioUrl: P001_AUDIO_URL, audio: P001_AUDIO_SOURCE});
const animationModule: AnimationModule<P001FrameState> & {privateP001Introduction: typeof source} = Object.freeze({
  key: 'shared-nms002-l02-p001', movie, maturity: 'private-current-js',
  runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-113',
    frameDomains: Object.freeze([{id: 'root', frameCount: 10}, {id: 'sprite-113', frameCount: 136, rootFrame: 6}])}),
  playbackMode: 'loop', reducedMotionFrame: 136,
  scenarios: Object.freeze([{id: 'source-introduction', label: 'Source introduction'}]),
  defaultScenarioByFrameDomain: Object.freeze({root: 'source-introduction', 'sprite-113': 'source-introduction'}),
  audioCues: Object.freeze([]), Renderer: NmsL2P001Renderer, getFrameState: p001ModuleFrame,
  textPresentation: Object.freeze({schemaVersion: 1, binding: P001_TEXT_BINDING, Renderer: NmsL2P001Renderer,
    reducedMotionFrameByDomain: Object.freeze({root: 6, 'sprite-113': 136}),
    getSnapshot: p001TextSnapshot,
    async prepare() {
      if (typeof document === 'undefined') return;
      const faces = await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),
        document.fonts.load('28px "HELP Math Fredoka"')]);
      if (faces.some(group => group.length === 0)) throw Error('P001_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP001Introduction: source,
});
export default animationModule;
