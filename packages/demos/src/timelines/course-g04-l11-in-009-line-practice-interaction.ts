import {COURSE_G04_L11_IN_009_ROWS} from
  "../source-static/g4-l11/course-g04-l11-in-009-static";
import {getCourseG04L11In009CandidateCanvasFrame} from
  "./course-g04-l11-in-009";

export const COURSE_G04_L11_IN_009_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-009",
  sourceSwfSha256:
    "37ac27c9373b85c47842feba978057a17680140bdadb57d596a810628447c8c3",
  sourceTimelineId: "sprite-288",
  sourceFrameCount: 421,
  narratedBuildEndFrame: 406,
  naturalQuizStopFrame: 407,
  terminalDefinitionFrame: 421,
  equation: "x + 2 = y",
  rowCount: 5,
  sourcePlotPointControlCount: 5,
  sourceDrawLineControlCount: 1,
  sourceGlossaryControlCount: 4,
  sourceTwoStepWrongRemediation: true,
  sourceRandomCoachLabels: Object.freeze(["S1", "S2", "S3", "S4"]),
  sourceEmbeddedStreamCount: 9,
  sourceAudioAccepted: false,
  legacyCourseShellRequired: false,
  spanishSourceVisualParityEstablished: false,
});

export const COURSE_G04_L11_IN_009_TERMS = Object.freeze([
  Object.freeze({id: "column", sourceKeyAttribute: "Column", label: "column",
    prompt: "A column is a vertical group of values in a table."}),
  Object.freeze({id: "plot", sourceKeyAttribute: "Plot", label: "plot",
    prompt: "To plot a point, locate its x-value first and then its y-value."}),
  Object.freeze({id: "line", sourceKeyAttribute: "Line", label: "line",
    prompt: "A line connects the plotted points that follow the same rule."}),
  Object.freeze({id: "point", sourceKeyAttribute: "Point", label: "point",
    prompt: "A point marks one exact location on the coordinate grid."}),
] as const);

export type CourseG04L11In009TermId =
  (typeof COURSE_G04_L11_IN_009_TERMS)[number]["id"];
export type CourseG04L11In009CoachBranch = "S1" | "S2" | "S3" | "S4";
export type CourseG04L11In009FeedbackKind =
  | "correct"
  | "first-wrong"
  | "second-wrong";

export interface CourseG04L11In009RowState {
  readonly row: number;
  readonly x: number;
  readonly expectedY: number;
  readonly input: string;
  readonly tryAgain: boolean;
  readonly completed: boolean;
  readonly attemptCount: number;
}

export interface CourseG04L11In009Feedback {
  readonly kind: CourseG04L11In009FeedbackKind;
  readonly row: number;
  readonly message: string;
}

export interface CourseG04L11In009PracticeState {
  readonly frame: number;
  readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | "quiz" | "line-complete";
  readonly playing: boolean;
  readonly seed: number;
  readonly rows: readonly CourseG04L11In009RowState[];
  readonly completedCount: number;
  readonly drawLineVisible: boolean;
  readonly lineDrawn: boolean;
  readonly feedback: CourseG04L11In009Feedback | null;
  readonly popupOpen: boolean;
  readonly selectedTermId: CourseG04L11In009TermId | null;
  readonly glossaryOpen: boolean;
  readonly coachBranch: CourseG04L11In009CoachBranch | null;
  readonly wrongCoachSelectionCount: number;
  readonly interactionRevision: number;
  readonly legacyHostCallCount: 0;
  readonly sourceAudioEnabled: false;
  readonly sourceAudioAccepted: false;
}

export type CourseG04L11In009PracticeEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "set-input"; row: number; value: string}>
  | Readonly<{type: "plot-row"; row: number}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "draw-line"}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In009TermId;
    frame: number}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"; seed?: number}>;

