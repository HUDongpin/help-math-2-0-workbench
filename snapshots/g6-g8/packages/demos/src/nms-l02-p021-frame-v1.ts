import type{RuntimeContext}from'./contract';
import{P021_IR as IR}from'./generated/nms-l02-p021-source-ir-v1';
import{p021Initial,p021Advance,p021Submit,p021ChangeParts,p021Toggle,p021CloseFeedback,p021NewWhole,p021Target,P021_ID,P021_WRONG_BRANCHES,type P021State}from'./nms-l02-p021-state-v1';
import{p021LocalPoses}from'./nms-l02-p021-teaching-v1';
export const P021_DOMAINS=IR.reachableDomains;
export const P021_SCENARIOS=Object.freeze([{id:'source-partition-exercise',label:'Source demonstration and circle partition exercise'},{id:'first-wrong',label:'First incorrect answer and retry'},{id:'second-wrong',label:'Second incorrect answer feedback'},{id:'answer-revealed',label:'Source answer disclosure'},{id:'correct',label:'Correctly shaded target fraction'},{id:'third-unresolved',label:'Skipped questions leave third round unresolved'},{id:'three-correct',label:'Three correct answers and source Finish'}]);
function solve(s:P021State){const t=p021Target(s)!;while(s.parts<t[1])s=p021ChangeParts(s,1);while(s.parts>t[1])s=p021ChangeParts(s,-1);for(let i=0;i<t[0];i++)s=p021Toggle(s,i);return p021Submit(s);}
function fixture(seed:number,replay:number,scenario:string){let s=p021Advance(p021Initial(seed,replay),469);
 if(scenario==='first-wrong')return p021Submit(s);
 if(scenario==='second-wrong'||scenario==='answer-revealed'){s=p021Submit(p021CloseFeedback(p021Submit(s)));return scenario==='answer-revealed'?p021CloseFeedback(s):s;}
 if(scenario==='correct')return solve(s);
 if(scenario==='third-unresolved'){s=p021NewWhole(p021NewWhole(s));return p021CloseFeedback(solve(s));}
 if(scenario==='three-correct'){for(let i=0;i<3;i++){s=solve(s);if(i<2)s=p021NewWhole(p021CloseFeedback(s));}return s;}
 return s;
}
export function p021ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-578',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(!P021_DOMAINS.includes(domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P021_SCENARIOS.some(x=>x.id===c.scenario))throw Error('P021_FRAME_IDENTITY');
 const initial=p021Initial(c.seed,replay),poses=p021LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P021_ROOT_FRAME');
 const mainFrame=domain==='578'?frame:domain==='root'?(frame>=6?frame-5:null):470;
 let session:P021State=(mainFrame??0)<470?Object.freeze({...initial,mainFrame:mainFrame??1}):fixture(c.seed,replay,(mainFrame??0)>470?'three-correct':c.scenario);
 if((mainFrame??0)>470)session=Object.freeze({...session,mainFrame:mainFrame!,phase:mainFrame===515?'completed':'outro',feedback:'none'});
 if(domain==='551')session=Object.freeze({...session,parts:frame,selected:Object.freeze([])});
 if(domain==='577'){const b=P021_WRONG_BRANCHES.findIndex(x=>frame>=x.start&&frame<x.end);session=Object.freeze({...session,coachBranch:b<0?null:b,coachFrame:b<0?null:frame});}
 if(domain==='569')session=Object.freeze({...session,feedback:'wrong',attempts:1});
 if(domain==='573')session=Object.freeze({...session,feedback:'correct',outcome:'correct'});
 if(domain==='575')session=Object.freeze({...session,correctFrame:frame>=2&&frame<20?frame:null});
 if(domain==='29'||domain==='557')session=Object.freeze({...session,held:domain==='29'?'check':'close',pressFrame:frame});
 return Object.freeze({animationId:P021_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses,session,component:!['root','578'].includes(domain)});
}
export type P021FrameState=ReturnType<typeof p021ModuleFrame>;
