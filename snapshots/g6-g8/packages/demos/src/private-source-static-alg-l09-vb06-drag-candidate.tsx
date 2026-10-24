"use client";

import React, {useEffect, useRef, useState} from "react";

import type {
  AnimationInteractiveStop,
  AnimationRendererProps,
} from "./contract";
import {
  ALG_L09_VB06_DRAG_BEHAVIOR_V1,
  createAlgL09Vb06State,
  reduceAlgL09Vb06,
  type AlgL09Vb06Input,
  type AlgL09Vb06SourceId,
  type AlgL09Vb06TargetId,
} from "./g678-alg-l09-vb06-drag";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

export interface AlgL09Vb06GlossaryTerm {
  readonly id: string;
  readonly sourceKeyAttribute: string;
  readonly sourceCharacterId: number;
  readonly firstFrame: number;
  readonly labels: Readonly<{en: string; es: string}>;
}

export interface AlgL09Vb06CandidateOptions {
  readonly calibrationId: "g678-alg-l09-vb06-drag-product-calibration-v1";
  readonly glossaryTerms: readonly AlgL09Vb06GlossaryTerm[];
}

const STOP: AnimationInteractiveStop = Object.freeze({
  id: "shared-alg001-l09-p012-drag-set",
  frameDomain: "sprite-78",
  stopFrame: 129,
  resumeFrame: 130,
  resolution: "explicit-source-drag-set-finished",
  completionDisposition: "blocked-while-unresolved",
  requiresHostInteractiveStop: true,
  strictAcceptanceEffect: "none",
});

const SOURCE_LABELS: Readonly<Record<AlgL09Vb06SourceId, string>> =
  Object.freeze({
    "drag-1": "Source pair 1: source graphic with 50 and 100",
    "drag-2": "10 over 30 equals 1 over 3",
    "drag-3": "1 over 1 and 3 over 9; 2 over 4 and 4 over 16",
    "drag-4": "1 over 2 and 80 over 160; 25 over 50 and 50 over 100",
  });

const TARGET_LABELS: Readonly<Record<AlgL09Vb06TargetId, string>> =
  Object.freeze({
    "drop-1": "Proportional slot 1",
    "drop-2": "Proportional slot 2",
    "drop-3": "Non-proportional slot 1",
    "drop-4": "Non-proportional slot 2",
  });

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function activationInput(key: string): AlgL09Vb06Input | null {
  if (key === "Enter") return "enter";
  if (key === " ") return "space";
  return null;
}

