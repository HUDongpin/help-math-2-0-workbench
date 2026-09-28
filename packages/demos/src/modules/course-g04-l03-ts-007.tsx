"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, KeyboardEvent} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {Ts007NumberLine, Ts007Symbol, Ts007WalkthroughReading} from "./course-g04-l03-ts-007-teaching";
import {getG4L3VisibleCompanionAudioCandidates} from "../g4-l3-visible-companion-audio.generated";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  isSourceStaticBehaviorCompositeCaptureRequest,
  SourceStaticBehaviorCompositeCapture,
} from "../source-static-behavior-composite-capture";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_007_QUESTION,
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
  type CourseG04L03Ts007Choice,
  type CourseG04L03Ts007InteractionAction,
  type CourseG04L03Ts007InteractionState,
} from "../timelines/course-g04-l03-ts-007-practice-question-interaction";
import {
  COURSE_G04_L03_TS_007_CONFIG,
  COURSE_G04_L03_TS_007_GLOSSARY_CONFIG,
  COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS,
  COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES,
  COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG,
  COURSE_G04_L03_TS_007_SOURCE,
} from "../timelines/course-g04-l03-ts-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_007_CONFIG,
);
const visibleCompanionAudioCandidates =
  getG4L3VisibleCompanionAudioCandidates("course-g04-l03-ts-007");
const SourceStaticRenderer = candidate.Renderer;
const parentCompositeCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG,
);
const ParentCompositeSourceRenderer = parentCompositeCandidate.Renderer;
const naturalParentCompositeCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG,
);
const NaturalParentCompositeSourceRenderer =
  naturalParentCompositeCandidate.Renderer;
const directCompanionCandidates: ReadonlyMap<
  string,
  ReturnType<typeof createSourceStaticCanvasCandidate>
> = new Map(
  COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS.map((config) => [
    config.animationId,
    createSourceStaticCanvasCandidate(config),
  ]),
);
const visibleCompanionPlaybackEndFrameByDomain = Object.freeze(
  Object.fromEntries(
    [
      ...COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES,
      ...COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES,
      ...COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES,
    ].map(({frameDomain, localFrameCount}) => [
      frameDomain,
      localFrameCount,
    ]),
  ),
);

const SOURCE_DOMAIN = "sprite-441";
const SOURCE_SCENARIO = "source-static-frame";
const FUNCTIONAL_ENTRY_FRAME = 235;
const QUIZ_DONOR_FRAME = 680;
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";

type ParentCompositeCapture =
  (typeof COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES)[number];
type NaturalParentCompositeCapture =
  (typeof COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES)[number];
type DirectCompanionCompositeCapture =
  (typeof COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES)[number];

function findParentCompositeCapture(
  props: Pick<
    AnimationRendererProps,
    | "entryStateSha256"
    | "frame"
    | "frameDomain"
    | "lang"
    | "requirementId"
    | "scenario"
    | "traceId"
  >,
): ParentCompositeCapture | undefined {
  return COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function findNaturalParentCompositeCapture(
  props: Pick<
    AnimationRendererProps,
    | "entryStateSha256"
    | "frame"
    | "frameDomain"
    | "lang"
    | "requirementId"
    | "scenario"
    | "traceId"
  >,
): NaturalParentCompositeCapture | undefined {
  return COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function findDirectCompanionCompositeCapture(
  props: Pick<
    AnimationRendererProps,
    | "entryStateSha256"
    | "frame"
    | "frameDomain"
    | "lang"
    | "requirementId"
    | "scenario"
    | "traceId"
  >,
): DirectCompanionCompositeCapture | undefined {
  return COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CAPTURES.find(
    (mapping) =>
      props.requirementId === mapping.requirementId
      && props.traceId === mapping.traceId
      && props.entryStateSha256 === mapping.entryStateSha256
      && isSourceStaticBehaviorCompositeCaptureRequest(props, mapping),
  );
}

function ParentCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: ParentCompositeCapture;
  props: AnimationRendererProps;
}) {
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = parentCompositeCandidate.getFrameState(mapping.sourceFrame, {
      frameDomain: mapping.sourceFrameDomain,
      scenario: mapping.sourceScenario,
      lang: mapping.language,
      seed: props.seed,
    });
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={ParentCompositeSourceRenderer}
    />
  );
}

function NaturalParentCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: NaturalParentCompositeCapture;
  props: AnimationRendererProps;
}) {
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = naturalParentCompositeCandidate.getFrameState(
      mapping.sourceFrame,
      {
        frameDomain: mapping.sourceFrameDomain,
        scenario: mapping.sourceScenario,
        lang: mapping.language,
        seed: props.seed,
      },
    );
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={NaturalParentCompositeSourceRenderer}
    />
  );
}

function DirectCompanionCompositeEvidenceRenderer({
  mapping,
  props,
}: {
  mapping: DirectCompanionCompositeCapture;
  props: AnimationRendererProps;
}) {
  const selectedCandidate = directCompanionCandidates.get(mapping.assetKey);
  if (!selectedCandidate) {
    throw new Error(`Missing direct companion asset: ${mapping.assetKey}`);
  }
  const SourceRenderer = selectedCandidate.Renderer;
  const behaviorCompositeState =
    `${mapping.behaviorCompositeStatePrefix}${String(props.frame).padStart(3, "0")}`;
  const sourceState = useMemo(() => {
    const base = selectedCandidate.getFrameState(mapping.sourceFrame, {
      frameDomain: mapping.sourceFrameDomain,
      scenario: mapping.sourceScenario,
      lang: mapping.language,
      seed: props.seed,
    });
    return Object.freeze({
      ...base,
      behaviorCompositeContractId: mapping.behaviorCompositeContractId,
      behaviorCompositeState,
    });
  }, [behaviorCompositeState, mapping, props.seed, selectedCandidate]);
  return (
    <SourceStaticBehaviorCompositeCapture
      mapping={mapping}
      props={props}
      sourceState={sourceState}
      SourceRenderer={SourceRenderer}
    />
  );
}

type SourceCanvasStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "blocked";

const SOURCE_VISUAL_DONOR_MAP = Object.freeze({
  walkthrough0: 235,
  walkthrough1: 373,
  walkthrough2: 500,
  walkthrough3: 617,
  quiz: QUIZ_DONOR_FRAME,
  feedback: QUIZ_DONOR_FRAME,
  needMoreHelp: QUIZ_DONOR_FRAME,
  terminal: 696,
});

const NATURAL_COMPOSITE_UNRESOLVED_FRAMES = Object.freeze([
  373,
  500,
  617,
  679,
]);

function isDeterministicEvidenceCapture({
  entryStateSha256,
}: AnimationRendererProps) {
  return Boolean(entryStateSha256);
}

function sourceCanvasStatusMessage(status: SourceCanvasStatus) {
  if (status === "error") {
    return "The page could not load. Use Replay to try again.";
  }
  if (status === "blocked") {
    return "This activity is unavailable in the selected mode.";
  }
  return "Loading the activity…";
}

function donorFrameForInteraction(
  interaction: CourseG04L03Ts007InteractionState,
) {
  if (
    interaction.phase === "walkthrough"
    && interaction.walkthroughGate !== null
  ) {
    return SOURCE_VISUAL_DONOR_MAP[
      `walkthrough${interaction.walkthroughGate}` as
        | "walkthrough0"
        | "walkthrough1"
        | "walkthrough2"
        | "walkthrough3"
    ];
  }
  if (interaction.phase === "terminal") {
    return SOURCE_VISUAL_DONOR_MAP.terminal;
  }
  return SOURCE_VISUAL_DONOR_MAP.quiz;
}

function accessibleChoiceLabel(choice: CourseG04L03Ts007Choice) {
  const location =
    choice.numberLineLocation < 0
      ? `negative ${Math.abs(choice.numberLineLocation)}`
      : String(choice.numberLineLocation);
  return `${choice.id}. ${choice.symbol}, located at ${location}`;
}

function feedbackCopy(
  interaction: CourseG04L03Ts007InteractionState,
) {
  const feedback = interaction.feedback;
  if (!feedback) return "";
  if (feedback.kind === "right") {
    return "Correct. The heart, answer B, is located at negative two.";
  }
  return interaction.wrongTryCount === 0
    ? "That answer is not correct. Find −2 on the number line, then try again."
    : "That answer is not correct. The correct answer is B: the heart is at −2. Review the solution, then try again with Replay.";
}

function handleModalKeys(
  event: KeyboardEvent<HTMLElement>,
  close: () => void,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
  }
}

function findVisibleFocusTarget(
  roots: readonly (HTMLElement | null)[],
  target: string,
) {
  return roots
    .filter((root): root is HTMLElement => root !== null)
    .flatMap((root) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          `[data-ts007-focus-control="${target}"]`,
        ),
      ),
    )
    .find(
      (control) =>
        control.getClientRects().length > 0
        && !control.hasAttribute("disabled"),
    );
}

