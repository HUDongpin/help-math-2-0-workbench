"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_002_CONFIG, COURSE_G03_L02_IN_002_SOURCE,
} from "../timelines/course-g03-l02-in-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_002_SOURCE};
export const COURSE_G03_L02_IN_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-002/audio/source-associated-undetermined.mp3",
      durationMs: 35352,
      sha256: "e77cbd0530c0b4d0851f24e23e4ab28fbd2a1364642d6c57716c4fb015f8f7fe",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-23"]),
      timelineBehavior: "none" as const,
    })]),
});
