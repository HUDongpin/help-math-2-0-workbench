import {p055PilotResources,type P055PilotAssetName} from '@/lib/nms-l02-ts-pilot-assets.server';
import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl} from '@/lib/g678-preview-policy';

export const dynamic='force-dynamic';
const HEADERS={'Cache-Control':'private, no-store, max-age=0',
 'Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff',
 'X-Robots-Tag':'noindex, nofollow, noarchive, noimageindex',
 Vary:'Host, X-Forwarded-Host, Referer, Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest'};
const deny=()=>new Response(null,{status:404,headers:HEADERS});
const NAMES=['typography.js','main.mp3'] as const;

/** Local-only P055 candidate assets. The page, original SWF and both generated
 * files are re-verified on every request; no registration is conferred. */
export async function GET(request:Request,context:{params:Promise<{asset:string}>}){
 try{
  const name=(await context.params).asset as P055PilotAssetName;
  const url=new URL(request.url),headers=request.headers;
  const script=name==='typography.js',mode=headers.get('sec-fetch-mode');
  const dest=headers.get('sec-fetch-dest'),host=headers.get('host');
  if(request.method!=='GET'||!NAMES.includes(name)||
    !isG678LocalPreviewRequestUrl(url)||!isG678LocalPreviewRequestHeaders(headers)||
    url.protocol!=='http:'||url.username||url.password||url.hash||headers.has('range')||
    headers.get('sec-fetch-site')!=='same-origin'||!host||
    (headers.has('x-forwarded-host')&&headers.get('x-forwarded-host')!==host)||
    (script?(!['cors','no-cors'].includes(mode??'')||dest!=='script'):
      (!['same-origin','cors','no-cors'].includes(mode??'')||
        !['audio','empty'].includes(dest??''))))return deny();
  const browser=new URL(`http://${host}`),referer=new URL(headers.get('referer')??'');
  const origin=headers.get('origin');
  if(browser.host!==host||browser.port!==url.port||browser.pathname!=='/'||
    browser.username||browser.password||referer.origin!==browser.origin||referer.username||referer.password||referer.search||
    referer.hash||!/^\/(en|es)\/migration-status\/(?:g678-calibration\/shared-nms002-l02-p055|g678-course\/nms002\/2)$/u.test(referer.pathname)||
    (origin!==null&&origin!==browser.origin)||(script&&mode==='cors'&&origin===null))return deny();
  const resource=p055PilotResources().find(item=>item.name===name);
  if(!resource||url.pathname!==`/migration-assets/nms-l02-ts-pilot/${name}`||
    url.search!==`?sha256=${resource.sha256}`)return deny();
  return new Response(new Uint8Array(resource.bytes),{headers:{...HEADERS,
    'Content-Type':resource.contentType,'Content-Length':String(resource.bytes.length)}});
 }catch{return deny();}
}
