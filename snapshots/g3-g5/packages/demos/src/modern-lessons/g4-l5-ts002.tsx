'use client';
import {CourseG04L05Ts002Renderer,getCourseG04L05Ts002FrameState} from '../modules/course-g04-l05-ts-002';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L5_FOUR_STEP_CONFIGS} from './generated/g4-l5-four-step-config';
export const G4_L5_TS002_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L5_FOUR_STEP_CONFIGS[0],getCourseG04L05Ts002FrameState,CourseG04L05Ts002Renderer);
export const G4_L5_TS002_TEXT_BINDING=G4_L5_TS002_TEXT_PRESENTATION.binding;
