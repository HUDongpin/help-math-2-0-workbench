"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_024_CONFIG, COURSE_G03_L02_IN_024_SOURCE,
} from "../timelines/course-g03-l02-in-024";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_024_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_024_SOURCE};
export const COURSE_G03_L02_IN_024_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_024_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_024_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_024_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In024Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In024FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In024CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In024Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-024-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-024/audio/source-associated-undetermined.mp3",
      durationMs: 34896,
      sha256: "cafa407efec0847f968ead9c8d681d8ea579d288f359d1f12888baa129c311bc",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-313"]),
      timelineBehavior: "none" as const,
    })]),
});
