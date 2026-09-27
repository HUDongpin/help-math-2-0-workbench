"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_GS_003_CONFIG, COURSE_G04_L11_GS_003_SOURCE} from
  "../timelines/course-g04-l11-gs-003";
import {createCourseG04L11Gs003GameCandidate} from
  "./course-g04-l11-gs-003-game-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_GS_003_CONFIG);
const candidate = createCourseG04L11Gs003GameCandidate(sourceCandidate);

export {COURSE_G04_L11_GS_003_SOURCE};
export const COURSE_G04_L11_GS_003_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_GS_003_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_GS_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_GS_003_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Gs003Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Gs003FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Gs003CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Gs003Renderer = candidate.Renderer;
export default candidate.module;
