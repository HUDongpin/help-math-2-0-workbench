/** Common Current-JS proof reader. Page evidence, host version and registry
 * transaction are independent. Historical bytes are never relabelled current. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {resolveG678HistoricalEvidencePath} from './g678-life-root-binding-v1.mjs';
import {setImmediate as yieldEventLoop} from 'node:timers/promises';
import {AsyncLocalStorage} from 'node:async_hooks';
import {isHfrArtifactEntry, hfrArtifactPins, hfrRegistrationMetadata, validateHfrArtifactClosure, validateHfrSharedHostMembership} from '../scripts/lib/hfr-artifact-binding-v1.mjs';
import {renderLocalOnlyRegistrySource, renderLocalOnlyRegistryMetadataSource} from '../packages/demos/scripts/generate-registry.mjs';

export const REGISTRY = 'packages/demos/private-current-js-registry.json';
export const DISPATCH = ['packages/demos/src/registry.local-only.generated.ts',
  'packages/demos/src/registry.local-only.metadata.generated.ts'];
// These exact maintained dependencies were historically pinned by page proofs.
// This closed list does not include renderer artifacts, source evidence or HFR.
export const LEGACY_PAGE_HOST_PROMOTION_PATHS = Object.freeze([
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx',
  'scripts/upsert-private-current-js-calibration.mjs',
  // Reviewed 2026-10-24: retain each exact predecessor while the shared host
  // binds current code. Entry artifacts, sources and freeze manifests remain
  // ineligible even if a caller supplies an allowlisted path.
  'packages/demos/src/decoded-source-stream-transport.ts',
  'apps/web/components/g678-alg-l06-p060-host-lesson-v1.tsx',
  'packages/demos/src/alg-l06-p060-audio-v1.ts',
  'packages/demos/src/alg-l06-p060-player-v1.tsx',
  'packages/demos/src/alg-l06-p060-session-v1.ts',
  'apps/web/lib/g678-local-runtime-asset.server.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p002/canvas-renderer.js/route.ts',
  'apps/web/components/continuous-source-clock-runtime.tsx',
  'apps/web/components/g678-terminal-source-runtime-v1.tsx',
  'packages/demos/src/continuous-source-stream-clock-candidate.ts',
]);
// Historical producers also called these exact workspace sources "external".
// Resolve their physical address; genuine SWF/XML/audio custody stays external.
export const LEGACY_PROJECT_EXTERNAL_HOST_PATHS = Object.freeze([
  'packages/demos/src/contract.ts',
  'lib/g678-admission-proof.mjs',
  'packages/demos/scripts/generate-registry.mjs',
  'scripts/lib/g678-registration-preflight-v1.mjs',
  'scripts/private-current-js-registry.mjs',
  'scripts/upsert-private-current-js-calibration.mjs',
  'scripts/lib/g678-admission-candidate-v4.mjs',
  'scripts/refresh-g678-admission-host.mjs',
  'scripts/lib/g678-stable-browser-candidate-v1.mjs',
  // The reviewed 2026-10-24 dependencies also occur as historical physical
  // workspace externals. The resolver still requires their exact transition.
  'packages/demos/src/decoded-source-stream-transport.ts',
  'apps/web/components/g678-alg-l06-p060-host-lesson-v1.tsx',
  'packages/demos/src/alg-l06-p060-audio-v1.ts',
  'packages/demos/src/alg-l06-p060-player-v1.tsx',
  'packages/demos/src/alg-l06-p060-session-v1.ts',
  'apps/web/lib/g678-local-runtime-asset.server.ts',
  'apps/web/app/flash-assets/g678-local/shared-alg001-l06-p002/canvas-renderer.js/route.ts',
  'apps/web/components/continuous-source-clock-runtime.tsx',
  'apps/web/components/g678-terminal-source-runtime-v1.tsx',
  'packages/demos/src/continuous-source-stream-clock-candidate.ts',
]);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const verificationReads = new AsyncLocalStorage();
// A closed scope may still be inherited by a detached async callback. It must
// never retain or reuse a verification result after the boundary has returned.
function currentObservations() {
  const scope = verificationReads.getStore();
  return scope?.active ? scope.observations : undefined;
}
function closeVerificationScope(scope, steps) {
  try { steps?.return(); }
  finally { scope.active = false; scope.observations.clear(); }
}
const STABLE_FIELDS = ['dev','ino','mode','size','mtimeNs','ctimeNs','nlink'];
const sameMetadata = (before,after) => STABLE_FIELDS.every(k => before[k] === after[k]);
function assertObservedReadsStable(observations) {
  // This final sweep intentionally does not yield. It prevents a same-event-loop
  // mutation of an already swept input; it is not an atomic filesystem snapshot.
  const roots = new Set();
  for (const [file,observed] of observations) {
    if (!roots.has(observed.root)) {
      assert(realpathSync(observed.root) === observed.root,'stable physical source root');
      roots.add(observed.root);
    }
    assert(realpathSync(file) === file,`stable observed physical path: ${observed.relative}`);
    assert(sameMetadata(observed.metadata,lstatSync(file,{bigint:true})),
      `stable observed admission input: ${observed.relative}`);
  }
}
function inspectOrdinary(root, relative) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative) && !relative.includes('\\') &&
    relative.split('/').every(p => p && p !== '.' && p !== '..'), 'bounded relative path');
  root = resolveG678HistoricalEvidencePath(root);
  const file = path.resolve(root, relative);
  assert(realpathSync(root) === root && realpathSync(file) === file, `physical path: ${relative}`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && before.nlink === 1n && before.size <= 64n * 1024n * 1024n, `ordinary bounded file: ${relative}`);
  return {file,before,root};
}
function readInspectedOrdinary(_root,relative,{file,before,root}) {
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  assert(sameMetadata(before,after), `stable read: ${relative}`);
  const observations = currentObservations();
  if (observations) {
    const previous = observations.get(file);
    if (previous) assert(sameMetadata(previous.metadata,after),`stable repeated admission input: ${relative}`);
    else observations.set(file,{root,relative,metadata:after});
  }
  return bytes;
}
export function readOrdinary(root, relative) {
  return readInspectedOrdinary(root,relative,inspectOrdinary(root,relative));
}
export function pinFile(root, relative) {
  const bytes = readOrdinary(root, relative);
  return {path: relative, bytes: bytes.length, sha256: sha256(bytes)};
}
export function readPin(root, pin) {
  assert(pin && Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 && /^[a-f0-9]{64}$/.test(pin.sha256), 'valid pin');
  const bytes = readOrdinary(root, pin.path);
  assert(bytes.length === pin.bytes && sha256(bytes) === pin.sha256, `current bytes: ${pin.path}`);
  return bytes;
}
export function readJsonPin(root, pin) {return JSON.parse(readPin(root, pin).toString());}
// Discarded-byte verification only, scoped to one full admission call. Retain
// metadata and a validated length/digest, never bytes, JSON or caller pin objects.
// Public reads always read and hash again, including the final boundary reads.
function verifyPin(root,pin) {
  const observations=currentObservations();
  if (!observations) {readPin(root,pin);return;}
  assert(pin && Number.isSafeInteger(pin.bytes) && pin.bytes >= 0 && /^[a-f0-9]{64}$/.test(pin.sha256), 'valid pin');
  const inspected=inspectOrdinary(root,pin.path),observed=observations.get(inspected.file);
  if (observed?.verifiedPin) {
    assert(sameMetadata(observed.metadata,inspected.before),`stable repeated admission input: ${pin.path}`);
    assert(observed.verifiedPin.bytes===pin.bytes && observed.verifiedPin.sha256===pin.sha256,`current bytes: ${pin.path}`);
    return;
  }
  const bytes=readInspectedOrdinary(root,pin.path,inspected);
  assert(bytes.length===pin.bytes && sha256(bytes)===pin.sha256,`current bytes: ${pin.path}`);
  observations.get(inspected.file).verifiedPin={bytes:bytes.length,sha256:pin.sha256};
}

export function uniquePins(pins) {
  const map = new Map();
  for (const pin of pins) {
    if (map.has(pin.path)) assert.deepEqual(map.get(pin.path), pin, `conflicting pins: ${pin.path}`);
    map.set(pin.path, pin);
  }
  return [...map.values()].sort((a,b) => a.path.localeCompare(b.path));
}

// The same production generator renders both dispatch files. This checks the
// complete files, including guards and loader bodies, not a permissive regex.
export function registrySources(registry) {
  assert(registry.schemaVersion === 2 && registry.registryScope === 'private-engineering' && Array.isArray(registry.calibrations));
  const ids = new Set(), keys = new Set(), entries = [];
  for (const c of registry.calibrations) {
    assert(!ids.has(c.calibrationId) && typeof c.calibrationId === 'string', 'unique calibration'); ids.add(c.calibrationId);
    for (const e of c.entries) {
      assert(/^[a-z0-9-]+$/.test(e.key) && /^\.\/modules\/[a-z0-9-]+$/.test(e.module) && !keys.has(e.key), 'unique canonical module'); keys.add(e.key);
      if (c.deploymentScope !== 'local-only') continue;
      assert(e.maturity === 'private-current-js' && /^[a-f0-9]{64}$/.test(c.freezeManifestSha256), 'local registration');
      entries.push({...e,scope:'private-engineering',calibrationId:c.calibrationId,deploymentScope:'local-only',
        freezeManifestSha256:c.freezeManifestSha256,moduleSha256:e.artifacts.module.sha256,
        ...(isHfrArtifactEntry(e) ? hfrRegistrationMetadata(e) : {timelineSha256:e.artifacts.timeline.sha256,
        ...(e.artifacts.kind === 'maintained-dom-module-v1' ? {rendererBindingKind:e.artifacts.kind,
          memberManifestSha256:e.artifacts.memberManifest.sha256,sourceRunSha256:e.artifacts.sourceRun.sha256}
          : {runtimeSha256:e.artifacts.runtime.sha256})})});
    }
  }
  entries.sort((a,b)=>a.key.localeCompare(b.key));
  return [renderLocalOnlyRegistrySource(entries),renderLocalOnlyRegistryMetadataSource(entries)];
}
export function readRegistryTransaction(root) {
  const bytes = readOrdinary(root, REGISTRY), registry = JSON.parse(bytes.toString());
  const rendered = registrySources(registry);
  DISPATCH.forEach((file,i)=>assert.equal(readOrdinary(root,file).toString(),rendered[i],`canonical registry output: ${file}`));
  return {registry,sha256:sha256(bytes)};
}

function* verifyHostVersionSteps(root, hostPin) {
  const host = readJsonPin(root,hostPin);
  assert(host.schemaVersion === 1 && host.kind === 'g678-admission-host-v1' && host.files.length > 0, 'host version');
  assert.deepEqual(uniquePins(host.files), host.files, 'unique sorted host inputs');
  for (const pin of host.files) {verifyPin(root,pin); yield;}
  verifyLegacyPageHostPromotions(root,host);
  return host;
}
/** A dedicated exact transition for the two historical ownership mistakes.
 * Even direct readPageProof callers must verify current and retained bytes. */
