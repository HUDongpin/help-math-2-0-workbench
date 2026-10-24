export interface P032TeachingState {
 readonly primaryGridCharacter:number;readonly primaryShaded:number;
 readonly secondaryGridCharacter:number|null;readonly secondaryShaded:number|null;
 readonly wholeOutline:boolean;readonly cellOutlines:boolean;
 readonly primaryNumerator:1|5|null;readonly primaryDecimalAlpha:number;readonly primaryFractionAlpha:number;
 readonly primaryTableNumberAlpha:number;readonly primaryBlink:boolean;readonly secondaryBlink:boolean;
 readonly comparison:boolean;readonly sourceResize:boolean;
}
export interface P032TeachingData {readonly animationId:string;readonly sourceSha256:string;readonly states:readonly P032TeachingState[];readonly frames:readonly number[];}
