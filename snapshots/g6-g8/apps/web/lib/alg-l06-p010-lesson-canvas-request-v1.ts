import {isG678LocalPreviewRequestHeaders,isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment} from './g678-preview-policy';

/** Exact Canvas subset of P008's formal 22-page ALG001 L6 descriptor,
 * excluding P003/P004/P008. P001 is a registered non-Canvas module.
 * Pins are copied from the actual private registry and rechecked per read. */
export const P010_LESSON_CANVAS_RESOURCES=Object.freeze({
  "shared-alg001-l06-p002": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p002/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p002",
    "path": "work/g678-shared-page-factory/g678-alg-l06-p002-current-js-v2/members/shared-alg001-l06-p002/canvas-renderer.js",
    "bytes": 17059732,
    "sha256": "06dd3caf27c8a140e58cd95188efe223a99530dc0a12176897c2dfbb4d0ae255",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p005": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p005/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p005",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p005/canvas-renderer.js",
    "bytes": 17461752,
    "sha256": "90d30b7aa2b59ab22996bd7f36a032409de4d5e9bcab49bd02e55bf20e575312",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p006": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p006/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p006",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p006/canvas-renderer.js",
    "bytes": 11047506,
    "sha256": "617e809db752c271b3931c08150214d6140df6b90e1347e98dbf15237dd50879",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p007": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p007/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p007",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p007/canvas-renderer.js",
    "bytes": 20097360,
    "sha256": "59e97998c27ed2263d536dfc5bef555a13ca79e4e473aa695b6988b92c4a116a",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p009": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p009/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p009",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p009/canvas-renderer.js",
    "bytes": 18797357,
    "sha256": "f59be685af1cb8c7006d2718b9abc069c25ed008348ca04986daf218b31cd7d1",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p011": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p011/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p011",
    "path": "work/g678-shared-page-factory/g678-vb02-l1-current-js-11-v1/members/shared-alg001-l06-p011/canvas-renderer.js",
    "bytes": 3688051,
    "sha256": "e85755d53036224192ec842387b944b2663c792a14672b26bed9371fb9add351",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p012": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p012/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p012",
    "path": "work/g678-shared-page-factory/g678-vb03-l1-current-js-9-v1/members/shared-alg001-l06-p012/canvas-renderer.js",
    "bytes": 1049951,
    "sha256": "4b5563fa93637303c0fd415f2115d5cf1cb51f749a93a3ff3d4c8875b44296c3",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p030": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p030/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p030",
    "path": "work/g678-shared-page-factory/g678-in02-l1-current-js-13-v1/members/shared-alg001-l06-p030/canvas-renderer.js",
    "bytes": 19635351,
    "sha256": "14540ee0580404b66f832500482a65eaeb1719b22b8e1eceff9aad0c2318829e",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p036": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p036/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p036",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p036/canvas-renderer.js",
    "bytes": 1545918,
    "sha256": "58d950df0baf6fc61d46092e2f20fa367b6c1140f5651056fac7af1ce9acc99e",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p037": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p037/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p037",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p037/canvas-renderer.js",
    "bytes": 4162517,
    "sha256": "10e418283924b0eff0e3689e1d4598f7a3dd07c5a61e3691872e0a977cdba1f6",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p039": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p039/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p039",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p039/canvas-renderer.js",
    "bytes": 14823854,
    "sha256": "d76ab7e269b3fbfdb312ff035abad1affcf46049abc6a0d9d5c129545d86ef52",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p040": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p040/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p040",
    "path": "work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members/shared-alg001-l06-p040/canvas-renderer.js",
    "bytes": 2943132,
    "sha256": "a6568ba88450bf9ec258942dc2efa516889caea4b9dd6304a8e38b47f4e90a7b",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p051": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p051/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p051",
    "path": "work/g678-shared-page-factory/g678-ts02-l1-current-js-15-v1/members/shared-alg001-l06-p051/canvas-renderer.js",
    "bytes": 556075,
    "sha256": "ef1ec3e1a635d655646ef6e4eee1cc0abd123da3b2cd205ed4cdf86cb7b98fab",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p052": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p052/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p052",
    "path": "work/g678-shared-page-factory/g678-ts03-l1-current-js-15-v1/members/shared-alg001-l06-p052/canvas-renderer.js",
    "bytes": 461245,
    "sha256": "d5a3592ce5306405e9893a30b24b222ca84a0a8ac5e1b03e1236d57bda133eee",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p053": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p053/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p053",
    "path": "work/g678-shared-page-factory/g678-ts04-l1-current-js-15-v1/members/shared-alg001-l06-p053/canvas-renderer.js",
    "bytes": 1018481,
    "sha256": "87c7279a37e2f31e12cbdabc21f92b858eac09e1b0e514fa7d6c5747ad452659",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p054": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p054/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p054",
    "path": "work/g678-shared-page-factory/g678-ts05-l1-current-js-15-v1/members/shared-alg001-l06-p054/canvas-renderer.js",
    "bytes": 613433,
    "sha256": "5d93642de055c7d01a10945547ab9bd25c74461dd6c8fbd0b81c88841526cc23",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p055": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p055/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p055",
    "path": "work/g678-shared-page-factory/g678-pure-linear-current-js-scaleout-v1/members/shared-alg001-l06-p055/canvas-renderer.js",
    "bytes": 266014,
    "sha256": "338c05c5b80f090074cd4a1221dba4e7838b599c43bd398c53e44aa5863e60b2",
    "contentType": "text/javascript; charset=utf-8"
  },
  "shared-alg001-l06-p059": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l06-p059/canvas-renderer.js",
    "bridgePath": "/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/shared-alg001-l06-p059",
    "path": "work/g678-shared-page-factory/g678-fq01-current-js-scaleout-43-v1/members/shared-alg001-l06-p059/canvas-renderer.js",
    "bytes": 78358,
    "sha256": "4ec67fc0e000b8810ade74d350ecf82329aeab5a47726092f20bd96fb4ac6a0a",
    "contentType": "text/javascript; charset=utf-8"
  }
} as const);

