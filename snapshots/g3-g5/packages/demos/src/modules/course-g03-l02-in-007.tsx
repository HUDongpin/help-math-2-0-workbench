"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_007_CONFIG, COURSE_G03_L02_IN_007_SOURCE,
} from "../timelines/course-g03-l02-in-007";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_007_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_007_SOURCE};
export const COURSE_G03_L02_IN_007_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_007_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_007_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In007Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In007FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In007CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In007Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-007-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-007/audio/source-associated-undetermined.mp3",
      durationMs: 37656,
      sha256: "a9552577e46e2d9c1c324f14a99fd3f5902cde77be2063ad5374aedd23f8afc1",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-79"]),
      timelineBehavior: "none" as const,
    })]),
});
