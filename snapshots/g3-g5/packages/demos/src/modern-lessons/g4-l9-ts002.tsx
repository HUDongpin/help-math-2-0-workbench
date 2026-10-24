'use client';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {CourseG04L09Ts002Renderer,getCourseG04L09Ts002FrameState} from '../modules/course-g04-l09-ts-002';
import {G4_L9_TS002_CONFIG} from './generated/g4-l9-ts002-config.generated';
export {G4_L9_TS002_CONFIG};
export const G4_L9_TS002_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L9_TS002_CONFIG,getCourseG04L09Ts002FrameState,CourseG04L09Ts002Renderer);
export const G4_L9_TS002_TEXT_BINDING=G4_L9_TS002_TEXT_PRESENTATION.binding;
