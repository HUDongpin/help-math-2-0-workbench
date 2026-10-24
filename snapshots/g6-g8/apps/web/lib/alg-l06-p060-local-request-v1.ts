import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
 type G678PreviewEnvironment} from './g678-preview-policy';
import {P058_RESOURCE_PINS} from './alg-l06-p058-local-request-v1';
import {P060_AUDIO_SOURCE} from '../../../packages/demos/src/generated/alg-l06-p060-measured-v1';
import {P060_ASSET_ROOT as ROOT,P060_LOCAL_ORIGIN as ORIGIN,
 p060CandidateReferer,p060LocalDevelopment} from './alg-l06-p060-preview-policy-v1';

type ResourcePin=Readonly<{originalPath:string;bridgePath:string;path:string;
 root:'workspace'|'source';bytes:number;sha256:string;contentType:string}>;
const pin=(originalPath:string,token:string,path:string,root:ResourcePin['root'],
 bytes:number,sha256:string,contentType:string):ResourcePin=>Object.freeze({
 originalPath,bridgePath:`${ROOT}/${token}`,path,root,bytes,sha256,contentType});
const inherited=Object.fromEntries(Object.entries(P058_RESOURCE_PINS).map(([token,row])=>{
 const bridge=`p058-${token}`;
 return [bridge,pin(row.originalPath,bridge,row.path,row.root,row.bytes,
  row.sha256,row.contentType)];
}));
const ownAudio=Object.fromEntries(P060_AUDIO_SOURCE.assets.map(asset=>{
 const token=`quiz-${asset.id.toLowerCase()}`;
 return [token,pin(`${ROOT}/${token}`,token,
  `migrations/shared-alg001-l06-p060/audio-v1/${asset.language==='en'?'EA':'SA'}/Q${asset.question}${asset.choice??''}.mp3`,
  'workspace',asset.binding.sourceBytes,asset.binding.sourceSha256,'audio/mpeg')];
}));
/** All 240 original P060 roles plus exact inherited P058 dependencies. */
export const P060_RESOURCE_PINS=Object.freeze({...ownAudio,...inherited}) as Readonly<Record<string,ResourcePin>>;
export type P060Resource=keyof typeof P060_RESOURCE_PINS;
type SourceRequest={readonly method:string;readonly url:URL;
 readonly headers:Pick<Headers,'get'>};
/** Exact source URL, SHA, referer and fetch mode for the P060 document. */
export function p060ResourceForRequest(request:SourceRequest,
 env:G678PreviewEnvironment=process.env):P060Resource|null{
 const {method,url,headers}=request;
 if(!p060LocalDevelopment(env)||!isG678LocalPreviewRequestUrl(url,env)||
  !isG678LocalPreviewRequestHeaders(headers,env)||
  url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
  headers.get('host')!=='127.0.0.1:3331'||
  ![null,'127.0.0.1:3331'].includes(headers.get('x-forwarded-host'))||
  ![null,'http'].includes(headers.get('x-forwarded-proto'))||
  headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin')return null;
 const origin=headers.get('origin');
 if(origin!==null&&origin!==ORIGIN)return null;
 if(!p060CandidateReferer(headers.get('referer')))return null;
 for(const [token,row] of Object.entries(P060_RESOURCE_PINS)){
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
