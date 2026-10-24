import type {FixedExitNativeSourceV1,FixedExitLetterV1} from './source-fixed-exit-help-native-v1';
import type {FixedExitAnswerIdentityV2,FixedExitNativeVisualV2} from './source-fixed-exit-help-native-v2';
/** Source identity and native accessible display shared by equations and graph choices. */
export type FixedExitDisplayAnswerV3=FixedExitAnswerIdentityV2 & {readonly display:string;readonly valueKind:'linear-equation'|'graph';};
export type FixedExitEquationAnswerV3=FixedExitDisplayAnswerV3 & {readonly valueKind:'linear-equation';readonly sourceAtoms:readonly {readonly characterId:number;readonly depth:number;readonly text:string}[];};
export type FixedExitGraphAnswerV3=FixedExitDisplayAnswerV3 & {readonly valueKind:'graph';readonly graph:FixedExitLetterV1;};
export type FixedExitNativeSourceV3<T extends string,I extends number,M extends number,V extends FixedExitNativeVisualV2<T>,A extends FixedExitDisplayAnswerV3=FixedExitDisplayAnswerV3>=
 Omit<FixedExitNativeSourceV1<T,I,M,V & {readonly overlayShapeIds:readonly number[]}>, 'answers'|'visualStates'> & {
  readonly answers:readonly A[];readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:V}[];
 };
