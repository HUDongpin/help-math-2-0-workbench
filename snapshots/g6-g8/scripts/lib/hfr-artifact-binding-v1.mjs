// The HFR member of the existing private Current-JS artifact contract. This
// validates bytes and source identity; it does not grant browser or page admission.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, readdirSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {resolveG678PhysicalPath} from '../../lib/g678-life-root-binding-v1.mjs';

export const HFR_ARTIFACT_KIND = 'generated-typescript-hfr-v1';
const CLOSURE_KIND = 'hfr-typescript-artifact-closure-v1';
const COMPILER_ROOT = 'work/hfr-typescript/hfr/compiler';
const RUNTIME_ROOT = 'packages/demos/src/hfr';
const HOST_FILES = ['packages/demos/src/contract.ts', 'packages/demos/src/lesson-host-contract.ts'];
const RELEASE_MANIFEST = 'catalog/g678-page-only-release-manifest.v1.json';
const SHA256 = /^[a-f0-9]{64}$/u;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const isHfr = entry => entry?.artifacts?.kind === HFR_ARTIFACT_KIND;
export {isHfr as isHfrArtifactEntry};

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), label);
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), label);
}
function relativeFile(file, label) {
  assert(typeof file === 'string' && !path.isAbsolute(file) &&
    !file.includes('\\') && file.split('/').every(p => p && p !== '.' && p !== '..'), label);
  return file;
}
function filePin(pin, label) {
  exactKeys(pin, ['path', 'bytes', 'sha256'], `${label}: exact file pin`);
  relativeFile(pin.path, `${label}: bounded path`);
  assert(Number.isSafeInteger(pin.bytes) && pin.bytes > 0 && SHA256.test(pin.sha256),
    `${label}: valid length and SHA-256`);
  return pin;
}
function pins(list, label) {
  assert(Array.isArray(list), `${label}: file list`);
  list.forEach(pin => filePin(pin, label));
  assert.deepEqual(list.map(pin => pin.path), [...new Set(list.map(pin => pin.path))].sort(),
    `${label}: unique sorted closure`);
  return list;
}

export function hfrArtifactPins(entry) {
  const a = entry?.artifacts;
  exactKeys(a, ['kind', 'module', 'generated', 'data', 'closure'], 'HFR exact artifact keys');
  assert(a.kind === HFR_ARTIFACT_KIND, 'HFR artifact kind');
  const all = ['module', 'generated', 'data', 'closure'].map(k => filePin(a[k], `HFR ${k}`));
  assert(/^shared-(?:alg001|dat001|geo001|nms002)-l\d{2}-p\d{3}$/u.test(entry.key),
    'HFR exact G6-G8 placement identity');
  assert(entry.module === `./modules/${entry.key}` &&
    a.module.path === `packages/demos/src/modules/${entry.key}.tsx` &&
    a.generated.path === `packages/demos/src/hfr-pages/${entry.key}.ts`,
  'HFR exact wrapper and generated module paths');
  const pageRoot = path.posix.dirname(a.closure.path);
  assert(new RegExp(`^work/g678-shared-page-factory/hfr-ts-[a-z0-9][a-z0-9-]*/members/${entry.key}$`, 'u').test(pageRoot) &&
    a.closure.path === `${pageRoot}/artifact-closure.json` &&
    a.data.path === `${pageRoot}/${entry.key}.data.json`, 'HFR private page artifact paths');
  return all;
}

export function validateHfrArtifactBinding(calibration, entry) {
  assert(calibration.deploymentScope === 'local-only', 'HFR is local-only');
  assert(entry.maturity === 'private-current-js', 'HFR private Current-JS maturity');
  return hfrArtifactPins(entry);
}

export function validateHfrFreezeBinding(calibration, freeze, entry) {
  validateHfrArtifactBinding(calibration, entry);
  assert(freeze.deploymentScope === 'local-only', 'HFR freeze is local-only');
  const matches = freeze.selectedPages?.filter(p => p.animationId === entry.key);
  assert(matches?.length === 1 && matches[0].complexityLane === entry.complexityLane,
    'HFR freeze selects one exact placement and lane');
  assert.deepEqual(matches[0].runtime?.rendererBinding, entry.artifacts,
    'HFR freeze artifact binding drifted');
  return matches[0];
}

