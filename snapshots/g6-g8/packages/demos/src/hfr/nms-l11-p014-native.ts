import {ButtonObj,MovieClip,type Runtime,type DisplayObject} from './display';
import type {TextPresentationSnapshot,LessonTextInstance,LessonTextBinding} from '../lesson-text-contract';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import type {HfrTextIdentity} from './hfr-native-text';
import type {P014PracticeHost} from './nms-l11-p014-practice-host';
import {P014_NATIVE as N} from './nms-l11-p014-native-binding';
type Matrix=readonly number[];type Box=readonly[number,number,number,number];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),matrix=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const mul=(a:Matrix,b:Matrix)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m:Matrix,x:number,y:number)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const box=(b:{xmin:number;ymin:number;xmax:number;ymax:number},m:Matrix):Box=>{const ps=[[b.xmin,b.ymin],[b.xmax,b.ymin],[b.xmin,b.ymax],[b.xmax,b.ymax]].map(p=>point(m,...p as[number,number]));return[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))];};
const overlap=(a:Box,b:Box)=>a[0]<b[2]&&a[1]<b[3]&&a[2]>b[0]&&a[3]>b[1];
const children=(o:DisplayObject):readonly DisplayObject[]=>o instanceof MovieClip?o.sortedChildren():o instanceof ButtonObj?o.stateChildren:[];
function enabled(o:DisplayObject):unknown{let item:typeof o|null=o;for(let i=0;item&&i<32;i++,item=item.proto as typeof o|null){const p=item.props.get('enabled');if(p)return p.getter?'unread-getter':typeof p.v==='boolean'?p.v:p.v===undefined?null:'nonboolean';}return null;}
const state=(o:DisplayObject)=>JSON.stringify([o.charId,o.name,o.depth,matrix(o),o.cx,o.visible,o.removed,o.scriptMoved,o.ratio,o.clipDepth,enabled(o),o instanceof MovieClip?[o.frame,o.playing]:null,o instanceof ButtonObj?o.state:null]);
const digest=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(v=>v.toString(16).padStart(2,'0')).join('');
const world=(o:DisplayObject)=>{const m=o.worldMatrix();return[m.a,m.b,m.c,m.d,m.tx,m.ty];};
function colorTransform(o:DisplayObject):number[]{const chain:DisplayObject[]=[];for(let p:DisplayObject|null=o;p;p=p.parentClip)chain.unshift(p);let c=[256,256,256,256,0,0,0,0];for(const p of chain)c=c.map((v,i)=>i<4?v*p.cx[i]/256:c[i]+c[i-4]*p.cx[i]/256);return c;}
function masked(o:DisplayObject):boolean{for(let child:DisplayObject|null=o;child?.parentClip;child=child.parentClip){if((child as unknown as{mask?:unknown}).mask)return true;const p=child.parentClip;if(p.sortedChildren().some(s=>s.depth<child!.depth&&s.clipDepth>=child!.depth))return true;}return false;}
function painted(o:DisplayObject):boolean{if(!o.ancestorsVisible()||o.clipDepth)return false;const c=colorTransform(o),alpha=(a:number)=>a*c[3]/256+c[7]>0,d=o.def;if(d.kind==='text')return d.runs.some((r:{g:unknown[];c:number[]})=>r.g.length&&alpha(r.c[3]));if(d.kind==='shape')return d.draws.some((r:{fill?:{t:string;c?:number[]};line?:{c:number[]}})=>r.fill?r.fill.t==='s'?alpha(r.fill.c?.[3]??0):c[3]>0:Boolean(r.line&&alpha(r.line.c[3])));return ['morph','bitmap','edittext'].includes(d.kind)&&c[3]>0;}
interface Guard{readonly object:DisplayObject;readonly definition:unknown;readonly stamp:string;readonly children:readonly DisplayObject[];readonly mask:unknown;readonly paintMatrix:Matrix}
export interface P014NativeLabel{readonly object:DisplayObject;readonly instance:LessonTextInstance;readonly characterId:number;readonly text:string;readonly card:'source'|'target';readonly pair:number;readonly sourceGlyphOffsetsTwips:readonly number[];readonly x:number;readonly y:number;readonly linear:readonly number[];readonly fontSizeRem:number;readonly color:readonly number[];readonly sourceBounds:Box}
export interface P014NativeFrame{readonly kind:'p014-live-seven-pair-card-native-frame-v1';readonly coverage:'seven-pair-card-labels-only';readonly runtime:Runtime;readonly root:MovieClip;readonly tick:number;readonly identity:HfrTextIdentity;readonly snapshot:TextPresentationSnapshot;readonly labels:readonly P014NativeLabel[];readonly sourceObjects:readonly DisplayObject[];readonly guards:readonly Guard[];readonly retained:readonly {card:string;reason:string}[];readonly target1MissingFractionBarPreserved:true}
/** Source-bound projection of the seven card pairs only. Each capture reads live positions, including the
 * source-authorized moved card. No Runtime state or source paint is changed. */
