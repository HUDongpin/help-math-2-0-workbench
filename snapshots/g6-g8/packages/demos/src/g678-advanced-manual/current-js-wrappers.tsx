"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";

import type {
  AnimationInteractiveStop,
  AnimationInteractiveSeekCapability,
  AnimationRendererProps,
} from "../contract";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "../source-static-canvas-candidate";
import {
  createDat001State,
  DAT001_L05_P040_BEHAVIOR_IR_V1,
  reduceDat001,
  type DatFeedbackDomainId,
  type DatSourceId,
  type DatTargetId,
} from "./dat001-l05-p040";
import {
  createGeo001State,
  reduceGeo001,
} from "./geo001-l01-p001";
import {
  createNms002State,
  NMS002_L11_P030_BEHAVIOR_IR_V1,
  reduceNms002,
  type NmsAnswerId,
  type NmsFeedbackDomainId,
} from "./nms002-l11-p030";
import {selectHostFeedback} from "./host-feedback-selector";

interface AdvancedManualCandidateInput {
  readonly config: SourceStaticCanvasCandidateConfig;
  readonly sourceContract: Readonly<Record<string, unknown>>;
  readonly interactiveStops?: readonly AnimationInteractiveStop[];
  readonly interactiveSeek?: AnimationInteractiveSeekCapability | null;
}

const boundaryStyle = Object.freeze({
  background: "#fff7db",
  border: "1px solid #c68a00",
  borderRadius: 8,
  color: "#4c3500",
  marginTop: 12,
  padding: 12,
} as const);

const controlsStyle = Object.freeze({
  background: "#f7fbff",
  border: "1px solid #9abbd2",
  borderRadius: 8,
  display: "grid",
  gap: 10,
  marginTop: 12,
  padding: 12,
} as const);

function validateInteractiveStops(
  config: SourceStaticCanvasCandidateConfig,
  stops: readonly AnimationInteractiveStop[],
  required: boolean,
) {
  if (stops.length !== (required ? 1 : 0)) {
    throw new Error("advanced-manual interactive-stop membership is invalid");
  }
  for (const stop of stops) {
    if (stop.frameDomain !== config.mainFrameDomain ||
      stop.stopFrame >= (config.livePlaybackEndFrame ?? config.mainFrameCount) ||
      stop.resumeFrame !== stop.stopFrame + 1 ||
      stop.completionDisposition !== "blocked-while-unresolved" ||
      stop.requiresHostInteractiveStop !== true ||
      stop.strictAcceptanceEffect !== "none") {
      throw new Error("advanced-manual interactive-stop contract is invalid");
    }
  }
  return Object.freeze(stops.map((stop) => Object.freeze({...stop})));
}

function validateInteractiveSeek(
  config: SourceStaticCanvasCandidateConfig,
  capability: AnimationInteractiveSeekCapability | null | undefined,
  required: boolean,
) {
  if (!capability) {
    if (required) {
      throw new Error("advanced-manual interactive-seek capability is required");
    }
    return null;
  }
  if (!required || capability.frameDomain !== config.mainFrameDomain ||
    capability.minimumFrame !== 1 ||
    capability.maximumFrame !== config.mainFrameCount ||
    capability.terminalFrame !== config.mainFrameCount ||
    capability.resumeDisposition !== "resume-only-when-nonterminal" ||
    capability.requiresHostSeekConsumer !== true ||
    capability.strictAcceptanceEffect !== "none") {
    throw new Error("advanced-manual interactive-seek contract is invalid");
  }
  return Object.freeze({...capability});
}

function useHostReplay(
  replay: number | undefined,
  reset: () => void,
) {
  const observed = useRef(replay ?? 0);
  useEffect(() => {
    const next = replay ?? 0;
    if (next !== observed.current) {
      observed.current = next;
      reset();
    }
  }, [replay, reset]);
}

interface FeedbackTimelineInput {
  readonly key: string;
  readonly frameCount: number;
  readonly pauseFrame?: number;
}

interface FeedbackTimelineState {
  readonly key: string | null;
  readonly frame: number;
  readonly dismissed: boolean;
  readonly finished: boolean;
}

