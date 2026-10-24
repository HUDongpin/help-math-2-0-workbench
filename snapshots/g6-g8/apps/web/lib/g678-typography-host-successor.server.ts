import {activeHostPins} from './g678-active-host-pins.server';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {currentFrozen16LocalAuthorityScope} from './g678-frozen16-default-scope.server';

export type HostPin=Readonly<{path:string;bytes:number;sha256:string}>;
export const TYPOGRAPHY_HOST_SUCCESSOR=Object.freeze({"path": "catalog/product-bridge-calibrations/g678-typography-shared-host-successor-v3.json", "bytes": 9211, "sha256": "eb5fb37a2defc57db45fa9ec421e09533fc2a2d398263321fb0c9446803fe16e"});
export const TYPOGRAPHY_CSS_GAP_SUCCESSOR=Object.freeze({path:'catalog/product-bridge-calibrations/g678-typography-shared-host-css-gap-successor-v4.json',bytes:1184,sha256:'06fc0e08089e53cfa22087b14639ba03e17ac0ea3a8193aa7029d39496559bae'});
const CSS_GAP_CURRENT=Object.freeze({path:'apps/web/app/globals.css',bytes:293001,sha256:'faa54056875409e4c283f89b4af4579ac050a38f8bcd419764ce18f582f32cbc'});
const PREDECESSOR_HOST=Object.freeze({path:'catalog/product-bridge-calibrations/g678-typography-shared-host-successor-v2.json',bytes:7992,sha256:'529d7c8168344873d8c5a5ce4dbe0ab4f7ffc92b7316c2ebe3f5f43b4b1edce2'});
const ORIGINAL_HOST_FILES:readonly HostPin[]=Object.freeze([{"path": "apps/web/components/animation-runtime.tsx", "bytes": 56254, "sha256": "d9372885f913bf49a11608f3ab02c68f1f9e5d2211983b7aa2c53869ddb6fa61"}, {"path": "packages/demos/src/contract.ts", "bytes": 17542, "sha256": "34ffa7623671e2840852cfc00dab318f28370de5a047395375f943e042197db1"}]);
const PHASE='frozen16-continuous-audio-provisional-browser-qa';
type Package={schemaVersion:number;kind:string;scope:string;phase:string;version:string;sourceIntegration:HostPin;physicalReplacements:{original:HostPin;witness:HostPin;current:HostPin}[];currentSharedFiles:HostPin[];sourceMathOrPageRendererChanged:boolean;registrationChanges:number;technicalRevalidation:string;acceptanceEffects:Record<string,boolean>;predecessorManifest:HostPin;toolbarZoomDelta:{original:HostPin;witness:HostPin;appended:HostPin;current:HostPin;targetAnimationIds:string[]}};
type CheckedPackage=Package&{physicalSharedFiles:HostPin[];extraPins:HostPin[];binding:HostPin};
function demand(v:unknown,m:string):asserts v{if(!v)throw Error('G678_TYPOGRAPHY_HOST_SUCCESSOR_INVALID: '+m);}
function readExactPin(root:string,pin:HostPin):Buffer{
 const file=path.resolve(root,pin.path);demand(file.startsWith(root+path.sep)&&realpathSync(file)===file,'bounded toolbar witness');
 const before=lstatSync(file,{bigint:true}),bytes=readFileSync(file),after=lstatSync(file,{bigint:true});
 demand(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1n&&['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'].every(k=>before[k as keyof typeof before]===after[k as keyof typeof after])&&bytes.length===pin.bytes&&createHash('sha256').update(bytes).digest('hex')===pin.sha256,'toolbar pin '+pin.path);
 return bytes;
}
function readManifest(root:string):CheckedPackage|null{
 if(process.env.NODE_ENV==='production'||!currentFrozen16LocalAuthorityScope())return null;
 const file=path.resolve(root,TYPOGRAPHY_HOST_SUCCESSOR.path);if(!existsSync(file))return null;
 const a=lstatSync(file,{bigint:true});demand(a.isFile()&&!a.isSymbolicLink()&&a.nlink===1n&&realpathSync(file)===file,'ordinary manifest');
 const bytes=readFileSync(file),b=lstatSync(file,{bigint:true});demand(['dev','ino','size','mtimeNs','ctimeNs','mode','nlink'].every(k=>a[k as keyof typeof a]===b[k as keyof typeof b])&&bytes.length===TYPOGRAPHY_HOST_SUCCESSOR.bytes&&createHash('sha256').update(bytes).digest('hex')===TYPOGRAPHY_HOST_SUCCESSOR.sha256,'manifest bytes');
 const p=JSON.parse(bytes.toString())as Package;
 demand(p.schemaVersion===1&&p.kind==='g678-typography-shared-host-successor-v3'&&p.scope==='local-only-current-js-host'&&p.phase===PHASE&&p.version==='typography-v3-native-toolbar-zoom','exact host scope');
 demand(exact(p.physicalReplacements.map(r=>r.original),ORIGINAL_HOST_FILES)&&p.currentSharedFiles.length===29&&new Set(p.currentSharedFiles.map(p=>p.path)).size===29,'two historical host files and29 shared dependencies');
 demand(p.sourceMathOrPageRendererChanged===false&&p.registrationChanges===0&&p.technicalRevalidation==='required-on-this-host-version'&&Object.values(p.acceptanceEffects).length===9&&Object.values(p.acceptanceEffects).every(v=>v===false),'independent gates');
 for(const r of p.physicalReplacements){demand(r.witness.path==='work/g678-shared-host-successors/typography-v1/predecessor/'+r.original.path&&r.witness.bytes===r.original.bytes&&r.witness.sha256===r.original.sha256&&r.current.path===r.original.path&&p.currentSharedFiles.some(f=>exact(f,r.current)),'exact predecessor witness mapping');const w=path.resolve(root,r.witness.path);if(existsSync(w))demand((lstatSync(w).mode&0o222)===0,'read-only historical witness');}
 demand(exact(p.predecessorManifest,PREDECESSOR_HOST),'toolbar predecessor identity');
 const predecessor=JSON.parse(readExactPin(root,p.predecessorManifest).toString()) as Package,delta=p.toolbarZoomDelta;
 demand(delta.original.path==='apps/web/app/globals.css'&&exact(predecessor.currentSharedFiles.find(f=>f.path===delta.original.path),delta.original)&&delta.current.path===delta.original.path,'one stylesheet successor');
 demand(delta.witness.path==='work/g678-shared-host-successors/typography-v3-toolbar-zoom/predecessor-globals.css'&&delta.witness.bytes===delta.original.bytes&&delta.witness.sha256===delta.original.sha256&&delta.appended.path==='work/g678-shared-host-successors/typography-v3-toolbar-zoom/native-toolbar-zoom-append.css','explicit toolbar delta witnesses');
 demand(exact(delta.targetAnimationIds,['shared-nms002-l02-p001','shared-nms002-l01-p047'])&&exact(predecessor.physicalReplacements,p.physicalReplacements)&&exact(predecessor.sourceIntegration,p.sourceIntegration),'unchanged source integration');
 demand(exact(p.currentSharedFiles,predecessor.currentSharedFiles.map(f=>f.path===delta.original.path?delta.current:f)),'only globals pin changes');
 for(const witness of [delta.witness,delta.appended])demand((lstatSync(path.resolve(root,witness.path)).mode&0o222)===0,'readonly toolbar evidence');
 const v3=Buffer.concat([readExactPin(root,delta.witness),readExactPin(root,delta.appended)]);
 demand(v3.length===delta.current.bytes&&createHash('sha256').update(v3).digest('hex')===delta.current.sha256,'exact append-only toolbar change');
 const active=activeHostPins(root);
 let physicalSharedFiles=p.currentSharedFiles,extraPins:HostPin[]=[],binding:HostPin=TYPOGRAPHY_HOST_SUCCESSOR;
 if(existsSync(path.join(root,TYPOGRAPHY_CSS_GAP_SUCCESSOR.path))){
  const successor=JSON.parse(readExactPin(root,TYPOGRAPHY_CSS_GAP_SUCCESSOR).toString()) as {schemaVersion:number;kind:string;scope:string;predecessorManifest:HostPin;predecessorStylesheet:HostPin;currentStylesheet:HostPin;delta:{selector:string;declaration:string;effect:string};sourceMathOrPageRendererChanged:boolean;registrationChanges:number;acceptanceEffects:Record<string,boolean>};
  demand(successor.schemaVersion===1&&successor.kind==='g678-typography-shared-host-css-gap-successor-v1'&&successor.scope==='local-only-current-js-host'&&exact(successor.predecessorManifest,TYPOGRAPHY_HOST_SUCCESSOR)&&exact(successor.predecessorStylesheet,delta.current)&&exact(successor.currentStylesheet,CSS_GAP_CURRENT)&&exact(successor.delta,{selector:'@media (max-width: 720px) .site-header__inner',declaration:'gap: 0.75rem',effect:'mobile header spacing only'})&&successor.sourceMathOrPageRendererChanged===false&&successor.registrationChanges===0&&Object.values(successor.acceptanceEffects).length===9&&Object.values(successor.acceptanceEffects).every(v=>v===false),'exact CSS successor scope');
  const anchor='  .site-header__inner {\n    min-height: 68px;\n  }';
  const prior=v3.toString();demand(prior.split(anchor).length===2,'single mobile header anchor');
  const composed=Buffer.from(prior.replace(anchor,'  .site-header__inner {\n    gap: 0.75rem;\n    min-height: 68px;\n  }'));
  demand(composed.length===CSS_GAP_CURRENT.bytes&&createHash('sha256').update(composed).digest('hex')===CSS_GAP_CURRENT.sha256&&composed.equals(readExactPin(root,active.resolve(CSS_GAP_CURRENT))),'only exact mobile header gap');
  physicalSharedFiles=p.currentSharedFiles.map(pin=>pin.path===delta.current.path?CSS_GAP_CURRENT:pin);
  extraPins=[TYPOGRAPHY_CSS_GAP_SUCCESSOR];binding=TYPOGRAPHY_CSS_GAP_SUCCESSOR;
 }else demand(v3.equals(readExactPin(root,active.resolve(delta.current))),'exact v3 current stylesheet');
 return {...p,physicalSharedFiles:[...active.expand(physicalSharedFiles)],extraPins,binding};
}
/** Returns explicit physical pins; the existing strict reader checks every
 * original witness and current dependency. It never returns new bytes as old
 * bytes and never suppresses a failed original-source integrity check. */
