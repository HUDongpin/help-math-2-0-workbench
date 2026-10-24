import {NMS_L02_P017_IR as IR} from './generated/nms-l02-p017-source-ir-v1';
import type {P017Matrix,P017Color,P017Pose,P017VisibleText} from './nms-l02-p017-source-contract-v1';
const IDENTITY:P017Matrix=[1,0,0,1,0,0],IDENTITY_COLOR:P017Color=[1,1,1,1,0,0,0,0];
function freeze<T>(value:T):T {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
freeze(IR);
export interface P017Mask {readonly characterId:number;readonly matrix:P017Matrix;readonly ratio:number;readonly key:string;readonly depth:number;readonly clipDepth:number;}
export interface P017Node extends P017Pose {readonly instancePath:string;readonly domain:string;readonly domainFrame:number;readonly masks:readonly P017Mask[];}
export interface P017FrameState {readonly animationId:string;readonly sourceSha256:string;readonly frame:number;readonly frameDomain:'root'|'sprite-73';readonly rootFrame:number;readonly mainFrame:number|null;readonly seed:number;readonly replay:number;readonly language:'en'|'es';readonly nodes:readonly P017Node[];readonly visibleTexts:readonly P017VisibleText[];}
export function p017Multiply(a:P017Matrix,b:P017Matrix):P017Matrix {return Object.freeze([a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]);}
/** Local-domain source query. Root and main73 are the only authored timeline domains. */
export function getNmsL2P017DomainPoses(domain:string,frame:number):readonly P017Pose[] {
 const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;
 if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('NMS_L2_P017_INVALID_DOMAIN_QUERY');
 return Object.freeze(d.frames[frame-1]!.map(index=>IR.poses[index]!));
}
export function getNmsL2P017FrameState(frame:number,context:{frameDomain?:string;seed:number;replay?:number;lang:'en'|'es'}):P017FrameState {
 const domain=context.frameDomain??'sprite-73',max=domain==='root'?10:domain==='sprite-73'?331:0;
 if(!['en','es'].includes(context.lang)||!Number.isSafeInteger(frame)||frame<1||frame>max||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('NMS_L2_P017_INVALID_FRAME_IDENTITY');
 const rootFrame=domain==='root'?frame:6,mainFrame=domain==='root'?(frame>=6?frame-5:null):frame,nodes:P017Node[]=[];
 function visit(name:string,localFrame:number,parent:P017Matrix,parentColor:P017Color,inherited:readonly P017Mask[],prefix:string):void {
  const masks:P017Mask[]=[];
  for(const p of getNmsL2P017DomainPoses(name,localFrame)){
   const matrix=p017Multiply(parent,p.matrix),color=Object.freeze(p.color.map((v,i)=>i<4?v*parentColor[i]!:v*parentColor[i-4]!+parentColor[i]!)) as unknown as P017Color;
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
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame,frameDomain:domain as 'root'|'sprite-73',rootFrame,mainFrame,seed:context.seed,replay:context.replay??0,language:context.lang,nodes:Object.freeze(nodes),visibleTexts});
}
/** The source main73 loops. The modern host presents one complete cycle, then
 * holds the final teaching state. These are deliberately separate contracts. */
export const P017_STOP_SECONDS = 331 / 12;
function validTime(ms:number){if(!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('NMS_L2_P017_INVALID_TIME');}
export function p017SourceFrameAtMilliseconds(ms:number):number {validTime(ms);return Math.floor(ms*12/1000)%331+1;}
export function p017FrameAtMilliseconds(ms:number):number {validTime(ms);return Math.min(Math.floor(ms*12/1000)+1,331);}
