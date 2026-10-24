import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P013_RESOURCE_PINS} from './alg-l06-p013-local-request-v1';

const ID='shared-alg001-l06-p014';
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
const inheritedTokens={
  'canvas-renderer.js':'p013Canvas',
  'continuous-source-v1':'p013Main',
  'optional-spanish-audio-v1':'p013Spanish',
} as const;
const P013_REGISTERED_CANVAS=
  'work/g678-shared-page-factory/g678-alg-l06-p013-current-js-20260928-v1/members/shared-alg001-l06-p013/canvas-renderer.js';
const inherited=Object.fromEntries(Object.entries(P013_RESOURCE_PINS).map(([token,row])=>{
  const newToken=inheritedTokens[token as keyof typeof inheritedTokens]??token;
  const physical=token==='canvas-renderer.js'?P013_REGISTERED_CANVAS:row.path;
  return [newToken,pin(row.originalPath,newToken,physical,row.root,
    row.bytes,row.sha256,row.contentType)];
}));

/** Exact P014 candidate resources plus the 33 formally registered predecessor
 * resources reachable from its My Lesson sequence. Every byte is rechecked. */
export const P014_RESOURCE_PINS=Object.freeze({
  'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
    'work/g678-shared-page-factory/g678-alg-l06-p014-current-js-20260929-v1/members/shared-alg001-l06-p014/canvas-renderer.js','workspace',3939200,
    'd01ed8b9bf43d9d88d8eeb5960e42ac1bcac941fce1b0a1eb31732ac097cad3f',
    'text/javascript; charset=utf-8'),
  'main-1':audio('main-1','sprite-227-range-1-source-v1',44720,
    '73f2bb2a7319375e303ac746597e93e3ca3a9f25abdc1b62fb2771b117d575fd'),
  'main-2':audio('main-2','sprite-227-range-2-source-v1',134810,
    '0b3ff7347edc73632e4c55356f2139d959f124dfaa4b4efebcb9316765a821f7'),
  'sprite-28':audio('sprite-28','sprite-28-source-v1',10270,
    '1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e'),
  'sprite-83':audio('sprite-83','sprite-83-source-v1',11960,
    '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b'),
  'sprite-115':audio('sprite-115','sprite-115-source-v1',9880,
    '105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d'),
  'sprite-148':audio('sprite-148','sprite-148-source-v1',11050,
    'b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19'),
  'sprite-156':audio('sprite-156','sprite-156-source-v1',10660,
    '18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec'),
  'sprite-173':audio('sprite-173','sprite-173-source-v1',11960,
    '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77'),
  'sprite-187':audio('sprite-187','sprite-187-source-v1',11570,
    '5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d'),
  'optional-spanish-audio-v1':audio('optional-spanish-audio-v1','separate-sa-source-v1',136080,
    'b506e9e83e9716ed9c57d358f3f6664b5e3b8d8735d94ea4acb57449e148592d'),
  ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P014Resource=keyof typeof P014_RESOURCE_PINS;
export const P014_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P014_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p014ResourceUrl=(resource:P014Resource)=>{
  const row=P014_RESOURCE_PINS[resource];
  if(!row)throw Error('P014_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${ID}/${version}`)));

/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p014ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P014Resource|null{
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
  for(const [token,row] of Object.entries(P014_RESOURCE_PINS)){
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
