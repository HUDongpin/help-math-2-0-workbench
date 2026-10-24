import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P014_RESOURCE_PINS} from './alg-l06-p014-local-request-v1';

const ID='shared-alg001-l06-p015';
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
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','main-2','sprite-28','sprite-83','sprite-115','sprite-148','sprite-156','sprite-173','sprite-187','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P014_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p014-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Six exact P015 resources and the unchanged registered predecessor assets. */
export const P015_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
 'work/g678-shared-page-factory/g678-alg-l06-p015-current-js-20260929-v1/members/shared-alg001-l06-p015/canvas-renderer.js','workspace',10515188,
 '4a572881adce44d318329f8895458eed8f63e8679e41ebfd38bbb3f0ee3dcb55','text/javascript; charset=utf-8'),
 'main-1':audio('main-1',"sprite-270-range-1-source-v1",257010,"594760da0a94e6eff0f66bbb16c4ef6776ea23b46ff97a2a642b34e5acf80221"),
 'main-2':audio('main-2',"sprite-270-range-2-source-v1",23270,"3c069c45a39afe276aee729b2f92ac32d7c8341d147a55c134a13c4cd2457585"),
 'main-3':audio('main-3',"sprite-270-range-3-source-v1",56680,"55fb816f77fdfd1ae4eb3812af5340ac119592b1f697d87f6c7ee42a7be486d6"),
 'main-4':audio('main-4',"sprite-270-range-4-source-v1",26130,"f438e6cbc5ae5ef8e6de1005d80375afdd46175ada09bb5212b4069e469a2c94"),
 'optional-spanish-audio-v1':audio('optional-spanish-audio-v1','separate-sa-source-v1',363888,"55ae5c2c9d5aa5b3a00f3fd30e642f6410dcaf6b9e66f1bf77ee349cce2bf434"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P015Resource=keyof typeof P015_RESOURCE_PINS;
export const P015_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P015_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p015ResourceUrl=(resource:P015Resource)=>{
  const row=P015_RESOURCE_PINS[resource];
  if(!row)throw Error('P015_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate-v1','continuous-v1'].map(version=>
  `/${locale}/migration-status/g678-calibration/${ID}/${version}`)));

/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p015ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P015Resource|null{
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
  for(const [token,row] of Object.entries(P015_RESOURCE_PINS)){
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