interface SharedSurfaceProps {
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ts007InteractionAction>;
  readonly feedbackRemainingMs: number | null;
  readonly interaction: CourseG04L03Ts007InteractionState;
  readonly onCloseNeedMoreHelp: () => void;
  readonly onFinishFeedback: () => void;
  readonly onReplay: () => void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly placement: "fallback" | "portal";
}

function MobileSurface({
  canvasStatus, controlsReady, dispatch, feedbackRemainingMs, interaction,
  onCloseNeedMoreHelp, onFinishFeedback, onReplay, paused, placement, reducedMotion,
}: MobileSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  return (
    <section
      aria-label="Practice question controls"
      className={"course-g04-l03-ts-007-mobile-controls " +
        `course-g04-l03-ts-007-mobile-controls--${placement}`}
      data-current-js-modern-reconstruction="true"
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="practice-question"
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
      data-feedback-remaining-ms={feedbackRemainingMs ?? undefined}
      data-feedback-held-for-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <h2 className="course-g04-l03-ts-007-question">
        {COURSE_G04_L03_TS_007_QUESTION.prompt}
      </h2>
      <div className="course-g04-l03-ts-007-mobile-context"><Ts007NumberLine /></div>
      {!controlsReady ? <p
        aria-live={canvasStatus === "error" ? "assertive" : "polite"}
        role={canvasStatus === "error" ? "alert" : "status"}
      >{sourceCanvasStatusMessage(canvasStatus)}</p> : null}

      {interaction.phase === "walkthrough" ? <>
        <p>Four-step plan · {(interaction.walkthroughGate ?? 0) === 0
          ? "Start" : `Step ${interaction.walkthroughGate} of 4`}</p>
        <Ts007WalkthroughReading interaction={interaction} />
        <button data-ts007-focus-control="walkthrough-continue"
          disabled={controlsDisabled}
          onClick={() => dispatch({type: "continue-walkthrough"})} type="button">
          Continue
        </button>
      </> : null}

      {interaction.phase === "quiz" ? <>
        <div aria-label="Answer choices" className="course-g04-l03-ts-007-mobile-choices" role="group">
          {COURSE_G04_L03_TS_007_CHOICES.map(choice => <button
            aria-label={accessibleChoiceLabel(choice)}
            data-ts007-focus-control={`choice-${choice.id}`}
            disabled={controlsDisabled} key={choice.id}
            onClick={() => dispatch({type: "choose", choiceId: choice.id})} type="button">
            <strong>{choice.id}</strong><Ts007Symbol id={choice.id} /><span>{choice.symbol}</span>
          </button>)}
        </div>
        <button data-ts007-focus-control="need-more-help" disabled={controlsDisabled}
          onClick={() => dispatch({type: "open-need-more-help"})} type="button">
          Need More Help
        </button>
      </> : null}

      {interaction.phase === "feedback" && interaction.feedback ? <div
        aria-atomic="true" aria-live="polite" role="status" tabIndex={-1}
        className="course-g04-l03-ts-007-mobile-feedback"
        data-feedback-branch={`${interaction.feedback.kind}${interaction.feedback.branch}`}
        data-feedback-source-visual-parity-established="false"
        data-ts007-focus-control="feedback-status">
        <strong>{interaction.feedback.kind === "right" ? "Correct"
          : interaction.wrongTryCount === 0 ? "Try again" : "Review the answer"}</strong>
        <p>{feedbackCopy(interaction)}</p>
        {paused ? <p>Paused.</p> : null}
        <button disabled={controlsDisabled} onClick={onFinishFeedback} type="button">Continue</button>
      </div> : null}

      {interaction.phase === "need-more-help" ? <div
        aria-describedby="course-g04-l03-ts-007-help-copy" aria-label="Need More Help"
        aria-modal="true" className="course-g04-l03-ts-007-mobile-dialog" role="dialog"
        onKeyDown={event => handleModalKeys(event, onCloseNeedMoreHelp)}>
        <strong>Need More Help</strong>
        <p id="course-g04-l03-ts-007-help-copy">
          A number line orders numbers by their value. Negative numbers are to the left of 0.
          Find −2 by moving two units to the left of 0, then look at the symbol above it.
        </p>
        <Ts007NumberLine />
        <button data-ts007-focus-control="need-more-help-close" disabled={!controlsReady}
          onClick={onCloseNeedMoreHelp} type="button">Close</button>
      </div> : null}

      {interaction.phase === "terminal" ? <div aria-live="polite" role="status" tabIndex={-1}
        className="course-g04-l03-ts-007-mobile-complete" data-ts007-focus-control="terminal"
        data-question-answered-correctly={interaction.selectedChoiceId === "B" ? "true" : "false"}>
        <strong>{interaction.selectedChoiceId === "B" ? "Question complete" : "Review the answer"}</strong>
        <p>The correct answer is B. The heart is at −2, two units to the left of 0.</p>
        <p>Use Replay to work through the question again.</p>
        <button disabled={controlsDisabled} onClick={onReplay} type="button">Replay question</button>
      </div> : null}

      {interaction.phase !== "walkthrough" && interaction.phase !== "need-more-help" ? <details>
        <summary>Review the four-step solution</summary>
        <Ts007WalkthroughReading interaction={interaction} />
      </details> : null}
    </section>
  );
}

