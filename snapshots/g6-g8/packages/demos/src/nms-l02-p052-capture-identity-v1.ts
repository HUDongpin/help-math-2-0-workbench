import {p052CaptureState,type P052CaptureRequest} from './nms-l02-p052-capture-state-v1';
import {P052_CAPTURE_IDENTITIES} from './generated/nms-l02-p052-capture-identities-v1';
export type P052CaptureIdentityRequest=P052CaptureRequest&Readonly<{
 requirementId:string;traceId:string;entryStateSha256:string;rootFrame:6;
}>;
/** Shared server/client validation without importing React or browser views. */
export function p052BoundCapture(request:P052CaptureIdentityRequest){
 const result=p052CaptureState(request),trace=`candidate-${result.scenario}-${result.language}-seed-${result.seed}`;
 if(request.rootFrame!==6||request.traceId!==trace||request.requirementId!==`req-${trace}`
  ||!Object.hasOwn(P052_CAPTURE_IDENTITIES,trace)
  ||request.entryStateSha256!==P052_CAPTURE_IDENTITIES[trace as keyof typeof P052_CAPTURE_IDENTITIES])throw Error('P052_CAPTURE_IDENTITY');
 return {...result,requirementId:request.requirementId,traceId:trace,entryStateSha256:request.entryStateSha256};
}
