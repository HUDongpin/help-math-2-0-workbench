'use client';
import {CourseG04L05In005Renderer,getCourseG04L05In005FrameState} from '../modules/course-g04-l05-in-005';
import {createMultiplesPresentation} from './g4-l5-multiples';
import {G4_L5_IN005_MULTIPLES_CONFIG} from './generated/g4-l5-in005-multiples-config';
export const G4_L5_IN005_TEXT_PRESENTATION=createMultiplesPresentation(G4_L5_IN005_MULTIPLES_CONFIG,getCourseG04L05In005FrameState,CourseG04L05In005Renderer);
export const G4_L5_IN005_TEXT_BINDING=G4_L5_IN005_TEXT_PRESENTATION.binding;
