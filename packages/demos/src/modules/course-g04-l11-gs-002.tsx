"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_GS_002_CONFIG, COURSE_G04_L11_GS_002_SOURCE} from
  "../timelines/course-g04-l11-gs-002";
import {createCourseG04L11Gs002GameDirectionsCandidate} from
  "./course-g04-l11-gs-002-game-directions-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_GS_002_CONFIG);
const candidate = createCourseG04L11Gs002GameDirectionsCandidate(sourceCandidate);

export {COURSE_G04_L11_GS_002_SOURCE};
export const COURSE_G04_L11_GS_002_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_GS_002_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_GS_002_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Gs002Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Gs002FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Gs002CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Gs002Renderer = candidate.Renderer;
export default candidate.module;
