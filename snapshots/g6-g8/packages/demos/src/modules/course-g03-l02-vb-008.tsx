"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_008_CONFIG, COURSE_G03_L02_VB_008_SOURCE,
} from "../timelines/course-g03-l02-vb-008";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_008_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_008_SOURCE};
export const COURSE_G03_L02_VB_008_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_008_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_008_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb008Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb008FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb008CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb008Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-008-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-008/audio/source-associated-undetermined.mp3",
      durationMs: 26088,
      sha256: "ef38cbc79af1bfa36b59cfb05e1934397f446e6930b6bd88ba5e09b9685cfa7b",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-27"]),
      timelineBehavior: "none" as const,
    })]),
});
