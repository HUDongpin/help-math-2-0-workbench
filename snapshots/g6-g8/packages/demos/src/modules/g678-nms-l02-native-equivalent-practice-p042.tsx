'use client';
import type { AnimationModule } from '../contract';
import { P042_TEACHING } from '../generated/nms-l02-p042-teaching-v1';
import { P042_AUDIO_SOURCE } from '../generated/nms-l02-p042-audio-plan-v1';
import { P042_SCENARIOS, p042ModuleFrame, type P042FrameState } from '../nms-l02-p042-frame-v1';
import { NmsL2P042Renderer } from '../nms-l02-p042-renderer-v1';
import { P042_TEXT_BINDING, p042TextSnapshot } from '../nms-l02-p042-text-v1';
const movie = Object.freeze({ stage: Object.freeze({ width: 800, height: 600 }), fps: 12, frameCount: 10, durationMs: 10000 / 12 });
const domains = Object.freeze([Object.freeze({ id: 'root', frameCount: 10 }), Object.freeze({ id: 'sprite-261', frameCount: 626, rootFrame: 6 })]);
const source = Object.freeze({ version: 1 as const, sourceSwfSha256: P042_TEACHING.sourceSha256, audio: P042_AUDIO_SOURCE });
const animationModule: AnimationModule<P042FrameState> & { privateP042EquivalentPractice: typeof source } = Object.freeze({
  key: 'shared-nms002-l02-p042', movie, maturity: 'private-current-js',
  runtime: Object.freeze({ ...movie, defaultFrameDomain: 'sprite-261', frameDomains: domains }), playbackMode: 'once',
  scenarios: P042_SCENARIOS, defaultScenarioByFrameDomain: Object.freeze({ root: 'source-explanation', 'sprite-261': 'source-explanation' }),
  audioCues: Object.freeze([]), Renderer: NmsL2P042Renderer, getFrameState: p042ModuleFrame, privateP042EquivalentPractice: source,
  textPresentation: Object.freeze({ schemaVersion: 1, binding: P042_TEXT_BINDING, Renderer: NmsL2P042Renderer, getSnapshot: p042TextSnapshot, playbackEndFrameByDomain: Object.freeze({ 'sprite-261': 625 }) }),
});
export default animationModule;
