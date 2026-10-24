import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {ALG_L6_P003_CANVAS_SHA256} from './g678-alg-l06-p003-probe-access';
import {P003_CONTINUOUS_SOURCE_SHA256} from './alg-l06-p003-continuous-source-access-v2';
import {P003_OPTIONAL_SPANISH_SHA256} from './alg-l06-p003-optional-spanish-access-v1';

const ORIGINAL_ROOT='/flash-assets/g678-local/shared-alg001-l06-p003';
const BRIDGE_ROOT='/flash-assets/g678-local/shared-alg001-l06-p004/predecessor';
const REFERER=/^http:\/\/127\.0\.0\.1:3331\/(?:en|es)\/migration-status\/g678-calibration\/shared-alg001-l06-p004\/candidate-v1$/u;
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

export const P004_PREDECESSOR_RESOURCES=Object.freeze({
  canvas:Object.freeze({originalPath:`${ORIGINAL_ROOT}/canvas-renderer.js`,
    bridgePath:`${BRIDGE_ROOT}/canvas`,sha256:ALG_L6_P003_CANVAS_SHA256,
    bytes:9063233,contentType:'text/javascript; charset=utf-8'}),
  main:Object.freeze({originalPath:`${ORIGINAL_ROOT}/continuous-source-v2`,
    bridgePath:`${BRIDGE_ROOT}/main`,sha256:P003_CONTINUOUS_SOURCE_SHA256,
    bytes:263640,contentType:'audio/mpeg'}),
  spanish:Object.freeze({originalPath:`${ORIGINAL_ROOT}/optional-spanish-audio-v1`,
    bridgePath:`${BRIDGE_ROOT}/spanish`,sha256:P003_OPTIONAL_SPANISH_SHA256,
    bytes:135408,contentType:'audio/mpeg'}),
} as const);
export type P004PredecessorResource=keyof typeof P004_PREDECESSOR_RESOURCES;
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};

/** Edge-safe bridge for only the P004 candidate document. Both URL forms
 * are validated independently; a rewrite never broadens the old P003 route. */
export function p004PredecessorResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P004PredecessorResource|null{
  const {method,url,headers}=request;
  if(env.NODE_ENV!=='development'||Boolean(env.VERCEL)||Boolean(env.VERCEL_ENV)||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||
    !isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    headers.get('referer')===null||!REFERER.test(headers.get('referer')!)||
    headers.get('range')!==null||
    (headers.get('origin')!==null&&headers.get('origin')!=='http://127.0.0.1:3331'))return null;
  for(const [kind,resource] of Object.entries(P004_PREDECESSOR_RESOURCES) as
    [P004PredecessorResource,(typeof P004_PREDECESSOR_RESOURCES)[P004PredecessorResource]][]){
    if(url.pathname!==resource.originalPath&&url.pathname!==resource.bridgePath)continue;
    if(url.search!==`?sha256=${resource.sha256}`)return null;
    if(kind==='canvas'){
      if(method!=='GET'||headers.get('sec-fetch-site')!=='same-origin'||
        !['cors','no-cors'].includes(headers.get('sec-fetch-mode')??'')||
        headers.get('sec-fetch-dest')!=='script'||
        (headers.get('sec-fetch-mode')==='cors'&&headers.get('origin')!=='http://127.0.0.1:3331'))return null;
    }else if(!['GET','HEAD'].includes(method)||headers.get('sec-fetch-site')!=='same-origin'||
      headers.get('sec-fetch-mode')!=='cors'||headers.get('sec-fetch-dest')!=='empty')return null;
    return kind;
  }
  return null;
}

export const isP004PredecessorRequest=(request:SourceRequest,env:G678PreviewEnvironment=process.env)=>
  p004PredecessorResourceForRequest(request,env)!==null;
export const isP004PredecessorOriginalRequest=(request:SourceRequest,env:G678PreviewEnvironment=process.env)=>{
  const kind=p004PredecessorResourceForRequest(request,env);
  return kind!==null&&request.url.pathname===P004_PREDECESSOR_RESOURCES[kind].originalPath;
};
