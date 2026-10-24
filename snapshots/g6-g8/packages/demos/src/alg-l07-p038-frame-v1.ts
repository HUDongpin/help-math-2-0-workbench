import type{RuntimeContext}from'./contract';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P038_SOURCE as S,p038InitialState,p038Visual,p038Branch,p038CanClose,type P038State}from'./alg-l07-p038-state-v1';
export const P038_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-10',frameCount:1,rootFrame:6},...([184,196,222]as const).map(id=>({id:`sprite-${id}`,frameCount:1,rootFrame:6})),...S.branches.map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-243',frameCount:509,rootFrame:6}]);
export const P038_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P038_DEFAULTS=Object.freeze(Object.fromEntries(P038_DOMAINS.map(d=>[d.id,['sprite-231','sprite-185','sprite-200','sprite-222','sprite-184','sprite-196'].includes(d.id)?'wrong-first':['sprite-104','sprite-146','sprite-160','sprite-138'].includes(d.id)?'right-feedback':'source-instruction'])));
export const P038_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p038-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[9],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[9],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[32,36].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'question' as const,language:'en' as const,readingOrder:2+i,valueSource:'maintained-page-state' as const})),
 {id:'equation',sourceTextIds:['character-22'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 ...[19,20].map((id,i)=>({id:`table-heading-${i}`,sourceTextIds:[`character-${id}`],role:'label' as const,language:'en' as const,readingOrder:5+i,valueSource:'maintained-page-state' as const})),
 ...S.table.flatMap((p,i)=>[...p.ids.map((id,j)=>({id:`table-${i}-${j}`,sourceTextIds:[`character-${id}`,`character-${p.movingIds[j]}`],role:'body' as const,language:'en' as const,readingOrder:7+i*3+j,valueSource:'maintained-page-state' as const})),{id:`pair-${i}`,sourceTextIds:[...p.movingIds.map(id=>`character-${id}`),`character-${[232,233,234,235,235][i]}`],role:'body' as const,language:'en' as const,readingOrder:9+i*3,valueSource:'maintained-page-state' as const}]),
 ...S.answers.map((a,i)=>({id:`answer-${a.letter}`,sourceTextIds:[`character-${a.letterId}`],role:'answer' as const,language:'en' as const,readingOrder:22+i,valueSource:'maintained-page-state' as const})),
 ...S.graphs.flatMap((g,gi)=>g.labels.map((l,i)=>({id:`axis-${g.letter}-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:26+gi*17+i,valueSource:'maintained-page-state' as const}))),
 ...S.graphs[0].points.map((p,i)=>({id:`point-${i}`,sourceTextIds:[p.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:94+i,valueSource:'maintained-page-state' as const})),
 ...S.branches.map((b,i)=>({id:`feedback-title-${b.spriteId}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const,language:'en' as const,readingOrder:99+i,valueSource:'maintained-page-state' as const})),
 ...([{sprite:231,text:221},{sprite:185,text:183},{sprite:200,text:195}]as const).map((b,i)=>({id:`wrong-text-${b.sprite}`,sourceTextIds:[`character-${b.text}`],role:'feedback' as const,language:'en' as const,readingOrder:106+i,valueSource:'maintained-page-state' as const})),
 {id:'close',sourceTextIds:['character-176'],role:'label',language:'en',readingOrder:109,valueSource:'maintained-page-state'}
]as const)});
export function p038View(state:P038State,context:RuntimeContext,ready=true){
 const v=p038Visual(state.mainFrame),f=state.feedback,b=f?p038Branch(f.spriteId):null;
 const titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p038CanClose({...state,glossary:null});
 const pairTexts=S.table.map((p,i)=>{const s=v.pairs[i],x=s.progress[0]>0?p.x:'',y=s.progress[1]>0?p.y:'';return s.bracket?`(${x}, ${y})`:[x,y].filter(Boolean).join(' ');});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Instruction',visible:ready},equation:{text:'y = x3',visible:ready&&v.tableAlpha>0},close:{text:'Close',visible:ready&&closeVisible}};
 for(let i=0;i<2;i++){values[`paragraph-${i}`]={text:v.paragraphs[i],visible:ready&&Boolean(v.paragraphs[i])};values[`table-heading-${i}`]={text:i===0?'x':'y',visible:ready&&v.tableAlpha>0};}
 for(const[p,i]of S.table.map((p,i)=>[p,i]as const)){for(let j=0;j<2;j++)values[`table-${i}-${j}`]={text:j===0?p.x:p.y,visible:ready&&v.tableAlpha>0};values[`pair-${i}`]={text:pairTexts[i],visible:ready&&Boolean(pairTexts[i])};}
 for(const branch of S.branches){values[`feedback-title-${branch.spriteId}`]={text:branch.title,visible:ready&&b?.spriteId===branch.spriteId&&titleAlpha>0};if(branch.kind==='wrong')values[`wrong-text-${branch.spriteId}`]={text:state.wrongText??'',visible:ready&&b?.spriteId===branch.spriteId&&closeVisible};}
 for(const a of S.answers)values[`answer-${a.letter}`]={text:a.letter,visible:ready&&v.answerAlpha[a.letter]>0};
 for(const g of S.graphs)for(let i=0;i<g.labels.length;i++)values[`axis-${g.letter}-${i}`]={text:g.labels[i].text,visible:ready&&v.answerAlpha[g.letter]>0};
 for(let i=0;i<S.graphs[0].points.length;i++)values[`point-${i}`]={text:S.graphs[0].points[i].text,visible:ready&&v.points[i].labelAlpha>0};
 const frameDomain=context.frameDomain??'sprite-243',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,pairTexts,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P038_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P038_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P038Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-243',scenario:'source-instruction',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-243',spec=P038_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p038-frame-identity');
 let s=p038InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=({222:231,184:185,196:200}as Record<number,number>)[id],b=S.branches.find(b=>b.spriteId===(popup??id));
 if(b){
  if(!((b.kind==='wrong'&&/^wrong-(first|second)(-(c|d))?$/.test(context.scenario))||(b.kind==='right'&&context.scenario==='right-feedback')))throw Error('invalid-p038-feedback-scenario');
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame,second=context.scenario.startsWith('wrong-second'),answer=context.scenario.endsWith('-c')?3:context.scenario.endsWith('-d')?4:2;
  s={...s,phase:'feedback',mainFrame:117,quizSection:true,quizTryCount:b.kind==='wrong'?(second?2:1):0,selected:b.kind==='right'?1:answer,feedback:{spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1,wrongText:b.kind==='wrong'?(second?S.answers[answer-1].wrongLater:S.answers[answer-1].wrongFirst):null};
 }else{
  if(context.scenario!=='source-instruction')throw Error('invalid-p038-main-scenario');const main=domain==='sprite-243'?frame:1;s={...s,mainFrame:main,phase:main<117?'prequiz':main===117?'quiz-held':'postquiz',quizSection:main===117,quizButtonsEnabled:main===117};
 }
 return p038View(s,{...context,frame,frameDomain:domain},ready);
}
export type P038View=ReturnType<typeof p038View>;
