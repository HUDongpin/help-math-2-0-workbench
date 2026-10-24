import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

/** Exact 12 retained Canvas members of the source-ordered ALG001 L8 lesson. */
export const L8_LESSON_CANVAS_RESOURCES=Object.freeze({
  "shared-alg001-l08-p002": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p002/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p002",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l08-p002/canvas-renderer.js",
    "bytes": 8165122,
    "sha256": "f7431152dbdb1580389d5b76f32244397d3e0b837b3e76a6d78b943d38abd022",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p003": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p003/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p003",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l08-p003/canvas-renderer.js",
    "bytes": 4893214,
    "sha256": "7e5e78e763b68cac6d2f8b56ecfdcae4a71135ebee258afdc8f036d1903e6452",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p004": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p004/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p004",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l08-p004/canvas-renderer.js",
    "bytes": 11951629,
    "sha256": "53df920af92f9a9e7b06ed4e9d662374e3b829dbb9c1232b068477b549988c88",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p008": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p008/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p008",
    "path": "work/g678-shared-page-factory/g678-vb03-l1-current-js-9-v1/members/shared-alg001-l08-p008/canvas-renderer.js",
    "bytes": 1275460,
    "sha256": "b559cdfb7022e403d9aa4cbff2a50a04975d991e5bfb2bb902e8f440cca4e277",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p017": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p017/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p017",
    "path": "work/g678-shared-page-factory/g678-in02-l1-current-js-13-v1/members/shared-alg001-l08-p017/canvas-renderer.js",
    "bytes": 1840973,
    "sha256": "a3f5839550f83c9a1fadfa9318325d0c2328d22ac38d10b9e292f28d9eb6d723",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p025": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p025/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p025",
    "path": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l08-p025/canvas-renderer.js",
    "bytes": 2321260,
    "sha256": "714630d04ff696717a110eaf80e1a23b643c83268dc03bbeb3f7907f56f4aee9",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p041": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p041/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p041",
    "path": "work/g678-shared-page-factory/g678-ts02-l1-current-js-15-v1/members/shared-alg001-l08-p041/canvas-renderer.js",
    "bytes": 526513,
    "sha256": "849062df359d49529a47acfd86eb0431176c5c0d11c508b0f36cf699934bab21",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p042": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p042/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p042",
    "path": "work/g678-shared-page-factory/g678-ts03-l1-current-js-15-v1/members/shared-alg001-l08-p042/canvas-renderer.js",
    "bytes": 461245,
    "sha256": "0f78fbfdba117b6a65168122c7b3effa53f99be152a7edde3a97ccd1bd95a8a2",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p043": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p043/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p043",
    "path": "work/g678-shared-page-factory/g678-ts04-l1-current-js-15-v1/members/shared-alg001-l08-p043/canvas-renderer.js",
    "bytes": 823651,
    "sha256": "3897124fd55fa35651ea35b3d1d33d2671c0475eb6b047ba17df8b5c9852d58b",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p044": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p044/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p044",
    "path": "work/g678-shared-page-factory/g678-ts05-l1-current-js-15-v1/members/shared-alg001-l08-p044/canvas-renderer.js",
    "bytes": 535592,
    "sha256": "1d74a88880b4456df2ce3ccb3c88d8c5340f888a817de189dc56ef77127b82c5",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p045": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p045/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p045",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l08-p045/canvas-renderer.js",
    "bytes": 266014,
    "sha256": "4205bc18be6b0784e12e78b2bc0f986352426a9e4eed80ca1fe9155d46d05a14",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l08-p049": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p049/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l08-p001/lesson-canvas/shared-alg001-l08-p049",
    "path": "work/g678-shared-page-factory/g678-fq01-current-js-scaleout-43-v1/members/shared-alg001-l08-p049/canvas-renderer.js",
    "bytes": 78358,
    "sha256": "3c6b55d83a14501a023ee7ef77eae1680bc77f3cb3ff559f5c57505a9779614b",
    "contentType": "text/javascript; charset=utf-8"
  }
} as const);

export type L8LessonCanvasId=keyof typeof L8_LESSON_CANVAS_RESOURCES;
export const L8_LESSON_CANVAS_ORIGINAL_PATHS=Object.freeze(
  Object.values(L8_LESSON_CANVAS_RESOURCES).map(pin=>pin.originalPath));
export const L8_LESSON_CANVAS_BRIDGE_PATHS=Object.freeze(
  Object.values(L8_LESSON_CANVAS_RESOURCES).map(pin=>pin.bridgePath));

const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const L8_P001='shared-alg001-l08-p001';
const DOCUMENTS=new Set(['candidate-v1','registered-v1'].flatMap(version=>
  ['en','es'].map(locale=>`${ORIGIN}/${locale}/migration-status/g678-calibration/${L8_P001}/${version}`)));
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};

/** Only the two explicit P001 My Lesson surfaces can fetch these retained Canvas files. */
export function l8LessonCanvasResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):L8LessonCanvasId|null{
  const {method,url,headers}=request;
  if(env.NODE_ENV!=='development'||Boolean(env.VERCEL)||Boolean(env.VERCEL_ENV)||
    env.HELP_MATH_G678_SOURCE_ROOT!==SOURCE_ROOT||
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
  for(const [id,pin] of Object.entries(L8_LESSON_CANVAS_RESOURCES) as
    [L8LessonCanvasId,(typeof L8_LESSON_CANVAS_RESOURCES)[L8LessonCanvasId]][]){
    if(url.pathname!==pin.originalPath&&url.pathname!==pin.bridgePath)continue;
    return url.search===`?sha256=${pin.sha256}`?id:null;
  }
  return null;
}

export const isL8LessonCanvasOriginalRequest=(request:SourceRequest,
  env:G678PreviewEnvironment=process.env)=>{
  const id=l8LessonCanvasResourceForRequest(request,env);
  return id!==null&&request.url.pathname===L8_LESSON_CANVAS_RESOURCES[id].originalPath;
};
