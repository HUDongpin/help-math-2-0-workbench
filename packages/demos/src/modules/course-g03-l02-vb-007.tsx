"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_007_CONFIG, COURSE_G03_L02_VB_007_SOURCE,
} from "../timelines/course-g03-l02-vb-007";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_007_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_007_SOURCE};
export const COURSE_G03_L02_VB_007_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_007_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_007_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb007Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb007FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb007CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb007Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-007-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-007/audio/source-associated-undetermined.mp3",
      durationMs: 16872,
      sha256: "b466973d956da62288e71acf58dbe0f15bf567af45d04a0609e217e6c053f80b",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-65"]),
      timelineBehavior: "none" as const,
    })]),
});