function StageSurface({controlsReady, dispatch, interaction, paused}: SharedSurfaceProps) {
  if (interaction.phase !== "quiz") return null;
  return <svg aria-label="Answer choices on the source drawing"
    className="course-g04-l03-ts-007-stage-surface" role="group"
    data-interaction-phase={interaction.phase}
    style={{height: "auto", inset: 0, pointerEvents: "none", position: "absolute", width: "100%", zIndex: 4}}
    viewBox="0 0 800 600">
    <foreignObject height="600" width="800" x="0" y="0">
      <div style={{height: 600, pointerEvents: "none", position: "relative", width: 800}}>
        {COURSE_G04_L03_TS_007_CHOICES.map(choice => <button
          aria-label={accessibleChoiceLabel(choice)}
          className="course-g04-l03-ts-007-source-hit-button"
          data-source-button-object-id={choice.sourceButtonObjectId}
          data-source-instance={choice.sourceInstance}
          data-ts007-focus-control={`choice-${choice.id}`}
          disabled={!controlsReady || paused} key={choice.id}
          onClick={() => dispatch({type: "choose", choiceId: choice.id})}
          style={{height: choice.hitBounds.height, left: choice.hitBounds.x,
            top: choice.hitBounds.y, width: choice.hitBounds.width}} type="button">
          {accessibleChoiceLabel(choice)}
        </button>)}
      </div>
    </foreignObject>
  </svg>;
}

