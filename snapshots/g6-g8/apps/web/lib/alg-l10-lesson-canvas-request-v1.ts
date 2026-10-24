import {isG678LocalPreviewEnabled,isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

/** Exact 11 retained Canvas members of the source-ordered ALG001 L10 lesson. */
export const L10_LESSON_CANVAS_RESOURCES=Object.freeze({
  "shared-alg001-l10-p005": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p005/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p005",
    "path": "work/g678-shared-page-factory/g678-alg-l10-p005-source-candidate-v1/members/shared-alg001-l10-p005/canvas-renderer.js",
    "bytes": 13643973,
    "sha256": "cc31fbe6b705f3995ee1c70a0f3e96c5a4374e1b18bc0d2821908302c3525a7e",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p006": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p006/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p006",
    "path": "work/g678-shared-page-factory/g678-alg-l10-p006-source-candidate-v1/members/shared-alg001-l10-p006/canvas-renderer.js",
    "bytes": 13225965,
    "sha256": "e2c19acd7bb107ce2a6febe6079f6e33a476bd254ed98393310218fc72320995",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p007": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p007/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p007",
    "path": "work/g678-shared-page-factory/g678-vb02-l1-current-js-11-v1/members/shared-alg001-l10-p007/canvas-renderer.js",
    "bytes": 1174421,
    "sha256": "9bdcf42a7f5f6f7980c725f96290b810823739a36e99d974d19367840331e0db",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p008": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p008/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p008",
    "path": "work/g678-shared-page-factory/g678-vb03-l1-current-js-9-v1/members/shared-alg001-l10-p008/canvas-renderer.js",
    "bytes": 885089,
    "sha256": "922fd447f93a9ec32c6ba2ea989e7b326e0627caef6ac92885b92972a176ce85",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p017": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p017/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p017",
    "path": "work/g678-shared-page-factory/g678-in02-l1-current-js-13-v1/members/shared-alg001-l10-p017/canvas-renderer.js",
    "bytes": 1358613,
    "sha256": "51ed87ad3a02f2df7923f07fc9064973ff0d8e7ae1ea47221e7b55c88f45979c",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p043": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p043/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p043",
    "path": "work/g678-shared-page-factory/g678-ts02-l1-current-js-15-v1/members/shared-alg001-l10-p043/canvas-renderer.js",
    "bytes": 556075,
    "sha256": "bd28e4649952e3eb8572f184ecdff2990d50d98fe266ec6af7b13afadb1ed9d6",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p044": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p044/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p044",
    "path": "work/g678-shared-page-factory/g678-ts03-l1-current-js-15-v1/members/shared-alg001-l10-p044/canvas-renderer.js",
    "bytes": 461245,
    "sha256": "94a2bb6566eb901d56e7686d3add66466bb2c3d7c58abf05e3d63824d5258d7c",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p045": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p045/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p045",
    "path": "work/g678-shared-page-factory/g678-ts04-l1-current-js-15-v1/members/shared-alg001-l10-p045/canvas-renderer.js",
    "bytes": 1018481,
    "sha256": "1328d3f298576e46955a3236b567178f3174ee7ae66777c47da9a3686c7f06f0",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p046": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p046/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p046",
    "path": "work/g678-shared-page-factory/g678-ts05-l1-current-js-15-v1/members/shared-alg001-l10-p046/canvas-renderer.js",
    "bytes": 613433,
    "sha256": "a9ee041837a1fc7ec5250851883a6c85250794deceb0da7077e0cf19c65950ff",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p047": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p047/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p047",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l10-p047/canvas-renderer.js",
    "bytes": 266014,
    "sha256": "e1b0e1ac8268d9cc65b4696bdea85bffef15c27fe913707f53f31a1894d3c2c2",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l10-p051": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l10-p051/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l10-p004/lesson-canvas/shared-alg001-l10-p051",
    "path": "work/g678-shared-page-factory/g678-fq01-current-js-scaleout-43-v1/members/shared-alg001-l10-p051/canvas-renderer.js",
    "bytes": 78358,
    "sha256": "6903c7d0a80c79d92edcd26cbf63eb381576c9fbff6f02ab595392cce422c538",
    "contentType": "text/javascript; charset=utf-8"
  }
} as const);

export type L10LessonCanvasId=keyof typeof L10_LESSON_CANVAS_RESOURCES;
export const L10_LESSON_CANVAS_ORIGINAL_PATHS=Object.freeze(
  Object.values(L10_LESSON_CANVAS_RESOURCES).map(pin=>pin.originalPath));
export const L10_LESSON_CANVAS_BRIDGE_PATHS=Object.freeze(
  Object.values(L10_LESSON_CANVAS_RESOURCES).map(pin=>pin.bridgePath));

const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const DOCUMENTS=new Set(['en','es'].flatMap(locale=>['candidate','registered'].map(mode=>`${ORIGIN}/${locale}/migration-status/g678-calibration/shared-alg001-l10-p004/${mode}-v1`)));
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};

export function l10LessonCanvasLocalDevelopment(env:G678PreviewEnvironment=process.env):boolean{
 return env.NODE_ENV==='development'&&!env.VERCEL&&!env.VERCEL_ENV&&
  env.HELP_MATH_G678_SOURCE_ROOT===SOURCE_ROOT&&isG678LocalPreviewEnabled(env);
}

/** Only the P004 candidate and registered documents can request these eleven retained members. */
export function l10LessonCanvasResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):L10LessonCanvasId|null{
  const {method,url,headers}=request;
  if(!l10LessonCanvasLocalDevelopment(env)||
    ![ORIGIN,'http://localhost:3331'].includes(url.origin)||
    !isG678LocalPreviewRequestUrl(url,env)||!isG678LocalPreviewRequestHeaders(headers,env)||
    url.protocol!=='http:'||url.port!=='3331'||url.username||url.password||url.hash||
    method!=='GET'||headers.get('host')!=='127.0.0.1:3331'||
    (headers.get('x-forwarded-host')!==null&&headers.get('x-forwarded-host')!=='127.0.0.1:3331')||
    (headers.get('x-forwarded-proto')!==null&&headers.get('x-forwarded-proto')!=='http')||
    headers.get('range')!==null||headers.get('sec-fetch-site')!=='same-origin'||
    headers.get('sec-fetch-dest')!=='script'||
    !['cors','no-cors'].includes(headers.get('sec-fetch-mode')??''))return null;
  const origin=headers.get('origin');
  if((origin!==null&&origin!==ORIGIN)||
    (headers.get('sec-fetch-mode')==='cors'&&origin!==ORIGIN))return null;
  try{
    const referer=new URL(headers.get('referer')??'');
    if(referer.origin!==ORIGIN||referer.username||referer.password||referer.hash||
      !['','?mode=focus'].includes(referer.search)||
      !DOCUMENTS.has(`${referer.origin}${referer.pathname}`))return null;
  }catch{return null;}
  for(const [id,pin] of Object.entries(L10_LESSON_CANVAS_RESOURCES) as
    [L10LessonCanvasId,(typeof L10_LESSON_CANVAS_RESOURCES)[L10LessonCanvasId]][]){
    if(url.pathname!==pin.originalPath&&url.pathname!==pin.bridgePath)continue;
    return url.search===`?sha256=${pin.sha256}`?id:null;
  }
  return null;
}

export const isL10LessonCanvasOriginalRequest=(request:SourceRequest,
  env:G678PreviewEnvironment=process.env)=>{
  const id=l10LessonCanvasResourceForRequest(request,env);
  return id!==null&&request.url.pathname===L10_LESSON_CANVAS_RESOURCES[id].originalPath;
};
