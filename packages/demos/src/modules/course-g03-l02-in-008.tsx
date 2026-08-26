"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_008_CONFIG, COURSE_G03_L02_IN_008_SOURCE,
} from "../timelines/course-g03-l02-in-008";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_008_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_008_SOURCE};
export const COURSE_G03_L02_IN_008_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_008_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_008_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In008Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In008FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In008CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In008Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-008-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-008/audio/source-associated-undetermined.mp3",
      durationMs: 28056,
      sha256: "2a7d06bb0cc1471f25eb75df5dee6d73b7b09fc2109480cf93328b5ff0deace1",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-101"]),
      timelineBehavior: "none" as const,
    })]),
});
