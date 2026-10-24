import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P004_RESOURCE_PINS} from './alg-l06-p004-local-request-v1';
import {P004_PREDECESSOR_RESOURCES} from './alg-l06-p004-predecessor-request-v1';

const ROOT='/flash-assets/g678-local/shared-alg001-l06-p008/predecessor';
const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const REFERERS=new Set([
  `${ORIGIN}/en/migration-status/g678-calibration/shared-alg001-l06-p008/candidate-v1`,
  `${ORIGIN}/es/migration-status/g678-calibration/shared-alg001-l06-p008/candidate-v1`,
]);

/** Six old URLs, each redirected internally to a distinct P008-only route.
 * Existing P004/P003 readers remain unchanged and verify their own proofs. */
export const P008_PREDECESSOR_RESOURCES=Object.freeze({
  p004Canvas:Object.freeze({originalPath:P004_RESOURCE_PINS.canvas.path,bridgePath:`${ROOT}/p004/canvas`,
    sha256:P004_RESOURCE_PINS.canvas.sha256,bytes:P004_RESOURCE_PINS.canvas.bytes,
    contentType:P004_RESOURCE_PINS.canvas.contentType}),
  p004Main:Object.freeze({originalPath:P004_RESOURCE_PINS.main.path,bridgePath:`${ROOT}/p004/main`,
    sha256:P004_RESOURCE_PINS.main.sha256,bytes:P004_RESOURCE_PINS.main.bytes,
    contentType:P004_RESOURCE_PINS.main.contentType}),
  p004Spanish:Object.freeze({originalPath:P004_RESOURCE_PINS.spanish.path,bridgePath:`${ROOT}/p004/spanish`,
    sha256:P004_RESOURCE_PINS.spanish.sha256,bytes:P004_RESOURCE_PINS.spanish.bytes,
    contentType:P004_RESOURCE_PINS.spanish.contentType}),
  p003Canvas:Object.freeze({originalPath:P004_PREDECESSOR_RESOURCES.canvas.originalPath,
    bridgePath:`${ROOT}/p003/canvas`,sha256:P004_PREDECESSOR_RESOURCES.canvas.sha256,
    bytes:P004_PREDECESSOR_RESOURCES.canvas.bytes,contentType:P004_PREDECESSOR_RESOURCES.canvas.contentType}),
  p003Main:Object.freeze({originalPath:P004_PREDECESSOR_RESOURCES.main.originalPath,
    bridgePath:`${ROOT}/p003/main`,sha256:P004_PREDECESSOR_RESOURCES.main.sha256,
    bytes:P004_PREDECESSOR_RESOURCES.main.bytes,contentType:P004_PREDECESSOR_RESOURCES.main.contentType}),
  p003Spanish:Object.freeze({originalPath:P004_PREDECESSOR_RESOURCES.spanish.originalPath,
    bridgePath:`${ROOT}/p003/spanish`,sha256:P004_PREDECESSOR_RESOURCES.spanish.sha256,
    bytes:P004_PREDECESSOR_RESOURCES.spanish.bytes,contentType:P004_PREDECESSOR_RESOURCES.spanish.contentType}),
});
export type P008PredecessorResource=keyof typeof P008_PREDECESSOR_RESOURCES;
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};

export function p008PredecessorResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P008PredecessorResource|null{
  const {method,url,headers}=request;
  if(env.NODE_ENV!=='development'||Boolean(env.VERCEL)||Boolean(env.VERCEL_ENV)||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    !REFERERS.has(headers.get('referer')??'')||headers.get('range')!==null||
    (headers.get('origin')!==null&&headers.get('origin')!==ORIGIN))return null;
  for(const [kind,pin] of Object.entries(P008_PREDECESSOR_RESOURCES) as
    [P008PredecessorResource,(typeof P008_PREDECESSOR_RESOURCES)[P008PredecessorResource]][]){
    if(url.pathname!==pin.originalPath&&url.pathname!==pin.bridgePath)continue;
    if(url.search!==`?sha256=${pin.sha256}`)return null;
    if(kind.endsWith('Canvas')){
      if(method!=='GET'||headers.get('sec-fetch-site')!=='same-origin'||
        !['cors','no-cors'].includes(headers.get('sec-fetch-mode')??'')||
        headers.get('sec-fetch-dest')!=='script'||
        (headers.get('sec-fetch-mode')==='cors'&&headers.get('origin')!==ORIGIN))return null;
    }else if(!['GET','HEAD'].includes(method)||headers.get('sec-fetch-site')!=='same-origin'||
      headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty')return null;
    return kind;
  }
  return null;
}
export const isP008PredecessorRequest=(request:SourceRequest,env:G678PreviewEnvironment=process.env)=>
  p008PredecessorResourceForRequest(request,env)!==null;
export const isP008PredecessorOriginalRequest=(request:SourceRequest,env:G678PreviewEnvironment=process.env)=>{
  const kind=p008PredecessorResourceForRequest(request,env);
  return kind!==null&&request.url.pathname===P008_PREDECESSOR_RESOURCES[kind].originalPath;
};
