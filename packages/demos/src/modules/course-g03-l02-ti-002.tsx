"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_002_CONFIG, COURSE_G03_L02_TI_002_SOURCE,
} from "../timelines/course-g03-l02-ti-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_002_SOURCE};
export const COURSE_G03_L02_TI_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-002/audio/source-associated-undetermined.mp3",
      durationMs: 31224,
      sha256: "539bc65b960a8b555536765b1101a7b482c2f08de02bbf21d6220992521ea4f9",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-153"]),
      timelineBehavior: "none" as const,
    })]),
});
