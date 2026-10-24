'use client';
import {CourseG04L08Ts005Renderer,getCourseG04L08Ts005FrameState} from '../modules/course-g04-l08-ts-005';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L8_CHECK_STRATEGY_CONFIGS} from './generated/g4-l8-check-strategy-config';
export const G4_L8_TS005_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L8_CHECK_STRATEGY_CONFIGS[0],getCourseG04L08Ts005FrameState,CourseG04L08Ts005Renderer);
export const G4_L8_TS005_TEXT_BINDING=G4_L8_TS005_TEXT_PRESENTATION.binding;
