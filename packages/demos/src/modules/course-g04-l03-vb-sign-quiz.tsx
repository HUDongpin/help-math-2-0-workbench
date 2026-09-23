"use client";

import React, {useEffect, useMemo, useReducer, useRef, useState} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import type {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  createCourseG04L03VbSignQuizState,
  reduceCourseG04L03VbSignQuiz,
  type CourseG04L03VbSignQuizAction,
  type CourseG04L03VbSignQuizChoiceId,
  type CourseG04L03VbSignQuizConfig,
  type CourseG04L03VbSignQuizState,
} from "../timelines/course-g04-l03-vb-sign-quiz-interaction";

type SourceStaticCandidate = ReturnType<
  typeof createSourceStaticCanvasCandidate
>;

const SOURCE_ACTIVITY_SCENARIO = "source-static-frame";
const SOURCE_FONT =
  '"Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function isVisible(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element && element.getClientRects().length > 0);
}

function spokenChoice(label: string) {
  return label.startsWith("-")
    ? `negative ${label.slice(1)}`
    : label;
}

function StageQuizSurface({
  config,
  controlsReady,
  interaction,
  onCloseWrong,
  onChoose,
  wrongCloseRef,
}: {
  config: CourseG04L03VbSignQuizConfig;
  controlsReady: boolean;
  interaction: CourseG04L03VbSignQuizState;
  onCloseWrong: () => void;
  onChoose: (
    choiceId: CourseG04L03VbSignQuizChoiceId,
    trigger: HTMLButtonElement,
  ) => void;
  wrongCloseRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const locked = !controlsReady || interaction.mode !== "ready";
  return (
    <svg
      aria-label={config.instruction}
      className="course-g04-l03-vb-sign-quiz-stage-surface"
      data-audio-feedback="unimplemented-unaccepted"
      data-behavior-parity-established="false"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-candidate="true"
      data-interaction-mode={interaction.mode}
      data-legacy-actionscript-executed="false"
      data-source-script-bound="true"
      role="group"
      style={{
        height: "auto",
        left: 0,
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        width: "100%",
        zIndex: 3,
      }}
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <div
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            margin: 0,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          <span style={visuallyHiddenStyle}>{config.instruction}</span>
          {config.choices.map((choice) => (
            <button
              aria-label={`Choose ${spokenChoice(choice.label)}`}
              className="course-g04-l03-vb-sign-quiz-stage-choice"
              data-source-instance={choice.sourceInstance}
              disabled={locked}
              key={choice.id}
              onClick={(event) => onChoose(choice.id, event.currentTarget)}
              style={{
                background: "transparent",
                border: 0,
                boxSizing: "border-box",
                color: "transparent",
                cursor: locked ? "default" : "pointer",
                height: choice.sourceBounds.height,
                left: choice.sourceBounds.centerX - choice.sourceBounds.width / 2,
                margin: 0,
                padding: 0,
                pointerEvents: "auto",
                position: "absolute",
                top: choice.sourceBounds.centerY - choice.sourceBounds.height / 2,
                width: choice.sourceBounds.width,
              }}
              type="button"
            >
              {choice.label}
            </button>
          ))}

          {interaction.mode === "wrong-feedback" ? (
            <div
              aria-describedby={`${config.animationId}-stage-wrong-text`}
              aria-labelledby={`${config.animationId}-stage-wrong-title`}
              data-source-feedback-kind="wrong"
              role="dialog"
              style={{
                background: "#ffffcc",
                border: "3px solid #224b8e",
                borderRadius: 10,
                boxSizing: "border-box",
                color: "#111",
                display: "grid",
                gap: 8,
                left: 168,
                minHeight: 136,
                padding: "17px 126px 16px 20px",
                pointerEvents: "auto",
                position: "absolute",
                top: 214,
                width: 464,
              }}
            >
              <strong
                id={`${config.animationId}-stage-wrong-title`}
                style={{fontSize: 25, lineHeight: 1.05}}
              >{interaction.feedbackHeading}</strong>
              <span
                id={`${config.animationId}-stage-wrong-text`}
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 16,
                  lineHeight: 1.3,
                }}
              >{interaction.feedbackText}</span>
              <button
                onClick={onCloseWrong}
                ref={wrongCloseRef}
                style={{
                  background: "linear-gradient(#ffad17, #e95c00)",
                  border: "2px solid #fff1cb",
                  borderRadius: 7,
                  color: "#fff",
                  font: `800 16px ${SOURCE_FONT}`,
                  height: 48,
                  margin: 0,
                  padding: 0,
                  position: "absolute",
                  right: 12,
                  top: 43,
                  width: 100,
                }}
                type="button"
              >Close</button>
            </div>
          ) : null}

          {interaction.mode === "completed" ? (
            <div
              aria-live="polite"
              data-source-feedback-kind="correct"
              role="status"
              style={{
                alignItems: "center",
                background: "#e8fff0",
                border: "4px solid #16834b",
                borderRadius: 16,
                color: "#0b562f",
                display: "flex",
                fontSize: 36,
                fontWeight: 900,
                height: 142,
                justifyContent: "center",
                left: 230,
                pointerEvents: "auto",
                position: "absolute",
                textAlign: "center",
                top: 208,
                width: 340,
              }}
            >{interaction.feedbackHeading}</div>
          ) : null}
        </div>
      </foreignObject>
    </svg>
  );
}

