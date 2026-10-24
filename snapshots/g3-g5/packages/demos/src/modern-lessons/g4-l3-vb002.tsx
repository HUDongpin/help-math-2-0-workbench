'use client';

import {createNumberLineVocabularyPresentation} from './source-number-line-vocabulary';
import {G4_L3_VOCABULARY_NATIVE_CONFIGS} from './generated/g4-l3-vocabulary-native-config';
import {getCourseG04L03Vb002FrameState} from '../modules/course-g04-l03-vb-002';

export const G4_L3_VB002_TEXT_PRESENTATION = createNumberLineVocabularyPresentation(
  G4_L3_VOCABULARY_NATIVE_CONFIGS['course-g04-l03-vb-002'], getCourseG04L03Vb002FrameState,
);
export const G4_L3_VB002_TEXT_BINDING = G4_L3_VB002_TEXT_PRESENTATION.binding;
export const G4L3Vb002ModernRenderer = G4_L3_VB002_TEXT_PRESENTATION.Renderer;
export const getG4L3Vb002TextSnapshot = G4_L3_VB002_TEXT_PRESENTATION.getSnapshot;
