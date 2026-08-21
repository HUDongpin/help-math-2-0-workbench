"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_027_CONFIG, COURSE_G03_L02_IN_027_SOURCE,
} from "../timelines/course-g03-l02-in-027";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_027_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_027_SOURCE};
export const COURSE_G03_L02_IN_027_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_027_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_027_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_027_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In027Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In027FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In027CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In027Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-027-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-027/audio/source-associated-undetermined.mp3",
      durationMs: 35040,
      sha256: "5f5859599a05d0196221f3be5c92b82c7a35e5bd0d59c056ca0f265c539c7bf6",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-89"]),
      timelineBehavior: "none" as const,
    })]),
});
