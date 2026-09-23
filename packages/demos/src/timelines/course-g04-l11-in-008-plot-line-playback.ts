import {
  COURSE_G04_L11_IN_008_POINTS,
  COURSE_G04_L11_IN_008_SOURCE_TABLE_ROWS,
} from "../source-static/g4-l11/course-g04-l11-in-008-static";

export const COURSE_G04_L11_IN_008_PLAYBACK_SOURCE = Object.freeze({
  animationId: "course-g04-l11-in-008",
  sourceTimelineId: "sprite-129", sourceFrameCount: 1_478,
  sourceEquation: "x + 1 = y", plottedPoints: COURSE_G04_L11_IN_008_POINTS,
  sourceTableRows: COURSE_G04_L11_IN_008_SOURCE_TABLE_ROWS,
  sourceAnimationInternalControlCount: 0,
  sourceEmbeddedStreamBlockCount: 1_474,
  sourceEmbeddedStreamDurationMs: 122_776,
  sourceAudioAccepted: false, sourceTerminalBehaviorEstablished: false,
  legacyCourseShellRequired: false,
});

export type CourseG04L11In008VisualPhase =
  | "initial-grid"
  | "plot-and-connect-first-five"
  | "table-scaffold"
  | "table-values"
  | "equation"
  | "extend-pattern"
  | "final-source-visual";

export interface CourseG04L11In008PlaybackState {
  readonly frame: number;
  readonly playing: boolean;
  readonly phase: CourseG04L11In008VisualPhase;
  readonly revision: number;
  readonly modernLessonControl: "none" | "pause" | "resume" | "replay";
  readonly audioEnabled: false;
  readonly legacyHostCallCount: 0;
}

export type CourseG04L11In008PlaybackEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "pause"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const COURSE_G04_L11_IN_008_PLAYBACK_AUTHORITY = Object.freeze({
  implementationCandidateOnly: true, sourceCanvasSequenceRetained: true,
  modernLessonPlaybackControlsProvided: true,
  animationInternalPedagogicalControlsInvented: false,
  legacyCourseShellNavigationIncluded: false, legacyPlayerChromeIncluded: false,
  legacyGlobalsExecuted: false, sourceAudioEnabled: false,
  sourceAudioAccepted: false, sourceTerminalBehaviorEstablished: false,
  sourceDomainDeclared: false, registeredCurrentJavascript: false,
  authoritativeOriginalRuntimeAccepted: false, behaviorParityEstablished: false,
  visualFidelityEstablished: false, humanVisualReviewAccepted: false,
  ownerAccepted: false, strictMigrationComplete: false,
  lessonReleased: false, published: false, strictAcceptanceEffect: "none",
});

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function exactFrame(frame: number) {
  invariant(Number.isInteger(frame) && frame >= 1 && frame <= 1_478,
    `invalid IN008 local frame: ${frame}`);
  return frame;
}

export function getCourseG04L11In008VisualPhase(frame: number):
CourseG04L11In008VisualPhase {
  exactFrame(frame);
  if (frame <= 10) return "initial-grid";
  if (frame <= 381) return "plot-and-connect-first-five";
  if (frame <= 553) return "table-scaffold";
  if (frame <= 1_013) return "table-values";
  if (frame <= 1_147) return "equation";
  if (frame <= 1_446) return "extend-pattern";
  return "final-source-visual";
}

function freezeState(state: CourseG04L11In008PlaybackState) {
  return Object.freeze(state);
}

export function createCourseG04L11In008PlaybackState(initialFrame = 1):
CourseG04L11In008PlaybackState {
  const frame = exactFrame(initialFrame);
  return freezeState({frame, playing: frame < 1_478,
    phase: getCourseG04L11In008VisualPhase(frame), revision: 0,
    modernLessonControl: "none", audioEnabled: false, legacyHostCallCount: 0});
}

export function reduceCourseG04L11In008Playback(
  state: CourseG04L11In008PlaybackState,
  event: CourseG04L11In008PlaybackEvent,
): CourseG04L11In008PlaybackState {
  invariant(Object.isFrozen(state), "IN008 playback state must be frozen");
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!state.playing || state.frame === frame) return state;
      return freezeState({...state, frame,
        phase: getCourseG04L11In008VisualPhase(frame), playing: frame < 1_478,
        modernLessonControl: "none"});
    }
    case "pause":
      if (!state.playing) return state;
      return freezeState({...state, playing: false, revision: state.revision + 1,
        modernLessonControl: "pause"});
    case "resume": {
      const frame = exactFrame(event.frame);
      return freezeState({...state, frame,
        phase: getCourseG04L11In008VisualPhase(frame), playing: frame < 1_478,
        revision: state.revision + 1, modernLessonControl: "resume"});
    }
    case "replay":
      return freezeState({...createCourseG04L11In008PlaybackState(), revision:
        state.revision + 1, modernLessonControl: "replay"});
    default:
      return event satisfies never;
  }
}
