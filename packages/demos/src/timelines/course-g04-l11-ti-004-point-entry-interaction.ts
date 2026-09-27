import {COURSE_G04_L11_TI_004_GLOSSARY, COURSE_G04_L11_TI_004_POINTS} from
  "../source-static/g4-l11/course-g04-l11-ti-004-static";
import {getCourseG04L11Ti004CandidateCanvasFrame} from "./course-g04-l11-ti-004";

export const COURSE_G04_L11_TI_004_INTERACTION_SOURCE = Object.freeze({
  animationId: "course-g04-l11-ti-004",
  sourceSwfSha256:
    "84b1c705d5f6799b09ceb295f52219c9d2bf7c39cfbe88ca6330be8fa5dd0511",
  sourceFlaSha256:
    "f093747b59dbc2f2c095e00f8ebd883899a4a4c7c448058a6773cc76369ab357",
  sourceTimelineId: "sprite-423", sourceFrameCount: 275,
  naturalQuestionStopFrame: 274, modernInteractionBackgroundFrame: 273,
  prompt:
    "Click a point on the coordinate grid, then click the text boxes, type the coordinates, and click the Done button. When you get the correct answer, click the Clear button to try another point.",
  sourcePointCount: 5, sourceCoordinateInputCount: 10,
  sourceGlossaryVocabularyCount: 12, sourceHelpControlCount: 1,
  sourceEmbeddedStreamCount: 12, sourceAudioAccepted: false,
  sourceClearFieldResetEstablished: false, modernBoundedSelectedRowResetApplied: true,
  legacyCourseShellRequired: false, spanishSourceVisualParityEstablished: false,
});

export type CourseG04L11Ti004PointId =
  (typeof COURSE_G04_L11_TI_004_POINTS)[number]["id"];
export type CourseG04L11Ti004GlossaryId =
  (typeof COURSE_G04_L11_TI_004_GLOSSARY)[number]["id"];
export type CourseG04L11Ti004AnswerOrigin =
  "learner-correct" | "source-second-attempt-reveal";
type WorkingPhase = "selecting" | "answering" | "clearable" | "revealed";
export interface CourseG04L11Ti004PointEntryState {
  readonly frame: number; readonly sourceCanvasFrame: number;
  readonly phase: "instruction" | WorkingPhase | "wrong-feedback" |
    "correct-feedback" | "help" | "glossary";
  readonly resumePhase: WorkingPhase | null; readonly playing: boolean;
  readonly selectedPointId: CourseG04L11Ti004PointId | null;
  readonly visiblePointIds: readonly CourseG04L11Ti004PointId[];
  readonly fields: Readonly<Record<CourseG04L11Ti004PointId,
    Readonly<{x: string; y: string}>>>;
  readonly wrongAttemptCountByPoint: Readonly<Record<CourseG04L11Ti004PointId, number>>;
  readonly answerOrigin: CourseG04L11Ti004AnswerOrigin | null;
  readonly feedbackMessage: string | null;
  readonly selectedGlossaryId: CourseG04L11Ti004GlossaryId | null;
  readonly sourceClearFieldResetEstablished: false;
  readonly modernBoundedSelectedRowResetApplied: true;
  readonly interactionRevision: number; readonly legacyHostCallCount: 0;
  readonly sourceAudioEnabled: false; readonly sourceAudioAccepted: false;
}
export type CourseG04L11Ti004PointEntryEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-point"; pointId: CourseG04L11Ti004PointId}>
  | Readonly<{type: "set-field"; axis: "x" | "y"; value: string}>
  | Readonly<{type: "submit-answer"}>
  | Readonly<{type: "close-feedback"}>
  | Readonly<{type: "clear-selected"}>
  | Readonly<{type: "open-help"}>
  | Readonly<{type: "close-help"}>
  | Readonly<{type: "open-glossary"; glossaryId: CourseG04L11Ti004GlossaryId}>
  | Readonly<{type: "close-glossary"}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_TI_004_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  animationInternalPedagogicalControlsPreserved: true,
  fiveSourcePointsPreserved: true, tenCoordinateInputsPreserved: true,
  doneClearHelpAndTwelveGlossaryFunctionsPreserved: true,
  firstWrongRetryAndSecondWrongRevealPreserved: true,
  sourceParseIntLooseAcceptancePreserved: false,
  canonicalIntegerInputUsedForModernSafety: true,
  sourceClearFieldResetEstablished: false,
  modernBoundedSelectedRowResetApplied: true,
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
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 275,
    `invalid TI004 local frame: ${frame}`);
  return frame;
}
const pointById = (id: string) =>
  COURSE_G04_L11_TI_004_POINTS.find((point) => point.id === id) ?? null;
