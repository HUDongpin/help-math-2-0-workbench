import {activeHostPins} from './g678-active-host-pins.server';
import {existsSync,lstatSync,readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {currentFrozen16LocalAuthorityScope} from './g678-frozen16-default-scope.server';
type Pin=Readonly<{path:string;bytes:number;sha256:string}>;
export const P047_PROXY_SUCCESSOR=Object.freeze({path:'catalog/product-bridge-calibrations/g678-p047-proxy-host-successor-v4.json',bytes:1807,sha256:'989dafe0c17624be3818d70e23d332aa1a7e5390984dcb212b1d35154d7be379'});
export const P047_DAT_L02_COMPOSED_SUCCESSOR=Object.freeze({path:'catalog/product-bridge-calibrations/g678-p047-dat-l02-p002-proxy-composed-successor-v1.json',bytes:1216,sha256:'999537d438007cb49c9ed9076fecca3a8c8d3764c07bd15c13459ee268cefec3'});
export const P006_ADMISSION_PROXY_SUCCESSOR=Object.freeze({path:'catalog/product-bridge-calibrations/g678-alg-l12-p006-admission-proxy-composed-successor-v1.json',bytes:1689,sha256:'f36ac4388a07988457a6d96326e9cda35b41bf541c81c1c3be8595ab1c0f95da'});
const ORIGINAL=Object.freeze({path:'apps/web/proxy.ts',bytes:12925,sha256:'4a969febd1d80ff852e28cc49aaf04f8975d4c043413cc686966eafa35cd71ad'});
const P047_PROXY=Object.freeze({path:'apps/web/proxy.ts',bytes:13151,sha256:'8c295f89c038b25729e8e549a9b243334e06aed9f999f3dbe50c3398708fd55f'});
const CURRENT_PROXY=Object.freeze({path:'apps/web/proxy.ts',bytes:13745,sha256:'b28295af0e8e3ec04431ca0b560ffa66e98ac8a661d316279c6afa22a84f7b21'});
const P006_ADMISSION_CURRENT_PROXY=Object.freeze({path:'apps/web/proxy.ts',bytes:14057,sha256:'74f44ae3b2d7298ff3201709f12dd64a4eacb2352abb6e7a7b241f750b62dbd2'});
const P006_ADMISSION_GUARD=Object.freeze({path:'apps/web/lib/g678-alg-l12-p006-admission-access.ts',bytes:789,sha256:'99780050d6811c45519b9890eba03e6558a51bb3b05907f3d3c01cabbf5f0675'});
const P006_ADMISSION_WITNESS=Object.freeze({...CURRENT_PROXY,path:'work/g678-shared-host-successors/p006-admission-proxy-v1/predecessor/apps/web/proxy.ts'});
const DAT_GUARDS=Object.freeze([
 {path:'apps/web/lib/dat-l02-p002-source-audio-access.ts',bytes:1745,sha256:'0ac03a375df17a8d6d28daed77e2351a28415c6afd5e1ecfecf03250e351903e'},
 {path:'apps/web/lib/dat-l02-p002-symbol-access.ts',bytes:1522,sha256:'6fcd6363651debfb2b7a5e8c364a0fb53da4e2317b15b59314e2cc91ae778e9a'},
]);
const PHASE='frozen16-continuous-audio-provisional-browser-qa';
function demand(v:unknown,message:string):asserts v{if(!v)throw Error('P047_PROXY_SUCCESSOR_INVALID: '+message);}
function read(root:string,pin:Pin){
 const file=path.resolve(root,pin.path);demand(file.startsWith(root+path.sep)&&realpathSync(file)===file,'ordinary bounded path');
 const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 demand(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'].every(k=>before[k as keyof typeof before]===after[k as keyof typeof after])
  &&bytes.length===pin.bytes&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,'exact bytes '+pin.path);
 return bytes;
}
function replaceOnce(source:string,anchor:string,replacement:string,label:string){
 demand(source.split(anchor).length===2,'single '+label+' anchor');
 return source.replace(anchor,replacement);
}
/** Exact second delta: only DAT L02 P002's two local-only asset guards. */
export function composeP047DatL02Proxy(predecessor:string):string{
 const imports="import {isDatL02P002SourceAudioRequest, DAT_L02_P002_AUDIO_PATH} from\n  './lib/dat-l02-p002-source-audio-access';\nimport {isDatL02P002SymbolRequest, DAT_L02_P002_SYMBOL_PREFIX} from\n  './lib/dat-l02-p002-symbol-access';\n";
 const importAnchor="import {isDatL05SourceAudioRequest,DAT_L05_SOURCE_AUDIO_ID} from './lib/dat-l05-source-audio-access';\n";
 const withImports=replaceOnce(predecessor,importAnchor,importAnchor+imports,'DAT import');
 const branchAnchor='  if(pathname.startsWith(P047_AUDIO_PREFIX))return isP047AudioRequest({method:request.method,url:request.nextUrl,headers:request.headers});\n';
 const branches="  if (pathname.startsWith(DAT_L02_P002_AUDIO_PATH)) {\n    return isDatL02P002SourceAudioRequest({\n      method: request.method, url: request.nextUrl, headers: request.headers,\n    });\n  }\n  if (pathname.startsWith(DAT_L02_P002_SYMBOL_PREFIX)) {\n    return isDatL02P002SymbolRequest({\n      method: request.method, url: request.nextUrl, headers: request.headers,\n    });\n  }\n";
 return replaceOnce(withImports,branchAnchor,branchAnchor+branches,'DAT branch');
}
/** Exact third delta: the distinct, guarded P006 engineering evidence route. */
export function composeP006AdmissionProxy(predecessor:string):string{
 const importAnchor="import {isP047AudioRequest,P047_AUDIO_PREFIX} from './lib/nms-l01-p047-audio-access';\n";
 const helperImport="import {isAlgL12P006AdmissionPath,isAlgL12P006AdmissionRequest} from './lib/g678-alg-l12-p006-admission-access';\n";
 const withImport=replaceOnce(predecessor,importAnchor,importAnchor+helperImport,'P006 admission import');
 const archiveAnchor='function isArchivePath(pathname: string, request: NextRequest) {\n';
 const archiveBranch='  if (isAlgL12P006AdmissionPath(pathname)) {\n    return isAlgL12P006AdmissionRequest({pathname, method: request.method, url: request.nextUrl});\n  }\n';
 const withBranch=replaceOnce(withImport,archiveAnchor,archiveAnchor+archiveBranch,'P006 admission archive');
 const headersAnchor='  const g678CalibrationRoute = isG678CalibrationProductPath(\n';
 return replaceOnce(withBranch,headersAnchor,'  const g678CalibrationRoute = isAlgL12P006AdmissionPath(normalizedLocaleFree) || isG678CalibrationProductPath(\n','P006 admission headers');
}
/** Expand the original proxy pin to an explicit readonly predecessor witness
 * and the exact new proxy/route closure. The old physical reader still hashes
 * each returned file. No new bytes are ever returned under the old digest. */
export function resolveP047ProxyHostPins(root:string,pins:readonly Pin[]):readonly Pin[]{
 if(process.env.NODE_ENV==='production'||!currentFrozen16LocalAuthorityScope()||!existsSync(path.join(root,P047_PROXY_SUCCESSOR.path)))return pins;
 const manifest=JSON.parse(read(root,P047_PROXY_SUCCESSOR).toString()) as {schemaVersion:number;kind:string;phase:string;scope:string;original:Pin;witness:Pin;currentFiles:Pin[];acceptanceEffects:Record<string,boolean>};
 demand(manifest.schemaVersion===1&&manifest.kind==='p047-quiz-proxy-host-successor-v1'&&manifest.phase===PHASE&&manifest.scope==='local-only-p047-audio-route'&&exact(manifest.original,ORIGINAL),'exact successor scope');
 demand(manifest.witness.path==='work/g678-shared-host-successors/p047-quiz-proxy-v1/predecessor/apps/web/proxy.ts'&&manifest.witness.bytes===ORIGINAL.bytes&&manifest.witness.sha256===ORIGINAL.sha256,'historical witness binding');
 demand((lstatSync(path.join(root,manifest.witness.path)).mode&0o222)===0,'readonly witness');
 const prior=read(root,manifest.witness).toString();
 demand(exact(manifest.currentFiles.map(p=>p.path),['apps/web/proxy.ts','apps/web/lib/nms-l01-p047-audio-access.ts','apps/web/lib/g678-nms-l01-p047.server.ts','apps/web/app/flash-assets/g678-local/shared-nms002-l01-p047/quiz-audio/[assetId]/route.ts']),'bounded new route closure');
 demand(exact(manifest.currentFiles[0],P047_PROXY),'exact P047 proxy pin');
 for(const pin of manifest.currentFiles.slice(1))read(root,pin);
 const branch="  if(pathname.startsWith('/flash-assets/g678-local/'+DAT_L05_SOURCE_AUDIO_ID+'/interactive-audio/'))";
 demand(prior.split(branch).length===2,'single predecessor branch marker');
 const expected="import {isP047AudioRequest,P047_AUDIO_PREFIX} from './lib/nms-l01-p047-audio-access';\n"+prior.replace(branch,"  if(pathname.startsWith(P047_AUDIO_PREFIX))return isP047AudioRequest({method:request.method,url:request.nextUrl,headers:request.headers});\n"+branch);
 demand(Buffer.byteLength(expected)===P047_PROXY.bytes&&createHash('sha256').update(expected).digest('hex')===P047_PROXY.sha256,'only exact P047 import and guarded branch delta');
 let currentProxy:Pin=P047_PROXY;
 let expectedCurrent=expected;
 const extra:Pin[]=[];
 if(existsSync(path.join(root,P047_DAT_L02_COMPOSED_SUCCESSOR.path))){
  const combined=JSON.parse(read(root,P047_DAT_L02_COMPOSED_SUCCESSOR).toString()) as {schemaVersion:number;kind:string;deploymentScope:string;predecessorManifest:Pin;predecessorProxy:Pin;currentProxy:Pin;newGuardModules:Pin[];acceptanceEffects:Record<string,boolean>};
  demand(combined.schemaVersion===1&&combined.kind==='p047-dat-l02-p002-proxy-composed-successor-v1'&&combined.deploymentScope==='local-only'&&exact(combined.predecessorManifest,P047_PROXY_SUCCESSOR)&&exact(combined.predecessorProxy,P047_PROXY)&&exact(combined.currentProxy,CURRENT_PROXY)&&exact(combined.newGuardModules,DAT_GUARDS)&&Object.values(combined.acceptanceEffects).length===6&&Object.values(combined.acceptanceEffects).every(v=>v===false),'exact composed successor scope');
  const composed=composeP047DatL02Proxy(expected);
  demand(Buffer.byteLength(composed)===CURRENT_PROXY.bytes&&createHash('sha256').update(composed).digest('hex')===CURRENT_PROXY.sha256,'only exact DAT L02 guarded delta');
  for(const pin of DAT_GUARDS)read(root,pin);
  expectedCurrent=composed;
  currentProxy=CURRENT_PROXY;extra.push(P047_DAT_L02_COMPOSED_SUCCESSOR,...DAT_GUARDS);
 }
 if(existsSync(path.join(root,P006_ADMISSION_PROXY_SUCCESSOR.path))){
  const successor=JSON.parse(read(root,P006_ADMISSION_PROXY_SUCCESSOR).toString()) as {schemaVersion:number;kind:string;deploymentScope:string;admittedPath:string;predecessorManifest:Pin;predecessorProxy:Pin;predecessorWitness:Pin;currentProxy:Pin;newGuardModule:Pin;sourceMathOrPageRendererChanged:boolean;registrationChanges:number;technicalRevalidation:string;acceptanceEffects:Record<string,boolean>};
  demand(exact(currentProxy,CURRENT_PROXY)&&successor.schemaVersion===1&&successor.kind==='g678-alg-l12-p006-admission-proxy-composed-successor-v1'&&successor.deploymentScope==='local-only'&&successor.admittedPath==='/migration-status/g678-calibration/shared-alg001-l12-p006-admission'&&exact(successor.predecessorManifest,P047_DAT_L02_COMPOSED_SUCCESSOR)&&exact(successor.predecessorProxy,CURRENT_PROXY)&&exact(successor.predecessorWitness,P006_ADMISSION_WITNESS)&&exact(successor.currentProxy,P006_ADMISSION_CURRENT_PROXY)&&exact(successor.newGuardModule,P006_ADMISSION_GUARD)&&successor.sourceMathOrPageRendererChanged===false&&successor.registrationChanges===0&&successor.technicalRevalidation==='required-on-this-proxy-version'&&Object.values(successor.acceptanceEffects).length===6&&Object.values(successor.acceptanceEffects).every(v=>v===false),'exact P006 admission composed successor scope');
  demand((lstatSync(path.join(root,successor.predecessorWitness.path)).mode&0o222)===0,'readonly P006 admission witness');
  demand(read(root,successor.predecessorWitness).toString()===expectedCurrent,'exact P006 admission predecessor bytes');
  const composed=composeP006AdmissionProxy(expectedCurrent);
  demand(Buffer.byteLength(composed)===P006_ADMISSION_CURRENT_PROXY.bytes&&createHash('sha256').update(composed).digest('hex')===P006_ADMISSION_CURRENT_PROXY.sha256,'only exact P006 admission guarded delta');
  read(root,P006_ADMISSION_GUARD);
  expectedCurrent=composed;currentProxy=P006_ADMISSION_CURRENT_PROXY;
  extra.push(P006_ADMISSION_PROXY_SUCCESSOR,successor.predecessorWitness,P006_ADMISSION_GUARD);
 }
 const active=activeHostPins(root);
 const composedProxy=active.resolve(currentProxy);
 demand(read(root,composedProxy).toString()===expectedCurrent,'exact historical composed proxy bytes');
 demand(Object.values(manifest.acceptanceEffects).length===6&&Object.values(manifest.acceptanceEffects).every(v=>v===false),'acceptance unchanged');
 let replaced=0;
 const expanded=pins.map(pin=>{if(pin.path!==ORIGINAL.path)return pin;demand(exact(pin,ORIGINAL),'exact old caller pin');replaced++;return manifest.witness;});
 demand(replaced===1,'one predecessor proxy pin');
 expanded.push(P047_PROXY_SUCCESSOR,...manifest.currentFiles.slice(1),...extra,composedProxy);
 return active.expand(expanded);
}
