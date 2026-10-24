'use client';
import {CourseG04L08Ts003Renderer,getCourseG04L08Ts003FrameState} from '../modules/course-g04-l08-ts-003';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L8_FOUR_STEP_CONFIGS} from './generated/g4-l8-four-step-config';
export const G4_L8_TS003_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L8_FOUR_STEP_CONFIGS[0],getCourseG04L08Ts003FrameState,CourseG04L08Ts003Renderer);
export const G4_L8_TS003_TEXT_BINDING=G4_L8_TS003_TEXT_PRESENTATION.binding;
