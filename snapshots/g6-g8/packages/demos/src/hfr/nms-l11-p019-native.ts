import {ButtonObj,MovieClip,TextFieldObj,type Runtime,type DisplayObject} from './display';
import type {LessonTextInstance,TextPresentationSnapshot,LessonTextBinding} from '../lesson-text-contract';
import type {HfrTextIdentity} from './hfr-native-text';
import type {P019PracticeHost} from './nms-l11-p019-practice-host';
import {P019_NATIVE} from './nms-l11-p019-native-binding';
import {P019} from './nms-l11-p019-source-binding';
import {P019_GLOSSARY_INK} from './nms-l11-p019-glossary-ink';

type Matrix=readonly number[];type Box=readonly number[];
const ID=[1,0,0,1,0,0],CX=[256,256,256,256,0,0,0,0],STAGE=[0,0,16000,12000];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const matrix=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const mul=(l:Matrix,r:Matrix)=>[l[0]*r[0]+l[2]*r[1],l[1]*r[0]+l[3]*r[1],l[0]*r[2]+l[2]*r[3],l[1]*r[2]+l[3]*r[3],l[0]*r[4]+l[2]*r[5]+l[4],l[1]*r[4]+l[3]*r[5]+l[5]];
const point=(m:Matrix,x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const transformed=(b:Box,m:Matrix)=>{const ps=[point(m,b[0],b[1]),point(m,b[2],b[1]),point(m,b[0],b[3]),point(m,b[2],b[3])];return[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))]};
const contains=(a:Box,b:Box)=>a[0]<=b[0]&&a[1]<=b[1]&&a[2]>=b[2]&&a[3]>=b[3];
const overlaps=(a:Box,b:Box)=>a[0]<b[2]&&a[1]<b[3]&&a[2]>b[0]&&a[3]>b[1];
const children=(o:DisplayObject):readonly DisplayObject[]=>o instanceof MovieClip?o.sortedChildren():o instanceof ButtonObj?o.stateChildren:[];
const state=(o:DisplayObject)=>JSON.stringify([o.charId,o.depth,o.name,matrix(o),o.cx,o.visible,o.removed,o.scriptMoved,o.ratio,o.clipDepth,(o as any).mask,o instanceof MovieClip?[o.frame,o.playing]:null,o instanceof ButtonObj?[o.state,o.get('enabled')]:null,o instanceof TextFieldObj?[o.html,o.htmlValue,o.textValue,o.border,o.format]:null]);
const globals=(rt:Runtime)=>JSON.stringify(['quizTryCount','quizSection','WrongFeed','global'].map(k=>rt.Global.get(k)??null));
const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(v=>v.toString(16).padStart(2,'0')).join('');
/** Each P019 source mask is a rectangle, but its current world transform can
 * rotate/skew it. Four corners must be inside its actual convex polygon. */
export function p019MaskContainsBox(polygon:readonly (readonly number[])[],box:Box):boolean{
 if(polygon.length!==4||!box.every(Number.isFinite))return false;
 return [[box[0],box[1]],[box[2],box[1]],[box[0],box[3]],[box[2],box[3]]].every(p=>{
  const cross=polygon.map((a,i)=>{const b=polygon[(i+1)%polygon.length];return(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);});
  return cross.every(v=>v>=0)||cross.every(v=>v<=0);
 });
}
/** Conservative visible paint bounds preserve Canvas paint order. They are an
 * ownership guard, not a pixel-fidelity or source-mask approximation. */
