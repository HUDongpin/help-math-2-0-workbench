'use client';
import type {AnimationModule, RuntimeContext} from '../contract';
import {P047SourceEvidenceRenderer} from '../nms-l01-p047-source-evidence-v1';
import {P047NativeRenderer, P047_QUIZ_STOP} from '../nms-l01-p047-native-renderer-v1';
import {P047_TEXT_BINDING, p047TextSnapshot} from '../nms-l01-p047-text-v1';
import {P047_SOURCE} from '../nms-l01-p047-source-data-v1';
import {p047AudioSource} from '../nms-l01-p047-audio-loader-v1';
import type {P047QuizState} from '../nms-l01-p047-quiz-v1';
import {P047_TIMELINE, getP047InitialFrameState} from '../timelines/g678-nms-l01-native-quiz-p047';
import '../nms-l01-p047-quiz-v1.css';

const movie = Object.freeze({stage: Object.freeze({width: 800, height: 600}), fps: 12, frameCount: 10, durationMs: 10000 / 12});
const module: AnimationModule<P047QuizState> & {privateP047Quiz: Readonly<{version: 1; sourceSwfSha256: string;
  audioAssets: readonly Readonly<{id: string; source: string; sha256: string; bytes: number}>[]}>} = Object.freeze({
  key: P047_TIMELINE.animationId, movie, runtime: Object.freeze({...movie, defaultFrameDomain: 'sprite-1024',
    frameDomains: Object.freeze([{id: 'root', frameCount: 10}, {id: 'sprite-1024', frameCount: 74, rootFrame: 6}])}),
  maturity: 'private-current-js', playbackMode: 'once', playbackEndFrameByDomain: Object.freeze({root: 6, 'sprite-1024': 2}),
  reducedMotionFrame: 1, interactiveStops: Object.freeze([P047_QUIZ_STOP]),
  scenarios: Object.freeze([{id: 'source-quiz', label: 'Source quiz initial state'},
    ...(['A','B','C','D'] as const).map(letter => ({id: `source-review-${letter}`, label: `Source review with selected ${letter}`}))]),
  defaultScenarioByFrameDomain: Object.freeze({root: 'source-quiz', 'sprite-1024': 'source-quiz'}),
  audioCues: Object.freeze([]), Renderer: P047SourceEvidenceRenderer, getFrameState: getP047InitialFrameState,
  textPresentation: Object.freeze({schemaVersion: 1, binding: P047_TEXT_BINDING, Renderer: P047NativeRenderer,
    reducedMotionFrameByDomain: Object.freeze({'sprite-1024': 1}),
    async prepare() {
      if (typeof document === 'undefined') return;
      const fonts = await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'), document.fonts.load('28px "HELP Math Fredoka"')]);
      if (fonts.some(faces => faces.length === 0)) throw Error('P047 native font faces are unavailable');
      await document.fonts.ready;
    },
    getSnapshot(state: P047QuizState, context: RuntimeContext) { return p047TextSnapshot(state, context.lang); }}),
  privateP047Quiz: Object.freeze({version: 1, sourceSwfSha256: P047_TIMELINE.source.sha256,
    audioAssets: Object.freeze(P047_SOURCE.audio.map(asset => Object.freeze({id: asset.id, source: p047AudioSource(asset), sha256: asset.sha256, bytes: asset.bytes})))}),
});
export default module;
