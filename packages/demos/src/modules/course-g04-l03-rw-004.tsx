"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_RW_004_CONFIG,
  COURSE_G04_L03_RW_004_GLOSSARY_CONFIG,
  COURSE_G04_L03_RW_004_SOURCE,
} from "../timelines/course-g04-l03-rw-004";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_RW_004_CONFIG,
);
const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  candidate,
  COURSE_G04_L03_RW_004_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_RW_004_SOURCE};
export const COURSE_G04_L03_RW_004_MOVIE = candidate.movie;
export const COURSE_G04_L03_RW_004_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_RW_004_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export const COURSE_G04_L03_RW_004_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Rw004Frame = candidate.normalizeFrame;
export const getCourseG04L03Rw004FrameState = candidate.getFrameState;
export const buildCourseG04L03Rw004CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Rw004Renderer = glossaryCandidate.Renderer;

export default glossaryCandidate.module;