function paintBounds(o:DisplayObject,w:Matrix,cx:Matrix,masks:readonly (readonly (readonly number[])[])[]):Box|null{
 const d=o.def,t=(o.ratio??0)/65535,mix=(a:number,b:number)=>a+(b-a)*t,alpha=(a:number)=>a*cx[3]/256+cx[7]>0;
 const fill=(f:any,morph=false):boolean=>Boolean(f&&(f.t==='b'?cx[3]>0:f.t==='s'?alpha(morph?mix(f.c[0][3],f.c[1][3]):f.c[3]):f.s?.some((s:any)=>alpha(morph?mix(s[1][0][3],s[1][1][3]):s[4]))));
 const painted=d.kind==='shape'?d.draws.some((v:any)=>v.path&&(v.fill?fill(v.fill):v.line&&alpha(v.line.c[3]))):d.kind==='morph'?d.fills.some((v:any,i:number)=>d.fillLoops[i]?.length&&fill(v,true))||d.lines.some((v:any,i:number)=>d.lineSegs[i]?.length&&alpha(mix(v.c[0][3],v.c[1][3]))):d.kind==='text'?d.runs.some((r:any)=>r.g?.length&&alpha(r.c?.[3]??255)):d.kind==='edittext'?(Boolean((o as TextFieldObj).textValue||(o as TextFieldObj).htmlValue)&&alpha((o as TextFieldObj).textColor?.[3]??d.color?.[3]??255))||Boolean((o as TextFieldObj).border&&alpha(255)):false;
 if(!painted)return null;
 const b=d.bounds??(d.sb&&d.eb?{xmin:Math.min(d.sb.xmin,d.eb.xmin),ymin:Math.min(d.sb.ymin,d.eb.ymin),xmax:Math.max(d.sb.xmax,d.eb.xmax),ymax:Math.max(d.sb.ymax,d.eb.ymax)}:null);if(!b)return null;
 let box=transformed([b.xmin,b.ymin,b.xmax,b.ymax],w);
 for(const polygon of masks){const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);box=[Math.max(box[0],Math.min(...xs)),Math.max(box[1],Math.min(...ys)),Math.min(box[2],Math.max(...xs)),Math.min(box[3],Math.max(...ys))];}
 return box.every(Number.isFinite)&&box[0]<box[2]&&box[1]<box[3]?box:null;
}
/** Source21 consists of four separate underline strokes. A union bounds box
 * falsely covers the words above the intervening empty regions. Recognize only
 * exact relative m/l stroke syntax; all other paint keeps conservative bounds. */
function lineStrokeBoxes(o:DisplayObject,w:Matrix,cx:Matrix):readonly Box[]|null{
 const d=o.def;if(d.kind!=='shape'||!d.draws.length||d.draws.some((v:any)=>v.fill||!v.line))return null;
 const result:Box[]=[];
 for(const draw of d.draws){
  if(draw.line.c[3]*cx[3]/256+cx[7]<=0)continue;
  const parts=String(draw.path).match(/[ml]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g)??[];
  if(parts.join('')!==String(draw.path).replace(/[\s,]/g,''))return null;
  let x=0,y=0;for(let i=0;i<parts.length;){const cmd=parts[i++];if(!['m','l'].includes(cmd)||i+1>=parts.length)return null;const dx=Number(parts[i++]),dy=Number(parts[i++]);if(!Number.isFinite(dx)||!Number.isFinite(dy))return null;
   const nx=x+dx,ny=y+dy;if(cmd==='l'){const radius=Math.max(1,draw.line.w)/2;result.push(transformed([Math.min(x,nx)-radius,Math.min(y,ny)-radius,Math.max(x,nx)+radius,Math.max(y,ny)+radius],w));}x=nx;y=ny;
  }
 }
 return result;
}
interface Guard{readonly object:DisplayObject;readonly def:unknown;readonly value:string;readonly children:readonly DisplayObject[]}
export interface P019NativeLabel{readonly object:DisplayObject;readonly instance:LessonTextInstance;readonly characterId:number;readonly runIndex:number;readonly text:string;readonly x:number;readonly y:number;readonly linear:readonly number[];readonly glyphOffsetsTwips:readonly number[];readonly fontSizeRem:number;readonly color:readonly number[];readonly fontWeight:400|700;readonly role:string;readonly sourceInk:Box}
export interface P019NativeGlossary{readonly instanceId:string;readonly button:ButtonObj;readonly sourceKey:string;readonly entryId:string;readonly sourceActionSha256:string;readonly label:string;readonly box:Box;readonly wordInk:Box;readonly sourceTextPresentation:'native'|'canvas'}
const issuedNativeFrames=new WeakSet<object>();
export interface P019NativeFrame{readonly kind:'p019-native-frame-v1';readonly runtime:Runtime;readonly root:MovieClip;readonly tick:number;readonly identity:HfrTextIdentity;readonly sourceJson:string;readonly globalState:string;readonly snapshot:TextPresentationSnapshot;readonly labels:readonly P019NativeLabel[];readonly glossary:readonly P019NativeGlossary[];readonly sourceObjects:readonly DisplayObject[];readonly guards:readonly Guard[];readonly title:boolean;readonly sourceRetained:readonly {characterId:number;instance:string;reason:string}[];readonly blocks:readonly string[];readonly leaseCurrent:()=>boolean}

