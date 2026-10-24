export interface P030TeachingState {
 readonly modelAlpha:number;readonly shadedTenths:number;readonly outlineAlpha:number;readonly highlightStrip:number|null;readonly tableAlpha:number;readonly decimalAlpha:number;readonly tableNumberAlpha:number;readonly fractionAlpha:number;readonly example:1|5|null;readonly numberBlink:boolean;readonly onesTermAlpha:number;readonly decimalTermAlpha:number;
}
export interface P030TeachingData {readonly animationId:string;readonly sourceSha256:string;readonly states:readonly P030TeachingState[];readonly frames:readonly number[];}
