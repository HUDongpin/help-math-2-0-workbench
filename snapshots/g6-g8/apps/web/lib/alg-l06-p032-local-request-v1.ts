import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P028_RESOURCE_PINS} from './alg-l06-p028-local-request-v1';
import {P032_ASSET_ROOT as ROOT,P032_LOCAL_ORIGIN as ORIGIN,
  p032CandidateReferer,p032LocalDevelopment} from './alg-l06-p032-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P028_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p028-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P032 resources and unchanged 106 P028 predecessor URLs. */
export const P032_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","migrations/shared-alg001-l06-p032/canvas-v1/canvas-renderer.js",'workspace',1218521,"646ef50a5e3dc054bca4a323f6da775b82b22e769f33221fdaa155f51e0e2eaf","text/javascript; charset=utf-8"),
 "main-source-v1":pin(`${ROOT}/main-source-v1`,"main-source-v1","migrations/shared-alg001-l06-p032/audio-source-v1/main-source-v1.mp3",'workspace',171080,"2584a692ee3936f02c3dc491872225f020744ce92710f890e1a31d468a75c85b","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","G6-G8-shared/ALG001/L6/SA/L6IN04.mp3",'source',232176,"9cdf2402eea05caebc190680eff4b15ee3baada80e366ed4e4ac96df7f3dd478","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P032Resource=keyof typeof P032_RESOURCE_PINS;
export const P032_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P032_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p032ResourceUrl=(resource:P032Resource)=>{
  const row=P032_RESOURCE_PINS[resource];
  if(!row)throw Error('P032_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p032ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P032Resource|null{
  const {method,url,headers}=request;
  if(!p032LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p032CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P032_RESOURCE_PINS)){
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
