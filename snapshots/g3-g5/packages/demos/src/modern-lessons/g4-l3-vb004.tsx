'use client';

import {createNumberLineVocabularyPresentation} from './source-number-line-vocabulary';
import {G4_L3_VOCABULARY_NATIVE_CONFIGS} from './generated/g4-l3-vocabulary-native-config';
import {getCourseG04L03Vb004FrameState} from '../modules/course-g04-l03-vb-004';

export const G4_L3_VB004_TEXT_PRESENTATION = createNumberLineVocabularyPresentation(
  G4_L3_VOCABULARY_NATIVE_CONFIGS['course-g04-l03-vb-004'], getCourseG04L03Vb004FrameState,
);
export const G4_L3_VB004_TEXT_BINDING = G4_L3_VB004_TEXT_PRESENTATION.binding;
export const G4L3Vb004ModernRenderer = G4_L3_VB004_TEXT_PRESENTATION.Renderer;
export const getG4L3Vb004TextSnapshot = G4_L3_VB004_TEXT_PRESENTATION.getSnapshot;
