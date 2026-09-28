"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_004_CONFIG, COURSE_G03_L02_TS_004_SOURCE,
} from "../timelines/course-g03-l02-ts-004";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_004_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_004_SOURCE};
export const COURSE_G03_L02_TS_004_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_004_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_004_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts004Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts004FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts004CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts004Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-004-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-004/audio/source-associated-undetermined.mp3",
      durationMs: 20040,
      sha256: "a2505e6988cca2f44777711d87175b385564a51c2cb5284c05d6246635cf5dbf",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-38"]),
      timelineBehavior: "none" as const,
    })]),
});
