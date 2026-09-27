"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03VbSignQuizCandidate} from "./course-g04-l03-vb-sign-quiz";
import {COURSE_G04_L03_VB_007_SIGN_QUIZ} from "../timelines/course-g04-l03-vb-sign-quiz-interaction";
import {
  COURSE_G04_L03_VB_007_CONFIG,
  COURSE_G04_L03_VB_007_SOURCE,
} from "../timelines/course-g04-l03-vb-007";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_007_CONFIG,
);
const functionalCandidate = createCourseG04L03VbSignQuizCandidate(
  candidate,
  COURSE_G04_L03_VB_007_SIGN_QUIZ,
);

export {COURSE_G04_L03_VB_007_SOURCE};
export const COURSE_G04_L03_VB_007_MOVIE = candidate.movie;
export const COURSE_G04_L03_VB_007_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_VB_007_SOURCE_CONTRACT =
  functionalCandidate.sourceContract;
export const COURSE_G04_L03_VB_007_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Vb007Frame = candidate.normalizeFrame;
export const getCourseG04L03Vb007FrameState = candidate.getFrameState;
export const buildCourseG04L03Vb007CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Vb007Renderer = functionalCandidate.Renderer;

export default functionalCandidate.module;
