'use client';

import {useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore,
  type ComponentProps, type CSSProperties, type PointerEvent as ReactPointerEvent} from 'react';

import {AnimationRuntime} from '@/components/animation-runtime';
import {G4L12CalibrationCompanion} from '@/components/g4-l12-calibration-companion';
import {
  createG4L12VB036SourceState,
  type G4L12VB036RightVariant,
  type G4L12VB036SourceState,
  type G4L12VB036WrongVariant,
} from '@/lib/g4-l12-vb036-source-controller';
import {createVb036PcmClock, type Vb036PcmClockSnapshot} from '@/lib/g4-l12-vb036-pcm-clock';
import {VB036_PCM_ASSETS, decodeVb036PrivatePcm, vb036PcmUrl} from '@/lib/g4-l12-vb036-pcm-assets';
import type {G4L12Vb036PrivateBehavior} from '@/lib/g4-l12-vb036-private-behavior.server';
import {createG4L12Vb036PrivateCanvasLoader,
  type G4L12Vb036PrivateCanvasAsset as CanvasAsset} from '@/lib/g4-l12-vb036-private-canvas-loader';
import {g4L12Vb036CloseHitContainsPoint,
  resolveG4L12Vb036CloseHitRegion} from '@/lib/g4-l12-vb036-close-hit-geometry';
import {createVb036ClosePointerState, reduceVb036ClosePointer, vb036CloseVisualState,
  type Vb036CloseInstance, type Vb036ClosePointerEvent} from '@/lib/g4-l12-vb036-close-pointer';

type Props = ComponentProps<typeof AnimationRuntime> & {
  behavior: G4L12Vb036PrivateBehavior;
  onInterruptionReady: (interrupt: (() => void) | null) => void;
};

type Point = Readonly<{x: number; y: number}>;
type AnswerRegion = Readonly<{
  instanceName: 'AnsBtn1' | 'AnsBtn2';
  outcome: 'wrong' | 'right';
  sourceCharacterId: 30 | 29;
  sourceHitAreaObjectId: 28;
  points: readonly Point[];
}>;
type Affine = readonly [number, number, number, number, number, number];
const ANIMATION_ID = 'course-g04-l12-vb-036';
const BUTTON_STYLE = {minHeight: 44, padding: '8px 12px'} as const;
const FEEDBACK_FIELD = Object.freeze({
  objectId: 43,
  sourceBoundsTwips: Object.freeze({left: -2842, right: 7000, top: -40, bottom: 1288}),
  sourceFontObjectId: 42,
  sourceFontFamily: 'Bauhaus Md BT',
  sourceFontHeightTwips: 300,
  sourceLeadingTwips: 40,
  sourceScriptSha256: '9570646b6c6a4ca8fdba2957c45e38c3842c43378c992410f467f2f4d1607dbb',
  sourceXmlSha256: '5ad69306d727906b07b8653cb0e7091e7cf7abd6265e222bb86fabb1d1b15567',
  htmlExecution: 'sanitized-react-elements-no-asfunction-execution',
  rasterParity: 'unproven-native-html-overlay',
} as const);

const KEYTERMS = Object.freeze({
  Center: 'en-0051-69b2da04ca2b',
  Figure: 'en-0230-eeccc98bafdb',
  Point: 'en-0490-56db4bb302f7',
  Symmetry: 'en-0678-6bf8fc1561ca',
} as const);

export const G4_L12_VB036_SOURCE_ANSWER_HIT_REGIONS = Object.freeze([
  Object.freeze({
    instanceName: 'AnsBtn1', outcome: 'wrong', sourceCharacterId: 30,
    sourceHitAreaObjectId: 28,
    points: Object.freeze([
      Object.freeze({x: 440.0602523803711, y: 383.7944931030273}),
      Object.freeze({x: 643.9790603637696, y: 384.4733413696289}),
      Object.freeze({x: 643.839747619629, y: 426.50550689697263}),
      Object.freeze({x: 439.92093963623046, y: 425.82665863037107}),
    ]),
  }),
  Object.freeze({
    instanceName: 'AnsBtn2', outcome: 'right', sourceCharacterId: 29,
    sourceHitAreaObjectId: 28,
    points: Object.freeze([
      Object.freeze({x: 186.61347183499018, y: 384.0305517449975}),
      Object.freeze({x: 333.48652816500976, y: 384.0305517449975}),
      Object.freeze({x: 333.48652816500976, y: 426.1694482550025}),
      Object.freeze({x: 186.61347183499018, y: 426.1694482550025}),
    ]),
  }),
] as const satisfies readonly AnswerRegion[]);

export const G4_L12_VB036_SYMMETRY_HIT_REGION = Object.freeze({
  sourceCharacterId: 16,
  sourceHitAreaObjectId: 15,
  keyAttribute: 'Symmetry',
  firstFullyRevealedFrame: 6,
  points: Object.freeze([
    Object.freeze({x: 251.82581176757807, y: 133.4166015625}),
    Object.freeze({x: 342.69889984130856, y: 133.4166015625}),
    Object.freeze({x: 342.69889984130856, y: 152.0347869873047}),
    Object.freeze({x: 251.82581176757807, y: 152.0347869873047}),
  ]),
} as const);

export const G4_L12_VB036_FIGURE_HIT_REGION = Object.freeze({
  sourceCharacterId: 17,
  sourceHitAreaObjectId: 15,
  keyAttribute: 'Figure',
  firstFullyRevealedFrame: 6,
  points: Object.freeze([
    Object.freeze({x: 388.7362884521484, y: 131.59526367187502}),
    Object.freeze({x: 441.42006301879877, y: 131.59526367187502}),
    Object.freeze({x: 441.42006301879877, y: 152.15106582641602}),
    Object.freeze({x: 388.7362884521484, y: 152.15106582641602}),
  ]),
} as const);

