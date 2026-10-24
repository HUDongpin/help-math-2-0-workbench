import type{P031FeedbackData}from'./nms-l02-p031-feedback-contract-v1';
import{P031_FEEDBACK_IR as RAW}from'./generated/nms-l02-p031-feedback-ir-v1';
const IR:P031FeedbackData=RAW;
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(IR);
/** Local authored placements only. Source scripts and host selection are separate. */
export function p031LocalPoses(domain:string,frame:number){if(domain!=='root'&&!/^(?:sprite-)?[1-9]\d*$/u.test(domain))throw Error('P031_SOURCE_DOMAIN');const key=domain==='root'?'root':domain.replace(/^sprite-/u,'');const d=Object.hasOwn(IR.domains,key)?IR.domains[key]:undefined;if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('P031_SOURCE_QUERY');return Object.freeze(d.frames[frame-1]!.map(i=>IR.poses[i]!));}
