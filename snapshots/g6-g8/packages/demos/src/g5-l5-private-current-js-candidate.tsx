"use client";

import React, {useEffect, useState} from "react";

import type {
  AnimationModule,
  AnimationRendererProps,
} from "./contract";
import {
  createSourceStaticCanvasCandidate,
  type SourceStaticCanvasCandidateConfig,
} from "./source-static-canvas-candidate";

export type G5L5PrivateComplexityLane =
  | "low"
  | "interactive-understood"
  | "behavior-heavy";

export interface G5L5PrivateCandidateMetadata {
  readonly calibrationId: string;
  readonly complexityLane: G5L5PrivateComplexityLane;
  readonly sourceBehaviorDecisionIds: readonly string[];
  readonly sourceUserEventPcodeFileCount: number;
}

interface ChoiceState {
  readonly attempts: number;
  readonly feedback: "idle" | "correct" | "wrong";
  readonly controlsEnabled: boolean;
}

const INITIAL_CHOICE_STATE: ChoiceState = Object.freeze({
  attempts: 0,
  feedback: "idle",
  controlsEnabled: true,
});

interface InteractionAdapterSpec {
  readonly ariaLabel: string;
  readonly choices: readonly (readonly [value: string, label: string])[];
  readonly correctChoice: string;
  readonly question: string;
  readonly wrongFeedback: string;
}

const INTERACTION_ADAPTERS: Readonly<Record<string, InteractionAdapterSpec>> =
  Object.freeze({
    "course-g05-l05-vb-012": Object.freeze({
      ariaLabel: "Source-bound fixed-choice behavior adapter",
      choices: Object.freeze([
        Object.freeze(["negative-eight", "−8"] as const),
        Object.freeze(["positive-eight", "+8"] as const),
      ]),
      correctChoice: "positive-eight",
      question: "Which number is the opposite of −8?",
      wrongFeedback: "Try again. The opposite of negative eight is positive eight.",
    }),
    "course-g05-l05-vb-013": Object.freeze({
      ariaLabel: "Source-bound fixed-choice behavior adapter",
      choices: Object.freeze([
        Object.freeze(["negative-two", "−2"] as const),
        Object.freeze(["positive-two", "+2"] as const),
      ]),
      correctChoice: "positive-two",
      question: "Which number is the opposite of −2?",
      wrongFeedback: "Try again. The opposite of negative two is positive two.",
    }),
    "course-g05-l05-ts-007": Object.freeze({
      ariaLabel: "Source-bound multi-section choice behavior adapter",
      choices: Object.freeze([
        Object.freeze(["choice-1", "A"] as const),
        Object.freeze(["choice-2", "B"] as const),
        Object.freeze(["choice-3", "C"] as const),
        Object.freeze(["choice-4", "D"] as const),
      ]),
      correctChoice: "choice-2",
      question: "Choose the source-authored correct response for this engineering state.",
      wrongFeedback: "Try again. The source handler requests wrong feedback and disables the choices.",
    }),
  });

function G5L5PrivateInteractionPanel({
  animationId,
  seed,
}: Readonly<{animationId: string; seed: number}>) {
  const [state, setState] = useState<ChoiceState>(INITIAL_CHOICE_STATE);
  useEffect(() => setState(INITIAL_CHOICE_STATE), [animationId, seed]);

  const adapter = INTERACTION_ADAPTERS[animationId];
  if (!adapter) return null;

  const choose = (choice: string) => {
    if (!state.controlsEnabled) return;
    setState({
      attempts: state.attempts + 1,
      feedback: choice === adapter.correctChoice ? "correct" : "wrong",
      controlsEnabled: false,
    });
  };
  const continuePractice = () => setState({
    ...state,
    feedback: "idle",
    controlsEnabled: true,
  });

  return <section
    aria-label={adapter.ariaLabel}
    data-animation-id={animationId}
    data-avm1-executed="false"
    data-behavior-adapter="source-pcode-current-js-candidate"
    data-controls-enabled={state.controlsEnabled ? "true" : "false"}
    data-feedback-state={state.feedback}
    data-natural-trace-validated="false"
    data-source-attempt-count={state.attempts}
    style={{
      background: "rgba(245, 250, 255, 0.96)",
      border: "1px solid #204a68",
      borderRadius: 10,
      bottom: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,.18)",
      color: "#102d42",
      left: 12,
      padding: "10px 12px",
      position: "absolute",
      right: 12,
      zIndex: 5,
    }}
  >
    <p style={{fontSize: 13, margin: "0 0 8px"}}>
      {adapter.question}
    </p>
    <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
      {adapter.choices.map(([value, label]) => <button
        disabled={!state.controlsEnabled}
        key={value}
        onClick={() => choose(value)}
        type="button"
      >{label}</button>)}
      {!state.controlsEnabled && <button
        data-source-continuation-control="true"
        onClick={continuePractice}
        type="button"
      >Continue</button>}
    </div>
    <p aria-live="polite" style={{fontSize: 13, margin: "8px 0 0"}}>
      {state.feedback === "correct"
        ? "Correct. The source handler requests right feedback and disables the choices."
        : state.feedback === "wrong"
          ? adapter.wrongFeedback
          : "The adapter is compiled from hash-bound P-code; original-runtime natural-trace validation remains pending."}
    </p>
  </section>;
}

export function createG5L5PrivateCurrentJsCandidate(
  config: SourceStaticCanvasCandidateConfig,
  metadata: G5L5PrivateCandidateMetadata,
) {
  const candidate = createSourceStaticCanvasCandidate(config);

  function PrivateRenderer(props: AnimationRendererProps) {
    return <div
      data-audio-acceptance="pending"
      data-behavior-parity-established="false"
      data-calibration-id={metadata.calibrationId}
      data-complexity-lane={metadata.complexityLane}
      data-private-current-js="true"
      data-source-user-event-pcode-files={
        metadata.sourceUserEventPcodeFileCount
      }
      data-strict-acceptance-effect="none"
      style={{height: "100%", position: "relative", width: "100%"}}
    >
      <candidate.Renderer {...props} />
      <G5L5PrivateInteractionPanel
        animationId={config.animationId}
        seed={props.seed}
      />
    </div>;
  }

  const module: AnimationModule = Object.freeze({
    ...candidate.module,
    maturity: "private-current-js" as const,
    Renderer: PrivateRenderer,
  });

  return Object.freeze({
    ...candidate,
    module,
    Renderer: PrivateRenderer,
    privateMetadata: Object.freeze(metadata),
  });
}
