"use client";

import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {createPortal} from "react-dom";

import type {AnimationRendererProps} from "../contract";
import {fq002Ui} from '../modern-lessons/g4-l3-fq002-ui';
import {Fq002AudioControls} from "../modern-lessons/g4-l3-fq002-audio-controls";
import {FQ002_AUDIO_ASSETS} from "../modern-lessons/generated/g4-l3-fq002-audio";
import {Fq002QuizTitle, Fq002NumberLine, Fq002OptionSymbol, fq002SymbolOption} from "../modern-lessons/g4-l3-fq002-number-line";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_FQ_002_DISABLED_INTEGRATIONS,
  COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY,
  COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY,
  createCourseG04L03Fq002InteractionState,
  getCourseG04L03Fq002ReviewItem,
  reduceCourseG04L03Fq002Interaction,
  type CourseG04L03Fq002InteractionAction,
  type CourseG04L03Fq002InteractionState,
  type CourseG04L03Fq002OptionId,
  type CourseG04L03Fq002OptionNumber,
  type CourseG04L03Fq002Question,
  type CourseG04L03Fq002ReviewItem,
} from "../timelines/course-g04-l03-fq-002-quiz-interaction";
import {
  COURSE_G04_L03_FQ_002_CONFIG,
  COURSE_G04_L03_FQ_002_SOURCE,
} from "../timelines/course-g04-l03-fq-002";
import {
  COURSE_G04_L03_TS_007_CHOICES,
  COURSE_G04_L03_TS_007_QUESTION,
  type CourseG04L03Ts007Choice,
} from "../timelines/course-g04-l03-ts-007-practice-question-interaction";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_FQ_002_CONFIG,
);

const SOURCE_DOMAIN = "sprite-899";
const SOURCE_SCENARIO = "source-static-frame";
const FUNCTIONAL_ENTRY_FRAME = 1;
const RESULTS_DONOR_FRAME = 43;
const RESPONSIVE_CONTROLS_MEDIA =
  "(max-width: 640px), (any-pointer: coarse)";
const SOURCE_FONT =
  '"Bauhaus Md BT", "Arial Rounded MT Bold", "Trebuchet MS", ui-rounded, sans-serif';

/**
 * Owner-directed current-JavaScript cross-placement. The requested visual is
 * authored in TS007, not in the Final Quiz source SWF. Reusing the source-bound
 * prompt/answer identity at FQ Q8 keeps grading and question counts unchanged,
 * while these explicit fields prevent the presentation from being mistaken for
 * Final Quiz Flash fidelity or a strict-acceptance result.
 */
export const COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT = Object.freeze({
  finalQuizQuestionId: 8,
  sourceAnimationId: "course-g04-l03-ts-007",
  sourceSectionCode: "TS",
  placement: "owner-directed-current-javascript-cross-placement",
  finalQuizSourceVisualParityEffect: "none",
  strictAcceptanceEffect: "none",
});

type SourceCanvasStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error"
  | "blocked";

interface SourceCanvasSnapshot {
  readonly element: HTMLCanvasElement;
  readonly frame: number;
}

function isTs007CrossPlacementQuestion(
  question: CourseG04L03Fq002Question | null | undefined,
  questionCount: number,
) {
  return questionCount === 25 && question?.id
    === COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.finalQuizQuestionId;
}

function presentedQuestionText(
  question: CourseG04L03Fq002Question,
  ts007CrossPlacement: boolean,
) {
  return ts007CrossPlacement
    ? COURSE_G04_L03_TS_007_QUESTION.prompt
    : question.questionText;
}

function ts007ChoiceForId(optionId: CourseG04L03Fq002OptionId) {
  return COURSE_G04_L03_TS_007_CHOICES.find(({id}) => id === optionId);
}

