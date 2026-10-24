'use client';
import {CourseG04L06Ts004Renderer,getCourseG04L06Ts004FrameState} from '../modules/course-g04-l06-ts-004';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L6_FOUR_STEP_CONFIGS} from './generated/g4-l6-four-step-config';
export const G4_L6_TS004_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L6_FOUR_STEP_CONFIGS[2],getCourseG04L06Ts004FrameState,CourseG04L06Ts004Renderer);
export const G4_L6_TS004_TEXT_BINDING=G4_L6_TS004_TEXT_PRESENTATION.binding;