/**
 * Runs one source feedback sprite at the authored 12 FPS. NMS wrong feedback
 * holds at source frame 22 until the maintained dismissal control is used;
 * every other domain advances to its exact terminal frame. Audio is neither
 * decoded nor advertised by this visual clock.
 */
function useFeedbackTimeline(
  active: FeedbackTimelineInput | null,
  onFinished: () => void,
) {
  const [timeline, setTimeline] = useState<FeedbackTimelineState>({
    key: null,
    frame: 1,
    dismissed: false,
    finished: false,
  });
  useEffect(() => {
    setTimeline(active
      ? {key: active.key, frame: 1, dismissed: false, finished: false}
      : {key: null, frame: 1, dismissed: false, finished: false});
  }, [active?.key]);
  useEffect(() => {
    if (!active || timeline.key !== active.key || timeline.finished) return;
    if (timeline.frame >= active.frameCount) {
      setTimeline((current) => current.key === active.key
        ? {...current, finished: true}
        : current);
      onFinished();
      return;
    }
    if (active.pauseFrame && timeline.frame >= active.pauseFrame &&
      !timeline.dismissed) return;
    const timer = window.setTimeout(() => {
      setTimeline((current) => current.key === active.key
        ? {...current, frame: Math.min(current.frame + 1, active.frameCount)}
        : current);
    }, 1000 / 12);
    return () => window.clearTimeout(timer);
  }, [
    active,
    onFinished,
    timeline.dismissed,
    timeline.finished,
    timeline.frame,
    timeline.key,
  ]);
  return Object.freeze({
    frame: timeline.key === active?.key ? timeline.frame : 1,
    pausedForDismissal: Boolean(active?.pauseFrame &&
      timeline.key === active.key &&
      timeline.frame >= active.pauseFrame && !timeline.dismissed),
    dismiss: () => setTimeline((current) => active &&
      current.key === active.key
      ? {...current, dismissed: true}
      : current),
  });
}

function EngineeringBoundary({children}: {readonly children: React.ReactNode}) {
  return (
    <p
      aria-live="polite"
      data-audio-accepted="false"
      data-authoritative-original-runtime="false"
      data-human-visual-accepted="false"
      data-owner-accepted="false"
      data-published="false"
      data-released="false"
      data-strict-complete="false"
      data-visual-fidelity-accepted="false"
      style={boundaryStyle}
    >
      {children}
    </p>
  );
}

