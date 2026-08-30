"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_005_CONFIG, COURSE_G03_L02_IN_005_SOURCE,
} from "../timelines/course-g03-l02-in-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_005_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_005_SOURCE};
export const COURSE_G03_L02_IN_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In005Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-005-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-005/audio/source-associated-undetermined.mp3",
      durationMs: 39408,
      sha256: "1cdf75f011589585578856e311f1cce82f644a8e26046acb689fad0112d9a217",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-160"]),
      timelineBehavior: "none" as const,
    })]),
});
