export type P001Matrix=readonly[number,number,number,number,number,number];
export interface P001Pose{readonly depth:number;readonly characterId:number;readonly matrix:P001Matrix;readonly alpha:number;readonly sourcePlacementFrame:number;}
export interface P001Glyph{readonly text:string;readonly sourceRunId:string;readonly fontId:number;readonly x:number;readonly y:number;readonly size:number;readonly bold:boolean;readonly color:readonly[number,number,number,number];}
export interface P001Text{readonly characterId:number;readonly sourceTextId:string;readonly matrix:P001Matrix;readonly glyphs:readonly P001Glyph[];}
export interface P001Shape{readonly characterId:number;readonly sourceTagSha256:string;readonly x:number;readonly y:number;readonly width:number;readonly height:number;readonly sourceSvgSha256:string;readonly svgDataUri:string;}
export interface P001SourceIR{readonly schemaVersion:1;readonly animationId:string;readonly sourceSha256:string;
 readonly runtime:Readonly<{width:800;height:600;fps:12;rootFrames:10;entryRootFrame:6;mainFrames:136;rootPlacement:P001Matrix}>;
 readonly frames:readonly(readonly P001Pose[])[];readonly child112:readonly P001Pose[];readonly texts:readonly P001Text[];readonly shapes:readonly P001Shape[];
 readonly sourceInputs:readonly Readonly<{path:string;bytes:number;sha256:string}>[];}