function CourseG04L03Ts007MainRenderer(props: AnimationRendererProps) {
  const [interaction, dispatch] = useReducer(
    reduceCourseG04L03Ts007Interaction,
    props.seed,
    createCourseG04L03Ts007InteractionState,
  );
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const [feedbackRemainingMs, setFeedbackRemainingMs] =
    useState<number | null>(null);
  const feedbackRemainingMsRef = useRef<number | null>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);

  const requestedFrameDomain = props.frameDomain ?? SOURCE_DOMAIN;
  const interactionEnabled =
    props.frame === FUNCTIONAL_ENTRY_FRAME
    && requestedFrameDomain === SOURCE_DOMAIN
    && props.scenario === SOURCE_SCENARIO
    && props.lang === "en"
    && !isDeterministicEvidenceCapture(props);
  const sourceVisualFrame = interactionEnabled
    ? donorFrameForInteraction(interaction)
    : props.frame;
  const sourceVisualState = useMemo(
    () =>
      candidate.getFrameState(sourceVisualFrame, {
        entryStateSha256: props.entryStateSha256,
        frameDomain: requestedFrameDomain,
        lang: props.lang,
        requirementId: props.requirementId,
        scenario: props.scenario,
        seed: props.seed,
        traceId: props.traceId,
      }),
    [
      props.entryStateSha256,
      props.lang,
      props.requirementId,
      props.scenario,
      props.seed,
      props.traceId,
      requestedFrameDomain,
      sourceVisualFrame,
  ],
);
  const controlsReady = interactionEnabled && canvasStatus === "ready"
    && (!props.pageInteractionCompanionTargetId || companionTarget !== null);
  useEffect(() => {
    // Both source terminal paths finish the activity. A second wrong answer
    // is explicitly shown as answer review, never as a correct-answer result.
    if (controlsReady && interaction.phase === "terminal") props.onActivityComplete?.();
  }, [controlsReady, interaction.phase, props.onActivityComplete]);

  const feedbackIdentity = interaction.feedback
    ? `${interaction.feedback.kind}-${interaction.feedback.branch}-${interaction.feedback.choiceId}-${interaction.wrongTryCount}`
    : "";

  useEffect(() => {
    dispatch({type: "replay", seed: props.seed});
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
  }, [interactionEnabled, props.replay, props.seed]);

  useEffect(() => {
    if (!props.pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(
      document.getElementById(props.pageInteractionCompanionTargetId),
    );
  }, [props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (!host || !interactionEnabled) {
      setCanvasStatus("idle");
      return;
    }
    setCanvasStatus("loading");
    const update = () => {
      const sourceCandidate = host.querySelector<HTMLElement>(
        '[data-candidate-status="source-static-engineering-not-strict"]'
        + '[data-canvas-status]',
      );
      const nextStatus = sourceCandidate?.dataset.canvasStatus;
      if (
        nextStatus === "idle"
        || nextStatus === "loading"
        || nextStatus === "ready"
        || nextStatus === "error"
        || nextStatus === "blocked"
      ) {
        setCanvasStatus(nextStatus);
      }
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
  }, [interactionEnabled, props.replay, sourceVisualFrame]);

  useEffect(() => {
    const feedback = interaction.feedback;
    if (!feedback) {
      feedbackRemainingMsRef.current = null;
      setFeedbackRemainingMs(null);
      return;
    }
    const duration = props.reducedMotion
      ? 0
      : feedback.sourceWindow.projectedDurationMs;
    feedbackRemainingMsRef.current = duration;
    setFeedbackRemainingMs(duration);
  }, [feedbackIdentity, props.reducedMotion]);

  useEffect(() => {
    if (
      interaction.phase !== "feedback"
      || !interaction.feedback
      || !controlsReady
      || props.paused
      || props.reducedMotion
    ) {
      return;
    }
    const remaining = feedbackRemainingMsRef.current;
    if (remaining === null) return;
    if (remaining <= 0) {
      dispatch({type: "feedback-complete"});
      return;
    }

    const startedAt = performance.now();
    let fired = false;
    const timeout = window.setTimeout(() => {
      fired = true;
      feedbackRemainingMsRef.current = null;
      setFeedbackRemainingMs(0);
      dispatch({type: "feedback-complete"});
    }, remaining);
    return () => {
      window.clearTimeout(timeout);
      if (fired) return;
      const nextRemaining = Math.max(
        0,
        (feedbackRemainingMsRef.current ?? 0)
          - (performance.now() - startedAt),
      );
      feedbackRemainingMsRef.current = nextRemaining;
      setFeedbackRemainingMs(nextRemaining);
    };
  }, [
    controlsReady,
    feedbackIdentity,
    interaction.feedback,
    interaction.phase,
    props.paused,
    props.reducedMotion,
  ]);

  useEffect(() => {
    if (!interactionEnabled || !controlsReady) return;
    const frame = window.requestAnimationFrame(() => {
      findVisibleFocusTarget(
        [rendererRef.current, companionTarget],
        interaction.focusTarget,
      )?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    companionTarget,
    controlsReady,
    interaction.focusTarget,
    interactionEnabled,
  ]);

  useEffect(() => {
    const media = window.matchMedia(RESPONSIVE_CONTROLS_MEDIA);
    const migrateFocus = () => {
      const root = rendererRef.current;
      if (!root) return;
      const active = document.activeElement;
      const focusTarget =
        active instanceof HTMLElement
          ? active.dataset.ts007FocusControl
            ?? lastFocusedControlRef.current
            ?? interaction.focusTarget
          : lastFocusedControlRef.current ?? interaction.focusTarget;
      window.requestAnimationFrame(() => {
        findVisibleFocusTarget(
          [rendererRef.current, companionTarget],
          focusTarget,
        )?.focus();
      });
    };
    media.addEventListener("change", migrateFocus);
    return () => media.removeEventListener("change", migrateFocus);
  }, [companionTarget, interaction.focusTarget]);

  const finishFeedback = () => {
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
    dispatch({type: "feedback-complete"});
  };
  const closeNeedMoreHelp = () => {
    dispatch({type: "close-need-more-help"});
  };
  const replay = () => {
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
    dispatch({type: "replay", seed: props.seed});
    props.onReplay?.();
  };
  const sharedSurfaceProps: SharedSurfaceProps = {
    canvasStatus,
    controlsReady,
    dispatch,
    feedbackRemainingMs,
    interaction,
    onCloseNeedMoreHelp: closeNeedMoreHelp,
    onFinishFeedback: finishFeedback,
    onReplay: replay,
    paused: props.paused ?? false,
    reducedMotion: props.reducedMotion ?? false,
  };
  const mobileSurface = (
    <MobileSurface
      {...sharedSurfaceProps}
      placement={companionTarget ? "portal" : "fallback"}
    />
  );

  return (
    <div
      data-associated-audio-modeled="false"
      data-authoritative-baseline-accepted="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-entry={
        `${SOURCE_DOMAIN}:${FUNCTIONAL_ENTRY_FRAME}:${SOURCE_SCENARIO}:en`
      }
      data-current-js-modern-reconstruction={
        interactionEnabled ? "true" : "false"
      }
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-feedback-random-parity-established="false"
      data-human-visual-review-accepted="false"
      data-natural-composite-established="false"
      data-natural-composite-unresolved-frames={
        NATURAL_COMPOSITE_UNRESOLVED_FRAMES.join(",")
      }
      data-original-runtime-natural-trace-accepted="false"
      data-owner-accepted="false"
      data-source-visual-parity-established="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      data-lesson-published="false"
      onFocusCapture={(event) => {
        lastFocusedControlRef.current =
          event.target instanceof HTMLElement
            ? event.target.dataset.ts007FocusControl ?? null
            : null;
      }}
      ref={rendererRef}
      style={{
        margin: "0 auto",
        maxWidth: 800,
        position: "relative",
        width: "100%",
      }}
    >
      <style>{`
        .course-g04-l03-ts-007-mobile-context,
        .course-g04-l03-ts-007-mobile-choices {display: none;}
        .course-g04-l03-ts-007-mobile-controls {
          background: #eef7ff; border: 2px solid #224b8e; border-radius: 12px;
          box-sizing: border-box; color: #17395f; display: grid; font: 16px/1.5 system-ui, sans-serif;
          gap: 10px; margin: 8px 0; padding: 14px 16px; position: relative; width: 100%;
        }
        .course-g04-l03-ts-007-mobile-controls > p,
        .course-g04-l03-ts-007-mobile-controls h2 {margin: 0;}
        .course-g04-l03-ts-007-mobile-controls h2 {font-size: 19px;}
        .course-g04-l03-ts-007-mobile-controls button {
          background: linear-gradient(#fff5ac, #f6d769); border: 2px solid #496480; border-radius: 10px;
          box-sizing: border-box; color: #153956; cursor: pointer; font: 700 16px/1.35 system-ui, sans-serif;
          min-height: 48px; min-width: 48px; padding: 9px 14px;
        }
        .course-g04-l03-ts-007-mobile-controls > button {justify-self: end; min-width: 132px;}
        .course-g04-l03-ts-007-mobile-controls button:disabled {cursor: default; opacity: .56;}
        .course-g04-l03-ts-007-mobile-controls button:focus-visible,
        .course-g04-l03-ts-007-mobile-controls summary:focus-visible,
        .course-g04-l03-ts-007-mobile-controls [tabindex="-1"]:focus-visible {
          box-shadow: 0 0 0 3px #ffdf00; outline: 3px solid #001d6d; outline-offset: 2px;
        }
        .course-g04-l03-ts-007-mobile-feedback,
        .course-g04-l03-ts-007-mobile-dialog,
        .course-g04-l03-ts-007-mobile-complete {
          background: #fffde9; border: 2px solid #50729d; border-radius: 10px;
          display: grid; gap: 8px; padding: 14px; text-align: center;
        }
        .course-g04-l03-ts-007-mobile-feedback > *,
        .course-g04-l03-ts-007-mobile-dialog > *,
        .course-g04-l03-ts-007-mobile-complete > * {margin: 0;}
        .course-g04-l03-ts-007-mobile-feedback strong,
        .course-g04-l03-ts-007-mobile-dialog strong,
        .course-g04-l03-ts-007-mobile-complete strong {font-size: 20px;}
        .course-g04-l03-ts-007-reading > p {margin: 0;}
        .course-g04-l03-ts-007-reading ol {display: grid; gap: 12px; grid-template-columns: repeat(2,minmax(0,1fr)); list-style: none; margin: 0; padding: 0;}
        .course-g04-l03-ts-007-reading li {background: #fff; border: 1px solid #bdd2e7; border-radius: 8px; padding: 10px 12px;}
        .course-g04-l03-ts-007-reading h3 {font-size: 17px; margin: 0 0 6px;}
        .course-g04-l03-ts-007-reading li p {margin: 4px 0;}
        .course-g04-l03-ts-007-mobile-controls summary {cursor: pointer; min-height: 44px; padding: 8px 0; box-sizing: border-box;}
        .course-g04-l03-ts-007-number-line {margin: 0 auto; width: 100%; max-width: 480px;}
        .course-g04-l03-ts-007-number-line > svg {display: block; width: 100%; height: auto;}
        .course-g04-l03-ts-007-number-line figcaption {font-size: 14px; text-align: center;}
        .course-g04-l03-ts-007-source-hit-button {
          background: rgb(255 255 255 / 1%); border: 2px solid transparent; color: transparent;
          cursor: pointer; font-size: 1px; margin: 0; padding: 0; pointer-events: auto; position: absolute;
        }
        .course-g04-l03-ts-007-source-hit-button:focus-visible {
          background: rgb(255 255 255 / 14%); border-color: #001d6d; box-shadow: 0 0 0 4px #ffdf00; outline: none;
        }
        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ts-007-stage-surface {display: none;}
          .course-g04-l03-ts-007-mobile-context {display: block;}
          .course-g04-l03-ts-007-mobile-choices {display: grid; gap: 9px; grid-template-columns: repeat(2,minmax(0,1fr));}
          .course-g04-l03-ts-007-mobile-choices button {align-items: center; display: grid; gap: 4px; justify-items: center;}
          .course-g04-l03-ts-007-mobile-choices button span {font-size: 14px;}
          .course-g04-l03-ts-007-reading ol {grid-template-columns: minmax(0,1fr);}
        }
      `}</style>

      <div
        aria-hidden={interactionEnabled ? true : undefined}
        inert={interactionEnabled ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: "none"}}
      >
        <SourceStaticRenderer
          {...props}
          frame={sourceVisualFrame}
          state={sourceVisualState}
        />
      </div>

      {interactionEnabled ? (
        <>
          <StageSurface {...sharedSurfaceProps} />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ts-007-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
        </>
      ) : null}
    </div>
  );
}

export function CourseG04L03Ts007Renderer(props: AnimationRendererProps) {
  const directMapping = findDirectCompanionCompositeCapture(props);
  if (directMapping) {
    return (
      <DirectCompanionCompositeEvidenceRenderer
        mapping={directMapping}
        props={props}
      />
    );
  }
  const naturalMapping = findNaturalParentCompositeCapture(props);
  if (naturalMapping) {
    return (
      <NaturalParentCompositeEvidenceRenderer
        mapping={naturalMapping}
        props={props}
      />
    );
  }
  const mapping = findParentCompositeCapture(props);
  return mapping
    ? <ParentCompositeEvidenceRenderer mapping={mapping} props={props} />
    : <CourseG04L03Ts007MainRenderer {...props} />;
}

export {COURSE_G04_L03_TS_007_SOURCE};
export const COURSE_G04_L03_TS_007_MOVIE = candidate.movie;
export const COURSE_G04_L03_TS_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TS_007_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "modern-reconstruction-functional-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: FUNCTIONAL_ENTRY_FRAME,
    scenario: SOURCE_SCENARIO,
    language: "en",
    entryStateCaptureOverlayEnabled: false,
  }),
  currentJavascriptSourceVisualDonors: SOURCE_VISUAL_DONOR_MAP,
  naturalCompositeUnresolvedFrames: NATURAL_COMPOSITE_UNRESOLVED_FRAMES,
  naturalCompositeEstablished: false,
  sourceVisualParityEstablished: false,
  sourceFeedbackVisualParityEstablished: false,
  sourceRandomParityEstablished: false,
  sourceTimingParityEstablished: false,
  associatedAudioModeled: false,
  needMoreHelpSourceVisualAccepted: false,
  glossaryHostCallbacks: "typed-modern-keyterm-adapter-original-host-parity-unestablished",
  pauseAndReducedMotionPolicy: COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  interactionAuthority: COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  parentCompositeCaptureStatus:
    "three-source-static-placement-paths-current-js-only",
  parentCompositeAsset: Object.freeze({
    path: COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG.assetSource,
    sha256: COURSE_G04_L03_TS_007_PARENT_COMPOSITE_CONFIG.assetSha256,
    manifest:
      "public/flash-assets/courses/course-g04-l03-ts-007-parent-composite/manifest.json",
    report: "reports/g4-l3-parent-composite-assets.json",
  }),
  naturalParentCompositeCaptureStatus:
    "two-source-static-parent-domains-current-js-only",
  naturalParentCompositeAsset: Object.freeze({
    path: COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG.assetSource,
    sha256:
      COURSE_G04_L03_TS_007_NATURAL_PARENT_COMPOSITE_CONFIG.assetSha256,
    manifest:
      "public/flash-assets/courses/course-g04-l03-ts-007-natural-parent-composite/manifest.json",
    report: "reports/g4-l3-natural-parent-composite-assets.json",
  }),
  directCompanionCompositeCaptureStatus:
    "twelve-source-static-direct-companion-domains-current-js-only",
  directCompanionCompositeAssets:
    COURSE_G04_L03_TS_007_DIRECT_COMPANION_COMPOSITE_CONFIGS.map((config) =>
      Object.freeze({
        path: config.assetSource,
        sha256: config.assetSha256,
        report: "reports/g4-l3-natural-parent-composite-assets.json",
      })),
  visibleCompanionAudioStatus:
    "ten-exact-source-payload-local-domain-candidates-listening-and-runtime-sync-pending",
  visibleCompanionAudioReport:
    "reports/g4-l3-visible-companion-audio-candidates.json",
  unresolvedCompanionAudioCueCount: 1,
  visibleCompanionPlaybackStatus:
    "deterministic-local-domain-only-parent-and-root-synchronization-pending",
  originalRuntimeAuthorityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_TS_007_SCENARIOS = Object.freeze([
  ...candidate.scenarios,
  Object.freeze({
    id: "source-static-reachable-domain",
    label: "Source-static reachable companion diagnostic",
    description:
      "English-only exact placement-path inspection; not original runtime or fidelity acceptance.",
  }),
]);
export function getCourseG04L03Ts007FrameState(
  frame: number,
  context: Parameters<typeof candidate.getFrameState>[1],
) {
  const base = candidate.getFrameState(frame, context);
  const request = {
    entryStateSha256: context.entryStateSha256,
    frame,
    frameDomain: context.frameDomain,
    lang: context.lang,
    requirementId: context.requirementId,
    scenario: context.scenario,
    traceId: context.traceId,
  };
  const mapping = findParentCompositeCapture(request)
    ?? findNaturalParentCompositeCapture(request)
    ?? findDirectCompanionCompositeCapture(request);
  if (!mapping) return base;
  return Object.freeze({
    ...base,
    blocker: null,
    exportFrame: null,
    frame,
    frameDomain: mapping.frameDomain,
    language: mapping.language,
    rootFrame: mapping.rootEntryFrame,
    scenario: mapping.scenario,
    sourceStaticVisualReady: true,
    status: "ready" as const,
    visibleSourceMarkers: Object.freeze([
      `${mapping.frameDomain}-path-${mapping.pathIndex}-source-behavior-composite-frame-${frame}`,
    ]),
  });
}

