import{P027_SOURCE_IR as IR}from'./generated/nms-l02-p027-source-ir-v1';
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}freeze(IR);
/** Local authored placements only. Source scripts and host selection are separate. */
export function p027LocalPoses(domain:string,frame:number){if(domain!=='root'&&!/^(?:sprite-)?[1-9]\d*$/u.test(domain))throw Error('P027_SOURCE_DOMAIN');const key=domain==='root'?'root':domain.replace(/^sprite-/u,'');const d=Object.hasOwn(IR.domains,key)?IR.domains[key]:undefined;if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('P027_SOURCE_QUERY');return Object.freeze(d.frames[frame-1]!.map(i=>IR.poses[i]!));}
export function p027SourceTeaching(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>384)throw Error('P027_MAIN_QUERY');return IR.teachingRows[IR.teachingFrames[frame-1]!]!;}
