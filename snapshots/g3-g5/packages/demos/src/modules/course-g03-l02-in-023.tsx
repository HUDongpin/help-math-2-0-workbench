"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_023_CONFIG, COURSE_G03_L02_IN_023_SOURCE,
} from "../timelines/course-g03-l02-in-023";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_023_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_023_SOURCE};
export const COURSE_G03_L02_IN_023_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_023_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_023_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_023_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In023Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In023FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In023CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In023Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-023-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-023/audio/source-associated-undetermined.mp3",
      durationMs: 31032,
      sha256: "f6dd87a6183443932a80a2e8c8814b43e4f314093015f9b6e97c73f5b62bc94c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-96"]),
      timelineBehavior: "none" as const,
    })]),
});
