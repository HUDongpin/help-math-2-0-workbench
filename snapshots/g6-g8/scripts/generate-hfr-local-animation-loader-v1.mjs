/** Preserve every registered navigation target of the existing HFR lessons.
 * Read the exact maintained candidate paths and actual registry paths; no
 * guessed module names, registry edits, availability edits, or global fallback. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function renderLoader(sourceRoot) {
  const inputs = [];
  function read(relative) {
    const bytes = fs.readFileSync(path.join(sourceRoot, relative));
    inputs.push({path: relative, bytes: bytes.length, sha256: hash(bytes)});
    return bytes.toString('utf8');
  }
  const client = read('apps/web/components/hfr-local-lesson.tsx');
  const server = read('apps/web/lib/hfr-local-pages.server.ts');
  const registry = JSON.parse(read('packages/demos/private-current-js-registry.json'));
  const generatedRegistry = read('packages/demos/src/registry.local-only.generated.ts');
  // This reviewed bridge derives registered availability from selectedPages;
  // the HFR reader adds only verified HFR siblings, not the whole registry.
  read('apps/web/lib/g678-calibration-product-bridge.server.ts');
  assert.equal(inputs.at(-1).sha256, '69af8afea0fb9aa341505eead2542543357f175d900b03457d5d31c41541e7e6',
    'reviewed descriptor selection source; source changes require a successor');
  const bases = registry.calibrations.filter(calibration => calibration.calibrationId === 'g678-16-page-product-calibration-v1');
  assert.equal(bases.length, 1, 'one registry-bound descriptor base');
  const base = bases[0];
  assert.equal(base.deploymentScope, 'local-only', 'local descriptor base');
  assert(/^catalog\/product-bridge-calibrations\/g678-current-js-\d+-page(?:-product-calibrated)?-registration-v\d+\.json$/.test(base.freezeManifest), 'bounded base freeze');
  const freeze = JSON.parse(read(base.freezeManifest));
  assert.equal(inputs.at(-1).bytes, base.freezeManifestBytes, 'actual base freeze size');
  assert.equal(inputs.at(-1).sha256, base.freezeManifestSha256, 'actual registry-bound base freeze hash');
  assert.equal(freeze.calibrationId, base.calibrationId, 'base freeze identity');
  assert.equal(freeze.selectedPages.length, base.entries.length, 'base freeze selection cardinality');
  assert.deepEqual(freeze.selectedPages.map(page => page.animationId).sort(), base.entries.map(entry => entry.key).sort(), 'base freeze exact registered selection');
  function frozenKeys(source, marker) {
    const start = source.indexOf(marker);
    assert(start >= 0, `candidate map: ${marker}`);
    const end = source.indexOf('\n});', start);
    assert(end >= 0, 'candidate map closure');
    return [...source.slice(start, end).matchAll(/^  '(shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3})':/gm)].map(match => match[1]).sort();
  }
  const candidates = frozenKeys(client, 'const CANDIDATE_SOURCES = Object.freeze({');
  assert(candidates.length > 0, 'nonempty candidate selection');
  assert.equal(new Set(candidates).size, candidates.length, 'unique candidates');
  assert.deepEqual(frozenKeys(server, 'const CANDIDATES:'), candidates, 'same client/server HFR source selection');
  const prefixes = [...new Set(candidates.map(key => key.slice(0, -4)))].sort();
  const candidateFunction = client.slice(client.indexOf('const loadCandidate = '), client.indexOf('\nfunction CandidateRuntime'));
  const candidatePaths = new Map([...candidateFunction.matchAll(/if \(animationId === '([^']+)'\) return process\.env\.NODE_ENV === 'development'\n    \? import\('([^']+)'\) : Promise\.resolve\(null\);/g)].map(match => [match[1], match[2]]));
  assert.deepEqual([...candidatePaths.keys()].sort(), candidates, 'all exact candidate import paths');
  assert.equal([...candidateFunction.matchAll(/import\(/g)].length, candidates.length, 'no unmatched candidate imports');
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
  const keys = [...new Set(baseKeys.concat(candidates))].sort();
  const entries = keys.map(key => {
    const registration = registrations.get(key);
    if (registration) {
      const loader = loaderLines.get(key);
      assert(/^\.\/modules\/[a-zA-Z0-9_-]+$/.test(loader.module), `exact local module path: ${key}`);
      const importPath = `../../../packages/demos/src/${loader.module.slice(2)}`;
      if (candidatePaths.has(key)) assert.equal(candidatePaths.get(key), importPath, `candidate/registry module identity: ${key}`);
      return {key, module: loader.module, maturity: loader.maturity, registered: true,
        expression: `() => import('${importPath}').then(({default: animationModule}) => animationModule)`};
    }
    const importPath = candidatePaths.get(key);
    assert(importPath && /^\.\.\/\.\.\/\.\.\/packages\/demos\/src\/modules\/[a-zA-Z0-9_-]+$/.test(importPath), `exact unregistered candidate path: ${key}`);
    return {key, module: `./${importPath.split('/src/')[1]}`, registered: false,
      expression: `() => import('${importPath}').then(({default: animationModule}) => animationModule)`};
  });
  const outputPath = 'apps/web/lib/hfr-local-animation-loader-v1.generated.ts';
  const text = [
    '// Generated by scripts/generate-hfr-local-animation-loader-v1.mjs; do not edit.',
    "import type {AnimationModule} from '../../../packages/demos/src/contract';",
    "import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';",
    '',
    'const hfrLocalAnimationModuleLoaders: Readonly<Record<string, () => Promise<AnimationModule>>> =',
    "  process.env.NODE_ENV === 'production'",
    '    ? Object.freeze({})',
    '    : Object.freeze({',
    ...entries.map(entry => `      '${entry.key}': ${entry.expression},`),
    '    });',
    '',
    'export async function loadHfrLocalAnimationModule(key: string): Promise<AnimationModule | undefined> {',
    "  if (process.env.NODE_ENV === 'production' || !Object.hasOwn(hfrLocalAnimationModuleLoaders, key)) return undefined;",
    '  const registration = localOnlyAnimationModuleRegistration(key);',
    "  if (registration && (registration.deploymentScope !== 'local-only' || registration.scope !== 'private-engineering')) return undefined;",
    '  const animationModule = await hfrLocalAnimationModuleLoaders[key]!();',
    '  // A source mismatch or a registration change during import requires a fresh load.',
    '  if (animationModule?.key !== key || localOnlyAnimationModuleRegistration(key) !== registration) return undefined;',
    '  return registration ? Object.freeze({...animationModule, maturity: registration.maturity}) : animationModule;',
    '}',
    '',
  ].join('\n');
  return {outputPath, text, inputs, candidates, prefixes, baseKeys, entries};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
  const filename = path.join(outputRoot, result.outputPath);
  if (mode === '--check') assert.equal(fs.readFileSync(filename, 'utf8'), result.text, 'HFR loader projection drift');
  else if (fs.existsSync(filename)) assert.equal(fs.readFileSync(filename, 'utf8'), result.text, 'refuse generated loader drift');
  else {
    fs.mkdirSync(path.dirname(filename), {recursive: true});
    fs.writeFileSync(filename, result.text, {flag: 'wx'});
  }
  console.log(JSON.stringify({kind: 'hfr-exact-reachable-lesson-loader-v1', mode, inputs: result.inputs,
    candidates: result.candidates, prefixes: result.prefixes, baseKeys: result.baseKeys, registered: result.entries.filter(entry => entry.registered).length,
    entries: result.entries.map(({expression, ...entry}) => entry),
    output: {path: result.outputPath, bytes: Buffer.byteLength(result.text), sha256: hash(result.text)}}));
}
