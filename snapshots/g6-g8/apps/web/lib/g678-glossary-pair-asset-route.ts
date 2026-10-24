import {pairHostResources,type GlossaryPairId,type PairResourceName} from './g678-glossary-pair-assets.server';
import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl} from './g678-preview-policy';
const HEADERS={'Cache-Control':'private, no-store, max-age=0','Cross-Origin-Resource-Policy':'same-origin',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
 Vary:'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'};
const deny=()=>new Response(null,{status:404,headers:HEADERS});
export function glossaryPairAssetGet(id:GlossaryPairId){
 return async(request:Request,context:{params:Promise<{asset:string}>})=>{
  try{
   const name=(await context.params).asset as PairResourceName,url=new URL(request.url),headers=request.headers;
   const script=name==='typography.js',mode=headers.get('sec-fetch-mode'),dest=headers.get('sec-fetch-dest');
   if(request.method!=='GET'||!['typography.js','main.mp3','spanish-audio.mp3'].includes(name)||
    !isG678LocalPreviewRequestUrl(url)||!isG678LocalPreviewRequestHeaders(headers)||
    url.protocol!=='http:'||url.username||url.password||url.hash||headers.has('range')||
    headers.get('sec-fetch-site')!=='same-origin'||
    (headers.has('x-forwarded-host')&&headers.get('x-forwarded-host')!==headers.get('host'))||
    (script?(!['cors','no-cors'].includes(mode??'')||dest!=='script'):
     (!['same-origin','cors','no-cors'].includes(mode??'')||!['audio','empty'].includes(dest??''))))return deny();
   const browser=new URL(`http://${headers.get('host')}`),referer=new URL(headers.get('referer')??'');
   if(browser.host!==headers.get('host')||browser.port!==url.port||browser.pathname!=='/'||browser.username||browser.password||
    referer.origin!==browser.origin||referer.username||referer.password||referer.hash||
    (headers.has('origin')&&headers.get('origin')!==browser.origin)||(script&&mode==='cors'&&!headers.has('origin')))return deny();
   const resource=pairHostResources(id).find(item=>item.name===name)!;
   if(url.pathname!==`/flash-assets/g678-local/${id}/${name}`||url.search!==`?sha256=${resource.sha256}`)return deny();
   return new Response(new Uint8Array(resource.bytes),{headers:{...HEADERS,'Content-Type':resource.contentType,'Content-Length':String(resource.bytes.length)}});
  }catch{return deny();}
 };
}
