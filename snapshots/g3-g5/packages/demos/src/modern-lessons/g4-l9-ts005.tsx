'use client';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {CourseG04L09Ts005Renderer,getCourseG04L09Ts005FrameState} from '../modules/course-g04-l09-ts-005';
import {G4_L9_TS005_CONFIG} from './generated/g4-l9-ts005-config.generated';
export {G4_L9_TS005_CONFIG};
export const G4_L9_TS005_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L9_TS005_CONFIG,getCourseG04L09Ts005FrameState,CourseG04L09Ts005Renderer);
export const G4_L9_TS005_TEXT_BINDING=G4_L9_TS005_TEXT_PRESENTATION.binding;
