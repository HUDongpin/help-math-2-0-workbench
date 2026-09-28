"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L05_GS_002_CONFIG, COURSE_G03_L05_GS_002_SOURCE} from "../timelines/course-g03-l05-gs-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L05_GS_002_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L05_GS_002_SOURCE};
export const COURSE_G03_L05_GS_002_MOVIE = candidate.movie;
export const COURSE_G03_L05_GS_002_RUNTIME = candidate.runtime;
export const COURSE_G03_L05_GS_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L05_GS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L05Gs002Frame = candidate.normalizeFrame;
export const getCourseG03L05Gs002FrameState = candidate.getFrameState;
export const buildCourseG03L05Gs002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L05Gs002Renderer = candidate.Renderer;
export default module;
