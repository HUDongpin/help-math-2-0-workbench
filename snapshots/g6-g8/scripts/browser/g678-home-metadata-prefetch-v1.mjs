/** One narrow required-request boundary. No interception, retries, or network I/O. */
import assert from 'node:assert/strict';

const REQUEST_HEADERS=['rsc','next-router-prefetch','next-router-state-tree','next-router-segment-prefetch','next-url','referer'];
const RESPONSE_HEADERS=['content-type','x-nextjs-rewritten-path','x-middleware-rewrite'];
const readHeaders=(headers,names)=>{
 assert(headers&&typeof headers==='object'&&!Array.isArray(headers),'actual synchronous headers');
 const lower=Object.fromEntries(Object.entries(headers).map(([k,v])=>[k.toLowerCase(),v]));
 return Object.fromEntries(names.filter(k=>Object.hasOwn(lower,k)).map(k=>[k,lower[k]]));
};
const onlyRsc=url=>{const entries=[...url.searchParams];return entries.length===1&&entries[0][0]==='_rsc'&&entries[0][1].trim()!==''?entries[0][1]:null;};
const onlyFocusRsc=url=>{
 const entries=[...url.searchParams],token=entries[1]?.[1];
 return entries.length===2&&entries[0][0]==='mode'&&entries[0][1]==='focus'&&entries[1][0]==='_rsc'&&token.trim()!==''&&
  url.search==='?mode=focus&_rsc='+encodeURIComponent(token)?token:null;
};
const plainUrl=url=>!url.username&&!url.password&&!url.hash;
// Exact ID/source/route bindings read from the completed 18-placement baselines.
// These authorize only future request classification, never reclassify old rows.
const COHORT_ROUTES={"shared-geo001-l09-p030":{"sourceSha256":"52fd15dc6355a40e38584da9974efe217d2bdc087a643bffa2e03286f514a8b8","paths":{"en":"/en/migration-status/g678-course/geo001/9","es":"/es/migration-status/g678-course/geo001/9"}},"shared-geo001-l09-p031":{"sourceSha256":"b420c8b254e144e715f705ba9c528f27ef0ac57ad7f1217bf228bd653660f02d","paths":{"en":"/en/migration-status/g678-course/geo001/9","es":"/es/migration-status/g678-course/geo001/9"}},"shared-geo001-l11-p036":{"sourceSha256":"bf2f9dfcf43e236b2bcc2916555688cb2a6fe01e66b6e30b9e94ab421e2e0e81","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-geo001-l11-p037":{"sourceSha256":"a7ca1d5b286978197f3fe145812394bc0180461c4524ba6557793d4cb93b3f6e","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-geo001-l11-p038":{"sourceSha256":"e1f089716cfeb573476eb4f6b0c0acf37c7020c1a4b50a7fb5c6c356d884bae6","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-geo001-l11-p039":{"sourceSha256":"d43aac6fbbff94eb1f3327252313311db0df96b226d87daa130853ac4ef9db84","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-geo001-l11-p040":{"sourceSha256":"10a3273381a4528b6108efd73a17295280dee46d5812de69231db5a3500c78c6","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-geo001-l11-p041":{"sourceSha256":"57427dbb3a19b476eda0cb21a02bea0588be15bc61ec070e9cfa695738157ba7","paths":{"en":"/en/migration-status/g678-course/geo001/11","es":"/es/migration-status/g678-course/geo001/11"}},"shared-alg001-l12-p034":{"sourceSha256":"87c858c090331e3b55641cbba6f87dec0ed13dba5a88a079aaa8236b86da4e6d","paths":{"en":"/en/migration-status/g678-course/alg001/12","es":"/es/migration-status/g678-course/alg001/12"}},"shared-alg001-l12-p035":{"sourceSha256":"f5a7f2468be9e2db5b27611a39cb8ab1883f800caadeab4dcc4b8d141aca1a40","paths":{"en":"/en/migration-status/g678-course/alg001/12","es":"/es/migration-status/g678-course/alg001/12"}},"shared-alg001-l12-p037":{"sourceSha256":"efe957ce9a0d26481e4474c6368fd82c8bf3771714d5b9e880f73a18147960e5","paths":{"en":"/en/migration-status/g678-course/alg001/12","es":"/es/migration-status/g678-course/alg001/12"}},"shared-alg001-l12-p038":{"sourceSha256":"282bc9dcee2a227312fb2e6b046e22c6f2ec88855affb438a7fb3907707cbb69","paths":{"en":"/en/migration-status/g678-course/alg001/12","es":"/es/migration-status/g678-course/alg001/12"}},"shared-alg001-l12-p039":{"sourceSha256":"b8f0c0b3ad3d82496e50f4be8dbfabf013f76f212a78195bd395ef156626f9a7","paths":{"en":"/en/migration-status/g678-course/alg001/12","es":"/es/migration-status/g678-course/alg001/12"}},"shared-geo001-l12-p028":{"sourceSha256":"42bcb58ea17cd2c6544b17e516a3065ac23cf4664c54562e247c1034341730b5","paths":{"en":"/en/migration-status/g678-course/geo001/12","es":"/es/migration-status/g678-course/geo001/12"}},"shared-dat001-l03-p029":{"sourceSha256":"a1e9082da52d06fbcc52c387aa384ab8b3c7c999f875481cf615ba38477a49fa","paths":{"en":"/en/migration-status/g678-course/dat001/3","es":"/es/migration-status/g678-course/dat001/3"}},"shared-dat001-l03-p034":{"sourceSha256":"1b83c56d93c9e5b24347aa5ac086843abf53084af2e5a0e813d14f9b58311a49","paths":{"en":"/en/migration-status/g678-course/dat001/3","es":"/es/migration-status/g678-course/dat001/3"}},"shared-dat001-l03-p037":{"sourceSha256":"668e9f7acd7677bcde4928d65e4e96a417e4f40f1ccb86e39f38f3172ee873c6","paths":{"en":"/en/migration-status/g678-course/dat001/3","es":"/es/migration-status/g678-course/dat001/3"}},"shared-dat001-l03-p044":{"sourceSha256":"f9fa378dae32f2e88abab12d898cf5b1dabbb83f0653b95436103dd65a4ee6ff","paths":{"en":"/en/migration-status/g678-course/dat001/3","es":"/es/migration-status/g678-course/dat001/3"}}};
function boundCourse(course,routeBinding) {
 if(routeBinding===undefined)return /^\/(en|es)\/migration-status\/g678-course\/nms002\/7$/.test(course.pathname);
 const known=COHORT_ROUTES[routeBinding?.animationId];
 return !!known&&known.sourceSha256===routeBinding.sourceSha256&&['en','es'].includes(routeBinding.locale)&&known.paths[routeBinding.locale]===course.pathname;
}


export function classifyHomeMetadataFailure(row,{origin,expectedCourseUrl,routeBinding}){
 const reject=reason=>({classification:'required-or-unclassified-network-failure',reason});
 try{
  const base=new URL(origin),course=new URL(expectedCourseUrl),request=row.request,response=row.response;
  if(row.capturedAtRequest!==true||row.closing!==false||row.metadataErrors?.length!==0)return reject('missing-request-lifetime-or-metadata');
  if(row.errorText!=='net::ERR_ABORTED')return reject('not-exact-observed-err-aborted');
  if(!request||request.method!=='GET'||request.resourceType!=='fetch'||request.isNavigationRequest!==false||request.mainFrame!==true)return reject('not-nonnavigating-main-frame-get-fetch');
  if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||!plainUrl(base)||base.pathname!=='/'||base.search||course.origin!==base.origin||!plainUrl(course)||course.search||!boundCourse(course,routeBinding))return reject('not-exact-local-course');
  if(request.pageUrl!==course.href||request.frameUrl!==course.href||row.failurePageUrl!==course.href)return reject('not-current-expected-course-document');
  const locale=course.pathname.split('/')[1],homePath=locale==='es'?'/es':'/';
  const url=new URL(request.url),headers=request.headers;
  if(!plainUrl(url)||url.origin!==base.origin)return reject('not-exact-same-origin-ui-rsc-url');
  const home=url.pathname===homePath&&onlyRsc(url),targetLocale=locale==='en'?'es':'en';
  // Current maintained language Link: exact same lesson, opposite locale,
  // Focus mode; EN is intentionally unprefixed by i18n/navigation.ts.
  const localePath=(targetLocale==='es'?'/es':'')+course.pathname.slice(3);
  const localeSwitch=url.pathname===localePath&&onlyFocusRsc(url);
  if(!home&&!localeSwitch)return reject('not-exact-home-or-opposite-locale-focus-prefetch');
  if(headers?.rsc!=='1'||headers['next-router-prefetch']!=='1'||headers['next-url']!==course.pathname||headers.referer!==course.href)return reject('not-exact-prefetch-course-headers');
  const hasStateTree=Object.hasOwn(headers,'next-router-state-tree'),hasSegment=Object.hasOwn(headers,'next-router-segment-prefetch');
  if(hasStateTree===hasSegment)return reject('prefetch-protocol-missing-or-ambiguous');
  let protocolVariant;
  if(hasSegment){
   if(headers['next-router-segment-prefetch']!=='/_tree')return reject('not-exact-home-route-tree-prefetch');
   protocolVariant='route-tree';
  }else{
   const tree=JSON.parse(decodeURIComponent(headers['next-router-state-tree']));
   if(!Array.isArray(tree)||tree.length!==4||tree[0]!==''||tree[2]!==null||tree[3]!=='metadata-only'||!tree[1]||typeof tree[1]!=='object'||Array.isArray(tree[1])||Object.keys(tree[1]).length)return reject('not-exact-metadata-only-tree');
   protocolVariant='metadata-only';
  }
  if(request.redirectedFrom!==null||request.redirectedTo!==null)return reject('redirect-chain-present-or-unknown');
  if(row.responseCount!==1||!response||response.url!==request.url||response.status!==200)return reject('same-request-200-response-not-observed');
  if(typeof response.headers?.['content-type']!=='string'||response.headers['content-type'].split(';')[0].trim().toLowerCase()!=='text/x-component')return reject('not-rsc-response');
  const responseLocale=home?locale:targetLocale;
  if(responseLocale==='es'){
   if(Object.hasOwn(response.headers,'x-nextjs-rewritten-path')||Object.hasOwn(response.headers,'x-middleware-rewrite'))return reject('es-ui-rewrite-not-calibrated');
  }else{
   const rewritten=response.headers['x-nextjs-rewritten-path'],rewrite=new URL(response.headers['x-middleware-rewrite']);
   const expectedRewrite=home?'/en':'/en'+course.pathname.slice(3),query=home?onlyRsc:onlyFocusRsc;
   if(rewritten!==expectedRewrite||rewrite.protocol!==base.protocol||!['127.0.0.1','localhost','[::1]'].includes(rewrite.hostname)||rewrite.port!==base.port||!plainUrl(rewrite)||rewrite.pathname!==rewritten||query(rewrite)!==query(url))return reject('rewrite-not-exact-same-port-local-ui-target');
  }
  if(localeSwitch)return {classification:'non-required-lesson-locale-metadata-observed-err-aborted',protocolVariant,targetLocale,
   reason:`Observed ERR_ABORTED on this exact nonnavigating opposite-locale Focus language-link ${protocolVariant} prefetch; cancellation cause unknown.`,cdpCanceledConfirmed:false};
  return {classification:'non-required-home-metadata-observed-err-aborted',protocolVariant,reason:`Observed ERR_ABORTED on this exact nonnavigating homepage ${protocolVariant} prefetch; cancellation cause unknown.`,cdpCanceledConfirmed:false};
 }catch{return reject('missing-or-invalid-classification-fields');}
}

/** Every response is associated by the actual Request object, never its URL. */
export function observeHomeMetadataFailures({page,origin,expectedCourseUrl,routeBinding,networkErrors,phase=()=>null}){
 assert(Array.isArray(networkErrors),'existing required network-error sink');
 const frozenRouteBinding=routeBinding===undefined?undefined:Object.freeze(structuredClone(routeBinding));
 const requests=new WeakMap(),failures=[],diagnostics=[];let count=0,closing=false,finished=false;
 function metadataError(row,error){row.metadataErrors.push(String(error));}
 function readRequest(request,capturedAtRequest){
  const row={id:'observed-request-'+(++count),capturedAtRequest,request:null,response:null,responseCount:0,metadataErrors:[],startedAt:new Date().toISOString(),startedPhase:phase()};
  try{const frame=request.frame();row.request={url:request.url(),method:request.method(),resourceType:request.resourceType(),isNavigationRequest:request.isNavigationRequest(),mainFrame:frame===page.mainFrame(),frameUrl:frame.url(),pageUrl:page.url(),headers:readHeaders(request.headers(),REQUEST_HEADERS),redirectedFrom:request.redirectedFrom()?.url()??null,redirectedTo:request.redirectedTo()?.url()??null};}catch(error){metadataError(row,error);}
  requests.set(request,row);return row;
 }
 const onRequest=request=>{readRequest(request,true);};
 const onResponse=response=>{
  let row;try{const request=response.request();row=requests.get(request)??readRequest(request,false);row.responseCount++;
   row.response={url:response.url(),status:response.status(),headers:readHeaders(response.headers(),RESPONSE_HEADERS),at:new Date().toISOString(),phase:phase()};
  }catch(error){if(row)metadataError(row,error);}
 };
 const onFailed=request=>{
  const row=requests.get(request)??readRequest(request,false);
  try{row.failure=request.failure();row.errorText=row.failure?.errorText??null;row.failurePageUrl=page.url();row.closing=closing||page.isClosed();
   if(row.request){row.request.headers=readHeaders(request.headers(),REQUEST_HEADERS);row.request.redirectedFrom=request.redirectedFrom()?.url()??null;row.request.redirectedTo=request.redirectedTo()?.url()??null;}
  }catch(error){metadataError(row,error);}
  const raw=structuredClone({...row,failedAt:new Date().toISOString(),failedPhase:phase()});
  const classified={...raw,...classifyHomeMetadataFailure(raw,{origin,expectedCourseUrl,routeBinding:frozenRouteBinding})};failures.push(classified);
  if(['non-required-home-metadata-observed-err-aborted','non-required-lesson-locale-metadata-observed-err-aborted'].includes(classified.classification))diagnostics.push(classified);
  else networkErrors.push({url:raw.request?.url??null,status:null,error:raw.errorText??null,failure:raw.failure??null,sourceOwner:/\/g678-local\/(shared-[^/?]+)/.exec(raw.request?.url??'')?.[1]??null,phase:raw.failedPhase,at:raw.failedAt,networkFailureId:raw.id,classification:classified.classification,reason:classified.reason,metadataErrors:raw.metadataErrors});
 };
 page.on('request',onRequest);page.on('response',onResponse);page.on('requestfailed',onFailed);
 const snapshot=()=>structuredClone({kind:'home-metadata-network-observations-v1',origin,expectedCourseUrl,routeBinding:frozenRouteBinding??null,requestIdentity:'actual-Playwright-Request-object-WeakMap',closing,finished,failures,diagnostics,scope:'Only required-request qualification changes. No CDP cancellation or root-cause claim.'});
 return {snapshot,beginClose(){closing=true;},finish(){
  assert(!finished,'network observer finalized once');closing=true;
  const closed=page.isClosed();if(!closed)networkErrors.push({url:null,status:null,error:'NETWORK_OBSERVATION_ENDED_WITH_OPEN_PAGE',phase:phase(),at:new Date().toISOString()});
  page.off('request',onRequest);page.off('response',onResponse);page.off('requestfailed',onFailed);finished=true;
  return {...snapshot(),pageClosed:closed,observationComplete:closed};
 }};
}