export function verifyLegacyPageHostPromotions(root,host) {
  const transitions=host.legacyPageHostPromotions??[],byPath=new Map();
  assert(Array.isArray(transitions),'legacy page-host promotion list');
  for(const transition of transitions) {
    assert.deepEqual(Object.keys(transition).sort(),['current','original','snapshot'],'exact page-host promotion keys');
    const {original,current,snapshot}=transition;
    assert(LEGACY_PAGE_HOST_PROMOTION_PATHS.includes(original?.path),'reviewed legacy shared path only');
    assert(!byPath.has(original.path),'one historical pin per promoted shared path');
    assert(current?.path===original.path&&snapshot?.path!==original.path,'distinct retained shared snapshot');
    const target=host.files.filter(pin=>pin.path===original.path);
    assert(target.length===1,'promoted source belongs to current host');
    assert.deepEqual(current,target[0],'exact promoted current host target');
    assert(snapshot.bytes===original.bytes&&snapshot.sha256===original.sha256,'snapshot retains exact page-owned bytes');
    verifyPin(root,current);verifyPin(root,snapshot);
    byPath.set(original.path,transition);
  }
  return byPath;
}
export function resolveHistoricalProjectExternal(root,source,host,packet) {
  // Resolve physical custody only. The proof and packet retain recorded roots.
  source = {...source, root: resolveG678HistoricalEvidencePath(source.root, root)};
  const relative=path.relative(root,path.resolve(source.root,source.pin.path)).split(path.sep).join('/');
  if(!LEGACY_PROJECT_EXTERNAL_HOST_PATHS.includes(relative)) {
    verifyPin(source.root,source.pin);return [source];
  }
  // pinFile rejects traversal, symlinks, nonphysical roots and unstable reads.
  // An unchanged external binding does not require any ownership exception.
  const actual=pinFile(source.root,source.pin.path);
  if(actual.bytes===source.pin.bytes&&actual.sha256===source.pin.sha256)return [source];
  assert(source.root===root||source.root.startsWith(`${root}/`),'external shared source is in this physical workspace');
  assert(!isHfrArtifactEntry(packet.entry),'HFR sources cannot use historical external-host repair');
  assert(!admissionSourcePins(packet).some(pin=>source.root===packet.sourceRoot&&
    pin.path===source.pin.path&&pin.bytes===source.pin.bytes&&pin.sha256===source.pin.sha256),
    'original source evidence cannot become a shared host input');
  // Historical external rows can carry descriptive metadata such as `role`.
  // Compare the exact file identity; metadata never authorizes a transition.
  const original={path:relative,bytes:source.pin.bytes,sha256:source.pin.sha256};
  const target=host.files.filter(pin=>pin.path===relative);
  assert(target.length===1,'historical external shared source belongs to current host');
  const transitions=[...(host.legacyInputTransitions??[]),...(host.legacyPageHostPromotions??[])]
    .filter(t=>t.original.path===relative&&t.original.bytes===original.bytes&&t.original.sha256===original.sha256);
  assert(transitions.length===1,'exact historical external-host transition required');
  const transition=transitions[0];
  assert.deepEqual(transition.original,original,'exact historical external source pin');
  assert.deepEqual(transition.current,target[0],'exact historical external current host target');
  assert(transition.snapshot.bytes===original.bytes&&transition.snapshot.sha256===original.sha256,
    'snapshot retains exact historical external bytes');
  verifyPin(root,target[0]);verifyPin(root,transition.snapshot);
  return [{root,pin:target[0]},{root,pin:transition.snapshot}];
}
/** Physical watch bindings reuse the exact page-reader promotion decision. */
export function resolveLegacyPageHostInput(root,pin,promotions,entry,host=null,packet=null) {
  const transition=promotions.get(pin.path);
  if(transition&&(pin.bytes!==transition.current.bytes||pin.sha256!==transition.current.sha256)) {
    assert(!isHfrArtifactEntry(entry),'HFR page inputs cannot use legacy page-host promotion');
    assert.deepEqual(pin,transition.original,'exact historical page-owned shared pin');
    return transition;
  }
  // Some legacy producers retained an already host-owned dependency in files
  // as well as legacyInputs. Resolve that same exact approved transition for
  // both proof reads and browser watches, without rewriting either old list.
  if(host && packet && LEGACY_PROJECT_EXTERNAL_HOST_PATHS.includes(pin.path) &&
      host.files.some(current=>current.path===pin.path && (current.bytes!==pin.bytes || current.sha256!==pin.sha256))) {
    assert(![...admissionArtifactPins(entry),packet.freezeManifest].some(p=>p.path===pin.path),
      'page artifacts cannot be promoted into the host');
    const resolved=resolveHistoricalProjectExternal(root,{root,pin},host,packet);
    assert(resolved.length===2,'exact retained host dependency required');
    return {original:pin,current:resolved[0].pin,snapshot:resolved[1].pin};
  }
  verifyPin(root,pin);return null;
}
/** Explicit renderer union; tags are never interpreted as file pins. */
export function admissionArtifactPins(entry) {
  if (isHfrArtifactEntry(entry)) return hfrArtifactPins(entry);
  const a=entry?.artifacts;
  assert(a && typeof a==='object' && !Array.isArray(a),'renderer artifacts');
  const native=a.kind==='maintained-dom-module-v1';
  assert(a.kind===undefined || native,'supported renderer binding');
  const keys=native?['kind','module','timeline','memberManifest','sourceRun']:['module','timeline','runtime'];
  assert.deepEqual(Object.keys(a).sort(),keys.sort(),'exact renderer artifact keys');
  const pins=(native?['module','timeline','memberManifest','sourceRun']:['module','timeline','runtime']).map(k=>a[k]);
  for(const p of pins)assert(p && typeof p.path==='string' && Number.isSafeInteger(p.bytes) && p.bytes>=0 && /^[a-f0-9]{64}$/.test(p.sha256),'renderer file pin');
  assert(new Set(pins.map(p=>p.path)).size===pins.length,'distinct renderer file pins');
  return pins;
}
/** Legacy single-SA packets retain their exact closure; new quiz packets name
 * every original recording. The page validator binds question and option roles. */
