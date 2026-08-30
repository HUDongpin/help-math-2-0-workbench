"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_029_CONFIG, COURSE_G03_L02_IN_029_SOURCE,
} from "../timelines/course-g03-l02-in-029";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_029_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_029_SOURCE};
export const COURSE_G03_L02_IN_029_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_029_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_029_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_029_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In029Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In029FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In029CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In029Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-029-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-029/audio/source-associated-undetermined.mp3",
      durationMs: 26232,
      sha256: "2313ed6ab72ffe105127e82bd5ec131a40d0e2f4ad6a0c070c3585fd1f0a66d6",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-91"]),
      timelineBehavior: "none" as const,
    })]),
});
