'use client';
import {CourseG04L06Ts005Renderer,getCourseG04L06Ts005FrameState} from '../modules/course-g04-l06-ts-005';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L6_FOUR_STEP_CONFIGS} from './generated/g4-l6-four-step-config';
export const G4_L6_TS005_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L6_FOUR_STEP_CONFIGS[3],getCourseG04L06Ts005FrameState,CourseG04L06Ts005Renderer);
export const G4_L6_TS005_TEXT_BINDING=G4_L6_TS005_TEXT_PRESENTATION.binding;