const glossaryById = (id: string) =>
  COURSE_G04_L11_TI_004_GLOSSARY.find((term) => term.id === id) ?? null;
const pointIds = () => COURSE_G04_L11_TI_004_POINTS.map((point) => point.id);
const emptyFields = () => Object.fromEntries(pointIds().map((id) =>
  [id, Object.freeze({x: "", y: ""})])) as Record<CourseG04L11Ti004PointId,
    Readonly<{x: string; y: string}>>;
const emptyAttempts = () => Object.fromEntries(pointIds().map((id) =>
  [id, 0])) as Record<CourseG04L11Ti004PointId, number>;
function exactFieldValue(value: string) {
  invariant(value === "" || (/^\d{1,2}$/u.test(value) && Number(value) <= 10),
    `invalid TI004 coordinate field value: ${value}`);
  return value;
}
function canonicalCoordinate(value: string) {
  return /^(?:0|[1-9]|10)$/u.test(value) ? Number(value) : null;
}
function freezeState(state: CourseG04L11Ti004PointEntryState):
CourseG04L11Ti004PointEntryState {
  const fields = Object.freeze(Object.fromEntries(Object.entries(state.fields).map(
    ([id, value]) => [id, Object.freeze({...value})]))) as
    CourseG04L11Ti004PointEntryState["fields"];
  return Object.freeze({...state, visiblePointIds: Object.freeze([...state.visiblePointIds]),
    fields, wrongAttemptCountByPoint: Object.freeze({...state.wrongAttemptCountByPoint})});
}
function workingPhase(state: CourseG04L11Ti004PointEntryState): WorkingPhase {
  invariant(state.phase === "selecting" || state.phase === "answering" ||
    state.phase === "clearable" || state.phase === "revealed",
  "TI004 working controls are not available");
  return state.phase;
}

export function createCourseG04L11Ti004PointEntryState(initialFrame = 1):
CourseG04L11Ti004PointEntryState {
  const requested = exactFrame(initialFrame); const frame = Math.min(requested, 274);
  return freezeState({frame,
    sourceCanvasFrame: getCourseG04L11Ti004CandidateCanvasFrame(Math.min(frame, 273)),
    phase: frame >= 274 ? "selecting" : "instruction", resumePhase: null,
    playing: frame < 274, selectedPointId: null, visiblePointIds: pointIds(),
    fields: emptyFields(), wrongAttemptCountByPoint: emptyAttempts(),
    answerOrigin: null, feedbackMessage: null, selectedGlossaryId: null,
    sourceClearFieldResetEstablished: false,
    modernBoundedSelectedRowResetApplied: true, interactionRevision: 0,
    legacyHostCallCount: 0, sourceAudioEnabled: false, sourceAudioAccepted: false});
}

export function getCourseG04L11Ti004SelectedGlossary(
  state: CourseG04L11Ti004PointEntryState) {
  return state.selectedGlossaryId ? glossaryById(state.selectedGlossaryId) : null;
}

