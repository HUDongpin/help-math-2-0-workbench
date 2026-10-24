export type P022Matrix=readonly[number,number,number,number,number,number];
export interface P022Pose{readonly depth:number;readonly characterId:number;readonly birthFrame:number;readonly generation:number;readonly matrix:P022Matrix;readonly color:readonly number[];readonly ratio:number;readonly clipDepth:number;readonly name:string|null;}
export interface P022AudioSource{readonly domain:string;readonly frames:number;readonly sourceBytes:number;readonly sourceSha256:string;readonly decodedSamples:number;readonly pcmSha256:string;readonly latencySamples:number;readonly firstBlockFrame:number;readonly outputStartSample:number;readonly outputEndSample:number;readonly totalSamples:number;readonly sampleRate:number;readonly channels:number;readonly sourceFormat:number;}
export interface P022TextRun{readonly sourceTextId:string;readonly text:string;readonly color:readonly number[];readonly fontSize:number;}
export interface P022MorphAttribute{readonly attribute:string;readonly start:string;readonly end:string;}
export interface P022SourceData{readonly sourceSha256:string;readonly fps:12;readonly rootEntry:6;readonly mainDomain:'206';readonly poses:readonly P022Pose[];readonly domains:Readonly<Record<string,{readonly frameCount:number;readonly frames:readonly(readonly number[])[]}>>;readonly texts:Readonly<Record<string,{readonly kind:string;readonly runs:readonly P022TextRun[]}>>;readonly audio:Readonly<Record<string,P022AudioSource>>;readonly teaching:readonly P022TeachingRow[];readonly terms:readonly P022SourceTerm[];readonly maskGeometry:Readonly<Record<string,readonly{readonly d:string;readonly fillRule:string;readonly morph:readonly P022MorphAttribute[]}[]>>;}
export interface P022ArtShape{readonly characterId:number;readonly body:string;readonly morphs:readonly{readonly pathIndex:number;readonly attributes:readonly P022MorphAttribute[]}[];readonly elementMorphs:readonly{readonly selector:string;readonly elementIndex:number;readonly attributes:readonly P022MorphAttribute[]}[];readonly elementTransforms:readonly{readonly selector:string;readonly elementIndex:number;readonly transforms:readonly(P022MorphAttribute&{readonly type:string;readonly additive:string})[]}[];}
export interface P022ArtData{readonly art:Readonly<Record<string,P022ArtShape>>;readonly images:readonly{readonly id:string;readonly uri:string;readonly width:number;readonly height:number}[];readonly suppressedShapeIds:readonly number[];}

export interface P022TeachingRow {
 readonly frame:number;
 readonly question:readonly {readonly sourceTextId:string;readonly text:string;readonly complete:boolean}[];
 readonly circleAlpha:number;readonly helpVisible:boolean;readonly helpEmphasis:boolean;readonly helpEmphasisReduced:boolean;
 readonly choices:readonly {readonly index:number;readonly alpha:number}[];
 readonly selectedHighlight:boolean;readonly totalHighlight:boolean;
 readonly numeratorEmphasis:boolean;readonly denominatorEmphasis:boolean;readonly fractionEmphasis:boolean;
 readonly numeratorEmphasisReduced:boolean;readonly denominatorEmphasisReduced:boolean;readonly fractionEmphasisReduced:boolean;
}
export interface P022SourceTerm {
 readonly id:string;readonly sourceKeyAttribute:string;
 readonly source:Readonly<Record<'en'|'es',{readonly sha256:string}>>;
 readonly labels:Readonly<Record<'en'|'es',string>>;readonly definitions:Readonly<Record<'en'|'es',string>>;
}
