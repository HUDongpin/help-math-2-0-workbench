"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_005_CONFIG, COURSE_G03_L02_TI_005_SOURCE,
} from "../timelines/course-g03-l02-ti-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_005_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_005_SOURCE};
export const COURSE_G03_L02_TI_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti005Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-005-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-005/audio/source-associated-undetermined.mp3",
      durationMs: 25176,
      sha256: "a21fdcf3d4f18d28b3837ac527354ac74ef6d4cc642e919b354c8709a35ea32c",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-271"]),
      timelineBehavior: "none" as const,
    })]),
});
