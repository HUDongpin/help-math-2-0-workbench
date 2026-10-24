"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_004_CONFIG, COURSE_G03_L02_VB_004_SOURCE,
} from "../timelines/course-g03-l02-vb-004";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_004_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_004_SOURCE};
export const COURSE_G03_L02_VB_004_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_004_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_004_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb004Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb004FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb004CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb004Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-004-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-004/audio/source-associated-undetermined.mp3",
      durationMs: 26880,
      sha256: "0b1df04496b310ef5ec84d2b3718c286f30b1ea9d74a9c577dd5d9f468ade0df",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-44"]),
      timelineBehavior: "none" as const,
    })]),
});
