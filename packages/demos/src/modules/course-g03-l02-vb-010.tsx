"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_010_CONFIG, COURSE_G03_L02_VB_010_SOURCE,
} from "../timelines/course-g03-l02-vb-010";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_010_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_010_SOURCE};
export const COURSE_G03_L02_VB_010_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_010_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_010_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb010Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb010FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb010CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb010Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-010-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-010/audio/source-associated-undetermined.mp3",
      durationMs: 9960,
      sha256: "9cb4d275b325054e16ac021bb78954bbe342f3bb15af9d101cfae07f6f79c060",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-199"]),
      timelineBehavior: "none" as const,
    })]),
});
