"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_IN_004_CONFIG,
  COURSE_G04_L11_IN_004_SOURCE,
} from "../timelines/course-g04-l11-in-004";
import {
  createCourseG04L11In004CoordinateQuizCandidate,
} from "./course-g04-l11-in-004-coordinate-quiz-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_IN_004_CONFIG,
);
const candidate = createCourseG04L11In004CoordinateQuizCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_004_SOURCE};
export const COURSE_G04_L11_IN_004_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_004_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_004_INTERACTION_AUTHORITY =
  candidate.interactionAuthority;
export const COURSE_G04_L11_IN_004_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In004Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In004FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In004CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In004Renderer = candidate.Renderer;

export default candidate.module;
