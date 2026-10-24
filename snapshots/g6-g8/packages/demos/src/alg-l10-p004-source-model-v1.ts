export type AlgL10P004Matrix=readonly [number,number,number,number,number,number];
export type AlgL10P004Point=readonly [number,number];
export type AlgL10P004Event=readonly [number,number,number,number?,(number|null)?,(AlgL10P004Matrix|null)?,(number|null)?,(number|null)?,string?,(number|null)?];
export interface AlgL10P004SourceModel {
 readonly animationId:string;readonly sourceSha256:string;readonly title:string;readonly courseTitle:string;readonly activityTitle:string;
 readonly fps:number;readonly rootFrameCount:number;readonly rootEntryFrame:number;readonly mainFrameDomain:string;readonly mainFrameCount:number;readonly backgroundColor:string;readonly assetRoot:string;
 readonly domains:Readonly<Record<string,{readonly frames:number;readonly events:readonly AlgL10P004Event[]}>>;
 readonly shapes:Readonly<Record<string,{readonly width:number;readonly height:number;readonly x:number;readonly y:number;readonly sha256:string;readonly bytes:number}>>;
 readonly inlineShapes:Readonly<Record<string,{readonly role:'source-line'|'frame-with-title-suppressed';readonly paths:readonly {readonly d:string;readonly paint:Readonly<Record<string,string|number>>}[];readonly sourceTagSha256:string;readonly derivativeSha256:string;readonly sourceStrokeWidthTwips?:number;readonly displayStrokeWidth?:number;readonly displayStrokePolicy?:string}>>;
 readonly morphs:Readonly<Record<string,{readonly paths:readonly {readonly start:readonly (string|number)[];readonly end:readonly (string|number)[];readonly paint:Readonly<Record<string,string|number>>}[];readonly derivativeSha256:string;readonly geometryEvidence:string}>>;
 readonly masks:Readonly<Record<string,{readonly start:readonly AlgL10P004Point[];readonly end:readonly AlgL10P004Point[];readonly policy:string}>>;
 readonly texts:Readonly<Record<string,{readonly text:string;readonly sourceTagSha256:string;readonly bounds:{readonly left:number;readonly right:number;readonly top:number;readonly bottom:number};readonly runs:readonly {readonly text:string;readonly x:number;readonly y:number;readonly size:number;readonly advance:number;readonly color:readonly number[];readonly sourceFontId:number}[]}>>;
 readonly buttons:Readonly<Record<string,{readonly term:string;readonly hitShape:number;readonly sourceHitOnly:boolean;readonly sourceAction:readonly string[];readonly entry:{readonly [key:string]:unknown;readonly id:string;readonly labels:Readonly<Record<string,string>>;readonly definitions:Readonly<Record<string,string>>}}>>;
 readonly titleSuppression:{readonly rootDepths:readonly number[];readonly sourceTextId:number;readonly reason:string;readonly compositeTitleShape:{readonly characterId:number;readonly rootDepth:number;readonly suppressedPathIndices:readonly number[];readonly preservedPathIndices:readonly number[];readonly reason:string}};
 readonly claimBoundary:{readonly preparedOnly:boolean;readonly runtimeObserved:boolean;readonly nativeAudioReady:boolean;readonly registered:boolean};
}
