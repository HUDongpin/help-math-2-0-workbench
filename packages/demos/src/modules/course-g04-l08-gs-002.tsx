"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L08_GS_002_CONFIG, COURSE_G04_L08_GS_002_SOURCE} from "../timelines/course-g04-l08-gs-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L08_GS_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L08_GS_002_SOURCE};
export const COURSE_G04_L08_GS_002_MOVIE = candidate.movie;
export const COURSE_G04_L08_GS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L08_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L08_GS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L08Gs002Frame = candidate.normalizeFrame;
export const getCourseG04L08Gs002FrameState = candidate.getFrameState;
export const buildCourseG04L08Gs002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L08Gs002Renderer = candidate.Renderer;
export default module;