export function createGeo001AdvancedManualCandidate({
  config,
  sourceContract,
  interactiveStops = [],
  interactiveSeek,
}: AdvancedManualCandidateInput) {
  const productStops = validateInteractiveStops(config, interactiveStops, false);
  const productSeek = validateInteractiveSeek(config, interactiveSeek, true);
  if (!productSeek) {
    throw new Error("GEO advanced-manual seek capability is unavailable");
  }
  const seekCapability: AnimationInteractiveSeekCapability = productSeek;
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(() => reduceGeo001(
      createGeo001State(),
      {
        type: "observe-media-frame",
        frame: props.frame,
        playing: props.frame < config.mainFrameCount,
      },
    ));
    const resetInteraction = () => setState((current) =>
      reduceGeo001(current, {type: "replay", input: "mouse"}));
    useHostReplay(props.replay, resetInteraction);
    useEffect(() => {
      setState((current) => current.dragging || !current.mediaPlaying
        ? current
        : reduceGeo001(current, {
            type: "observe-media-frame",
            frame: props.frame,
            playing: props.frame < config.mainFrameCount,
          }));
    }, [config.mainFrameCount, props.frame]);

    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const mainEnglish = frameDomain === config.mainFrameDomain &&
      props.lang === "en" && props.scenario === "source-static-frame";
    const visualProps = mainEnglish
      ? {...props, frame: state.mediaFrame, frameDomain: config.mainFrameDomain}
      : props;
    const rangeValue = state.mediaFrame;

    return (
      <section
        aria-label="Geometry introduction advanced-manual Current-JS candidate"
        data-advanced-manual-kind="accessible-source-seek"
        data-current-javascript-candidate="private-local-only"
        data-feedback-variant-status="not-applicable"
        data-host-seek-consumer-status={
          props.onSeekIntent ? "available" : "blocked"
        }
      >
        <SourceRenderer {...visualProps} />
        {mainEnglish ? (
          <div aria-label="Source media controls" style={controlsStyle}>
            <label htmlFor="shared-geo001-l01-p001-seek">
              Source media frame {rangeValue} of 127
            </label>
            <input
              aria-valuemax={127}
              aria-valuemin={1}
              aria-valuenow={rangeValue}
              id="shared-geo001-l01-p001-seek"
              max={127}
              min={1}
              onChange={(event) => {
                const frame = Number(event.currentTarget.value);
                const x = ((frame - 1) / 127) * 110;
                setState((current) => reduceGeo001(current, {
                  type: "click-seek",
                  input: "mouse",
                  x,
                }));
                props.onSeekIntent?.({
                  capabilityId: seekCapability.id,
                  frameDomain: seekCapability.frameDomain,
                  targetFrame: frame,
                  input: "native-range-change",
                  source: "maintained-source-derived-range",
                });
              }}
              step={1}
              type="range"
              value={rangeValue}
            />
            <button onClick={resetInteraction} type="button">
              Reset interaction
            </button>
            <output aria-live="polite">
              {props.onSeekIntent
                ? state.mediaPlaying
                  ? "The host accepted a nonterminal seek intent."
                  : "The host accepted a terminal seek intent."
                : "Local frame preview only; product playhead seek and resume are blocked until the host consumes the typed seek intent."}
            </output>
          </div>
        ) : null}
        <EngineeringBoundary>
          The 127-frame source drawing, seek formula, and local Canvas preview
          are active. Outer product playhead seek/resume is blocked until the
          host consumes the typed intent. The exported legacy FUI scrollbar is
          not proven to be placed in sprite-142, so its page use remains
          blocked. Embedded audio,
          Spanish behavior, original-runtime parity, fidelity, human and Owner
          acceptance, strict completion, release, and publication remain false.
        </EngineeringBoundary>
      </section>
    );
  }

  const module = Object.freeze({
    ...sourceCandidate.module,
    ...(productStops.length > 0
      ? {interactiveStops: productStops}
      : {}),
    interactiveSeek: seekCapability,
    maturity: "private-current-js" as const,
    Renderer,
  });
  return Object.freeze({
    ...sourceCandidate,
    Renderer,
    module,
    sourceContract: Object.freeze({
      ...sourceCandidate.sourceContract,
      ...sourceContract,
      behaviorStateMachine: "maintained-source-bound-advanced-manual",
      feedbackVariantSelection: "not-applicable",
    }),
  });
}

