'use client';
import {CourseG04L08Ts004Renderer,getCourseG04L08Ts004FrameState} from '../modules/course-g04-l08-ts-004';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L8_STRATEGY_CONFIGS} from './generated/g4-l8-strategy-config';
export const G4_L8_TS004_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L8_STRATEGY_CONFIGS[0],getCourseG04L08Ts004FrameState,CourseG04L08Ts004Renderer);
export const G4_L8_TS004_TEXT_BINDING=G4_L8_TS004_TEXT_PRESENTATION.binding;
