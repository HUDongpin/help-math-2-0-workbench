'use client';
import {CourseG04L04Ts004Renderer,getCourseG04L04Ts004FrameState} from '../modules/course-g04-l04-ts-004';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L4_STRATEGY_CONFIGS} from './generated/g4-l4-strategy-config';
export const G4_L4_TS004_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L4_STRATEGY_CONFIGS[0],getCourseG04L04Ts004FrameState,CourseG04L04Ts004Renderer);
export const G4_L4_TS004_TEXT_BINDING=G4_L4_TS004_TEXT_PRESENTATION.binding;