const activityModule = Object.freeze({
  ...candidate.module,
  completionMode: "activity" as const,
  audioCues: Object.freeze([
    ...candidate.module.audioCues,
    ...visibleCompanionAudioCandidates,
  ]),
  playbackEndFrameByDomain: Object.freeze({
    ...candidate.module.playbackEndFrameByDomain,
    ...visibleCompanionPlaybackEndFrameByDomain,
  }),
  defaultScenarioByFrameDomain: Object.freeze({
    ...candidate.module.defaultScenarioByFrameDomain,
    "sprite-284": "source-static-reachable-domain",
    "sprite-290": "source-static-reachable-domain",
    "sprite-314": "source-static-reachable-domain",
    "sprite-324": "source-static-reachable-domain",
    "sprite-90": "source-static-reachable-domain",
    "sprite-114": "source-static-reachable-domain",
    "sprite-127": "source-static-reachable-domain",
    "sprite-183": "source-static-reachable-domain",
    "sprite-193": "source-static-reachable-domain",
    "sprite-211": "source-static-reachable-domain",
    "sprite-225": "source-static-reachable-domain",
    "sprite-253": "source-static-reachable-domain",
    "sprite-350": "source-static-reachable-domain",
    "sprite-382": "source-static-reachable-domain",
    "sprite-415": "source-static-reachable-domain",
    "sprite-439": "source-static-reachable-domain",
  }),
  scenarios: COURSE_G04_L03_TS_007_SCENARIOS,
  getFrameState: getCourseG04L03Ts007FrameState,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Ts007Renderer,
});

const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, Renderer: CourseG04L03Ts007Renderer, module: activityModule},
  COURSE_G04_L03_TS_007_GLOSSARY_CONFIG,
  {scenario: "source-static-frame", canvasCandidateStatus: "source-static-engineering-not-strict", surfacePlacement: "companion"},
);
export default glossaryCandidate.module;
