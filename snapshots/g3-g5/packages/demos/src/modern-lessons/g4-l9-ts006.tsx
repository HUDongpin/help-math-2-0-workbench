'use client';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {CourseG04L09Ts006Renderer,getCourseG04L09Ts006FrameState} from '../modules/course-g04-l09-ts-006';
import {G4_L9_TS006_CONFIG} from './generated/g4-l9-ts006-config.generated';
export {G4_L9_TS006_CONFIG};
export const G4_L9_TS006_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L9_TS006_CONFIG,getCourseG04L09Ts006FrameState,CourseG04L09Ts006Renderer);
export const G4_L9_TS006_TEXT_BINDING=G4_L9_TS006_TEXT_PRESENTATION.binding;
