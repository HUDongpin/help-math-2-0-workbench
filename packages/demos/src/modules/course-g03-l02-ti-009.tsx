"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_009_CONFIG, COURSE_G03_L02_TI_009_SOURCE,
} from "../timelines/course-g03-l02-ti-009";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_009_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_009_SOURCE};
export const COURSE_G03_L02_TI_009_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_009_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_009_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_009_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti009Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti009FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti009CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti009Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-009-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-009/audio/source-associated-undetermined.mp3",
      durationMs: 12288,
      sha256: "ff5a2d035669d267d6a3e8b902791f8c6f347f49519fc26cf7e858d0fcd09f88",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-269"]),
      timelineBehavior: "none" as const,
    })]),
});
