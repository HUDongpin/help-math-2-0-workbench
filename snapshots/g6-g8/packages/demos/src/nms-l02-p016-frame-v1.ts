import type {RuntimeContext} from './contract';
import {P016_IR as IR} from './generated/nms-l02-p016-source-ir-v1';
import {p016LocalPoses} from './nms-l02-p016-teaching-v1';
import {P016_ID,P016_WRONG_BRANCHES,p016Initial,type P016State} from './nms-l02-p016-state-v1';
/** Exact root-reachable source domains, excluding the unplaced component library. */
export const P016_DOMAINS=Object.freeze(['root','148','150','151','153','159','168','175','179','186','189','194']);
export const P016_SCENARIOS=Object.freeze([
 {id:'source-slider-exercise',label:'Source demonstration and percent slider exercise'},
 {id:'first-wrong-grid',label:'Correct grid with an incorrect percent'},
 {id:'first-wrong-percent',label:'Correct percent with an incorrect grid'},
 {id:'first-wrong-both',label:'Both answer components incorrect'},
 {id:'correct',label:'Correct 25-square and 25-percent answer'},
 {id:'assisted-reveal',label:'Second attempt answer reveal'},
]);
export function p016ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-194',domain=frameDomain==='root'?'root':frameDomain.replace(/^sprite-/,''),replay=c.replay??0;
 if(!P016_DOMAINS.includes(domain)||frameDomain!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P016_SCENARIOS.some(s=>s.id===c.scenario))throw Error('P016_FRAME_IDENTITY');
 const initial=p016Initial(c.seed,replay),poses=p016LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;
 if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P016_ROOT_FRAME');
 const mainFrame=domain==='194'?frame:domain==='root'?(frame>=6?frame-5:null):176;
 let session:P016State={...initial,mainFrame:mainFrame??1,phase:mainFrame===209?'completed':(mainFrame??0)>176?'outro':mainFrame===176?'exercise':'intro',shaded:(mainFrame??0)>176?25:0,digits:(mainFrame??0)>176?['2','5']:['',''],outcome:(mainFrame??0)>176?'correct':'none'};
 if(mainFrame===176){
  if(c.scenario==='correct')session={...session,shaded:25,digits:['2','5'],feedback:'correct',outcome:'correct',correctFrame:2,attempts:1};
  if(c.scenario.startsWith('first-wrong-'))session={...session,shaded:c.scenario==='first-wrong-grid'?25:15,digits:c.scenario==='first-wrong-percent'?['2','5']:['1','5'],feedback:'wrong',wrongKind:c.scenario==='first-wrong-grid'?'gridOnly':c.scenario==='first-wrong-percent'?'percentOnly':'neither',attempts:1,wrongAttempts:1,wrongPanelFrame:2};
  if(c.scenario==='assisted-reveal')session={...session,shaded:25,digits:['2','5'],feedback:'reveal',outcome:'assisted',attempts:2,wrongAttempts:2,coachBranch:0,coachFrame:3};
 }
 if(c.scenario==='assisted-reveal'&&(mainFrame??0)>176)session={...session,outcome:'assisted',attempts:2,wrongAttempts:2};
 if(domain==='168'){const b=P016_WRONG_BRANCHES.findIndex(b=>frame>=b.start&&frame<b.end);session={...session,coachBranch:b<0?null:b,coachFrame:b<0?null:frame};}
 if(domain==='179')session={...session,feedback:frame<2?'none':'wrong',wrongKind:'neither',wrongPanelFrame:frame};
 if(domain==='186')session={...session,feedback:frame<2?'none':'correct',outcome:frame<2?'none':'correct',correctFrame:frame>=2&&frame<20?frame:null};
 if(domain==='159'||domain==='175')session={...session,held:domain==='159'?'reset':'close',pressFrame:frame};
 return Object.freeze({animationId:P016_ID,sourceSha256:IR.sourceSha256,frame,frameDomain,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses,session:Object.freeze(session),component:!['root','194'].includes(domain)});
}
export type P016FrameState=ReturnType<typeof p016ModuleFrame>;
