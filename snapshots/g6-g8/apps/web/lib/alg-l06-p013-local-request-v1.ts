import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P010_RESOURCE_PINS} from './alg-l06-p010-local-request-v1';
import {P010_PREDECESSOR_RESOURCES} from './alg-l06-p010-predecessor-request-v1';
import {P010_LESSON_CANVAS_RESOURCES} from './alg-l06-p010-lesson-canvas-request-v1';

const ID='shared-alg001-l06-p013';
const ROOT=`/flash-assets/g678-local/${ID}`;
const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});

const P010_PATHS={
  p010Canvas:'work/g678-shared-page-factory/g678-alg-l06-p010-current-js-20260928-v1/members/shared-alg001-l06-p010/canvas-renderer.js',
  p010Main:'migrations/shared-alg001-l06-p010/audit/audio-v1/continuous-source-v1.mp3',
  p010Spanish:'migrations/shared-alg001-l06-p010/audit/audio-v1/separate-sa-source-v1.mp3',
} as const;
const PREDECESSOR_PATHS={
  p008Canvas:'work/g678-shared-page-factory/g678-alg-l06-p008-current-js-20260928-v1/members/shared-alg001-l06-p008/canvas-renderer.js',
  p008Main:'migrations/shared-alg001-l06-p008/audit/audio-v1/continuous-source-v1.mp3',
  p008Spanish:'migrations/shared-alg001-l06-p008/audit/audio-v1/separate-sa-source-v1.mp3',
  p004Canvas:'work/g678-shared-page-factory/g678-alg-l06-p004-current-js-20260928-v1/members/shared-alg001-l06-p004/canvas-renderer.js',
  p004Main:'migrations/shared-alg001-l06-p004/audit/continuous-source-v1.mp3',
  p004Spanish:'G6-G8-shared/ALG001/L6/SA/L6RW04.mp3',
  p003Canvas:'work/g678-shared-page-factory/g678-alg-l06-p003-continuous-20260928-v1/members/shared-alg001-l06-p003/canvas-renderer.js',
  p003Main:'work/g678-shared-page-factory/g678-alg-l06-p003-continuous-20260928-v1/members/shared-alg001-l06-p003/continuous-source.mp3',
  p003Spanish:'work/g678-shared-page-factory/g678-alg-l06-p003-continuous-20260928-v1/members/shared-alg001-l06-p003/optional-spanish.mp3',
} as const;
const predecessor=Object.fromEntries(Object.entries(P010_PREDECESSOR_RESOURCES).map(([token,source])=>{
  const path=PREDECESSOR_PATHS[token as keyof typeof PREDECESSOR_PATHS];
  if(!path)throw Error(`P013_PIN_UNKNOWN_PREDECESSOR: ${token}`);
  return [token,pin(source.originalPath,token,path,
    token==='p004Spanish'?'source':'workspace',source.bytes,source.sha256,source.contentType)];
}));
const lessonCanvas=Object.fromEntries(Object.entries(P010_LESSON_CANVAS_RESOURCES).map(([token,source])=>
  [token,pin(source.originalPath,token,source.path,'workspace',source.bytes,source.sha256,source.contentType)]));

/** One edge-safe table for the three P013 resources and only the registered
 * predecessor resources reachable from its 23-page candidate host. */
export const P013_RESOURCE_PINS=Object.freeze({
  'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
    'output/alg-l06-p013-canvas-v1/canvas-renderer.js','workspace',4346113,
    '0fcb9e14cbae8ff38b0fbf213b090e1299d65027abd4b365950ca875042b4b0d',
    'text/javascript; charset=utf-8'),
  'continuous-source-v1':pin(`${ROOT}/continuous-source-v1`,'continuous-source-v1',
    'migrations/shared-alg001-l06-p013/audit/audio-v1/continuous-source-v1.mp3','workspace',151710,
    '3d646619b33b9e859aff68bf331f224158916aa9f4e99b16cdc910791c7d41c1','audio/mpeg'),
  'optional-spanish-audio-v1':pin(`${ROOT}/optional-spanish-audio-v1`,'optional-spanish-audio-v1',
    'migrations/shared-alg001-l06-p013/audit/audio-v1/separate-sa-source-v1.mp3','workspace',327936,
    '2db938405bd646e4bf37e0b9cdf5438cc65451a2d4f7304c93dbc2b6653e8575','audio/mpeg'),
  p010Canvas:pin(P010_RESOURCE_PINS.canvas.path,'p010Canvas',P010_PATHS.p010Canvas,'workspace',
    P010_RESOURCE_PINS.canvas.bytes,P010_RESOURCE_PINS.canvas.sha256,P010_RESOURCE_PINS.canvas.contentType),
  p010Main:pin(P010_RESOURCE_PINS.main.path,'p010Main',P010_PATHS.p010Main,'workspace',
    P010_RESOURCE_PINS.main.bytes,P010_RESOURCE_PINS.main.sha256,P010_RESOURCE_PINS.main.contentType),
  p010Spanish:pin(P010_RESOURCE_PINS.spanish.path,'p010Spanish',P010_PATHS.p010Spanish,'workspace',
    P010_RESOURCE_PINS.spanish.bytes,P010_RESOURCE_PINS.spanish.sha256,P010_RESOURCE_PINS.spanish.contentType),
  ...predecessor,...lessonCanvas,
}) as Readonly<Record<string,ResourcePin>>;
export type P013Resource=keyof typeof P013_RESOURCE_PINS;
export const P013_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P013_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p013ResourceUrl=(resource:P013Resource)=>{
  const row=P013_RESOURCE_PINS[resource];
  if(!row)throw Error('P013_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${ID}/${version}`)));

/** Exact P013 local document and resource identity. Internal rewrites retain
 * the original query; both URL forms are checked against the same pin. */
export function p013ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P013Resource|null{
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
  for(const [token,row] of Object.entries(P013_RESOURCE_PINS)){
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