export function resolveTypographyHostClosurePins(root:string,pins:readonly HostPin[]):readonly HostPin[]{
 const p=readManifest(root);if(!p)return pins;
 const seen=new Set<string>(),result:HostPin[]=[];
 for(const original of pins){const replacement=p.physicalReplacements.find(r=>r.original.path===original.path);if(replacement){demand(exact(original,replacement.original)&&!seen.has(original.path),'exact historical caller binding');seen.add(original.path);result.push(replacement.witness);}else result.push(original);}
 demand(seen.size===2,'complete existing host closure');
 result.push(TYPOGRAPHY_HOST_SUCCESSOR,p.sourceIntegration,...p.physicalSharedFiles,...p.extraPins,p.predecessorManifest,p.toolbarZoomDelta.witness,p.toolbarZoomDelta.appended);
 const byPath=new Map<string,HostPin>();for(const pin of result){const earlier=byPath.get(pin.path);demand(!earlier||exact(earlier,pin),'conflicting physical pin');byPath.set(pin.path,pin);}return Object.freeze([...byPath.values()]);
}
/** Include all current and historical host inputs in cache invalidation. */
export function typographyHostFingerprintPaths(root:string):readonly string[]{
 const p=readManifest(root);return p?[TYPOGRAPHY_HOST_SUCCESSOR.path,p.sourceIntegration.path,...p.physicalReplacements.map(r=>r.witness.path),...p.physicalSharedFiles.map(p=>p.path),...p.extraPins.map(p=>p.path),p.predecessorManifest.path,p.toolbarZoomDelta.witness.path,p.toolbarZoomDelta.appended.path].map(f=>path.resolve(root,f)):[path.resolve(root,TYPOGRAPHY_HOST_SUCCESSOR.path)];
}
export function currentTypographyHostBinding(root:string):HostPin|null{return readManifest(root)?.binding??null;}
