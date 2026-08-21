"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_007_CONFIG, COURSE_G03_L02_TS_007_SOURCE,
} from "../timelines/course-g03-l02-ts-007";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_007_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_007_SOURCE};
export const COURSE_G03_L02_TS_007_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_007_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_007_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts007Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts007FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts007CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts007Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-007-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-007/audio/source-associated-undetermined.mp3",
      durationMs: 13670,
      sha256: "0d9b72673388ca2da9941896810dc307888f046e156dd93adf615f6dc3170620",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-425"]),
      timelineBehavior: "none" as const,
    })]),
});
