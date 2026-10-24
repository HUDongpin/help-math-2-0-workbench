import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P016_RESOURCE_PINS} from './alg-l06-p016-local-request-v1';

const ID='shared-alg001-l06-p017';
const ROOT=`/flash-assets/g678-local/${ID}`;
const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const audio=(token:string,file:string,bytes:number,sha256:string)=>pin(
  `${ROOT}/${token}`,token,
  `migrations/${ID}/audit/audio-v1/${file}.mp3`,'workspace',bytes,sha256,'audio/mpeg');
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','main-2','main-3','main-4','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P016_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p016-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P017 resources and the unchanged registered predecessor assets. */
export const P017_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p017-canvas-v1/canvas-renderer.js",'workspace',4047416,"b78c06d8e3f0111ae28ee7d4c90f98381001fe3b3fa0e9e92d6b3ab24bda6a7f","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","migrations/shared-alg001-l06-p017/audit/audio-v1/sprite-42-source-v1.mp3",'workspace',298350,"e04bc7591c5da2c00237915391377d9826ae2ba22dc43d962e45c9a9f7c00d4f","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","migrations/shared-alg001-l06-p017/audit/audio-v1/separate-sa-source-v1.mp3",'workspace',617568,"7a00a610f17eddca68ec987978221afe07936ac0f48cb098927e2d04880eaf7f","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P017Resource=keyof typeof P017_RESOURCE_PINS;
export const P017_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P017_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p017ResourceUrl=(resource:P017Resource)=>{
  const row=P017_RESOURCE_PINS[resource];
  if(!row)throw Error('P017_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${ID}/${version}`)));

/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p017ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P017Resource|null{
  const {method,url,headers}=request;
  if(env.NODE_ENV!=='development'||Boolean(env.VERCEL)||Boolean(env.VERCEL_ENV)||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  try{
    const referer=new URL(headers.get('referer')??'');
    if(referer.origin!==ORIGIN||referer.username||referer.password||referer.hash||
      !['','?mode=focus'].includes(referer.search)||!DOCUMENTS.has(referer.pathname))return null;
  }catch{return null;}
  for(const [token,row] of Object.entries(P017_RESOURCE_PINS)){
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