export function admissionSourcePins(packet) {
  // HFR's optional original Spanish audio is pinned inside its mandatory
  // artifact closure and checked against proof.external below.
  if (isHfrArtifactEntry(packet.entry)) return [packet.source, packet.sourceXml];
  if(packet.sourceAudio!==undefined) {
    assert(packet.optionalSpanishAudio===undefined,'unambiguous source audio binding');
    const audio=packet.sourceAudio;
    if(audio?.kind==='embedded-source-stream-v1') {
      assert.deepEqual(Object.keys(audio).sort(),['extracted','kind','sourceCharacterId'],
        'exact embedded stream keys');
      assert(Number.isSafeInteger(audio.sourceCharacterId)&&audio.sourceCharacterId>0,
        'source stream character identity');
      const extracted=audio.extracted;
      assert(extracted&&typeof extracted.path==='string'&&
        extracted.path.startsWith(`migrations/${packet.selectedPages[0].animationId}/source-v1/`)&&
        extracted.path.split('/').every(part=>part&&part!=='.'&&part!=='..')&&
        Number.isSafeInteger(extracted.bytes)&&extracted.bytes>0&&
        /^[a-f0-9]{64}$/u.test(extracted.sha256),'bounded extracted stream pin');
      assert(packet.integrity?.files?.some(pin=>pin.path===extracted.path&&
        pin.bytes===extracted.bytes&&pin.sha256===extracted.sha256),
        'embedded stream is retained in exact derived-input closure');
      return [packet.source,packet.sourceXml];
    }
    assert(audio?.kind==='question-option-source-audio-v1' && Array.isArray(audio.sources) && audio.sources.length>0,'explicit question-option source audio');
    assert.deepEqual(Object.keys(audio).sort(),['kind','sources'],'exact source audio keys');
    const pins=audio.sources;
    for(const p of pins)assert(p && typeof p.path==='string' && Number.isSafeInteger(p.bytes) && p.bytes>0 && /^[a-f0-9]{64}$/.test(p.sha256),'source audio file pin');
    assert(new Set(pins.map(p=>p.path)).size===pins.length,'distinct original audio paths');
    return [packet.source,packet.sourceXml,...pins];
  }
  assert(packet.optionalSpanishAudio?.source,'legacy Spanish source binding');
  return [packet.source,packet.sourceXml,packet.optionalSpanishAudio.source];
}

