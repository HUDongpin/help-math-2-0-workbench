"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_003_CONFIG, COURSE_G03_L02_TS_003_SOURCE,
} from "../timelines/course-g03-l02-ts-003";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_003_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_003_SOURCE};
export const COURSE_G03_L02_TS_003_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_003_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_003_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts003Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts003FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts003CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts003Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-003-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-003/audio/source-associated-undetermined.mp3",
      durationMs: 12216,
      sha256: "33b5c3c7e630cac092c25718e17a322c90a4a76f3aa31aa1167026847b14eb0a",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-27"]),
      timelineBehavior: "none" as const,
    })]),
});