const SOURCE_PAGE_KEYTERM_HIT_REGIONS = Object.freeze([
  G4_L12_VB036_SYMMETRY_HIT_REGION,
  G4_L12_VB036_FIGURE_HIT_REGION,
]);

// Both source buttons are placed at local 1. Their translation changes by
// -80 twips per frame until local 6, while alpha rises independently. Alpha 0
// is not a source instruction disabling a hit-only button.
export function resolveG4L12Vb036PageKeytermHitRegions(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 82) {
    throw new RangeError('VB036 requires a one-indexed sprite-216 frame from 1 through 82.');
  }
  const revealIndex = Math.min(frame - 1, 5);
  const sourceAlpha = [0, 51, 102, 154, 205, 256][revealIndex]! / 256;
  const sourceYDisplacement = (5 - revealIndex) * 4;
  return Object.freeze(SOURCE_PAGE_KEYTERM_HIT_REGIONS.map((region) => Object.freeze({
    ...region,
    sourceAlpha,
    fullyRevealed: frame >= region.firstFullyRevealedFrame,
    originalHitParityEstablished: false as const,
    points: Object.freeze(region.points.map(({x, y}) => Object.freeze({x, y: y + sourceYDisplacement}))),
  })));
}

const FEEDBACK_FIELD_MIDFRAME_TRANSFORMS = Object.freeze({
  1: Object.freeze([1.0048828125, 0.0002899169921875, -0.00030517578125,
    1.0047607421875, 146.82905578613278, 129.5900375366211] as const),
  2: Object.freeze([1.049196034669876, 0.000302701722830534, -0.00031863339245319366,
    1.0490685813128948, 142.11831163363533, 131.6785432202276] as const),
  3: Object.freeze([1.0048828125, 0.0002899169921875, -0.00030517578125,
    1.0047607421875, 146.07905578613278, 133.19003753662113] as const),
} satisfies Readonly<Record<G4L12VB036WrongVariant, Affine>>);

// Local placement and local 22 use these source endpoint matrices; the
// intervening frames use the distinct midframe matrix above.
const FEEDBACK_FIELD_ENDPOINT_TRANSFORMS = Object.freeze({
  1: Object.freeze([1.004913330078125, 0.0011138916015625, -0.001129150390625,
    1.004776000976562, 146.85449676513667, 129.38978042602542] as const),
  2: Object.freeze([1.0492278980091214, 0.0011630118824541569, -0.0011789435520768166,
    1.049084512982517, 142.19707940141672, 131.46945519151635] as const),
  3: Object.freeze([1.004913330078125, 0.0011138916015625, -0.001129150390625,
    1.004776000976562, 146.15449676513668, 132.98978042602545] as const),
} satisfies Readonly<Record<G4L12VB036WrongVariant, Affine>>);

function polygonStyle(points: readonly Point[]): CSSProperties {
  const left = Math.min(...points.map(({x}) => x));
  const top = Math.min(...points.map(({y}) => y));
  const right = Math.max(...points.map(({x}) => x));
  const bottom = Math.max(...points.map(({y}) => y));
  const polygon = points.map(({x, y}) =>
    `${((x - left) / (right - left)) * 100}% ${((y - top) / (bottom - top)) * 100}%`).join(', ');
  return {
    position: 'absolute', left: `${left / 8}%`, top: `${top / 6}%`,
    width: `${(right - left) / 8}%`, height: `${(bottom - top) / 6}%`,
    clipPath: `polygon(${polygon})`, padding: 0, border: 0,
    background: 'transparent', pointerEvents: 'auto', cursor: 'pointer',
  };
}

export function g4L12Vb036CompositeStateId(
  state: G4L12VB036SourceState,
  inspectionFrame: number | null = null,
) {
  if (inspectionFrame !== null || state.feedback === null) return 'main-source-frame';
  const feedback = state.feedback;
  return `main-056-${feedback.outcome}-${feedback.variant}-feedback-${String(feedback.localFrame).padStart(3, '0')}-${feedback.playback}`;
}

function sourcePopupOpacity(variant: G4L12VB036WrongVariant, frame: number) {
  const values = variant === 2
    ? [0, 43, 85, 128, 171, 213, 256]
    : [0, 28, 57, 85, 114, 142, 171, 199, 228, 256];
  const placement = variant === 2 ? 16 : 13;
  if (frame < placement || frame >= 23) return 0;
  return values[Math.min(frame - placement, values.length - 1)]! / 256;
}

export function g4L12Vb036FeedbackTextGeometry(variant: G4L12VB036WrongVariant, frame: number) {
  if (![1, 2, 3].includes(variant) || !Number.isInteger(frame) || frame < 1 || frame > (variant === 3 ? 31 : 28)) {
    throw new RangeError('VB036 feedback geometry requires a source wrong variant and local frame.');
  }
  const placement = variant === 2 ? 16 : 13;
  if (frame < placement || frame >= 23) return null;
  const matrix = frame === placement || frame === 22
    ? FEEDBACK_FIELD_ENDPOINT_TRANSFORMS[variant]
    : FEEDBACK_FIELD_MIDFRAME_TRANSFORMS[variant];
  const [a, b, c, d, x, y] = matrix;
  return Object.freeze({
    width: (FEEDBACK_FIELD.sourceBoundsTwips.right - FEEDBACK_FIELD.sourceBoundsTwips.left) / 20,
    height: (FEEDBACK_FIELD.sourceBoundsTwips.bottom - FEEDBACK_FIELD.sourceBoundsTwips.top) / 20,
    transform: `matrix(${a} ${b} ${c} ${d} ${x} ${y})`,
    matrix,
    opacity: sourcePopupOpacity(variant, frame),
  });
}

