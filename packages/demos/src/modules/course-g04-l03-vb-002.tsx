"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_VB_002_CONFIG,
  COURSE_G04_L03_VB_002_GLOSSARY_CONFIG,
  COURSE_G04_L03_VB_002_SOURCE,
} from "../timelines/course-g04-l03-vb-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_002_CONFIG,
);
const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(candidate, COURSE_G04_L03_VB_002_GLOSSARY_CONFIG);

export {COURSE_G04_L03_VB_002_SOURCE};
export const COURSE_G04_L03_VB_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_VB_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_VB_002_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export const COURSE_G04_L03_VB_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Vb002Frame = candidate.normalizeFrame;
export const getCourseG04L03Vb002FrameState = candidate.getFrameState;
export const buildCourseG04L03Vb002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Vb002Renderer = glossaryCandidate.Renderer;

export default glossaryCandidate.module;
