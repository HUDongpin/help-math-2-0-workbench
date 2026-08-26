import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');
const CONTRACT_PATH = path.join(
  REPO_ROOT,
  'catalog/launch-control/hosted-workbench-tests.v1.json',
);

export const MANDATORY_HOSTED_TEST_FILES = Object.freeze([
  'lib/conversion11Timeline.test.mjs',
  'lib/conversion13Timeline.test.mjs',
  'lib/conversionTimeline.test.mjs',
  'scripts/build-lesson-release-ledger.test.mjs',
  'scripts/build-page-only-migration-control-ledger.test.mjs',
  'scripts/build-public-launch-manifest.test.mjs',
  'scripts/completion-ledger.test.mjs',
  'scripts/evidence-projections.test.mjs',
  'scripts/freeze-help-math-sources.test.mjs',
  'scripts/prepare-linked-worktree-generated-inputs.test.mjs',
  'scripts/prepare-linked-worktree-sources.test.mjs',
  'scripts/register-worktree-shared-dependencies.test.mjs',
  'scripts/run-worktree-typecheck.test.mjs',
  'scripts/verify-deploy-closure.test.mjs',
  'scripts/verify-launch-control.test.mjs',
  'scripts/verify-npm-install-script-policy.test.mjs',
  'scripts/verify-site-runtime-log.test.mjs',
  'scripts/workbench-tools.test.mjs',
]);

export const MANDATORY_CATALOG_HOSTED_TEST_NAMES = Object.freeze([
  'builds deterministic placement, duplicate, reference, audio, and FLA inventories',
  'classifies legacy compound and compressed ZIP FLA containers',
  'loads only a hash-bound, real, single-link current-source profile',
  'parses uncompressed and zlib-compressed SWF movie metadata',
  'the checked-in full-archive catalog records the evidence-grounded known totals',
]);

export const CATALOG_FULL_LOCAL_ONLY_TEST_NAMES = Object.freeze([
  'binds the canonical G5 L2 source promotion to its exact two-page gap',
  'binds the canonical G5 L3 source promotion to the reviewed 43-file copy set',
  'binds the canonical G5 L6 source promotion to its exact thirteen-page gap',
  'binds the current G5 L4 FQ source profile to the approved historical source-only transaction',
]);

const MIXED_CATALOG_TEST_FILE = 'scripts/build-help-math-catalog.test.mjs';

const EXPECTED_NODE_ARGUMENTS = Object.freeze([
  '--import',
  './scripts/register-worktree-shared-dependencies.mjs',
  '--import',
  'tsx',
  '--test',
  '--test-concurrency=4',
  '--test-reporter=tap',
]);

const EXPECTED_FULL_LOCAL_COMMAND =
  'node --import ./scripts/register-worktree-shared-dependencies.mjs --test --test-concurrency=4 lib/*.test.mjs scripts/*.test.mjs';

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sortedUnique(values, label) {
  invariant(Array.isArray(values), `${label} must be an array`);
  invariant(values.every((value) => typeof value === 'string'), `${label} must contain strings`);
  const sorted = [...values].sort();
  invariant(new Set(values).size === values.length, `${label} must not contain duplicates`);
  invariant(
    values.every((value, index) => value === sorted[index]),
    `${label} must use deterministic sorted order`,
  );
  return sorted;
}

export function hashPathSet(paths) {
  return createHash('sha256').update(Buffer.from(`${paths.join('\0')}\0`)).digest('hex');
}

export function pathSetEncodedByteLength(paths) {
  return Buffer.byteLength(`${paths.join('\0')}\0`);
}

export function discoverFullLocalTests(repoRoot = REPO_ROOT) {
  const result = [];
  for (const directory of ['lib', 'scripts']) {
    const absoluteDirectory = path.join(repoRoot, directory);
    for (const entry of readdirSync(absoluteDirectory, {withFileTypes: true})) {
      if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
        result.push(`${directory}/${entry.name}`);
      }
    }
  }
  return result.sort();
}

