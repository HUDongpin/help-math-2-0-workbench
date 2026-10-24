'use client';
import {CourseG04L08Ts002Renderer,getCourseG04L08Ts002FrameState} from '../modules/course-g04-l08-ts-002';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L8_TS002_CONFIG} from './generated/g4-l8-ts002-config';
export const G4_L8_TS002_TEXT_PRESENTATION=createFourStepPlanPresentation(G4_L8_TS002_CONFIG,getCourseG04L08Ts002FrameState,CourseG04L08Ts002Renderer);
export const G4_L8_TS002_TEXT_BINDING=G4_L8_TS002_TEXT_PRESENTATION.binding;
