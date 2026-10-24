'use client';
import {getCourseG04L05In019FrameState,CourseG04L05In019Renderer} from '../modules/course-g04-l05-in-019';
import {createVocabularyChoicePresentation} from './g4-l4-vocabulary-choice';
import {G4_L5_COMMON_METHOD_CHOICE_CONFIGS} from './generated/g4-l5-common-method-choice-config';
export const G4_L5_IN019_TEXT_PRESENTATION=createVocabularyChoicePresentation(G4_L5_COMMON_METHOD_CHOICE_CONFIGS[0],getCourseG04L05In019FrameState,CourseG04L05In019Renderer);
