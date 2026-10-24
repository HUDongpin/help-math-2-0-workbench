import {ButtonObj,MovieClip,TextFieldObj,type Runtime,type DisplayObject} from './display';
import type {LessonTextInstance,TextPresentationSnapshot,LessonTextBinding} from '../lesson-text-contract';
import type {HfrTextIdentity} from './hfr-native-text';
import type {P010PracticeHost} from './nms-l11-p010-practice-host';
import {P010_NATIVE} from './nms-l11-p010-native-binding';
import {P010} from './nms-l11-p010-source-binding';

type Matrix=readonly number[];type Box=readonly number[];
const ID=[1,0,0,1,0,0],CX=[256,256,256,256,0,0,0,0];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const m=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const mul=(l:Matrix,r:Matrix)=>[l[0]*r[0]+l[2]*r[1],l[1]*r[0]+l[3]*r[1],l[0]*r[2]+l[2]*r[3],l[1]*r[2]+l[3]*r[3],l[0]*r[4]+l[2]*r[5]+l[4],l[1]*r[4]+l[3]*r[5]+l[5]];
const point=(m:Matrix,x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const transformed=(b:Box,m:Matrix)=>{const ps=[point(m,b[0],b[1]),point(m,b[2],b[1]),point(m,b[0],b[3]),point(m,b[2],b[3])];return[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]};
const contains=(a:Box,b:Box)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
const overlaps=(a:Box,b:Box)=>a[0]<b[2]&&a[1]<b[3]&&a[2]>b[0]&&a[3]>b[1];
/** Conservative visible-leaf bounds only decide native ownership. Exact holes,
 * source masks, gradients and partial alpha stay with the existing Canvas paint. */
function feedbackLeafBounds(o:DisplayObject,w:Matrix,cx:Matrix,masks:readonly (readonly (readonly number[])[])[]):Box|null{
 const d=o.def,t=(o.ratio??0)/65535,mix=(a:number,b:number)=>a+(b-a)*t,alpha=(a:number)=>a*cx[3]/256+cx[7]>0;
 const fill=(f:any,morph=false):boolean=>Boolean(f&&(f.t==='b'?cx[3]>0:f.t==='s'?alpha(morph?mix(f.c[0][3],f.c[1][3]):f.c[3]):f.s?.some((s:any)=>alpha(morph?mix(s[1][0][3],s[1][1][3]):s[4]))));
 const painted=d.kind==='shape'?d.draws.some((draw:any)=>draw.path&&(draw.fill?fill(draw.fill):draw.line&&alpha(draw.line.c[3]))):
  d.kind==='morph'?d.fills.some((f:any,i:number)=>d.fillLoops[i]?.length&&fill(f,true))||d.lines.some((l:any,i:number)=>d.lineSegs[i]?.length&&alpha(mix(l.c[0][3],l.c[1][3]))):
  d.kind==='text'?d.runs.some((r:any)=>r.g?.length&&alpha(r.c?.[3]??255)):
  d.kind==='edittext'?(Boolean((o as TextFieldObj).textValue||(o as TextFieldObj).htmlValue)&&alpha((o as TextFieldObj).textColor?.[3]??d.color?.[3]??255))||Boolean((o as TextFieldObj).border&&alpha(255)):false;
 if(!painted)return null;
 const b=d.bounds??(d.sb&&d.eb?{xmin:Math.min(d.sb.xmin,d.eb.xmin),ymin:Math.min(d.sb.ymin,d.eb.ymin),xmax:Math.max(d.sb.xmax,d.eb.xmax),ymax:Math.max(d.sb.ymax,d.eb.ymax)}:null);if(!b)return null;
 let box=transformed([b.xmin,b.ymin,b.xmax,b.ymax],w);for(const polygon of masks){const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);box=[Math.max(box[0],Math.min(...xs)),Math.max(box[1],Math.min(...ys)),Math.min(box[2],Math.max(...xs)),Math.min(box[3],Math.max(...ys))];}
 return box.every(Number.isFinite)&&box[0]<box[2]&&box[1]<box[3]?box:null;
}

