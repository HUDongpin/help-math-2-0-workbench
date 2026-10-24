'use client';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {CourseG04L09Ts003Renderer,getCourseG04L09Ts003FrameState} from '../modules/course-g04-l09-ts-003';
import {G4_L9_TS003_CONFIG} from './generated/g4-l9-ts003-config.generated';
export {G4_L9_TS003_CONFIG};
export const G4_L9_TS003_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L9_TS003_CONFIG,getCourseG04L09Ts003FrameState,CourseG04L09Ts003Renderer);
export const G4_L9_TS003_TEXT_BINDING=G4_L9_TS003_TEXT_PRESENTATION.binding;
