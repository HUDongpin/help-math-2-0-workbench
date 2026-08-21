"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_010_CONFIG, COURSE_G03_L02_IN_010_SOURCE,
} from "../timelines/course-g03-l02-in-010";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_010_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_010_SOURCE};
export const COURSE_G03_L02_IN_010_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_010_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_010_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In010Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In010FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In010CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In010Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-010-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-010/audio/source-associated-undetermined.mp3",
      durationMs: 18072,
      sha256: "48e27ec8834c5e2e532449e3355c736df580abd4aad2c91821308fe8e516c189",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-49"]),
      timelineBehavior: "none" as const,
    })]),
});