function expectedInvocation(props: Props) {
  return props.animationId === ANIMATION_ID && props.moduleKey === ANIMATION_ID &&
    props.query.lang === 'en' && props.query.frameDomain === 'sprite-216' &&
    props.query.scenario === 'source-static-frame' &&
    (props.query.seed === undefined || props.query.seed === '0') &&
    props.query.frame === undefined && props.query.capture === undefined &&
    props.query.entryStateSha256 === undefined;
}

export function runG4L12Vb036ReadyInteraction(
  admission: Readonly<{status: 'loading' | 'ready' | 'failed'; invocationValid: boolean; inspectionFrame: number | null}>,
  action: () => void,
) {
  if (admission.status !== 'ready' || !admission.invocationValid || admission.inspectionFrame !== null) return false;
  action();
  return true;
}

type RenderedIdentity = Readonly<{frame: number; stateId: string}>;

export function g4L12Vb036CompletionIsReady(
  state: G4L12VB036SourceState,
  status: 'loading' | 'ready' | 'failed',
  inspectionFrame: number | null,
  renderFrame: number,
  stateId: string,
  rendered: RenderedIdentity | null,
) {
  return status === 'ready' && inspectionFrame === null &&
    state.main.localFrame === 82 && state.main.playback === 'stopped' && renderFrame === 82 &&
    rendered?.frame === renderFrame && rendered.stateId === stateId;
}

export function g4L12Vb036NarrationStatus({clockReady, pcmFailed, canvasReady, interrupted, snapshot}: {
  clockReady: boolean; pcmFailed: boolean; canvasReady: boolean; interrupted: boolean;
  snapshot: Vb036PcmClockSnapshot;
}): 'unavailable' | 'interactive' | 'blocked' | 'playing' | 'waiting' | 'idle' {
  if (!clockReady || pcmFailed || !canvasReady) return 'unavailable';
  if (interrupted || snapshot.inspectionFrame !== null || snapshot.status === 'complete') return 'interactive';
  if (snapshot.status === 'blocked') return 'blocked';
  if (snapshot.sounding) return 'playing';
  if (snapshot.muted) return 'idle';
  return snapshot.running && snapshot.state.main.localFrame < 9 ? 'waiting' : 'interactive';
}

