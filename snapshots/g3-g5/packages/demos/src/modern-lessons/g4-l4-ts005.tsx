'use client';
import {CourseG04L04Ts005Renderer,getCourseG04L04Ts005FrameState} from '../modules/course-g04-l04-ts-005';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L4_STRATEGY_CONFIGS} from './generated/g4-l4-strategy-config';
export const G4_L4_TS005_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L4_STRATEGY_CONFIGS[1],getCourseG04L04Ts005FrameState,CourseG04L04Ts005Renderer);
export const G4_L4_TS005_TEXT_BINDING=G4_L4_TS005_TEXT_PRESENTATION.binding;
