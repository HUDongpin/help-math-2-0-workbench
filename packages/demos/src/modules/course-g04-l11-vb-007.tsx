"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_VB_007_CONFIG,
  COURSE_G04_L11_VB_007_SOURCE,
} from "../timelines/course-g04-l11-vb-007";
import {
  createCourseG04L11Vb007OrderedPairPracticeCandidate,
} from "./course-g04-l11-vb-007-ordered-pair-practice-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_VB_007_CONFIG,
);
const candidate = createCourseG04L11Vb007OrderedPairPracticeCandidate(
  sourceCandidate,
);

export {COURSE_G04_L11_VB_007_SOURCE};
export const COURSE_G04_L11_VB_007_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_VB_007_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_VB_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_VB_007_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Vb007Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Vb007FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Vb007CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Vb007Renderer = candidate.Renderer;

export default candidate.module;
