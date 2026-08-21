"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_TI_008_CONFIG, COURSE_G03_L02_TI_008_SOURCE,
} from "../timelines/course-g03-l02-ti-008";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_TI_008_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_TI_008_SOURCE};
export const COURSE_G03_L02_TI_008_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_TI_008_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_TI_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_TI_008_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ti008Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ti008FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ti008CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ti008Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-ti-008-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-ti-008/audio/source-associated-undetermined.mp3",
      durationMs: 20280,
      sha256: "51a778a51921f708f3fa7b844c192389d51b878a47c7a53e807e2fbbdefe7f8e",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-217"]),
      timelineBehavior: "none" as const,
    })]),
});
