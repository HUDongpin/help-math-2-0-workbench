"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IN_015_CONFIG, COURSE_G03_L02_IN_015_SOURCE,
} from "../timelines/course-g03-l02-in-015";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IN_015_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IN_015_SOURCE};
export const COURSE_G03_L02_IN_015_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IN_015_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IN_015_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IN_015_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02In015Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02In015FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02In015CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02In015Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-in-015-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-in-015/audio/source-associated-undetermined.mp3",
      durationMs: 25056,
      sha256: "1baefa305a7a887f0eb09470f607c978eedc9dbe217680b1ca6d4d102cee08c6",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-48"]),
      timelineBehavior: "none" as const,
    })]),
});
