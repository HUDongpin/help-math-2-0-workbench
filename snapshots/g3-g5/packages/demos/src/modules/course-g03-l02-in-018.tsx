"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_018_CONFIG, COURSE_G03_L02_IN_018_SOURCE,
} from "../timelines/course-g03-l02-in-018";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_018_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_018_SOURCE};
export const COURSE_G03_L02_IN_018_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_018_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_018_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_018_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In018Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In018FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In018CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In018Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-018-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-018/audio/source-associated-undetermined.mp3",
      durationMs: 14040,
      sha256: "b173a2d723527110379ee26cfbefc9df5cc90032d9f2d25cc6e6980e83e3ce0d",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-337"]),
      timelineBehavior: "none" as const,
    })]),
});
