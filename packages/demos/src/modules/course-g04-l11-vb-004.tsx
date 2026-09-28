"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_VB_004_CONFIG,
  COURSE_G04_L11_VB_004_SOURCE,
} from "../timelines/course-g04-l11-vb-004";
import {
  createCourseG04L11Vb004VocabularyCandidate,
} from "./course-g04-l11-vb-004-vocabulary-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_VB_004_CONFIG,
);
const candidate = createCourseG04L11Vb004VocabularyCandidate(sourceCandidate);

export {COURSE_G04_L11_VB_004_SOURCE};
export const COURSE_G04_L11_VB_004_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_VB_004_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_VB_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_VB_004_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Vb004Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Vb004FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Vb004CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Vb004Renderer = candidate.Renderer;

export default candidate.module;
