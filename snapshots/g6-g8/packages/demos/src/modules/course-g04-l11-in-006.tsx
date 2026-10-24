"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_IN_006_CONFIG, COURSE_G04_L11_IN_006_SOURCE} from
  "../timelines/course-g04-l11-in-006";
import {createCourseG04L11In006NamePointsPracticeCandidate} from
  "./course-g04-l11-in-006-name-points-practice-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_IN_006_CONFIG);
const candidate = createCourseG04L11In006NamePointsPracticeCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_006_SOURCE};
export const COURSE_G04_L11_IN_006_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_006_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_006_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In006Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In006FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In006CaptureAttributes = sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In006Renderer = candidate.Renderer;
export default candidate.module;