function readPin(root, pin, label) {
  filePin(pin, label);
  root = resolveG678PhysicalPath(root);
  const realRoot = realpathSync(root), file = path.resolve(realRoot, pin.path);
  assert(realRoot === path.resolve(root) && realpathSync(file) === file,
    `${label}: physical file path`);
  const before = lstatSync(file, {bigint: true});
  assert(before.isFile() && before.nlink === 1n && before.size <= 64n * 1024n * 1024n,
    `${label}: ordinary bounded single-link file`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  for (const k of ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs', 'nlink'])
    assert(before[k] === after[k], `${label}: stable file read`);
  assert(bytes.length === pin.bytes && sha256(bytes) === pin.sha256, `${label}: bytes drifted`);
  return bytes;
}
function inventory(root, relative) {
  const files = [];
  const walk = current => {
    const dir = path.join(root, current);
    assert(realpathSync(dir) === dir, 'HFR closure directory is physical');
    for (const item of readdirSync(dir, {withFileTypes: true})) {
      const file = `${current}/${item.name}`;
      if (item.isDirectory()) walk(file);
      else {assert(item.isFile() && !item.isSymbolicLink(), 'HFR ordinary closure file'); files.push(file);}
    }
  };
  walk(relative); return files.sort();
}
function declaredSourceList(list, relative, label) {
  pins(list, label);
  assert(list.length > 0 && list.every(pin => pin.path.startsWith(`${relative}/`) && /\.(?:mjs|ts|tsx)$/u.test(pin.path)),
    `${label}: source path boundary`);
}
function sourceList(root, list, relative, label) {
  declaredSourceList(list, relative, label);
  assert.deepEqual(list.map(pin => pin.path), inventory(root, relative), `${label}: complete source membership`);
  list.forEach(pin => readPin(root, pin, label));
}
function runCompilerRoot(entry) {
  return `${path.posix.dirname(path.posix.dirname(path.posix.dirname(entry.artifacts.data.path)))}/compiler`;
}

export function validateHfrArtifactClosure(root, calibration, entry, freeze) {
  validateHfrFreezeBinding(calibration, freeze, entry);
  const a = entry.artifacts;
  const contents = new Map(hfrArtifactPins(entry).map(pin => [pin.path, readPin(root, pin, `HFR ${pin.path}`)]));
  const closure = JSON.parse(contents.get(a.closure.path).toString('utf8'));
  exactKeys(closure, ['schemaVersion', 'kind', 'animationId', 'deploymentScope', 'sourceRoot',
    'source', 'sourceXml', 'sourceAudio', 'releaseManifest', 'module', 'generated', 'data',
    'compiler', 'runtime', 'host', 'media'], 'HFR exact closure fields');
  assert(closure.schemaVersion === 1 && closure.kind === CLOSURE_KIND &&
    closure.animationId === entry.key && closure.deploymentScope === 'local-only', 'HFR closure identity and scope');
  for (const key of ['module', 'generated', 'data']) assert.deepEqual(closure[key], a[key], `HFR ${key} closure pin`);
  assert(typeof closure.sourceRoot === 'string' && path.isAbsolute(closure.sourceRoot), 'HFR absolute source root');
  assert.equal(freeze.sourceRoot, closure.sourceRoot, 'HFR freeze source root');
  assert.deepEqual(freeze.source, closure.source, 'HFR freeze source SWF');
  assert.deepEqual(freeze.sourceXml, closure.sourceXml, 'HFR freeze source XML');
  for (const pin of [closure.source, closure.sourceXml, ...pins(closure.sourceAudio, 'HFR source audio')])
    readPin(closure.sourceRoot, pin, `HFR source ${pin.path}`);
  assert(closure.releaseManifest.path === RELEASE_MANIFEST, 'HFR canonical release manifest');
  const catalog = JSON.parse(readPin(root, closure.releaseManifest, 'HFR release manifest').toString('utf8'));
  const matches = (catalog.releases ?? []).flatMap(release => (release.members ?? [])
    .filter(member => member.animationId === entry.key).map(member => ({release, member})));
  assert(matches.length === 1, 'HFR unique catalog source placement');
  const {release, member} = matches[0];
  assert(member.releaseRole === 'active-xml-referenced-page' && member.placementId === entry.key &&
    closure.source.path === member.source.path.replace(/^HELP_COURSES\//u, '') &&
    closure.source.sha256 === member.source.sha256 &&
    closure.sourceXml.path === release.sourceLesson.path.replace(/^G6-G8-shared\//u, '') &&
    closure.sourceXml.bytes === release.sourceLesson.bytes &&
    closure.sourceXml.sha256 === release.sourceLesson.sha256, 'HFR catalog/source binding drifted');
  const data = JSON.parse(contents.get(a.data.path).toString('utf8'));
  assert(data.schema === 'hfr-page/1' && data.placement?.animationId === entry.key &&
    data.placement.module === release.moduleCode && data.placement.lesson === release.moduleLesson &&
    data.placement.ordinal === member.ordinal && data.placement.sectionCode === member.sectionCode &&
    data.source?.path === member.source.path && data.source.sha256 === closure.source.sha256 &&
    data.source.bytes === closure.source.bytes && data.module === `${entry.key}.js`, 'HFR generated data/source identity drifted');
  // Producer code belongs to this run's immutable snapshot, shared by every
  // member of the run. Later compiler repairs do not change earlier page proof.
  sourceList(root, closure.compiler, runCompilerRoot(entry), 'HFR frozen compiler');
  // Shared runtime/host pins are historical inputs, not page-owned files. The
  // common proof reader resolves them against its verified current host and
  // existing exact snapshot transitions. Fresh producers additionally check
  // live bytes/membership through validateHfrCurrentProducer below.
  declaredSourceList(closure.runtime, RUNTIME_ROOT, 'HFR runtime');
  pins(closure.host, 'HFR host');
  assert.deepEqual(closure.host.map(pin => pin.path), HOST_FILES, 'HFR shared host contract membership');
  const mediaRoot = `${path.posix.dirname(a.data.path)}/media`;
  pins(closure.media, 'HFR media');
  const refs = new Set();
  const add = value => {
    assert(typeof value === 'string' && /^media\/[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value), 'HFR private media reference');
    refs.add(`${path.posix.dirname(a.data.path)}/${value}`);
  };
  for (const item of Object.values(data.dictionary ?? {})) {
    if (item.src !== undefined) add(item.src);
    if (item.alpha !== undefined) add(item.alpha);
  }
  for (const stream of data.streams ?? []) add(stream.src);
  if (data.spanishAudio !== undefined) add(data.spanishAudio);
  assert.deepEqual(closure.media.map(pin => pin.path), [...refs].sort(), 'HFR media reference closure');
  assert.deepEqual(inventory(root, mediaRoot), [...refs].sort(), 'HFR complete media directory');
  closure.media.forEach(pin => readPin(root, pin, 'HFR media'));
  if (data.spanishAudio !== undefined) {
    const spanish = closure.media.find(pin => pin.path === `${path.posix.dirname(a.data.path)}/${data.spanishAudio}`);
    const original = `${release.moduleCode}/L${release.moduleLesson}/SA/${path.posix.basename(member.source.path).replace(/\.swf$/iu, '')}.mp3`;
    assert(closure.sourceAudio.length === 1 && closure.sourceAudio[0].path === original &&
      closure.sourceAudio[0].bytes === spanish.bytes && closure.sourceAudio[0].sha256 === spanish.sha256,
    'HFR Spanish audio source binding');
  } else assert(closure.sourceAudio.length === 0, 'HFR no unbound source audio');
  return {compiler: closure.compiler, shared: [...closure.runtime, ...closure.host],
    files: [...hfrArtifactPins(entry), closure.releaseManifest, ...closure.compiler, ...closure.runtime,
    ...closure.host, ...closure.media], external: [closure.source, closure.sourceXml, ...closure.sourceAudio]
      .map(pin => ({root: closure.sourceRoot, pin}))};
}

// Required for a new producer/preflight/first write, never for an exact
// historical read. It binds this run's frozen toolchain to the tools actually
// used now, and shared sources to their current bytes before host admission.
export function validateHfrCurrentProducer(root, calibration, entry, freeze) {
  const closure = validateHfrArtifactClosure(root, calibration, entry, freeze);
  const frozenRoot = runCompilerRoot(entry);
  const liveCompiler = closure.compiler.map(pin => ({...pin,
    path: `${COMPILER_ROOT}/${pin.path.slice(frozenRoot.length + 1)}`}));
  sourceList(root, liveCompiler, COMPILER_ROOT, 'HFR current compiler');
  sourceList(root, closure.shared.filter(pin => pin.path.startsWith(`${RUNTIME_ROOT}/`)), RUNTIME_ROOT, 'HFR current runtime');
  closure.shared.filter(pin => !pin.path.startsWith(`${RUNTIME_ROOT}/`))
    .forEach(pin => readPin(root, pin, 'HFR current host'));
  return closure;
}

// Membership belongs to the current shared host version, not an earlier
// page's closure. A newly added runtime source must therefore be explicitly
// pinned by that host before old or new HFR pages can use it.
export function validateHfrSharedHostMembership(root, host) {
  const runtime = host.files.filter(pin => pin.path.startsWith(`${RUNTIME_ROOT}/`));
  declaredSourceList(runtime, RUNTIME_ROOT, 'HFR current host runtime');
  assert.deepEqual(runtime.map(pin => pin.path), inventory(root, RUNTIME_ROOT),
    'HFR current host covers complete runtime membership');
}

export function hfrRegistrationMetadata(entry) {
  return {rendererBindingKind: HFR_ARTIFACT_KIND, generatedModuleSha256: entry.artifacts.generated.sha256,
    pageDataSha256: entry.artifacts.data.sha256, artifactClosureSha256: entry.artifacts.closure.sha256};
}
export function hfrRegistrationMetadataSource(entry) {
  return `, rendererBindingKind: '${HFR_ARTIFACT_KIND}', generatedModuleSha256: '${entry.generatedModuleSha256}', pageDataSha256: '${entry.pageDataSha256}', artifactClosureSha256: '${entry.artifactClosureSha256}'`;
}
