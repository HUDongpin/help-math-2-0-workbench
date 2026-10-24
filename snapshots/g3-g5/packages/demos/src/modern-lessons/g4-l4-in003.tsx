'use client';
import {CourseG04L04In003Renderer,getCourseG04L04In003FrameState} from '../modules/course-g04-l04-in-003';
import {createNumberLinePresentation} from './g4-l4-number-line';
import {G4_L4_LINEAR_NUMBER_LINE_CONFIGS} from './generated/g4-l4-linear-number-line-config';
export const G4_L4_IN003_TEXT_PRESENTATION=createNumberLinePresentation(G4_L4_LINEAR_NUMBER_LINE_CONFIGS[1],getCourseG04L04In003FrameState,CourseG04L04In003Renderer);
export const G4_L4_IN003_TEXT_BINDING=G4_L4_IN003_TEXT_PRESENTATION.binding;