function* readPageProofSteps(root, proofPin, host, transaction) {
  const proof = readJsonPin(root,proofPin);
  assert(proof.schemaVersion === 1 && proof.kind === 'g678-page-proof-v1' && proof.hostContract === host.contract, 'page proof contract');
  assert(proof.packet.selectedPages.length === 1 && proof.packet.selectedPages[0].animationId === proof.animationId, 'exact page identity');
  assert(Object.values(proof.packet.acceptanceEffects).every(value=>value === false), 'independent acceptance remains false');
  const actual = transaction.registry.calibrations.filter(c=>c.calibrationId === proof.registration.calibrationId);
  assert(actual.length === 1, 'current page registration exists');
  assert.deepEqual(actual[0],proof.registration,'exact own registration; unrelated transactions are independent');
  assert.deepEqual(uniquePins(proof.files),proof.files,'unique sorted page inputs');
  const promotions=verifyLegacyPageHostPromotions(root,host),promoted=new Map();
  for(const artifact of [...admissionArtifactPins(proof.packet.entry),proof.packet.freezeManifest])
    assert(!promotions.has(artifact.path),'page artifacts cannot be promoted into the host');
  for (const pin of proof.files) {
    const transition=resolveLegacyPageHostInput(root,pin,promotions,proof.packet.entry,host,proof.packet);
    if(transition)promoted.set(pin.path,transition);
    yield;
  }
  for (const source of proof.external) {resolveHistoricalProjectExternal(root,source,host,proof.packet); yield;}
  // Every input read by the successful legacy producer/reader is accounted for.
  // Host inputs and generated dispatch have explicit replacement checks above.
  const {freezeManifest,...frozenPacket}=proof.packet;
  assert.deepEqual(readJsonPin(root,freezeManifest),frozenPacket,'packet is the exact frozen producer artifact');
  for(const source of admissionSourcePins(proof.packet))
    assert(proof.external.some(item=>item.root===proof.packet.sourceRoot &&
      item.pin.path===source.path && item.pin.bytes===source.bytes && item.pin.sha256===source.sha256),'source custody is retained');
  const covered = new Map();
  for (const current of [...proof.files,...host.files])
    if (!covered.has(current.path)) covered.set(current.path,promoted.get(current.path)?.current??current);
  const legacyByPath = new Map();
  for (const input of proof.legacyInputs) {
    if (!legacyByPath.has(input.path)) legacyByPath.set(input.path,[]);
    legacyByPath.get(input.path).push(input);
  }
  const hfrClosure = isHfrArtifactEntry(proof.packet.entry)
    ? validateHfrArtifactClosure(root, proof.registration, proof.packet.entry, proof.packet) : null;
  for (const item of hfrClosure?.external ?? [])
    assert(proof.external.some(source => source.root === item.root &&
      source.pin.path === item.pin.path && source.pin.bytes === item.pin.bytes && source.pin.sha256 === item.pin.sha256),
    'complete HFR external source closure');
  const hfrSharedPaths = new Map();
  if(hfrClosure)validateHfrSharedHostMembership(root,host);
  const samePin = (a,b) => a && b && a.path===b.path && a.bytes===b.bytes && a.sha256===b.sha256;
  // HFR dependencies may live outside src/hfr (for example the maintained
  // lesson-text snapshot helper). Every host-owned legacy input uses the same
  // exact transition rule; none falls back to a path-only replacedRoutes skip.
  const hfrSharedInputs=hfrClosure?uniquePins([...hfrClosure.shared,
    ...proof.legacyInputs.filter(pin=>host.files.some(file=>file.path===pin.path))]):[];
  for (const pin of hfrSharedInputs) {
    const current = host.files.filter(file=>file.path===pin.path);
    assert(current.length===1,'HFR shared input belongs to the verified host');
    if (!samePin(pin,current[0])) {
      const transitions=(host.legacyInputTransitions??[]).filter(t=>samePin(t.original,pin));
      const historical=(host.historicalRoutes??[]).filter(t=>samePin(t.original,pin));
      assert(transitions.length+historical.length===1,'exact HFR shared host transition required');
      const transition=transitions[0]??historical[0];
      if (transitions.length)assert(samePin(transition.current,current[0]),'HFR current host transition target');
      else assert(host.replacedRoutes.includes(pin.path),'HFR explicit historical host path');
      assert(transition.snapshot.bytes===pin.bytes && transition.snapshot.sha256===pin.sha256,
        'HFR exact historical host bytes');
      verifyPin(root,transition.snapshot);
    }
    hfrSharedPaths.set(pin.path,pin);
  }
  for(const pin of [...proof.packet.integrity.files,...admissionArtifactPins(proof.packet.entry),...(hfrClosure?.files ?? []),freezeManifest])
    assert((legacyByPath.get(pin.path)??[]).some(item=>item.path===pin.path && item.bytes===pin.bytes && item.sha256===pin.sha256),'complete producer closure');
  for (const pin of proof.legacyInputs) {
    assert(covered.has(pin.path) || DISPATCH.includes(pin.path),`unaccounted legacy input: ${pin.path}`);
    if(promoted.has(pin.path)) {
      const transition=promoted.get(pin.path);
      assert.deepEqual(pin,transition.original,'exact promoted legacy input');
      assert.deepEqual(covered.get(pin.path),transition.current,'promoted input uses current host coverage');
      yield;continue;
    }
    if(hfrSharedPaths.has(pin.path)) {
      assert(samePin(pin,hfrSharedPaths.get(pin.path)),'exact HFR shared legacy input');
      yield;continue;
    }
    if (covered.has(pin.path) && !host.replacedRoutes.includes(pin.path)) {
      const current=covered.get(pin.path);
      const transitions=(host.legacyInputTransitions??[]).filter(t=>samePin(t.original,pin));
      assert(transitions.length<=1,'one exact reviewed legacy input transition');
      const transition=transitions[0];
      if(transition) {
        assert.deepEqual(transition.original,pin,'exact reviewed legacy input transition');
        assert.deepEqual(transition.current,current,'current host transition target');
        verifyPin(root,transition.current);
        assert(transition.snapshot.bytes===pin.bytes && transition.snapshot.sha256===pin.sha256,'preserved original host input');
        verifyPin(root,transition.snapshot);
      } else assert.deepEqual(current,pin,`retained evidence: ${pin.path}`);
    }
    yield;
  }
  return proof.packet;
}

