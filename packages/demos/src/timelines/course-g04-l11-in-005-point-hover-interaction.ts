import {COURSE_G04_L11_IN_005_POINTS} from
  "../source-static/g4-l11/course-g04-l11-in-005-static";

export type CourseG04L11In005PointLabel =
  (typeof COURSE_G04_L11_IN_005_POINTS)[number]["label"];
export type CourseG04L11In005TermId = "point" | "coordinate" | "coordinate-grid";

export const COURSE_G04_L11_IN_005_TERMS = Object.freeze([
  Object.freeze({id: "point", sourceButtonObjectId: 67, label: "Point",
    prompt: "A point marks one exact location on the coordinate grid."}),
  Object.freeze({id: "coordinate", sourceButtonObjectId: 68, label: "Coordinate",
    prompt: "A coordinate tells a point's position along one axis."}),
  Object.freeze({id: "coordinate-grid", sourceButtonObjectId: 106,
    label: "Coordinate grid",
    prompt: "A coordinate grid uses perpendicular x- and y-axes to locate points."}),
] as const);

export interface CourseG04L11In005HoverState {
  readonly frame: number;
  readonly phase: "instruction" | "hover-practice";
  readonly playing: boolean;
  readonly selectedPoint: CourseG04L11In005PointLabel | null;
  readonly revealedPoints: readonly CourseG04L11In005PointLabel[];
  readonly selectedTermId: CourseG04L11In005TermId | null;
  readonly interactionRevision: number;
  readonly audioEnabled: false;
  readonly legacyHostCallCount: 0;
}
export type CourseG04L11In005HoverEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "reveal-point"; label: CourseG04L11In005PointLabel}>
  | Readonly<{type: "select-term"; termId: CourseG04L11In005TermId}>
  | Readonly<{type: "close-term"}>
  | Readonly<{type: "replay"}>;

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 661,
    `invalid IN005 frame: ${frame}`);
  return Math.min(frame, 647);
}
function freeze(state: CourseG04L11In005HoverState) { return Object.freeze(state); }
export function createCourseG04L11In005HoverState(frame = 1): CourseG04L11In005HoverState {
  const local = exactFrame(frame);
  return freeze({frame: local, phase: local >= 647 ? "hover-practice" : "instruction",
    playing: local < 647, selectedPoint: null, revealedPoints: Object.freeze([]),
    selectedTermId: null, interactionRevision: 0, audioEnabled: false,
    legacyHostCallCount: 0});
}
export function getCourseG04L11In005Point(label: string) {
  return COURSE_G04_L11_IN_005_POINTS.find((point) => point.label === label) ?? null;
}
export function reduceCourseG04L11In005Hover(state: CourseG04L11In005HoverState,
  event: CourseG04L11In005HoverEvent): CourseG04L11In005HoverState {
  invariant(Object.isFrozen(state), "IN005 hover state must be frozen");
  if (event.type === "synchronize-frame") {
    if (!state.playing || state.selectedTermId) return state;
    const frame = exactFrame(event.frame);
    return frame === state.frame ? state : freeze({...state, frame,
      phase: frame >= 647 ? "hover-practice" : "instruction", playing: frame < 647});
  }
  if (event.type === "reveal-point") {
    invariant(state.phase === "hover-practice", "IN005 point reveal is not enabled");
    invariant(getCourseG04L11In005Point(event.label), `unknown IN005 point: ${event.label}`);
    const revealed = state.revealedPoints.includes(event.label) ? state.revealedPoints :
      Object.freeze([...state.revealedPoints, event.label]);
    return freeze({...state, selectedPoint: event.label, revealedPoints: revealed,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "select-term") {
    invariant(COURSE_G04_L11_IN_005_TERMS.some((term) => term.id === event.termId),
      `unknown IN005 term: ${event.termId}`);
    return freeze({...state, playing: false, selectedTermId: event.termId,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "close-term") {
    if (!state.selectedTermId) return state;
    return freeze({...state, selectedTermId: null,
      interactionRevision: state.interactionRevision + 1});
  }
  if (event.type === "replay") return createCourseG04L11In005HoverState(1);
  return event satisfies never;
}

export const COURSE_G04_L11_IN_005_INTERACTION_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourcePointSetPreserved: true,
  animationInternalPedagogicalControlsPreserved: true,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, sourceAudioEnabled: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, humanVisualReviewAccepted: false,
  ownerAccepted: false, strictMigrationComplete: false, lessonReleased: false,
  published: false, strictAcceptanceEffect: "none",
});
