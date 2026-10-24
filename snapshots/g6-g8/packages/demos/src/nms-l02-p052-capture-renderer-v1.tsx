import React from 'react';
import {p052BoundCapture,type P052CaptureIdentityRequest} from './nms-l02-p052-capture-identity-v1';
export {p052BoundCapture,type P052CaptureIdentityRequest} from './nms-l02-p052-capture-identity-v1';
import {P052PageView} from './nms-l02-p052-page-view-v1';
/** No controller/audio allocation. Uses the same view and reducer as playback. */
export function P052CaptureRenderer({request}:{request:P052CaptureIdentityRequest}){
 const result=p052BoundCapture(request);
 return <P052PageView state={result.state} language={result.language} interactive={false} onEvent={()=>{}}
  captureIdentity={result}/>;
}