function MobileQuizSurface({
  config,
  controlsReady,
  interaction,
  onCloseWrong,
  onChoose,
  wrongCloseRef,
}: {
  config: CourseG04L03VbSignQuizConfig;
  controlsReady: boolean;
  interaction: CourseG04L03VbSignQuizState;
  onCloseWrong: () => void;
  onChoose: (
    choiceId: CourseG04L03VbSignQuizChoiceId,
    trigger: HTMLButtonElement,
  ) => void;
  wrongCloseRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <section
      aria-label={`${config.instruction} Mobile controls`}
      className="course-g04-l03-vb-sign-quiz-mobile-controls"
      data-current-js-functional-candidate="true"
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-mode={interaction.mode}
      data-mobile-touch-target-min="48"
    >
      <p>{config.instruction}</p>
      {!controlsReady ? (
        <p
          aria-live="polite"
          className="course-g04-l03-vb-sign-quiz-mobile-status"
        >
          Loading the source question before answer controls are enabled…
        </p>
      ) : null}
      <div
        aria-label="Answer choices"
        className="course-g04-l03-vb-sign-quiz-mobile-grid"
        role="group"
      >
        {config.choices.map((choice) => (
          <button
            disabled={!controlsReady || interaction.mode !== "ready"}
            key={choice.id}
            onClick={(event) => onChoose(choice.id, event.currentTarget)}
            type="button"
          >
            {choice.label}
          </button>
        ))}
      </div>

      {interaction.mode === "wrong-feedback" ? (
        <div
          aria-describedby={`${config.animationId}-mobile-wrong-text`}
          aria-labelledby={`${config.animationId}-mobile-wrong-title`}
          className="course-g04-l03-vb-sign-quiz-mobile-dialog"
          role="dialog"
        >
          <strong id={`${config.animationId}-mobile-wrong-title`}>
            {interaction.feedbackHeading}
          </strong>
          <p id={`${config.animationId}-mobile-wrong-text`}>
            {interaction.feedbackText}
          </p>
          <button
            onClick={onCloseWrong}
            ref={wrongCloseRef}
            type="button"
          >Close</button>
        </div>
      ) : null}

      {interaction.mode === "completed" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-vb-sign-quiz-mobile-complete"
          role="status"
        >
          <strong>{interaction.feedbackHeading}</strong>
          <p>Use Replay to practice again or Next to continue.</p>
        </div>
      ) : null}
    </section>
  );
}