function Ts007Symbol({choice}: {
  readonly choice: CourseG04L03Ts007Choice;
}) {
  const common = {
    "aria-hidden": true,
    className: "course-g04-l03-fq-002-ts007-choice-symbol",
    focusable: "false",
    viewBox: "0 0 56 44",
  } as const;

  if (choice.id === "A") {
    return <svg {...common}><circle cx="28" cy="22" fill="#8fce4f" r="15" stroke="#4f8b2d" strokeWidth="2" /></svg>;
  }
  if (choice.id === "B") {
    return <svg {...common}><path d="M28 38C19 31 9 25 9 15c0-7 5-11 11-11 4 0 7 2 8 5 2-3 5-5 9-5 6 0 11 4 11 11 0 10-10 16-20 23Z" fill="#ef684c" stroke="#b83d2a" strokeWidth="2" /></svg>;
  }
  if (choice.id === "C") {
    return <svg {...common}><rect fill="#ef65bd" height="29" rx="2" stroke="#a72b7e" strokeWidth="2" width="29" x="13.5" y="7.5" /></svg>;
  }
  return <svg {...common}><path d="m28 6 18 32H10L28 6Z" fill="#43c9df" stroke="#16849b" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function Ts007CrossPlacementNumberLine() {
  const xForValue = (value: number) => 64 + (value + 5) * 39.2;
  const choicesByLocation = new Map<number, CourseG04L03Ts007Choice>(
    COURSE_G04_L03_TS_007_CHOICES.map((choice) => [
      choice.numberLineLocation,
      choice,
    ]),
  );

  return (
    <svg
      aria-label="Number line from negative five to five. A green circle is at negative four, an orange-red heart is at negative two, a pink square is at two, and a cyan triangle is at four."
      className="course-g04-l03-fq-002-ts007-number-line"
      data-final-quiz-source-visual-parity-effect="none"
      data-owner-directed-question-source={
        COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
      }
      data-presentation-kind="semantic-current-javascript-vector-reconstruction"
      data-scoring-source-question-id={
        COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.finalQuizQuestionId
      }
      role="img"
      viewBox="0 0 520 132"
    >
      <path
        className="course-g04-l03-fq-002-ts007-axis"
        d="M26 73H494M26 73l12-10M26 73l12 10M494 73l-12-10M494 73l-12 10"
      />
      {Array.from({length: 11}, (_, index) => index - 5).map((value) => {
        const x = xForValue(value);
        const choice = choicesByLocation.get(value);
        return (
          <g key={value}>
            <line className="course-g04-l03-fq-002-ts007-tick" x1={x} x2={x} y1="65" y2="81" />
            {value === -5 || value === 0 || value === 5 ? (
              <text className="course-g04-l03-fq-002-ts007-label" textAnchor="middle" x={x} y="105">{value < 0 ? `−${Math.abs(value)}` : value}</text>
            ) : null}
            {choice ? (
              <foreignObject height="44" width="56" x={x - 28} y="13">
                <Ts007Symbol choice={choice} />
              </foreignObject>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export interface FinalQuizFunctionalRendererConfig {
  readonly animationId: string;
  /** Explicit source-compatible native presentation; other consumers retain their view. */
  readonly nativeTypographySourceSwfSha256?: string;
  readonly createInteractionState: (
    seed?: number,
  ) => CourseG04L03Fq002InteractionState;
  readonly functionalEntryFrame: number;
  readonly functionalHostFrameEnd: number;
  readonly functionalScope: string;
  readonly getReviewItem: (
    state: CourseG04L03Fq002InteractionState,
  ) => CourseG04L03Fq002ReviewItem | null;
  readonly reduceInteraction: (
    state: CourseG04L03Fq002InteractionState,
    action: CourseG04L03Fq002InteractionAction,
  ) => CourseG04L03Fq002InteractionState;
  readonly resultsDonorFrame: number;
  readonly sourceCandidate: ReturnType<
    typeof createSourceStaticCanvasCandidate
  >;
  readonly sourceDomain: string;
  readonly sourceScenario: string;
  readonly resultsGradeLabel: string;
}

// Native 800×600 coordinates shared by the A–D option-symbol cells in Q7–Q12.
const SOURCE_SYMBOL_CROP = Object.freeze({
  x: 108,
  y: 256,
  width: 64,
  height: 57,
  rowStep: 49,
});

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

function sourceCanvasStatusMessage(status: SourceCanvasStatus, spanishUi = false) {
  const ui = fq002Ui(spanishUi);
  return status === "error" ? ui.loadError : status === "blocked" ? ui.blocked : ui.loading;
}

function SourceSymbolCrop({
  optionNumber,
  snapshot,
  usage,
}: {
  readonly optionNumber: CourseG04L03Fq002OptionNumber;
  readonly snapshot: SourceCanvasSnapshot | null;
  readonly usage: "choice" | "review" | "target";
}) {
  const cropRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const crop = cropRef.current;
    const context = crop?.getContext("2d");
    if (!crop || !context) return;
    context.clearRect(0, 0, crop.width, crop.height);
    if (!snapshot) return;
    context.drawImage(
      snapshot.element,
      SOURCE_SYMBOL_CROP.x,
      SOURCE_SYMBOL_CROP.y
        + (optionNumber - 1) * SOURCE_SYMBOL_CROP.rowStep,
      SOURCE_SYMBOL_CROP.width,
      SOURCE_SYMBOL_CROP.height,
      0,
      0,
      crop.width,
      crop.height,
    );
  }, [optionNumber, snapshot]);

  return (
    <canvas
      aria-hidden="true"
      className="course-g04-l03-fq-002-source-symbol-crop"
      data-source-symbol-crop={usage}
      data-source-symbol-option-number={optionNumber}
      data-source-symbol-projection-frame={snapshot?.frame}
      height={SOURCE_SYMBOL_CROP.height}
      ref={cropRef}
      width={SOURCE_SYMBOL_CROP.width}
    />
  );
}

function SourceSymbolTarget({
  nativeNumberLine = false,
  crossPlacement = false,
  question,
  snapshot,
}: {
  readonly nativeNumberLine?: boolean;
  readonly crossPlacement?: boolean;
  readonly question: CourseG04L03Fq002Question;
  readonly snapshot: SourceCanvasSnapshot | null;
}) {
  if (
    question.options[0]?.contentKind !== "source-symbol-only"
    || crossPlacement
    || nativeNumberLine
  ) return null;
  return (
    <div
      aria-label="Target symbol projected from the legacy question drawing"
      className="course-g04-l03-fq-002-source-symbol-target"
      data-source-symbol-projection="exact-source-canvas-option-pixels"
      role="img"
    >
      <span>Target shown in the source question</span>
      <SourceSymbolCrop
        optionNumber={question.correctOptionNumber}
        snapshot={snapshot}
        usage="target"
      />
    </div>
  );
}

function sourceFrameForInteraction(
  interaction: CourseG04L03Fq002InteractionState,
  resultsDonorFrame: number,
) {
  if (
    interaction.phase === "question"
    && interaction.currentQuestion !== null
  ) {
    return interaction.currentQuestion.questionFrame;
  }
  if (
    interaction.phase === "review"
    && interaction.reviewFrame !== null
  ) {
    return interaction.reviewFrame;
  }
  return resultsDonorFrame;
}

function focusTargetForInteraction(
  interaction: CourseG04L03Fq002InteractionState,
) {
  if (interaction.phase === "question") return "choice-A";
  if (interaction.phase === "results") return "review-answers";
  if (
    interaction.reviewIndex !== null
    && interaction.reviewIndex >= interaction.responses.length - 1
  ) {
    return "return-to-results";
  }
  return "review-next";
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
          `[data-fq002-focus-control="${target}"]`,
        ),
      ),
    )
    .find(
      (control) =>
        control.getClientRects().length > 0
        && !control.hasAttribute("disabled"),
    );
}

function QuestionContext({
  sourceSwfSha256,
  nativeNumberLine = false,
  spanishUi = false,
  compact = false,
  crossPlacement = false,
  question,
}: {
  readonly sourceSwfSha256?: string;
  readonly spanishUi?: boolean;
  readonly compact?: boolean;
  readonly nativeNumberLine?: boolean;
  readonly crossPlacement?: boolean;
  readonly question: CourseG04L03Fq002Question;
}) {
  if (crossPlacement) {
    return nativeNumberLine ? (
      <div className="fq002-native-ts007-number-line-scroll" role="region"
        aria-label={spanishUi ? "Recta numérica" : "Number line"} tabIndex={0}>
        <Ts007CrossPlacementNumberLine />
      </div>
    ) : <Ts007CrossPlacementNumberLine />;
  }

  if (nativeNumberLine && question.id >= 7 && question.id <= 12) {
    return <Fq002NumberLine questionId={question.id} spanishUi={spanishUi} sourceSwfSha256={sourceSwfSha256} />;
  }

  if (question.contextText.length === 0) return null;

  if (question.id >= 22) {
    const [stateHeader, temperatureHeader, ...cells] = question.contextText;
    const rows = Array.from(
      {length: Math.floor(cells.length / 2)},
      (_, index) => ({
        state: cells[index * 2] ?? "",
        temperature: cells[index * 2 + 1] ?? "",
      }),
    );
    const table = (
      <table
        lang={fq002Ui(spanishUi).language}
        aria-label={fq002Ui(spanishUi).temperatures}
        className={
          compact
            ? "course-g04-l03-fq-002-context-table course-g04-l03-fq-002-context-table--compact"
            : "course-g04-l03-fq-002-context-table"
        }
      >
        <thead lang="en">
          <tr>
            <th scope="col">{nativeNumberLine ? <span className="fq002-native-table-cell">{stateHeader}</span> : stateHeader}</th>
            <th scope="col">{nativeNumberLine ? <span className="fq002-native-table-cell">{temperatureHeader}</span> : temperatureHeader}</th>
          </tr>
        </thead>
        <tbody lang="en">
          {rows.map(({state, temperature}) => (
            <tr key={state}>
              <td>{nativeNumberLine ? <span className="fq002-native-table-cell">{state}</span> : state}</td>
              <td>{nativeNumberLine ? <span className="fq002-native-table-cell">{temperature}</span> : temperature}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    return nativeNumberLine ? (
      <div className="fq002-native-table">
        <p lang={fq002Ui(spanishUi).language} className="fq002-native-table-hint">
          {fq002Ui(spanishUi).temperatureScroll}
        </p>
        <div className="fq002-native-table-scroll" role="region"
          aria-label={fq002Ui(spanishUi).temperatureScroll}
          lang={fq002Ui(spanishUi).language} tabIndex={0}>
          {table}
        </div>
      </div>
    ) : table;
  }

  if (question.id >= 7 && question.id <= 12) {
    return (
      <p
        aria-label={`Source number-line labels: ${question.contextText.join(", ")}`}
        className="course-g04-l03-fq-002-number-line-labels"
      >
        {question.contextText.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </p>
    );
  }

  return (
    <p lang="en" className="course-g04-l03-fq-002-context-copy">
      {question.contextText.join(" · ")}
    </p>
  );
}

interface SharedSurfaceProps {
  readonly uiLanguage: "en" | "es";
  readonly sourceSwfSha256?: string;
  readonly audioRuntime?: AnimationRendererProps;
  readonly nativeNumberLine: boolean;
  readonly answerTransitionLocked: boolean;
  readonly canvasStatus: SourceCanvasStatus;
  readonly controlsReady: boolean;
  readonly interaction: CourseG04L03Fq002InteractionState;
  readonly onAnswer: (
    optionId: CourseG04L03Fq002OptionId,
    questionId: number,
    sequenceNumber: number,
  ) => void;
  readonly onReplay: () => void;
  readonly onReviewNext: () => void;
  readonly onReviewPrevious: () => void;
  readonly onStartReview: () => void;
  readonly onReturnToResults: () => void;
  readonly paused: boolean;
  readonly reducedMotion: boolean;
  readonly resultsGradeLabel: string;
  readonly reviewItem: CourseG04L03Fq002ReviewItem | null;
  readonly sourceCanvasSnapshot: SourceCanvasSnapshot | null;
}

interface MobileSurfaceProps extends SharedSurfaceProps {
  readonly animationId: string;
  readonly placement: "fallback" | "portal";
}

function BoundQuestionChoices({
  nativeNumberLine = false,
  spanishUi = false,
  answerTransitionLocked,
  controlsReady,
  crossPlacement = false,
  interaction,
  onAnswer,
  paused,
  question,
  sourceCanvasSnapshot,
}: {
  readonly nativeNumberLine?: boolean;
  readonly spanishUi?: boolean;
  readonly answerTransitionLocked: boolean;
  readonly controlsReady: boolean;
  readonly crossPlacement?: boolean;
  readonly interaction: CourseG04L03Fq002InteractionState;
  readonly onAnswer: SharedSurfaceProps["onAnswer"];
  readonly paused: boolean;
  readonly question: CourseG04L03Fq002Question;
  readonly sourceCanvasSnapshot: SourceCanvasSnapshot | null;
}) {
  const sequenceNumber = interaction.sequenceNumber;
  const ts007CrossPlacement = crossPlacement;
  return (
    <div
      aria-label={fq002Ui(spanishUi).choices}
      className="course-g04-l03-fq-002-choices"
      role="group"
    >
      {question.options.map((option) => {
        const ts007Choice = ts007CrossPlacement
          ? ts007ChoiceForId(option.id)
          : undefined;
        const nativeOption = nativeNumberLine ? fq002SymbolOption(question.id, option.id) : undefined;
        const presentedLabel = ts007Choice?.symbol ?? nativeOption?.name ?? option.label;
        return (
        <button
          lang={nativeNumberLine ? "en" : undefined}
          aria-label={`${option.id}. ${presentedLabel}`}
          data-fq002-focus-control={`choice-${option.id}`}
          data-owner-directed-question-source={ts007Choice
            ? COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
            : undefined}
          data-presented-visual-source={ts007Choice
            ? COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
            : undefined}
          data-source-content-kind={option.contentKind}
          data-native-symbol-name={nativeOption?.name}
          data-source-option-instance={option.sourceInstance}
          disabled={
            !controlsReady
            || answerTransitionLocked
            || paused
            || sequenceNumber === null
          }
          key={option.id}
          onClick={() => {
            if (sequenceNumber === null) return;
            onAnswer(option.id, question.id, sequenceNumber);
          }}
          type="button"
        >
          <strong>{option.id}</strong>
          {ts007Choice ? (
            <Ts007Symbol choice={ts007Choice} />
          ) : nativeOption ? (
            <Fq002OptionSymbol questionId={question.id} optionId={option.id} />
          ) : option.contentKind === "source-symbol-only" ? (
            <SourceSymbolCrop
              optionNumber={option.optionNumber}
              snapshot={sourceCanvasSnapshot}
              usage="choice"
            />
          ) : null}
          <span>{presentedLabel}</span>
        </button>
        );
      })}
    </div>
  );
}

function ResultsContent({
  nativeNumberLine,
  uiLanguage,
  answerTransitionLocked,
  controlsReady,
  interaction,
  onReplay,
  onStartReview,
  paused,
  resultsGradeLabel,
}: Pick<
  SharedSurfaceProps,
  | "uiLanguage"
  | "answerTransitionLocked"
  | "controlsReady"
  | "interaction"
  | "onReplay"
  | "onStartReview"
  | "paused"
  | "resultsGradeLabel"
  | "nativeNumberLine"
>) {
  const ui = fq002Ui(nativeNumberLine && uiLanguage === 'es');
  const results = interaction.results;
  if (results === null) return null;

  return (
    <div
      aria-live="polite"
      className="course-g04-l03-fq-002-results"
      data-source-results-visual-parity-established="false"
      role="status"
    >
      {!nativeNumberLine ? <p className="course-g04-l03-fq-002-eyebrow">
        Current-JavaScript results
      </p> : null}
      <h2>{ui.complete}</h2>
      <p className="course-g04-l03-fq-002-score">
        <strong>{results.score}</strong>
        <span>{ui.score(results.total)}</span>
      </p>
      <p>
        {nativeNumberLine ? ui.performance : resultsGradeLabel}: <strong>{ui.grade(results.grade)}</strong>
      </p>
      <p>{ui.wrong(results.wrong)}</p>
      <div className="course-g04-l03-fq-002-actions">
        <button
          data-fq002-focus-control="review-answers"
          disabled={!controlsReady || answerTransitionLocked || paused}
          onClick={onStartReview}
          type="button"
        >
          {ui.review}
        </button>
        <button
          data-fq002-focus-control="replay"
          disabled={!controlsReady || answerTransitionLocked || paused}
          onClick={onReplay}
          type="button"
        >
          {ui.replay}
        </button>
      </div>
    </div>
  );
}

function ReviewContent({
  nativeNumberLine,
  sourceSwfSha256,
  uiLanguage,
  answerTransitionLocked,
  controlsReady,
  interaction,
  onReplay,
  onReviewNext,
  onReviewPrevious,
  onReturnToResults,
  paused,
  reviewItem,
  sourceCanvasSnapshot,
}: Pick<
  SharedSurfaceProps,
  | "uiLanguage"
  | "nativeNumberLine"
  | "sourceSwfSha256"
  | "answerTransitionLocked"
  | "controlsReady"
  | "interaction"
  | "onReplay"
  | "onReviewNext"
  | "onReviewPrevious"
  | "onReturnToResults"
  | "paused"
  | "reviewItem"
  | "sourceCanvasSnapshot"
>) {
  const ui = fq002Ui(nativeNumberLine && uiLanguage === 'es');
  if (reviewItem === null) return null;
  const lastReview =
    reviewItem.reviewIndex >= interaction.responses.length - 1;
  const selected = reviewItem.question.options.find(
    ({id}) => id === reviewItem.response.selectedOptionId,
  );
  const correct = reviewItem.question.options.find(
    ({id}) => id === reviewItem.response.correctOptionId,
  );
  const crossPlacement = isTs007CrossPlacementQuestion(
    reviewItem.question,
    interaction.questionOrder.length,
  );
  const selectedLabel = selected
    ? (crossPlacement
        ? ts007ChoiceForId(selected.id)?.symbol ?? selected.label
        : (nativeNumberLine ? fq002SymbolOption(reviewItem.question.id, selected.id)?.name : undefined) ?? selected.label)
    : undefined;
  const correctLabel = correct
    ? (crossPlacement
        ? ts007ChoiceForId(correct.id)?.symbol ?? correct.label
        : (nativeNumberLine ? fq002SymbolOption(reviewItem.question.id, correct.id)?.name : undefined) ?? correct.label)
    : undefined;

  return (
    <div
      className="course-g04-l03-fq-002-review"
      data-source-review-frame={reviewItem.reviewFrame}
      data-source-review-visual-parity-established="false"
    >
      <p className="course-g04-l03-fq-002-eyebrow">
        {ui.reviewPosition(reviewItem.sequenceNumber, interaction.responses.length)}
      </p>
      <h2 lang={nativeNumberLine ? "en" : undefined}>{presentedQuestionText(reviewItem.question, crossPlacement)}</h2>
      <QuestionContext
        sourceSwfSha256={sourceSwfSha256}
        spanishUi={nativeNumberLine && ui.language === "es"}
        nativeNumberLine={nativeNumberLine}
        compact
        crossPlacement={crossPlacement}
        question={reviewItem.question}
      />
      <SourceSymbolTarget
        nativeNumberLine={nativeNumberLine}
        crossPlacement={crossPlacement}
        question={reviewItem.question}
        snapshot={sourceCanvasSnapshot}
      />
      <p
        className={
          reviewItem.response.correct
            ? "course-g04-l03-fq-002-review-answer course-g04-l03-fq-002-review-answer--correct"
            : "course-g04-l03-fq-002-review-answer course-g04-l03-fq-002-review-answer--wrong"
        }
      >
        {nativeNumberLine ? <strong data-fq002-review-feedback={reviewItem.response.correct ? "correct" : "incorrect"}>
          {reviewItem.response.correct ? ui.correct : ui.incorrect}
        </strong> : null}
        {ui.yourAnswer}{" "}
        <strong lang={nativeNumberLine ? "en" : undefined}>
          {selected?.id}. {selectedLabel}
        </strong>
      </p>
      {!reviewItem.response.correct ? (
        <p className="course-g04-l03-fq-002-review-correct">
          {ui.correctAnswer}{" "}
          <strong lang={nativeNumberLine ? "en" : undefined}>
            {correct?.id}. {correctLabel}
          </strong>
        </p>
      ) : null}
      <div className="course-g04-l03-fq-002-actions">
        <button
          data-fq002-focus-control="review-previous"
          disabled={
            !controlsReady
            || answerTransitionLocked
            || paused
            || reviewItem.reviewIndex === 0
          }
          onClick={onReviewPrevious}
          type="button"
        >
          {ui.previous}
        </button>
        {lastReview ? (
          <button
            data-fq002-focus-control="return-to-results"
            disabled={!controlsReady || answerTransitionLocked || paused}
            onClick={onReturnToResults}
            type="button"
          >
            {ui.results}
          </button>
        ) : (
          <button
            data-fq002-focus-control="review-next"
            disabled={!controlsReady || answerTransitionLocked || paused}
            onClick={onReviewNext}
            type="button"
          >
            {ui.next}
          </button>
        )}
        <button
          data-fq002-focus-control="replay"
          disabled={!controlsReady || answerTransitionLocked || paused}
          onClick={onReplay}
          type="button"
        >
          {ui.replay}
        </button>
      </div>
    </div>
  );
}

function StageSurface(props: SharedSurfaceProps) {
  const {
    sourceSwfSha256,
    nativeNumberLine,
    answerTransitionLocked,
    canvasStatus,
    controlsReady,
    interaction,
    onAnswer,
    paused,
    reducedMotion,
    sourceCanvasSnapshot,
  } = props;
  const question = interaction.currentQuestion;
  const ts007CrossPlacement = isTs007CrossPlacementQuestion(
    question,
    interaction.questionOrder.length,
  );

  return (
    <svg
      aria-busy={!controlsReady}
      aria-label="Current-JavaScript final quiz controls"
      className="course-g04-l03-fq-002-stage-surface"
      data-answer-transition-locked={
        answerTransitionLocked ? "true" : "false"
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-interaction-phase={interaction.phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-source-canvas-status={canvasStatus}
      role="group"
      viewBox="0 0 800 600"
    >
      <foreignObject height="600" width="800" x="0" y="0">
        <div className="course-g04-l03-fq-002-stage-layer">
          <section
            className="course-g04-l03-fq-002-stage-panel course-g04-l03-fq-002-stage-panel--wide"
            data-final-quiz-source-visual-parity-effect={
              ts007CrossPlacement ? "none" : undefined
            }
            data-owner-directed-question-source={ts007CrossPlacement
              ? COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
              : undefined}
          >
            {!controlsReady ? (
              <p
                aria-live={canvasStatus === "error" ? "assertive" : "polite"}
                className="course-g04-l03-fq-002-loading"
                role={canvasStatus === "error" ? "alert" : "status"}
              >
                {sourceCanvasStatusMessage(canvasStatus)}
              </p>
            ) : null}

            {interaction.phase === "question" && question ? (
              <>
                <p className="course-g04-l03-fq-002-eyebrow">
                  {!nativeNumberLine ? <span>Modern reconstruction</span> : null}
                  <strong>
                    Question {interaction.sequenceNumber} of{
                      " "
                    }{interaction.questionOrder.length}
                  </strong>
                </p>
                <h2>{presentedQuestionText(question, ts007CrossPlacement)}</h2>
                <QuestionContext
                  sourceSwfSha256={sourceSwfSha256}
                  nativeNumberLine={nativeNumberLine}
                  compact
                  crossPlacement={ts007CrossPlacement}
                  question={question}
                />
                <SourceSymbolTarget
                  nativeNumberLine={nativeNumberLine}
                  crossPlacement={ts007CrossPlacement}
                  question={question}
                  snapshot={sourceCanvasSnapshot}
                />
                {question.options[0]?.contentKind === "source-symbol-only"
                && !ts007CrossPlacement && !nativeNumberLine ? (
                  <p className="course-g04-l03-fq-002-source-symbol-note">
                    Target and A–D symbols are projected from the legacy canvas.
                  </p>
                ) : null}
                <BoundQuestionChoices
            nativeNumberLine={nativeNumberLine}
                  answerTransitionLocked={answerTransitionLocked}
                  controlsReady={controlsReady}
                  crossPlacement={ts007CrossPlacement}
                  interaction={interaction}
                  onAnswer={onAnswer}
                  paused={paused}
                  question={question}
                  sourceCanvasSnapshot={sourceCanvasSnapshot}
                />
              </>
            ) : null}

            {interaction.phase === "results" ? (
              <ResultsContent {...props} />
            ) : null}

            {interaction.phase === "review" ? (
              <ReviewContent {...props} />
            ) : null}
          </section>
        </div>
      </foreignObject>
    </svg>
  );
}

function ArtifactMask({phase}: {
  readonly phase: CourseG04L03Fq002InteractionState["phase"];
}) {
  return (
    <svg
      aria-hidden="true"
      className="course-g04-l03-fq-002-artifact-mask"
      data-functional-canvas-artifact-mask="Mc_Finish-QuestNo-CQ"
      data-functional-mask-phase={phase}
      data-modern-source-visual-cover="full-stage-opaque"
      focusable="false"
      viewBox="0 0 800 600"
    >
      <rect fill="#b8d8f7" height="600" width="800" x="0" y="0" />
    </svg>
  );
}

function MobileSurface({
  uiLanguage,
  sourceSwfSha256,
  audioRuntime,
  animationId,
  nativeNumberLine,
  answerTransitionLocked,
  canvasStatus,
  controlsReady,
  interaction,
  onAnswer,
  onReplay,
  onReviewNext,
  onReviewPrevious,
  onReturnToResults,
  onStartReview,
  paused,
  placement,
  reducedMotion,
  resultsGradeLabel,
  reviewItem,
  sourceCanvasSnapshot,
}: MobileSurfaceProps) {
  const ui = fq002Ui(nativeNumberLine && uiLanguage === "es");
  const question = interaction.currentQuestion;
  const ts007CrossPlacement = isTs007CrossPlacementQuestion(
    question,
    interaction.questionOrder.length,
  );
  const shared = {
    uiLanguage,
    sourceSwfSha256,
    audioRuntime,
    nativeNumberLine,
    answerTransitionLocked,
    canvasStatus,
    controlsReady,
    interaction,
    onAnswer,
    onReplay,
    onReviewNext,
    onReviewPrevious,
    onReturnToResults,
    onStartReview,
    paused,
    reducedMotion,
    resultsGradeLabel,
    reviewItem,
    sourceCanvasSnapshot,
  };

  return (
    <section
      lang={nativeNumberLine ? ui.language : undefined}
      aria-busy={!controlsReady}
      aria-label={nativeNumberLine ? ui.quiz : "Responsive current-JavaScript final quiz controls"}
      className={
        "course-g04-l03-fq-002-mobile-controls "
        + `course-g04-l03-fq-002-mobile-controls--${placement}`
      }
      data-answer-transition-locked={
        answerTransitionLocked ? "true" : "false"
      }
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-final-quiz-animation-id={animationId}
      data-fq002-native-flow={nativeNumberLine && placement === "portal" ? "true" : undefined}
      data-interaction-companion-placement={placement}
      data-interaction-companion-surface="mobile"
      data-interaction-phase={interaction.phase}
      data-final-quiz-source-visual-parity-effect={
        ts007CrossPlacement ? "none" : undefined
      }
      data-owner-directed-question-source={ts007CrossPlacement
        ? COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
        : undefined}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-source-canvas-status={canvasStatus}
    >
      {nativeNumberLine ? <Fq002QuizTitle /> : null}
      {nativeNumberLine && ui.language === "es" ? (
        <p lang="es" data-fq002-source-language-note="en">{ui.sourceLanguageNote}</p>
      ) : null}
      {!controlsReady ? (
        <p
          aria-live={canvasStatus === "error" ? "assertive" : "polite"}
          className="course-g04-l03-fq-002-loading"
          role={canvasStatus === "error" ? "alert" : "status"}
        >
          {sourceCanvasStatusMessage(canvasStatus, nativeNumberLine && ui.language === "es")}
        </p>
      ) : null}

      {interaction.phase === "question" && question ? (
        <>
          <p className="course-g04-l03-fq-002-eyebrow">
            {!nativeNumberLine ? <span>Modern reconstruction</span> : null}
            <strong>
              {ui.question(interaction.sequenceNumber ?? 1, interaction.questionOrder.length)}
            </strong>
          </p>
          <h2 lang={nativeNumberLine ? "en" : undefined}>{presentedQuestionText(question, ts007CrossPlacement)}</h2>
          <QuestionContext
            sourceSwfSha256={sourceSwfSha256}
            spanishUi={nativeNumberLine && ui.language === "es"}
            nativeNumberLine={nativeNumberLine}
            crossPlacement={ts007CrossPlacement}
            question={question}
          />
          <SourceSymbolTarget
            nativeNumberLine={nativeNumberLine}
            crossPlacement={ts007CrossPlacement}
            question={question}
            snapshot={sourceCanvasSnapshot}
          />
          {question.options[0]?.contentKind === "source-symbol-only"
          && !ts007CrossPlacement && !nativeNumberLine ? (
            <p className="course-g04-l03-fq-002-source-symbol-note">
              Target and A–D symbols are projected from the legacy canvas.
            </p>
          ) : null}
          {nativeNumberLine && audioRuntime ? <Fq002AudioControls questionId={question.id} ready={controlsReady && !answerTransitionLocked} runtime={audioRuntime} /> : null}
          <BoundQuestionChoices
            spanishUi={nativeNumberLine && uiLanguage === "es"}
            nativeNumberLine={nativeNumberLine}
            answerTransitionLocked={answerTransitionLocked}
            controlsReady={controlsReady}
            crossPlacement={ts007CrossPlacement}
            interaction={interaction}
            onAnswer={onAnswer}
            paused={paused}
            question={question}
            sourceCanvasSnapshot={sourceCanvasSnapshot}
          />
        </>
      ) : null}

      {interaction.phase === "results" ? (
        <ResultsContent {...shared} />
      ) : null}

      {interaction.phase === "review" ? (
        <ReviewContent {...shared} />
      ) : null}
    </section>
  );
}

function DisabledSourceIntegrations() {
  return (
    <div
      aria-label="Legacy final-quiz host integrations are unavailable"
      data-source-audio-enabled="false"
      data-source-get-url-enabled="false"
      data-source-host-close-report-enabled="false"
      data-source-lms-enabled="false"
      data-source-spanish-enabled="false"
      style={visuallyHiddenStyle}
    >
      {Object.entries(COURSE_G04_L03_FQ_002_DISABLED_INTEGRATIONS).map(
        ([integration]) => (
          <button disabled key={integration} type="button">
            {integration} unavailable
          </button>
        ),
      )}
    </div>
  );
}

export function createCourseG04L03FinalQuizFunctionalRenderer({
  animationId,
  nativeTypographySourceSwfSha256,
  createInteractionState,
  functionalEntryFrame,
  functionalHostFrameEnd,
  functionalScope,
  getReviewItem,
  reduceInteraction,
  resultsDonorFrame,
  resultsGradeLabel,
  sourceCandidate,
  sourceDomain,
  sourceScenario,
}: FinalQuizFunctionalRendererConfig) {
  const SourceStaticRenderer = sourceCandidate.Renderer;

  return function CourseG04L03FinalQuizFunctionalRenderer(
    props: AnimationRendererProps,
  ) {
    const [interaction, dispatch] = useReducer(
      reduceInteraction,
      props.seed,
      createInteractionState,
    );
  const [canvasStatus, setCanvasStatus] =
    useState<SourceCanvasStatus>("idle");
  const [sourceCanvasSnapshot, setSourceCanvasSnapshot] =
    useState<SourceCanvasSnapshot | null>(null);
  const [answerTransitionLocked, setAnswerTransitionLocked] = useState(false);
  const [companionTarget, setCompanionTarget] =
    useState<HTMLElement | null>(null);
  const rendererRef = useRef<HTMLDivElement>(null);
  const visualHostRef = useRef<HTMLDivElement>(null);
  const lastFocusedControlRef = useRef<string | null>(null);
  const answerTransitionLockRef = useRef(false);

  const requestedFrameDomain = props.frameDomain ?? sourceDomain;
  const deterministicEvidenceCapture =
    isDeterministicEvidenceCapture(props);
  const interactionEnabled =
    props.frame >= functionalEntryFrame
    && props.frame <= functionalHostFrameEnd
    && requestedFrameDomain === sourceDomain
    && props.scenario === sourceScenario
    && props.lang === "en"
    && !deterministicEvidenceCapture;
  const sourceVisualFrame = interactionEnabled
    ? sourceFrameForInteraction(interaction, resultsDonorFrame)
    : props.frame;
  const donorSourceVisualState = useMemo(
    () =>
      sourceCandidate.getFrameState(sourceVisualFrame, {
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
  const nativeTypographyEnabled = nativeTypographySourceSwfSha256 !== undefined
    && donorSourceVisualState.animationId === animationId
    && donorSourceVisualState.sourceSwfSha256 === nativeTypographySourceSwfSha256;
  const sourceVisualState = interactionEnabled
    ? donorSourceVisualState
    : props.state;
  const sourceCanvasRenderKey =
    `source-${animationId}-${props.replay ?? 0}-${props.seed}-${sourceVisualFrame}`;
  const reviewItem = getReviewItem(interaction);
  const sourceSymbolQuestion =
    interaction.phase === "review"
      ? reviewItem?.question ?? null
      : interaction.currentQuestion;
  const ts007CrossPlacement =
    isTs007CrossPlacementQuestion(
      sourceSymbolQuestion,
      interaction.questionOrder.length,
    );
  const sourceSymbolProjectionRequired =
    sourceSymbolQuestion?.options[0]?.contentKind === "source-symbol-only"
    && !ts007CrossPlacement;
  const sourceSymbolProjectionReady =
    !sourceSymbolProjectionRequired
    || sourceCanvasSnapshot?.frame === sourceVisualFrame;
  const controlsReady =
    interactionEnabled
    && canvasStatus === "ready"
    && sourceSymbolProjectionReady;
  const focusTarget = focusTargetForInteraction(interaction);

  const sourceCanvas = useMemo(
    () => (
      <SourceStaticRenderer
        entryStateSha256={props.entryStateSha256}
        frame={sourceVisualFrame}
        frameDomain={requestedFrameDomain}
        key={`${sourceCanvasRenderKey}-${
          interactionEnabled ? "functional" : "source"
        }`}
        lang={props.lang}
        replay={props.replay}
        requirementId={props.requirementId}
        scenario={props.scenario}
        seed={props.seed}
        state={sourceVisualState}
        traceId={props.traceId}
      />
    ),
    [
      interactionEnabled,
      props.entryStateSha256,
      props.lang,
      props.replay,
      props.requirementId,
      props.scenario,
      props.seed,
      props.traceId,
      requestedFrameDomain,
      sourceCanvasRenderKey,
      sourceVisualFrame,
      sourceVisualState,
    ],
  );

  useEffect(() => {
    dispatch({type: "replay", seed: props.seed});
    setCanvasStatus(interactionEnabled ? "loading" : "idle");
    setSourceCanvasSnapshot(null);
    answerTransitionLockRef.current = false;
    setAnswerTransitionLocked(false);
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
      setSourceCanvasSnapshot(null);
      return;
    }
    setCanvasStatus("loading");
    setSourceCanvasSnapshot(null);
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
        if (nextStatus === "ready") {
          const sourceElement = host.querySelector<HTMLCanvasElement>(
            `canvas[data-course-canvas="${animationId}"]`,
          );
          const renderedFrame = Number(
            sourceElement?.dataset.flashFrame ?? Number.NaN,
          );
          if (sourceElement && renderedFrame === sourceVisualFrame) {
            setSourceCanvasSnapshot((previous) =>
              previous?.element === sourceElement
                && previous.frame === renderedFrame
                ? previous
                : {element: sourceElement, frame: renderedFrame},
            );
          } else {
            setSourceCanvasSnapshot(null);
          }
        } else {
          setSourceCanvasSnapshot(null);
        }
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
  }, [
    animationId,
    interactionEnabled,
    sourceCanvasRenderKey,
    sourceVisualFrame,
  ]);

  useEffect(() => {
    if (!answerTransitionLocked || !controlsReady) return;
    const timeout = window.setTimeout(() => {
      answerTransitionLockRef.current = false;
      setAnswerTransitionLocked(false);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [
    answerTransitionLocked,
    controlsReady,
    interaction.phase,
    sourceVisualFrame,
  ]);

  useEffect(() => {
    if (
      !interactionEnabled
      || !controlsReady
      || answerTransitionLocked
    ) return;
    const frame = window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      const focusRoots = [rendererRef.current, companionTarget].filter(
        (root): root is HTMLElement => root !== null,
      );
      const focusAlreadyOwned = activeElement instanceof HTMLElement
        && focusRoots.some((root) => root.contains(activeElement));
      const outsideFocusMustStay = activeElement instanceof HTMLElement
        && activeElement !== document.body
        && activeElement !== document.documentElement
        && !focusAlreadyOwned;
      if (outsideFocusMustStay) return;
      findVisibleFocusTarget(
        focusRoots,
        focusTarget,
      )?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [
    answerTransitionLocked,
    companionTarget,
    controlsReady,
    focusTarget,
    interactionEnabled,
    sourceVisualFrame,
  ]);

  useEffect(() => {
    const media = window.matchMedia(RESPONSIVE_CONTROLS_MEDIA);
    const migrateFocus = () => {
      const active = document.activeElement;
      const target =
        active instanceof HTMLElement
          ? active.dataset.fq002FocusControl
            ?? lastFocusedControlRef.current
            ?? focusTarget
          : lastFocusedControlRef.current ?? focusTarget;
      window.requestAnimationFrame(() => {
        findVisibleFocusTarget(
          [rendererRef.current, companionTarget],
          target,
        )?.focus();
      });
    };
    media.addEventListener("change", migrateFocus);
    return () => media.removeEventListener("change", migrateFocus);
  }, [companionTarget, focusTarget]);

  const replay = () => {
    answerTransitionLockRef.current = false;
    setAnswerTransitionLocked(false);
    dispatch({type: "replay", seed: props.seed});
    setCanvasStatus("loading");
    setSourceCanvasSnapshot(null);
    props.onReplay?.();
  };
  const uiLanguage = (props.uiLanguage ?? props.lang) === "es" ? "es" : "en";
  const ui = fq002Ui(nativeTypographyEnabled && uiLanguage === "es");
  const sharedSurfaceProps: SharedSurfaceProps = {
    uiLanguage,
    sourceSwfSha256: nativeTypographyEnabled ? nativeTypographySourceSwfSha256 : undefined,
    audioRuntime: animationId === "course-g04-l03-fq-002" ? props : undefined,
    nativeNumberLine: nativeTypographyEnabled,
    answerTransitionLocked,
    canvasStatus,
    controlsReady,
    interaction,
    onAnswer: (optionId, questionId, sequenceNumber) => {
      if (
        answerTransitionLockRef.current
        || interaction.phase !== "question"
        || interaction.currentQuestion?.id !== questionId
        || interaction.sequenceNumber !== sequenceNumber
      ) {
        return;
      }
      answerTransitionLockRef.current = true;
      setAnswerTransitionLocked(true);
      setCanvasStatus("loading");
      setSourceCanvasSnapshot(null);
      dispatch({
        type: "answer",
        optionId,
        questionId,
        sequenceNumber,
      });
    },
    onReplay: replay,
    onReviewNext: () => dispatch({type: "review-next"}),
    onReviewPrevious: () => dispatch({type: "review-previous"}),
    onStartReview: () => dispatch({type: "start-review"}),
    onReturnToResults: () => dispatch({type: "return-to-results"}),
    paused: props.paused ?? false,
    reducedMotion: props.reducedMotion ?? false,
    resultsGradeLabel,
    reviewItem,
    sourceCanvasSnapshot,
  };
  const mobileSurface = (
    <MobileSurface
      animationId={animationId}
      {...sharedSurfaceProps}
      placement={companionTarget ? "portal" : "fallback"}
    />
  );

  return (
    <div
      data-fq002-native-flow={nativeTypographyEnabled && interactionEnabled && companionTarget !== null ? "true" : undefined}
      data-answer-transition-locked={
        answerTransitionLocked ? "true" : "false"
      }
      data-authoritative-baseline-accepted="false"
      data-behavior-parity-established="false"
      data-current-js-controls-enabled={interactionEnabled ? "true" : "false"}
      data-current-js-controls-ready={controlsReady ? "true" : "false"}
      data-current-js-functional-entry={
        `${sourceDomain}:${functionalEntryFrame}:${sourceScenario}:en`
      }
      data-current-js-functional-host-frame-window={
        `${functionalEntryFrame}-${functionalHostFrameEnd}`
      }
      data-current-js-functional-scope={functionalScope}
      data-final-quiz-animation-id={animationId}
      data-final-quiz-question-count={interaction.questionOrder.length}
      data-current-js-overlay-count={interactionEnabled ? "1" : "0"}
      data-current-js-sequence-number={interaction.sequenceNumber ?? undefined}
      data-current-js-source-visual-frame={sourceVisualFrame}
      data-final-quiz-source-visual-parity-effect={
        ts007CrossPlacement ? "none" : undefined
      }
      data-owner-directed-question-source={ts007CrossPlacement
        ? COURSE_G04_L03_FQ_TS007_CROSS_PLACEMENT.sourceAnimationId
        : undefined}
      data-deterministic-evidence-capture={
        deterministicEvidenceCapture ? "true" : "false"
      }
      data-human-visual-review-accepted="false"
      data-host-paused={props.paused ? "true" : "false"}
      data-interaction-phase={interaction.phase}
      data-natural-runtime-trace-accepted="false"
      data-owner-accepted="false"
      data-reduced-motion={props.reducedMotion ? "true" : "false"}
      data-results-grade-label={resultsGradeLabel}
      data-source-random-parity-established="false"
      data-source-symbol-projection={
        interactionEnabled
          ? ts007CrossPlacement
            ? "owner-directed-current-javascript-ts007-visual"
            : nativeTypographyEnabled
              ? "exact-source-native-option-paths"
              : "exact-source-canvas-option-pixels"
          : undefined
      }
      data-source-results-visual-parity-established="false"
      data-source-review-visual-parity-established="false"
      data-source-static-dynamic-visibility-counter-parity-established="false"
      data-strict-acceptance-effect="none"
      data-strict-migration-complete="false"
      data-lesson-published="false"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          nextTarget instanceof Node
          && !rendererRef.current?.contains(nextTarget)
          && !companionTarget?.contains(nextTarget)
        ) {
          lastFocusedControlRef.current = null;
        }
      }}
      onFocusCapture={(event) => {
        lastFocusedControlRef.current =
          event.target instanceof HTMLElement
            ? event.target.dataset.fq002FocusControl ?? null
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
        .course-g04-l03-fq-002-mobile-fallback-slot,
        .course-g04-l03-fq-002-mobile-controls {
          display: none;
        }

        .course-g04-l03-fq-002-functional-overlay {
          aspect-ratio: 4 / 3;
          inset: 0 0 auto;
          pointer-events: none;
          position: absolute;
          width: 100%;
          z-index: 4;
        }

        .course-g04-l03-fq-002-artifact-mask,
        .course-g04-l03-fq-002-stage-surface {
          height: auto;
          inset: 0;
          pointer-events: none;
          position: absolute;
          width: 100%;
        }

        .course-g04-l03-fq-002-artifact-mask {
          z-index: 1;
        }

        .course-g04-l03-fq-002-stage-surface {
          z-index: 2;
        }

        .course-g04-l03-fq-002-stage-layer {
          box-sizing: border-box;
          font-family: ${SOURCE_FONT};
          height: 600px;
          pointer-events: none;
          position: relative;
          width: 800px;
        }

        .course-g04-l03-fq-002-stage-panel {
          background: rgb(247 252 255 / 97%);
          border: 3px solid #174c91;
          border-radius: 16px;
          box-shadow: 0 7px 22px rgb(4 37 80 / 26%);
          box-sizing: border-box;
          color: #10213b;
          display: grid;
          gap: 9px;
          left: 50%;
          max-height: 548px;
          overflow: auto;
          padding: 16px;
          pointer-events: auto;
          position: absolute;
          top: 66px;
          transform: translateX(-50%);
          width: 564px;
        }

        .course-g04-l03-fq-002-stage-panel--wide {
          width: 564px;
        }

        .course-g04-l03-fq-002-eyebrow {
          align-items: center;
          color: #174c91;
          display: flex;
          font-family: system-ui, sans-serif;
          font-size: 13px;
          font-weight: 800;
          gap: 8px;
          justify-content: space-between;
          letter-spacing: .01em;
          margin: 0;
        }

        .course-g04-l03-fq-002-eyebrow span {
          background: #ffdf37;
          border-radius: 999px;
          color: #10213b;
          padding: 4px 8px;
        }

        .course-g04-l03-fq-002-stage-panel h2,
        .course-g04-l03-fq-002-mobile-controls h2 {
          font-family: ${SOURCE_FONT};
          font-size: 20px;
          line-height: 1.18;
          margin: 0;
          white-space: pre-line;
        }

        .course-g04-l03-fq-002-context-copy,
        .course-g04-l03-fq-002-source-symbol-note,
        .course-g04-l03-fq-002-loading {
          font-family: system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.25;
          margin: 0;
        }

        .course-g04-l03-fq-002-source-symbol-note {
          background: #e8f4ff;
          border-left: 4px solid #2375c9;
          padding: 6px 8px;
        }

        .course-g04-l03-fq-002-source-symbol-target {
          align-items: center;
          background: #e8f4ff;
          border: 2px solid #2375c9;
          border-radius: 10px;
          display: flex;
          font: 800 12px/1.2 system-ui, sans-serif;
          gap: 10px;
          justify-content: space-between;
          padding: 5px 8px;
        }

        .course-g04-l03-fq-002-source-symbol-crop {
          background: #b8d8f7;
          border: 1px solid #6b86a9;
          border-radius: 7px;
          box-sizing: border-box;
          display: block;
          height: 44px;
          image-rendering: auto;
          object-fit: contain;
          width: 50px;
        }

        .course-g04-l03-fq-002-source-symbol-target
        .course-g04-l03-fq-002-source-symbol-crop {
          flex: 0 0 58px;
          height: 52px;
          width: 58px;
        }

        .course-g04-l03-fq-002-number-line-labels {
          align-items: center;
          border-bottom: 3px solid #203b65;
          display: flex;
          font: 800 14px system-ui, sans-serif;
          justify-content: space-between;
          margin: 2px 4px 6px;
          padding: 0 0 5px;
        }

        .course-g04-l03-fq-002-ts007-number-line {
          background: #eef7ff;
          border: 2px solid #6b86a9;
          border-radius: 12px;
          box-sizing: border-box;
          display: block;
          height: auto;
          padding: 4px;
          width: 100%;
        }

        .course-g04-l03-fq-002-ts007-axis,
        .course-g04-l03-fq-002-ts007-tick {
          stroke: #213c66;
          stroke-linecap: round;
        }

        .course-g04-l03-fq-002-ts007-axis {
          fill: none;
          stroke-width: 4;
        }

        .course-g04-l03-fq-002-ts007-tick {
          stroke-width: 3;
        }

        .course-g04-l03-fq-002-ts007-label {
          fill: #e53b55;
          font: 800 16px/1 system-ui, sans-serif;
        }

        .course-g04-l03-fq-002-ts007-choice-symbol {
          display: block;
          grid-area: symbol;
          height: 44px;
          margin: auto;
          width: 56px;
        }

        .course-g04-l03-fq-002-context-table {
          border-collapse: collapse;
          font: 700 14px/1.15 system-ui, sans-serif;
          width: 100%;
        }

        .course-g04-l03-fq-002-context-table th,
        .course-g04-l03-fq-002-context-table td {
          border: 1px solid #6b86a9;
          padding: 4px 6px;
          text-align: left;
          white-space: pre-line;
        }

        .course-g04-l03-fq-002-context-table th {
          background: #dcecff;
        }

        .course-g04-l03-fq-002-context-table--compact {
          font-size: 12px;
        }

        .course-g04-l03-fq-002-choices {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .course-g04-l03-fq-002-choices button,
        .course-g04-l03-fq-002-actions button {
          align-items: center;
          background: linear-gradient(#fff68a, #5ed3d7);
          border: 2px solid #174c91;
          border-radius: 12px;
          box-sizing: border-box;
          color: #111b2d;
          cursor: pointer;
          display: flex;
          font-family: ${SOURCE_FONT};
          font-size: 14px;
          gap: 7px;
          justify-content: center;
          min-height: 46px;
          padding: 6px 9px;
        }

        .course-g04-l03-fq-002-choices button strong {
          align-items: center;
          background: #ffcf1d;
          border: 1px solid #b37200;
          border-radius: 50%;
          display: inline-flex;
          flex: 0 0 28px;
          height: 28px;
          justify-content: center;
        }

        .course-g04-l03-fq-002-choices button span {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .course-g04-l03-fq-002-choices
        button[data-source-content-kind="source-symbol-only"] {
          display: grid;
          grid-template-areas:
            "id symbol"
            "label label";
          grid-template-columns: 28px 50px;
          justify-content: center;
        }

        .course-g04-l03-fq-002-choices
        button[data-source-content-kind="source-symbol-only"] strong {
          grid-area: id;
        }

        .course-g04-l03-fq-002-choices
        button[data-source-content-kind="source-symbol-only"]
        .course-g04-l03-fq-002-source-symbol-crop {
          grid-area: symbol;
        }

        .course-g04-l03-fq-002-choices
        button[data-source-content-kind="source-symbol-only"] span {
          font: 800 11px/1.1 system-ui, sans-serif;
          grid-area: label;
        }

        .course-g04-l03-fq-002-choices button[data-native-symbol-name] {
          grid-template-columns: 1.75em 2.75rem;
        }
        .course-g04-l03-fq-002-choices button[data-native-symbol-name] span {
          font: inherit;
        }

        .course-g04-l03-fq-002-choices button:focus-visible,
        .course-g04-l03-fq-002-actions button:focus-visible {
          box-shadow: 0 0 0 3px #fff;
          outline: 4px solid #001c64;
          outline-offset: 2px;
        }

        .course-g04-l03-fq-002-choices button:disabled,
        .course-g04-l03-fq-002-actions button:disabled {
          cursor: default;
          opacity: .55;
        }

        .course-g04-l03-fq-002-results,
        .course-g04-l03-fq-002-review {
          display: grid;
          gap: 10px;
        }

        .course-g04-l03-fq-002-results > *,
        .course-g04-l03-fq-002-review > * {
          margin-block: 0;
        }

        .course-g04-l03-fq-002-score {
          align-items: baseline;
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .course-g04-l03-fq-002-score strong {
          color: #075fb7;
          font-size: 72px;
          line-height: .95;
        }

        .course-g04-l03-fq-002-score span {
          font: 800 20px system-ui, sans-serif;
        }

        .course-g04-l03-fq-002-review-answer,
        .course-g04-l03-fq-002-review-correct {
          border-radius: 9px;
          font: 700 14px/1.3 system-ui, sans-serif;
          padding: 8px 10px;
        }

        .course-g04-l03-fq-002-review-answer--correct {
          background: #dff8e4;
          border: 2px solid #208447;
        }

        .course-g04-l03-fq-002-review-answer--wrong {
          background: #fff0ed;
          border: 2px solid #bd3e2f;
        }

        .course-g04-l03-fq-002-review-correct {
          background: #eef8ff;
          border: 2px solid #2375c9;
        }

        .course-g04-l03-fq-002-actions {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .course-g04-l03-fq-002-review
        .course-g04-l03-fq-002-actions {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        @media ${RESPONSIVE_CONTROLS_MEDIA} {
          .course-g04-l03-fq-002-stage-surface {
            display: none;
          }

          .course-g04-l03-fq-002-mobile-fallback-slot {
            aspect-ratio: 4 / 3;
            display: block;
            inset: 0 0 auto;
            pointer-events: none;
            position: absolute;
            width: 100%;
            z-index: 5;
          }

          .course-g04-l03-fq-002-mobile-controls {
            background: #f7fcff;
            border: 2px solid #174c91;
            border-radius: 14px;
            box-sizing: border-box;
            color: #10213b;
            display: grid;
            font-family: ${SOURCE_FONT};
            gap: 10px;
            padding: 12px;
          }

          .course-g04-l03-fq-002-mobile-controls--fallback {
            left: 3%;
            max-height: 90%;
            overflow: auto;
            pointer-events: auto;
            position: absolute;
            right: 3%;
            top: 5%;
          }

          .course-g04-l03-fq-002-mobile-controls--portal {
            margin: 12px 0;
            max-width: 100%;
            pointer-events: auto;
            position: relative;
            width: 100%;
          }

          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-eyebrow {
            align-items: flex-start;
            flex-direction: column;
          }

          .course-g04-l03-fq-002-mobile-controls h2 {
            font-size: 18px;
          }

          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-choices button,
          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-actions button {
            min-height: 48px;
            min-width: 48px;
          }

          .course-g04-l03-fq-002-mobile-controls
          :is(button):focus-visible {
            box-shadow: 0 0 0 3px #ffdf37;
            outline: 3px solid #001c64;
            outline-offset: 2px;
          }

          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-review
          .course-g04-l03-fq-002-actions {
            grid-template-columns: 1fr;
          }
        }

        /* Both explicitly source-bound native members share readable text.
           Other users of this shared quiz renderer retain their own layout. */
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 1.125rem;
          line-height: 1.6;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] h2,
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] button,
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] .course-g04-l03-fq-002-context-copy {
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        /* Native quiz flow is scoped to FQ002 with an actual My Lesson portal.
           Keep the source renderer measurable for its readiness/state contract.
           Host resume/exit dialogs share this stage and must remain visible. */
        .lesson-shell2__learning-column:has(> .lesson-shell2__page-interaction-companion > [data-fq002-native-flow="true"])
        > .lesson-shell2__legacy-stage:not(:has(.lesson-shell2__resume-prompt, .lesson-shell2__exit-prompt)) {
          position: absolute !important;
          width: 800px !important;
          height: 600px !important;
          left: -100000px;
          visibility: hidden;
          pointer-events: none;
        }
        .lesson-shell2__learning-column:has(> .lesson-shell2__page-interaction-companion > [data-fq002-native-flow="true"])
        > .lesson-shell2__page-interaction-companion {
          display: block;
          grid-column: 1;
          grid-row: 2;
          min-width: 0;
          width: 100%;
        }
        [data-fq002-native-flow="true"] > .course-g04-l03-fq-002-functional-overlay {
          display: none;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] {
          --font-body: var(--lesson-font-body, 'HELP Math Nunito Sans', system-ui, sans-serif);
          background: #f7fcff;
          border: 2px solid #174c91;
          border-radius: .875rem;
          box-sizing: border-box;
          color: #10213b;
          display: grid;
          gap: 1rem;
          padding: 1rem;
          margin: .75rem 0;
          position: relative;
          pointer-events: auto;
          width: 100%;
          max-width: 100%;
          font-size: 1.25rem;
          grid-column: auto;
          grid-row: auto;
        }
        .fq002-native-quiz-title {
          margin: 0 0 .75rem;
          font-family: var(--lesson-font-display, 'HELP Math Fredoka', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif);
          font-size: 1.75rem;
          line-height: 1.3;
          font-weight: 700;
          color: #10213b;
          overflow-wrap: anywhere;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] h2 {
          max-width: 70ch;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] .course-g04-l03-fq-002-results > h2 {
          font-family: var(--lesson-font-display, 'HELP Math Fredoka', 'Arial Rounded MT Bold', 'Trebuchet MS', sans-serif);
          font-size: 1.5rem;
          line-height: 1.3;
          font-weight: 700;
        }
        [data-fq002-native-flow="true"] .fq002-native-number-line__description li {
          font-size: 1.25rem;
          line-height: 1.6;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] .course-g04-l03-fq-002-eyebrow {
          font-size: 1rem;
          line-height: 1.5;
        }
        [data-fq002-native-flow="true"] [data-audio-language] select {
          height: 2.75rem;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] button {
          font-size: 1.125rem;
          min-height: 2.75rem;
          min-width: 2.75rem;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"]
        :is(.course-g04-l03-fq-002-review-answer, .course-g04-l03-fq-002-review-correct,
            .course-g04-l03-fq-002-context-table, .course-g04-l03-fq-002-score span) {
          font: inherit;
          line-height: 1.6;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"]
        :is(.course-g04-l03-fq-002-choices, .course-g04-l03-fq-002-actions) {
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
          gap: .75rem;
        }
        [data-fq002-native-flow="true"] .fq002-native-table {
          min-inline-size: 0;
        }
        [data-fq002-native-flow="true"] [data-fq002-source-language-note] {
          font-size: 1rem;
          line-height: 1.5;
          margin: 0;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-cell {
          display: block;
          max-inline-size: 5rem;
          overflow-wrap: anywhere;
        }
        [data-fq002-native-flow="true"] .fq002-native-ts007-number-line-scroll {
          max-inline-size: 100%;
          min-inline-size: 0;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
        }
        [data-fq002-native-flow="true"] .fq002-native-ts007-number-line-scroll:focus-visible {
          outline: 3px solid #001c64;
          outline-offset: 3px;
        }
        [data-fq002-native-flow="true"] .course-g04-l03-fq-002-ts007-number-line {
          min-inline-size: 32.5rem;
        }
        [data-fq002-native-flow="true"] .course-g04-l03-fq-002-ts007-label {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 1rem;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-hint {
          margin: 0 0 .5rem;
          font-size: 1.125rem;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll {
          max-inline-size: 100%;
          min-inline-size: 0;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          border-radius: .25rem;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll:focus-visible {
          outline: 3px solid #001c64;
          outline-offset: 3px;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll table {
          min-inline-size: 22rem;
          overflow-wrap: normal;
          word-break: normal;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll :is(th, td) {
          padding: .4rem .6rem;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll :is(th, td):last-child {
          text-align: right;
        }
        [data-fq002-native-flow="true"] .fq002-native-table-scroll td:last-child {
          white-space: nowrap;
        }
        [data-fq002-native-flow="true"] .course-g04-l03-fq-002-choices button {
          flex-wrap: wrap;
          gap: .5rem;
        }
        [data-fq002-native-flow="true"] .course-g04-l03-fq-002-choices button strong {
          flex: 0 0 1.6em;
          inline-size: 1.6em;
          block-size: 1.6em;
        }
        [data-fq002-native-flow="true"] .course-g04-l03-fq-002-choices button span {
          overflow-wrap: normal;
          word-break: normal;
        }
        .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] .course-g04-l03-fq-002-score strong {
          font-size: 3rem;
        }
        @media (max-width: 640px) {
          .course-g04-l03-fq-002-mobile-controls[data-fq002-native-flow="true"] {
            font-size: 1.125rem;
          }
          [data-fq002-native-flow="true"] .fq002-native-number-line__description li {
            font-size: 1.125rem;
          }
        }

        @media (max-width: 390px) {
          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-choices,
          .course-g04-l03-fq-002-mobile-controls
          .course-g04-l03-fq-002-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 1280px) and (any-pointer: coarse) {
          .course-g04-l03-fq-002-mobile-controls--portal {
            grid-column: 1 / -1;
            grid-row: 7;
          }
        }
      `}</style>

      <div
        aria-hidden={interactionEnabled ? true : undefined}
        data-source-canvas-accessibility-isolated={
          interactionEnabled ? "true" : "false"
        }
        data-source-canvas-visual-exposure={
          interactionEnabled
            ? "hidden-behind-modern-backdrop"
            : "source-only"
        }
        inert={interactionEnabled ? true : undefined}
        ref={visualHostRef}
        style={{pointerEvents: interactionEnabled ? "none" : undefined}}
      >
        {sourceCanvas}
      </div>

      {interactionEnabled ? (
        <>
          <div
            className="course-g04-l03-fq-002-functional-overlay"
            data-current-js-functional-overlay={`${animationId}-quiz`}
          >
            <ArtifactMask phase={interaction.phase} />
            <StageSurface {...sharedSurfaceProps} />
          </div>
          <DisabledSourceIntegrations />
          {companionTarget
            ? createPortal(mobileSurface, companionTarget)
            : (
                <div className="course-g04-l03-fq-002-mobile-fallback-slot">
                  {mobileSurface}
                </div>
              )}
          <p lang={ui.language} aria-live="polite" style={visuallyHiddenStyle}>
            {interaction.phase === "question"
              ? ui.question(interaction.sequenceNumber ?? 1, interaction.questionOrder.length)
              : interaction.phase === "results"
                ? `${ui.complete}. ${interaction.score} ${ui.score(interaction.results?.total ?? interaction.questionOrder.length)}.`
                : ui.reviewPosition((interaction.reviewIndex ?? 0) + 1, interaction.responses.length)}
          </p>
        </>
      ) : null}
      </div>
    );
  };
}

export const CourseG04L03Fq002Renderer =
  createCourseG04L03FinalQuizFunctionalRenderer({
    animationId: "course-g04-l03-fq-002",
    nativeTypographySourceSwfSha256: COURSE_G04_L03_FQ_002_SOURCE.swfSha256,
    createInteractionState: createCourseG04L03Fq002InteractionState,
    functionalEntryFrame: FUNCTIONAL_ENTRY_FRAME,
    functionalHostFrameEnd: FUNCTIONAL_ENTRY_FRAME,
    functionalScope: "fq002-ten-question-source-bound-final-quiz",
    getReviewItem: getCourseG04L03Fq002ReviewItem,
    reduceInteraction: reduceCourseG04L03Fq002Interaction,
    resultsDonorFrame: RESULTS_DONOR_FRAME,
    resultsGradeLabel: "Performance level",
    sourceCandidate: candidate,
    sourceDomain: SOURCE_DOMAIN,
    sourceScenario: SOURCE_SCENARIO,
  });

export {COURSE_G04_L03_FQ_002_SOURCE};
export const COURSE_G04_L03_FQ_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_FQ_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_FQ_002_SOURCE_CONTRACT = Object.freeze({
  ...candidate.sourceContract,
  currentJavascriptInteractionStatus:
    "source-script-bound-functional-final-quiz-candidate",
  currentJavascriptFunctionalEntry: Object.freeze({
    frameDomain: SOURCE_DOMAIN,
    frame: FUNCTIONAL_ENTRY_FRAME,
    scenario: SOURCE_SCENARIO,
    language: "en",
    deterministicCaptureOverlayEnabled: false,
  }),
  currentJavascriptInteractionScope: Object.freeze([
    "twenty-five-source-bound-question-and-review-pairs",
    "seeded-current-javascript-ten-of-twenty-five-without-replacement",
    "source-shape-atomic-answer-and-immediate-advance",
    "stale-and-double-answer-dispatch-rejected",
    "physical-double-click-answer-transition-lock",
    "Q7-Q12-source-bound-native-number-line-and-option-symbols",
    "source-score-bands-and-current-javascript-results",
    "current-javascript-text-review-previous-next-enhancement",
    "source-question-and-review-frame-donor-projection",
    "opaque-full-stage-modern-backdrop-hides-source-canvas-visual-layer",
    "deterministic-capture-preserves-unmodified-source-static-drawing-with-zero-overlay",
    "whole-state-replay-reset",
    "pause-disables-actions",
    "reduced-motion-static-interaction",
    "responsive-mobile-and-coarse-pointer-companion-surface",
    "wide-coarse-companion-grid-row-seven",
    "desktop-mobile-focus-migration",
    "functional-source-canvas-aria-inert-and-pointer-event-isolated",
    "controls-fail-closed-until-source-canvas-ready",
  ]),
  interactionAuthority: COURSE_G04_L03_FQ_002_INTERACTION_AUTHORITY,
  functionalMaskingPolicy:
    COURSE_G04_L03_FQ_002_FUNCTIONAL_MASKING_POLICY,
  sourceStaticDynamicVisibilityAndCounterParityEstablished: false,
  sourceQuestionSelectionParityEstablished: false,
  sourceReviewVisualParityEstablished: false,
  sourceResultsVisualParityEstablished: false,
  sourceAudioEnabled: false,
  sourceSpanishEnabled: false,
  sourceLmsAndGetUrlEnabled: false,
  sourceHostCloseReportEnabled: false,
  behaviorParityEstablished: false,
  replayParityEstablished: false,
  authoritativeOriginalRuntimeAccepted: false,
  naturalRuntimeTraceAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonPublished: false,
  strictAcceptanceEffect: "none",
});
export const COURSE_G04_L03_FQ_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Fq002Frame = candidate.normalizeFrame;
export const getCourseG04L03Fq002FrameState = candidate.getFrameState;
export const buildCourseG04L03Fq002CaptureAttributes =
  candidate.buildCaptureAttributes;

export default Object.freeze({
  ...candidate.module,
  interactiveAudioAssets: FQ002_AUDIO_ASSETS,
  interactiveAudioLanguages: ["en", "es"] as const,
  lessonHost: Object.freeze({capabilities: Object.freeze(["audio"] as const), legacyOperations: "blocked" as const, auditStorage: "memory-only" as const, storesPersonalData: false as const}),
  reducedMotionFrame: FUNCTIONAL_ENTRY_FRAME,
  Renderer: CourseG04L03Fq002Renderer,
});
