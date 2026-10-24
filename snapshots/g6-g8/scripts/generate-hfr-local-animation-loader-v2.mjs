/** Successor of generate-hfr-local-animation-loader-v1.mjs. The reviewed server
 * CANDIDATES packet pins are the only HFR candidate selection: each pinned packet
 * supplies its own source sha256 and module path, and this script emits the client
 * candidate module from them. The client keeps no hand-maintained table, so a new
 * candidate changes only its server pin. Every registered navigation target is
 * preserved exactly as in v1; no guessed module names, registry edits,
 * availability edits, or global fallback. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const candidateId = /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/;
export const SERVER_PATH = 'apps/web/lib/hfr-local-pages.server.ts';
export const CLIENT_PATH = 'apps/web/components/hfr-local-lesson.tsx';
export const LOADER_PATH = 'apps/web/lib/hfr-local-animation-loader-v1.generated.ts';
export const CANDIDATE_MODULE_PATH = 'apps/web/lib/hfr-local-candidates-v2.generated.ts';
export const CLIENT_IMPORT = "import {HFR_LOCAL_CANDIDATE_SOURCES as CANDIDATE_SOURCES, loadHfrLocalCandidate as loadCandidate} from '@/lib/hfr-local-candidates-v2.generated';\n";
const SERVER_MAP = 'const CANDIDATES: Readonly<Record<string, Pin>> = Object.freeze({\n';
const PRODUCT_MAP = 'const PRODUCT_MODULE_PAGES:';

/** Maintained product modules that replace factory page files for these placements. */
export function productModulePages(server) {
  const start = server.indexOf(PRODUCT_MAP);
  assert(start >= 0 && server.indexOf(PRODUCT_MAP, start + 1) < 0, 'one product module map');
  const end = server.indexOf('\n});', start);
  assert(end > start, 'product module map closure');
  const body = server.slice(start, end);
  const pages = [...body.matchAll(/  '([^']+)': Object\.freeze\(\{module: '([^']+)', frameDomain: '([^']+)', scenario: '([^']+)'\}\),/g)]
    .map(match => Object.freeze({key: match[1], module: match[2], frameDomain: match[3], scenario: match[4]}));
  assert(pages.length > 0 && new Set(pages.map(page => page.key)).size === pages.length, 'unique product module pages');
  for (const page of pages) {
    assert(candidateId.test(page.key), `product module identity: ${page.key}`);
    assert(page.module === `./modules/${page.key}` || /^[.]\/modules\/g678-[a-z0-9-]+$/u.test(page.module),
      `product module path: ${page.key}`);
    assert(page.frameDomain.startsWith('sprite-') && page.scenario.length > 0, `product runtime: ${page.key}`);
  }
  return pages;
}

/** The two reviewed pin shapes, and nothing else, between the map's braces. */
export function serverCandidatePins(server) {
  const start = server.indexOf(SERVER_MAP);
  assert(start >= 0 && server.indexOf(SERVER_MAP, start + 1) < 0, 'one server candidate map');
  const end = server.indexOf('\n});', start);
  assert(end > start, 'server candidate map closure');
  const body = server.slice(start + SERVER_MAP.length, end + 1);
  const census = [...body.matchAll(/^  '(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})':/gm)].map(match => match[1]);
  const shapes = [
    [/  '([^']+)': Object\.freeze\(\{"path":"([^"\\]+)","bytes":(\d+),"sha256":"([0-9a-f]{64})"\}\),\n/y, match => [match[1], match[2], match[3], match[4]]],
    [/  '([^']+)': Object\.freeze\(\{\n    path: '([^'\\]+)',\n    bytes: (\d+), sha256: '([0-9a-f]{64})',\n  \}\),\n/y, match => [match[1], match[2], match[3], match[4]]],
  ];
  const pins = new Map();
  for (let index = 0; index < body.length;) {
    let parsed;
    for (const [shape, fields] of shapes) {
      shape.lastIndex = index;
      const match = shape.exec(body);
      if (match) {parsed = fields(match); index = shape.lastIndex; break;}
    }
    assert(parsed, `reviewed server candidate pin shape at ${index}`);
    const [key, file, bytes, sha256] = parsed;
    assert(candidateId.test(key), `server candidate identity: ${key}`);
    assert(!pins.has(key), `unique server candidate: ${key}`);
    assert(/^catalog\/product-bridge-calibrations\/[a-zA-Z0-9._-]+\.json$/.test(file), `bounded candidate packet path: ${key}`);
    pins.set(key, Object.freeze({path: file, bytes: Number(bytes), sha256}));
  }
  assert.deepEqual([...pins.keys()], census, 'every server candidate key has one reviewed pin');
  assert(pins.size > 0, 'nonempty candidate selection');
  return pins;
}