export function createNms002AdvancedManualCandidate({
  config,
  sourceContract,
  interactiveStops = [],
  interactiveSeek,
}: AdvancedManualCandidateInput) {
  const productStops = validateInteractiveStops(config, interactiveStops, true);
  validateInteractiveSeek(config, interactiveSeek, false);
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;
  const answerIds = Object.freeze([
    "AnsBtn1",
    "AnsBtn2",
    "AnsBtn3",
    "AnsBtn4",
  ] as const satisfies readonly NmsAnswerId[]);

  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(createNms002State);
    const resolutionPublished = useRef(false);
    const resetInteraction = () => setState((current) =>
      reduceNms002(current, {type: "replay", input: "mouse"}));
    useHostReplay(props.replay, resetInteraction);
    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const mainEnglish = frameDomain === config.mainFrameDomain &&
      props.lang === "en" && props.scenario === "source-static-frame";
    const questionVisible = mainEnglish && props.frame === 97;
    const activeDomain = state.phase === "feedback-active" &&
      state.pendingFeedback?.domainId
      ? NMS002_L11_P030_BEHAVIOR_IR_V1.feedbackAudioDomains.find(
          (domain) => domain.id === state.pendingFeedback?.domainId,
        ) ?? null
      : null;
    const activeTimeline = useMemo(() => activeDomain
      ? {
          key: activeDomain.id,
          frameCount: activeDomain.frameCount,
          ...(activeDomain.kind === "wrong" ? {pauseFrame: 22} : {}),
        }
      : null, [activeDomain]);
    const finishFeedback = useCallback(() => {
      setState((current) => reduceNms002(current, {type: "feedback-finished"}));
    }, []);
    const feedbackTimeline = useFeedbackTimeline(
      activeTimeline,
      finishFeedback,
    );
    useEffect(() => {
      if (state.phase !== "resumed") {
        resolutionPublished.current = false;
        return;
      }
      if (resolutionPublished.current || !props.onInteractiveStopResolved) return;
      resolutionPublished.current = true;
      const stop = productStops[0];
      props.onInteractiveStopResolved({
        stopId: stop.id,
        frameDomain: stop.frameDomain,
        resolution: stop.resolution,
        source: "maintained-source-derived-interaction",
      });
    }, [props.onInteractiveStopResolved, state.phase]);
    const chooseAnswer = (answerId: NmsAnswerId) => {
      setState((current) => {
        const pending = reduceNms002(current, {
          type: "choose-answer",
          input: "mouse",
          answerId,
        });
        if (pending.phase !== "feedback-pending-host" ||
          !pending.pendingFeedback) return pending;
        const selected = selectHostFeedback(
          pending.pendingFeedback.kind,
          props.seed,
        );
        return reduceNms002(pending, {
          type: "resolve-feedback-domain",
          domainId: selected.instanceName as NmsFeedbackDomainId,
        });
      });
    };

    return (
      <section
        aria-label="Rational numbers advanced-manual Current-JS candidate"
        data-advanced-manual-kind="choice-attempt-feedback"
        data-current-javascript-candidate="private-local-only"
        data-requires-host-interactive-stop="true"
        data-feedback-variant-status={
          activeDomain ? `source-host-selected-${activeDomain.id}` : "not-active"
        }
        data-host-interactive-stop-consumer-status={
          props.onInteractiveStopResolved ? "available" : "blocked"
        }
      >
        <SourceRenderer {...props} />
        {questionVisible ? (
          <div aria-label="Source question controls" style={controlsStyle}>
            <button
              disabled={!state.hintButtonEnabled}
              onClick={() => setState((current) => reduceNms002(current, {
                type: "open-hint",
                input: "mouse",
              }))}
              type="button"
            >
              Need More Help
            </button>
            {state.phase === "hint-open" ? (
              <div role="status">
                <p>
                  The historical hint content belongs to the unresolved source
                  host and is not reconstructed in this page module.
                </p>
                <button
                  onClick={() => setState((current) => reduceNms002(current, {
                    type: "close-hint",
                    input: "mouse",
                  }))}
                  type="button"
                >
                  Close hint
                </button>
              </div>
            ) : null}
            <fieldset disabled={!state.answerControlsEnabled}>
              <legend>Select one source answer option</legend>
              {answerIds.map((answerId, index) => (
                <button
                  aria-label={`Source answer option ${index + 1}`}
                  key={answerId}
                  onClick={() => chooseAnswer(answerId)}
                  type="button"
                >
                  {answerId}
                </button>
              ))}
            </fieldset>
            {activeDomain ? (
              <div
                aria-label={`Source feedback ${activeDomain.id}`}
                data-feedback-audio-accepted="false"
                data-feedback-frame={feedbackTimeline.frame}
                data-feedback-frame-domain={`sprite-${activeDomain.objectId}`}
              >
                <SourceRenderer
                  {...props}
                  frame={feedbackTimeline.frame}
                  frameDomain={`sprite-${activeDomain.objectId}`}
                  state={undefined}
                />
                {state.pendingFeedback?.kind === "wrong" &&
                feedbackTimeline.pausedForDismissal ? (
                  <button
                    onClick={() => {
                      setState((current) => reduceNms002(current, {
                        type: "dismiss-wrong-feedback",
                        input: "mouse",
                      }));
                      feedbackTimeline.dismiss();
                    }}
                    type="button"
                  >
                    Continue feedback
                  </button>
                ) : null}
              </div>
            ) : null}
            <button onClick={resetInteraction} type="button">
              Reset interaction
            </button>
          </div>
        ) : null}
        <EngineeringBoundary>
          The source frame-97 answer and hint controls use a maintained pure
          state machine. The product-host 3-wrong/4-right branch cardinality is
          source-bound and uses the maintained page seed for deterministic
          branch exhaustion; it does not claim Adobe random-state parity.
          Feedback audio, Spanish behavior, original-runtime parity, fidelity,
          human and Owner acceptance, strict completion, release, and
          publication remain false.
        </EngineeringBoundary>
      </section>
    );
  }

  const module = Object.freeze({
    ...sourceCandidate.module,
    interactiveStops: productStops,
    maturity: "private-current-js" as const,
    Renderer,
  });
  return Object.freeze({
    ...sourceCandidate,
    Renderer,
    module,
    sourceContract: Object.freeze({
      ...sourceCandidate.sourceContract,
      ...sourceContract,
      behaviorStateMachine: "maintained-source-bound-advanced-manual",
      feedbackVariantSelection: "source-host-cardinality-page-seed-v1",
      feedbackAudioDomainCount: 9,
    }),
  });
}

