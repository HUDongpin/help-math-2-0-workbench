"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_021_CONFIG, COURSE_G03_L02_IN_021_SOURCE,
} from "../timelines/course-g03-l02-in-021";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_021_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_021_SOURCE};
export const COURSE_G03_L02_IN_021_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_021_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_021_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_021_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In021Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In021FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In021CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In021Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-021-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-021/audio/source-associated-undetermined.mp3",
      durationMs: 29568,
      sha256: "4447b02b195f01e05d184d41d9f03e7be3f40c7b0f60b2654eaf8aa24ce6f262",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-89"]),
      timelineBehavior: "none" as const,
    })]),
});
