"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {Dispatch, KeyboardEvent, RefObject} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import type {LessonTextCompletionCapability} from "../lesson-text-contract";
import {getTs007TextSnapshot, TS007_NATIVE_WALKTHROUGH, TS007_GUESS_LOCATIONS, TS007_INTRO_OPACITY, TS007_INTRO_CHOICES_OPACITY} from "../modern-lessons/g4-l3-ts007-text";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_GLOSSARY,
  COURSE_G04_L03_TS_007_HELP,
  COURSE_G04_L03_TS_007_HELP_AXIS,
  COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  COURSE_G04_L03_TS_007_QUESTION,
  COURSE_G04_L03_TS_007_QUIZ_STRATEGY,
  COURSE_G04_L03_TS_007_WALKTHROUGH_COPY,
  createCourseG04L03Ts007InteractionState,
  reduceCourseG04L03Ts007Interaction,
  type CourseG04L03Ts007Choice,
  type CourseG04L03Ts007InteractionAction,
  type CourseG04L03Ts007InteractionState,
} from "../timelines/course-g04-l03-ts-007-practice-question-interaction";
import {
  COURSE_G04_L03_TS_007_CONFIG,
  COURSE_G04_L03_TS_007_SOURCE,
} from "../timelines/course-g04-l03-ts-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_007_CONFIG,
);
const SourceStaticRenderer = candidate.Renderer;

const SOURCE_DOMAIN = "sprite-441";
const SOURCE_SCENARIO = "source-static-frame";
const FUNCTIONAL_ENTRY_FRAME = 235;
const QUIZ_DONOR_FRAME = 680;
export const COURSE_G04_L03_TS_007_INTERACTION_COMPLETION = Object.freeze({
  id: "g4-l3-ts007-terminal",
  frameDomain: SOURCE_DOMAIN,
  // The host holds at the authored stop while the maintained reducer reaches 696.
  frames: Object.freeze([FUNCTIONAL_ENTRY_FRAME]),
} satisfies LessonTextCompletionCapability);
// Use native-flow controls before the 800px source stage shrinks its targets.
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 1023px), (any-pointer: coarse)";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

type SourceCanvasStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "blocked";

const visuallyHiddenStyle = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

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
    return "The current-JavaScript source drawing could not load. Controls remain disabled.";
  }
  if (status === "blocked") {
    return "This source drawing is unavailable for the requested context. Controls remain disabled.";
  }
  return "Loading the current-JavaScript source drawing before controls are enabled…";
}

function WalkthroughTeachingText({gate, modernText = false}: {readonly gate: 0 | 1 | 2 | 3; readonly modernText?: boolean}) {
  const step = (modernText ? TS007_NATIVE_WALKTHROUGH : COURSE_G04_L03_TS_007_WALKTHROUGH_COPY)[gate];
  return (
    <div
      className="course-g04-l03-ts-007-walkthrough-copy"
      data-source-frame={step.sourceFrame}
      data-source-text-ids={step.sourceTextIds.join(",")}
      lang="en"
    >
      {step.paragraphs.map((paragraph, index) => (
        <p key={step.sourceTextIds[index]} data-lesson-text-block={modernText ? [
          ["question"], ["where-question"], ["given", "needed", "draw-strategy", "draw-instruction", "draw-result"],
          ["guess-strategy", "guess-question", "guess-result"],
        ][gate][index] : undefined}>{paragraph}</p>
      ))}
    </div>
  );
}

export function CourseG04L03Ts007GuessLocations() {
  return <dl className="course-g04-l03-ts-007-guess-locations" aria-label="Symbol locations" data-source-sprite="sprite-127">
    {TS007_GUESS_LOCATIONS.map(item => <div key={item.choiceId} data-guess-choice={item.choiceId} data-source-text-ids={item.sourceTextIds.join(",")}>
      <dt>{item.choiceId}: {COURSE_G04_L03_TS_007_CHOICES.find(choice => choice.id === item.choiceId)?.symbol}</dt>
      <dd>{item.value < 0 ? `−${Math.abs(item.value)}` : item.value}</dd>
    </div>)}
  </dl>;
}

function QuizStrategy() {
  return (
    <div
      className="course-g04-l03-ts-007-quiz-strategy"
      data-source-frame={COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceFrame}
      data-source-text-ids={COURSE_G04_L03_TS_007_QUIZ_STRATEGY.sourceTextIds.join(",")}
      lang="en"
    >
      <strong>{COURSE_G04_L03_TS_007_QUIZ_STRATEGY.lines[0]}</strong>
      <span>{COURSE_G04_L03_TS_007_QUIZ_STRATEGY.lines[1]}</span>
    </div>
  );
}

export function CourseG04L03Ts007ResponsiveNumberLinePreview() {
  return (
    <div
      aria-hidden="true"
      className="course-g04-l03-ts-007-responsive-number-line-preview"
      data-source-visual-parity-established="false"
    >
      <div className="course-g04-l03-ts-007-responsive-number-line-preview-content">
        <p>{COURSE_G04_L03_TS_007_QUESTION.prompt}</p>
        <CourseG04L03Ts007NativeNumberLine />
      </div>
    </div>
  );
}

