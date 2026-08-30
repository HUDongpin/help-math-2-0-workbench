"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_002_CONFIG, COURSE_G03_L02_TS_002_SOURCE,
} from "../timelines/course-g03-l02-ts-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_002_SOURCE};
export const COURSE_G03_L02_TS_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-002/audio/source-associated-undetermined.mp3",
      durationMs: 20592,
      sha256: "148a963e1d0e87136cc65b36a73d97625170f53865842c6a12cda2a94c7df576",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-29"]),
      timelineBehavior: "none" as const,
    })]),
});