function InteractionOverlay({
  config,
  pageInteractionCompanionTargetId,
  replay = 0,
  seed,
  visualHostRef,
}: Pick<
  AnimationRendererProps,
  "pageInteractionCompanionTargetId" | "replay" | "seed"
> & {
  config: CourseG04L03VbSignQuizConfig;
  visualHostRef: React.RefObject<HTMLDivElement | null>;
}) {
  const reducer = useMemo(
    () => (
      state: CourseG04L03VbSignQuizState,
      action: CourseG04L03VbSignQuizAction,
    ) => reduceCourseG04L03VbSignQuiz(config, state, action),
    [config],
  );
  const [interaction, dispatch] = useReducer(
    reducer,
    seed,
    (initialSeed) => createCourseG04L03VbSignQuizState(config, initialSeed),
  );
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [controlsReady, setControlsReady] = useState(false);
  const stageWrongCloseRef = useRef<HTMLButtonElement>(null);
  const mobileWrongCloseRef = useRef<HTMLButtonElement>(null);
  const lastAnswerTriggerRef = useRef<HTMLButtonElement>(null);
  const previousModeRef = useRef(interaction.mode);
  const restoreAfterCloseRef = useRef(false);

  const choose = (
    choiceId: CourseG04L03VbSignQuizChoiceId,
    trigger: HTMLButtonElement,
  ) => {
    lastAnswerTriggerRef.current = trigger;
    dispatch({type: "choose", choiceId});
  };

  const closeWrong = () => {
    restoreAfterCloseRef.current = true;
    dispatch({type: "close-wrong"});
  };

  useEffect(() => {
    restoreAfterCloseRef.current = false;
    dispatch({type: "replay", seed});
  }, [replay, seed]);

  useEffect(() => {
    if (!pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(
      document.getElementById(pageInteractionCompanionTargetId),
    );
  }, [pageInteractionCompanionTargetId]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (!host) {
      setControlsReady(false);
      return;
    }
    const update = () => {
      const sourceCandidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]' +
        '[data-canvas-status]',
      );
      setControlsReady(sourceCandidate?.dataset.canvasStatus === "ready");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, {
      attributeFilter: ["data-canvas-status"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [visualHostRef]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    previousModeRef.current = interaction.mode;
    if (
      interaction.mode !== "wrong-feedback"
      && !(
        previousMode === "wrong-feedback"
        && interaction.mode === "ready"
        && restoreAfterCloseRef.current
      )
    ) return;
    const shouldRestoreAnswer = interaction.mode === "ready";
    if (shouldRestoreAnswer) restoreAfterCloseRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      if (interaction.mode === "wrong-feedback") {
        const preferredClose = isVisible(mobileWrongCloseRef.current)
          ? mobileWrongCloseRef.current
          : stageWrongCloseRef.current;
        preferredClose?.focus();
        return;
      }
      if (shouldRestoreAnswer && isVisible(lastAnswerTriggerRef.current)) {
        lastAnswerTriggerRef.current.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [interaction.mode]);

  const mobileSurface = (
    <MobileQuizSurface
      config={config}
      controlsReady={controlsReady}
      interaction={interaction}
      onCloseWrong={closeWrong}
      onChoose={choose}
      wrongCloseRef={mobileWrongCloseRef}
    />
  );

  return (
    <>
      <style>{`
        .course-g04-l03-vb-sign-quiz-mobile-controls {
          display: none;
        }

        .course-g04-l03-vb-sign-quiz-stage-choice:focus-visible {
          outline: 5px solid #ffdd29;
          outline-offset: 3px;
        }

        @media (max-width: 640px), (any-pointer: coarse) {
          .course-g04-l03-vb-sign-quiz-stage-surface {
            display: none;
          }

          .course-g04-l03-vb-sign-quiz-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 12px;
            margin: 12px 0 0;
            padding: 14px;
            width: 100%;
          }

          .course-g04-l03-vb-sign-quiz-mobile-controls > p {
            font-family: system-ui, sans-serif;
            font-size: 17px;
            line-height: 1.35;
            margin: 0;
          }

          .course-g04-l03-vb-sign-quiz-mobile-grid {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(3, minmax(48px, 1fr));
          }

          .course-g04-l03-vb-sign-quiz-mobile-controls button {
            background: #fff;
            border: 2px solid #224b8e;
            border-radius: 9px;
            color: #111;
            font: 800 22px ${SOURCE_FONT};
            min-height: 48px;
            min-width: 48px;
            padding: 8px;
          }

          .course-g04-l03-vb-sign-quiz-mobile-controls button:disabled {
            cursor: default;
            opacity: .58;
          }

          .course-g04-l03-vb-sign-quiz-mobile-dialog,
          .course-g04-l03-vb-sign-quiz-mobile-complete {
            background: #ffffcc;
            border: 3px solid #224b8e;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 14px;
          }

          .course-g04-l03-vb-sign-quiz-mobile-dialog strong,
          .course-g04-l03-vb-sign-quiz-mobile-complete strong {
            font-size: 23px;
          }

          .course-g04-l03-vb-sign-quiz-mobile-dialog p,
          .course-g04-l03-vb-sign-quiz-mobile-complete p {
            font-family: system-ui, sans-serif;
            font-size: 16px;
            line-height: 1.35;
            margin: 0;
          }

          .course-g04-l03-vb-sign-quiz-mobile-dialog button {
            justify-self: start;
            min-width: 112px;
          }

          .course-g04-l03-vb-sign-quiz-mobile-complete {
            background: #e8fff0;
            border-color: #16834b;
            color: #0b562f;
          }
        }
      `}</style>
      <StageQuizSurface
        config={config}
        controlsReady={controlsReady}
        interaction={interaction}
        onCloseWrong={closeWrong}
        onChoose={choose}
        wrongCloseRef={stageWrongCloseRef}
      />
      {companionTarget
        ? createPortal(mobileSurface, companionTarget)
        : mobileSurface}
    </>
  );
}

export function createCourseG04L03VbSignQuizCandidate(
  candidate: SourceStaticCandidate,
  config: CourseG04L03VbSignQuizConfig,
) {
  const SourceStaticRenderer = candidate.Renderer;

  function Renderer(props: AnimationRendererProps) {
    const visualHostRef = useRef<HTMLDivElement>(null);
    const frameDomain = props.frameDomain ?? config.frameDomain;
    const interactionEnabled =
      props.frame === config.activityFrame
      && frameDomain === config.frameDomain
      && props.scenario === SOURCE_ACTIVITY_SCENARIO
      && props.lang === "en"
      && !isDeterministicEvidenceCapture(props);

    return (
      <div
        data-behavior-parity-established="false"
        data-current-js-controls-enabled={
          interactionEnabled ? "true" : "false"
        }
        data-current-js-functional-scope="vb-sign-three-choice-source-script-bound"
        data-owner-accepted="false"
        data-strict-acceptance-effect="none"
        style={{
          margin: "0 auto",
          maxWidth: 800,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          aria-hidden={interactionEnabled ? true : undefined}
          ref={visualHostRef}
        >
          <SourceStaticRenderer {...props} />
        </div>
        {interactionEnabled ? (
          <InteractionOverlay
            config={config}
            pageInteractionCompanionTargetId={
              props.pageInteractionCompanionTargetId
            }
            replay={props.replay}
            seed={props.seed}
            visualHostRef={visualHostRef}
          />
        ) : null}
      </div>
    );
  }

  const sourceContract = Object.freeze({
    ...candidate.sourceContract,
    currentJavascriptInteractionStatus:
      "source-script-bound-functional-candidate",
    currentJavascriptInteractionScope: Object.freeze([
      "three-source-bound-answer-hit-regions",
      "answer-controls-fail-closed-until-source-canvas-ready",
      "pointer-keyboard-and-touch-answer-selection",
      "exact-source-wrong-explanation-and-close-retry",
      "reachable-source-host-feedback-copy-with-current-js-seeded-selection",
      "whole-renderer-replay-reset",
      "responsive-mobile-touch-control-surface",
    ]),
    sourceRandomFeedbackStatus:
      "reachable-copy-modeled-current-js-sequence-not-avm1-random-trace",
    sourceGlossaryHotspotStatus: "unimplemented-safe-disabled",
    sourcePostCorrectContinuationStatus: "unimplemented-unaccepted",
    embeddedFeedbackAudioStatus: "inventoried-unimplemented-unaccepted",
    spanishInteractionStatus: "unimplemented-disabled",
    behaviorParityEstablished: false,
    strictAcceptanceEffect: "none",
  });

  const module = Object.freeze({
    ...candidate.module,
    reducedMotionFrame: config.activityFrame,
    Renderer,
  });

  return Object.freeze({Renderer, sourceContract, module});
}
