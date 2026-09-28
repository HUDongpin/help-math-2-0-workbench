import {COURSE_G04_L11_IN_006_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-006-static";

export type CourseG04L11In006PointLabel =
  (typeof COURSE_G04_L11_IN_006_POINTS)[number]["label"];
export type CourseG04L11In006TermId = "point" | "coordinate-grid" | "ordered-pair" |
  "number" | "x-coordinate" | "y-coordinate";
export type CourseG04L11In006Feedback = "none" | "first-wrong" | "correct" |
  "second-wrong-reveal";

export const COURSE_G04_L11_IN_006_TERMS = Object.freeze([
  Object.freeze({id: "point", sourceButtonObjectId: 8, label: "Point",
    prompt: "A point marks one exact location on the coordinate grid."}),
  Object.freeze({id: "coordinate-grid", sourceButtonObjectId: 9,
    label: "Coordinate grid",
    prompt: "A coordinate grid uses perpendicular x- and y-axes to locate points."}),
  Object.freeze({id: "ordered-pair", sourceButtonObjectId: 10, label: "Ordered pair",
    prompt: "An ordered pair names a point as (x, y), with x first and y second."}),
  Object.freeze({id: "number", sourceButtonObjectId: 60, label: "Number",
    prompt: "A number tells how far to move along an axis."}),
  Object.freeze({id: "x-coordinate", sourceButtonObjectId: 61, label: "X-coordinate",
    prompt: "The x-coordinate is the first number in an ordered pair."}),
  Object.freeze({id: "y-coordinate", sourceButtonObjectId: 79, label: "Y-coordinate",
    prompt: "The y-coordinate is the second number in an ordered pair."}),
] as const);

export type CourseG04L11In006Fields = Readonly<Record<CourseG04L11In006PointLabel,
  Readonly<{x: string; y: string}>>>;
export interface CourseG04L11In006PracticeState {
  readonly frame: number;
  readonly phase: "instruction" | "name-points-practice";
  readonly playing: boolean;
  readonly selectedPoint: CourseG04L11In006PointLabel | null;
  readonly fields: CourseG04L11In006Fields;
  readonly tryAgainPoints: readonly CourseG04L11In006PointLabel[];
  readonly feedback: CourseG04L11In006Feedback;
  readonly feedbackPoint: CourseG04L11In006PointLabel | null;
  readonly controlsEnabled: boolean;
  readonly selectedTermId: CourseG04L11In006TermId | null;
  readonly interactionRevision: number;
  readonly audioEnabled: false;
  readonly legacyHostCallCount: 0;
}
export type CourseG04L11In006PracticeEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "select-point"; label: CourseG04L11In006PointLabel}>
  | Readonly<{type: "update-field"; label: CourseG04L11In006PointLabel;
    axis: "x" | "y"; value: string}>
  | Readonly<{type: "submit"}>
  | Readonly<{type: "dismiss-feedback"}>
  | Readonly<{type: "clear"}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In006TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"}>;

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 287,
    `invalid IN006 frame: ${frame}`);
  return Math.min(frame, 275);
}
function emptyFields(): CourseG04L11In006Fields {
  return Object.freeze(Object.fromEntries(COURSE_G04_L11_IN_006_POINTS.map((point) =>
    [point.label, Object.freeze({x: "", y: ""})])) as
    Record<CourseG04L11In006PointLabel, Readonly<{x: string; y: string}>>);
}
function freeze(state: CourseG04L11In006PracticeState) {
  invariant(Object.isFrozen(state.fields) && Object.values(state.fields).every(Object.isFrozen),
    "IN006 fields must be frozen");
  invariant(Object.isFrozen(state.tryAgainPoints), "IN006 try-again set must be frozen");
  return Object.freeze(state);
}
function point(label: string) {
  return COURSE_G04_L11_IN_006_POINTS.find((candidate) => candidate.label === label) ?? null;
}
function parsed(value: string) { return Number.parseInt(value, 10); }
function withField(fields: CourseG04L11In006Fields, label: CourseG04L11In006PointLabel,
  axis: "x" | "y", value: string): CourseG04L11In006Fields {
  return Object.freeze({...fields, [label]: Object.freeze({...fields[label], [axis]: value})});
}
function withPair(fields: CourseG04L11In006Fields, label: CourseG04L11In006PointLabel,
  x: string, y: string): CourseG04L11In006Fields {
  return Object.freeze({...fields, [label]: Object.freeze({x, y})});
}
export function createCourseG04L11In006PracticeState(frame = 1):
CourseG04L11In006PracticeState {
  const local = exactFrame(frame);
  return freeze({frame: local, phase: local >= 275 ? "name-points-practice" : "instruction",
    playing: local < 275, selectedPoint: null, fields: emptyFields(),
    tryAgainPoints: Object.freeze([]), feedback: "none", feedbackPoint: null,
    controlsEnabled: true, selectedTermId: null, interactionRevision: 0,
    audioEnabled: false, legacyHostCallCount: 0});
}
export function getCourseG04L11In006Point(label: string) { return point(label); }
export function reduceCourseG04L11In006Practice(state: CourseG04L11In006PracticeState,
  event: CourseG04L11In006PracticeEvent): CourseG04L11In006PracticeState {
  invariant(Object.isFrozen(state), "IN006 practice state must be frozen");
  if (event.type === "synchronize-frame") {
    if (!state.playing || state.selectedTermId) return state;
    const frame = exactFrame(event.frame);
    return frame === state.frame ? state : freeze({...state, frame,
      phase: frame >= 275 ? "name-points-practice" : "instruction",
      playing: frame < 275});
  }
  if (event.type === "select-point") {
    invariant(state.phase === "name-points-practice", "IN006 point selection is not enabled");
    invariant(state.controlsEnabled, "IN006 controls are disabled during feedback");
    invariant(point(event.label), `unknown IN006 point: ${event.label}`);
    return freeze({...state, selectedPoint: event.label, feedback: "none",
      feedbackPoint: null, interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "update-field") {
    invariant(state.phase === "name-points-practice", "IN006 coordinate fields are not enabled");
    invariant(state.controlsEnabled, "IN006 controls are disabled during feedback");
    invariant(point(event.label), `unknown IN006 point: ${event.label}`);
    invariant(event.value.length <= 8, "IN006 coordinate field is too long");
    return freeze({...state, fields: withField(state.fields, event.label, event.axis,
      event.value), interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "submit") {
    invariant(state.phase === "name-points-practice", "IN006 Done is not enabled");
    invariant(state.controlsEnabled, "IN006 Done is disabled during feedback");
    invariant(state.selectedPoint, "IN006 Done requires a selected point");
    const selected = point(state.selectedPoint);
    invariant(selected, `unknown IN006 point: ${state.selectedPoint}`);
    const values = state.fields[selected.label];
    const correct = parsed(values.x) === selected.x && parsed(values.y) === selected.y;
    if (correct) {
      return freeze({...state, feedback: "correct", feedbackPoint: selected.label,
        controlsEnabled: false,
        tryAgainPoints: Object.freeze(state.tryAgainPoints.filter((label) =>
          label !== selected.label)), interactionRevision: state.interactionRevision + 1});
    }
    if (state.tryAgainPoints.includes(selected.label)) {
      return freeze({...state,
        fields: withPair(state.fields, selected.label, String(selected.x), String(selected.y)),
        selectedPoint: null, feedback: "second-wrong-reveal",
        feedbackPoint: selected.label, controlsEnabled: true,
        tryAgainPoints: Object.freeze(state.tryAgainPoints.filter((label) =>
          label !== selected.label)), interactionRevision: state.interactionRevision + 1});
    }
    return freeze({...state, feedback: "first-wrong", feedbackPoint: selected.label,
      controlsEnabled: false,
      tryAgainPoints: Object.freeze([...state.tryAgainPoints, selected.label]),
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "dismiss-feedback") {
    if (state.feedback === "none") return state;
    return freeze({...state, selectedPoint: null, feedback: "none", feedbackPoint: null,
      controlsEnabled: true, interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "clear") {
    invariant(state.controlsEnabled, "IN006 Clear is disabled during feedback");
    const fields = state.selectedPoint ? withPair(state.fields, state.selectedPoint, "", "") :
      emptyFields();
    return freeze({...state, fields, interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "select-term") {
    invariant(COURSE_G04_L11_IN_006_TERMS.some((term) => term.id === event.termId),
      `unknown IN006 term: ${event.termId}`);
    return freeze({...state, playing: false, selectedTermId: event.termId,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "close-term") {
    if (!state.selectedTermId) return state;
    return freeze({...state, selectedTermId: null,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "replay") return createCourseG04L11In006PracticeState(1);
  return event satisfies never;
}

export const COURSE_G04_L11_IN_006_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourcePointSetPreserved: true,
  sourceEightEditableCoordinateFieldsPreserved: true,
  sourceDoneClearAndTwoStepRemediationPreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, arbitraryHostNavigationAllowed: false,
  sourceAudioEnabled: false, registeredCurrentJavascript: false,
  sourceDomainDeclared: false, authoritativeOriginalRuntimeAccepted: false,
  behaviorParityEstablished: false, visualFidelityEstablished: false,
  humanVisualReviewAccepted: false, ownerAccepted: false,
  strictMigrationComplete: false, lessonReleased: false, published: false,
  strictAcceptanceEffect: "none",
});
