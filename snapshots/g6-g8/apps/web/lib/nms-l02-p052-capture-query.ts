import {p052BoundCapture,type P052CaptureIdentityRequest} from '../../../packages/demos/src/nms-l02-p052-capture-identity-v1';
type Query=Record<string,string|string[]|undefined>;
/** Empty query or the host's standalone focus-mode link is live playback.
 * Any capture query must specify one complete,
 * exact identity; never fall back from a failed capture to live playback. */
export function parseP052CaptureQuery(query:Query,locale:string):P052CaptureIdentityRequest|null{
 const keys=['capture','frameDomain','scenario','frame','lang','seed','rootFrame','requirementId','trace','entryStateSha256'];
 if(Object.keys(query).length===0)return null;
 if(Object.keys(query).length===1&&query.mode==='focus')return null;
 if(Object.keys(query).length!==keys.length||keys.some(key=>typeof query[key]!=='string')
  ||Object.keys(query).some(key=>!keys.includes(key))||query.capture!=='1'||query.lang!==locale)throw Error('P052_CAPTURE_QUERY');
 const number=(key:string)=>{const value=query[key] as string;if(!/^(0|[1-9][0-9]*)$/.test(value))throw Error('P052_CAPTURE_NUMBER');return Number(value);};
 const request={frameDomain:query.frameDomain,scenario:query.scenario,frame:number('frame'),language:query.lang,
  seed:number('seed'),rootFrame:number('rootFrame'),requirementId:query.requirementId,traceId:query.trace,
  entryStateSha256:query.entryStateSha256} as P052CaptureIdentityRequest;
 p052BoundCapture(request);return request;
}
