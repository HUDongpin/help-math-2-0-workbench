"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_022_CONFIG, COURSE_G03_L02_IN_022_SOURCE,
} from "../timelines/course-g03-l02-in-022";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_022_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_022_SOURCE};
export const COURSE_G03_L02_IN_022_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_022_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_022_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_022_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In022Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In022FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In022CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In022Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-022-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-022/audio/source-associated-undetermined.mp3",
      durationMs: 10968,
      sha256: "47561e1ca5057162b0847718f0a6e0a806290ec3822a3b854b0c85578f6d4337",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-194"]),
      timelineBehavior: "none" as const,
    })]),
});
