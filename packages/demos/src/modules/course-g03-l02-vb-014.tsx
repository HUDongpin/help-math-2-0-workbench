"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_VB_014_CONFIG, COURSE_G03_L02_VB_014_SOURCE,
} from "../timelines/course-g03-l02-vb-014";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_VB_014_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_VB_014_SOURCE};
export const COURSE_G03_L02_VB_014_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_VB_014_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_VB_014_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_VB_014_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Vb014Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Vb014FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Vb014CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Vb014Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-vb-014-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-vb-014/audio/source-associated-undetermined.mp3",
      durationMs: 21504,
      sha256: "817840b95d8aae4dcf405d984c6b050ca66ec1187fbdbad1c12114b1eb02a441",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-67"]),
      timelineBehavior: "none" as const,
    })]),
});
