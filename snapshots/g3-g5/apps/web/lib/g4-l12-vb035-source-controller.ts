// Maintained source-state model for the bounded VB035 advanced-manual lane.
// This does not execute AVM1, decide mask hits, decode MP3, or grant acceptance.
export const VB035_SOURCE = Object.freeze({
  animationId: 'course-g04-l12-vb-035',
  swfSha256: '401bfc128c0ecfbb250316b9831959554a317c8b243dc3273ba0d46ee19def80',
  hostSwfSha256: '9e8f10fcaae4bcea672b3c236610118881b82c0983fac6018557348568234631',
  frameDomain: 'sprite-35',
  rootBeginFrame: 6,
  frameCount: 129,
  fps: 12,
  streamIndex: 1,
  streamFirstFrame: 5,
  streamLastFrame: 129,
  streamSampleRate: 22_050,
  streamLatencySeekSamples: 1_673,
  rawCodecSampleCount: 229_248,
  streamPayloadSha256: 'd41d032c3870b3d93a9003fd9510c886d32e9493b8d01e5b66ecff72e4c335df',
});

// Placement is not visibility: the source morph masks reveal these hit areas.
// The caller must establish an actual button activation, not turn these ranges
// into rectangular click overlays or enable a whole line on its first frame.
export const VB035_GLOSSARY_BUTTONS = Object.freeze([
  Object.freeze({buttonId: 10, keyAttribute: 'Rotational symmetry', firstPlacedFrame: 6}),
  Object.freeze({buttonId: 27, keyAttribute: 'Center', firstPlacedFrame: 57}),
  Object.freeze({buttonId: 28, keyAttribute: 'Exact / Exactly', firstPlacedFrame: 57}),
  Object.freeze({buttonId: 29, keyAttribute: 'Point', firstPlacedFrame: 57}),
  Object.freeze({buttonId: 34, keyAttribute: 'Position', firstPlacedFrame: 107}),
] as const);

type GlossaryButton = typeof VB035_GLOSSARY_BUTTONS[number];
export type Vb035SourcePhase = 'playing' | 'paused' | 'glossary' | 'complete' | 'inspection';
export interface Vb035SourceState {
  readonly frame: number;
  readonly phase: Vb035SourcePhase;
  readonly glossaryButtonId: GlossaryButton['buttonId'] | null;
  readonly replayRevision: number;
}

export type Vb035SourceEvent =
  | Readonly<{type: 'advance-frames'; count: number}>
  | Readonly<{type: 'pause'}>
  | Readonly<{type: 'play'}>
  | Readonly<{type: 'replay'}>
  | Readonly<{type: 'inspect-frame'; frame: number}>
  | Readonly<{type: 'glossary-button-activated'; buttonId: GlossaryButton['buttonId']}>
  | Readonly<{type: 'close-glossary'}>;

function validFrame(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > VB035_SOURCE.frameCount) {
    throw new RangeError('VB035 requires a one-indexed sprite-35 frame from 1 through 129.');
  }
}

export function createVb035SourceState(replayRevision = 0): Vb035SourceState {
  if (!Number.isSafeInteger(replayRevision) || replayRevision < 0) {
    throw new RangeError('VB035 replay revision must be a nonnegative safe integer.');
  }
  return Object.freeze({frame: 1, phase: 'playing', glossaryButtonId: null, replayRevision});
}

export function transitionVb035Source(
  state: Vb035SourceState,
  event: Vb035SourceEvent,
): Vb035SourceState {
  validFrame(state.frame);
  const next = (patch: Partial<Vb035SourceState>) => Object.freeze({...state, ...patch});
  switch (event.type) {
    case 'replay':
      return createVb035SourceState(state.replayRevision + 1);
    case 'advance-frames': {
      if (!Number.isSafeInteger(event.count) || event.count < 0) {
        throw new RangeError('VB035 frame advancement must be a nonnegative safe integer.');
      }
      if (state.phase !== 'playing' || event.count === 0) return state;
      const frame = state.frame + Math.min(event.count, VB035_SOURCE.frameCount - state.frame);
      return next({frame, phase: frame === VB035_SOURCE.frameCount ? 'complete' : 'playing'});
    }
    case 'pause':
      return state.phase === 'playing' ? next({phase: 'paused'}) : state;
    case 'play':
      // A visual inspector seek is deliberately silent. Only Replay returns it
      // to source playback; a frame seek is not a natural execution trace.
      return state.phase === 'paused'
        ? next({phase: state.frame < VB035_SOURCE.frameCount ? 'playing' : 'complete'})
        : state;
    case 'inspect-frame':
      validFrame(event.frame);
      return next({frame: event.frame, phase: 'inspection', glossaryButtonId: null});
    case 'glossary-button-activated': {
      if (state.phase === 'inspection') return state;
      const button = VB035_GLOSSARY_BUTTONS.find(({buttonId}) => buttonId === event.buttonId);
      if (!button || state.frame < button.firstPlacedFrame) {
        throw new RangeError('The named glossary button is not placed at this VB035 frame.');
      }
      return next({phase: 'glossary', glossaryButtonId: button.buttonId});
    }
    case 'close-glossary':
      // Same-lesson doSKTClose sets Play=true; doCheckPrevAndNext resumes only
      // below the terminal frame. This model holds the frame while the panel
      // is open, satisfying its captured-current-frame condition by construction.
      return state.phase === 'glossary'
        ? next({glossaryButtonId: null,
          phase: state.frame < VB035_SOURCE.frameCount ? 'playing' : 'complete'})
        : state;
    default:
      throw new Error('Unknown VB035 source event.');
  }
}

export function resolveVb035SourceAudioIntent(state: Vb035SourceState) {
  validFrame(state.frame);
  const disposition = state.phase === 'inspection' ? 'inspection-muted'
    : state.frame < VB035_SOURCE.streamFirstFrame ? 'before-stream'
      : state.frame === VB035_SOURCE.frameCount ? 'terminal-stop-boundary-unverified'
        : state.phase === 'glossary' ? 'glossary-paused'
          : state.phase === 'paused' ? 'host-paused' : 'source-stream-running';
  return Object.freeze({
    frameDomain: VB035_SOURCE.frameDomain,
    sourceLocalFrame: state.frame,
    streamIndex: VB035_SOURCE.streamIndex,
    blockIndex: state.frame < VB035_SOURCE.streamFirstFrame
      ? null : state.frame - VB035_SOURCE.streamFirstFrame + 1,
    replayRevision: state.replayRevision,
    disposition,
    // Raw codec concatenation does not carry the SWF latency/seek headers.
    // Neither frame/FPS nor cumulative block size is an accepted HTMLAudio seek.
    htmlAudioOffsetSeconds: null,
    sampleToBrowserClockEstablished: false,
    sourceTriggerParityEstablished: false,
    listeningAccepted: false,
  });
}
