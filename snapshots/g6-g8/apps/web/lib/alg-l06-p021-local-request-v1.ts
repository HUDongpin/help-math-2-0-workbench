import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P020_RESOURCE_PINS} from './alg-l06-p020-local-request-v1';
import {P021_ASSET_ROOT as ROOT,P021_LOCAL_ORIGIN as ORIGIN,
  p021CandidateReferer,p021LocalDevelopment} from './alg-l06-p021-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','feedback-right-1','feedback-right-2','feedback-right-3','feedback-right-4','feedback-wrong-1','feedback-wrong-2','feedback-wrong-3','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P020_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p020-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P021 resources and the unchanged registered predecessor assets. */
export const P021_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p021-canvas-v1/canvas-renderer.js",'workspace',1534517,"f3af3d1445601440dbfa0ab8fce83bc9e6dd499ce14885d9e63c2ac2d80e0ca6","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","output/alg-l06-p021-audio-v1/sprite-43-source-v1.mp3",'workspace',153660,"8d9675013afc1efd57dabf4cdddc12d3e54454fdef5989e4feb180f1b452f305","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p021-audio-v1/separate-sa-source-v1.mp3",'workspace',355152,"74d2579aeb963ca841d501a80e9830c05ae23153a87daa6e0a277c105f31f5d9","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P021Resource=keyof typeof P021_RESOURCE_PINS;
export const P021_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P021_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p021ResourceUrl=(resource:P021Resource)=>{
  const row=P021_RESOURCE_PINS[resource];
  if(!row)throw Error('P021_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p021ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P021Resource|null{
  const {method,url,headers}=request;
  if(!p021LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p021CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P021_RESOURCE_PINS)){
    if(url.pathname!==row.originalPath&&url.pathname!==row.bridgePath)continue;
    if(url.search!==`?sha256=${row.sha256}`)return null;
    const script=row.contentType.startsWith('text/javascript');
    if(script?(method!=='GET'||headers.get('sec-fetch-dest')!=='script'||
      !['cors','no-cors'].includes(headers.get('sec-fetch-mode')??'')||
      (headers.get('sec-fetch-mode')==='cors'&&origin!==ORIGIN)):
      (!['GET','HEAD'].includes(method)||headers.get('sec-fetch-dest')!=='empty'||
      headers.get('sec-fetch-mode')!=='cors'))return null;
    return token;
  }
  return null;
}
