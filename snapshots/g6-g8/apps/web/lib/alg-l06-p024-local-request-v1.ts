import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P023_RESOURCE_PINS} from './alg-l06-p023-local-request-v1';
import {P024_ASSET_ROOT as ROOT,P024_LOCAL_ORIGIN as ORIGIN,
  p024CandidateReferer,p024LocalDevelopment} from './alg-l06-p024-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const ownPreviousTokens=new Set(['canvas-renderer.js','main-1','optional-spanish-audio-v1']);
const inherited=Object.fromEntries(Object.entries(P023_RESOURCE_PINS).map(([token,row])=>{
 const newToken=ownPreviousTokens.has(token)?`p023-${token}`:token;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Ten exact P024 resources and the unchanged registered P023 predecessor assets. */
export const P024_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","output/alg-l06-p024-canvas-v2/canvas-renderer.js",'workspace',3724473,"e23b1e17c8c9a87b2c6165ac4e22a4710d221f0a70ef3cbe1c24fde343093070","text/javascript; charset=utf-8"),
 "sprite-69":pin(`${ROOT}/sprite-69`,"sprite-69","output/alg-l06-p024-audio-v1/sprite-69-source-v1.mp3",'workspace',11960,"2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77","audio/mpeg"),
 "sprite-83":pin(`${ROOT}/sprite-83`,"sprite-83","output/alg-l06-p024-audio-v1/sprite-83-source-v1.mp3",'workspace',11570,"5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d","audio/mpeg"),
 "sprite-97":pin(`${ROOT}/sprite-97`,"sprite-97","output/alg-l06-p024-audio-v1/sprite-97-source-v1.mp3",'workspace',10270,"1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e","audio/mpeg"),
 "sprite-123":pin(`${ROOT}/sprite-123`,"sprite-123","output/alg-l06-p024-audio-v1/sprite-123-source-v1.mp3",'workspace',11960,"70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b","audio/mpeg"),
 "sprite-155":pin(`${ROOT}/sprite-155`,"sprite-155","output/alg-l06-p024-audio-v1/sprite-155-source-v1.mp3",'workspace',9880,"105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d","audio/mpeg"),
 "sprite-188":pin(`${ROOT}/sprite-188`,"sprite-188","output/alg-l06-p024-audio-v1/sprite-188-source-v1.mp3",'workspace',11050,"b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19","audio/mpeg"),
 "sprite-196":pin(`${ROOT}/sprite-196`,"sprite-196","output/alg-l06-p024-audio-v1/sprite-196-source-v1.mp3",'workspace',10660,"18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec","audio/mpeg"),
 "sprite-208":pin(`${ROOT}/sprite-208`,"sprite-208","output/alg-l06-p024-audio-v1/sprite-208-source-v1.mp3",'workspace',157430,"d55b6869f9ba02d5c0921d5182b00c9d069242c2977b1ddc1a0743b5e57a46f3","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","output/alg-l06-p024-audio-v1/separate-sa-source-v1.mp3",'workspace',166320,"dd7f04214d8bfcdaf9ae98b99e542aa7f72f70accd1703381990ff4f43f57f0e","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P024Resource=keyof typeof P024_RESOURCE_PINS;
export const P024_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P024_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p024ResourceUrl=(resource:P024Resource)=>{
  const row=P024_RESOURCE_PINS[resource];
  if(!row)throw Error('P024_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p024ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P024Resource|null{
  const {method,url,headers}=request;
  if(!p024LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p024CandidateReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P024_RESOURCE_PINS)){
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
