"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_006_CONFIG, COURSE_G03_L02_VB_006_SOURCE,
} from "../timelines/course-g03-l02-vb-006";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_006_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_006_SOURCE};
export const COURSE_G03_L02_VB_006_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_006_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_006_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb006Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb006FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb006CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb006Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-006-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-006/audio/source-associated-undetermined.mp3",
      durationMs: 5904,
      sha256: "c94fce6ace4a827026bc81b8a73717d0ee000181bb6f18ab44710ad90a1d2aa7",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-220"]),
      timelineBehavior: "none" as const,
    })]),
});
