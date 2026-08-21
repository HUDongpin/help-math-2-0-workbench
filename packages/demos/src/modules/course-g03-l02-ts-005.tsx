"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_005_CONFIG, COURSE_G03_L02_TS_005_SOURCE,
} from "../timelines/course-g03-l02-ts-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_005_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_005_SOURCE};
export const COURSE_G03_L02_TS_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts005Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-005-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-005/audio/source-associated-undetermined.mp3",
      durationMs: 15240,
      sha256: "153f3ec94840fbc958e67c5209abdc25e403c0afe9424529e80343befd8c3c6c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-32"]),
      timelineBehavior: "none" as const,
    })]),
});