export function createPrivateSourceStaticAlgL09Vb06DragCandidate(
  config: SourceStaticCanvasCandidateConfig,
  options: AlgL09Vb06CandidateOptions,
) {
  invariant(config.animationId === "shared-alg001-l09-p012" &&
    config.mainFrameDomain === STOP.frameDomain &&
    config.mainFrameCount === 188 &&
    config.livePlaybackEndFrame === 188,
  "ALG L9 VB06 runtime identity is invalid");
  invariant(options.glossaryTerms.length === 3 &&
    options.glossaryTerms.map((term) => term.sourceKeyAttribute).join("|") ===
      "Proportional relationship|Non-proportional relationship|Quantity" &&
    new Set(options.glossaryTerms.map((term) =>
      term.sourceCharacterId)).size === 3,
  "ALG L9 VB06 glossary identity is invalid");
  const sourceCandidate = createSourceStaticCanvasCandidate(config);
  const SourceRenderer = sourceCandidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const [state, setState] = useState(createAlgL09Vb06State);
    const resolutionSent = useRef(false);
    const previousReplay = useRef(props.replay ?? 0);

    useEffect(() => {
      setState((current) => reduceAlgL09Vb06(current,
        {type: "observe-frame", frame: props.frame}));
    }, [props.frame]);

    useEffect(() => {
      const replay = props.replay ?? 0;
      if (replay === previousReplay.current) return;
      previousReplay.current = replay;
      resolutionSent.current = false;
      setState((current) => reduceAlgL09Vb06(current,
        {type: "replay", input: "mouse"}));
    }, [props.replay]);

    useEffect(() => {
      if (state.phase !== "resolved" || resolutionSent.current ||
        !props.onInteractiveStopResolved) return;
      resolutionSent.current = true;
      props.onInteractiveStopResolved({
        stopId: STOP.id,
        frameDomain: STOP.frameDomain,
        resolution: STOP.resolution,
        source: "maintained-source-derived-interaction",
      });
    }, [props.onInteractiveStopResolved, state.phase]);

    const frameDomain = props.frameDomain ?? config.mainFrameDomain;
    const interactionFrame = frameDomain === config.mainFrameDomain &&
      props.scenario === "source-static-frame" &&
      props.frame >= STOP.stopFrame && state.phase !== "resumed";
    const visualProps = interactionFrame
      ? {...props, frame: STOP.stopFrame}
      : props;

    const pick = (sourceId: AlgL09Vb06SourceId,
      input: AlgL09Vb06Input) => setState((current) =>
      reduceAlgL09Vb06(current, {type: "pick-source", sourceId, input}));
    const drop = (sourceId: AlgL09Vb06SourceId,
      targetId: AlgL09Vb06TargetId, input: AlgL09Vb06Input) =>
      setState((current) => reduceAlgL09Vb06(current,
        {type: "drop-source", sourceId, targetId, input}));

    const openGlossary = (entryId: string, trigger: HTMLButtonElement) => {
      props.onLessonHostRequest?.(
        {type: "open-glossary", entryId},
        {trigger},
      );
    };

    return (
      <section
        aria-label="Proportional relationship source activity"
        data-advanced-manual-kind="four-source-grouped-drag-drop"
        data-audio-accepted="false"
        data-current-javascript-candidate="private-local-only"
        data-host-stop-consumer-status={
          props.onInteractiveStopResolved ? "available" : "blocked"
        }
        data-quiz-drag-count={state.quizDragCount}
        data-source-stop-frame={STOP.stopFrame}
      >
        <SourceRenderer {...visualProps} />
        {interactionFrame ? (
          <div
            aria-label="Classify each source pair"
            style={{display: "grid", gap: 12, marginTop: 12}}
          >
            <div style={{display: "grid", gap: 8}}>
              {(Object.keys(SOURCE_LABELS) as AlgL09Vb06SourceId[]).map(
                (sourceId) => {
                  const placed = state.placements[sourceId];
                  const selected = state.selectedSource === sourceId;
                  return (
                    <button
                      aria-pressed={selected}
                      data-source-id={sourceId}
                      disabled={Boolean(placed) || state.phase === "resolved"}
                      draggable={!placed && state.phase === "interacting"}
                      key={sourceId}
                      onClick={() => pick(sourceId, "mouse")}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", sourceId);
                        pick(sourceId, "mouse");
                      }}
                      onKeyDown={(event) => {
                        const input = activationInput(event.key);
                        if (!input) return;
                        event.preventDefault();
                        pick(sourceId, input);
                      }}
                      type="button"
                    >
                      {SOURCE_LABELS[sourceId]}
                      {placed ? ` — placed in ${TARGET_LABELS[placed]}` : ""}
                    </button>
                  );
                },
              )}
            </div>
            <div style={{display: "grid", gap: 8,
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
              {(Object.keys(TARGET_LABELS) as AlgL09Vb06TargetId[]).map(
                (targetId) => (
                  <button
                    data-target-id={targetId}
                    disabled={!state.selectedSource || state.phase === "resolved"}
                    key={targetId}
                    onClick={() => state.selectedSource &&
                      drop(state.selectedSource, targetId, "mouse")}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = event.dataTransfer.getData("text/plain") as
                        AlgL09Vb06SourceId;
                      drop(sourceId, targetId, "mouse");
                    }}
                    onKeyDown={(event) => {
                      const input = activationInput(event.key);
                      if (!input || !state.selectedSource) return;
                      event.preventDefault();
                      drop(state.selectedSource, targetId, input);
                    }}
                    type="button"
                  >
                    {TARGET_LABELS[targetId]}
                  </button>
                ),
              )}
            </div>
            {state.wrongFeedback ? (
              <div aria-live="assertive" data-feedback-kind={
                state.wrongFeedback} role="alert">
                <p>{state.wrongFeedback === "proportional"
                  ? ALG_L09_VB06_DRAG_BEHAVIOR_V1.feedback
                    .wrongProportionalExplanation
                  : ALG_L09_VB06_DRAG_BEHAVIOR_V1.feedback
                    .wrongNonProportionalExplanation}</p>
                <button onClick={() => setState((current) =>
                  reduceAlgL09Vb06(current,
                    {type: "dismiss-feedback", input: "mouse"}))}
                type="button">Try again</button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div aria-label="Source glossary" style={{display: "flex", gap: 8,
          flexWrap: "wrap", marginTop: 8}}>
          {options.glossaryTerms.map((term) => (
            <button
              data-source-character-id={term.sourceCharacterId}
              data-source-key-attribute={term.sourceKeyAttribute}
              key={term.id}
              onClick={(event) => openGlossary(term.id, event.currentTarget)}
              type="button"
            >
              {term.labels[props.uiLanguage === "es" ? "es" : "en"]}
            </button>
          ))}
        </div>
        <p data-source-boundary="acceptance-neutral">
          The four source groups, frame-129 stop, wrong-feedback categories,
          and frame-130 resume are active. Random feedback audio, authoritative
          original-runtime parity, visual fidelity, human and Owner acceptance,
          strict completion, release, and publication remain false.
        </p>
      </section>
    );
  }

  const module = Object.freeze({
    ...sourceCandidate.module,
    interactiveStops: Object.freeze([STOP]),
    lessonHost: Object.freeze({
      capabilities: Object.freeze(["glossary"] as const),
      legacyOperations: "blocked" as const,
      auditStorage: "memory-only" as const,
      storesPersonalData: false as const,
    }),
    maturity: "private-current-js" as const,
    Renderer,
  });

  return Object.freeze({...sourceCandidate, Renderer, module,
    interactiveStop: STOP});
}
