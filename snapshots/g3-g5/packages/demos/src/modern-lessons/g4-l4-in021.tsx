'use client';
import {CourseG04L04In021Renderer,getCourseG04L04In021FrameState} from '../modules/course-g04-l04-in-021';
import {createEstimationExamplePresentation} from './g4-l4-estimation-examples';
import {G4_L4_ESTIMATION_EXAMPLE_CONFIGS} from './generated/g4-l4-estimation-examples-config';
export const G4_L4_IN021_TEXT_PRESENTATION=createEstimationExamplePresentation(G4_L4_ESTIMATION_EXAMPLE_CONFIGS[1],getCourseG04L04In021FrameState,CourseG04L04In021Renderer);
export const G4_L4_IN021_TEXT_BINDING=G4_L4_IN021_TEXT_PRESENTATION.binding;
