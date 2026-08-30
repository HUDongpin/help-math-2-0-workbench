"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_003_CONFIG, COURSE_G03_L02_TI_003_SOURCE,
} from "../timelines/course-g03-l02-ti-003";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_003_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_003_SOURCE};
export const COURSE_G03_L02_TI_003_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_003_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_003_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti003Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti003FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti003CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti003Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-003-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-003/audio/source-associated-undetermined.mp3",
      durationMs: 6024,
      sha256: "f0897388e0ed34a72b61cf296cb77e96574a90c63bb2e03235321b1623113328",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-249"]),
      timelineBehavior: "none" as const,
    })]),
});
