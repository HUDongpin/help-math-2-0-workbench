import {COURSE_G04_L11_TI_005_GLOSSARY, COURSE_G04_L11_TI_005_ROWS} from
  "../source-static/g4-l11/course-g04-l11-ti-005-static";
import {getCourseG04L11Ti005CandidateCanvasFrame} from "./course-g04-l11-ti-005";

export const COURSE_G04_L11_TI_005_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ti-005",
  sourceSwfSha256:
    "43c21cec5b8e67b8af70aca374aec4f2f46c43490e9a19c472798e606467362a",
  sourceFlaSha256:
    "166e659fbe37346ea7d4c2a8f437361471487f49a8fa3c4508b71455aa85c3f7",
  sourceTimelineId: "sprite-342", sourceFrameCount: 433,
  naturalQuestionStopFrame: 419, modernInteractionBackgroundFrame: 418,
  sourceEquation: "x + 3 = y", sourceRowCount: 5,
  sourcePlotPointControlCount: 5, sourceDrawLineThreshold: 5,
  sourceGlossaryVocabularyCount: 11, sourceHelpControlCount: 1,
  sourceEmbeddedStreamCount: 8, sourceAudioAccepted: false,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export type CourseG04L11Ti005RowId =
  (typeof COURSE_G04_L11_TI_005_ROWS)[number]["id"];
export type CourseG04L11Ti005GlossaryId =
  (typeof COURSE_G04_L11_TI_005_GLOSSARY)[number]["id"];
export type CourseG04L11Ti005CompletionOrigin =
  "learner-correct" | "source-second-attempt-reveal";
type WorkingPhase = "working" | "ready-line" | "line-drawn";
interface RowState {readonly input: string; readonly wrongAttempts: number;
  readonly completed: boolean; readonly completionOrigin: CourseG04L11Ti005CompletionOrigin | null;}
export interface CourseG04L11Ti005EquationPlotState {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | WorkingPhase | "feedback" | "help" | "glossary";
  readonly resumePhase: WorkingPhase | null; readonly playing: boolean;
  readonly rows: Readonly<Record<CourseG04L11Ti005RowId, Readonly<RowState>>>;
  readonly completedRowIds: readonly CourseG04L11Ti005RowId[];
  readonly feedbackKind: "retry" | "revealed" | null;
  readonly feedbackRowId: CourseG04L11Ti005RowId | null;
  readonly feedbackMessage: string | null; readonly drawLineVisible: boolean;
  readonly lineDrawn: boolean;
  readonly selectedGlossaryId: CourseG04L11Ti005GlossaryId | null;
  readonly interactionRevision: number; readonly legacyHostCallCount: 0;
  readonly sourceAudioEnabled: false; readonly sourceAudioAccepted: false;
}
export type CourseG04L11Ti005EquationPlotEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "set-row-input"; rowId: CourseG04L11Ti005RowId; value: string}>
  | Readonly<{type: "plot-row"; rowId: CourseG04L11Ti005RowId}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "draw-line"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "open-glossary"; glossaryId: CourseG04L11Ti005GlossaryId}>
  | Readonly<{type: "close-glossary"}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_TI_005_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  fiveYInputsAndFivePlotControlsPreserved: true, drawLineThresholdPreserved: 5,
  firstWrongRetryAndSecondWrongRevealPreserved: true,
  revealedRowsCountTowardFivePointThreshold: true,
  sourceNumberLooseAcceptancePreserved: false,
  canonicalIntegerInputUsedForModernSafety: true,
  helpFunctionPreserved: true, glossaryVocabularyPreserved: 11,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyPreloaderIncluded: false, duplicateOldAndModernControlsIncluded: false,
  legacyGlobalsExecuted: false, legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false, sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false, sourceDomainDeclared: false,
  registeredCurrentJavascript: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 433,
    `invalid TI005 local frame: ${frame}`); return frame;
}
const rowById = (id: string) => COURSE_G04_L11_TI_005_ROWS.find((row) =>
  row.id === id) ?? null;
const glossaryById = (id: string) => COURSE_G04_L11_TI_005_GLOSSARY.find((term) =>
  term.id === id) ?? null;
const rowIds = () => COURSE_G04_L11_TI_005_ROWS.map((row) => row.id);
const emptyRows = () => Object.fromEntries(rowIds().map((id) => [id, Object.freeze({
  input: "", wrongAttempts: 0, completed: false, completionOrigin: null,
})])) as Record<CourseG04L11Ti005RowId, Readonly<RowState>>;
function exactInput(value: string) {
  invariant(value === "" || (/^\d{1,2}$/u.test(value) && Number(value) <= 10),
    `invalid TI005 y-value: ${value}`); return value;
}
const canonicalInteger = (value: string) =>
  /^(?:0|[1-9]|10)$/u.test(value) ? Number(value) : null;
function freezeState(state: CourseG04L11Ti005EquationPlotState):
CourseG04L11Ti005EquationPlotState {
  return Object.freeze({...state,
    rows: Object.freeze(Object.fromEntries(Object.entries(state.rows).map(([id, row]) =>
      [id, Object.freeze({...row})]))) as CourseG04L11Ti005EquationPlotState["rows"],
    completedRowIds: Object.freeze([...state.completedRowIds])});
}
function workingPhase(state: CourseG04L11Ti005EquationPlotState): WorkingPhase {
  invariant(state.phase === "working" || state.phase === "ready-line" ||
    state.phase === "line-drawn", "TI005 teaching controls are not available");
  return state.phase;
}

