import{P026_SOURCE_IR as IR}from'./generated/nms-l02-p026-source-ir-v1';
import type{P026Pose,P026TeachingRow}from'./nms-l02-p026-source-contract-v1';
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}freeze(IR);
/** Local authored placements, including stopped/unreached states. This does not
 * execute AS or claim that a natural original-runtime trace visits every frame. */
export function p026SourcePoses(domain:string,frame:number):readonly P026Pose[]{const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('P026_SOURCE_QUERY');return Object.freeze(d.frames[frame-1]!.map(i=>IR.poses[i]!));}
export function p026SourceTeaching(mainFrame:number):P026TeachingRow{if(!Number.isSafeInteger(mainFrame)||mainFrame<1||mainFrame>491)throw Error('P026_MAIN_QUERY');return IR.teachingRows[IR.teachingFrames[mainFrame-1]!]!;}
export const P026_SOURCE_DOMAINS=Object.freeze(Object.entries(IR.domains).map(([id,d])=>Object.freeze({id,frameCount:d.frameCount})));
