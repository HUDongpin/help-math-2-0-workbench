import {createVocabularyChoicePresentation} from './g4-l4-vocabulary-choice';
import {G4_L5_ARRAY_CHOICE_CONFIGS} from './generated/g4-l5-array-choice-config';
import {getCourseG04L05In010FrameState,CourseG04L05In010Renderer} from '../modules/course-g04-l05-in-010';
export const G4_L5_IN010_TEXT_PRESENTATION = createVocabularyChoicePresentation(G4_L5_ARRAY_CHOICE_CONFIGS[1],getCourseG04L05In010FrameState,CourseG04L05In010Renderer);
