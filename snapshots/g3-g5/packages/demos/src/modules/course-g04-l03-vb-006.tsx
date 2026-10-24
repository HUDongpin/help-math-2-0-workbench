"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_VB_006_CONFIG,
  COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
  COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_VB_006_SOURCE,
} from "../timelines/course-g04-l03-vb-006";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_006_CONFIG,
);
const candidate = createCourseG04L03SourceGlossaryCandidate(
  sourceStaticCandidate,
  COURSE_G04_L03_VB_006_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_VB_006_GLOSSARY_HOTSPOTS, COURSE_G04_L03_VB_006_SOURCE};
export const COURSE_G04_L03_VB_006_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G04_L03_VB_006_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G04_L03_VB_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L03_VB_006_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG04L03Vb006Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG04L03Vb006FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG04L03Vb006CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG04L03Vb006Renderer = candidate.Renderer;

export default candidate.module;
