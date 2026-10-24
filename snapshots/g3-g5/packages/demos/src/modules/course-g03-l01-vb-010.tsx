"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L01_VB_010_CONFIG, COURSE_G03_L01_VB_010_SOURCE} from "../timelines/course-g03-l01-vb-010";

import {VB010_CONFIG as native} from '../modern-lessons/generated/g3-l1-vb010-source';

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L01_VB_010_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const, audioCues: [], audioTracks: [native.spanishTrack], sourcePlayControl: {frameDomain: native.clock.mainDomain, interruptSourceInstances: native.spanishTrack.interruptSourceInstances}});

export {COURSE_G03_L01_VB_010_SOURCE};
export const COURSE_G03_L01_VB_010_MOVIE = candidate.movie;
export const COURSE_G03_L01_VB_010_RUNTIME = candidate.runtime;
export const COURSE_G03_L01_VB_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L01_VB_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L01Vb010Frame = candidate.normalizeFrame;
export const getCourseG03L01Vb010FrameState = candidate.getFrameState;
export const buildCourseG03L01Vb010CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L01Vb010Renderer = candidate.Renderer;
export default module;
