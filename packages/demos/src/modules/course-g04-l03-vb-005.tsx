"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_VB_005_CONFIG,
  COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
  COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_VB_005_SOURCE,
} from "../timelines/course-g04-l03-vb-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_005_CONFIG,
);
const candidate = createCourseG04L03SourceGlossaryCandidate(
  sourceStaticCandidate,
  COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS, COURSE_G04_L03_VB_005_SOURCE};
export const COURSE_G04_L03_VB_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G04_L03_VB_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G04_L03_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L03_VB_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG04L03Vb005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG04L03Vb005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG04L03Vb005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG04L03Vb005Renderer = candidate.Renderer;

export default candidate.module;
