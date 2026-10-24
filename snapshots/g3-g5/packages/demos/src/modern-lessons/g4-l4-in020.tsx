'use client';
import {CourseG04L04In020Renderer,getCourseG04L04In020FrameState} from '../modules/course-g04-l04-in-020';
import {createEstimationExamplePresentation} from './g4-l4-estimation-examples';
import {G4_L4_ESTIMATION_EXAMPLE_CONFIGS} from './generated/g4-l4-estimation-examples-config';
export const G4_L4_IN020_TEXT_PRESENTATION=createEstimationExamplePresentation(G4_L4_ESTIMATION_EXAMPLE_CONFIGS[0],getCourseG04L04In020FrameState,CourseG04L04In020Renderer);
export const G4_L4_IN020_TEXT_BINDING=G4_L4_IN020_TEXT_PRESENTATION.binding;
