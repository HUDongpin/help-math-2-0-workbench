"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_011_CONFIG, COURSE_G03_L02_VB_011_SOURCE,
} from "../timelines/course-g03-l02-vb-011";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_011_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_011_SOURCE};
export const COURSE_G03_L02_VB_011_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_011_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_011_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb011Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb011FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb011CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb011Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-011-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-011/audio/source-associated-undetermined.mp3",
      durationMs: 16056,
      sha256: "ffe796b7b97f0ad724bc48f2957552f86b2a4eea27eb75ecb873a52c90c3c007",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-65"]),
      timelineBehavior: "none" as const,
    })]),
});