/** Real producer output is read immediately, before any route is activated. */
function* verifyAdmissionSteps(root, indexPin) {
  const index = readJsonPin(root,indexPin);
  assert(index.schemaVersion === 1 && index.kind === 'g678-admission-index-v1', 'admission index');
  const host = yield* verifyHostVersionSteps(root,index.host);
  const transaction = readRegistryTransaction(root), entries = [];
  for (const page of index.pages)
    entries.push([page.animationId, yield* readPageProofSteps(root,page.proof,host,transaction)]);
  const packets = Object.fromEntries(entries);
  assert(Object.keys(packets).length === index.pages.length, 'unique admitted pages');
  return {index, packets, registrySha256:transaction.sha256};
}

// Both entry points execute the same assertions and complete source closure.
// The synchronous tools retain their API; HTTP requests can yield between reads.
function drain(steps) {
  let step;
  do {step = steps.next();} while (!step.done);
  return step.value;
}
export function verifyHostVersion(root, hostPin) {
  return drain(verifyHostVersionSteps(root,hostPin));
}
/** A read-only stage may share discarded-byte verification, never returned
 * packets or semantic verdicts. Every public stage is a fresh hash boundary. */
export function withAdmissionReadStage(root, anchorPins, callback) {
  const scope = {active:true, observations:new Map()};
  return verificationReads.run(scope, () => {
    try {
      const anchors = structuredClone(anchorPins);
      assert(Array.isArray(anchors) && anchors.length > 0, 'explicit stage hash anchors');
      anchors.forEach(pin => readPin(root,pin));
      const result = callback();
      assert(!result || typeof result.then !== 'function', 'use async admission stage for async work');
      anchors.forEach(pin => readPin(root,pin));
      assertObservedReadsStable(scope.observations);
      return result;
    } finally { closeVerificationScope(scope); }
  });
}
export async function withAdmissionReadStageAsync(root, anchorPins, callback) {
  const scope = {active:true, observations:new Map()};
  return verificationReads.run(scope, async () => {
    try {
      const anchors = structuredClone(anchorPins);
      assert(Array.isArray(anchors) && anchors.length > 0, 'explicit stage hash anchors');
      anchors.forEach(pin => readPin(root,pin));
      const result = await callback();
      anchors.forEach(pin => readPin(root,pin));
      assertObservedReadsStable(scope.observations);
      return result;
    } finally { closeVerificationScope(scope); }
  });
}
export function readPageProof(root, proofPin, host, transaction) {
  const read = () => drain(readPageProofSteps(root,proofPin,host,transaction));
  // Existing outer stage owns its final sweep; standalone calls get their own.
  return currentObservations() ? read() : withAdmissionReadStage(root,[proofPin],read);
}
function finishVerification(root, boundIndex, result, scope) {
  readPin(root,boundIndex);
  readPin(root,result.index.host);
  assert.equal(readRegistryTransaction(root).sha256,result.registrySha256,
    'stable admission registry transaction');
  assertObservedReadsStable(scope.observations);
  return result;
}
export function verifyAdmission(root, indexPin) {
  const scope = {active:true, observations:new Map()};
  return verificationReads.run(scope, () => {
    let steps;
    try {
      const boundIndex = structuredClone(indexPin);
      steps = verifyAdmissionSteps(root,boundIndex);
      return finishVerification(root,boundIndex,drain(steps),scope);
    }
    finally { closeVerificationScope(scope,steps); }
  });
}
export async function verifyAdmissionAsync(root, indexPin) {
 const scope = {active:true, observations:new Map()};
 return verificationReads.run(scope,async () => {
  let steps;
  try {
    const boundIndex = structuredClone(indexPin);
    steps = verifyAdmissionSteps(root,boundIndex);
    let sliceStart = performance.now(), step;
    do {
      if (performance.now() - sliceStart >= 12) {
        await yieldEventLoop();
        sliceStart = performance.now();
      }
      step = steps.next();
    } while (!step.done);
    // Yields permit other requests: reject a concurrent index, host or registry
    // transaction change before returning. No previous result is cached/reused.
    return finishVerification(root,boundIndex,step.value,scope);
  } finally {closeVerificationScope(scope,steps);}
 });
}