/** Conservative full-ink box containment in the exact two source mask polygons.
 * Mask27 has notches: its bounding rectangle is not a valid clipping oracle. */
export function p010MaskContainsBox(polygon:readonly (readonly number[])[],box:Box):boolean{
 const inside=(x:number,y:number)=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i],cross=(x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
  if(cross===0&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1]))return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
 }return hit;};
 if(![[box[0],box[1]],[box[2],box[1]],[box[0],box[3]],[box[2],box[3]]].every(p=>inside(p[0],p[1])))return false;
 // A concave boundary can enter the box even when all four corners are inside.
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],cuts=[0,1];
  for(const [axis,edge]of [[0,box[0]],[0,box[2]],[1,box[1]],[1,box[3]]]){
   const delta=b[axis]-a[axis];if(delta!==0){const t=(edge-a[axis])/delta;if(t>0&&t<1)cuts.push(t);}
  }
  cuts.sort((x,y)=>x-y);for(let j=1;j<cuts.length;j++){const t=(cuts[j-1]+cuts[j])/2,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   if(x>box[0]&&x<box[2]&&y>box[1]&&y<box[3])return false;
  }
 }
 return true;
}
const children=(o:DisplayObject)=>o instanceof MovieClip?o.sortedChildren():o instanceof ButtonObj?o.stateChildren:[];
const state=(o:DisplayObject)=>JSON.stringify([o.charId,o.depth,m(o),o.cx,o.visible,o.removed,o.scriptMoved,o.ratio,o.clipDepth,(o as any).mask,o instanceof MovieClip?[o.frame,o.playing]:null,o instanceof ButtonObj?o.state:null,o instanceof TextFieldObj?[o.html,o.htmlValue,o.textValue,o.border,o.format]:null]);
const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(v=>v.toString(16).padStart(2,'0')).join('');
export interface P010NativeLabel{readonly object:DisplayObject;readonly instance:LessonTextInstance;readonly characterId:number;readonly text:string;readonly x:number;readonly y:number;readonly linear:readonly number[];readonly fontSizeRem:number;readonly color:readonly number[];readonly opacity:number;readonly fontWeight:400|700;readonly role:string;readonly sourceInk:Box}
interface Guard{readonly object:DisplayObject;readonly def:unknown;readonly value:string;readonly children:readonly DisplayObject[]}
export interface P010NativeFrame{readonly kind:'p010-native-frame-v1';readonly runtime:Runtime;readonly root:MovieClip;readonly tick:number;readonly identity:HfrTextIdentity;readonly sourceJson:string;readonly snapshot:TextPresentationSnapshot;readonly labels:readonly P010NativeLabel[];readonly sourceObjects:readonly DisplayObject[];readonly guards:readonly Guard[];readonly title:boolean;readonly prompt:boolean;readonly feedback:boolean;readonly sourceRetained:readonly {characterId:number;instance:string;reason:string}[];readonly blocks:readonly string[]}

