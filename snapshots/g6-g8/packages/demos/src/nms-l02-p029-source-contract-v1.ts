export type P029EmphasisTarget='ones-value'|'ones-label'|'decimal-point-label'|'decimal-point-value'|'tenths-label'|'tenths-value'|'hundredths-label'|'hundredths-value';
export interface P029TeachingState {
  readonly tableAlpha:number;
  readonly placeValueAlpha:number;
  readonly highlightCell:readonly[number,number]|null;
  readonly reducedMotionCell:readonly[number,number]|null;
  readonly placeValueBlink:boolean;
  readonly emphasisTargets:readonly P029EmphasisTarget[];
}
export interface P029TeachingData {
  readonly animationId:string;
  readonly sourceSha256:string;
  readonly rootFrames:number;
  readonly mainFrames:number;
  readonly fps:number;
  readonly rootEntry:number;
  readonly shadedCells:readonly(readonly[number,number])[];
  readonly states:readonly P029TeachingState[];
  readonly frames:readonly number[];
  readonly textInstanceStates:readonly (readonly (readonly[number,number,number])[])[];
  readonly textInstanceFrames:readonly number[];
}
