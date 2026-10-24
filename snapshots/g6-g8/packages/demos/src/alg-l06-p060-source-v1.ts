import {P060_NATIVE_SOURCE} from './generated/alg-l06-p060-native-v1';
import {P060_AUDIO_SOURCE} from './generated/alg-l06-p060-measured-v1';

export type P060Choice = 'A' | 'B' | 'C' | 'D';
export interface P060QuestionData {
  readonly id: number;
  readonly questionFrame: number;
  readonly reviewFrame: number;
  readonly promptTextId: number;
  readonly sourcePrompt: string;
  readonly promptBefore: string;
  readonly promptAfter: string;
  readonly formula: null | Readonly<{plain?: string; prefix?: string; numerator?: string; denominator?: string; suffix?: string; inline?: boolean; sourceTextIds: readonly number[]}>;
  readonly table: null | Readonly<{headers: readonly string[]; headerTextIds: readonly number[]; rows: readonly (readonly Readonly<{value: string; textId: number}>[])[]}>;
  readonly graph: null | Readonly<{
    viewBox: readonly number[];
    shapes: readonly Readonly<{shapeId: number; matrix: readonly number[]; paths: readonly Readonly<Record<string, string>>[]}>[];
    labels: readonly Readonly<{text: string; textId: number; center: readonly number[]; align: 'center' | 'y-tick' | 'x-tick'}>[];
    semanticKind: string;
  }>;
  readonly options: readonly Readonly<{letter: string; value: string; textId: number; correct: boolean; sourceInstance: string; reviewInstance: string}>[];
  readonly answerKey: string;
}
export const p060Questions: readonly P060QuestionData[] = P060_NATIVE_SOURCE.questions;
export function p060Question(id: number): P060QuestionData {
  const question = p060Questions.find(q => q.id === id);
  if (!question) throw Error('P060_QUESTION');
  return question;
}

export type P060AudioAsset = (typeof P060_AUDIO_SOURCE.assets)[number];
export function p060AudioAsset(question: number, language: 'en' | 'es', choice: P060Choice | null): P060AudioAsset {
  const asset = P060_AUDIO_SOURCE.assets.find(a => a.question === question && a.language === language && a.choice === choice);
  if (!asset) throw Error('P060_AUDIO_BINDING');
  return asset;
}