export function reduceCourseG04L11Ti004PointEntry(
  state: CourseG04L11Ti004PointEntryState,
  event: CourseG04L11Ti004PointEntryEvent): CourseG04L11Ti004PointEntryState {
  invariant(Object.isFrozen(state) && Object.isFrozen(state.visiblePointIds) &&
    Object.isFrozen(state.fields) && Object.isFrozen(state.wrongAttemptCountByPoint),
  "TI004 state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const requested = exactFrame(event.frame); const frame = Math.min(requested, 274);
      const modal = state.phase === "wrong-feedback" || state.phase ===
        "correct-feedback" || state.phase === "help" || state.phase === "glossary";
      return freezeState({...state, frame,
        sourceCanvasFrame: getCourseG04L11Ti004CandidateCanvasFrame(Math.min(frame, 273)),
        phase: modal ? state.phase : frame >= 274 ? state.selectedPointId ? state.phase :
          "selecting" : "instruction", playing: frame < 274 && !modal});
    }
    case "select-point": {
      invariant(state.phase === "selecting" && state.selectedPointId === null,
        "TI004 point selection is not available");
      invariant(pointById(event.pointId), `unknown TI004 point: ${event.pointId}`);
      return freezeState({...state, phase: "answering", selectedPointId: event.pointId,
        visiblePointIds: [event.pointId], answerOrigin: null, feedbackMessage: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "set-field": {
      invariant(state.phase === "answering" && state.selectedPointId,
        "TI004 coordinate entry is not available");
      const value = exactFieldValue(event.value); const id = state.selectedPointId;
      return freezeState({...state, fields: {...state.fields,
        [id]: {...state.fields[id], [event.axis]: value}},
      interactionRevision: state.interactionRevision + 1});
    }
    case "submit-answer": {
      invariant(state.phase === "answering" && state.selectedPointId,
        "TI004 Done is not available");
      const id = state.selectedPointId; const point = pointById(id);
      invariant(point, `unknown TI004 selected point: ${id}`);
      const entry = state.fields[id]; const x = canonicalCoordinate(entry.x);
      const y = canonicalCoordinate(entry.y);
      invariant(x !== null && y !== null, "TI004 Done requires two canonical integers");
      if (x === point.x && y === point.y) {
        return freezeState({...state, phase: "correct-feedback",
          answerOrigin: "learner-correct", feedbackMessage:
            `Correct! Point ${id} is (${point.x},${point.y}).`,
          wrongAttemptCountByPoint: {...state.wrongAttemptCountByPoint, [id]: 0},
          interactionRevision: state.interactionRevision + 1});
      }
      const attempts = state.wrongAttemptCountByPoint[id] + 1;
      if (attempts === 1) return freezeState({...state, phase: "wrong-feedback",
        wrongAttemptCountByPoint: {...state.wrongAttemptCountByPoint, [id]: attempts},
        feedbackMessage:
          "The first number is the x-coordinate. The second number is the y-coordinate. Try again!",
        interactionRevision: state.interactionRevision + 1});
      return freezeState({...state, phase: "revealed",
        fields: {...state.fields, [id]: {x: String(point.x), y: String(point.y)}},
        wrongAttemptCountByPoint: {...state.wrongAttemptCountByPoint, [id]: 0},
        answerOrigin: "source-second-attempt-reveal",
        feedbackMessage: `Point ${id} is (${point.x},${point.y}).`,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-feedback": {
      invariant(state.phase === "wrong-feedback" || state.phase === "correct-feedback",
        "TI004 feedback is not open");
      return freezeState({...state,
        phase: state.phase === "correct-feedback" ? "clearable" : "answering",
        feedbackMessage: state.phase === "correct-feedback" ? state.feedbackMessage : null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "clear-selected": {
      invariant((state.phase === "clearable" || state.phase === "revealed") &&
        state.selectedPointId, "TI004 Clear is not available");
      const id = state.selectedPointId;
      return freezeState({...state, phase: "selecting", selectedPointId: null,
        visiblePointIds: pointIds(), fields: {...state.fields, [id]: {x: "", y: ""}},
        wrongAttemptCountByPoint: {...state.wrongAttemptCountByPoint, [id]: 0},
        answerOrigin: null, feedbackMessage: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-help": {
      const resumePhase = workingPhase(state);
      return freezeState({...state, phase: "help", resumePhase,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-help": {
      invariant(state.phase === "help" && state.resumePhase,
        "TI004 help is not open");
      return freezeState({...state, phase: state.resumePhase, resumePhase: null,
        interactionRevision: state.interactionRevision + 1});
    }
    case "open-glossary": {
      const resumePhase = workingPhase(state);
      invariant(glossaryById(event.glossaryId),
        `unknown TI004 glossary term: ${event.glossaryId}`);
      return freezeState({...state, phase: "glossary", resumePhase,
        selectedGlossaryId: event.glossaryId,
        interactionRevision: state.interactionRevision + 1});
    }
    case "close-glossary": {
      invariant(state.phase === "glossary" && state.resumePhase &&
        state.selectedGlossaryId, "TI004 glossary is not open");
      return freezeState({...state, phase: state.resumePhase, resumePhase: null,
        selectedGlossaryId: null, interactionRevision: state.interactionRevision + 1});
    }
    case "replay": return createCourseG04L11Ti004PointEntryState(1);
  }
}
