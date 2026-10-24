import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P018_RESOURCE_PINS} from './alg-l06-p018-local-request-v1';
import {P019_ASSET_ROOT as ROOT,P019_LOCAL_ORIGIN as ORIGIN,
  p019CandidateReferer,p019LocalDevelopment} from './alg-l06-p019-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P018_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p018-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P019 resources and the unchanged registered predecessor assets. */
export const P019_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p019-canvas-v1/canvas-renderer.js",'workspace',1434313,"8e33f562010cb30f4dece352cb4167d9b3caed1128605098cea0a12d2b0db59b","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","output/alg-l06-p019-audio-v1/sprite-37-source-v1.mp3",'workspace',144950,"0817bac5188a2a24d9eb48b3c8bffd293f31b715c4816e7159467d00c83f49ad","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p019-audio-v1/separate-sa-source-v1.mp3",'workspace',238896,"4c9c5df0d49d8a612a00c73f9dcf31ef63a4d34ab6c458625432e71b46c129d9","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P019Resource=keyof typeof P019_RESOURCE_PINS;
export const P019_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P019_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p019ResourceUrl=(resource:P019Resource)=>{
  const row=P019_RESOURCE_PINS[resource];
  if(!row)throw Error('P019_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p019ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P019Resource|null{
  const {method,url,headers}=request;
  if(!p019LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p019CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P019_RESOURCE_PINS)){
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
