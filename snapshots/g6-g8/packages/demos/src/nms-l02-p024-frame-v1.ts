import type {RuntimeContext} from './contract';
import {P024_IR as IR} from './generated/nms-l02-p024-source-ir-v1';
import {p024Initial,p024LocalPoses,p024SourceNodes,P024_ID,type P024SessionState} from './nms-l02-p024-timeline-v1';
export const P024_SCENARIOS=Object.freeze([{id:'source-drag',label:'Source drag exercise'},{id:'wrong-drop',label:'Wrong drop and retry'},{id:'correct-drop',label:'Correct placement and feedback'}]);
/** Structural frame queries with representative native branch states, not AS traces. */
export function p024ModuleFrame(frame:number,c:RuntimeContext){const domainName=c.frameDomain??'sprite-98',domain=domainName==='root'?'root':domainName.replace(/^sprite-/,''),replay=c.replay??0;if(!Object.hasOwn(IR.domains,domain)||domainName!==(domain==='root'?'root':'sprite-'+domain)||!['en','es'].includes(c.lang)||!P024_SCENARIOS.some(s=>s.id===c.scenario))throw Error('P024_FRAME_IDENTITY');const initial=p024Initial(c.seed,replay),poses=p024LocalPoses(domain,frame),rootFrame=domain==='root'?frame:6;if(c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P024_ROOT_FRAME');const mainFrame=domain==='98'?frame:domain==='root'?(frame>=6?frame-5:null):92;
 let session:P024SessionState={...initial,mainFrame:mainFrame??1,localFrame:mainFrame??1,phase:mainFrame===93?'completed':mainFrame===92?'exercise':'intro',placed:mainFrame===93};
 if((mainFrame??0)>=92&&c.scenario==='wrong-drop')session={...session,phase:'wrong-wait',mainFrame:92,domain:'93',localFrame:15,attempts:1,lastDrop:6,placed:false};
 if((mainFrame??0)>=92&&c.scenario==='correct-drop'&&mainFrame!==93)session={...session,phase:'correct',mainFrame:92,domain:'77',localFrame:12,attempts:1,lastDrop:3,placed:true};
 if(domain==='93')session={...session,phase:frame>=15?'wrong-wait':'wrong',mainFrame:92,domain:'93',localFrame:frame,attempts:1,lastDrop:6,placed:false};
 if(domain==='77')session={...session,phase:'correct',mainFrame:92,domain:'77',localFrame:frame,attempts:1,lastDrop:3,placed:true};
 return Object.freeze({animationId:P024_ID,sourceSha256:IR.sourceSha256,frame,frameDomain:domainName,domain,rootFrame,mainFrame,language:c.lang,seed:c.seed,replay,scenario:c.scenario,poses:Object.freeze(poses),nodes:Object.freeze(p024SourceNodes(domain,frame)),session:Object.freeze(session),component:!['root','98'].includes(domain),assetShape:['57','71','73'].includes(domain)?poses[0]?.characterId:null,audioHelper:['95','97'].includes(domain)});
}
export type P024FrameState=ReturnType<typeof p024ModuleFrame>;
