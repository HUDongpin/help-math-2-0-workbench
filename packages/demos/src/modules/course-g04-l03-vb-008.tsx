"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03VbSignQuizCandidate} from "./course-g04-l03-vb-sign-quiz";
import {COURSE_G04_L03_VB_008_SIGN_QUIZ} from "../timelines/course-g04-l03-vb-sign-quiz-interaction";
import {
  COURSE_G04_L03_VB_008_CONFIG,
  COURSE_G04_L03_VB_008_SOURCE,
} from "../timelines/course-g04-l03-vb-008";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_008_CONFIG,
);
const functionalCandidate = createCourseG04L03VbSignQuizCandidate(
  candidate,
  COURSE_G04_L03_VB_008_SIGN_QUIZ,
);

export {COURSE_G04_L03_VB_008_SOURCE};
export const COURSE_G04_L03_VB_008_MOVIE = candidate.movie;
export const COURSE_G04_L03_VB_008_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_VB_008_SOURCE_CONTRACT =
  functionalCandidate.sourceContract;
export const COURSE_G04_L03_VB_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Vb008Frame = candidate.normalizeFrame;
export const getCourseG04L03Vb008FrameState = candidate.getFrameState;
export const buildCourseG04L03Vb008CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Vb008Renderer = functionalCandidate.Renderer;

export default functionalCandidate.module;
