import {NMS_L02_P015_IR as IR} from './generated/nms-l02-p015-source-ir-v1';
import type {P015Matrix,P015Color,P015Pose,P015VisibleText} from './nms-l02-p015-source-contract-v1';
const IDENTITY:P015Matrix=[1,0,0,1,0,0],IDENTITY_COLOR:P015Color=[1,1,1,1,0,0,0,0];
function freeze<T>(value:T):T {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(IR);
export interface P015Mask {readonly characterId:number;readonly matrix:P015Matrix;readonly ratio:number;readonly key:string;readonly depth:number;readonly clipDepth:number;}
export interface P015Node extends P015Pose {readonly instancePath:string;readonly domain:string;readonly domainFrame:number;readonly masks:readonly P015Mask[];}
export interface P015FrameState {readonly animationId:string;readonly sourceSha256:string;readonly frame:number;readonly frameDomain:'root'|'sprite-47';readonly rootFrame:number;readonly mainFrame:number|null;readonly seed:number;readonly replay:number;readonly language:'en'|'es';readonly nodes:readonly P015Node[];readonly visibleTexts:readonly P015VisibleText[];}
export function p015Multiply(a:P015Matrix,b:P015Matrix):P015Matrix {return Object.freeze([a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]);}
/** Local-domain source query. Root and main47 are the only authored timeline domains. */
export function getNmsL2P015DomainPoses(domain:string,frame:number):readonly P015Pose[] {
 const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;
 if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('NMS_L2_P015_INVALID_DOMAIN_QUERY');
 return Object.freeze(d.frames[frame-1]!.map(index=>IR.poses[index]!));
}
export function getNmsL2P015FrameState(frame:number,context:{frameDomain?:string;seed:number;replay?:number;lang:'en'|'es'}):P015FrameState {
 const domain=context.frameDomain??'sprite-47',max=domain==='root'?10:domain==='sprite-47'?336:0;
 if(!['en','es'].includes(context.lang)||!Number.isSafeInteger(frame)||frame<1||frame>max||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('NMS_L2_P015_INVALID_FRAME_IDENTITY');
 const rootFrame=domain==='root'?frame:6,mainFrame=domain==='root'?(frame>=6?frame-5:null):frame,nodes:P015Node[]=[];
 function visit(name:string,localFrame:number,parent:P015Matrix,parentColor:P015Color,inherited:readonly P015Mask[],prefix:string):void {
  const masks:P015Mask[]=[];
  for(const p of getNmsL2P015DomainPoses(name,localFrame)){
   const matrix=p015Multiply(parent,p.matrix),color=Object.freeze(p.color.map((v,i)=>i<4?v*parentColor[i]!:v*parentColor[i-4]!+parentColor[i]!)) as unknown as P015Color;
   const instancePath=prefix+'/d'+p.depth+'g'+p.generation+'c'+p.characterId;
   const active=Object.freeze([...inherited,...masks.filter(m=>p.depth>m.depth&&p.depth<=m.clipDepth)]);
   if(p.clipDepth>0){masks.push(Object.freeze({characterId:p.characterId,matrix,ratio:p.ratio,key:instancePath+'f'+localFrame,depth:p.depth,clipDepth:p.clipDepth}));continue;}
   const child=IR.domains[String(p.characterId)];
   if(child){const nextFrame=p.characterId===Number(IR.mainDomain)?mainFrame!:(localFrame-p.birthFrame)%child.frameCount+1;visit(String(p.characterId),nextFrame,matrix,color,active,instancePath+'/sprite-'+p.characterId);}
   else nodes.push(Object.freeze({...p,matrix,color,instancePath,domain:name,domainFrame:localFrame,masks:active}));
  }
 }
 visit('root',rootFrame,IDENTITY,IDENTITY_COLOR,[],'root:'+rootFrame);
 const visibleTexts=mainFrame===null?Object.freeze([]):IR.visibilityStates[IR.visibilityFrames[mainFrame-1]!]!;
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame,frameDomain:domain as 'root'|'sprite-47',rootFrame,mainFrame,seed:context.seed,replay:context.replay??0,language:context.lang,nodes:Object.freeze(nodes),visibleTexts});
}
/** The source main47 loops. The modern host presents one complete cycle, then
 * holds the final teaching state. These are deliberately separate contracts. */
export const P015_STOP_SECONDS = 336 / 12;
function validTime(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('NMS_L2_P015_INVALID_TIME');}
export function p015SourceFrameAtMilliseconds(ms:number):number {validTime(ms);return Math.floor(ms*12/1000)%336+1;}
export function p015FrameAtMilliseconds(ms:number):number {validTime(ms);return Math.min(Math.floor(ms*12/1000)+1,336);}
