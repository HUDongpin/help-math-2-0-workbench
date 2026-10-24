'use client';
import React,{useId,useLayoutEffect,useRef}from'react';
import type{AnimationRendererProps,RuntimeContext}from'../contract';
import type{LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot}from'../lesson-text-contract';
import type{SourceStaticCanvasFrameState}from'../source-static-canvas-candidate';
import{getCourseG04L03In011FrameState,normalizeCourseG04L03In011Frame}from'../modules/course-g04-l03-in-011';
import{G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES}from'../g4-l3-main-timeline-audio.generated';
import RAW from'./generated/g4-l3-in011-native-inputs.json';
type Matrix=readonly number[];
type Color=readonly number[];
type Transform={multiply?:Color;add?:Color};
type Paint={kind:'fill'|'stroke';d:string;style:{kind?:string;rgba?:Color;widthTwips?:number;matrix?:Matrix;stops?:readonly(readonly[number,Color])[]}};
type Shape={characterId:number;sourceTagSha256:string;epochs:readonly{epoch:number;paints:readonly Paint[]}[]};
type Node={depth:number;characterId:number;instanceId:string;matrix:Matrix;colorTransform?:Transform;visible?:boolean;localAlpha:number};
type Label={characterId:number;signedValue:number;modernText:string;sourceTextIds:readonly string[];tickLocalXTwips:number};
type Input={sourceSwfSha256:string;shapes:readonly Shape[];nodePool:readonly Node[];frameIndices:readonly(readonly number[])[];labels:readonly Label[];texts:readonly{characterId:number;runs:readonly{sourceTextId:string;text:string}[]}[]};
const INPUT=RAW as unknown as Input;
const ID='course-g04-l03-in-011',DOMAIN='sprite-51',VERSION='g04-l03-placement-022-native-v1';
const SHAPES=new Map(INPUT.shapes.map(s=>[s.characterId,s]));
export const IN011_CAPTION_DECORATION={characterId:45,sourceTagSha256:'1a2fd57c0681e3c80ad98cce46f10352a35bd0f3260771812e7530dac36bf52e'} as const;
if(SHAPES.get(IN011_CAPTION_DECORATION.characterId)?.sourceTagSha256!==IN011_CAPTION_DECORATION.sourceTagSha256)throw Error('IN011 caption-decoration source identity mismatch');
const textFor=(id:number)=>INPUT.texts.find(t=>t.characterId===id)!.runs.map(r=>r.text).join('');
const idsFor=(id:number)=>INPUT.texts.find(t=>t.characterId===id)!.runs.map(r=>r.sourceTextId);
export const IN011_KEY_TERMS={indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:['en-0499-e54dca5d8b22','en-0411-1954bd66c84d']};
export const IN011_BINDING={schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-022',animationId:ID,sourceSwfSha256:INPUT.sourceSwfSha256,template:'complex-figure',blocks:[
 {id:'title',sourceTextIds:idsFor(4),role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 ...INPUT.labels.map((n,i)=>({id:`tick-${n.signedValue}`,sourceTextIds:[...n.sourceTextIds],...(n.signedValue<0?{sourceShapeIds:[36]}:{}),role:'label' as const,language:'en' as const,readingOrder:i+10,valueSource:'maintained-page-state' as const})),
 {id:'figure-description',sourceTextIds:[],sourceShapeIds:[6,8,9,10,11,12,13,14,15,16,17,19,36,41,42,43,44],role:'body',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 {id:'positive-caption',sourceTextIds:idsFor(46),role:'body',language:'en',readingOrder:40,valueSource:'maintained-page-state'},
 {id:'negative-caption',sourceTextIds:idsFor(49),role:'body',language:'en',readingOrder:41,valueSource:'maintained-page-state'},
]} satisfies LessonTextBinding;
export function getIn011Scene(requested:number){const frame=normalizeCourseG04L03In011Frame(requested,DOMAIN);return{frame,nodes:INPUT.frameIndices[frame-1].map(i=>INPUT.nodePool[i])};}
/** Accessible figure description follows visible source shapes, including the transparent transition. */
export function getIn011FigureDescription(nodes:readonly Node[]){
 const visible=(id:number)=>nodes.some(n=>n.characterId===id&&n.visible!==false&&n.localAlpha>0);
 if(!visible(36))return nodes.some(n=>n.characterId>=6&&n.characterId<=15&&n.characterId!==7&&n.visible!==false&&n.localAlpha>0)?'Two illustrated characters.':'Lesson illustration.';
 const parts=['Number line from negative ten to ten, increasing from left to right.'];
 if(visible(41))parts.push('A red point marks negative five.');
 if(visible(44))parts.push('A blue point marks two.');
 return parts.join(' ');
}
export function getIn011Snapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==ID||state.sourceSwfSha256!==INPUT.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('english-source-visuals-only');
 if(state.frame!==normalizeCourseG04L03In011Frame(context.frame,DOMAIN)||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||state.seed!==(context.seed>>>0))blockers.push('teaching-state-identity-mismatch');
 const scene=getIn011Scene(state.frame);const visible=(id:number)=>scene.nodes.some(n=>n.characterId===id&&n.visible!==false&&n.localAlpha>0);
 const values:Record<string,{text:string;visible:boolean}>={'figure-description':{text:getIn011FigureDescription(scene.nodes),visible:true},title:{text:textFor(4),visible:true},'positive-caption':{text:textFor(46),visible:visible(46)},'negative-caption':{text:textFor(49),visible:visible(49)}};
 for(const n of INPUT.labels)values[`tick-${n.signedValue}`]={text:n.modernText,visible:visible(n.characterId)};
 return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:INPUT.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],blocks:blockers.length?[]:IN011_BINDING.blocks.map(b=>({id:b.id,role:b.role,language:b.language,readingOrder:b.readingOrder,...values[b.id]}))};
}
export const IN011_AXIS_VIEWBOX={x:40,y:140,width:730,height:185} as const;
export const IN011_INTRO_VIEWBOX={x:350,y:205,width:410,height:260} as const;
const clamp=(x:number,max:number)=>Math.max(0,Math.min(max,x));
function rgba(c:Color,t?:Transform){const v=[0,1,2,3].map(i=>clamp(c[i]*(t?.multiply?.[i]??256)/256+(t?.add?.[i]??0),255));return`rgba(${v[0]},${v[1]},${v[2]},${v[3]/255})`;}
/** Source paint topology is compiled once; source color transforms remain per placed instance. */
function SourceArt({nodes,prefix,illustration}:{nodes:readonly Node[];prefix:string;illustration:boolean}){return <svg viewBox={illustration?`${IN011_INTRO_VIEWBOX.x} ${IN011_INTRO_VIEWBOX.y} ${IN011_INTRO_VIEWBOX.width} ${IN011_INTRO_VIEWBOX.height}`:`${IN011_AXIS_VIEWBOX.x} ${IN011_AXIS_VIEWBOX.y} ${IN011_AXIS_VIEWBOX.width} ${IN011_AXIS_VIEWBOX.height}`} aria-hidden="true" focusable="false" className="in011-art"><g transform="translate(413.4 283.3) scale(.05)">{nodes.filter(n=>n.characterId!==IN011_CAPTION_DECORATION.characterId&&n.visible!==false&&n.localAlpha>0&&SHAPES.has(n.characterId)).map(n=><g key={n.instanceId} transform={`matrix(${n.matrix.join(' ')})`} data-source-shape-id={n.characterId}>{SHAPES.get(n.characterId)!.epochs.flatMap(epoch=>epoch.paints.map((p,index)=>{const key=`${epoch.epoch}-${index}`,gid=`${prefix}-${n.depth}-${key}`,s=p.style,gradient=s.kind?.endsWith('gradient');const color=gradient?`url(#${gid})`:rgba(s.rgba!,n.colorTransform);return <React.Fragment key={key}>{gradient&&<defs>{s.kind==='radial-gradient'?<radialGradient id={gid} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="16384" gradientTransform={`matrix(${s.matrix!.join(' ')})`}>{s.stops!.map(([offset,c],i)=><stop key={i} offset={offset/255} stopColor={rgba(c,n.colorTransform)}/>)}</radialGradient>:<linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="-16384" x2="16384" y1="0" y2="0" gradientTransform={`matrix(${s.matrix!.join(' ')})`}>{s.stops!.map(([offset,c],i)=><stop key={i} offset={offset/255} stopColor={rgba(c,n.colorTransform)}/>)}</linearGradient>}</defs>}<path d={p.d} fill={p.kind==='fill'?color:'none'} fillRule="evenodd" stroke={p.kind==='stroke'?color:undefined} strokeWidth={p.kind==='stroke'?s.widthTwips:undefined} strokeLinecap="round" strokeLinejoin="round"/></React.Fragment>;}))}</g>)}</g></svg>;}
const STYLES=`.in011-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#16364a;display:grid;gap:1rem;min-inline-size:0}.in011-modern h2{font-family:var(--lesson-text-font-heading,system-ui,sans-serif);font-size:1.75rem;line-height:1.25;margin:0;overflow-wrap:anywhere}.in011-viewport{overflow:auto;max-inline-size:100%;max-block-size:36rem;border:1px solid #718399;border-radius:1rem;background:#f5f9fd;overscroll-behavior:contain}.in011-plane{position:relative;inline-size:70rem;block-size:auto;aspect-ratio:${IN011_AXIS_VIEWBOX.width}/${IN011_AXIS_VIEWBOX.height}}.in011-modern[data-in011-phase="illustration"] .in011-plane{inline-size:min(100%,40rem);block-size:auto;aspect-ratio:410/260;margin-inline:auto}.in011-art{position:absolute;inset:0;width:100%;height:100%}.in011-labels{list-style:none;margin:0;padding:0}.in011-label{position:absolute;transform:translate(-50%,0);white-space:nowrap;font-size:1.125rem;line-height:1.35;font-weight:700;font-variant-numeric:tabular-nums}.in011-caption{font-size:1.25rem;line-height:1.6;margin:0;overflow-wrap:anywhere;max-inline-size:65ch}.in011-term{font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:.15em;color:#005a9c;background:#fff;border:1px solid #52738a;border-radius:.35rem;padding:.2rem .35rem;min-block-size:44px;min-inline-size:44px}.in011-term:focus-visible,.in011-viewport:focus-visible{outline:3px solid #005a9c;outline-offset:3px}`;
export function In011Renderer(props:AnimationRendererProps){const context={...props,frameDomain:props.frameDomain??DOMAIN};const state=(props.state??getCourseG04L03In011FrameState(props.frame,context))as SourceStaticCanvasFrameState;const snap=getIn011Snapshot(state,context);const scene=getIn011Scene(snap.identity.frame),prefix=useId().replace(/:/g,''),viewport=useRef<HTMLDivElement>(null);const axis=scene.nodes.find(n=>n.characterId===36);const axisVisible=Boolean(axis&&axis.localAlpha>0);useLayoutEffect(()=>{const v=viewport.current;if(v)v.scrollLeft=(v.scrollWidth-v.clientWidth)/2;},[axisVisible,props.replay]);if(snap.status!=='ready')return null;
 const block=(id:string)=>snap.blocks.find(b=>b.id===id)!;
 const caption=(id:'positive-caption'|'negative-caption',cid:46|49,word:'positive'|'negative',entry:string,button:48|50)=>{const b=block(id);if(!b.visible)return null;return<p className="in011-caption" data-lesson-text-block={id} style={{opacity:scene.nodes.find(n=>n.characterId===cid)!.localAlpha}}>{b.text.split(word).map((s,i)=><React.Fragment key={i}>{i>0&&(props.onLessonHostRequest?<button type="button" className="in011-term" data-source-button-id={button} data-keyterm-entry-id={entry} onClick={e=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:entry,sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:e.currentTarget})}>{word}</button>:word)}{s}</React.Fragment>)}</p>;};
 return<section className="in011-modern" data-in011-phase={axisVisible?'number-line':'illustration'} lang="en" data-modern-text-page={ID} data-flash-frame={scene.frame} data-flash-frame-domain={DOMAIN} data-runtime-replay={props.replay??0}><style>{STYLES}</style><h2 data-lesson-text-block="title">{block('title').text}</h2><div ref={viewport} className="in011-viewport" tabIndex={0} role="group" aria-label={block('figure-description').text}><div className="in011-plane"><SourceArt nodes={scene.nodes} prefix={prefix} illustration={!axisVisible}/><ol className="in011-labels" aria-label="Number line labels">{INPUT.labels.map(n=>{const b=block(`tick-${n.signedValue}`);if(!b.visible||!axis)return null;const x=(n.tickLocalXTwips+axis.matrix[4]+8268)/20;const y=281;const node=scene.nodes.find(s=>s.characterId===n.characterId)!;return<li key={b.id} className="in011-label" data-lesson-text-block={b.id} style={{left:`${(x-40)/730*100}%`,top:`${(y-IN011_AXIS_VIEWBOX.y)/IN011_AXIS_VIEWBOX.height*100}%`,opacity:node.localAlpha,color:n.signedValue<0?'#a31b24':n.signedValue>0?'#154fad':'#16364a'}}>{b.text}</li>;})}</ol></div></div>{caption('positive-caption',46,'positive',IN011_KEY_TERMS.entryIds[0],48)}{caption('negative-caption',49,'negative',IN011_KEY_TERMS.entryIds[1],50)}</section>;
}
export const IN011_SOURCE_AUDIO=G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[ID].audioCues.map(cue=>{if(!cue.sha256)throw Error('IN011 source audio hash missing');return{...cue,sha256:cue.sha256};});
export const IN011_PRESENTATION={schemaVersion:1,binding:IN011_BINDING,Renderer:In011Renderer,getSnapshot:getIn011Snapshot,keyTerms:IN011_KEY_TERMS,playbackMode:'once',playbackEndFrameByDomain:{[DOMAIN]:441},terminalTimelineAudio:{allowClockDriftTail:true,frameDomain:DOMAIN,holdFrame:441,endFrameExclusive:442,cueId:IN011_SOURCE_AUDIO[0].id,sourceSha256:IN011_SOURCE_AUDIO[0].sha256,pcmSha256:'2a9e6b210ee1f43126ab6cb38f025dacb959f7a0cf44d932dd2c8cc5d17b2155'},sourceTimelineAudioCues:IN011_SOURCE_AUDIO,reducedMotionFrameByDomain:{[DOMAIN]:441}} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
