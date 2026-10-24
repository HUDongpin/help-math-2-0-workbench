'use client';
import type {AnimationModule} from '../contract';
import {P037_GAME_SOURCE as SOURCE} from '../generated/nms-l02-p037-state-source-v1';
import {P037_AUDIO_SOURCES} from '../nms-l02-p037-audio-source-v1';
import {p037ModuleFrame, P037_SCENARIOS, P037_FRAME_DOMAINS, type P037FrameState} from '../nms-l02-p037-frame-v1';
import {NmsL2P037Renderer} from '../nms-l02-p037-renderer-v1';
import {P037_TEXT_BINDING, p037TextSnapshot} from '../nms-l02-p037-text-v1';
import {prepareP037Fonts} from '../nms-l02-p037-fonts-v1';
const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12, frameCount: 10, durationMs: 10000 / 12});
const domains = Object.freeze(Object.entries(P037_FRAME_DOMAINS).map(([id, frameCount]) => Object.freeze({id, frameCount, ...(id === 'root' ? {} : {rootFrame: 6})})));
const source = Object.freeze({version: 1 as const, sourceSwfSha256: SOURCE.sourceSha256, audio: P037_AUDIO_SOURCES});
/** Prepared candidate. Source-local queries are separate from playback traces and registration. */
const animationModule: AnimationModule<P037FrameState> & {privateP037Matching: typeof source} = Object.freeze({
  key: SOURCE.animationId, movie, maturity: 'private-current-js',
  runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-80', frameDomains: domains}), playbackMode: 'once',
  scenarios: P037_SCENARIOS, defaultScenarioByFrameDomain: Object.freeze(Object.fromEntries(domains.map(d => [d.id, 'source-practice']))),
  audioCues: Object.freeze([]), Renderer: NmsL2P037Renderer, getFrameState: p037ModuleFrame,
  textPresentation: Object.freeze({schemaVersion: 1, binding: P037_TEXT_BINDING, Renderer: NmsL2P037Renderer,
    getSnapshot: p037TextSnapshot, prepare: prepareP037Fonts}), privateP037Matching: source,
});
export default animationModule;
