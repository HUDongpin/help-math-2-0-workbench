"use client";
import {CourseG04L09Fq002Renderer,getCourseG04L09Fq002FrameState} from '../modules/course-g04-l09-fq-002';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {G4_L9_FQ002_CONFIG} from './generated/g4-l9-final-quiz-config';
export const G4_L9_FQ002_TEXT_PRESENTATION=createFinalQuizPresentation(G4_L9_FQ002_CONFIG,getCourseG04L09Fq002FrameState,CourseG04L09Fq002Renderer);
