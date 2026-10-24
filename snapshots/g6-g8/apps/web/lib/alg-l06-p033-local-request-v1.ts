import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P050_RESOURCE_PINS} from './alg-l06-p050-local-request-v1';
import {P033_MEASURED_BINDINGS,type P033AudioDomain}
 from '../../../packages/demos/src/alg-l06-p033-measured-bindings-v1';
import {P033_ASSET_ROOT as ROOT,P033_LOCAL_ORIGIN as ORIGIN,
 p033CandidateReferer,p033LocalDevelopment} from './alg-l06-p033-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P050_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p050-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const streamFiles:Readonly<Record<P033AudioDomain,string>>=Object.freeze({main:'assets/source-stream-190.mp3',sa:'source-v1/L6IN05.mp3',...Object.fromEntries([46,78,111,119,147,161,175].map(id=>[String(id),'assets/source-stream-'+id+'.mp3']))}) as Record<P033AudioDomain,string>;
const ownAudio=Object.fromEntries((Object.keys(streamFiles) as P033AudioDomain[])
 .map(id=>{
  const token=id==='main'?'main-source-v1':id==='sa'?
   'optional-spanish-audio-v1':`feedback-${id}-source-v1`;
  const binding=P033_MEASURED_BINDINGS[id];
  return [token,pin(`${ROOT}/${token}`,token,
   `migrations/shared-alg001-l06-p033/${streamFiles[id]}`,
   'workspace',binding.sourceBytes,binding.sourceSha256,'audio/mpeg')];
 }));

/** Ten P033 source resources plus exact inherited P050 dependencies. */
export const P033_RESOURCE_PINS=Object.freeze({
 'canvas-renderer.js':pin(`${ROOT}/canvas-renderer.js`,'canvas-renderer.js',
  'migrations/shared-alg001-l06-p033/canvas-v1/canvas-renderer-draft.js',
  'workspace',2553292,
  '750d595b47eb3aa518df51e3b9bbb552e8fe27c8ff0a6a4d23d464fca615f465',
  'text/javascript; charset=utf-8'),
 ...ownAudio,...inherited,
}) as Readonly<Record<string,ResourcePin>>;
export type P033Resource=keyof typeof P033_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P033 document. */
export function p033ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P033Resource|null{
 const {method,url,headers}=request;
 if(!p033LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p033CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P033_RESOURCE_PINS)){
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
