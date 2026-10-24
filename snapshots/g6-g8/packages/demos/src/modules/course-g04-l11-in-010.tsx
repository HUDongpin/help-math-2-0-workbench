"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_010_CONFIG, COURSE_G04_L11_IN_010_SOURCE} from
  "../timelines/course-g04-l11-in-010";
import {createCourseG04L11In010PointChoiceCandidate} from
  "./course-g04-l11-in-010-point-choice-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_010_CONFIG);
const candidate = createCourseG04L11In010PointChoiceCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_010_SOURCE};
export const COURSE_G04_L11_IN_010_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_010_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_010_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In010Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In010FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In010CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In010Renderer = candidate.Renderer;

export default candidate.module;
