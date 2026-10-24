'use client';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {CourseG04L09Ts004Renderer,getCourseG04L09Ts004FrameState} from '../modules/course-g04-l09-ts-004';
import {G4_L9_TS004_CONFIG} from './generated/g4-l9-ts004-config.generated';
export {G4_L9_TS004_CONFIG};
export const G4_L9_TS004_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L9_TS004_CONFIG,getCourseG04L09Ts004FrameState,CourseG04L09Ts004Renderer);
export const G4_L9_TS004_TEXT_BINDING=G4_L9_TS004_TEXT_PRESENTATION.binding;
