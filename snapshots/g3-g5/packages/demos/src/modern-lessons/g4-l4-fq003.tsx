"use client";
import {CourseG04L04Fq003Renderer,getCourseG04L04Fq003FrameState} from '../modules/course-g04-l04-fq-003';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {G4_L4_FINAL_QUIZ_CONFIG as config} from './generated/g4-l4-final-quiz-config';
export const G4_L4_FQ003_TEXT_PRESENTATION=createFinalQuizPresentation({...config,...config.members[1],binding:config.bindings[1]},getCourseG04L04Fq003FrameState,CourseG04L04Fq003Renderer);
export const G4_L4_FQ003_TEXT_BINDING=G4_L4_FQ003_TEXT_PRESENTATION.binding;