export class P014NativePresentation{
 private readonly frames=new WeakSet<object>();
 private active:P014NativeFrame|null=null;
 private constructor(readonly runtime:Runtime,private readonly adapter:P014PracticeHost,private readonly sourceJson:string){}
 static async prepare(runtime:Runtime,adapter:P014PracticeHost,validatedDataSha256:string){
  if(validatedDataSha256!==N.dataSha256||runtime.page.placement.animationId!==N.animationId||runtime.page.source.sha256!==N.sourceSha256||await digest(runtime.page)!==N.candidateJsonSha256)throw Error('P014_NATIVE_EXACT_DATA_REQUIRED');
  for(const d of[...N.definitions,...N.cards,N.font])if(await digest(runtime.page.dictionary[d.characterId])!==d.definitionSha256)throw Error('P014_NATIVE_DEFINITION_DRIFT');
  validateLessonTextBinding(N.binding as LessonTextBinding);if(!adapter.current())throw Error('P014_NATIVE_CURRENT_LEASE_REQUIRED');return new P014NativePresentation(runtime,adapter,JSON.stringify(runtime.page));
 }
 capture(identity:HfrTextIdentity):P014NativeFrame{
  if(this.active&&this.current(this.active,identity))return this.active;
  const rt=this.runtime,root=rt.page_,main=this.adapter.main(),guards:Guard[]=[],scene:DisplayObject[]=[],paintMatrices=new Map<DisplayObject,Matrix>(),retained:{card:string;reason:string}[]=[],labels:P014NativeLabel[]=[],blocks:string[]=[];
  // Renderer.drawClip(shell) starts in the stage plane; state children inherit the button's accumulated matrix, even though parentClip points at the main clip.
  const visit=(o:DisplayObject,parentPaint:Matrix)=>{const list=Object.freeze([...children(o)]),paintMatrix=Object.freeze(mul(parentPaint,matrix(o)));paintMatrices.set(o,paintMatrix);guards.push({object:o,definition:o.def,stamp:state(o),children:list,mask:(o as unknown as{mask?:unknown}).mask,paintMatrix});scene.push(o);list.forEach(child=>visit(child,paintMatrix));};visit(root,[1,0,0,1,0,0]);if(root.parentClip)guards.push({object:root.parentClip,definition:root.parentClip.def,stamp:state(root.parentClip),children:Object.freeze([...children(root.parentClip)]),mask:(root.parentClip as unknown as{mask?:unknown}).mask,paintMatrix:Object.freeze([1,0,0,1,0,0])});
  if(!['en','es'].includes(identity.lang)||!identity.scenario||!Number.isSafeInteger(identity.seed)||!Number.isSafeInteger(identity.replay)||identity.replay<0)blocks.push('incomplete-runtime-identity');
  if(!this.adapter.current()||JSON.stringify(rt.page)!==this.sourceJson)blocks.push('source-or-lease-drift');
  if(!main||root.frame!==6||main.frame!==228||!same(matrix(main),N.main.matrix))blocks.push('outside-bounded-seven-pair-card-state');
  if(main&&!blocks.length)for(const spec of N.cards){
   const card:DisplayObject|undefined=main.children.get(spec.depth);let reason='';
   if(!(card instanceof MovieClip)||card.charId!==spec.characterId||card.name!==spec.name||card.def!==rt.page.dictionary[spec.characterId]||card.parentClip!==main||card.removed||card.frame!==1)reason='source-card-instance';
   if(reason){retained.push({card:spec.role,reason});continue;}const live=card as MovieClip,position=matrix(live);
   if(!position.every(Number.isFinite)||!same(position.slice(0,4),spec.authoredMatrix.slice(0,4))||(!live.scriptMoved&&!same(position,spec.authoredMatrix))||(spec.role==='target'&&!same(position,spec.authoredMatrix)))reason='source-card-transform';
   const c=colorTransform(live);if(!live.ancestorsVisible()||c[3]<=0){retained.push({card:spec.role,reason:'source-hidden-or-alpha-zero'});continue;}
   if(masked(live))reason='source-mask-retained';
   const group:P014NativeLabel[]=[];
   for(const t of spec.texts){const o=live.children.get(t.depth),d=N.definitions.find(d=>d.characterId===t.characterId)!;
    if(!o||o.charId!==t.characterId||o.parentClip!==live||o.def!==rt.page.dictionary[t.characterId]||o.removed||o.scriptMoved||!same(matrix(o),t.placement.m)||masked(o)){reason='source-text-instance';continue;}
    const w=world(o),bounds=box(d.inkBoundsTwips,w);if(bounds[0]<0||bounds[1]<0||bounds[2]>16000||bounds[3]>12000){reason='source-text-outside-stage';continue;}
    const sourceClearance=(other:DisplayObject)=>N.sourceInkClearances.some(c=>o.charId===c.textCharacterId&&other.charId===c.shapeCharacterId&&other.parentClip===live&&other.depth===c.shapePlacement.depth&&other.def===rt.page.dictionary[c.shapeCharacterId]&&!other.scriptMoved&&same(matrix(other),c.shapePlacement.m)&&c.sourceClipCharacterIds.some(id=>id===live.charId)&&c.sourceIntersectionEmpty);
    const later=scene.slice(scene.indexOf(o)+1).find(other=>painted(other)&&other.def.bounds&&!sourceClearance(other)&&overlap(bounds,box(N.definitions.find(d=>d.characterId===other.charId)?.inkBoundsTwips??other.def.bounds,paintMatrices.get(other)!)));if(later){reason='later-source-paint-retained:'+later.charId;continue;}
    const tm=mul(w,o.def.m),run=o.def.runs[0],origin=point(tm,run.g[0][1],run.y),cx=colorTransform(o),color=Object.freeze(run.c.map((v:number,i:number)=>Math.max(0,Math.min(255,v*cx[i]/256+cx[i+4]))));
    group.push(Object.freeze({object:o,instance:t.instance,characterId:t.characterId,text:d.text,card:spec.role,pair:spec.pair,sourceGlyphOffsetsTwips:Object.freeze(run.g.map((g:readonly number[])=>g[1]-run.g[0][1])),x:origin[0]/20,y:origin[1]/20,linear:Object.freeze(tm.slice(0,4)),fontSizeRem:run.h/320,color,sourceBounds:Object.freeze(bounds)}));
   }
   if(reason||group.length!==spec.texts.length)retained.push({card:spec.role,reason:reason||'incomplete-source-card'});else labels.push(...group);
  }
  const active=blocks.length?[]:labels,sourceObjects=Object.freeze(active.map(l=>l.object));
  const snapshot:TextPresentationSnapshot=Object.freeze({schemaVersion:1,animationId:N.animationId,bindingVersion:N.binding.version,sourceSwfSha256:N.sourceSha256,status:blocks.length?'blocked':'ready',blockers:Object.freeze(blocks),identity:Object.freeze({frame:main?.frame??1,frameDomain:'sprite-237',rootFrame:root.frame,scenario:identity.scenario,language:identity.lang,seed:identity.seed,replay:identity.replay}),blocks:Object.freeze(active.map((l,i)=>Object.freeze({id:l.instance.id,text:l.text,role:'label' as const,language:'en' as const,visible:true,readingOrder:i,anchor:Object.freeze({x:l.x,y:l.y,stageWidth:800,stageHeight:600,align:'start' as const})}))),suppressedInstances:Object.freeze(active.map(l=>l.instance))});
  const frame:P014NativeFrame=Object.freeze({kind:'p014-live-seven-pair-card-native-frame-v1',coverage:'seven-pair-card-labels-only',runtime:rt,root,tick:rt.tickCount,identity:Object.freeze({...identity}),snapshot,labels:Object.freeze(active),sourceObjects,guards:Object.freeze(guards),retained:Object.freeze(retained),target1MissingFractionBarPreserved:true});this.frames.add(frame);this.active=frame;return frame;
 }
 current(frame:P014NativeFrame,identity:HfrTextIdentity):boolean{
  if(frame!==this.active||!this.frames.has(frame))return false;
  const valid=this.adapter.current()&&frame.runtime===this.runtime&&frame.root===this.runtime.page_&&same(frame.identity,identity)&&JSON.stringify(this.runtime.page)===this.sourceJson&&frame.guards.every(g=>g.object.def===g.definition&&state(g.object)===g.stamp&&(g.object as unknown as{mask?:unknown}).mask===g.mask&&children(g.object).length===g.children.length&&children(g.object).every((o,i)=>o===g.children[i]));
  if(!valid){this.frames.delete(frame);this.active=null;}return valid;
 }
}
export const P014_NATIVE_BINDING=N.binding as LessonTextBinding;
