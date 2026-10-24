"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_013_CONFIG, COURSE_G03_L02_VB_013_SOURCE,
} from "../timelines/course-g03-l02-vb-013";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_013_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_013_SOURCE};
export const COURSE_G03_L02_VB_013_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_013_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_013_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_013_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb013Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb013FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb013CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb013Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-013-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-013/audio/source-associated-undetermined.mp3",
      durationMs: 5544,
      sha256: "69f90c4d5269efb20b738363ebf67a8766922baf52a1bbeffcdc5eea667da972",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-153"]),
      timelineBehavior: "none" as const,
    })]),
});
