'use client';
import {COURSE_G04_L05_IN_006_RENDERER as Fallback,getCourseG04L05In006FrameState} from '../modules/course-g04-l05-in-006';
import {createIn006Presentation} from './g4-l5-in006/presentation';
export const G4_L5_IN006_TEXT_PRESENTATION=createIn006Presentation(getCourseG04L05In006FrameState,Fallback);
export const G4_L5_IN006_TEXT_BINDING=G4_L5_IN006_TEXT_PRESENTATION.binding;
