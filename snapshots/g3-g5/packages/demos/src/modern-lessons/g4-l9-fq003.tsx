"use client";
import {CourseG04L09Fq003Renderer,getCourseG04L09Fq003FrameState} from '../modules/course-g04-l09-fq-003';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {G4_L9_FQ003_CONFIG} from './generated/g4-l9-final-quiz-config';
export const G4_L9_FQ003_TEXT_PRESENTATION=createFinalQuizPresentation(G4_L9_FQ003_CONFIG,getCourseG04L09Fq003FrameState,CourseG04L09Fq003Renderer);