export function validateHostedWorkbenchContract({
  contract,
  repoRoot = REPO_ROOT,
  packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')),
} = {}) {
  invariant(isPlainObject(contract), 'hosted workbench contract must be an object');
  invariant(contract.schemaVersion === 1, 'hosted workbench schemaVersion must equal 1');
  invariant(
    contract.releaseId === 'HELP_MATH_2_PUBLIC_LAUNCH_V1',
    'hosted workbench releaseId mismatch',
  );
  invariant(
    contract.pathSetEncoding === 'sorted-utf8-nul-terminated',
    'hosted workbench path-set encoding must remain unambiguous',
  );
  invariant(
    contract.fullLocalCommand === EXPECTED_FULL_LOCAL_COMMAND,
    'hosted contract must preserve the exact full-local command',
  );
  invariant(
    packageJson?.scripts?.test === EXPECTED_FULL_LOCAL_COMMAND,
    'package.json npm test must preserve the full local evidence suite',
  );

  invariant(isPlainObject(contract.fullLocalDiscovery), 'fullLocalDiscovery must be an object');
  invariant(isPlainObject(contract.fullyHostedProfile), 'fullyHostedProfile must be an object');
  invariant(
    Array.isArray(contract.mixedHostedProfiles) && contract.mixedHostedProfiles.length === 1,
    'exactly one mixed Hosted profile is required',
  );
  invariant(
    isPlainObject(contract.notYetHostedClassifiedRemainder),
    'notYetHostedClassifiedRemainder must be an object',
  );
  invariant(
    JSON.stringify(contract.fullLocalDiscovery.directories) === JSON.stringify(['lib', 'scripts']),
    'fullLocalDiscovery directories must remain lib and scripts',
  );
  invariant(contract.fullLocalDiscovery.suffix === '.test.mjs', 'test suffix must remain .test.mjs');

  const allFiles = discoverFullLocalTests(repoRoot);
  const hostedFiles = sortedUnique(
    contract.fullyHostedProfile.testFiles,
    'fullyHostedProfile.testFiles',
  );
  const mixedProfile = contract.mixedHostedProfiles[0];
  invariant(isPlainObject(mixedProfile), 'mixed Hosted profile must be an object');
  invariant(mixedProfile.testFile === MIXED_CATALOG_TEST_FILE, 'mixed Hosted test file drifted');
  const selectedCatalogNames = sortedUnique(
    mixedProfile.selectedTestNames,
    'mixedHostedProfiles[0].selectedTestNames',
  );
  const fullLocalCatalogNames = sortedUnique(
    mixedProfile.fullLocalOnlyTestNames,
    'mixedHostedProfiles[0].fullLocalOnlyTestNames',
  );
  invariant(
    JSON.stringify(selectedCatalogNames) ===
      JSON.stringify(MANDATORY_CATALOG_HOSTED_TEST_NAMES),
    'mixed catalog Hosted test-name set drifted',
  );
  invariant(
    JSON.stringify(fullLocalCatalogNames) ===
      JSON.stringify(CATALOG_FULL_LOCAL_ONLY_TEST_NAMES),
    'mixed catalog full-local-only test-name set drifted',
  );

  const hostedReferencedFiles = [...hostedFiles, mixedProfile.testFile].sort();
  const hostedSet = new Set(hostedReferencedFiles);
  const excludedFiles = allFiles.filter((file) => !hostedSet.has(file));

  invariant(
    JSON.stringify(contract.fullyHostedProfile.nodeArguments) ===
      JSON.stringify(EXPECTED_NODE_ARGUMENTS),
    'hosted node arguments must remain pinned',
  );
  invariant(
    hostedFiles.length >= MANDATORY_HOSTED_TEST_FILES.length,
    'hosted test allowlist cannot shrink below the mandatory baseline',
  );
  for (const requiredFile of MANDATORY_HOSTED_TEST_FILES) {
    invariant(hostedSet.has(requiredFile), `mandatory Hosted test is missing: ${requiredFile}`);
  }
  for (const file of hostedReferencedFiles) {
    invariant(allFiles.includes(file), `Hosted test is outside full-local discovery: ${file}`);
    invariant(statSync(path.join(repoRoot, file)).isFile(), `Hosted test is not a regular file: ${file}`);
  }

  invariant(
    contract.fullyHostedProfile.expectedTestCount === 157 &&
      contract.fullyHostedProfile.expectedPassCount === 157 &&
      contract.fullyHostedProfile.expectedSkipCount === 0,
    'fully Hosted capability floor drifted',
  );
  invariant(
    mixedProfile.expectedTestCount === 5 &&
      mixedProfile.expectedPassCount === 5 &&
      mixedProfile.expectedSkipCount === 0,
    'mixed catalog capability floor drifted',
  );
  invariant(
    typeof mixedProfile.boundary === 'string' &&
      mixedProfile.boundary.includes('not counted as Hosted PASS'),
    'mixed catalog boundary must deny Hosted PASS for full-local-only cases',
  );

  const measurements = [
    ['fullLocalDiscovery', allFiles, contract.fullLocalDiscovery],
    ['fullyHostedProfile', hostedFiles, contract.fullyHostedProfile],
    [
      'notYetHostedClassifiedRemainder',
      excludedFiles,
      contract.notYetHostedClassifiedRemainder,
    ],
  ];
  for (const [label, files, expected] of measurements) {
    invariant(expected.fileCount === files.length, `${label}.fileCount drifted`);
    invariant(
      expected.encodedByteLength === pathSetEncodedByteLength(files),
      `${label}.encodedByteLength drifted`,
    );
    invariant(
      expected.sortedPathSetSha256 === hashPathSet(files),
      `${label}.sortedPathSetSha256 drifted`,
    );
  }

  invariant(
    contract.notYetHostedClassifiedRemainder.classificationStatus ===
      'NOT_INDIVIDUALLY_PROVEN_CLEAN_CHECKOUT_SAFE',
    'remainder classification must stay fail-closed',
  );
  invariant(
    Array.isArray(contract.notYetHostedClassifiedRemainder.reasonCodes) &&
      contract.notYetHostedClassifiedRemainder.reasonCodes.length >= 1,
    'unclassified remainder must retain explicit reason codes',
  );
  invariant(
    typeof contract.notYetHostedClassifiedRemainder.executionContract === 'string' &&
      contract.notYetHostedClassifiedRemainder.executionContract.includes('not PASS'),
    'unclassified remainder must explicitly deny PASS semantics',
  );

  return {
    status: 'HOSTED_WORKBENCH_CONTRACT_PASS',
    fullLocalTestFileCount: allFiles.length,
    fullyHostedTestFileCount: hostedFiles.length,
    mixedHostedTestFileCount: 1,
    hostedReferencedTestFileCount: hostedReferencedFiles.length,
    selectedCatalogTestCount: selectedCatalogNames.length,
    fullLocalOnlyCatalogTestCount: fullLocalCatalogNames.length,
    notYetHostedClassifiedFileCount: excludedFiles.length,
    fullLocalPathSetSha256: hashPathSet(allFiles),
    fullyHostedPathSetSha256: hashPathSet(hostedFiles),
    hostedReferencedPathSetSha256: hashPathSet(hostedReferencedFiles),
    notYetHostedClassifiedPathSetSha256: hashPathSet(excludedFiles),
    hostedFiles,
    mixedProfile: {
      testFile: mixedProfile.testFile,
      selectedTestNames: selectedCatalogNames,
      expectedTestCount: mixedProfile.expectedTestCount,
      expectedPassCount: mixedProfile.expectedPassCount,
      expectedSkipCount: mixedProfile.expectedSkipCount,
    },
    fullyHostedExpected: {
      expectedTestCount: contract.fullyHostedProfile.expectedTestCount,
      expectedPassCount: contract.fullyHostedProfile.expectedPassCount,
      expectedSkipCount: contract.fullyHostedProfile.expectedSkipCount,
    },
  };
}

