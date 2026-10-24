import type {RuntimeContext} from '../../contract';
import type {LessonTextBinding,TextPresentationSnapshot} from '../../lesson-text-contract';
import type {CourseG04L03In009FrameState} from '../../timelines/course-g04-l03-in-009';
import type {WeatherMapSourceState} from './WeatherMap';
import SOURCE from './source.generated.json';
import WEATHER from './weather.generated.json';
import CLIPS from './clip.generated.json';
export const ID='course-g04-l03-in-009',DOMAIN='sprite-200',VERSION='g04-l03-placement-020-modern-text-v1';
export const SOURCE_SHA=SOURCE.identity.sourceSha256;
const text=(id:number,run=0)=>`character-${id}/run-${run}`;
const TICKS=SOURCE.frames[636].ticks.slice().sort((a,b)=>b.value-a.value);
const tickCharacterByDepth:Readonly<Record<number,number>>={159:75,160:76,161:77,162:78,163:79,164:80,165:81,166:82,167:83,168:84,169:85,171:79,173:87};
const bitmapBlocks=WEATHER.labels.map((label,i)=>({id:'weather-'+label.id,sourceTextIds:[] as string[],sourceBitmapIds:[19],role:label.kind==='map-title'?'heading' as const:'label' as const,language:'en' as const,readingOrder:100+i,valueSource:'maintained-page-state' as const}));
export const BINDING:LessonTextBinding={schemaVersion:1,version:VERSION,placementId:'g04-l03-placement-020',animationId:ID,sourceSwfSha256:SOURCE_SHA,template:'complex-figure',blocks:[
 {id:'title',sourceTextIds:[text(4)],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 ...bitmapBlocks,
 {id:'definition',sourceTextIds:[0,1,2,3,4].map(run=>text(65,run)),role:'body',language:'en',readingOrder:300,valueSource:'maintained-page-state'},
 ...TICKS.map((t,i)=>({id:'thermometer-'+t.depth,sourceTextIds:[text(tickCharacterByDepth[t.depth])],...(t.value<0?{sourceShapeIds:[86]}:{}),role:'label' as const,language:'en' as const,readingOrder:400+i,valueSource:'maintained-page-state' as const})),
 {id:'temperature-caption',sourceTextIds:[text(152),text(197),text(198),text(199)],sourceShapeIds:[153,196],role:'label',language:'en',readingOrder:500,valueSource:'maintained-page-state'},
]};
export function getIn009NativeState(frame:number){if(!Number.isInteger(frame)||frame<1||frame>637)throw Error('Unsupported IN009 source frame');return SOURCE.frames[frame-1];}
export function getIn009MapStates(frame:number):readonly WeatherMapSourceState[]{getIn009NativeState(frame);return CLIPS.frames[frame-1].slots.map(s=>({status:'resolved',sourceFrame:frame,sourceInstanceId:s.sourceInstanceId,sourceSwfSha256:SOURCE_SHA,visible:s.visible,alpha:s.alpha,clip:s.clipPaths.length?{kind:'bitmap-space-path-union',paths:s.clipPaths.map(p=>({d:p.d,fillRule:'nonzero'}))}:{kind:'none'},admittedLabelIds:s.admittedLabelIds,evidenceRef:CLIPS.sourceRef.path+'#sha256='+CLIPS.sourceRef.sha256,semanticVisibility:s.semanticVisibility==='primary'?'primary':'duplicate-hidden'}));}
export function getIn009Snapshot(state:CourseG04L03In009FrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.sourceSwfSha256!==SOURCE_SHA)blockers.push('source-identity-mismatch');
 if(state.status!=='ready'||state.blocker)blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==DOMAIN||(context.frameDomain??DOMAIN)!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(state.scenario!=='default'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>637||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||state.seed!==context.seed||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)blockers.push('source-context-mismatch');
 const identity={frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0};
 if(blockers.length)return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE_SHA,status:'blocked',blockers,identity,blocks:[],suppressedInstances:[]};
 const row=getIn009NativeState(state.frame),admitted=new Set(getIn009MapStates(state.frame).flatMap(s=>s.status==='resolved'&&s.visible?s.admittedLabelIds:[]));
 const values:Record<string,{text:string;visible:boolean}>={title:{text:SOURCE.title,visible:true},definition:{text:row.wordIndices.map(i=>SOURCE.words[i].text).join(' '),visible:row.wordIndices.length>0},'temperature-caption':{text:row.caption?.text??'Anchorage, Alaska: −2° F',visible:row.caption?.wholeVisible??false}};
 for(const label of WEATHER.labels)values['weather-'+label.id]={text:label.text,visible:admitted.has(label.id)};
 for(const tick of TICKS){const current=row.ticks.find(t=>t.depth===tick.depth);values['thermometer-'+tick.depth]={text:tick.text,visible:current?.wholeVisible??false};}
 return{schemaVersion:1,animationId:ID,bindingVersion:VERSION,sourceSwfSha256:SOURCE_SHA,status:'ready',blockers:[],identity,blocks:BINDING.blocks.map(b=>({id:b.id,...values[b.id],role:b.role,language:b.language,readingOrder:b.readingOrder})),suppressedInstances:[]};
}
export {WEATHER as IN009_WEATHER_DATA,SOURCE as IN009_SOURCE};
