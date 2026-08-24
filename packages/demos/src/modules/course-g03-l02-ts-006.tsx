"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TS_006_CONFIG, COURSE_G03_L02_TS_006_SOURCE,
} from "../timelines/course-g03-l02-ts-006";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TS_006_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TS_006_SOURCE};
export const COURSE_G03_L02_TS_006_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TS_006_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TS_006_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ts006Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ts006FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ts006CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ts006Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ts-006-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ts-006/audio/source-associated-undetermined.mp3",
      durationMs: 7632,
      sha256: "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-13"]),
      timelineBehavior: "none" as const,
    })]),
});
