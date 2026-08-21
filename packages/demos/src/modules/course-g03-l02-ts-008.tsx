"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_008_CONFIG, COURSE_G03_L02_TS_008_SOURCE,
} from "../timelines/course-g03-l02-ts-008";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_008_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_008_SOURCE};
export const COURSE_G03_L02_TS_008_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_008_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_008_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts008Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts008FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts008CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts008Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-008-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-008/audio/source-associated-undetermined.mp3",
      durationMs: 9384,
      sha256: "e3a150483d5eb0422479533afb8532dce16b1bc5ac83c207af5d16abc8eda70b",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-355"]),
      timelineBehavior: "none" as const,
    })]),
});
