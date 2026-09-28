"use client";

import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_IN_011_CONFIG,
  COURSE_G04_L03_IN_011_GLOSSARY_CONFIG,
  COURSE_G04_L03_IN_011_SOURCE,
} from "../timelines/course-g04-l03-in-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L03_IN_011_CONFIG);
const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, module: {...candidate.module, reducedMotionFrame: 441}},
  COURSE_G04_L03_IN_011_GLOSSARY_CONFIG,
  {scenario: "source-static-frame", canvasCandidateStatus: "source-static-engineering-not-strict", surfacePlacement: "companion"},
);

export {COURSE_G04_L03_IN_011_SOURCE};
export const COURSE_G04_L03_IN_011_MOVIE = candidate.movie;
export const COURSE_G04_L03_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IN_011_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export const COURSE_G04_L03_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03In011Frame = candidate.normalizeFrame;
export const getCourseG04L03In011FrameState = candidate.getFrameState;
export const buildCourseG04L03In011CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03In011Renderer = glossaryCandidate.Renderer;

export default glossaryCandidate.module;
