import {P001_READABLE_SOURCE_BINDINGS,type P001ReadableSourceKind} from './p001-readable-source-bindings';
import React from 'react';
import type {HfrNativeTextFrame,HfrTextIdentity,HfrTextRuntime,HfrTextDisplayObject} from './hfr-native-text';
import {isHfrNativeTextFrameCurrent} from './hfr-native-text';
export type P001ReadoutGroup='fractions'|'decimal-list'|'number-forms';
export interface P001ReadableCompanion {
 readonly kind:P001ReadableSourceKind;readonly animationId:string;readonly sourceSwfSha256:string;
 readonly candidateJsonSha256:string;readonly bindingVersion:string;readonly sourceFrameDomain:string;
 readonly textPins:readonly {characterId:number;sourceTextId:string;sourceTagSha256:string}[];
 readonly shapePins:readonly {characterId:number;sourceTagSha256:string}[];
 readonly title:{text:string;sourceTextIds:readonly string[];visibleFrames:readonly (readonly number[])[]};
 readonly groups:readonly {id:P001ReadoutGroup;visibleFrames:readonly (readonly number[])[];variants:readonly {containerInstanceId:string;firstFrame:number;lastFrameExclusive:number;members:readonly {instanceId:string;characterId:number;depth:number;generation:number}[]}[]}[];
 readonly evidence:string;
}
export interface P001ReadoutSnapshot {readonly status:'ready'|'blocked';readonly problems:readonly string[];readonly frame:number;readonly title:string|null;readonly groups:readonly {id:P001ReadoutGroup;instances:readonly string[]}[]}
const TEXT:Readonly<Record<number,string>>={87:'1',88:'3',89:'2',91:',',93:'5',103:'0, -10, -4.5,',106:'3, 3.0,',109:'3.0 × 10^2, π,',111:'2,'};
const inFrames=(ranges:readonly(readonly number[])[],frame:number)=>ranges.some(([first,last])=>frame>=first&&frame<=last);
/** Reads only the already-observed display state. No getter, source mutation,
 * source alpha override, clock, timer, audio or persistence is introduced. */
export function buildP001ReadableCompanion(frame:HfrNativeTextFrame,runtime:HfrTextRuntime,identity:HfrTextIdentity):P001ReadoutSnapshot {
 const q=frame.readableCompanion,profile=q?P001_READABLE_SOURCE_BINDINGS[q.kind]:undefined,number=frame.snapshot.identity.frame,problems:string[]=[],groups:{id:P001ReadoutGroup;instances:string[]}[]=[];
 const result=(title:string|null):P001ReadoutSnapshot=>Object.freeze({status:problems.length?'blocked':'ready',problems:Object.freeze(problems),frame:number,title:problems.length?null:title,groups:Object.freeze(problems.length?[]:groups)});
 if(frame.sourceRiskBlockers.length){problems.push('readable-companion-unresolved-source-risk');return result(null);}
 if(!q||!profile||frame.snapshot.status!=='ready'||!isHfrNativeTextFrameCurrent(frame,runtime,identity)||q.sourceSwfSha256!==profile.sourceSha256||frame.snapshot.sourceSwfSha256!==profile.sourceSha256||q.animationId!==profile.animationId||q.bindingVersion!==frame.snapshot.bindingVersion||q.bindingVersion!==profile.bindingVersion||q.title.text!==profile.title||q.sourceFrameDomain!==frame.snapshot.identity.frameDomain){problems.push('readable-companion-source-or-current-frame-mismatch');return result(null);}
 const observed=new Map<string,HfrTextDisplayObject>();for(let i=0;i<frame.sourceObjects.length;i++)observed.set(frame.transforms[i].instanceId,frame.sourceObjects[i]);
 const value=(object:HfrTextDisplayObject,id:string)=>{const block=frame.binding.blocks.find(b=>b.sourceTextIds.includes(`character-${object.charId}`)&&(!b.instance||b.instance.id===id));return frame.snapshot.blocks.find(b=>b.id===block?.id&&b.visible)?.text;};
 const safeShape=(object:HfrTextDisplayObject)=>{
  let multiply=256,add=0;const chain:HfrTextDisplayObject[]=[];for(let o:HfrTextDisplayObject|null|undefined=object;o;o=o.parentClip)chain.unshift(o);
  for(const o of chain){if(!o.visible||o.removed||o.mask||o.scriptMoved)return false;add+=multiply*o.cx[7]/256;multiply=multiply*o.cx[3]/256;}
  return (multiply>0||add>0)&&!(object.clipDepth??0)&&object.def===runtime.page.dictionary[object.charId]&&frame.guards.some(g=>g.object===object);
 };
 const titleBlock=frame.snapshot.blocks.find(b=>b.role==='title'&&b.visible),titleExpected=inFrames(q.title.visibleFrames,number);
 if(Boolean(titleBlock)!==titleExpected||titleBlock&&(titleBlock.text!==q.title.text||![100,101].every(id=>frame.sourceObjects.some(o=>o.charId===id))))problems.push('readable-companion-title-visibility-or-value-mismatch');
 for(const group of q.groups){
  const expected=inFrames(group.visibleFrames,number),complete:{id:string;instances:string[]}[]=[],partial:string[]=[];
  for(const variant of group.variants){
   if(number<variant.firstFrame||number>=variant.lastFrameExclusive)continue;
   const textMembers=variant.members.filter(m=>Object.hasOwn(TEXT,m.characterId));
   const live=textMembers.map(m=>({member:m,object:observed.get(m.instanceId)})).filter(x=>x.object);
   if(!live.length)continue;
   if(live.length!==textMembers.length){partial.push(variant.containerInstanceId);continue;}
   const container=live[0].object!.parentClip;
   let valid=Boolean(container);
   for(const m of variant.members){
    const object=Object.hasOwn(TEXT,m.characterId)?observed.get(m.instanceId):container?.children?.get(m.depth);
    if(!object||object.scriptMoved||object.parentClip!==container||object.charId!==m.characterId||object.depth!==m.depth){valid=false;continue;}
    if(Object.hasOwn(TEXT,m.characterId)){if(value(object,m.instanceId)!==TEXT[m.characterId])valid=false;}
    else if(!safeShape(object))valid=false;
   }
   if(valid)complete.push({id:variant.containerInstanceId,instances:variant.members.map(m=>m.instanceId)});else partial.push(variant.containerInstanceId);
  }
  if(partial.length)problems.push(`readable-companion-incomplete-source-group:${group.id}`);
  if(Boolean(complete.length)!==expected)problems.push(`readable-companion-group-visibility-mismatch:${group.id}`);
  if(expected&&complete.length)groups.push({id:group.id,instances:complete[0].instances});
 }
 return result(titleBlock?.text??null);
}
const h=React.createElement;
/** Pure MathML expressions reuse the maintained NMS L2 SourceMath presentation.
 * Group values are qualified to L7's own source; its title is never imported. */