export class P010NativePresentation{
 private constructor(readonly runtime:Runtime,private readonly sourceJson:string){}
 static async prepare(runtime:Runtime,validatedDataSha256:string){
  if(validatedDataSha256!==P010_NATIVE.dataSha256||runtime.page.placement.animationId!==P010.animationId||runtime.page.source.sha256!==P010.source.sha256||await digest(runtime.page)!==P010_NATIVE.candidateJsonSha256)throw Error('P010_NATIVE_EXACT_DATA_REQUIRED');
  for(const spec of [...P010_NATIVE.definitions,P010_NATIVE.title,...P010_NATIVE.masks,...P010_NATIVE.allFonts])if(await digest(runtime.page.dictionary[spec.characterId])!==spec.definitionSha256)throw Error('P010_NATIVE_SOURCE_DEFINITION_DRIFT');
  return new P010NativePresentation(runtime,JSON.stringify(runtime.page));
 }
 capture(adapter:P010PracticeHost,identity:HfrTextIdentity):P010NativeFrame{
  const rt=this.runtime,root=rt.page_,main=root.children.get(4),blocks:string[]=[],guards:Guard[]=[],labels:P010NativeLabel[]=[],sourceObjects:DisplayObject[]=[],instances:LessonTextInstance[]=[],retained:{characterId:number;instance:string;reason:string}[]=[];let title=false,prompt=false,feedback=false;
  const view=adapter.feedback(),feedbackState=adapter.snapshot().feedback;
  const activeFeedback=feedbackState&&main instanceof MovieClip?main.children.get(P010.feedback.find(b=>b.name===feedbackState.sourceName&&b.characterId===feedbackState.sourceCharacterId)!.sourcePlacement.depth):null;
  const feedbackPaints:{object:DisplayObject;order:number;box:Box}[]=[],paintOrder=new Map<DisplayObject,number>();let nextOrder=0;
  if(!adapter.snapshot().current||!(main instanceof MovieClip)||main.charId!==204||JSON.stringify(rt.page)!==this.sourceJson)blocks.push('source-or-lease-drift');
  const placements=new Map<string,any>();
  const sourcePlacement=(parent:MovieClip,depth:number)=>{
   const id=parent===root?0:parent.charId,key=id+':'+parent.frame+':'+depth;if(placements.has(key))return placements.get(key);
   let result:any=null;for(const tags of parent.def.frames.slice(0,parent.frame))for(const tag of tags)if(tag.depth===depth){if(tag.op==='remove')result=null;else if(tag.op==='place')result={...(tag.move?result:{}),...tag};}
   placements.set(key,result);return result;
  };
  const visit=(o:DisplayObject,parent:DisplayObject|null,path:LessonTextInstance['path'],world:Matrix,cx:Matrix,visible:boolean,masks:readonly (readonly (readonly number[])[])[],buttonRecord?:any,inheritedQualified=true)=>{
   guards.push({object:o,def:o.def,value:state(o),children:Object.freeze([...children(o)])});
   paintOrder.set(o,nextOrder++);
   const w=mul(world,m(o)),color=cx.map((v,i)=>i<4?v*o.cx[i]/256:cx[i]+cx[i-4]*o.cx[i]/256),shown=visible&&o.visible&&!o.removed&&(color[3]>0||color[7]>0);let own=[...path],qualified=inheritedQualified;
   if(parent){
    if(parent instanceof ButtonObj){
     if(!buttonRecord||buttonRecord.charId!==o.charId||!same(m(o),buttonRecord.m)||!same(o.cx,buttonRecord.cx??CX))qualified=false;
     own.push({timelineId:`button-${parent.charId}-${parent.state}`,depth:buttonRecord?.depth??-1,generation:1,characterId:o.charId});
    }else if(parent instanceof MovieClip){
     const timelineId=parent===root?'root':`sprite-${parent.charId}`,timeline=P010_NATIVE.timelines.find(t=>t.timelineId===timelineId),matches=timeline?.instances.filter(i=>i.depth===o.depth&&i.characterId===o.charId&&parent.frame>=i.firstFrame&&parent.frame<i.lastFrameExclusive)??[],source=sourcePlacement(parent,o.depth);
     const allowedHostMove=P010.feedback.some(b=>b.characterId===o.charId&&b.name===o.name)&&adapter.feedbackSelections.some(s=>s.instanceName===o.name)&&o.m.tx===100;
     if(matches.length!==1||!source||source.charId!==o.charId||!m(o).every((n,i)=>allowedHostMove&&i===4?true:n===(source.m??ID)[i])||!same(o.cx,source.cx??CX)||(o.ratio??0)!==(source.ratio??0)||(o.clipDepth??0)!==(source.clipDepth??0)||(o.scriptMoved&&!allowedHostMove))qualified=false;
     if(matches.length===1)own.push({timelineId,depth:o.depth,generation:matches[0].generation,characterId:o.charId});
    }else qualified=false;
   }
   if(o.def!==rt.page.dictionary[o.charId]&&o!==root)qualified=false;
   if((o as any).mask)qualified=false;
   const instance={id:own.map(p=>`${p.timelineId}:${p.depth}:${p.generation}:${p.characterId}`).join('/'),path:Object.freeze(own)};
   const spec=P010_NATIVE.definitions.find(t=>t.characterId===o.charId),isTitle=o.charId===3;
   if(spec||isTitle){
    const local=(isTitle?P010_NATIVE.title.inkBounds:spec?.inkBounds)??[o.def.bounds?.xmin,o.def.bounds?.ymin,o.def.bounds?.xmax,o.def.bounds?.ymax],ink=transformed(local,w),inside=contains([0,0,16000,12000],ink)&&masks.every(mask=>p010MaskContainsBox(mask,ink));
    if(shown&&overlaps([0,0,16000,12000],ink)){
     let reason=qualified?'':'source-placement-or-instance-mismatch';if((isTitle||spec?.characterId===7||spec?.characterId===45)&&color[3]!==256)reason='source-incomplete-opacity';if(!inside)reason='source-ink-partially-clipped';
     if(spec?.characterId===45){if(!view||view.close.popup!==o.parentClip||view.links[0]?.text!==o)reason='feedback-html-not-at-authored-interaction-stop';}
     if(!reason){
      if(isTitle)title=true;else if(spec?.characterId===7)prompt=true;else if(spec?.characterId===45)feedback=true;
      else{
       if(spec?.runs.length!==1)reason='unsupported-label-run-count';
       else{const run=spec.runs[0],tm=mul(w,o.def.m??ID),origin=point(tm,o.def.runs[0].g[0]?.[1]??0,run.y),rgba=run.color.map((v,i)=>Math.max(0,Math.min(255,v*color[i]/256+color[i+4])));labels.push({object:o,instance,characterId:o.charId,text:run.text,x:origin[0]/20,y:origin[1]/20,linear:tm.slice(0,4),fontSizeRem:run.height/320,color:rgba,opacity:rgba[3]/255,fontWeight:run.fontWeight as 400|700,role:spec.role,sourceInk:ink});}
      }
      if(!reason){sourceObjects.push(o);instances.push(instance);}
     }
     if(reason){retained.push({characterId:o.charId,instance:instance.id,reason});if(reason==='source-placement-or-instance-mismatch')blocks.push(reason+':'+instance.id);}
    }
   }
   let inActiveFeedback=false;for(let ancestor:DisplayObject|null=o;ancestor&&ancestor!==root;ancestor=ancestor.parentClip)if(ancestor===activeFeedback){inActiveFeedback=true;break;}
   if(inActiveFeedback&&['shape','morph','text','edittext'].includes(o.def.kind)){
    if(!qualified)blocks.push('unqualified-active-feedback-paint:'+instance.id);
    else if(shown){const box=feedbackLeafBounds(o,w,color,masks);if(box)feedbackPaints.push({object:o,order:paintOrder.get(o)!,box});}
   }
   if(o instanceof MovieClip){
    for(const child of o.sortedChildren()){
     if(child.clipDepth)continue;
     const active=o.sortedChildren().filter(mask=>mask.depth<child.depth&&mask.clipDepth>=child.depth);let nextMasks=[...masks];
     for(const mask of active){guards.push({object:mask,def:mask.def,value:state(mask),children:[]});const source=sourcePlacement(o,mask.depth);
      const spec=P010_NATIVE.masks.find(item=>item.characterId===mask.charId);
      if(!spec||mask.def!==rt.page.dictionary[mask.charId]||!source||!same(m(mask),source.m)||mask.clipDepth!==source.clipDepth||mask.scriptMoved)blocks.push('unqualified-source-mask');
      else nextMasks.push(spec.polygon.map(p=>point(mul(w,m(mask)),p[0],p[1])));
     }
     visit(child,o,own,w,color,shown,nextMasks,undefined,qualified);
    }
   }else if(o instanceof ButtonObj){const bit=o.state==='up'?1:o.state==='over'?2:4,records=[...o.def.records].sort((a:any,b:any)=>a.depth-b.depth).filter((r:any)=>r.states&bit);o.stateChildren.forEach((child,i)=>visit(child,o,own,w,color,shown,masks,records[i],qualified));}
  };
  visit(root,null,[],ID,CX,true,[]);
  // Only lower main-question labels cross the selected feedback sibling. Other
  // native roles/feedback words keep their existing qualified mask policy.
  const lifted=new Set(sourceObjects),retainedQuestion=new Set<DisplayObject>();
  for(const label of labels)if(label.object.parentClip===main&&[13,15,16,18,19].includes(label.characterId)){
   const paint=feedbackPaints.find(p=>p.order>paintOrder.get(label.object)!&&!lifted.has(p.object)&&overlaps(label.sourceInk,p.box));
   if(paint){retainedQuestion.add(label.object);retained.push({characterId:label.characterId,instance:label.instance.id,reason:'later-active-feedback-source-paint:'+paint.object.charId});}
  }
  const visibleLabels=labels.filter(label=>!retainedQuestion.has(label.object));
  const active=blocks.length?[]:sourceObjects.filter(o=>!retainedQuestion.has(o)),activeInstances=blocks.length?[]:instances.filter((_,i)=>!retainedQuestion.has(sourceObjects[i]));
  const nativeBlocks=[...(title?[{id:'source-section-title',text:P010_NATIVE.title.text,role:'title' as const,readingOrder:0}]:[]),...(prompt?[{id:'source-text-7',text:P010.prompt.text,role:'question' as const,readingOrder:1}]:[]),...visibleLabels.map((l,i)=>({id:l.instance.id,text:l.text,role:'label' as const,readingOrder:i+2})),...(feedback?[{id:'source-text-45',text:view!.tokens.map(t=>t.text).join(''),role:'feedback' as const,readingOrder:100}]:[])].map(b=>({...b,language:'en' as const,visible:true}));
  const snapshot:TextPresentationSnapshot=Object.freeze({schemaVersion:1,animationId:P010.animationId,bindingVersion:P010_NATIVE.binding.version,sourceSwfSha256:P010.source.sha256,status:blocks.length?'blocked':'ready',blockers:Object.freeze(blocks),identity:{frame:main instanceof MovieClip?main.frame:1,frameDomain:'sprite-204',rootFrame:root.frame,scenario:identity.scenario,language:identity.lang,seed:identity.seed,replay:identity.replay},blocks:blocks.length?[]:nativeBlocks,suppressedInstances:Object.freeze(activeInstances)});
  return Object.freeze({kind:'p010-native-frame-v1',runtime:rt,root,tick:rt.tickCount,identity:{...identity},sourceJson:this.sourceJson,snapshot,labels:blocks.length?[]:visibleLabels,sourceObjects:active,guards,title:!blocks.length&&title,prompt:!blocks.length&&prompt,feedback:!blocks.length&&feedback,sourceRetained:retained,blocks});
 }
}
export function isP010NativeCurrent(frame:P010NativeFrame,rt:Runtime,identity:HfrTextIdentity){return frame.runtime===rt&&frame.root===rt.page_&&frame.tick===rt.tickCount&&same(frame.identity,identity)&&JSON.stringify(rt.page)===frame.sourceJson&&frame.guards.every(g=>g.object.def===g.def&&state(g.object)===g.value&&sameRefs(children(g.object),g.children));}
function sameRefs(a:readonly DisplayObject[],b:readonly DisplayObject[]){return a.length===b.length&&a.every((o,i)=>o===b[i]);}
export function suppressP010Native(frame:P010NativeFrame|null,rt:Runtime,object:DisplayObject,identity:HfrTextIdentity){return Boolean(frame?.snapshot.status==='ready'&&isP010NativeCurrent(frame,rt,identity)&&frame.sourceObjects.includes(object));}
export function p010NativeSnapshot(state:unknown,context:import('../contract').RuntimeContext){const f=state as P010NativeFrame;if(f?.kind!=='p010-native-frame-v1'||f.snapshot.identity.frame!==context.frame||!isP010NativeCurrent(f,f.runtime,{lang:context.lang,scenario:context.scenario,seed:context.seed,replay:context.replay??0}))throw Error('P010_CURRENT_NATIVE_FRAME_REQUIRED');return f.snapshot;}
export const P010_NATIVE_BINDING=P010_NATIVE.binding as LessonTextBinding;
