'use client';
import {CourseG04L06Ts003Renderer,getCourseG04L06Ts003FrameState} from '../modules/course-g04-l06-ts-003';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L6_FOUR_STEP_CONFIGS} from './generated/g4-l6-four-step-config';
export const G4_L6_TS003_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L6_FOUR_STEP_CONFIGS[1],getCourseG04L06Ts003FrameState,CourseG04L06Ts003Renderer);
export const G4_L6_TS003_TEXT_BINDING=G4_L6_TS003_TEXT_PRESENTATION.binding;
