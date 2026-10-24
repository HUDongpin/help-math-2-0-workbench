"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G03_L02_RW_002_CONFIG, COURSE_G03_L02_RW_002_GLOSSARY_CONFIG, COURSE_G03_L02_RW_002_GLOSSARY_HOTSPOTS, COURSE_G03_L02_RW_002_SOURCE,
} from "../timelines/course-g03-l02-rw-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_RW_002_CONFIG);
const candidate = createCourseG04L03SourceGlossaryCandidate(
  sourceStaticCandidate,
  COURSE_G03_L02_RW_002_GLOSSARY_CONFIG,
);

export {COURSE_G03_L02_RW_002_SOURCE, COURSE_G03_L02_RW_002_GLOSSARY_HOTSPOTS};
export const COURSE_G03_L02_RW_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_RW_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_RW_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_RW_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Rw002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Rw002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Rw002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Rw002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([Object.freeze({
      id: "course-g03-l02-rw-002-source-associated-undetermined",
      language: "shared" as const,
      spokenLanguage: "undetermined" as const,
      label: "Source audio (language unverified)",
      source: "/flash-assets/courses/course-g03-l02-rw-002/audio/source-associated-undetermined.mp3",
      durationMs: 57336,
      sha256: "9e2b4e29f96dc2d1c11547d49af4bbfa3f8140f49214048e3f5758c301f4d830",
      activation: "user" as const,
      visibleWhen: Object.freeze(["en", "es"] as const),
      frameDomains: Object.freeze(["sprite-284"]),
      timelineBehavior: "none" as const,
    })]),
});
