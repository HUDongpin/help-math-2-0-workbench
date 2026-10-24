"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_017_CONFIG, COURSE_G03_L02_IN_017_SOURCE,
} from "../timelines/course-g03-l02-in-017";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_017_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_017_SOURCE};
export const COURSE_G03_L02_IN_017_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_017_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_017_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In017Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In017FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In017CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In017Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-017-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-017/audio/source-associated-undetermined.mp3",
      durationMs: 29136,
      sha256: "9fa0385db11cb6dfa20bd37ef78e249ac8bafe83974d5d9df5b8066aaed15735",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-148"]),
      timelineBehavior: "none" as const,
    })]),
});
