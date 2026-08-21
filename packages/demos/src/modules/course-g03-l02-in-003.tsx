"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_003_CONFIG, COURSE_G03_L02_IN_003_SOURCE,
} from "../timelines/course-g03-l02-in-003";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_003_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_003_SOURCE};
export const COURSE_G03_L02_IN_003_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_003_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_003_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In003Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In003FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In003CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In003Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-003-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-003/audio/source-associated-undetermined.mp3",
      durationMs: 11376,
      sha256: "5200584a0f0049528507c40803aafbf7b177981824bbf5e62551759df9c7af8f",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-19"]),
      timelineBehavior: "none" as const,
    })]),
});
