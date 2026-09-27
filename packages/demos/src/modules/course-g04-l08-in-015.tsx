"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_IN_015_CONFIG, COURSE_G04_L08_IN_015_SOURCE} from "../timelines/course-g04-l08-in-015";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_IN_015_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_IN_015_SOURCE};
export const COURSE_G04_L08_IN_015_MOVIE = candidate.movie;
export const COURSE_G04_L08_IN_015_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_IN_015_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_IN_015_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08In015Frame = candidate.normalizeFrame;
export const getCourseG04L08In015FrameState = candidate.getFrameState;
export const buildCourseG04L08In015CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08In015Renderer = candidate.Renderer;
export default module;