export function G4L12Vb036SourceRuntime(props: Props) {
  const {behavior, onInterruptionReady, onPlaybackComplete, onPlaybackStateChange} = props;
  const sourceId = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const closePointer = useRef(createVb036ClosePointerState());
  const [closePointerState, setClosePointerState] = useState(createVb036ClosePointerState);
  const closeVisual = vb036CloseVisualState(closePointerState);
  const closeCaptureElement = useRef<HTMLButtonElement | null>(null);
  const closeClientPoint = useRef<{clientX: number; clientY: number; canHover: boolean} | null>(null);
  const closeOwnerMounted = useRef(true);
  const renderedIdentity = useRef<RenderedIdentity | null>(null);
  const [asset, setAsset] = useState<CanvasAsset | null>(null);
  const [clock, setClock] = useState<ReturnType<typeof createVb036PcmClock> | null>(null);
  const [snapshot, setSnapshot] = useState<Vb036PcmClockSnapshot>(() => ({
    state: createG4L12VB036SourceState(), inspectionFrame: null, running: false,
    transportPlaying: false, sounding: false, soundingStreams: [], muted: false, status: 'ready',
  }));
  const [pcmFailed, setPcmFailed] = useState(false);
  const [pcmRevision, setPcmRevision] = useState(0);
  const controller = snapshot.state, inspectionFrame = snapshot.inspectionFrame;
  const [manualPaused, setManualPaused] = useState(false);
  const [wrongVariant, setWrongVariant] = useState<G4L12VB036WrongVariant>(1);
  const [rightVariant, setRightVariant] = useState<G4L12VB036RightVariant>(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [keytermStatus, setKeytermStatus] = useState<'idle' | 'accepted' | 'blocked'>('idle');
  const lastSeek = useRef(props.seekRequest?.requestId ?? 0);
  const lastNarration = useRef(props.narrationRequest?.requestId ?? 0);
  const completed = useRef(false);
  const spanish = props.uiLanguage === 'es';
  const invocationValid = expectedInvocation(props);
  const subscribeMotion = useCallback((notify: () => void) => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
  }, []);
  const reduced = useSyncExternalStore(subscribeMotion,
    () => matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const stateId = g4L12Vb036CompositeStateId(controller, inspectionFrame);
  const renderFrame = inspectionFrame ?? controller.main.localFrame;
  const feedback = controller.feedback;
  const externallyPaused = props.paused === true || reduced;
  const updateClosePointer = useCallback((event: Vb036ClosePointerEvent, publish = true) => {
    const next = reduceVb036ClosePointer(closePointer.current, event);
    closePointer.current = next.state;
    if (publish && closeOwnerMounted.current) setClosePointerState(next.state);
    if (next.releasePointerId !== null) {
      const captured = closeCaptureElement.current;
      closeCaptureElement.current = null;
      try {
        if (captured?.hasPointerCapture(next.releasePointerId)) captured.releasePointerCapture(next.releasePointerId);
      } catch { /* Detached/implicitly released capture has no Close action. */ }
    }
    return next.activate;
  }, []);
  const resetClosePointer = useCallback((publish = true) => {
    closeClientPoint.current = null;
    updateClosePointer({type: 'reset'}, publish);
  }, [updateClosePointer]);
  const hasClosePointerCapture = useCallback((pointerId: number) => {
    try {return closeCaptureElement.current?.hasPointerCapture(pointerId) === true;}
    catch {return false;}
  }, []);
  const readCloseScene = useCallback(() => {
    if (!closeOwnerMounted.current || !clock || status !== 'ready' || !invocationValid) return {instanceKey: null, hit: null};
    const live = clock.snapshot(), current = live.state.feedback;
    if (live.inspectionFrame !== null || current?.outcome !== 'wrong' || !current.closePopup?.placed) {
      return {instanceKey: null, hit: null};
    }
    const hit = resolveG4L12Vb036CloseHitRegion(current.variant as G4L12VB036WrongVariant, current.localFrame);
    return {instanceKey: hit ? `wrong-${current.variant}` as Vb036CloseInstance : null, hit};
  }, [clock, status, invocationValid]);
  const closeSourcePoint = useCallback((point: {clientX: number; clientY: number}): Point | null => {
    const box = canvas.current?.getBoundingClientRect();
    if (!box || ![box.left, box.top, box.width, box.height, point.clientX, point.clientY].every(Number.isFinite) ||
      box.width <= 0 || box.height <= 0) return null;
    return {x: (point.clientX - box.left) * 800 / box.width, y: (point.clientY - box.top) * 600 / box.height};
  }, []);
  const refreshClosePointer = useCallback(() => {
    // A pending capture can be revoked before gotpointercapture, in which case
    // the browser need not deliver lostpointercapture. Never retain that press.
    if (closePointer.current.pointerId !== null && !hasClosePointerCapture(closePointer.current.pointerId)) {
      resetClosePointer(); return;
    }
    const scene = readCloseScene(), last = closeClientPoint.current;
    const point = last ? closeSourcePoint(last) : null;
    updateClosePointer({type: 'reconcile', instanceKey: scene.instanceKey,
      inside: Boolean(scene.hit && point && (closePointer.current.pointerId !== null || last?.canHover) &&
        g4L12Vb036CloseHitContainsPoint(scene.hit, point))});
    if (scene.instanceKey === null) closeClientPoint.current = null;
  }, [readCloseScene, closeSourcePoint, hasClosePointerCapture, resetClosePointer, updateClosePointer]);
  useEffect(() => {
    closeOwnerMounted.current = true;
    const blur = () => resetClosePointer();
    const hidden = () => {if (document.hidden) resetClosePointer();};
    window.addEventListener('blur', blur);
    window.addEventListener('resize', blur);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      closeOwnerMounted.current = false;
      window.removeEventListener('blur', blur);
      window.removeEventListener('resize', blur);
      document.removeEventListener('visibilitychange', hidden);
      resetClosePointer(false);
    };
  }, [resetClosePointer]);
  useEffect(() => {resetClosePointer();},
    [status, invocationValid, inspectionFrame, externallyPaused, manualPaused, resetClosePointer]);
  const observeClock = useCallback(() => {
    if (!clock) return;
    const next = clock.snapshot();
    setSnapshot((previous) => previous.state === next.state && previous.inspectionFrame === next.inspectionFrame &&
      previous.running === next.running && previous.transportPlaying === next.transportPlaying &&
      previous.sounding === next.sounding && previous.muted === next.muted && previous.status === next.status &&
      previous.soundingStreams.join(',') === next.soundingStreams.join(',') ? previous : next);
  }, [clock]);

  useEffect(() => {
    let disposed = false;
    let loader: ReturnType<typeof createG4L12Vb036PrivateCanvasLoader> | null = null;
    void (async () => {
      if (!invocationValid) throw new Error('Private behavior invocation changed');
      loader = createG4L12Vb036PrivateCanvasLoader(behavior);
      const captured = await loader.ready;
      if (disposed) return;
      setAsset(captured);
      setStatus('ready');
    })().catch(() => {
      if (!disposed) setStatus('failed');
    });
    return () => {
      disposed = true;
      if (loader) loader.dispose();
    };
  }, [behavior, invocationValid]);

  useEffect(() => {
    const abort = new AbortController();
    let ownedClock: ReturnType<typeof createVb036PcmClock> | null = null;
    void (async () => {
      if (!invocationValid) throw new Error('Private PCM invocation changed');
      const decoded = await Promise.all(VB036_PCM_ASSETS.map(async (item) => {
        const response = await fetch(vb036PcmUrl(item.stream), {
          signal: abort.signal, cache: 'no-store', redirect: 'error', credentials: 'same-origin',
        });
        if (response.status !== 200 || response.headers.get('content-type') !== 'audio/wav' ||
          Number(response.headers.get('content-length')) !== item.bytes ||
          response.headers.get('x-helpmath-audio-authority') !== 'private-engineering-calibration-only' ||
          !response.body) throw new Error('Private PCM unavailable');
        const reader = response.body.getReader(), bytes = new Uint8Array(item.bytes);
        let position = 0;
        try {
          for (;;) {
            const {done, value} = await reader.read();
            if (done) break;
            if (position + value.length > bytes.length) throw new Error('Private PCM exceeded fixed size');
            bytes.set(value, position); position += value.length;
          }
        } finally {await reader.cancel().catch(() => {}); reader.releaseLock();}
        if (position !== bytes.length) throw new Error('Private PCM ended early');
        return [item.stream, await decodeVb036PrivatePcm(item.stream, bytes.buffer)] as const;
      }));
      if (abort.signal.aborted) return;
      const context = new AudioContext();
      ownedClock = createVb036PcmClock(context, new Map(decoded));
      setClock(ownedClock); setPcmFailed(false);
    })().catch(() => {
      if (abort.signal.aborted) return;
      abort.abort();
      ownedClock?.destroy();
      setPcmFailed(true);
    });
    return () => {
      abort.abort(); ownedClock?.destroy();
    };
  }, [invocationValid, pcmRevision]);

  const interrupt = useCallback(() => {
    resetClosePointer(); clock?.pause(); setManualPaused(true); observeClock();
  }, [clock, observeClock, resetClosePointer]);
  useEffect(() => {
    onInterruptionReady(interrupt);
    return () => onInterruptionReady(null);
  }, [interrupt, onInterruptionReady]);

  useEffect(() => {
    if (!clock) return;
    if (!asset || status !== 'ready' || !invocationValid || externallyPaused || manualPaused) clock.pause();
    else void clock.play();
  }, [asset, status, invocationValid, externallyPaused, manualPaused, clock]);
  useEffect(() => {clock?.setVolume(props.volume ?? 1);}, [clock, props.volume]);
  useEffect(() => {
    if (!clock) return;
    let request = 0;
    const tick = () => {observeClock(); refreshClosePointer(); request = requestAnimationFrame(tick);};
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [clock, observeClock, refreshClosePointer]);

  useEffect(() => {
    // Invalidate the prior paint before attempting this exact requested state.
    // A synchronous failure must block completion in later effects of this same
    // commit, before setStatus('failed') has caused another React render.
    renderedIdentity.current = null;
    if (canvas.current) {
      delete canvas.current.dataset.sourceCompositePainted;
      delete canvas.current.dataset.sourceFramePainted;
      delete canvas.current.dataset.sourceClosePainted;
    }
    if (!asset || !canvas.current || status !== 'ready') return;
    try {
      if (!behavior.stateIds.includes(stateId)) throw new Error('Private behavior state is unavailable');
      const result = asset.renderComposite(canvas.current, {
        frame: renderFrame, scenario: 'source-static-frame', lang: 'en', seed: 0,
        behaviorCompositeContractId: behavior.contractId,
        behaviorCompositeState: stateId,
        button52State: closeVisual, button52DownFrame: 1,
      });
      if (result.localFrame !== renderFrame || result.frameDomain !== 'sprite-216' || result.rootFrame !== 6 ||
        result.scenario !== 'source-static-frame' || result.lang !== 'en' || result.seed !== 0 ||
        result.visualOnly !== true || result.audioRendered !== false ||
        result.behaviorCompositeContractId !== behavior.contractId || result.behaviorCompositeState !== stateId ||
        result.button52State !== closeVisual || result.button52DownFrame !== 1 || result.button52HitTestDiagnostic !== false) {
        throw new Error('Private behavior render identity changed');
      }
      renderedIdentity.current = Object.freeze({frame: renderFrame, stateId});
      canvas.current.dataset.sourceClosePainted = result.button52State;
      canvas.current.dataset.sourceCompositePainted = result.behaviorCompositeState;
      canvas.current.dataset.sourceFramePainted = String(result.localFrame);
    } catch {
      resetClosePointer();
      clock?.pause();
      setStatus('failed');
    }
  }, [asset, behavior, clock, closeVisual, renderFrame, resetClosePointer, stateId, status]);

  useEffect(() => {
    const request = props.seekRequest;
    if (!clock || !request || request.requestId === lastSeek.current) return;
    lastSeek.current = request.requestId;
    resetClosePointer();
    clock?.inspect(Math.max(1, Math.min(82, Math.trunc(request.frame))));
    setManualPaused(true); observeClock();
  }, [clock, observeClock, props.seekRequest, resetClosePointer]);

  useEffect(() => {
    const request = props.narrationRequest;
    if (!clock || !request || request.requestId === lastNarration.current) return;
    lastNarration.current = request.requestId;
    if (request.action === 'stop') clock.mute();
    else if (status === 'ready' && !externallyPaused && !manualPaused && inspectionFrame === null) {
      clock.unmute(); void clock.play();
    }
    observeClock();
  }, [clock, props.narrationRequest, status, externallyPaused, manualPaused, inspectionFrame, observeClock]);

  useEffect(() => {
    onPlaybackStateChange?.({
      audioAvailable: Boolean(clock && !pcmFailed && status === 'ready'),
      frame: renderFrame,
      frameCount: 82,
      frameDomain: 'sprite-216',
      fps: 12,
      narration: g4L12Vb036NarrationStatus({clockReady: Boolean(clock), pcmFailed, canvasReady: status === 'ready',
        interrupted: externallyPaused || manualPaused, snapshot}),
      playbackProgress: inspectionFrame === null ? (controller.main.localFrame - 1) / 81 : null,
      seekAvailable: Boolean(clock && status === 'ready' && feedback === null),
      stepFrames: 12,
      transportMode: 'visual-frame-inspector',
    });
  }, [clock, pcmFailed, snapshot, externallyPaused, manualPaused,
    controller.main.localFrame, feedback, inspectionFrame, onPlaybackStateChange, renderFrame, status]);

  // A host may replace its completion callback on a playback-state render.
  // Completion observation must not publish another playback-state object.
  useEffect(() => {
    if (!completed.current && g4L12Vb036CompletionIsReady(
      controller, status, inspectionFrame, renderFrame, stateId, renderedIdentity.current,
    )) {
      completed.current = true;
      onPlaybackComplete?.();
    }
  }, [controller, inspectionFrame, onPlaybackComplete, renderFrame, stateId, status]);

  const replay = () => {
    resetClosePointer();
    clock?.replay(); observeClock();
    if (!externallyPaused && status === 'ready') void clock?.play();
    setManualPaused(false);
    setKeytermStatus('idle');
    completed.current = false;
    props.onReplay?.();
  };

  const answer = (region: AnswerRegion) => {
    runG4L12Vb036ReadyInteraction({status, invocationValid, inspectionFrame}, () => {
      if (!clock || !clock.snapshot().state.answerButtons.find(({instanceName}) => instanceName === region.instanceName)?.interactive) return;
      clock.interact(region.instanceName === 'AnsBtn1'
        ? {type: 'answer-release', button: 'AnsBtn1', feedbackVariant: wrongVariant}
        : {type: 'answer-release', button: 'AnsBtn2', feedbackVariant: rightVariant});
      observeClock();
    });
  };

  const openKeyterm = (entryId: string, trigger: HTMLButtonElement) => {
    runG4L12Vb036ReadyInteraction({status, invocationValid, inspectionFrame}, () => {
      if (!props.onLessonHostRequest) return;
      interrupt();
      const decision = props.onLessonHostRequest({
        type: 'open-keyterm', entryId, sourceAnimationId: ANIMATION_ID,
        playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume',
      }, {trigger});
      setKeytermStatus(decision && decision.status === 'blocked' ? 'blocked' : 'accepted');
    });
  };

  const closeWrongFeedback = (activation: {kind: 'source-release'; point: Point} | {kind: 'model-control'}) => {
    runG4L12Vb036ReadyInteraction({status, invocationValid, inspectionFrame}, () => {
      if (!clock) return;
      const current = clock.snapshot().state;
      if (current.feedback?.outcome !== 'wrong' || !current.feedback.closePopup?.placed) return;
      if (activation.kind === 'source-release') {
        const hit = resolveG4L12Vb036CloseHitRegion(
          current.feedback.variant as G4L12VB036WrongVariant, current.feedback.localFrame,
        );
        if (!hit || !g4L12Vb036CloseHitContainsPoint(hit, activation.point)) return;
      }
      resetClosePointer();
      clock.interact({type: 'wrong-feedback-close', activation: 'caller-established'});
      observeClock();
    });
  };

  const sourceClosePointer = (event: ReactPointerEvent<HTMLButtonElement>, kind: 'move' | 'down' | 'up' | 'leave') => {
    if (!closeOwnerMounted.current || !event.isPrimary ||
      (closePointer.current.pointerId !== null && closePointer.current.pointerId !== event.pointerId)) return;
    if (closePointer.current.pointerId !== null && !hasClosePointerCapture(closePointer.current.pointerId)) {
      resetClosePointer(); return;
    }
    const scene = readCloseScene(), point = closeSourcePoint(event);
    if (!scene.hit || !point) {resetClosePointer(); return;}
    const canHover = event.pointerType === 'mouse' || event.pointerType === 'pen';
    closeClientPoint.current = {clientX: event.clientX, clientY: event.clientY, canHover};
    const inside = g4L12Vb036CloseHitContainsPoint(scene.hit, point);
    const common = {instanceKey: scene.instanceKey, pointerId: event.pointerId, isPrimary: true, canHover, inside};
    if (kind === 'down') {
      if (event.button !== 0 || !inside || closePointer.current.pointerId !== null) return;
      let captureGranted = false;
      try {event.currentTarget.setPointerCapture(event.pointerId); captureGranted = event.currentTarget.hasPointerCapture(event.pointerId);} catch { /* No press ownership without capture. */ }
      if (captureGranted) {closeCaptureElement.current = event.currentTarget; event.preventDefault();}
      updateClosePointer({...common, type: 'down', button: event.button, captureGranted});
    } else if (kind === 'up') {
      if (updateClosePointer({...common, type: 'up', button: event.button})) {
        closeWrongFeedback({kind: 'source-release', point});
      }
    } else {
      if (kind === 'leave' && closePointer.current.pointerId === null) closeClientPoint.current = null;
      updateClosePointer({...common, type: 'move', inside: kind === 'leave' ? false : inside,
        primaryButtonDown: (event.buttons & 1) !== 0});
    }
  };

  const wrongFeedback = feedback?.outcome === 'wrong' ? feedback : null;
  const answerRegions = controller.answerButtons.every(({interactive}) => interactive) &&
    inspectionFrame === null && status === 'ready'
    ? G4_L12_VB036_SOURCE_ANSWER_HIT_REGIONS
    : [];
  const activeFeedback = feedback?.playback === 'reset-at-frame-1' ? null : feedback;
  const pageKeytermsVisible = status === 'ready' && invocationValid && inspectionFrame === null && activeFeedback === null;
  const nativeFeedback = wrongFeedback?.closePopup?.placed ? wrongFeedback : null;
  const nativeFeedbackGeometry = nativeFeedback
    ? g4L12Vb036FeedbackTextGeometry(nativeFeedback.variant as G4L12VB036WrongVariant, nativeFeedback.localFrame)
    : null;
  const sourceCloseHit = status === 'ready' && invocationValid && inspectionFrame === null && nativeFeedback
    ? resolveG4L12Vb036CloseHitRegion(nativeFeedback.variant as G4L12VB036WrongVariant, nativeFeedback.localFrame)
    : null;
  const nativeLinksEnabled = Boolean(status === 'ready' && invocationValid && inspectionFrame === null &&
    props.onLessonHostRequest && nativeFeedback?.closePopup &&
    nativeFeedback.localFrame >= nativeFeedback.closePopup.firstNonzeroAlphaFrame);
  const active = status === 'ready' && !externallyPaused && !manualPaused && snapshot.running;
  const canvasStatus = status === 'ready' ? 'ready' : status;
  const keytermButtonStyle = useMemo<CSSProperties>(() => ({
    appearance: 'none', border: 0, padding: 0, background: 'transparent', color: '#0000cc',
    font: 'inherit', fontWeight: 700, textDecoration: 'underline', pointerEvents: 'auto', cursor: 'pointer',
  }), []);

  return <div id={sourceId} data-vb036-source-runtime="private-behavior-composite-v1"
    data-source-frame={controller.main.localFrame} data-render-frame={renderFrame}
    data-source-feedback={feedback ? `${feedback.outcome}-${feedback.variant}-${feedback.localFrame}` : 'none'}
    data-source-behavior-state={stateId} data-original-prng-parity="false"
    data-source-close-visual={closeVisual} data-source-close-pointer-id={closePointerState.pointerId ?? 'none'}
    data-source-close-pointer-policy="private-source-graphics-original-lifecycle-unverified"
    data-clock-ordering-parity="unresolved-original-runtime-required"
    data-popup-hit-testing="unresolved-original-runtime-required"
    data-keyterm-binding="same-host-default-candidate-runtime-variant-unverified"
    data-audio-rendered={snapshot.sounding ? 'true' : 'false'} data-audio-acceptance="false"
    data-source-clock-status={snapshot.status} data-source-pcm-sounding={snapshot.sounding ? 'true' : 'false'}
    data-source-pcm-streams={snapshot.soundingStreams.join(',')} data-source-pcm-muted={snapshot.muted ? 'true' : 'false'}
    data-source-latency-samples="1673" data-original-timing-established="false"
    data-source-pcm-loaded={clock && !pcmFailed ? '11' : '0'}
    data-behavior-parity-accepted="false" data-visual-fidelity-accepted="false"
    data-human-accepted="false" data-owner-accepted="false" data-release-eligible="false"
    data-published="false" data-capture-authority="unvalidated-private-engineering">
    <div data-canvas-status={canvasStatus} style={{position: 'relative', width: '100%', maxWidth: 800,
      aspectRatio: '4 / 3', overflow: 'hidden', background: '#b8d8f7'}}>
      <canvas ref={canvas} width={800} height={600} data-course-canvas={ANIMATION_ID}
        aria-label={spanish ? 'Animación fuente privada de simetría rotacional' : 'Private source rotational symmetry animation'}
        style={{display: 'block', width: '100%', height: '100%'}} />
      <div data-vb036-source-hit-regions data-hit-regions-are-rendered-graphics="false"
        style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {pageKeytermsVisible ? resolveG4L12Vb036PageKeytermHitRegions(controller.main.localFrame)
          .map((region) => <button type="button" key={region.sourceCharacterId}
            data-source-button-id={region.sourceCharacterId}
            data-source-hit-area-object-id={region.sourceHitAreaObjectId}
            data-source-key-attribute={region.keyAttribute}
            data-source-alpha={region.sourceAlpha}
            data-source-fully-revealed={region.fullyRevealed ? 'true' : 'false'}
            aria-label={spanish ? `Abrir término fuente: ${region.keyAttribute}` : `Open source term: ${region.keyAttribute}`}
            disabled={!props.onLessonHostRequest}
            onClick={(event) => openKeyterm(KEYTERMS[region.keyAttribute], event.currentTarget)}
            style={polygonStyle(region.points)} />) : null}
        {answerRegions.map((region) => <button type="button" key={region.instanceName}
          data-source-button-id={region.instanceName}
          data-source-character-id={region.sourceCharacterId}
          data-source-hit-area-object-id={region.sourceHitAreaObjectId}
          data-source-outcome={region.outcome}
          aria-label={spanish ? `Botón de respuesta fuente ${region.instanceName}` : `Source answer button ${region.instanceName}`}
          onClick={() => answer(region)} style={polygonStyle(region.points)} />)}
        {sourceCloseHit ? <button type="button" tabIndex={-1} aria-hidden="true"
          data-vb036-source-close-hit data-source-button-id="BtnClose"
          data-source-character-id={sourceCloseHit.sourceButtonCharacterId}
          data-source-hit-area-object-id={sourceCloseHit.sourceHitAreaObjectId}
          data-source-alpha={sourceCloseHit.sourceAlpha}
          data-source-hit-geometry={sourceCloseHit.geometry}
          data-original-hit-parity="unverified" data-button-down-audio="not-scheduled"
          onPointerEnter={(event) => sourceClosePointer(event, 'move')}
          onPointerMove={(event) => sourceClosePointer(event, 'move')}
          onPointerLeave={(event) => sourceClosePointer(event, 'leave')}
          onPointerDown={(event) => sourceClosePointer(event, 'down')}
          onPointerUp={(event) => sourceClosePointer(event, 'up')}
          onPointerCancel={(event) => {
            if (event.pointerId === closePointer.current.pointerId) {closeClientPoint.current = null; updateClosePointer({type: 'cancel', pointerId: event.pointerId});}
          }}
          onLostPointerCapture={(event) => {
            if (event.pointerId === closePointer.current.pointerId) {closeClientPoint.current = null; updateClosePointer({type: 'cancel', pointerId: event.pointerId});}
          }}
          draggable={false} style={{...polygonStyle(sourceCloseHit.points), touchAction: 'none', userSelect: 'none'}} /> : null}
      </div>
      {nativeFeedback && nativeFeedbackGeometry ? <svg viewBox="0 0 800 600"
        data-vb036-source-feedback-html data-source-field-object-id="43"
        data-source-font-object-id="42" data-source-html-sanitized="true"
        data-raster-parity="unproven-native-html-overlay"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%',
          overflow: 'visible', pointerEvents: 'none'}}>
        <foreignObject x={0} y={0} width={nativeFeedbackGeometry.width}
          height={nativeFeedbackGeometry.height} transform={nativeFeedbackGeometry.transform}
          opacity={nativeFeedbackGeometry.opacity} style={{overflow: 'hidden', pointerEvents: 'none'}}>
          <div style={{width: '100%', height: '100%', overflow: 'hidden', color: '#000',
            fontFamily: `'Bauhaus Md BT', 'Arial Rounded MT Bold', sans-serif`,
            fontSize: FEEDBACK_FIELD.sourceFontHeightTwips / 20, fontWeight: 700,
            lineHeight: `${(FEEDBACK_FIELD.sourceFontHeightTwips + FEEDBACK_FIELD.sourceLeadingTwips) / 20}px`,
            pointerEvents: 'none'}}>
            Does this <button type="button" style={keytermButtonStyle}
              disabled={!nativeLinksEnabled}
              onClick={(event) => openKeyterm(KEYTERMS.Figure, event.currentTarget)}>figure</button> have a{' '}
            <button type="button" style={keytermButtonStyle} disabled={!nativeLinksEnabled}
              onClick={(event) => openKeyterm(KEYTERMS.Center, event.currentTarget)}>central</button>{'\u00a0'}
            <button type="button" style={keytermButtonStyle} disabled={!nativeLinksEnabled}
              onClick={(event) => openKeyterm(KEYTERMS.Point, event.currentTarget)}>point</button>{' '}
            around which it can be turned and still look the same?&nbsp; Try again.
          </div>
        </foreignObject>
      </svg> : null}
    </div>
    <G4L12CalibrationCompanion targetId={props.pageInteractionCompanionTargetId}>
      <section aria-label={spanish ? 'Controles privados de comportamiento fuente' : 'Private source behavior controls'}
        data-vb036-source-controls className="runtime-toolbar" style={{display: 'grid', gap: 12, padding: 16}}>
        <p style={{margin: 0}}>{spanish
          ? 'Calibración privada: PCM continuo con 1673 muestras de latencia declarada, 12 fps y variantes explícitas. La sincronización original, los bloques terminales y el audio de pulsación de Close no están verificados.'
          : 'Private calibration: continuous PCM with declared 1673-sample latency, 12 fps and explicit variants. Original timing, terminal-block consumption and Close button-down audio are not verified.'}</p>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center'}}>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || status !== 'ready' || externallyPaused || active || inspectionFrame !== null || snapshot.status === 'complete'}
            onClick={() => {setManualPaused(false); clock?.unmute(); void clock?.play();}}>
            {spanish ? 'Reproducir modelo' : 'Play model'}</button>
          <button type="button" style={BUTTON_STYLE} disabled={status !== 'ready' || !active}
            onClick={interrupt}>{spanish ? 'Pausar modelo' : 'Pause model'}</button>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || status !== 'ready'} onClick={replay}>
            {props.labels.replay}</button>
          <button type="button" style={BUTTON_STYLE} disabled={!clock || inspectionFrame !== null || snapshot.status === 'complete'}
            onClick={() => {if (snapshot.muted) clock?.unmute(); else clock?.mute(); observeClock();}}>
            {snapshot.muted ? (spanish ? 'Activar PCM fuente' : 'Unmute source PCM')
              : (spanish ? 'Silenciar PCM fuente' : 'Mute source PCM')}</button>
          {pcmFailed ? <button type="button" style={BUTTON_STYLE} onClick={() => setPcmRevision((value) => value + 1)}>
            {spanish ? 'Reintentar PCM' : 'Retry PCM'}</button> : null}
          <label>{spanish ? 'Error explícito' : 'Explicit wrong variant'}{' '}
            <select value={wrongVariant} onChange={(event) => setWrongVariant(Number(event.target.value) as G4L12VB036WrongVariant)}>
              {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>{spanish ? 'Acierto explícito' : 'Explicit right variant'}{' '}
            <select value={rightVariant} onChange={(event) => setRightVariant(Number(event.target.value) as G4L12VB036RightVariant)}>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {wrongFeedback?.closePopup?.placed ? <button type="button" style={BUTTON_STYLE}
            data-wrong-close-activation="caller-established"
            data-source-popup-hit-test-authority="unresolved"
            disabled={status !== 'ready' || !invocationValid || inspectionFrame !== null}
            onClick={() => closeWrongFeedback({kind: 'model-control'})}>{spanish ? 'Cerrar feedback del modelo' : 'Close model feedback'}</button> : null}
        </div>
        <p role="status" style={{margin: 0}}>{status === 'failed'
          ? (spanish ? 'El comportamiento privado no está disponible.' : 'Private behavior is unavailable.')
          : pcmFailed ? (spanish ? 'PCM privado no disponible.' : 'Private PCM is unavailable.')
            : !clock ? (spanish ? 'Cargando 11 flujos PCM.' : 'Loading 11 PCM streams.')
              : snapshot.status === 'blocked' ? (spanish ? 'Pulsa Reproducir modelo para habilitar PCM.' : 'Use Play model to enable PCM.')
                : reduced ? props.labels.reduced
                  : inspectionFrame !== null
                    ? `${spanish ? 'Inspección' : 'Inspection'} ${inspectionFrame} / 82`
                    : `${controller.main.localFrame} / 82 · ${snapshot.status}${feedback ? ` · ${feedback.outcome} ${feedback.variant} · ${feedback.localFrame}` : ''}`}
          {keytermStatus === 'blocked' ? (spanish ? ' · término bloqueado' : ' · term blocked') : ''}</p>
        <p style={{margin: 0, fontSize: '0.85em'}} data-vb036-source-evidence-boundary>
          text43 · Bauhaus Md BT 15px · native HTML overlay · raster parity unproven · Close Up/Over/Down graphics source-derived; private pointer policy and original-runtime hit/audio parity unverified
        </p>
      </section>
    </G4L12CalibrationCompanion>
  </div>;
}
