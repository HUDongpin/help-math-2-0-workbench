import {ButtonObj,MovieClip,TextFieldObj,type Runtime,type DisplayObject} from './display';
import type {LessonTextInstance,TextPresentationSnapshot,LessonTextBinding} from '../lesson-text-contract';
import type {HfrTextIdentity} from './hfr-native-text';
import type {P009PracticeHost} from './nms-l11-p009-practice-host';
import {P009_NATIVE} from './nms-l11-p009-native-binding';
import {P009} from './nms-l11-p009-source-binding';

type Matrix=readonly number[];type Box=readonly number[];
const ID=[1,0,0,1,0,0],CX=[256,256,256,256,0,0,0,0];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const m=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const mul=(l:Matrix,r:Matrix)=>[l[0]*r[0]+l[2]*r[1],l[1]*r[0]+l[3]*r[1],l[0]*r[2]+l[2]*r[3],l[1]*r[2]+l[3]*r[3],l[0]*r[4]+l[2]*r[5]+l[4],l[1]*r[4]+l[3]*r[5]+l[5]];
const point=(m:Matrix,x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const transformed=(b:Box,m:Matrix)=>{const ps=[point(m,b[0],b[1]),point(m,b[2],b[1]),point(m,b[0],b[3]),point(m,b[2],b[3])];return[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]};
const contains=(a:Box,b:Box)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
const overlaps=(a:Box,b:Box)=>a[0]<b[2]&&a[1]<b[3]&&a[2]>b[0]&&a[3]>b[1];
const children=(o:DisplayObject)=>o instanceof MovieClip?o.sortedChildren():o instanceof ButtonObj?o.stateChildren:[];
const state=(o:DisplayObject)=>JSON.stringify([o.charId,o.depth,m(o),o.cx,o.visible,o.removed,o.scriptMoved,o.ratio,o.clipDepth,(o as any).mask,o instanceof MovieClip?[o.frame,o.playing]:null,o instanceof ButtonObj?o.state:null,o instanceof TextFieldObj?[o.html,o.htmlValue,o.textValue,o.border,o.format]:null]);
const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(v=>v.toString(16).padStart(2,'0')).join('');
export interface P009NativeLabel{readonly object:DisplayObject;readonly instance:LessonTextInstance;readonly characterId:number;readonly text:string;readonly x:number;readonly y:number;readonly linear:readonly number[];readonly fontSizeRem:number;readonly color:readonly number[];readonly opacity:number;readonly fontWeight:400|700;readonly role:string;readonly sourceInk:Box}
interface Guard{readonly object:DisplayObject;readonly def:unknown;readonly value:string;readonly children:readonly DisplayObject[]}
export interface P009NativeFrame{readonly kind:'p009-native-frame-v1';readonly runtime:Runtime;readonly root:MovieClip;readonly tick:number;readonly identity:HfrTextIdentity;readonly sourceJson:string;readonly snapshot:TextPresentationSnapshot;readonly labels:readonly P009NativeLabel[];readonly sourceObjects:readonly DisplayObject[];readonly guards:readonly Guard[];readonly title:boolean;readonly prompt:boolean;readonly feedback:boolean;readonly sourceRetained:readonly {characterId:number;instance:string;reason:string}[];readonly blocks:readonly string[]}

export class P009NativePresentation{
 private constructor(readonly runtime:Runtime,private readonly sourceJson:string){}
 static async prepare(runtime:Runtime,validatedDataSha256:string){
  if(validatedDataSha256!==P009_NATIVE.dataSha256||runtime.page.placement.animationId!==P009.animationId||runtime.page.source.sha256!==P009.source.sha256||await digest(runtime.page)!==P009_NATIVE.candidateJsonSha256)throw Error('P009_NATIVE_EXACT_DATA_REQUIRED');
  for(const spec of [...P009_NATIVE.definitions,P009_NATIVE.title,P009_NATIVE.mask,...P009_NATIVE.allFonts])if(await digest(runtime.page.dictionary[spec.characterId])!==spec.definitionSha256)throw Error('P009_NATIVE_SOURCE_DEFINITION_DRIFT');
  return new P009NativePresentation(runtime,JSON.stringify(runtime.page));
 }
 capture(adapter:P009PracticeHost,identity:HfrTextIdentity):P009NativeFrame{
  const rt=this.runtime,root=rt.page_,main=root.children.get(4),blocks:string[]=[],guards:Guard[]=[],labels:P009NativeLabel[]=[],sourceObjects:DisplayObject[]=[],instances:LessonTextInstance[]=[],retained:{characterId:number;instance:string;reason:string}[]=[];let title=false,prompt=false,feedback=false;
  const view=adapter.feedback();
  if(!adapter.snapshot().current||!(main instanceof MovieClip)||main.charId!==221||JSON.stringify(rt.page)!==this.sourceJson)blocks.push('source-or-lease-drift');
  const placements=new Map<string,any>();
  const sourcePlacement=(parent:MovieClip,depth:number)=>{
   const id=parent===root?0:parent.charId,key=id+':'+parent.frame+':'+depth;if(placements.has(key))return placements.get(key);
   let result:any=null;for(const tags of parent.def.frames.slice(0,parent.frame))for(const tag of tags)if(tag.depth===depth){if(tag.op==='remove')result=null;else if(tag.op==='place')result={...(tag.move?result:{}),...tag};}
   placements.set(key,result);return result;
  };
  const visit=(o:DisplayObject,parent:DisplayObject|null,path:LessonTextInstance['path'],world:Matrix,cx:Matrix,visible:boolean,masks:readonly Box[],buttonRecord?:any,inheritedQualified=true)=>{
   guards.push({object:o,def:o.def,value:state(o),children:Object.freeze([...children(o)])});
   const w=mul(world,m(o)),color=cx.map((v,i)=>i<4?v*o.cx[i]/256:cx[i]+cx[i-4]*o.cx[i]/256),shown=visible&&o.visible&&!o.removed&&(color[3]>0||color[7]>0);let own=[...path],qualified=inheritedQualified;
   if(parent){
    if(parent instanceof ButtonObj){
     if(!buttonRecord||buttonRecord.charId!==o.charId||!same(m(o),buttonRecord.m)||!same(o.cx,buttonRecord.cx??CX))qualified=false;
     own.push({timelineId:`button-${parent.charId}-${parent.state}`,depth:buttonRecord?.depth??-1,generation:1,characterId:o.charId});
    }else if(parent instanceof MovieClip){
     const timelineId=parent===root?'root':`sprite-${parent.charId}`,timeline=P009_NATIVE.timelines.find(t=>t.timelineId===timelineId),matches=timeline?.instances.filter(i=>i.depth===o.depth&&i.characterId===o.charId&&parent.frame>=i.firstFrame&&parent.frame<i.lastFrameExclusive)??[],source=sourcePlacement(parent,o.depth);
     const allowedHostMove=P009.feedback.some(b=>b.characterId===o.charId&&b.name===o.name)&&adapter.feedbackSelections.some(s=>s.instanceName===o.name)&&o.m.tx===100;
     if(matches.length!==1||!source||source.charId!==o.charId||!m(o).every((n,i)=>allowedHostMove&&i===4?true:n===(source.m??ID)[i])||!same(o.cx,source.cx??CX)||(o.ratio??0)!==(source.ratio??0)||(o.clipDepth??0)!==(source.clipDepth??0)||(o.scriptMoved&&!allowedHostMove))qualified=false;
     if(matches.length===1)own.push({timelineId,depth:o.depth,generation:matches[0].generation,characterId:o.charId});
    }else qualified=false;
   }
   if(o.def!==rt.page.dictionary[o.charId]&&o!==root)qualified=false;
   if((o as any).mask)qualified=false;
   const instance={id:own.map(p=>`${p.timelineId}:${p.depth}:${p.generation}:${p.characterId}`).join('/'),path:Object.freeze(own)};
   const spec=P009_NATIVE.definitions.find(t=>t.characterId===o.charId),isTitle=o.charId===3;
   if(spec||isTitle){
    const local=(isTitle?P009_NATIVE.title.inkBounds:spec?.inkBounds)??[o.def.bounds?.xmin,o.def.bounds?.ymin,o.def.bounds?.xmax,o.def.bounds?.ymax],ink=transformed(local,w),inside=contains([0,0,16000,12000],ink)&&masks.every(mask=>contains(mask,ink));
    if(shown&&overlaps([0,0,16000,12000],ink)){
     let reason=qualified?'':'source-placement-or-instance-mismatch';if((isTitle||spec?.characterId===7||spec?.characterId===48)&&color[3]!==256)reason='source-incomplete-opacity';if(!inside)reason='source-ink-partially-clipped';
     if(spec?.characterId===48){if(!view||view.close.popup!==o.parentClip||view.links[0]?.text!==o)reason='feedback-html-not-at-authored-interaction-stop';}
     if(!reason){
      if(isTitle)title=true;else if(spec?.characterId===7)prompt=true;else if(spec?.characterId===48)feedback=true;
      else{
       if(spec?.runs.length!==1)reason='unsupported-label-run-count';
       else{const run=spec.runs[0],tm=mul(w,o.def.m??ID),origin=point(tm,o.def.runs[0].g[0]?.[1]??0,run.y),rgba=run.color.map((v,i)=>Math.max(0,Math.min(255,v*color[i]/256+color[i+4])));labels.push({object:o,instance,characterId:o.charId,text:run.text,x:origin[0]/20,y:origin[1]/20,linear:tm.slice(0,4),fontSizeRem:run.height/320,color:rgba,opacity:rgba[3]/255,fontWeight:run.fontWeight as 400|700,role:spec.role,sourceInk:ink});}
      }
      if(!reason){sourceObjects.push(o);instances.push(instance);}
     }
     if(reason){retained.push({characterId:o.charId,instance:instance.id,reason});if(reason==='source-placement-or-instance-mismatch')blocks.push(reason+':'+instance.id);}
    }
   }
   if(o instanceof MovieClip){
    for(const child of o.sortedChildren()){
     if(child.clipDepth)continue;
     const active=o.sortedChildren().filter(mask=>mask.depth<child.depth&&mask.clipDepth>=child.depth);let nextMasks=[...masks];
     for(const mask of active){guards.push({object:mask,def:mask.def,value:state(mask),children:[]});const source=sourcePlacement(o,mask.depth);
      if(mask.charId!==88||mask.def!==rt.page.dictionary[88]||!source||!same(m(mask),source.m)||mask.clipDepth!==source.clipDepth||mask.scriptMoved)blocks.push('unqualified-source-mask');
      else nextMasks.push(transformed(P009_NATIVE.mask.bounds,mul(w,m(mask))));
     }
     visit(child,o,own,w,color,shown,nextMasks,undefined,qualified);
    }
   }else if(o instanceof ButtonObj){const bit=o.state==='up'?1:o.state==='over'?2:4,records=[...o.def.records].sort((a:any,b:any)=>a.depth-b.depth).filter((r:any)=>r.states&bit);o.stateChildren.forEach((child,i)=>visit(child,o,own,w,color,shown,masks,records[i],qualified));}
  };
  visit(root,null,[],ID,CX,true,[]);
  const active=blocks.length?[]:sourceObjects,activeInstances=blocks.length?[]:instances;
  const nativeBlocks=[...(title?[{id:'source-section-title',text:P009_NATIVE.title.text,role:'title' as const,readingOrder:0}]:[]),...(prompt?[{id:'source-text-7',text:P009.prompt,role:'question' as const,readingOrder:1}]:[]),...labels.map((l,i)=>({id:l.instance.id,text:l.text,role:'label' as const,readingOrder:i+2})),...(feedback?[{id:'source-text-48',text:view!.tokens.map(t=>t.text).join(''),role:'feedback' as const,readingOrder:100}]:[])].map(b=>({...b,language:'en' as const,visible:true}));
  const snapshot:TextPresentationSnapshot=Object.freeze({schemaVersion:1,animationId:P009.animationId,bindingVersion:P009_NATIVE.binding.version,sourceSwfSha256:P009.source.sha256,status:blocks.length?'blocked':'ready',blockers:Object.freeze(blocks),identity:{frame:main instanceof MovieClip?main.frame:1,frameDomain:'sprite-221',rootFrame:root.frame,scenario:identity.scenario,language:identity.lang,seed:identity.seed,replay:identity.replay},blocks:blocks.length?[]:nativeBlocks,suppressedInstances:Object.freeze(activeInstances)});
  return Object.freeze({kind:'p009-native-frame-v1',runtime:rt,root,tick:rt.tickCount,identity:{...identity},sourceJson:this.sourceJson,snapshot,labels:blocks.length?[]:labels,sourceObjects:active,guards,title:!blocks.length&&title,prompt:!blocks.length&&prompt,feedback:!blocks.length&&feedback,sourceRetained:retained,blocks});
 }
}
export function isP009NativeCurrent(frame:P009NativeFrame,rt:Runtime,identity:HfrTextIdentity){return frame.runtime===rt&&frame.root===rt.page_&&frame.tick===rt.tickCount&&same(frame.identity,identity)&&JSON.stringify(rt.page)===frame.sourceJson&&frame.guards.every(g=>g.object.def===g.def&&state(g.object)===g.value&&sameRefs(children(g.object),g.children));}
function sameRefs(a:readonly DisplayObject[],b:readonly DisplayObject[]){return a.length===b.length&&a.every((o,i)=>o===b[i]);}
export function suppressP009Native(frame:P009NativeFrame|null,rt:Runtime,object:DisplayObject,identity:HfrTextIdentity){return Boolean(frame?.snapshot.status==='ready'&&isP009NativeCurrent(frame,rt,identity)&&frame.sourceObjects.includes(object));}
export function p009NativeSnapshot(state:unknown,context:import('../contract').RuntimeContext){const f=state as P009NativeFrame;if(f?.kind!=='p009-native-frame-v1'||f.snapshot.identity.frame!==context.frame||!isP009NativeCurrent(f,f.runtime,{lang:context.lang,scenario:context.scenario,seed:context.seed,replay:context.replay??0}))throw Error('P009_CURRENT_NATIVE_FRAME_REQUIRED');return f.snapshot;}
export const P009_NATIVE_BINDING=P009_NATIVE.binding as LessonTextBinding;
