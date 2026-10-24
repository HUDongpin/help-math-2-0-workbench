import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P017_RESOURCE_PINS} from './alg-l06-p017-local-request-v1';

const ID='shared-alg001-l06-p018';
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
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P017_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p017-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Three exact P018 resources and the unchanged registered predecessor assets. */
export const P018_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p018-canvas-v1/canvas-renderer.js",'workspace',2638179,"0204230c05b37bc076ae7510bbb4f6ef56b25d1fe50945f2bbb35e43521e88c6","text/javascript; charset=utf-8"),
 "main-1":pin(`${ROOT}/main-1`,"main-1","migrations/shared-alg001-l06-p018/audit/audio-v1/sprite-32-source-v1.mp3",'workspace',268190,"dbdb6229947cde1d0353c3ccc41e05514ac988559b49d26c9f8f52d637a59770","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","migrations/shared-alg001-l06-p018/audit/audio-v1/separate-sa-source-v1.mp3",'workspace',308112,"1d6f1de82903f62e5c642ce0e51b1baa03ec30c1fbfbcd46f135e2c4d5538057","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P018Resource=keyof typeof P018_RESOURCE_PINS;
export const P018_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P018_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p018ResourceUrl=(resource:P018Resource)=>{
  const row=P018_RESOURCE_PINS[resource];
  if(!row)throw Error('P018_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${ID}/${version}`)));

/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p018ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P018Resource|null{
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
  for(const [token,row] of Object.entries(P018_RESOURCE_PINS)){
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
