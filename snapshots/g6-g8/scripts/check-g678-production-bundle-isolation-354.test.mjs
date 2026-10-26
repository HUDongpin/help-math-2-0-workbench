import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile} from
  'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {FINAL354_INPUT_SHA256} from
  './build-g678-calibration-funnel-354.mjs';
import {
  assertFinal354ProductionInputBindings,
  assertExactBuildId,
  assertExactBundleScan,
  assertExactOutputCustody,
  assertExactStableFile,
  assertExpectedInfrastructureProjection,
  assertFreshBuildBoundary,
  assertProductionClosedGuardBindings,
  EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS,
  EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERN_SET_SHA256,
  EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION,
  EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION_SHA256,
  FINAL354_FORBIDDEN_PATTERN_COUNT,
  FINAL354_FORBIDDEN_PATTERN_SET_SHA256,
  FINAL354_PRODUCTION_INPUT_SHA256,
  PRODUCTION_CLOSED_GUARD_SHA256,
  forbiddenPatterns,
  forbiddenPatternSetSha256,
  parseArguments,
  publishReceiptNoReplace,
  readStableBuildId,
  scanProductionBundle,
  validateOutputCustody,
} from './check-g678-production-bundle-isolation-354.mjs';

const ROOT = new URL('../', import.meta.url);

test('final354 production scanner parses only bounded receipt modes', () => {
  assert.deepEqual(parseArguments([
    '--next-root', 'apps/web/.next',
    '--output', 'output/g678-final354-production-isolation.json',
    '--check',
  ]), {nextRoot: 'apps/web/.next',
    output: 'output/g678-final354-production-isolation.json', check: true});
  assert.throws(() => parseArguments(['--check', '--check']), /only once/u);
  assert.throws(() => parseArguments(['--output']), /usage/u);
  assert.throws(() => parseArguments(['--unknown']), /usage/u);
});

test('final354 scanner and report share exact seven immutable inputs', () => {
  assert.deepEqual(FINAL354_PRODUCTION_INPUT_SHA256,
    FINAL354_INPUT_SHA256);
  const paths = {
    freeze:
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json',
    fragment:
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json',
    privateRegistry: 'packages/demos/private-current-js-registry.json',
    family:
      'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json',
    focusedBrowser:
      'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json',
    aggregateBrowser:
      'output/playwright/g678-current-js-354-v1/evidence.json',
    successorCompatibility:
      'catalog/g678-final342-current-bridge-successor-compatibility-v1.json',
  };
  const bindings = Object.fromEntries(Object.entries(paths).map(
    ([key, path]) => [key, {binding: {path,
      sha256: FINAL354_PRODUCTION_INPUT_SHA256[key]}}]));
  assert.equal(assertFinal354ProductionInputBindings(bindings), true);
  assert.throws(() => assertFinal354ProductionInputBindings({...bindings,
    aggregateBrowser: {binding: {...bindings.aggregateBrowser.binding,
      sha256: '0'.repeat(64)}}}),
  /final354 production aggregateBrowser binding drifted/u);
});

test('final354 production pattern set is exact and source-derived',
  async () => {
    const freeze = JSON.parse(await readFile(new URL(
      'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json',
      ROOT), 'utf8'));
    const patterns = forbiddenPatterns(freeze);
    assert.equal(patterns.length, FINAL354_FORBIDDEN_PATTERN_COUNT);
    assert.equal(forbiddenPatternSetSha256(patterns),
      FINAL354_FORBIDDEN_PATTERN_SET_SHA256);
    for (const required of [
      'g678-current-js-354-page-product-calibrated-registration-v1.json',
      'g678-alg-l11-tranche1-family-calibration-v1.json',
      'private-source-static-alg-l11-intro-terminal-candidate',
      'private-source-static-alg-l11-simple-glossary-candidate',
    ]) assert.equal(patterns.includes(required), true, required);
    for (const permittedGenericProductionMarker of [
      '/migration-status/g678-calibration/',
      '/flash-assets/g678-local/',
      'g678-16-page-product-calibration-v1',
    ]) assert.equal(patterns.includes(permittedGenericProductionMarker),
      false, permittedGenericProductionMarker);
    const representative = freeze.selectedPages.find((page) =>
      page.animationId === 'shared-alg001-l11-p001');
    assert.ok(representative);
    for (const specific of [representative.animationId,
      representative.assetId, representative.sourceSha256,
      representative.adapterFamily,
      representative.runtime.canvasRenderer.path,
      representative.runtime.canvasRenderer.sha256,
      representative.runtime.canvasRenderer.url]) {
      assert.equal(patterns.includes(specific), true, specific);
    }
    for (const page of freeze.selectedPages) {
      assert.equal(patterns.includes(page.animationId), true);
      assert.equal(patterns.includes(page.sourceSha256), true);
      assert.equal(patterns.includes(page.runtime.canvasRenderer.path), true);
      assert.equal(patterns.includes(page.runtime.canvasRenderer.sha256), true);
      assert.equal(patterns.includes(page.runtime.canvasRenderer.url), true);
    }
    for (const digest of Object.values(FINAL354_PRODUCTION_INPUT_SHA256)) {
      assert.equal(patterns.includes(digest), true);
    }
    assert.throws(() => forbiddenPatterns({...freeze,
      selectedPages: freeze.selectedPages.slice(1)}),
    /forbidden-pattern source freeze drifted/u);
    assert.throws(() => forbiddenPatternSetSha256([...patterns, patterns[0]]),
      /exact sorted unique/u);
  });

