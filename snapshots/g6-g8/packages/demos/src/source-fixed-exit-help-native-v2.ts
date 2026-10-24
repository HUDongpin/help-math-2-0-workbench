import type {
  FixedExitFractionAnswerV1, FixedExitNativeSourceV1, FixedExitNativeVisualV1,
} from './source-fixed-exit-help-native-v1';

/** Currency values remain authored strings; 0.10 must not become 0.1. */
export type FixedExitAnswerIdentityV2 = Pick<FixedExitFractionAnswerV1,
  'answer'|'letter'|'instance'|'characterId'|'letterId'|'equationIds'|'wrongFirst'|'wrongLater'>;
export type FixedExitCurrencyAnswerV2 = FixedExitAnswerIdentityV2 & {
  readonly valueKind: 'currency-rate';
  readonly sourceTextId: string;
  readonly amount: string;
  readonly currency: 'USD';
  readonly unit: 'minute';
  readonly display: string;
};
export type FixedExitAnswerV2 = FixedExitCurrencyAnswerV2 |
  (Omit<FixedExitFractionAnswerV1, 'denominator'> & {readonly denominator:string|null});
export type FixedExitNativeVisualV2<T extends string> =
  Omit<FixedExitNativeVisualV1<T>, 'overlayShapeIds'> & {readonly overlayShapeIds?:readonly number[]};
export type FixedExitNativeSourceV2<T extends string,I extends number,M extends number,V extends FixedExitNativeVisualV2<T>> =
  Omit<FixedExitNativeSourceV1<T,I,M,V & {readonly overlayShapeIds:readonly number[]}>, 'answers'|'visualStates'> & {
    readonly answers:readonly FixedExitAnswerV2[];
    readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:V}[];
  };
