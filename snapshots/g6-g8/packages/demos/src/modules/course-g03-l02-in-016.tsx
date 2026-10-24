"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_016_CONFIG, COURSE_G03_L02_IN_016_SOURCE,
} from "../timelines/course-g03-l02-in-016";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_016_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_016_SOURCE};
export const COURSE_G03_L02_IN_016_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_016_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_016_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_016_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In016Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In016FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In016CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In016Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-016-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-016/audio/source-associated-undetermined.mp3",
      durationMs: 7248,
      sha256: "e671ca233e5eee906214df9ac48eceda8b32eff3309a623e4047b26dce442447",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-45"]),
      timelineBehavior: "none" as const,
    })]),
});