export const COURSE_G04_L11_IN_009_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true,
  sourceCanvasSequenceRetained: true,
  frame407StaticExportTreatedAsExecutedState: false,
  animationInternalPedagogicalControlsPreserved: true,
  plotPointControlsPreserved: 5,
  drawLineControlPreserved: true,
  glossaryControlsPreserved: 4,
  twoStepWrongRemediationPreserved: true,
  as2NumberCompatibilityModeled: true,
  sourceRandomCoachReplacedByDeterministicSeedForCapture: true,
  legacyCourseShellNavigationIncluded: false,
  legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false,
  legacyDoHyperLinksExecuted: false,
  sourceAudioEnabled: false,
  sourceAudioAccepted: false,
  spanishSourceVisualParityEstablished: false,
  sourceDomainDeclared: false,
  registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false,
  visualFidelityEstablished: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonReleased: false,
  published: false,
  strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 421,
    `invalid IN009 local frame: ${frame}`);
  return frame;
}
function exactRow(row: number) {
  invariant(Number.isInteger(row) && row >= 1 && row <= 5,
    `invalid IN009 row: ${row}`);
  return row;
}
function normalizeSeed(seed: number) {
  invariant(Number.isFinite(seed), "IN009 seed must be finite");
  return Math.trunc(seed) >>> 0;
}
function termById(termId: string) {
  return COURSE_G04_L11_IN_009_TERMS.find((term) => term.id === termId) ?? null;
}
function initialRows(): readonly CourseG04L11In009RowState[] {
  return Object.freeze(COURSE_G04_L11_IN_009_ROWS.map(({row, x, y}) =>
    Object.freeze({row, x, expectedY: y, input: "", tryAgain: false,
      completed: false, attemptCount: 0})));
}
function freezeRows(rows: readonly CourseG04L11In009RowState[]) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}
function freezeState(state: CourseG04L11In009PracticeState) {
  invariant(Object.isFrozen(state.rows), "IN009 rows must be frozen");
  return Object.freeze(state);
}
function coachBranch(seed: number, selection: number): CourseG04L11In009CoachBranch {
  let value = (seed + Math.imul(selection + 1, 0x9e3779b9)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (["S1", "S2", "S3", "S4"] as const)[(value >>> 0) % 4];
}
function as2Number(value: string) {
  return Number(value);
}
function updateRow(
  rows: readonly CourseG04L11In009RowState[],
  rowNumber: number,
  update: (row: CourseG04L11In009RowState) => CourseG04L11In009RowState,
) {
  return freezeRows(rows.map((row) => row.row === rowNumber ? update(row) : row));
}

export function parseCourseG04L11In009As2Number(value: string) {
  invariant(typeof value === "string", "IN009 numeric input must be a string");
  return as2Number(value);
}

export function createCourseG04L11In009PracticeState(
  initialFrame = 1,
  seed = 0,
): CourseG04L11In009PracticeState {
  const requestedFrame = exactFrame(initialFrame);
  const frame = Math.min(requestedFrame, 407);
  const quiz = frame >= 407;
  return freezeState({
    frame,
    sourceCanvasFrame: getCourseG04L11In009CandidateCanvasFrame(frame),
    phase: quiz ? "quiz" : "instruction",
    playing: !quiz,
    seed: normalizeSeed(seed),
    rows: initialRows(),
    completedCount: 0,
    drawLineVisible: false,
    lineDrawn: false,
    feedback: null,
    popupOpen: false,
    selectedTermId: null,
    glossaryOpen: false,
    coachBranch: null,
    wrongCoachSelectionCount: 0,
    interactionRevision: 0,
    legacyHostCallCount: 0,
    sourceAudioEnabled: false,
    sourceAudioAccepted: false,
  });
}

export function getCourseG04L11In009SelectedTerm(
  state: CourseG04L11In009PracticeState,
) {
  return state.selectedTermId ? termById(state.selectedTermId) : null;
}

export function reduceCourseG04L11In009Practice(
  state: CourseG04L11In009PracticeState,
  event: CourseG04L11In009PracticeEvent,
): CourseG04L11In009PracticeState {
  invariant(Object.isFrozen(state), "IN009 practice state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame);
      if (!state.playing || state.glossaryOpen) return state;
      const frame = Math.min(requested, 407);
      if (frame === state.frame) return state;
      const quiz = frame >= 407;
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11In009CandidateCanvasFrame(frame),
        phase: quiz ? "quiz" : "instruction", playing: !quiz});
    }
    case "set-input": {
      const rowNumber = exactRow(event.row);
      invariant(state.phase === "quiz" && !state.popupOpen && !state.glossaryOpen,
        "IN009 input is not available");
      invariant(typeof event.value === "string" && event.value.length <= 64,
        "IN009 input must be at most 64 characters");
      const row = state.rows[rowNumber - 1];
      invariant(!row.completed, `IN009 row ${rowNumber} is complete`);
      return freezeState({...state,
        rows: updateRow(state.rows, rowNumber, (current) =>
          Object.freeze({...current, input: event.value})),
        feedback: null, coachBranch: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "plot-row": {
      const rowNumber = exactRow(event.row);
      invariant(state.phase === "quiz" && !state.popupOpen && !state.glossaryOpen,
        "IN009 Plot Point is not available");
      const current = state.rows[rowNumber - 1];
      invariant(!current.completed, `IN009 row ${rowNumber} is complete`);
      const correct = as2Number(current.input) === current.expectedY;
      if (correct) {
        const completedCount = state.completedCount + 1;
        const rows = updateRow(state.rows, rowNumber, (row) =>
          Object.freeze({...row, tryAgain: false, completed: true,
            attemptCount: row.attemptCount + 1}));
        return freezeState({...state, rows, completedCount,
          drawLineVisible: completedCount >= 5,
          feedback: Object.freeze({kind: "correct", row: rowNumber,
            message: "Correct!"}), popupOpen: false, coachBranch: null,
          interactionRevision: state.interactionRevision + 1});
      }
      if (!current.tryAgain) {
        const selection = state.wrongCoachSelectionCount;
        const rows = updateRow(state.rows, rowNumber, (row) =>
          Object.freeze({...row, input: "", tryAgain: true,
            attemptCount: row.attemptCount + 1}));
        return freezeState({...state, rows,
          feedback: Object.freeze({kind: "first-wrong", row: rowNumber,
            message: "Oops! Try again."}), popupOpen: true,
          coachBranch: coachBranch(state.seed, selection),
          wrongCoachSelectionCount: selection + 1,
          interactionRevision: state.interactionRevision + 1});
      }
      const completedCount = state.completedCount + 1;
      const rows = updateRow(state.rows, rowNumber, (row) =>
        Object.freeze({...row, input: String(row.expectedY), tryAgain: false,
          completed: true, attemptCount: row.attemptCount + 1}));
      return freezeState({...state, rows, completedCount,
        drawLineVisible: completedCount >= 5,
        feedback: Object.freeze({kind: "second-wrong", row: rowNumber,
          message: `When x = ${current.x}, y = ${current.expectedY}`}),
        popupOpen: true, coachBranch: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-feedback":
      if (!state.popupOpen) return state;
      return freezeState({...state, popupOpen: false, feedback: null,
        coachBranch: null, interactionRevision: state.interactionRevision + 1});
    case "draw-line":
      invariant(state.phase === "quiz" && state.drawLineVisible &&
        !state.lineDrawn && !state.popupOpen && !state.glossaryOpen,
      "IN009 Draw Line is not available");
      return freezeState({...state, frame: 421, sourceCanvasFrame: 421,
        phase: "line-complete", playing: false, lineDrawn: true,
        feedback: Object.freeze({kind: "correct", row: 5,
          message: "YOU GOT IT!"}), popupOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "select-term": {
      invariant(termById(event.termId), `unknown IN009 term: ${event.termId}`);
      const frame = Math.min(exactFrame(event.frame), 407);
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11In009CandidateCanvasFrame(
          frame, state.lineDrawn), playing: false, selectedTermId: event.termId,
        glossaryOpen: true, interactionRevision: state.interactionRevision + 1});
    }
    case "close-term":
      if (!state.glossaryOpen) return state;
      return freezeState({...state, selectedTermId: null, glossaryOpen: false,
        interactionRevision: state.interactionRevision + 1});
    case "resume": {
      const requested = exactFrame(event.frame);
      const frame = Math.min(requested, 407);
      const quiz = frame >= 407;
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11In009CandidateCanvasFrame(
          frame, state.lineDrawn), phase: state.lineDrawn
          ? "line-complete" : quiz ? "quiz" : "instruction",
        playing: !quiz && !state.lineDrawn,
        selectedTermId: null, glossaryOpen: false,
        interactionRevision: state.interactionRevision + 1});
    }
    case "replay":
      return createCourseG04L11In009PracticeState(1,
        event.seed === undefined ? state.seed : event.seed);
  }
}
