import {NMS_L02_P006_IR as IR} from './generated/nms-l02-p006-source-ir-v1';
import type {P006Matrix,P006Color,P006Pose,P006VisibleText} from './nms-l02-p006-source-contract-v1';
const IDENTITY:P006Matrix=[1,0,0,1,0,0],IDENTITY_COLOR:P006Color=[1,1,1,1,0,0,0,0];
function freeze<T>(value:T):T {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(IR);
export interface P006Mask {readonly characterId:number;readonly matrix:P006Matrix;readonly ratio:number;readonly key:string;readonly depth:number;readonly clipDepth:number;}
export interface P006Node extends P006Pose {readonly instancePath:string;readonly domain:string;readonly domainFrame:number;readonly masks:readonly P006Mask[];}
export interface P006FrameState {readonly animationId:string;readonly sourceSha256:string;readonly frame:number;readonly frameDomain:'root'|'sprite-54';readonly rootFrame:number;readonly mainFrame:number|null;readonly seed:number;readonly replay:number;readonly language:'en'|'es';readonly nodes:readonly P006Node[];readonly visibleTexts:readonly P006VisibleText[];}
export function p006Multiply(a:P006Matrix,b:P006Matrix):P006Matrix {return Object.freeze([a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]);}
/** Local-domain source query. Child30/57 queries have no invented root placement. */
export function getNmsL2P006DomainPoses(domain:string,frame:number):readonly P006Pose[] {
 const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;
 if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('NMS_L2_P006_INVALID_DOMAIN_QUERY');
 return Object.freeze(d.frames[frame-1]!.map(index=>IR.poses[index]!));
}
export function getNmsL2P006FrameState(frame:number,context:{frameDomain?:string;seed:number;replay?:number;lang:'en'|'es'}):P006FrameState {
 const domain=context.frameDomain??'sprite-54',max=domain==='root'?10:domain==='sprite-54'?153:0;
 if(!['en','es'].includes(context.lang)||!Number.isSafeInteger(frame)||frame<1||frame>max||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('NMS_L2_P006_INVALID_FRAME_IDENTITY');
 const rootFrame=domain==='root'?frame:6,mainFrame=domain==='root'?(frame>=6?frame-5:null):frame,nodes:P006Node[]=[];
 function visit(name:string,localFrame:number,parent:P006Matrix,parentColor:P006Color,inherited:readonly P006Mask[],prefix:string):void {
  const masks:P006Mask[]=[];
  for(const p of getNmsL2P006DomainPoses(name,localFrame)){
   const matrix=p006Multiply(parent,p.matrix),color=Object.freeze(p.color.map((v,i)=>i<4?v*parentColor[i]!:v*parentColor[i-4]!+parentColor[i]!)) as unknown as P006Color;
   const instancePath=prefix+'/d'+p.depth+'g'+p.generation+'c'+p.characterId;
   const active=Object.freeze([...inherited,...masks.filter(m=>p.depth>m.depth&&p.depth<=m.clipDepth)]);
   if(p.clipDepth>0){masks.push(Object.freeze({characterId:p.characterId,matrix,ratio:p.ratio,key:instancePath+'f'+localFrame,depth:p.depth,clipDepth:p.clipDepth}));continue;}
   const child=IR.domains[String(p.characterId)];
   if(child){const nextFrame=p.characterId===54?mainFrame!:(localFrame-p.birthFrame)%child.frameCount+1;visit(String(p.characterId),nextFrame,matrix,color,active,instancePath+'/sprite-'+p.characterId);}
   else nodes.push(Object.freeze({...p,matrix,color,instancePath,domain:name,domainFrame:localFrame,masks:active}));
  }
 }
 visit('root',rootFrame,IDENTITY,IDENTITY_COLOR,[],'root:'+rootFrame);
 const visibleTexts=mainFrame===null?Object.freeze([]):IR.visibilityStates[IR.visibilityFrames[mainFrame-1]!]!;
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame,frameDomain:domain as 'root'|'sprite-54',rootFrame,mainFrame,seed:context.seed,replay:context.replay??0,language:context.lang,nodes:Object.freeze(nodes),visibleTexts});
}
/** Main sprite54 has an authored stop at153. Two child30 loops remain source-live; whole-scene hold is the modern host completion policy. */
export const P006_STOP_SECONDS = 152 / 12;
export function p006FrameAtMilliseconds(ms:number):number {
 if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('NMS_L2_P006_INVALID_TIME');
 return Math.min(Math.floor(ms*12/1000)+1,153);
}
