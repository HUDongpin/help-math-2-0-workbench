import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';
import {P034_RESOURCE_PINS} from './alg-l06-p034-local-request-v1';
import {P035_ASSET_ROOT as ROOT,P035_LOCAL_ORIGIN as ORIGIN,
  p035DocumentKindFromReferer,p035LocalDevelopment} from './alg-l06-p035-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
  root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
  bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
    originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P034_RESOURCE_PINS).map(([token,row])=>{
 const newToken=`p034-${token}`;
 return [newToken,pin(row.originalPath,newToken,row.path,row.root,row.bytes,row.sha256,row.contentType)];
}));

/** Nine exact P035 resources and unchanged 112 predecessor resource pins. */
export const P035_RESOURCE_PINS=Object.freeze({
 "canvas-renderer.js":pin(`${ROOT}/canvas-renderer.js`,"canvas-renderer.js","migrations/shared-alg001-l06-p035/canvas-v1/canvas-renderer.js",'workspace',5835906,"b0011b78121b76672ec62706f5943013885e8d0a31756707f2a246078b906ab3","text/javascript; charset=utf-8"),
 "feedback-80":pin(`${ROOT}/feedback-80`,"feedback-80","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-80-wrong-1.mp3",'workspace',11570,"770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541","audio/mpeg"),
 "feedback-95":pin(`${ROOT}/feedback-95`,"feedback-95","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-95-wrong-3.mp3",'workspace',11050,"3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0","audio/mpeg"),
 "feedback-126":pin(`${ROOT}/feedback-126`,"feedback-126","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-126-wrong-2.mp3",'workspace',11050,"f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1","audio/mpeg"),
 "feedback-154":pin(`${ROOT}/feedback-154`,"feedback-154","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-154-right-4.mp3",'workspace',11050,"529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085","audio/mpeg"),
 "feedback-195":pin(`${ROOT}/feedback-195`,"feedback-195","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-195-right-2.mp3",'workspace',11050,"3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7","audio/mpeg"),
 "feedback-207":pin(`${ROOT}/feedback-207`,"feedback-207","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-207-right-3-ffmpeg-pcm16.wav",'workspace',12038,"4b5db760a6ab8916c19422426bfc5a8980323ea280543a32f00f3e60a7f8a646","audio/wav"),
 "main-source-v1":pin(`${ROOT}/main-source-v1`,"main-source-v1","migrations/shared-alg001-l06-p035/audio-source-v1/streams/sprite-227-main.mp3",'workspace',216320,"31769b5944c74d1246f2fea66f4da200c2e57de869ab63ac4293ea0ae87d36c0","audio/mpeg"),
 "optional-spanish-audio-v1":pin(`${ROOT}/optional-spanish-audio-v1`,"optional-spanish-audio-v1","migrations/shared-alg001-l06-p035/audio-source-v1/streams/L6IN07-separate-SA.mp3",'workspace',130704,"ca0d2121df287403e350e2f8812a755c3d5f43f6b13c2c84f8e205b286b8c79f","audio/mpeg"),
 ...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P035Resource=keyof typeof P035_RESOURCE_PINS;
export const P035_PREDECESSOR_ORIGINAL_PATHS=Object.freeze(Object.values(P035_RESOURCE_PINS)
  .filter(row=>row.originalPath!==row.bridgePath).map(row=>row.originalPath));
export const p035ResourceUrl=(resource:P035Resource)=>{
  const row=P035_RESOURCE_PINS[resource];
  if(!row)throw Error('P035_RESOURCE_UNKNOWN');
  return `${row.originalPath}?sha256=${row.sha256}`;
};
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};
/** Both original URLs and internal rewrite paths require the same exact pin. */
export function p035ResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P035Resource|null{
  const {method,url,headers}=request;
  if(!p035LocalDevelopment(env)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
  const origin=headers.get('origin');
  if(origin!==null&&origin!==ORIGIN)return null;
  if(!p035DocumentKindFromReferer(headers.get('referer')))return null;
  for(const [token,row] of Object.entries(P035_RESOURCE_PINS)){
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