export function createCourseG04L11Ti005EquationPlotState(initialFrame = 1):
CourseG04L11Ti005EquationPlotState {
  const requested = exactFrame(initialFrame); const frame = Math.min(requested, 433);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11Ti005CandidateCanvasFrame(Math.min(frame, 418)),
    phase: frame >= 419 ? "working" : "instruction", resumePhase: null,
    playing: frame < 419, rows: emptyRows(), completedRowIds: [],
    feedbackKind: null, feedbackRowId: null, feedbackMessage: null,
    drawLineVisible: false, lineDrawn: false, selectedGlossaryId: null,
    interactionRevision: 0, legacyHostCallCount: 0,
    sourceAudioEnabled: false, sourceAudioAccepted: false});
}

export function getCourseG04L11Ti005SelectedGlossary(
  state: CourseG04L11Ti005EquationPlotState) {
  return state.selectedGlossaryId ? glossaryById(state.selectedGlossaryId) : null;
}

export function reduceCourseG04L11Ti005EquationPlot(
  state: CourseG04L11Ti005EquationPlotState,
  event: CourseG04L11Ti005EquationPlotEvent): CourseG04L11Ti005EquationPlotState {
  invariant(Object.isFrozen(state) && Object.isFrozen(state.rows) &&
    Object.isFrozen(state.completedRowIds), "TI005 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame); const modal = state.phase === "feedback" ||
        state.phase === "help" || state.phase === "glossary";
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Ti005CandidateCanvasFrame(Math.min(frame, 418)),
        phase: modal ? state.phase : frame >= 419 ? state.completedRowIds.length === 5 ?
          state.lineDrawn ? "line-drawn" : "ready-line" : "working" : "instruction",
        playing: frame < 419 && !modal});
    }
    case "set-row-input": {
      invariant(state.phase === "working" && rowById(event.rowId) &&
        !state.rows[event.rowId].completed, "TI005 row input is not available");
      return freezeState({...state, rows: {...state.rows,
        [event.rowId]: {...state.rows[event.rowId], input: exactInput(event.value)}},
      interactionRevision: state.interactionRevision + 1});
    }
    case "plot-row": {
      invariant(state.phase === "working", "TI005 Plot Point is not available");
      const row = rowById(event.rowId); invariant(row, `unknown TI005 row: ${event.rowId}`);
      const current = state.rows[event.rowId];
      invariant(!current.completed, `TI005 ${event.rowId} is already plotted`);
      const value = canonicalInteger(current.input);
      invariant(value !== null, "TI005 Plot Point requires a canonical integer");
      if (value === row.y) {
        const completed = [...state.completedRowIds, event.rowId];
        return freezeState({...state, phase: completed.length === 5 ? "ready-line" : "working",
          rows: {...state.rows, [event.rowId]: {...current, wrongAttempts: 0,
            completed: true, completionOrigin: "learner-correct"}},
          completedRowIds: completed, drawLineVisible: completed.length === 5,
          interactionRevision: state.interactionRevision + 1});
      }
      if (current.wrongAttempts === 0) return freezeState({...state, phase: "feedback",
        rows: {...state.rows, [event.rowId]: {...current, input: "", wrongAttempts: 1}},
        feedbackKind: "retry", feedbackRowId: event.rowId,
        feedbackMessage: "Oops! Try again.",
        interactionRevision: state.interactionRevision + 1});
      const completed = [...state.completedRowIds, event.rowId];
      return freezeState({...state, phase: "feedback",
        rows: {...state.rows, [event.rowId]: {input: String(row.y), wrongAttempts: 0,
          completed: true, completionOrigin: "source-second-attempt-reveal"}},
        completedRowIds: completed, feedbackKind: "revealed", feedbackRowId: event.rowId,
        feedbackMessage: `When x = ${row.x}, y = ${row.y}`,
        drawLineVisible: completed.length === 5,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-feedback": {
      invariant(state.phase === "feedback" && state.feedbackKind && state.feedbackRowId,
        "TI005 feedback is not open");
      return freezeState({...state, phase: state.completedRowIds.length === 5 ?
        "ready-line" : "working", feedbackKind: null, feedbackRowId: null,
        feedbackMessage: null, interactionRevision: state.interactionRevision + 1});
    }
    case "draw-line": {
      invariant(state.phase === "ready-line" && state.completedRowIds.length === 5 &&
        state.drawLineVisible && !state.lineDrawn, "TI005 Draw Line is not available");
      return freezeState({...state, phase: "line-drawn", lineDrawn: true,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-help": {
      const resumePhase = workingPhase(state);
      return freezeState({...state, phase: "help", resumePhase,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-help": {
      invariant(state.phase === "help" && state.resumePhase, "TI005 help is not open");
      return freezeState({...state, phase: state.resumePhase, resumePhase: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-glossary": {
      const resumePhase = workingPhase(state);
      invariant(glossaryById(event.glossaryId),
        `unknown TI005 glossary term: ${event.glossaryId}`);
      return freezeState({...state, phase: "glossary", resumePhase,
        selectedGlossaryId: event.glossaryId,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-glossary": {
      invariant(state.phase === "glossary" && state.resumePhase &&
        state.selectedGlossaryId, "TI005 glossary is not open");
      return freezeState({...state, phase: state.resumePhase, resumePhase: null,
        selectedGlossaryId: null, interactionRevision: state.interactionRevision + 1});
    }
    case "replay": return createCourseG04L11Ti005EquationPlotState(1);
  }
}
