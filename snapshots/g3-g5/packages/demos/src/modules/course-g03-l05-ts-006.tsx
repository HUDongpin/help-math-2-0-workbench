"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L05_TS_006_CONFIG, COURSE_G03_L05_TS_006_SOURCE} from "../timelines/course-g03-l05-ts-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L05_TS_006_CONFIG);

export {COURSE_G03_L05_TS_006_SOURCE};
export const COURSE_G03_L05_TS_006_MOVIE = candidate.movie;
export const COURSE_G03_L05_TS_006_RUNTIME = candidate.runtime;
export const COURSE_G03_L05_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L05_TS_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L05Ts006Frame = candidate.normalizeFrame;
export const getCourseG03L05Ts006FrameState = candidate.getFrameState;
export const buildCourseG03L05Ts006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L05Ts006Renderer = candidate.Renderer;

export default Object.freeze({...candidate.module});
