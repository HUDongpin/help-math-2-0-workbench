import type{AnimationRendererProps}from'../contract';
import source from'./generated/g4-l3-ti002-native-inputs.json';
const ID='course-g04-l03-ti-002';
export function ti002SourceBlockers(state:unknown,runtime:AnimationRendererProps):readonly string[]{
 const blockers:string[]=[];
 if(!state||typeof state!=='object')return['missing-source-state'];
 const s=state as Record<string,unknown>;
 if(s.animationId!==ID||s.sourceSwfSha256!==source.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(s.status!=='ready'||s.blocker)blockers.push('source-state-not-ready');
 if(!Number.isInteger(runtime.frame)||runtime.frame<1||runtime.frame>254||(runtime.frameDomain??'sprite-272')!=='sprite-272'||(runtime.rootFrame??6)!==6||runtime.scenario!=='source-static-frame'||runtime.lang!=='en')blockers.push('unsupported-native-context');
 if(s.frame!==runtime.frame||s.frameDomain!==(runtime.frameDomain??'sprite-272')||s.rootFrame!==(runtime.rootFrame??6)||s.language!==runtime.lang||s.scenario!==runtime.scenario||s.seed!==runtime.seed)blockers.push('source-context-mismatch');
 if(!Number.isSafeInteger(runtime.seed)||runtime.seed<0||runtime.seed>0xffffffff||!Number.isSafeInteger(runtime.replay??0)||(runtime.replay??0)<0)blockers.push('invalid-reset-identity');
 if(runtime.entryStateSha256)blockers.push('deterministic-source-capture-excluded');
 return blockers;
}
