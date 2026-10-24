'use client';
import {CourseG04L04Ts003Renderer,getCourseG04L04Ts003FrameState} from '../modules/course-g04-l04-ts-003';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L4_FOUR_STEP_CONFIGS} from './generated/g4-l4-four-step-native-config';
export const G4_L4_TS003_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L4_FOUR_STEP_CONFIGS[1],getCourseG04L04Ts003FrameState,CourseG04L04Ts003Renderer);
export const G4_L4_TS003_TEXT_BINDING=G4_L4_TS003_TEXT_PRESENTATION.binding;