export function loadAndValidateHostedWorkbenchContract(repoRoot = REPO_ROOT) {
  return validateHostedWorkbenchContract({
    contract: JSON.parse(readFileSync(CONTRACT_PATH, 'utf8')),
    repoRoot,
  });
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function parseTapSummary(output, profileName) {
  const readCount = (label) => {
    const matches = [...output.matchAll(new RegExp(`^# ${label} (\\d+)$`, 'gmu'))];
    invariant(matches.length === 1, `${profileName} TAP must contain one ${label} summary`);
    return Number(matches[0][1]);
  };
  return {
    tests: readCount('tests'),
    pass: readCount('pass'),
    fail: readCount('fail'),
    cancelled: readCount('cancelled'),
    skipped: readCount('skipped'),
    todo: readCount('todo'),
  };
}

function runTapProfile({name, arguments: testArguments, expected}) {
  const child = spawnSync(process.execPath, testArguments, {
    cwd: REPO_ROOT,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  if (child.error) throw child.error;
  if (child.signal) throw new Error(`${name} terminated by signal ${child.signal}`);
  invariant(child.status === 0, `${name} exited with status ${child.status}`);
  const summary = parseTapSummary(child.stdout ?? '', name);
  invariant(summary.tests === expected.expectedTestCount, `${name} test count drifted`);
  invariant(summary.pass === expected.expectedPassCount, `${name} pass count drifted`);
  invariant(summary.fail === 0, `${name} reported failures`);
  invariant(summary.cancelled === 0, `${name} reported cancelled tests`);
  invariant(summary.skipped === expected.expectedSkipCount, `${name} skip count drifted`);
  invariant(summary.todo === 0, `${name} reported todo tests`);
  return summary;
}

function main() {
  const supportedArguments = new Set(['--check-contract']);
  for (const argument of process.argv.slice(2)) {
    invariant(supportedArguments.has(argument), `unsupported argument: ${argument}`);
  }

  const result = loadAndValidateHostedWorkbenchContract();
  const contractOnly = process.argv.includes('--check-contract');
  console.log(JSON.stringify({...result, executed: !contractOnly}, null, 2));
  if (contractOnly) {
    return;
  }

  const fullyHostedSummary = runTapProfile({
    name: 'fully-hosted-workbench',
    arguments: [...EXPECTED_NODE_ARGUMENTS, ...result.hostedFiles],
    expected: result.fullyHostedExpected,
  });
  const namePattern = `^(${result.mixedProfile.selectedTestNames
    .map(escapeRegularExpression)
    .join('|')})$`;
  const mixedCatalogSummary = runTapProfile({
    name: 'mixed-catalog-hosted-subset',
    arguments: [
      ...EXPECTED_NODE_ARGUMENTS,
      `--test-name-pattern=${namePattern}`,
      result.mixedProfile.testFile,
    ],
    expected: result.mixedProfile,
  });
  console.log(
    JSON.stringify(
      {
        status: 'HOSTED_WORKBENCH_TESTS_PASS',
        fullyHostedSummary,
        mixedCatalogSummary,
        fullLocalOnlyCatalogTestsCountedAsHostedPass: false,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
