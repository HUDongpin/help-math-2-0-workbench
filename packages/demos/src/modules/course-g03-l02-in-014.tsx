"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_014_CONFIG, COURSE_G03_L02_IN_014_SOURCE,
} from "../timelines/course-g03-l02-in-014";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_014_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_014_SOURCE};
export const COURSE_G03_L02_IN_014_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_014_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_014_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In014Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In014FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In014CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In014Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-014-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-014/audio/source-associated-undetermined.mp3",
      durationMs: 20664,
      sha256: "ccf8d4c4b7e1b398eb9e23123df925e0ccd3bd0bc7d6c0af10e1be306f3956d9",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-264"]),
      timelineBehavior: "none" as const,
    })]),
});