const EXACT_INFRASTRUCTURE_MATCHES = Object.freeze([
  {file:
    'server/app/[locale]/migration-status/g678-calibration/[placementId]/page_client-reference-manifest.js',
  pattern: '/migration-status/g678-calibration/'},
  {file:
    'server/app/[locale]/migration-status/g678-calibration/[placementId]/page.js',
  pattern: '/migration-status/g678-calibration/'},
  {file: 'server/app-paths-manifest.json',
    pattern: '/migration-status/g678-calibration/'},
  {file: 'server/server-reference-manifest.js',
    pattern: '/migration-status/g678-calibration/'},
  {file: 'server/server-reference-manifest.json',
    pattern: '/migration-status/g678-calibration/'},
  {file:
    'server/app/flash-assets/g678-local/[animationId]/canvas-renderer.js/route_client-reference-manifest.js',
  pattern: '/flash-assets/g678-local/'},
  {file:
    'server/app/flash-assets/g678-local/[animationId]/canvas-renderer.js/route.js',
  pattern: '/flash-assets/g678-local/'},
  {file: 'server/app-paths-manifest.json',
    pattern: '/flash-assets/g678-local/'},
  {file: 'server/chunks/9350.js',
    pattern: 'g678-16-page-product-calibration-v1'},
]);

test('final354 infrastructure permits only exact production-closed pairs',
  () => {
    assert.equal(forbiddenPatternSetSha256(
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERNS),
    EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PATTERN_SET_SHA256);
    const result = assertExpectedInfrastructureProjection(
      EXACT_INFRASTRUCTURE_MATCHES);
    assert.deepEqual(result.projection,
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION);
    assert.deepEqual(result.distribution,
      {migration: 5, asset: 3, calibrationId: 1});
    assert.equal(result.staticHitCount, 0);
    const projectionBytes = Buffer.from(`${JSON.stringify(
      result.projection)}\n`);
    const digest = createHash('sha256').update(projectionBytes).digest('hex');
    assert.equal(digest,
      EXPECTED_FAIL_CLOSED_INFRASTRUCTURE_PROJECTION_SHA256);
    assert.throws(() => assertExpectedInfrastructureProjection(
      EXACT_INFRASTRUCTURE_MATCHES.slice(1)), /missing extra or drifted/u);
    assert.throws(() => assertExpectedInfrastructureProjection([
      ...EXACT_INFRASTRUCTURE_MATCHES, EXACT_INFRASTRUCTURE_MATCHES[0]]),
    /missing extra or drifted/u);
    assert.throws(() => assertExpectedInfrastructureProjection(
      EXACT_INFRASTRUCTURE_MATCHES.map((match, index) => index === 0
        ? {...match, file: 'server/unexpected.js'} : match)),
    /unexpected file or static/u);
    assert.throws(() => assertExpectedInfrastructureProjection(
      EXACT_INFRASTRUCTURE_MATCHES.map((match, index) => index === 0
        ? {...match, file: 'static/unexpected.js'} : match)),
    /unexpected file or static/u);
  });

