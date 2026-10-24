"use client";

import {G4_L4_LUNCH_MENU_HOST_AUDIO} from "../modern-lessons/generated/g4-l4-lunch-menu-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_RW_002_CONFIG, COURSE_G04_L04_RW_002_SOURCE} from "../timelines/course-g04-l04-rw-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_RW_002_CONFIG, G4_L4_LUNCH_MENU_HOST_AUDIO);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_RW_002_SOURCE};
export const COURSE_G04_L04_RW_002_MOVIE = candidate.movie;
export const COURSE_G04_L04_RW_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_RW_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_RW_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04Rw002Frame = candidate.normalizeFrame;
export const getCourseG04L04Rw002FrameState = candidate.getFrameState;
export const buildCourseG04L04Rw002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04Rw002Renderer = candidate.Renderer;
export default module;