export type P010LessonCanvasId=keyof typeof P010_LESSON_CANVAS_RESOURCES;
export const P010_LESSON_CANVAS_ORIGINAL_PATHS=Object.freeze(
  Object.values(P010_LESSON_CANVAS_RESOURCES).map(pin=>pin.originalPath));
export const P010_LESSON_CANVAS_BRIDGE_PATHS=Object.freeze(
  Object.values(P010_LESSON_CANVAS_RESOURCES).map(pin=>pin.bridgePath));

const ORIGIN='http://127.0.0.1:3331';
const SOURCE_ROOT='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const P010='shared-alg001-l06-p010';
const DOCUMENTS=new Set(['candidate-v1','continuous-v1'].flatMap(version=>
  ['en','es'].map(locale=>`${ORIGIN}/${locale}/migration-status/g678-calibration/${P010}/${version}`)));
type SourceRequest={readonly method:string;readonly url:URL;readonly headers:Pick<Headers,'get'>};

/** A P010 document may fetch only a registered, hash-pinned predecessor Canvas.
 * Rewrites retain the original query and may present either path to this guard. */
export function p010LessonCanvasResourceForRequest(request:SourceRequest,
  env:G678PreviewEnvironment=process.env):P010LessonCanvasId|null{
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
  for(const [id,pin] of Object.entries(P010_LESSON_CANVAS_RESOURCES) as
    [P010LessonCanvasId,(typeof P010_LESSON_CANVAS_RESOURCES)[P010LessonCanvasId]][]){
    if(url.pathname!==pin.originalPath&&url.pathname!==pin.bridgePath)continue;
    return url.search===`?sha256=${pin.sha256}`?id:null;
  }
  return null;
}

export const isP010LessonCanvasOriginalRequest=(request:SourceRequest,
  env:G678PreviewEnvironment=process.env)=>{
  const id=p010LessonCanvasResourceForRequest(request,env);
  return id!==null&&request.url.pathname===P010_LESSON_CANVAS_RESOURCES[id].originalPath;
};