test('final354 scanner binds exact production-closed guard sources',
  async () => {
    const paths = {
      registryStub:
        'apps/web/lib/g678-local-only-registry.production-stub.ts',
      serverBridge:
        'apps/web/lib/g678-calibration-product-bridge.server.ts',
      boundaryTest:
        'apps/web/tests/g678-production-closed-boundary.test.ts',
      routeGuardTest: 'apps/web/tests/g678-preview-policy.test.ts',
    };
    const guards = Object.fromEntries(await Promise.all(Object.entries(paths)
      .map(async ([key, file]) => [key, {bytes: await readFile(new URL(file,
        ROOT)), binding: {path: file,
        sha256: PRODUCTION_CLOSED_GUARD_SHA256[key]}}])));
    assert.equal(assertProductionClosedGuardBindings(guards), true);
    const {boundaryTest: _missing, ...missing} = guards;
    assert.throws(() => assertProductionClosedGuardBindings(missing),
      /guard binding set drifted/u);
    assert.throws(() => assertProductionClosedGuardBindings({...guards,
      extra: guards.registryStub}), /guard binding set drifted/u);
    assert.throws(() => assertProductionClosedGuardBindings({...guards,
      routeGuardTest: {...guards.routeGuardTest, binding: {
        ...guards.routeGuardTest.binding, path: 'apps/web/tests/wrong.ts'}}}),
    /routeGuardTest binding drifted/u);
  });

test('final354 production build must be newer than every bound input', () => {
  const inputs = Array.from({length: 9}, (_, index) =>
    ({mtimeNs: BigInt(index + 1)}));
  assert.deepEqual(assertFreshBuildBoundary(inputs, {mtimeNs: 10n}), {
    latestBoundInputMtimeNs: '9',
    buildIdMtimeNs: '10',
    freshBuildAfterAllFinalInputs: true,
  });
  assert.throws(() => assertFreshBuildBoundary(inputs, {mtimeNs: 9n}),
    /BUILD_ID is not fresh/u);
  assert.throws(() => assertFreshBuildBoundary(inputs.slice(1),
    {mtimeNs: 10n}), /boundary inputs drifted/u);
});

test('final354 output custody rejects Next roots and aliases before writes',
  async (context) => {
    const projectRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
      'g678-final354-output-custody-')));
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    await mkdir(path.join(projectRoot, 'apps/web/.next/server'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'apps/web/.next/static'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'output'), {recursive: true});
    await symlink(path.join(projectRoot, 'apps/web/.next/server'),
      path.join(projectRoot, 'receipt-alias'));
    const directServer = 'apps/web/.next/server/receipt.json';
    const directStatic = 'apps/web/.next/static/receipt.json';
    const lexicalAlias = 'output/../apps/web/.next/server/receipt.json';
    const symlinkAlias = 'receipt-alias/receipt.json';
    for (const output of [directServer, directStatic, lexicalAlias,
      symlinkAlias]) {
      for (const check of [false, true]) {
        await assert.rejects(() => validateOutputCustody({projectRoot,
          nextRoot: 'apps/web/.next', output, check}),
        /outside the Next build root|canonical real directory/u);
      }
    }
    for (const output of [directServer, directStatic, lexicalAlias,
      symlinkAlias]) {
      await assert.rejects(() => readFile(path.resolve(projectRoot, output)),
        {code: 'ENOENT'});
    }
  });

test('final354 output custody rejects target and parent symlink aliases',
  async (context) => {
    const projectRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
      'g678-final354-output-symlink-')));
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    await mkdir(path.join(projectRoot, 'apps/web/.next/server'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'apps/web/.next/static'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'real-output'), {recursive: true});
    await symlink(path.join(projectRoot, 'real-output'),
      path.join(projectRoot, 'output-alias'));
    await writeFile(path.join(projectRoot, 'real-output/real.json'), '{}\n');
    await symlink(path.join(projectRoot, 'real-output/real.json'),
      path.join(projectRoot, 'real-output/target-alias.json'));
    await assert.rejects(() => validateOutputCustody({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output-alias/receipt.json',
      check: false}), /canonical real directory/u);
    await assert.rejects(() => validateOutputCustody({projectRoot,
      nextRoot: 'apps/web/.next',
      output: 'real-output/target-alias.json', check: true}),
    /ordinary single-link file/u);
    assert.equal(await readFile(path.join(projectRoot,
      'real-output/real.json'), 'utf8'), '{}\n');
  });

