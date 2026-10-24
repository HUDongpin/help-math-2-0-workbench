'use client';
import {getCourseG04L05In016FrameState,CourseG04L05In016Renderer} from '../modules/course-g04-l05-in-016';
import {createVocabularyChoicePresentation} from './g4-l4-vocabulary-choice';
import {G4_L5_LATTICE_FOIL_CHOICE_CONFIGS} from './generated/g4-l5-lattice-foil-choice-config';
export const G4_L5_IN016_TEXT_PRESENTATION=createVocabularyChoicePresentation(G4_L5_LATTICE_FOIL_CHOICE_CONFIGS[1],getCourseG04L05In016FrameState,CourseG04L05In016Renderer);