function SourceMathTerms({id}:{id:P001ReadoutGroup}){
 const n=(v:string)=>h('mn',null,v),o=(v:string)=>h('mo',null,v),f=(a:string,b:string)=>h('mfrac',null,n(a),n(b));
 const terms:React.ReactNode[]=id==='fractions'?[f('1','2'),f('1','5'),h('mrow',null,n('1'),f('2','3'))]:id==='number-forms'?[n('3'),n('3.0'),h('mrow',null,n('3.0'),o('×'),h('msup',null,n('10'),n('2'))),h('mi',null,'π'),h('msqrt',null,n('2'))]:[n('0'),n('−10'),n('−4.5')];
 // Break only between complete expressions. Fractions, powers and radicals stay
 // intact while narrow screens and larger root fonts wrap the flex container.
 return <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'.3em .55em',minWidth:0,maxWidth:'100%'}}>
  {terms.map((term,index)=><span key={index} style={{display:'inline-flex',alignItems:'center',gap:'.08em',flex:'0 0 auto'}}>
   {h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true',style:{fontSize:'inherit'}},h('mrow',null,term))}
   {index<terms.length-1?<span aria-hidden="true">,</span>:null}
  </span>)}
 </div>;
}
export function P001ReadableCompanionView({snapshot,sourceSha256}:{snapshot:P001ReadoutSnapshot;sourceSha256:string}){
 if(snapshot.status!=='ready')return null;
 return <section lang="en" data-hfr-readable-companion="source-number-examples-v1" data-hfr-readable-frame={snapshot.frame} data-hfr-readable-source={sourceSha256}
  style={{boxSizing:'border-box',width:'100%',minWidth:0,color:'#18304b',background:'#fffdf8',padding:'clamp(.75rem,2vw,1.25rem)',opacity:1}}>
  {snapshot.title?<h2 style={{margin:'0 0 .75rem',fontFamily:'var(--lesson-font-display, "Fredoka", sans-serif)',fontSize:'clamp(1.25rem,2.5vw,1.75rem)',lineHeight:1.35,overflowWrap:'anywhere',color:'#18304b',...(snapshot.title.includes('\n')?{whiteSpace:'pre-wrap' as const}:{})}}>{snapshot.title}</h2>:null}
  <div style={{display:'flex',flexWrap:'wrap',gap:'.75rem',minWidth:0,maxWidth:'100%',alignItems:'stretch'}}>
   {snapshot.groups.map(group=><div key={group.id} data-hfr-readable-group={group.id} data-hfr-source-instances={group.instances.join(' ')}
    style={{boxSizing:'border-box',flex:'1 1 15rem',minWidth:0,maxWidth:'100%',border:'1px solid #b5cbe1',borderRadius:'.8rem',padding:'.75rem',background:'#f0f7ff',fontSize:'clamp(1.125rem,2.5vw,1.5rem)',lineHeight:1.6,color:'#18304b'}}>
    <SourceMathTerms id={group.id}/>
   </div>)}
  </div>
 </section>;
}