/** No candidate table, dynamic import or page identity may return to the client. */
export function assertClientDelegates(client) {
  assert.equal(client.split(CLIENT_IMPORT).length, 2, 'client imports the generated candidate module once');
  assert(!/\bimport\(/.test(client), 'client has no dynamic candidate import');
  assert(!/'shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}'/.test(client), 'client names no candidate page');
  assert(!/\bconst (?:CANDIDATE_SOURCES|loadCandidate)\b/.test(client), 'client defines no candidate table or loader');
}

export function renderLoader(sourceRoot) {
  const inputs = [];
  function read(relative) {
    const bytes = fs.readFileSync(path.join(sourceRoot, relative));
    inputs.push({path: relative, bytes: bytes.length, sha256: hash(bytes)});
    return bytes;
  }
  const server = read(SERVER_PATH).toString('utf8');
  const client = read(CLIENT_PATH).toString('utf8');
  const registry = JSON.parse(read('packages/demos/private-current-js-registry.json').toString('utf8'));
  const generatedRegistry = read('packages/demos/src/registry.local-only.generated.ts').toString('utf8');
  // This reviewed bridge derives registered availability from selectedPages;
  // the HFR reader adds only verified HFR siblings, not the whole registry.
  read('apps/web/lib/g678-calibration-product-bridge.server.ts');
  assert.equal(inputs.at(-1).sha256, 'dd86c3e4bc580dc2627f5ba3ff5d75c45826d71373781c16f964c84e4f072d6a',
    'reviewed descriptor selection source; source changes require a successor');
  const bases = registry.calibrations.filter(calibration => calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  assert.equal(bases.length, 1, 'one registry-bound descriptor base');
  const base = bases[0];
  assert.equal(base.deploymentScope, 'local-only', 'local descriptor base');
  assert(/^catalog\/product-bridge-calibrations\/g678-current-js-\d+-page(?:-product-calibrated)?-registration-v\d+\.json$/.test(base.freezeManifest), 'bounded base freeze');
  const freeze = JSON.parse(read(base.freezeManifest).toString('utf8'));
  assert.equal(inputs.at(-1).bytes, base.freezeManifestBytes, 'actual base freeze size');
  assert.equal(inputs.at(-1).sha256, base.freezeManifestSha256, 'actual registry-bound base freeze hash');
  assert.equal(freeze.calibrationId, base.calibrationId, 'base freeze identity');
  assert.equal(freeze.selectedPages.length, base.entries.length, 'base freeze selection cardinality');
  assert.deepEqual(freeze.selectedPages.map(page => page.animationId).sort(), base.entries.map(entry => entry.key).sort(), 'base freeze exact registered selection');
  assertClientDelegates(client);
  const pins = serverCandidatePins(server);
  // Each packet is read only through its exact server pin; it supplies the source
  // and module identities the server reader asserts for the same packet.
  const sources = [];
  for (const [key, pin] of pins) {
    const bytes = read(pin.path);
    assert.equal(bytes.length, pin.bytes, `actual candidate packet size: ${key}`);
    assert.equal(inputs.at(-1).sha256, pin.sha256, `actual candidate packet hash: ${key}`);
    const packet = JSON.parse(bytes.toString('utf8'));
    assert(packet.schemaVersion === 1 && packet.deploymentScope === 'local-only' && packet.entry?.key === key &&
      packet.meta?.key === key && packet.selectedPages?.length === 1 && packet.selectedPages[0]?.animationId === key,
    `exact candidate packet identity: ${key}`);
    assert(/^[0-9a-f]{64}$/.test(packet.source?.sha256) && packet.meta.sourceSha256 === packet.source.sha256, `exact candidate source: ${key}`);
    assert.equal(packet.entry.module, `./modules/${key}`, `exact candidate module: ${key}`);
    assert.equal(packet.entry.artifacts?.module?.path, `packages/demos/src/modules/${key}.tsx`, `exact candidate module artifact: ${key}`);
    sources.push({key, sourceSha256: packet.source.sha256, module: packet.entry.module,
      importPath: `../../../packages/demos/src/${packet.entry.module.slice(2)}`});
  }
  const candidates = sources.map(source => source.key).sort();
  const candidateModules = new Map(sources.map(source => [source.key, source.module]));
  const prefixes = [...new Set(candidates.map(key => key.slice(0, -4)))].sort();
  const registrations = new Map();
  for (const calibration of registry.calibrations) {
    if (calibration.deploymentScope !== 'local-only') continue;
    for (const entry of calibration.entries) {
      assert(!registrations.has(entry.key), `unique local registration: ${entry.key}`);
      registrations.set(entry.key, entry);
    }
  }
  const loaderLines = new Map([...generatedRegistry.matchAll(/^      '([^']+)': (\(\) => import\('([^']+)'\)\.then\(\(\{default: animationModule\}\) => Object\.freeze\(\{\.\.\.animationModule, maturity: '([^']+)' as const\}\)\)),?$/gm)]
    .map(match => [match[1], {expression: match[2], module: match[3], maturity: match[4]}]));
  assert.equal(loaderLines.size, registrations.size, 'all local generated registry loaders recognized');
  for (const [key, entry] of registrations) {
    const loader = loaderLines.get(key);
    assert(loader && loader.module === entry.module && loader.maturity === entry.maturity, `actual generated registration: ${key}`);
  }
  const baseKeys = freeze.selectedPages.filter(page => prefixes.includes(`${page.stableLessonKey}-`)).map(page => page.animationId);
  for (const key of baseKeys) assert(registrations.has(key), `advertised base registration: ${key}`);
  const productPages = productModulePages(server);
  const productByKey = new Map(productPages.map(page => [page.key, page]));
  for (const page of productPages) assert(!candidates.includes(page.key), `product module is not a factory candidate: ${page.key}`);
  const keys = [...new Set(baseKeys.concat(candidates, productPages.map(page => page.key)))].sort();
  const entries = keys.map(key => {
    const registration = registrations.get(key);
    const product = productByKey.get(key);
    if (registration) {
      const loader = loaderLines.get(key);
      assert(/^\.\/modules\/[a-zA-Z0-9_-]+$/.test(loader.module), `exact local module path: ${key}`);
      const importPath = `../../../packages/demos/src/${loader.module.slice(2)}`;
      if (candidateModules.has(key)) assert.equal(candidateModules.get(key), loader.module, `candidate/registry module identity: ${key}`);
      if (product) assert.equal(product.module, loader.module, `product module matches registration: ${key}`);
      return {key, module: loader.module, maturity: loader.maturity, registered: true,
        expression: `() => import('${importPath}').then(({default: animationModule}) => animationModule)`};
    }
    const module = candidateModules.get(key) ?? product?.module;
    assert(module && /^\.\/modules\/[a-zA-Z0-9_-]+$/.test(module), `exact unregistered candidate path: ${key}`);
    return {key, module, registered: false,
      expression: `() => import('../../../packages/demos/src/${module.slice(2)}').then(({default: animationModule}) => animationModule)`};
  });
  const text = [
    '// Generated by scripts/generate-hfr-local-animation-loader-v2.mjs; do not edit.',
    "import type {AnimationModule} from '../../../packages/demos/src/contract';",
    "import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';",
    '',
    'const hfrLocalAnimationModuleLoaders: Readonly<Record<string, () => Promise<AnimationModule>>> =',
    "  process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1'",
    '    ? Object.freeze({})',
    '    : Object.freeze({',
    ...entries.map(entry => `      '${entry.key}': ${entry.expression},`),
    '    });',
    '',
    'export async function loadHfrLocalAnimationModule(key: string): Promise<AnimationModule | undefined> {',
    "  if ((process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1') || !Object.hasOwn(hfrLocalAnimationModuleLoaders, key)) return undefined;",
    '  const registration = localOnlyAnimationModuleRegistration(key);',
    "  if (registration && (registration.deploymentScope !== 'local-only' || registration.scope !== 'private-engineering')) return undefined;",
    '  const animationModule = await hfrLocalAnimationModuleLoaders[key]!();',
    '  // A source mismatch or a registration change during import requires a fresh load.',
    '  if (animationModule?.key !== key || localOnlyAnimationModuleRegistration(key) !== registration) return undefined;',
    '  return registration ? Object.freeze({...animationModule, maturity: registration.maturity}) : animationModule;',
    '}',
    '',
  ].join('\n');
  // Server order is kept, so the client's candidate adapters keep their order.
  const candidateText = [
    '// Generated by scripts/generate-hfr-local-animation-loader-v2.mjs; do not edit.',
    `// One entry per reviewed CANDIDATES packet pin in ${SERVER_PATH}.`,
    "import type {AnimationModule} from '../../../packages/demos/src/contract';",
    '',
    'type HfrLocalCandidateModule = Readonly<{default: AnimationModule}>;',
    '',
    'export const HFR_LOCAL_CANDIDATE_SOURCES: Readonly<Record<string, string>> = Object.freeze({',
    ...sources.map(source => `  '${source.key}': '${source.sourceSha256}',`),
    '});',
    'const hfrLocalCandidateLoaders: Readonly<Record<string, () => Promise<HfrLocalCandidateModule | null>>> = Object.freeze({',
    ...sources.map(source => `  '${source.key}': () => process.env.NODE_ENV === 'development'\n    ? import('${source.importPath}') : Promise.resolve(null),`),
    '});',
    '',
    'export function loadHfrLocalCandidate(animationId: string): Promise<HfrLocalCandidateModule | null> {',
    '  return Object.hasOwn(hfrLocalCandidateLoaders, animationId) ? hfrLocalCandidateLoaders[animationId]!() : Promise.resolve(null);',
    '}',
    '',
  ].join('\n');
  const outputs = [{outputPath: LOADER_PATH, text}, {outputPath: CANDIDATE_MODULE_PATH, text: candidateText}];
  return {outputPath: LOADER_PATH, text, candidateModule: {outputPath: CANDIDATE_MODULE_PATH, text: candidateText}, outputs,
    inputs, candidates, sources, prefixes, baseKeys, entries};
}

// Canonical paths: under a symlinked path (macOS /var, a shadow root) v1's guard is silently false.
if (process.argv[1] && fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const [mode, ...args] = process.argv.slice(2);
  assert(['--write', '--check'].includes(mode), 'expected --write or --check');
  let sourceRoot = repositoryRoot, outputRoot = repositoryRoot;
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index], value = args[index + 1];
    assert(value && ['--source-root', '--output-root'].includes(option), 'bounded path option');
    if (option === '--source-root') sourceRoot = path.resolve(value);
    else outputRoot = path.resolve(value);
  }
  const result = renderLoader(sourceRoot);
  for (const output of result.outputs) {
    const filename = path.join(outputRoot, output.outputPath);
    if (mode === '--check') assert.equal(fs.readFileSync(filename, 'utf8'), output.text, `HFR loader projection drift: ${output.outputPath}`);
    else if (fs.existsSync(filename)) assert.equal(fs.readFileSync(filename, 'utf8'), output.text, `refuse generated loader drift: ${output.outputPath}`);
    else {
      fs.mkdirSync(path.dirname(filename), {recursive: true});
      fs.writeFileSync(filename, output.text, {flag: 'wx'});
    }
  }
  console.log(JSON.stringify({kind: 'hfr-exact-reachable-lesson-loader-v2', mode, inputs: result.inputs,
    candidates: result.candidates, prefixes: result.prefixes, baseKeys: result.baseKeys, registered: result.entries.filter(entry => entry.registered).length,
    entries: result.entries.map(({expression, ...entry}) => entry),
    sources: result.sources.map(({key, sourceSha256, module}) => ({key, sourceSha256, module})),
    outputs: result.outputs.map(output => ({path: output.outputPath, bytes: Buffer.byteLength(output.text), sha256: hash(output.text)}))}));
}