export function createDat001AdvancedManualCandidate({
  config,
  sourceContract,
  interactiveStops = [],
  interactiveSeek,
}: AdvancedManualCandidateInput) {
  const productStops = validateInteractiveStops(config, interactiveStops, true);
  validateInteractiveSeek(config, interactiveSeek, false);
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;
  const sourceIds = Object.freeze([
    "Src_1",
    "Src_2",
    "Src_3",
    "Src_4",
    "Src_5",
  ] as const satisfies readonly DatSourceId[]);
  const targetIds = Object.freeze([
    "Tar_1",
    "Tar_2",
    "Tar_3",
    "Tar_4",
    "Tar_5",
  ] as const satisfies readonly DatTargetId[]);

  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(createDat001State);
    const resolutionPublished = useRef(false);
    const resetInteraction = () => setState((current) =>
      reduceDat001(current, {type: "replay", input: "mouse"}));
    useHostReplay(props.replay, resetInteraction);
    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const mainEnglish = frameDomain === config.mainFrameDomain &&
      props.lang === "en" && props.scenario === "source-static-frame";
    const interactionVisible = mainEnglish && props.frame === 238;
    const activeDomain = state.phase === "feedback-active" &&
      state.pendingFeedback?.domainId
      ? DAT001_L05_P040_BEHAVIOR_IR_V1.feedbackAudioDomains.find(
          (domain) => domain.id === state.pendingFeedback?.domainId,
        ) ?? null
      : null;
    const activeTimeline = useMemo(() => activeDomain
      ? {key: activeDomain.id, frameCount: activeDomain.frameCount}
      : null, [activeDomain]);
    const finishFeedback = useCallback(() => {
      setState((current) => reduceDat001(current, {type: "feedback-finished"}));
    }, []);
    const feedbackTimeline = useFeedbackTimeline(
      activeTimeline,
      finishFeedback,
    );
    useEffect(() => {
      if (state.phase !== "resumed") {
        resolutionPublished.current = false;
        return;
      }
      if (resolutionPublished.current || !props.onInteractiveStopResolved) return;
      resolutionPublished.current = true;
      const stop = productStops[0];
      props.onInteractiveStopResolved({
        stopId: stop.id,
        frameDomain: stop.frameDomain,
        resolution: stop.resolution,
        source: "maintained-source-derived-interaction",
      });
    }, [props.onInteractiveStopResolved, state.phase]);

    const activate = (sourceId: DatSourceId) => setState((current) =>
      reduceDat001(current, {
        type: "activate-source",
        input: "mouse",
        sourceId,
      }));
    const drop = (targetId: DatTargetId) => setState((current) => {
      const pending = reduceDat001(current, {
        type: "drop-on-target",
        input: "mouse",
        targetId,
      });
      if (pending.phase !== "feedback-pending-host" ||
        !pending.pendingFeedback) return pending;
      const selected = selectHostFeedback(
        pending.pendingFeedback.kind,
        props.seed,
      );
      return reduceDat001(pending, {
        type: "resolve-feedback-domain",
        domainId: selected.instanceName as DatFeedbackDomainId,
      });
    });

    return (
      <section
        aria-label="Probability drag-drop advanced-manual Current-JS candidate"
        data-advanced-manual-kind="five-item-drag-drop"
        data-current-javascript-candidate="private-local-only"
        data-requires-host-interactive-stop="true"
        data-feedback-variant-status={
          activeDomain ? `source-host-selected-${activeDomain.id}` : "not-active"
        }
        data-host-interactive-stop-consumer-status={
          props.onInteractiveStopResolved ? "available" : "blocked"
        }
      >
        <SourceRenderer {...props} />
        {interactionVisible ? (
          <div aria-label="Five source drag and drop controls" style={controlsStyle}>
            <p>
              Pick one exact source instance, then activate its matching target.
              Pointer drag and native button keyboard activation share the same
              source-bound reducer.
            </p>
            <div aria-label="Source items" role="group">
              {sourceIds.map((sourceId) => (
                <button
                  aria-pressed={state.activeSource === sourceId}
                  disabled={state.items[sourceId].locked || state.phase !== "selecting"}
                  draggable={!state.items[sourceId].locked && state.phase === "selecting"}
                  key={sourceId}
                  onClick={() => activate(sourceId)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", sourceId);
                    activate(sourceId);
                  }}
                  type="button"
                >
                  {sourceId}{state.items[sourceId].locked ? " — placed" : ""}
                </button>
              ))}
            </div>
            <div aria-label="Drop targets" role="group">
              {targetIds.map((targetId) => (
                <button
                  disabled={state.phase !== "dragging"}
                  key={targetId}
                  onClick={() => drop(targetId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    drop(targetId);
                  }}
                  type="button"
                >
                  {targetId}
                </button>
              ))}
            </div>
            <output aria-live="polite">
              {state.quizDragCount} of 5 exact suffix-matched drops recorded.
            </output>
            {activeDomain ? (
              <div
                aria-label={`Source feedback ${activeDomain.id}`}
                data-feedback-audio-accepted="false"
                data-feedback-frame={feedbackTimeline.frame}
                data-feedback-frame-domain={`sprite-${activeDomain.objectId}`}
              >
                <SourceRenderer
                  {...props}
                  frame={feedbackTimeline.frame}
                  frameDomain={`sprite-${activeDomain.objectId}`}
                  state={undefined}
                />
              </div>
            ) : null}
            {state.blockedReason ? (
              <p aria-live="polite" role="status">{state.blockedReason}</p>
            ) : null}
            <button onClick={resetInteraction} type="button">
              Reset interaction
            </button>
          </div>
        ) : null}
        <EngineeringBoundary>
          The frame-238 Src_1…Src_5 to Tar_1…Tar_5 suffix and _droptarget
          contract is implemented with pointer and keyboard controls. The
          product-host 3-wrong/4-right branch cardinality is source-bound and
          uses the maintained page seed for deterministic branch exhaustion;
          it does not claim Adobe random-state parity. Feedback audio, Spanish
          behavior, original-runtime parity, fidelity, human and Owner
          acceptance, strict completion, release, and publication remain false.
        </EngineeringBoundary>
      </section>
    );
  }

  const module = Object.freeze({
    ...sourceCandidate.module,
    interactiveStops: productStops,
    maturity: "private-current-js" as const,
    Renderer,
  });
  return Object.freeze({
    ...sourceCandidate,
    Renderer,
    module,
    sourceContract: Object.freeze({
      ...sourceCandidate.sourceContract,
      ...sourceContract,
      behaviorStateMachine: "maintained-source-bound-advanced-manual",
      feedbackVariantSelection: "source-host-cardinality-page-seed-v1",
      feedbackAudioDomainCount: 7,
    }),
  });
}