export function CourseG04L03Ts007ResponsiveFeedbackPreview({
  interaction,
}: {
  readonly interaction: CourseG04L03Ts007InteractionState;
}) {
  const feedback = interaction.feedback;
  if (!feedback) return null;
  return (
    <div
      aria-hidden="true"
      className="course-g04-l03-ts-007-responsive-feedback-preview"
      data-feedback-branch={`${feedback.kind}${feedback.branch}`}
      data-source-visual-parity-established="false"
    >
      <div className="course-g04-l03-ts-007-responsive-feedback-preview-content">
        <strong data-source-text-ids={feedback.sourceWindow.sourceTextIds.join(",")}>
          {feedback.sourceWindow.sourceHeading}
        </strong>
        <p>{feedbackCopy(interaction)}</p>
      </div>
    </div>
  );
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

const NATIVE_NUMBER_LINE_TICKS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const;
const NATIVE_SYMBOL_GLYPHS = Object.freeze({
  A: "●",
  B: "♥",
  C: "■",
  D: "▲",
});

// A teaching companion, not a reconstruction of the source's vector geometry.
export function CourseG04L03Ts007NativeNumberLine({
  scrollable = false,
  fullyLabeled = false,
}: {
  readonly scrollable?: boolean;
  readonly fullyLabeled?: boolean;
}) {
  return (
    <figure
      aria-description={scrollable ? "Scroll horizontally to inspect the full number line" : undefined}
      className="course-g04-l03-ts-007-native-number-line"
      data-source-visual-parity-established="false"
      tabIndex={scrollable ? 0 : undefined}
    >
      <figcaption>Positions on the number line</figcaption>
      <ol aria-label="Number line from negative five to positive five, in steps of one">
        {NATIVE_NUMBER_LINE_TICKS.map((value) => {
          const choice = COURSE_G04_L03_TS_007_CHOICES.find(
            (item) => item.numberLineLocation === value,
          );
          const label = value < 0 ? `−${Math.abs(value)}` : String(value);
          const majorLabel = fullyLabeled || value === -5 || value === 0 || value === 5;
          return (
            <li
              data-axis-label-visible={majorLabel ? "true" : "false"}
              data-number-line-location={value}
              key={value}
            >
              <span className="course-g04-l03-ts-007-native-marker">
                {choice ? (
                  <span
                    aria-label={`${choice.id}: ${choice.symbol}`}
                    className={`course-g04-l03-ts-007-native-symbol course-g04-l03-ts-007-native-symbol--${choice.id}`}
                    data-source-choice-instance={choice.sourceInstance}
                    role="img"
                  >
                    <span aria-hidden="true">{NATIVE_SYMBOL_GLYPHS[choice.id]}</span>
                  </span>
                ) : null}
              </span>
              <span aria-hidden="true" className="course-g04-l03-ts-007-native-tick" />
              <span className="course-g04-l03-ts-007-native-value">
                {majorLabel ? label : <span style={visuallyHiddenStyle}>{label}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export function CourseG04L03Ts007HelpTeachingContent({
  compact,
  descriptionId,
}: {
  readonly compact: boolean;
  readonly descriptionId: string;
}) {
  return (
    <>
      <p
        className="course-g04-l03-ts-007-help-copy"
        data-source-text-id={COURSE_G04_L03_TS_007_HELP.sourceDescriptionTextId}
        id={descriptionId}
      >
        {COURSE_G04_L03_TS_007_HELP.description}
      </p>
      <p
        className="course-g04-l03-ts-007-help-copy"
        data-source-text-id={COURSE_G04_L03_TS_007_HELP.sourceExampleTextId}
      >
        {COURSE_G04_L03_TS_007_HELP.example}
      </p>
      <figure
        aria-description={compact ? "Use arrow keys to inspect more positions when the line extends beyond the panel" : undefined}
        className={`course-g04-l03-ts-007-help-number-line${compact ? " course-g04-l03-ts-007-help-number-line--compact" : ""}`}
        data-source-axis-minus-shape-id={COURSE_G04_L03_TS_007_HELP.sourceAxisMinusShapeId}
        data-source-sprite-id={COURSE_G04_L03_TS_007_HELP.sourceSpriteId}
        data-source-visual-parity-established="false"
        tabIndex={compact ? 0 : undefined}
      >
        <figcaption>Number line from −10 to 10</figcaption>
        <div className="course-g04-l03-ts-007-help-polarities">
          <span data-source-text-id={COURSE_G04_L03_TS_007_HELP.sourceNegativeTitleTextId}>
            {COURSE_G04_L03_TS_007_HELP.negativeTitle}
          </span>
          <span data-source-text-id={COURSE_G04_L03_TS_007_HELP.sourcePositiveTitleTextId}>
            {COURSE_G04_L03_TS_007_HELP.positiveTitle}
          </span>
        </div>
        <ol aria-label="Number line from negative ten to positive ten, in steps of one">
          {COURSE_G04_L03_TS_007_HELP_AXIS.map(({value, sourceTextId}) => {
            const label = value < 0 ? `−${Math.abs(value)}` : String(value);
            return (
              <li
                aria-label={value < 0 ? `negative ${Math.abs(value)}` : String(value)}
                data-help-example={value === -5 ? "true" : "false"}
                data-help-axis-location={value}
                data-source-text-id={sourceTextId}
                key={value}
              >
                <span aria-hidden="true" className="course-g04-l03-ts-007-help-tick" />
                <span className="course-g04-l03-ts-007-help-value">
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </figure>
    </>
  );
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
    ? "That answer is not correct. After this feedback, try the question again."
    : "That answer is not correct. This is the second try; the activity will continue to its terminal state.";
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
    const targets = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        '.course-g04-l03-ts-007-help-number-line[tabindex="0"], button:not(:disabled)',
      ),
    );
    const activeIndex = targets.indexOf(event.currentTarget.ownerDocument.activeElement as HTMLElement);
    event.preventDefault();
    const nextIndex = event.shiftKey
      ? (activeIndex <= 0 ? targets.length - 1 : activeIndex - 1)
      : (activeIndex + 1) % targets.length;
    targets[nextIndex]?.focus();
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

function focusVisibleInteractionTarget(
  roots: readonly (HTMLElement | null)[],
  target: string,
) {
  const control = findVisibleFocusTarget(roots, target);
  const dialog = control?.closest<HTMLElement>(
    ".course-g04-l03-ts-007-mobile-dialog",
  );
  control?.focus(dialog ? {preventScroll: true} : undefined);
  if (control?.closest(".course-g04-l03-ts-007-runtime--native")) {
    const target = dialog ?? control;
    target.scrollIntoView({block: "nearest", behavior: "instant"});
    const headerBottom = document.querySelector<HTMLElement>(
      ".lesson-shell2__learning-nav",
    )?.getBoundingClientRect().bottom ?? 0;
    const top = target.getBoundingClientRect().top;
    if (top < headerBottom + 12 || dialog) {
      window.scrollBy({behavior: "instant", top: top - headerBottom - 12});
    }
    return;
  }
  if (!dialog?.closest(".course-g04-l03-ts-007-mobile-controls--portal")) {
    return;
  }
  const headerBottom = document.querySelector<HTMLElement>(
    ".lesson-shell2__learning-nav",
  )?.getBoundingClientRect().bottom ?? 0;
  const dialogTop = dialog.getBoundingClientRect().top;
  if (Math.abs(dialogTop - headerBottom - 12) > 1) {
    window.scrollBy({
      behavior: "instant",
      top: dialogTop - headerBottom - 12,
    });
  }
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
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly placement: "fallback" | "portal" | "native";
  readonly modernText?: boolean;
  readonly introductionFrame?: number;
}

export function CourseG04L03Ts007FlowSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onReplay,
  paused,
  placement,
  modernText = false,
  introductionFrame,
}: MobileSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  return (
    <section
      aria-label="Current-JavaScript practice question controls"
      className={
        "course-g04-l03-ts-007-mobile-controls " +
        `course-g04-l03-ts-007-mobile-controls--${placement}`
      }
      data-current-js-modern-reconstruction="true"
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface={modernText ? "native" : "mobile"}
      lang={modernText ? "en" : undefined}
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
    >
      {!modernText ? <p className="course-g04-l03-ts-007-modern-label">
        <strong>Modern reconstruction</strong>
        <span>
          Current-JavaScript controls; source natural composite and visual
          parity are not established.
        </span>
      </p> : null}

      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-ts-007-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus)}
        </p>
      ) : null}

      {introductionFrame ? <>
        <div data-ts007-introduction-frame={introductionFrame} data-ts007-introduction-opacity={TS007_INTRO_OPACITY(introductionFrame)}
          aria-hidden={introductionFrame === 1 ? true : undefined} inert={introductionFrame === 1 ? true : undefined}
          style={{opacity: TS007_INTRO_OPACITY(introductionFrame)}}>
          <p className="course-g04-l03-ts-007-question" data-lesson-text-block="question">{COURSE_G04_L03_TS_007_QUESTION.prompt}</p>
          <CourseG04L03Ts007NativeNumberLine scrollable />
        </div>
        {introductionFrame >= 8 ? <div aria-label="Answer choices" className="course-g04-l03-ts-007-mobile-choices" role="group" data-ts007-introduction-choice-opacity={TS007_INTRO_CHOICES_OPACITY(introductionFrame)} aria-hidden={introductionFrame === 8 ? true : undefined} inert={introductionFrame === 8 ? true : undefined} style={{opacity: TS007_INTRO_CHOICES_OPACITY(introductionFrame)}}>
          {COURSE_G04_L03_TS_007_CHOICES.map(choice => <button aria-label={accessibleChoiceLabel(choice)} disabled key={choice.id} type="button">
            <strong>{choice.id}</strong><span>{choice.symbol}</span>
          </button>)}
        </div> : null}
        {introductionFrame >= 8 ? <div aria-label="Unavailable glossary links" className="course-g04-l03-ts-007-mobile-glossary" role="group">
          {COURSE_G04_L03_TS_007_GLOSSARY.map(({term}) => <button aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`} disabled key={term} type="button">{term} glossary unavailable</button>)}
        </div> : null}
      </> : null}

      {interaction.phase === "walkthrough" && !introductionFrame ? (
        <>
          <p>
            Walkthrough checkpoint{" "}
            {(interaction.walkthroughGate ?? 0) + 1} of 4.
          </p>
          <WalkthroughTeachingText gate={interaction.walkthroughGate ?? 0} modernText={modernText} />
          <CourseG04L03Ts007NativeNumberLine scrollable fullyLabeled={modernText && interaction.walkthroughGate === 2} />
          {modernText && interaction.walkthroughGate === 3 ? <CourseG04L03Ts007GuessLocations /> : null}
          <button
            className="course-g04-l03-ts-007-mobile-walkthrough-continue"
            data-ts007-focus-control="walkthrough-continue"
            disabled={controlsDisabled}
            onClick={() => dispatch({type: "continue-walkthrough"})}
            type="button"
          >
            Continue
          </button>
        </>
      ) : null}

      {!introductionFrame && interaction.phase === "quiz" ? (
        <>
          <p className="course-g04-l03-ts-007-question">
            {COURSE_G04_L03_TS_007_QUESTION.prompt}
          </p>
          <QuizStrategy />
          <CourseG04L03Ts007NativeNumberLine scrollable />
          {modernText ? <CourseG04L03Ts007GuessLocations /> : null}
          <div
            aria-label="Answer choices"
            className="course-g04-l03-ts-007-mobile-choices"
            role="group"
          >
            {COURSE_G04_L03_TS_007_CHOICES.map((choice) => (
              <button
                aria-label={accessibleChoiceLabel(choice)}
                data-ts007-focus-control={`choice-${choice.id}`}
                disabled={controlsDisabled}
                key={choice.id}
                onClick={() =>
                  dispatch({type: "choose", choiceId: choice.id})}
                type="button"
              >
                <strong>{choice.id}</strong>
                <span>{choice.symbol}</span>
              </button>
            ))}
          </div>
          <button
            data-ts007-focus-control="need-more-help"
            disabled={controlsDisabled}
            onClick={() => dispatch({type: "open-need-more-help"})}
            type="button"
          >
            Need More Help
          </button>
          <div
            aria-label="Unavailable glossary links"
            className="course-g04-l03-ts-007-mobile-glossary"
            role="group"
          >
            {COURSE_G04_L03_TS_007_GLOSSARY.map(({term}) => (
              <button
                aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`}
                disabled
                key={term}
                type="button"
              >
                {term} glossary unavailable
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!introductionFrame && interaction.phase === "feedback" && interaction.feedback ? (
        <div
          aria-atomic="true"
          aria-live="assertive"
          className="course-g04-l03-ts-007-mobile-feedback"
          data-feedback-branch={`${interaction.feedback.kind}${interaction.feedback.branch}`}
          data-feedback-remaining-ms={feedbackRemainingMs ?? undefined}
          data-feedback-source-visual-parity-established="false"
          data-ts007-focus-control="feedback-status"
          role="status"
          tabIndex={-1}
        >
          <strong
            data-source-text-ids={interaction.feedback.sourceWindow.sourceTextIds.join(",")}
          >
            {interaction.feedback.sourceWindow.sourceHeading}
          </strong>
          <p>{feedbackCopy(interaction)}</p>
          <button
            disabled={!controlsReady || paused}
            onClick={onFinishFeedback}
            type="button"
          >
            Continue
          </button>
        </div>
      ) : null}

      {!introductionFrame && interaction.phase === "need-more-help" ? (
        <div
          aria-describedby="course-g04-l03-ts-007-mobile-help-copy"
          aria-label="Need More Help"
          aria-modal="true"
          className="course-g04-l03-ts-007-mobile-dialog"
          onKeyDown={(event) => handleModalKeys(event, onCloseNeedMoreHelp)}
          role="dialog"
        >
          <strong>Need More Help</strong>
          <CourseG04L03Ts007HelpTeachingContent
            compact
            descriptionId="course-g04-l03-ts-007-mobile-help-copy"
          />
          <button
            data-ts007-focus-control="need-more-help-close"
            disabled={!controlsReady}
            onClick={onCloseNeedMoreHelp}
            type="button"
          >
            Close
          </button>
        </div>
      ) : null}

      {!introductionFrame && interaction.phase === "terminal" ? (
        <div
          aria-live="polite"
          className="course-g04-l03-ts-007-mobile-complete"
          data-ts007-focus-control="terminal"
          role="status"
          tabIndex={-1}
        >
          <strong>Question complete</strong>
          <p>Use Replay to restart the complete walkthrough and quiz state.</p>
          <button
            disabled={controlsDisabled}
            onClick={onReplay}
            type="button"
          >
            Replay
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function CourseG04L03Ts007DesktopQuiz({
  controlsDisabled,
  dispatch,
}: {
  readonly controlsDisabled: boolean;
  readonly dispatch: Dispatch<CourseG04L03Ts007InteractionAction>;
}) {
  return (
    <div
      className="course-g04-l03-ts-007-stage-quiz"
      data-source-visual-parity-established="false"
    >
      <p className="course-g04-l03-ts-007-stage-question" lang="en">
        {COURSE_G04_L03_TS_007_QUESTION.prompt}
      </p>
      <CourseG04L03Ts007NativeNumberLine />
      <QuizStrategy />
      <div aria-label="Answer choices" role="group">
        {COURSE_G04_L03_TS_007_CHOICES.map((choice) => (
          <button
            aria-label={accessibleChoiceLabel(choice)}
            className="course-g04-l03-ts-007-source-hit-button"
            data-source-button-object-id={choice.sourceButtonObjectId}
            data-source-instance={choice.sourceInstance}
            data-ts007-focus-control={`choice-${choice.id}`}
            disabled={controlsDisabled}
            key={choice.id}
            onClick={() => dispatch({type: "choose", choiceId: choice.id})}
            style={{
              height: choice.hitBounds.height,
              left: choice.hitBounds.x,
              top: choice.hitBounds.y,
              width: choice.hitBounds.width,
            }}
            type="button"
          >
            <strong>{choice.id}</strong>
            <span aria-hidden="true">{NATIVE_SYMBOL_GLYPHS[choice.id]}</span>
          </button>
        ))}
      </div>
      <div className="course-g04-l03-ts-007-stage-utilities">
        <button
          data-ts007-focus-control="need-more-help"
          disabled={controlsDisabled}
          onClick={() => dispatch({type: "open-need-more-help"})}
          type="button"
        >
          Need More Help
        </button>
        {COURSE_G04_L03_TS_007_GLOSSARY.map(({term}) => (
          <button
            aria-label={`${term} glossary is unavailable because the legacy host callback is unresolved`}
            disabled
            key={term}
            type="button"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

function StageSurface({
  canvasStatus,
  controlsReady,
  dispatch,
  feedbackRemainingMs,
  interaction,
  onCloseNeedMoreHelp,
  onFinishFeedback,
  onReplay,
  paused,
}: SharedSurfaceProps) {
  const controlsDisabled = !controlsReady || paused;
  return (
    <svg
      aria-label="Current-JavaScript reconstructed walkthrough and practice controls"
      className="course-g04-l03-ts-007-stage-surface"
      data-current-js-modern-reconstruction="true"
      data-interaction-phase={interaction.phase}
      data-source-canvas-status={canvasStatus}
      role="group"
      style={{
        background: interaction.phase === "walkthrough" || interaction.phase === "feedback"
          ? "#e9f7ff"
          : undefined,
        height: "auto",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
        zIndex: 4,
      }}
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <div
          style={{
            fontFamily: SOURCE_FONT,
            height: 600,
            pointerEvents: "none",
            position: "relative",
            width: 800,
          }}
        >
          <p className="course-g04-l03-ts-007-stage-modern-label">
            <strong>Modern reconstruction</strong>
            <span>
              Source natural composite and visual parity are not established.
            </span>
          </p>

          {!controlsReady ? (
            <span
              aria-live={canvasStatus === "error" ? "assertive" : "polite"}
              role={canvasStatus === "error" ? "alert" : "status"}
              style={visuallyHiddenStyle}
            >
              {sourceCanvasStatusMessage(canvasStatus)}
            </span>
          ) : null}

          {interaction.phase === "walkthrough" ? (
            <div className="course-g04-l03-ts-007-stage-walkthrough">
              <span>
                Checkpoint {(interaction.walkthroughGate ?? 0) + 1} of 4
              </span>
              <CourseG04L03Ts007NativeNumberLine />
              <WalkthroughTeachingText gate={interaction.walkthroughGate ?? 0} />
              <button
                data-ts007-focus-control="walkthrough-continue"
                disabled={controlsDisabled}
                onClick={() => dispatch({type: "continue-walkthrough"})}
                type="button"
              >
                Continue
              </button>
            </div>
          ) : null}

          {interaction.phase === "quiz" ? (
            <CourseG04L03Ts007DesktopQuiz
              controlsDisabled={controlsDisabled}
              dispatch={dispatch}
            />
          ) : null}

          {interaction.phase === "feedback" && interaction.feedback ? (
            <div
              aria-atomic="true"
              aria-live="assertive"
              className="course-g04-l03-ts-007-stage-feedback"
              data-feedback-branch={`${interaction.feedback.kind}${interaction.feedback.branch}`}
              data-feedback-remaining-ms={feedbackRemainingMs ?? undefined}
              data-feedback-source-visual-parity-established="false"
              data-ts007-focus-control="feedback-status"
              role="status"
              tabIndex={-1}
            >
              <strong
                data-source-text-ids={interaction.feedback.sourceWindow.sourceTextIds.join(",")}
              >
                {interaction.feedback.sourceWindow.sourceHeading}
              </strong>
              <p>{feedbackCopy(interaction)}</p>
              <button
                disabled={!controlsReady || paused}
                onClick={onFinishFeedback}
                type="button"
              >
                Continue
              </button>
            </div>
          ) : null}

          {interaction.phase === "need-more-help" ? (
            <div
              aria-describedby="course-g04-l03-ts-007-stage-help-copy"
              aria-label="Need More Help"
              aria-modal="true"
              className="course-g04-l03-ts-007-stage-dialog"
              onKeyDown={(event) =>
                handleModalKeys(event, onCloseNeedMoreHelp)}
              role="dialog"
            >
              <strong>Need More Help</strong>
              <CourseG04L03Ts007HelpTeachingContent
                compact={false}
                descriptionId="course-g04-l03-ts-007-stage-help-copy"
              />
              <button
                data-ts007-focus-control="need-more-help-close"
                disabled={!controlsReady}
                onClick={onCloseNeedMoreHelp}
                type="button"
              >
                Close
              </button>
            </div>
          ) : null}

          {interaction.phase === "terminal" ? (
            <div
              aria-live="polite"
              className="course-g04-l03-ts-007-stage-terminal"
              data-ts007-focus-control="terminal"
              role="status"
              tabIndex={-1}
            >
              <strong>Question complete</strong>
              <span>Replay resets the full reconstructed state.</span>
              <button
                disabled={controlsDisabled}
                onClick={onReplay}
                type="button"
              >
                Replay
              </button>
            </div>
          ) : null}
        </div>
      </foreignObject>
    </svg>
  );
}

export function CourseG04L03Ts007Renderer(props: AnimationRendererProps & {readonly modernText?: boolean}) {
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

  const nativeSnapshot = props.modernText ? getTs007TextSnapshot(
    props.state ?? candidate.getFrameState(props.frame, props),
    {...props, frameDomain: props.frameDomain ?? SOURCE_DOMAIN}, interaction,
  ) : null;
  const nativeMode = nativeSnapshot?.status === "ready";
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
  const controlsReady = nativeMode || (interactionEnabled && canvasStatus === "ready");
  const completionRequest = props.onLessonCompletionRequest;
  const completionFrame = props.frame;
  const completionSeed = props.seed;
  const completionReplay = props.replay ?? 0;
  useEffect(() => {
    if (!controlsReady || interaction.phase !== "terminal"
      || interaction.frame !== COURSE_G04_L03_TS_007_QUESTION.terminalFrame) return;
    completionRequest?.({
      id: COURSE_G04_L03_TS_007_INTERACTION_COMPLETION.id,
      frameDomain: SOURCE_DOMAIN,
      frame: completionFrame,
      seed: completionSeed,
      replay: completionReplay,
    });
  }, [completionFrame, completionReplay, completionRequest, completionSeed,
    controlsReady, interaction.phase, interaction.frame]);
  const feedbackIdentity = interaction.feedback
    ? `${interaction.feedback.kind}-${interaction.feedback.branch}-${interaction.feedback.choiceId}-${interaction.wrongTryCount}`
    : "";

  useEffect(() => {
    dispatch({type: "replay", seed: props.seed});
    feedbackRemainingMsRef.current = null;
    setFeedbackRemainingMs(null);
  }, [interactionEnabled, props.replay, props.seed]);

  useEffect(() => {
    if (nativeMode || !props.pageInteractionCompanionTargetId) {
      setCompanionTarget(null);
      return;
    }
    setCompanionTarget(
      document.getElementById(props.pageInteractionCompanionTargetId),
    );
  }, [nativeMode, props.pageInteractionCompanionTargetId]);

  useEffect(() => {
    const host = visualHostRef.current;
    if (nativeMode) {
      setCanvasStatus("ready");
      return;
    }
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
  }, [nativeMode, interactionEnabled, props.replay, sourceVisualFrame]);

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
      focusVisibleInteractionTarget(
        [rendererRef.current, companionTarget],
        interaction.focusTarget,
      );
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
        window.requestAnimationFrame(() => {
          focusVisibleInteractionTarget(
            [rendererRef.current, companionTarget],
            focusTarget,
          );
        });
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
    canvasStatus: nativeMode ? "ready" : canvasStatus,
    controlsReady,
    dispatch,
    feedbackRemainingMs,
    interaction,
    onCloseNeedMoreHelp: closeNeedMoreHelp,
    onFinishFeedback: finishFeedback,
    onReplay: replay,
    paused: props.paused ?? false,
  };
  const mobileSurface = (
    <CourseG04L03Ts007FlowSurface
      {...sharedSurfaceProps}
      modernText={nativeMode}
      introductionFrame={nativeMode && props.frame < FUNCTIONAL_ENTRY_FRAME ? props.frame : undefined}
      placement={nativeMode ? "native" : companionTarget ? "portal" : "fallback"}
    />
  );

  return (
    <div
      className={"course-g04-l03-ts-007-runtime" + (nativeMode ? " course-g04-l03-ts-007-runtime--native" : "")}
      data-ts007-native-binding={nativeMode ? nativeSnapshot.bindingVersion : undefined}
      data-ts007-native-blocks={nativeMode ? JSON.stringify(nativeSnapshot.blocks) : undefined}
      data-associated-audio-modeled="false"
      data-authoritative-baseline-accepted="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-functional-entry={
        `${SOURCE_DOMAIN}:${FUNCTIONAL_ENTRY_FRAME}:${SOURCE_SCENARIO}:en`
      }
      data-current-js-modern-reconstruction={
        nativeMode || interactionEnabled ? "true" : "false"
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
        @media (max-width: 760px) {
          .lesson-shell2:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) .lesson-shell2__learning-nav[data-lesson-platform-header="true"] {
            background: var(--lesson-platform-bg);
          }
        }

        .course-g04-l03-ts-007-mobile-fallback-slot,
        .course-g04-l03-ts-007-mobile-controls,
        .course-g04-l03-ts-007-responsive-number-line-preview,
        .course-g04-l03-ts-007-responsive-feedback-preview {
          display: none;
        }

        .course-g04-l03-ts-007-responsive-number-line-preview,
        .course-g04-l03-ts-007-responsive-feedback-preview {
          background: #e9f7ff;
          inset: 0;
          pointer-events: none;
          position: absolute;
          z-index: 3;
        }

        .course-g04-l03-ts-007-responsive-number-line-preview-content {
          align-content: center;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 6px;
          inset: 18% 3% 13%;
          position: absolute;
        }

        .course-g04-l03-ts-007-responsive-number-line-preview-content > p {
          color: #102b49;
          font-size: clamp(16px, 2vw, 20px);
          font-weight: 750;
          line-height: 1.2;
          margin: 0;
          text-align: center;
        }

        .course-g04-l03-ts-007-responsive-feedback-preview-content {
          align-content: center;
          color: #102b49;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 10px;
          inset: 18% 5% 13%;
          position: absolute;
          text-align: center;
        }

        .course-g04-l03-ts-007-responsive-feedback-preview-content strong {
          font-size: clamp(22px, 5vw, 32px);
          line-height: 1.2;
        }

        .course-g04-l03-ts-007-responsive-feedback-preview-content p {
          font-size: clamp(18px, 2.5vw, 20px);
          line-height: 1.4;
          margin: 0;
        }

        .course-g04-l03-ts-007-stage-surface button {
          font-family: ${SOURCE_FONT};
        }

        .course-g04-l03-ts-007-stage-surface
        button:focus-visible,
        .course-g04-l03-ts-007-stage-surface
        [tabindex="-1"]:focus-visible {
          outline: 4px solid #ffdf00;
          outline-offset: 3px;
        }

        .course-g04-l03-ts-007-stage-modern-label {
          align-items: center;
          background: rgb(11 43 85 / 94%);
          border: 2px solid #fff;
          border-radius: 9px;
          color: #fff;
          display: flex;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          gap: 10px;
          left: 184px;
          margin: 0;
          padding: 7px 12px;
          pointer-events: none;
          position: absolute;
          top: 136px;
          z-index: 5;
        }

        .course-g04-l03-ts-007-stage-modern-label strong {
          color: #ffe34e;
          white-space: nowrap;
        }

        .course-g04-l03-ts-007-stage-walkthrough,
        .course-g04-l03-ts-007-stage-terminal {
          align-items: center;
          background: rgb(255 255 255 / 96%);
          border: 3px solid #164986;
          border-radius: 14px;
          /* The modern host crops the historical stage's outer bands. */
          bottom: 72px;
          box-shadow: 0 5px 16px rgb(0 0 0 / 24%);
          display: flex;
          gap: 16px;
          justify-content: center;
          left: 210px;
          padding: 10px 16px;
          pointer-events: auto;
          position: absolute;
          right: 210px;
        }

        .course-g04-l03-ts-007-stage-walkthrough {
          align-items: stretch;
          background: #fff;
          bottom: 72px;
          column-gap: 20px;
          display: grid;
          font-family: system-ui, sans-serif;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          grid-template-rows: auto minmax(0, 1fr) auto;
          left: 32px;
          right: 32px;
          text-align: left;
          top: 180px;
        }

        .course-g04-l03-ts-007-stage-walkthrough > span {
          color: #163f82;
          font-size: 22px;
          font-weight: 800;
          grid-column: 1 / -1;
          line-height: 1.3;
        }

        .course-g04-l03-ts-007-stage-walkthrough
        .course-g04-l03-ts-007-native-number-line {
          align-self: center;
          grid-column: 1;
          grid-row: 2 / 4;
        }

        .course-g04-l03-ts-007-stage-walkthrough
        .course-g04-l03-ts-007-walkthrough-copy {
          align-self: center;
          font-size: 20px;
          grid-column: 2;
          grid-row: 2;
          line-height: 1.5;
        }

        .course-g04-l03-ts-007-stage-surface
        .course-g04-l03-ts-007-stage-walkthrough button {
          font-size: 18px;
          grid-column: 2;
          grid-row: 3;
          justify-self: start;
          min-height: 44px;
        }

        .course-g04-l03-ts-007-stage-terminal {
          color: #102b49;
          column-gap: 18px;
          display: grid;
          font-family: system-ui, sans-serif;
          grid-template-columns: minmax(0, 1fr) auto;
          left: 160px;
          right: 160px;
          row-gap: 4px;
          text-align: left;
        }

        .course-g04-l03-ts-007-stage-terminal > strong,
        .course-g04-l03-ts-007-stage-terminal > span {
          grid-column: 1;
        }

        .course-g04-l03-ts-007-stage-terminal > button {
          align-self: center;
          grid-column: 2;
          grid-row: 1 / span 2;
        }

        .course-g04-l03-ts-007-walkthrough-copy {
          display: grid;
          font-family: system-ui, sans-serif;
          font-size: 16px;
          gap: 5px;
          line-height: 1.35;
          text-align: left;
        }

        .course-g04-l03-ts-007-walkthrough-copy p {
          margin: 0;
        }

        .course-g04-l03-ts-007-stage-walkthrough button,
        .course-g04-l03-ts-007-stage-terminal button,
        .course-g04-l03-ts-007-stage-feedback button,
        .course-g04-l03-ts-007-stage-dialog button,
        .course-g04-l03-ts-007-stage-utilities button {
          background: linear-gradient(#fff36b, #48cbd2);
          border: 2px solid #173f80;
          border-radius: 999px;
          color: #111;
          cursor: pointer;
          font-size: 17px;
          font-weight: 800;
          min-height: 42px;
          padding: 6px 16px;
        }

        .course-g04-l03-ts-007-stage-surface button:disabled {
          cursor: default;
          opacity: .55;
        }

        .course-g04-l03-ts-007-stage-quiz {
          background: #fff;
          color: #102b49;
          font-family: system-ui, sans-serif;
          inset: 0;
          pointer-events: none;
          position: absolute;
        }

        .course-g04-l03-ts-007-quiz-strategy {
          color: #163f82;
          display: grid;
          font-family: system-ui, sans-serif;
          font-size: 16px;
          gap: 3px;
          line-height: 1.25;
          text-align: left;
        }

        .course-g04-l03-ts-007-stage-quiz
        .course-g04-l03-ts-007-quiz-strategy {
          left: 52px;
          position: absolute;
          right: 300px;
          top: 418px;
        }

        .course-g04-l03-ts-007-stage-question {
          font-size: 22px;
          font-weight: 750;
          left: 52px;
          line-height: 1.25;
          margin: 0;
          position: absolute;
          right: 300px;
          text-align: left;
          top: 190px;
        }

        .course-g04-l03-ts-007-source-hit-button {
          align-items: center;
          background: #e6f4ff;
          border: 2px solid #173f80;
          border-radius: 10px;
          box-sizing: border-box;
          color: #102b49;
          cursor: pointer;
          display: flex;
          font-family: system-ui, sans-serif !important;
          font-size: 18px;
          font-weight: 800;
          justify-content: space-around;
          margin: 0;
          min-height: 44px;
          padding: 0;
          pointer-events: auto;
          position: absolute;
        }

        .course-g04-l03-ts-007-source-hit-button:focus-visible {
          background: #fff6bd;
          border-color: #001d6d;
          box-shadow: 0 0 0 4px #ffdf00;
          outline: none !important;
        }

        .course-g04-l03-ts-007-source-hit-button span {
          font-size: 24px;
        }

        .course-g04-l03-ts-007-stage-utilities {
          bottom: 64px;
          display: flex;
          gap: 8px;
          left: 24px;
          pointer-events: auto;
          position: absolute;
        }

        .course-g04-l03-ts-007-stage-utilities button {
          font-family: system-ui, sans-serif;
          font-size: 13px;
          min-height: 40px;
          padding-inline: 12px;
        }

        .course-g04-l03-ts-007-stage-feedback,
        .course-g04-l03-ts-007-stage-dialog {
          background: #fffde0;
          border: 4px solid #164986;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgb(0 0 0 / 32%);
          color: #102b49;
          display: grid;
          font-family: system-ui, sans-serif;
          gap: 9px;
          left: 160px;
          padding: 20px 24px;
          pointer-events: auto;
          position: absolute;
          text-align: center;
          top: 180px;
          width: 432px;
          z-index: 7;
        }

        .course-g04-l03-ts-007-stage-dialog {
          left: 72px;
          top: 135px;
          width: 600px;
        }

        .course-g04-l03-ts-007-stage-feedback > *,
        .course-g04-l03-ts-007-stage-dialog > * {
          margin: 0;
        }

        .course-g04-l03-ts-007-stage-feedback strong,
        .course-g04-l03-ts-007-stage-dialog strong {
          font-size: 24px;
        }

        .course-g04-l03-ts-007-stage-feedback p {
          font-size: 20px;
          line-height: 1.6;
        }

        .course-g04-l03-ts-007-stage-feedback button,
        .course-g04-l03-ts-007-stage-dialog button {
          justify-self: center;
        }

        .course-g04-l03-ts-007-stage-feedback button {
          font-size: 18px;
          min-height: 44px;
        }

        .course-g04-l03-ts-007-native-number-line {
          background: #fff;
          border: 1px solid #8aa8c7;
          border-radius: 10px;
          box-sizing: border-box;
          margin: 0;
          padding: 10px 4px;
        }

        .course-g04-l03-ts-007-stage-quiz
        .course-g04-l03-ts-007-native-number-line {
          left: 52px;
          position: absolute;
          top: 260px;
          width: 440px;
        }

        .course-g04-l03-ts-007-native-number-line figcaption {
          color: #163f82;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }

        .course-g04-l03-ts-007-stage-walkthrough
        .course-g04-l03-ts-007-native-number-line figcaption,
        .course-g04-l03-ts-007-stage-quiz
        .course-g04-l03-ts-007-native-number-line figcaption {
          font-size: 18px;
        }

        .course-g04-l03-ts-007-native-number-line ol {
          display: grid;
          grid-template-columns: repeat(11, minmax(0, 1fr));
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
        }

        .course-g04-l03-ts-007-native-number-line li {
          display: grid;
          grid-template-rows: 48px 12px 20px;
          justify-items: center;
          min-width: 0;
        }

        .course-g04-l03-ts-007-stage-walkthrough
        .course-g04-l03-ts-007-native-number-line li,
        .course-g04-l03-ts-007-stage-quiz
        .course-g04-l03-ts-007-native-number-line li {
          grid-template-rows: 48px 12px 24px;
        }

        .course-g04-l03-ts-007-native-marker {
          align-items: end;
          display: flex;
          justify-content: center;
        }

        .course-g04-l03-ts-007-native-symbol {
          align-items: center;
          display: flex;
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
        }

        .course-g04-l03-ts-007-native-symbol--A { color: #14643a; }
        .course-g04-l03-ts-007-native-symbol--B { color: #a3261c; }
        .course-g04-l03-ts-007-native-symbol--C { color: #8d1c62; }
        .course-g04-l03-ts-007-native-symbol--D { color: #0b687e; }

        .course-g04-l03-ts-007-native-tick {
          border-top: 3px solid #173f80;
          position: relative;
          width: 100%;
        }

        .course-g04-l03-ts-007-native-tick::before {
          background: #173f80;
          content: "";
          height: 11px;
          left: calc(50% - 1.5px);
          position: absolute;
          top: -7px;
          width: 3px;
        }

        .course-g04-l03-ts-007-native-value {
          font-size: 15px;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
        }

        .course-g04-l03-ts-007-stage-walkthrough
        .course-g04-l03-ts-007-native-value,
        .course-g04-l03-ts-007-stage-quiz
        .course-g04-l03-ts-007-native-value {
          font-size: 18px;
        }

        .course-g04-l03-ts-007-help-copy {
          font-size: 16px;
          line-height: 1.35;
          text-align: left;
        }

        .course-g04-l03-ts-007-help-number-line {
          background: #fff;
          border: 1px solid #8aa8c7;
          border-radius: 10px;
          box-sizing: border-box;
          min-width: 0;
          padding: 10px 12px;
        }

        .course-g04-l03-ts-007-help-number-line figcaption {
          color: #163f82;
          font-size: 1rem;
          font-weight: 700;
        }

        .course-g04-l03-ts-007-help-polarities {
          display: grid;
          font-size: 1rem;
          font-weight: 700;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 8px;
        }

        .course-g04-l03-ts-007-help-polarities span:first-child {
          color: #9a2432;
        }

        .course-g04-l03-ts-007-help-polarities span:last-child {
          color: #125d42;
        }

        .course-g04-l03-ts-007-help-number-line ol {
          display: grid;
          grid-template-columns: repeat(21, minmax(0, 1fr));
          list-style: none;
          margin: 12px 0 0;
          padding: 0;
        }

        .course-g04-l03-ts-007-help-number-line li {
          display: grid;
          grid-template-rows: 12px 20px;
          justify-items: center;
          min-width: 0;
        }

        .course-g04-l03-ts-007-help-tick {
          border-top: 2px solid #173f80;
          position: relative;
          width: 100%;
        }

        .course-g04-l03-ts-007-help-tick::before {
          background: #173f80;
          content: "";
          height: 10px;
          left: calc(50% - 1px);
          position: absolute;
          top: -6px;
          width: 2px;
        }

        .course-g04-l03-ts-007-help-value {
          font-size: 1rem;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          white-space: nowrap;
        }

        .course-g04-l03-ts-007-help-number-line
        li[data-help-example="true"] .course-g04-l03-ts-007-help-value {
          color: #a3261c;
          font-weight: 900;
        }

        .course-g04-l03-ts-007-help-number-line--compact
        .course-g04-l03-ts-007-help-polarities {
          font-size: 1rem;
        }

        .lesson-shell2__learning-column:has(
          .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
        ) > .lesson-shell2__legacy-stage {
          display: none;
        }

        .lesson-shell2__learning-column:has(
          .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
        ) > .lesson-shell2__page-interaction-companion {
          grid-row: 2;
        }

        .lesson-shell2__learning-column:has(
          .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
        ) > .lesson-shell2__modern-toolbar {
          grid-row: 3;
        }

        @media ${interactionEnabled ? "all" : RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-ts-007-stage-surface {
            display: none;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview,
          .course-g04-l03-ts-007-responsive-feedback-preview {
            display: block;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-number-line {
            padding: 4px 2px;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-number-line figcaption {
            font-size: 16px;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-number-line ol {
            margin-top: 4px;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-number-line li {
            grid-template-rows: 25px 8px 20px;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-symbol {
            font-size: 19px;
          }

          .course-g04-l03-ts-007-responsive-number-line-preview
          .course-g04-l03-ts-007-native-value {
            font-size: 16px;
          }

          .course-g04-l03-ts-007-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 5;
          }

          .course-g04-l03-ts-007-mobile-controls {
            background: #e9f7ff;
            border: 2px solid #224b8e;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            display: grid;
            font-family: system-ui, sans-serif;
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-ts-007-mobile-controls--fallback {
            inset: 3%;
            max-height: 94%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
          }

          .course-g04-l03-ts-007-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-walkthrough-copy {
            background: #fff;
            border: 1px solid #8aa8c7;
            border-radius: 10px;
            font-size: max(18px, 1.125rem);
            line-height: 1.6;
            padding: 10px;
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-number-line {
            overflow-x: auto;
            overscroll-behavior-x: contain;
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-number-line ol {
            min-width: max(100%, 16.5rem);
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-number-line li {
            grid-template-rows: minmax(1.5625rem, auto) 0.5rem minmax(1.25rem, auto);
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-number-line figcaption,
          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-value {
            font-size: max(16px, 1rem);
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-symbol {
            font-size: max(19px, 1.1875rem);
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-mobile-walkthrough-continue {
            font-size: max(18px, 1.125rem);
            min-height: 44px;
          }

          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-quiz-strategy {
            background: #fff;
            border: 1px solid #8aa8c7;
            border-radius: 10px;
            font-size: max(18px, 1.125rem);
            padding: 10px;
          }

          .course-g04-l03-ts-007-modern-label {
            display: grid;
            font-size: 13px;
            gap: 2px;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-007-modern-label strong {
            color: #163f82;
          }

          .course-g04-l03-ts-007-loading,
          .course-g04-l03-ts-007-question,
          .course-g04-l03-ts-007-mobile-controls > p {
            font-size: max(16px, 1rem);
            line-height: 1.3;
            margin: 0;
            text-align: center;
          }

          .course-g04-l03-ts-007-mobile-controls
          > .course-g04-l03-ts-007-question {
            font-size: max(20px, 1.25rem);
          }

          .course-g04-l03-ts-007-mobile-choices,
          .course-g04-l03-ts-007-mobile-glossary {
            display: grid;
            gap: 9px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .course-g04-l03-ts-007-mobile-glossary {
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
            overflow-wrap: anywhere;
          }

          .course-g04-l03-ts-007-mobile-controls button {
            background: linear-gradient(#fff36b, #48cbd2);
            border: 2px solid #173f80;
            border-radius: 12px;
            box-sizing: border-box;
            color: #111;
            cursor: pointer;
            font-size: max(16px, 1rem);
            font-weight: 800;
            min-height: 48px;
            min-width: 48px;
            padding: 8px 10px;
          }

          .course-g04-l03-ts-007-mobile-choices button {
            display: grid;
            gap: 2px;
          }

          .course-g04-l03-ts-007-mobile-choices button span {
            font-size: max(13px, 0.8125rem);
            font-weight: 600;
          }

          .course-g04-l03-ts-007-mobile-controls
          button:focus-visible,
          .course-g04-l03-ts-007-mobile-controls
          .course-g04-l03-ts-007-native-number-line:focus-visible,
          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-number-line:focus-visible,
          .course-g04-l03-ts-007-mobile-controls
          [tabindex="-1"]:focus-visible {
            box-shadow: 0 0 0 3px #ffdf00;
            outline: 3px solid #001d6d;
            outline-offset: 2px;
          }

          .course-g04-l03-ts-007-mobile-controls button:disabled {
            cursor: default;
            opacity: .56;
          }

          .course-g04-l03-ts-007-mobile-feedback,
          .course-g04-l03-ts-007-mobile-dialog,
          .course-g04-l03-ts-007-mobile-complete {
            background: #fffde0;
            border: 3px solid #164986;
            border-radius: 12px;
            display: grid;
            gap: 8px;
            padding: 12px;
            text-align: center;
          }

          .course-g04-l03-ts-007-mobile-feedback > *,
          .course-g04-l03-ts-007-mobile-dialog > *,
          .course-g04-l03-ts-007-mobile-complete > * {
            margin: 0;
          }

          .course-g04-l03-ts-007-mobile-feedback p {
            font-size: max(18px, 1.125rem);
            line-height: 1.6;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-copy {
            font-size: max(18px, 1.125rem);
            line-height: 1.45;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-number-line {
            overflow-x: auto;
            overscroll-behavior-x: contain;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-number-line figcaption {
            font-size: 1rem;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-polarities {
            box-sizing: border-box;
            font-size: 1rem;
            min-width: max(100%, 65.5rem);
            padding-inline: 1.25rem;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-number-line ol {
            box-sizing: border-box;
            min-width: max(100%, 65.5rem);
            padding-inline: 1.25rem;
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-number-line li {
            grid-template-rows: 0.75rem minmax(1.25rem, auto);
          }

          .course-g04-l03-ts-007-mobile-dialog
          .course-g04-l03-ts-007-help-value {
            font-size: 1rem;
          }

          .course-g04-l03-ts-007-mobile-feedback button {
            font-size: max(18px, 1.125rem);
            min-height: 44px;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .lesson-shell2[data-coarse-pointer="true"]
          .lesson-shell2__learning-column:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .lesson-shell2[data-coarse-pointer="true"]
          .lesson-shell2__learning-column:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) > .lesson-shell2__page-heading,
          .lesson-shell2[data-coarse-pointer="true"]
          .lesson-shell2__learning-column:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) > .lesson-shell2__page-interaction-companion,
          .lesson-shell2[data-coarse-pointer="true"]
          .lesson-shell2__learning-column:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) > .lesson-shell2__modern-toolbar {
            grid-column: 1 !important;
          }

          .lesson-shell2[data-coarse-pointer="true"]
          .lesson-shell2__learning-column:has(
            .course-g04-l03-ts-007-runtime:not(.course-g04-l03-ts-007-runtime--native)[data-current-js-controls-enabled="true"]
          ) > .lesson-shell2__page-interaction-companion {
            max-height: none !important;
            overflow: visible !important;
          }

          .course-g04-l03-ts-007-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }

        .lesson-shell2:has(.course-g04-l03-ts-007-runtime--native) .lesson-shell2__learning-nav[data-lesson-platform-header="true"] {background: var(--lesson-platform-bg);}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls {
          background: #eef7ff; border: 1px solid #8aa8c7; border-radius: .75rem; box-sizing: border-box;
          color: #14213d; display: grid; font-family: var(--lesson-font-body,system-ui,sans-serif);
          gap: 1rem; grid-template-columns: minmax(0,1fr); line-height: 1.6; margin: 0; min-width: 0; padding: clamp(.75rem,3vw,1.5rem); width: 100%;
        }
        .course-g04-l03-ts-007-runtime--native [data-ts007-introduction-frame] {min-inline-size: 0; max-inline-size: 100%;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls > p,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-walkthrough-copy,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-question,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-copy,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-quiz-strategy,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-feedback p {
          font-family: inherit; font-size: 1.25rem; line-height: 1.6; margin: 0; max-width: 70ch; overflow-wrap: anywhere; text-align: left;
        }
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-walkthrough-copy,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-quiz-strategy {background: #fff; border-radius: .5rem; padding: .75rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-walkthrough-copy p {margin: 0;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls button {
          background: white; border: 2px solid #365071; border-radius: .55rem; box-sizing: border-box; color: #14213d; cursor: pointer;
          font: 700 1.125rem/1.4 var(--lesson-font-body,system-ui,sans-serif); min-width: 44px; min-height: 44px; padding: .6rem .9rem;
        }
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls button:disabled {cursor: default; opacity: .6;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls :is(button,[tabindex]):focus-visible {outline: 3px solid #001d6d; outline-offset: 2px;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-choices,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-glossary {display: grid; gap: .6rem; grid-template-columns: repeat(auto-fit,minmax(min(100%,12rem),1fr));}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-choices button {display: grid; gap: .25rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-choices button span {font-size: 1rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-native-number-line {box-sizing: border-box; min-width: 0; overflow-x: auto; overscroll-behavior-x: contain; padding: .75rem; position: static; width: auto;}
        .course-g04-l03-ts-007-runtime--native :is(.course-g04-l03-ts-007-native-number-line,.course-g04-l03-ts-007-help-number-line) figcaption {font: 700 1.125rem/1.4 var(--lesson-font-body,system-ui,sans-serif); text-align: left;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-native-number-line ol {min-width: max(100%,33rem);}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-native-number-line li {grid-template-rows: minmax(2rem,auto) .75rem minmax(1.5rem,auto);}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-native-value {font-family: inherit; font-size: 1.125rem; font-variant-numeric: tabular-nums; white-space: nowrap;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-native-symbol {font-family: system-ui,sans-serif; font-size: 1.75rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-feedback,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-dialog,
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-complete {background: #fffde0; border: 2px solid #365071; border-radius: .65rem; box-sizing: border-box; display: grid; gap: 1rem; min-width: 0; padding: 1rem; position: static; scroll-margin-block-start: calc(var(--lesson-platform-header-height,0px) + 1rem); text-align: left; width: auto;}
        .course-g04-l03-ts-007-runtime--native :is(.course-g04-l03-ts-007-mobile-dialog,.course-g04-l03-ts-007-mobile-feedback,.course-g04-l03-ts-007-mobile-complete) > strong {font: 600 1.5rem/1.3 var(--lesson-font-display,var(--lesson-font-body,system-ui));}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-number-line {container-type: inline-size; font-family: var(--lesson-font-body,system-ui); min-width: 0; overflow-x: auto; overscroll-behavior-x: contain;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-number-line figcaption {position: sticky; left: 0; max-width: 100%;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-polarities {font-size: 1.125rem; min-width: max(100%,65.5rem); padding-inline: 1.25rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-polarities span {inline-size: max-content; max-inline-size: min(10rem,100cqi); justify-self: center; overflow-wrap: anywhere; white-space: normal;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-number-line ol {box-sizing: border-box; min-width: max(100%,65.5rem); padding-inline: 1.25rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-number-line li {grid-template-rows: .75rem minmax(1.5rem,auto);}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-help-value {font-family: inherit; font-size: 1.125rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-guess-locations {display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit,minmax(min(100%,10rem),1fr)); margin: 0;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-guess-locations > div {background: white; border: 1px solid #8aa8c7; border-radius: .5rem; padding: .6rem;}
        .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-guess-locations :is(dt,dd) {font: 700 1.125rem/1.5 var(--lesson-font-body,system-ui); margin: 0;}
        @media(max-width:760px) {
          .course-g04-l03-ts-007-runtime--native .course-g04-l03-ts-007-mobile-controls :is(p,.course-g04-l03-ts-007-quiz-strategy) {font-size: 1.125rem;}
          .course-g04-l03-ts-007-runtime--native :is(.course-g04-l03-ts-007-mobile-dialog,.course-g04-l03-ts-007-mobile-feedback) {padding: .5rem;}
        }
      `}</style>

      {!nativeMode ? <div
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
      </div> : null}

      {!nativeMode && interactionEnabled && (interaction.phase === "walkthrough" || interaction.phase === "quiz")
        ? <CourseG04L03Ts007ResponsiveNumberLinePreview />
        : null}

      {!nativeMode && interactionEnabled && interaction.phase === "feedback"
        ? <CourseG04L03Ts007ResponsiveFeedbackPreview interaction={interaction} />
        : null}

      {nativeMode || interactionEnabled ? (
        <>
          {!nativeMode ? <StageSurface {...sharedSurfaceProps} /> : null}
          {nativeMode ? mobileSurface : companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-ts-007-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
          <p style={visuallyHiddenStyle}>
            This is an accessibility and interaction reconstruction over
            current-JavaScript donor frames. Natural source composites at
            frames 373, 500, 617, and 679; source feedback visuals; random
            parity; audio; original-runtime parity; human review; owner
            acceptance; strict completion; and publication are not established.
          </p>
        </>
      ) : null}
    </div>
  );
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
  glossaryHostCallbacks: "safe-disabled-unresolved",
  pauseAndReducedMotionPolicy: COURSE_G04_L03_TS_007_PLAYBACK_POLICY,
  interactionAuthority: COURSE_G04_L03_TS_007_INTERACTION_AUTHORITY,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const getCourseG04L03Ts007FrameState = candidate.getFrameState;

export default Object.freeze({
  ...candidate.module,
  interactionCompletion: COURSE_G04_L03_TS_007_INTERACTION_COMPLETION,
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Ts007Renderer,
});
