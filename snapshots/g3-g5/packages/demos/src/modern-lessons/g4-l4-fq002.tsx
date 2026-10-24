"use client";
import {CourseG04L04Fq002Renderer,getCourseG04L04Fq002FrameState} from '../modules/course-g04-l04-fq-002';
import {createFinalQuizPresentation} from './g4-l4-final-quiz-presentation';
import {G4_L4_FINAL_QUIZ_CONFIG as config} from './generated/g4-l4-final-quiz-config';
export const G4_L4_FQ002_TEXT_PRESENTATION=createFinalQuizPresentation({...config,...config.members[0],binding:config.bindings[0]},getCourseG04L04Fq002FrameState,CourseG04L04Fq002Renderer);
export const G4_L4_FQ002_TEXT_BINDING=G4_L4_FQ002_TEXT_PRESENTATION.binding;