test('final354 output custody accepts one canonical target outside Next',
  async (context) => {
    const projectRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
      'g678-final354-output-positive-')));
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    await mkdir(path.join(projectRoot, 'apps/web/.next/server'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'apps/web/.next/static'),
      {recursive: true});
    await mkdir(path.join(projectRoot, 'output'), {recursive: true});
    const build = await validateOutputCustody({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output/receipt.json', check: false});
    assert.equal(build.output, path.join(projectRoot, 'output/receipt.json'));
    const published = await publishReceiptNoReplace({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output/receipt.json',
      receiptBytes: Buffer.from('{}\n'), expectedCustody: build});
    assert.equal(published.bytes.toString('utf8'), '{}\n');
    const check = await validateOutputCustody({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output/receipt.json', check: true});
    assert.equal(check.output, build.output);
  });

async function makeIdentityFixture(prefix, check) {
  const projectRoot = await realpath(await mkdtemp(path.join(os.tmpdir(),
    prefix)));
  await mkdir(path.join(projectRoot, 'apps/web/.next/server'),
    {recursive: true});
  await mkdir(path.join(projectRoot, 'apps/web/.next/static'),
    {recursive: true});
  await writeFile(path.join(projectRoot, 'apps/web/.next/BUILD_ID'),
    'build-one\n');
  await mkdir(path.join(projectRoot, 'output'), {recursive: true});
  if (check) await writeFile(path.join(projectRoot, 'output/receipt.json'),
    '{}\n');
  return projectRoot;
}

test('final354 custody rejects ordinary Next replacement in build and check',
  async (context) => {
    for (const check of [false, true]) {
      const projectRoot = await makeIdentityFixture(
        `g678-final354-next-replace-${check}-`, check);
      context.after(() => rm(projectRoot, {recursive: true, force: true}));
      const initial = await validateOutputCustody({projectRoot,
        nextRoot: 'apps/web/.next', output: 'output/receipt.json', check});
      await rename(path.join(projectRoot, 'apps/web/.next'),
        path.join(projectRoot, 'apps/web/.next-old'));
      await mkdir(path.join(projectRoot, 'apps/web/.next/server'),
        {recursive: true});
      await mkdir(path.join(projectRoot, 'apps/web/.next/static'),
        {recursive: true});
      await writeFile(path.join(projectRoot, 'apps/web/.next/BUILD_ID'),
        'build-one\n');
      const replaced = await validateOutputCustody({projectRoot,
        nextRoot: 'apps/web/.next', output: 'output/receipt.json', check});
      assert.throws(() => assertExactOutputCustody(initial, replaced),
        /custody identity changed/u);
    }
  });

test('final354 custody rejects ordinary parent replacement in build and check',
  async (context) => {
    for (const check of [false, true]) {
      const projectRoot = await makeIdentityFixture(
        `g678-final354-parent-replace-${check}-`, check);
      context.after(() => rm(projectRoot, {recursive: true, force: true}));
      const initial = await validateOutputCustody({projectRoot,
        nextRoot: 'apps/web/.next', output: 'output/receipt.json', check});
      await rename(path.join(projectRoot, 'output'),
        path.join(projectRoot, 'output-old'));
      await mkdir(path.join(projectRoot, 'output'));
      if (check) await writeFile(path.join(projectRoot,
        'output/receipt.json'), '{}\n');
      const replaced = await validateOutputCustody({projectRoot,
        nextRoot: 'apps/web/.next', output: 'output/receipt.json', check});
      assert.throws(() => assertExactOutputCustody(initial, replaced),
        /custody identity changed/u);
    }
  });

test('final354 publication never writes receipt bytes through swapped parent',
  async (context) => {
    const projectRoot = await makeIdentityFixture(
      'g678-final354-parent-swap-', false);
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    const nextServer = path.join(projectRoot, 'apps/web/.next/server');
    const receiptBytes = Buffer.from('{"secret":"receipt-material"}\n');
    await assert.rejects(() => publishReceiptNoReplace({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output/receipt.json', receiptBytes,
      hooks: {afterFinalCustody: async () => {
        await rename(path.join(projectRoot, 'output'),
          path.join(projectRoot, 'output-old'));
        await symlink(nextServer, path.join(projectRoot, 'output'));
      }}}), /canonical real directory|opened production receipt/u);
    await assert.rejects(() => readFile(path.join(nextServer, 'receipt.json')),
      {code: 'ENOENT'});
    assert.equal((await readFile(path.join(projectRoot,
      'apps/web/.next/BUILD_ID'), 'utf8')), 'build-one\n');
  });

test('final354 publication rejects post-open target symlink swap',
  async (context) => {
    const projectRoot = await makeIdentityFixture(
      'g678-final354-target-swap-', false);
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    const sentinel = path.join(projectRoot, 'apps/web/.next/server/sentinel');
    await writeFile(sentinel, 'unchanged\n');
    const receiptBytes = Buffer.from('{"receipt":true}\n');
    await assert.rejects(() => publishReceiptNoReplace({projectRoot,
      nextRoot: 'apps/web/.next', output: 'output/receipt.json', receiptBytes,
      hooks: {afterOpenValidation: async ({custody}) => {
        await rename(custody.output, `${custody.output}.created`);
        await symlink(sentinel, custody.output);
      }}}), /opened production receipt target custody drifted/u);
    assert.equal(await readFile(sentinel, 'utf8'), 'unchanged\n');
    assert.equal((await readFile(path.join(projectRoot,
      'output/receipt.json.created'))).length, 0);
  });

test('final354 stable BUILD_ID and bundle double scan reject drift',
  async (context) => {
    const projectRoot = await makeIdentityFixture(
      'g678-final354-build-drift-', false);
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    const nextRoot = path.join(projectRoot, 'apps/web/.next');
    await writeFile(path.join(nextRoot, 'server/app.js'), 'safe-one\n');
    await writeFile(path.join(nextRoot, 'static/app.js'), 'safe-two\n');
    const initialBuildId = await readStableBuildId(nextRoot, projectRoot);
    await writeFile(path.join(nextRoot, 'BUILD_ID'), 'build-two\n');
    const changedBuildId = await readStableBuildId(nextRoot, projectRoot);
    assert.throws(() => assertExactBuildId(initialBuildId, changedBuildId),
      /BUILD_ID changed/u);
    const initialScan = await scanProductionBundle(nextRoot,
      ['never-present'], {relativeRoot: projectRoot});
    await writeFile(path.join(nextRoot, 'server/new.js'), 'new-file\n');
    const changedScan = await scanProductionBundle(nextRoot,
      ['never-present'], {relativeRoot: projectRoot});
    assert.throws(() => assertExactBundleScan(initialScan, changedScan),
      /identity or content changed/u);
    const original = {bytes: Buffer.from('same'),
      identity: {dev: '1', ino: '2', size: '4', mtimeNs: '3'},
      binding: {path: 'input', bytes: 4, sha256: 'a'}};
    assert.equal(assertExactStableFile(original, {...original}, 'fixture'),
      true);
    assert.throws(() => assertExactStableFile(original, {...original,
      identity: {...original.identity, ino: '9'}}, 'fixture'),
    /fixture identity or content changed/u);
  });

test('final354 scan rejects server root replacement during one pass',
  async (context) => {
    const projectRoot = await makeIdentityFixture(
      'g678-final354-root-scan-drift-', false);
    context.after(() => rm(projectRoot, {recursive: true, force: true}));
    const nextRoot = path.join(projectRoot, 'apps/web/.next');
    await writeFile(path.join(nextRoot, 'server/app.js'), 'safe\n');
    await assert.rejects(() => scanProductionBundle(nextRoot,
      ['never-present'], {relativeRoot: projectRoot,
        hooks: {afterRootIdentity: async () => {
          await rename(path.join(nextRoot, 'server'),
            path.join(nextRoot, 'server-old'));
          await mkdir(path.join(nextRoot, 'server'));
          await writeFile(path.join(nextRoot, 'server/app.js'), 'safe\n');
        }}}), /root identity changed/u);
  });

test('final354 production receipt binds scanner inputs build hashes and gates',
  async () => {
    const source = await readFile(new URL(
      './check-g678-production-bundle-isolation-354.mjs', import.meta.url),
    'utf8');
    assert.match(source, /scanner: scanner\.binding/u);
    assert.match(source, /finalInputs:/u);
    assert.match(source, /calibrationReport: reportFile\.binding/u);
    assert.match(source, /buildIdFile: buildIdInitial\.file\.binding/u);
    assert.match(source, /buildIdIdentity: buildIdInitial\.file\.identity/u);
    assert.match(source, /checksumSetSha256/u);
    assert.match(source, /forbiddenPatternSetSha256/u);
    assert.match(source, /matchCount: 0/u);
    assert.match(source, /localOnlyG678MaterialAbsent: true/u);
    assert.match(source, /overallG678ProductCalibrationPassed: false/u);
    assert.match(source, /final354 production isolation receipt drifted/u);
    assert.match(source, /const initialCustody = await validateOutputCustody/u);
    assert.match(source, /const finalCustody = await validateOutputCustody/u);
    assert.match(source, /assertExactBundleScan\(initialScan, finalScan\)/u);
    assert.match(source, /assertExactBuildId\(buildIdInitial, buildIdFinal\)/u);
    assert.match(source, /publishReceiptNoReplace/u);
    for (const field of ['authoritativeOriginalRuntime', 'behaviorAccepted',
      'visualFidelityAccepted', 'audioAccepted', 'humanVisualAccepted',
      'ownerAccepted', 'strictComplete', 'releaseEligible', 'released',
      'published']) {
      assert.match(source, new RegExp(`${field}: false`, 'u'));
    }
  });