/** P019 owns nested static hint/art text and repeated glossary instances. No
 * P010 HTML feedback contract or first-character-ID lookup is used here. */
export class P019NativePresentation{
 private constructor(readonly runtime:Runtime,private readonly sourceJson:string,private readonly root:MovieClip,private readonly leaseCurrent:()=>boolean){}
 static async prepare(runtime:Runtime,validatedDataSha256:string,leaseCurrent:()=>boolean){
  const root=runtime.page_;
  if(validatedDataSha256!==P019_NATIVE.data.sha256||runtime.page.placement.animationId!==P019.animationId||runtime.page.source.sha256!==P019.source.sha256||await digest(runtime.page)!==P019_NATIVE.candidateJsonSha256)throw Error('P019_NATIVE_SOURCE_BINDING');
  for(const spec of [...P019_NATIVE.definitions,...P019_NATIVE.allFonts,...P019_NATIVE.masks,P019_NATIVE.title])if(await digest(runtime.page.dictionary[spec.characterId])!==spec.definitionSha256)throw Error('P019_NATIVE_DEFINITION_BINDING:'+spec.characterId);
  if(root!==runtime.page_||!leaseCurrent())throw Error('P019_NATIVE_STALE_PREPARATION');
  return new P019NativePresentation(runtime,JSON.stringify(runtime.page),root,leaseCurrent);
 }
 capture(adapter:P019PracticeHost,identity:HfrTextIdentity):P019NativeFrame{
  const rt=this.runtime,root=rt.page_,main=root.children.get(3),view=adapter.snapshot(),feedback=adapter.feedback(),blocks:string[]=[],guards:Guard[]=[],labels:P019NativeLabel[]=[],retained:{characterId:number;instance:string;reason:string}[]=[];
  const candidates:{object:DisplayObject;instance:LessonTextInstance;ink:Box;order:number;title:boolean}[]=[],paints:{object:DisplayObject;order:number;box:Box}[]=[],live=new Map<string,{object:DisplayObject;qualified:boolean;shown:boolean;color:Matrix;world:Matrix;order:number;masks:readonly (readonly (readonly number[])[])[]}>();let order=0;
  if(root!==this.root||!this.leaseCurrent()||!view.current||JSON.stringify(rt.page)!==this.sourceJson)blocks.push('source-or-lease-drift');
  if(!(main instanceof MovieClip)||main.charId!==245)blocks.push('source-main-not-mounted');
  const activeBinding=view.feedback?P019.feedback.find(b=>b.name===view.feedback!.sourceName&&b.characterId===view.feedback!.sourceCharacterId):null;
  const activeFeedback=activeBinding&&main instanceof MovieClip?main.children.get(activeBinding.sourcePlacement.depth):null;
  const placements=new Map<string,any>();
  const sourcePlacement=(parent:MovieClip,depth:number)=>{const key=(parent===root?0:parent.charId)+':'+parent.frame+':'+depth;if(placements.has(key))return placements.get(key);let result:any=null;for(const tags of parent.def.frames.slice(0,parent.frame))for(const tag of tags)if(tag.depth===depth){if(tag.op==='remove')result=null;else if(tag.op==='place')result={...(tag.move?result:{}),...tag};}placements.set(key,result);return result;};
  const visit=(o:DisplayObject,parent:DisplayObject|null,path:LessonTextInstance['path'],world:Matrix,cx:Matrix,visible:boolean,masks:readonly (readonly (readonly number[])[])[],buttonRecord?:any,inheritedQualified=true)=>{
   guards.push({object:o,def:o.def,value:state(o),children:Object.freeze([...children(o)])});
   const paintOrder=order++,w=mul(world,matrix(o)),color=cx.map((v,i)=>i<4?v*o.cx[i]/256:cx[i]+cx[i-4]*o.cx[i]/256),shown=visible&&o.visible&&!o.removed&&(color[3]>0||color[7]>0);let own=[...path],qualified=inheritedQualified;
   if(parent instanceof ButtonObj){if(!buttonRecord||buttonRecord.charId!==o.charId||!same(matrix(o),buttonRecord.m)||!same(o.cx,buttonRecord.cx??CX)||o.scriptMoved)qualified=false;own.push({timelineId:`button-${parent.charId}-${parent.state}`,depth:buttonRecord?.depth??-1,generation:1,characterId:o.charId});}
   else if(parent instanceof MovieClip){
    const timelineId=parent===root?'root':`sprite-${parent.charId}`,timeline=P019_NATIVE.timelines.find(t=>t.timelineId===timelineId),matches=timeline?.instances.filter(i=>i.depth===o.depth&&i.characterId===o.charId&&parent.frame>=i.firstFrame&&parent.frame<i.lastFrameExclusive)??[],source=sourcePlacement(parent,o.depth);
    const selected=P019.feedback.find(b=>b.characterId===o.charId&&b.name===o.name),hostMove=Boolean(selected&&parent===main&&adapter.feedbackSelections.some(s=>s.instanceName===selected.name)&&o.m.tx===100);
    const sourceHintVisibility=Boolean(parent.charId===203&&parent.parentClip===activeFeedback&&view.feedback?.kind==='wrong'&&((o.charId===199&&o.depth===11&&o.visible===(rt.Global.get('quizTryCount')!==1))||(o.charId===202&&o.depth===16&&o.visible===(rt.Global.get('quizTryCount')===1))));
    const sourceAnswerVisibility=Boolean(parent===main&&main instanceof MovieClip&&main.frame===97&&P019.choices.some(c=>c.buttonCharacterId===o.charId&&c.depth===o.depth)&&o.visible===!view.answerLocked);
    if(matches.length!==1||!source||source.charId!==o.charId||!matrix(o).every((n,i)=>hostMove&&i===4?true:n===(source.m??ID)[i])||!same(o.cx,source.cx??CX)||(o.ratio??0)!==(source.ratio??0)||(o.clipDepth??0)!==(source.clipDepth??0)||(o.scriptMoved&&!hostMove&&!sourceHintVisibility&&!sourceAnswerVisibility))qualified=false;
    if(matches.length===1)own.push({timelineId,depth:o.depth,generation:matches[0].generation,characterId:o.charId});
   }else if(parent)qualified=false;
   if(o!==root&&o.def!==rt.page.dictionary[o.charId]||(o as any).mask)qualified=false;
   const instance:LessonTextInstance=Object.freeze({id:own.map(p=>`${p.timelineId}:${p.depth}:${p.generation}:${p.characterId}`).join('/'),path:Object.freeze(own.map(p=>Object.freeze(p)))});
   if(instance.id)live.set(instance.id,{object:o,qualified,shown,color,world:w,order:paintOrder,masks});
   const spec=P019_NATIVE.definitions.find(s=>s.characterId===o.charId),isTitle=o.charId===1&&instance.id===P019_NATIVE.title.instanceId;
   if(spec||isTitle){
    const b=P019_NATIVE.title.boundsTwips,local=spec?.inkBounds?.twips??[b.left,b.top,b.right,b.bottom],ink=transformed(local,w);
    if(shown&&overlaps(STAGE,ink)){
     let reason=!qualified?'source-placement-or-instance-mismatch':color[3]!==256||color[7]!==0?'source-incomplete-opacity':!contains(STAGE,ink)||!masks.every(mask=>p019MaskContainsBox(mask,ink))?'source-ink-partially-clipped':'';
     if(spec&&!P019_NATIVE.nestedTextPaths.some(p=>p.instanceId===instance.id&&p.characterId===o.charId))reason='undeclared-native-instance';
     if(!reason){
      candidates.push({object:o,instance,ink,order:paintOrder,title:isTitle});
      if(spec){const tm=mul(w,spec.textMatrix);spec.runs.forEach((run,runIndex)=>{const first=run.xOffsetsTwips[0]??0,origin=point(tm,first,run.baselineTwips),rgba=run.colorRgba.map((v,i)=>Math.max(0,Math.min(255,v*color[i]/256+color[i+4])));labels.push({object:o,instance,characterId:o.charId,runIndex,text:run.text,x:origin[0]/20,y:origin[1]/20,linear:tm.slice(0,4),glyphOffsetsTwips:run.xOffsetsTwips.map(n=>n-first),fontSizeRem:run.fontHeightTwips/320,color:rgba,fontWeight:run.fontWeight as 400|700,role:spec.role,sourceInk:ink});});}
     }else{retained.push({characterId:o.charId,instance:instance.id,reason});if(reason==='source-placement-or-instance-mismatch'||reason==='undeclared-native-instance')blocks.push(reason+':'+instance.id);}
    }
   }
   if(shown){const lines=lineStrokeBoxes(o,w,color);if(lines)for(const box of lines)paints.push({object:o,order:paintOrder,box});else{const box=paintBounds(o,w,color,masks);if(box)paints.push({object:o,order:paintOrder,box});}}
   if(o instanceof MovieClip){for(const child of o.sortedChildren()){
    if(child.clipDepth)continue;const active=o.sortedChildren().filter(mask=>mask.depth<child.depth&&mask.clipDepth>=child.depth);const nextMasks=[...masks];let masksQualified=true;
    for(const mask of active){guards.push({object:mask,def:mask.def,value:state(mask),children:[]});const source=sourcePlacement(o,mask.depth),spec=P019_NATIVE.masks.find(s=>s.characterId===mask.charId);
     if(!spec||mask.def!==rt.page.dictionary[mask.charId]||!source||source.charId!==mask.charId||!same(matrix(mask),source.m??ID)||!same(mask.cx,source.cx??CX)||mask.clipDepth!==source.clipDepth||mask.scriptMoved||(mask as any).mask){masksQualified=false;if(shown)blocks.push('unqualified-source-mask:'+mask.charId);}
     else nextMasks.push(spec.polygon.map(p=>point(mul(w,matrix(mask)),p[0],p[1])));
    }
    visit(child,o,own,w,color,shown,nextMasks,undefined,qualified&&masksQualified);
   }}else if(o instanceof ButtonObj){const bit=o.state==='up'?1:o.state==='over'?2:4,records=[...o.def.records].sort((a:any,b:any)=>a.depth-b.depth).filter((r:any)=>r.states&bit);o.stateChildren.forEach((child,i)=>visit(child,o,own,w,color,shown,masks,records[i],qualified));}
  };
  visit(root,null,[],ID,CX,true,[]);
  const lifted=new Set(candidates.map(c=>c.object));let changed=true;
  while(changed){changed=false;for(const candidate of candidates)if(lifted.has(candidate.object)){const obstruction=paints.find(p=>p.order>candidate.order&&!lifted.has(p.object)&&overlaps(candidate.ink,p.box));if(obstruction){lifted.delete(candidate.object);changed=true;retained.push({characterId:candidate.object.charId,instance:candidate.instance.id,reason:'later-source-paint:'+obstruction.object.charId});}}}
  const admitted=blocks.length?[]:candidates.filter(c=>lifted.has(c.object)),active=new Set(admitted.map(c=>c.object)),visibleLabels=labels.filter(l=>active.has(l.object)),title=admitted.some(c=>c.title);
  const glossary:P019NativeGlossary[]=blocks.length?[]:P019_NATIVE.controls.flatMap(spec=>{
   const hit=live.get(spec.instanceId),text=live.get(spec.sourceTextInstanceId);if(!hit?.qualified||!hit.shown||hit.color[3]!==256||hit.color[7]!==0||!(hit.object instanceof ButtonObj)||!rt.isClickable(hit.object)||!text?.qualified||!text.shown||text.color[3]!==256||text.color[7]!==0)return[];
   const span=P019_GLOSSARY_INK.find(s=>s.instanceId===spec.instanceId&&s.sourceTextInstanceId===spec.sourceTextInstanceId);if(!span)return[];const wordInk=transformed(span.localInkTwips,text.world);
   if(!contains(STAGE,wordInk)||!text.masks.every(mask=>p019MaskContainsBox(mask,wordInk)))return[];
   const b=hit.object.localBounds();if(!b)return[];const box=transformed([b.xmin,b.ymin,b.xmax,b.ymax],hit.world);if(!contains(STAGE,box)||!hit.masks.every(mask=>p019MaskContainsBox(mask,box)))return[];
   const center=[(box[0]+box[2])/2,(box[1]+box[3])/2];
   // A complete word can remain visible while another run of the same static
   // source text object lies under feedback. Keep that text on Canvas and admit
   // only its exact unobstructed source word/control, never the hidden siblings.
   if(paints.some(p=>p.order>text.order&&p.object!==text.object&&(overlaps(wordInk,p.box)||contains(p.box,[center[0],center[1],center[0],center[1]]))))return[];
   return[{instanceId:spec.instanceId,button:hit.object,sourceKey:spec.sourceKeyAttribute,entryId:spec.dictionaryEntryId,sourceActionSha256:spec.sourceActionSha256,label:spec.label,box,wordInk,sourceTextPresentation:active.has(text.object)?'native' as const:'canvas' as const}];
  });
  const blocksForText=[...(title?[{id:'source-section-title',text:P019_NATIVE.title.text,role:'title' as const,readingOrder:0}]:[]),...admitted.filter(c=>!c.title).map((c,i)=>{const spec=P019_NATIVE.definitions.find(s=>s.characterId===c.object.charId)!;return{id:c.instance.id,text:spec.runs.map(r=>r.text).join(''),role:spec.role==='question'?'question' as const:spec.role.startsWith('feedback')?'feedback' as const:'label' as const,readingOrder:i+1};})].map(b=>({...b,language:'en' as const,visible:true}));
  const snapshot:TextPresentationSnapshot=Object.freeze({schemaVersion:1,animationId:P019.animationId,bindingVersion:P019_NATIVE.binding.version,sourceSwfSha256:P019.source.sha256,status:blocks.length?'blocked':'ready',blockers:Object.freeze(blocks),identity:{frame:main instanceof MovieClip?main.frame:1,frameDomain:'sprite-245',rootFrame:root.frame,scenario:identity.scenario,language:identity.lang,seed:identity.seed,replay:identity.replay},blocks:blocksForText,suppressedInstances:Object.freeze(admitted.map(c=>c.instance))});
  const frame:P019NativeFrame=Object.freeze({kind:'p019-native-frame-v1',runtime:rt,root,tick:rt.tickCount,identity:Object.freeze({...identity}),sourceJson:this.sourceJson,globalState:globals(rt),snapshot,labels:Object.freeze(visibleLabels.map(l=>Object.freeze({...l,linear:Object.freeze([...l.linear]),glyphOffsetsTwips:Object.freeze([...l.glyphOffsetsTwips]),color:Object.freeze([...l.color]),sourceInk:Object.freeze([...l.sourceInk])}))),glossary:Object.freeze(glossary.map(g=>Object.freeze({...g,box:Object.freeze([...g.box]),wordInk:Object.freeze([...g.wordInk])}))),sourceObjects:Object.freeze(admitted.map(c=>c.object)),guards:Object.freeze(guards.map(g=>Object.freeze(g))),title,sourceRetained:Object.freeze(retained.map(r=>Object.freeze(r))),blocks:Object.freeze(blocks),leaseCurrent:this.leaseCurrent});issuedNativeFrames.add(frame);return frame;
 }
}
export function isP019NativeCurrent(frame:P019NativeFrame,rt:Runtime,identity:HfrTextIdentity):boolean{return issuedNativeFrames.has(frame)&&frame.leaseCurrent()&&frame.runtime===rt&&frame.root===rt.page_&&frame.tick===rt.tickCount&&same(frame.identity,identity)&&globals(rt)===frame.globalState&&JSON.stringify(rt.page)===frame.sourceJson&&frame.guards.every(g=>g.object.def===g.def&&state(g.object)===g.value&&children(g.object).length===g.children.length&&children(g.object).every((o,i)=>o===g.children[i]));}
export function p019NativeSnapshot(value:unknown,context:import('../contract').RuntimeContext){const f=value as P019NativeFrame;if(f?.kind!=='p019-native-frame-v1'||f.snapshot.identity.frameDomain!=='sprite-245'||(context.frameDomain!==undefined&&context.frameDomain!==f.snapshot.identity.frameDomain)||(context.rootFrame!==undefined&&context.rootFrame!==f.snapshot.identity.rootFrame)||f.snapshot.identity.frame!==context.frame||!isP019NativeCurrent(f,f.runtime,{lang:context.lang,scenario:context.scenario,seed:context.seed,replay:context.replay??0}))throw Error('P019_CURRENT_NATIVE_FRAME_REQUIRED');return f.snapshot;}
export const P019_NATIVE_BINDING=P019_NATIVE.binding as LessonTextBinding;
