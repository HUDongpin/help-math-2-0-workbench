import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {verifyNpmInstallScriptPolicy} from './verify-npm-install-script-policy.mjs';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');
const FIXTURE_PATHS = Object.freeze([
  '.npmrc',
  '.github/workflows/ci.yml',
  '.github/workflows/launch-go.yml',
  '.github/workflows/security.yml',
  'apps/web/package.json',
  'catalog/launch-control/npm-install-script-policy.v1.json',
  'package-lock.json',
  'package.json',
  'packages/demos/package.json',
]);

function makeFixture(t) {
  const root = mkdtempSync(
    path.join(process.env.TMPDIR || os.tmpdir(), 'help-math-npm-policy-'),
  );
  t.after(() => rmSync(root, {recursive: true, force: true}));
  for (const relativePath of FIXTURE_PATHS) {
    const targetPath = path.join(root, ...relativePath.split('/'));
    mkdirSync(path.dirname(targetPath), {recursive: true});
    copyFileSync(path.join(PROJECT_ROOT, ...relativePath.split('/')), targetPath);
  }
  return root;
}

function readJson(root, relativePath) {
  return JSON.parse(
    readFileSync(path.join(root, ...relativePath.split('/')), 'utf8'),
  );
}

function writeJson(root, relativePath, value) {
  writeFileSync(
    path.join(root, ...relativePath.split('/')),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

test('accepts the exact denied lifecycle-script graph', () => {
  const result = verifyNpmInstallScriptPolicy();
  assert.equal(result.policyId, 'help-math-npm-install-script-policy-v1');
  assert.equal(result.npmVersion, '11.16.0');
  assert.equal(result.workspacePackageJsonCount, 3);
  assert.equal(result.controlledWorkflowCount, 3);
  assert.equal(result.controlledWorkflowInstallCount, 6);
  assert.deepEqual(result.controlledWorkflowPaths, [
    '.github/workflows/ci.yml',
    '.github/workflows/launch-go.yml',
    '.github/workflows/security.yml',
  ]);
  assert.equal(result.deniedInstallScriptPackageCount, 6);
  assert.deepEqual(result.deniedIdentities, [
    '@parcel/watcher@2.6.0',
    '@swc/core@1.15.46',
    'esbuild@0.28.1',
    'fsevents@2.3.2',
    'fsevents@2.3.3',
    'unrs-resolver@1.12.2',
  ]);
});

test('rejects missing, weakened, or expanded npm configuration', (t) => {
  const root = makeFixture(t);
  writeFileSync(path.join(root, '.npmrc'), 'strict-allow-scripts=false\n', 'utf8');
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must contain only the exact strict and dangerous-override denial settings/u,
  );

  writeFileSync(
    path.join(root, '.npmrc'),
    'strict-allow-scripts=true\ndangerously-allow-all-scripts=false\nignore-scripts=true\n',
    'utf8',
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must contain only the exact strict and dangerous-override denial settings/u,
  );

  copyFileSync(path.join(PROJECT_ROOT, '.npmrc'), path.join(root, '.npmrc'));
  assert.doesNotThrow(() =>
    verifyNpmInstallScriptPolicy({
      projectRoot: root,
      environment: {
        npm_config_allow_scripts: '',
        npm_config_dangerously_allow_all_scripts: 'false',
        npm_config_strict_allow_scripts: 'true',
      },
    }));
  for (const [key, value, message] of [
    [
      'NPM_CONFIG_DANGEROUSLY_ALLOW_ALL_SCRIPTS',
      'true',
      /must not enable dangerously-allow-all-scripts/u,
    ],
    [
      'npm_config_strict_allow_scripts',
      'false',
      /must not disable strict-allow-scripts/u,
    ],
    [
      'npm_config_ignore_scripts',
      'true',
      /must not bypass strict review with ignore-scripts/u,
    ],
    [
      'npm_config_allow_scripts',
      'esbuild',
      /must not replace the package.json allowScripts policy/u,
    ],
  ]) {
    assert.throws(
      () => verifyNpmInstallScriptPolicy({
        projectRoot: root,
        environment: {[key]: value},
      }),
      message,
    );
  }

  const ciPath = path.join(root, '.github/workflows/ci.yml');
  const ciWorkflow = readFileSync(ciPath, 'utf8');
  writeFileSync(
    ciPath,
    ciWorkflow.replace(
      'run: npm ci --no-dangerously-allow-all-scripts',
      'run: npm ci --dangerously-allow-all-scripts',
    ),
    'utf8',
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /npm ci command drifted from the exact policy/u,
  );

  writeFileSync(
    ciPath,
    ciWorkflow.replace(
      'run: node scripts/verify-npm-install-script-policy.mjs',
      'run: node scripts/verify-launch-control.mjs',
    ),
    'utf8',
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /policy verifier command count drifted/u,
  );

  writeFileSync(
    ciPath,
    ciWorkflow.replace(
      'run: node scripts/verify-npm-install-script-policy.mjs',
      'if: false\n        run: node scripts/verify-npm-install-script-policy.mjs',
    ),
    'utf8',
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /policy verifier step must be unconditional/u,
  );

  writeFileSync(
    ciPath,
    ciWorkflow.replace(
      'run: node scripts/verify-npm-install-script-policy.mjs',
      'continue-on-error: true\n        run: node scripts/verify-npm-install-script-policy.mjs',
    ),
    'utf8',
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /policy verifier step must fail closed/u,
  );
});

test('rejects approval, omission, or broad package-name aliases', (t) => {
  const root = makeFixture(t);
  const packageJson = readJson(root, 'package.json');
  packageJson.allowScripts['esbuild@0.28.1'] = true;
  writeJson(root, 'package.json', packageJson);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must exactly deny every reviewed install-script identity/u,
  );

  packageJson.allowScripts['esbuild@0.28.1'] = false;
  delete packageJson.allowScripts['fsevents@2.3.3'];
  packageJson.allowScripts.esbuild = false;
  writeJson(root, 'package.json', packageJson);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must exactly deny every reviewed install-script identity/u,
  );
});

test('rejects newly introduced or removed lockfile install-script surfaces', (t) => {
  const root = makeFixture(t);
  const lockfile = readJson(root, 'package-lock.json');
  lockfile.packages['node_modules/unreviewed-install-package'] = {
    version: '1.0.0',
    resolved:
      'https://registry.npmjs.org/unreviewed-install-package/-/unreviewed-install-package-1.0.0.tgz',
    integrity:
      'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
    hasInstallScript: true,
  };
  writeJson(root, 'package-lock.json', lockfile);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /install-script path set drifted/u,
  );

  delete lockfile.packages['node_modules/unreviewed-install-package'];
  lockfile.packages['node_modules/esbuild'].hasInstallScript = false;
  writeJson(root, 'package-lock.json', lockfile);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /install-script path set drifted/u,
  );
});

test('rejects exact version, source, integrity, platform, or optionality drift', (t) => {
  const mutations = [
    ['version', '0.28.2', /version drifted/u],
    [
      'resolved',
      'https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz',
      /resolved URL drifted/u,
    ],
    [
      'integrity',
      'sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
      /integrity drifted/u,
    ],
    ['optional', true, /optional disposition drifted/u],
    ['os', ['linux'], /operating-system boundary drifted/u],
  ];
  for (const [field, value, message] of mutations) {
    const root = makeFixture(t);
    const lockfile = readJson(root, 'package-lock.json');
    lockfile.packages['node_modules/esbuild'][field] = value;
    writeJson(root, 'package-lock.json', lockfile);
    assert.throws(
      () => verifyNpmInstallScriptPolicy({projectRoot: root}),
      message,
    );
  }
});

test('rejects root or workspace lifecycle scripts and workspace discovery drift', (t) => {
  const root = makeFixture(t);
  const webPackage = readJson(root, 'apps/web/package.json');
  webPackage.scripts.postinstall = 'node unreviewed.js';
  writeJson(root, 'apps/web/package.json', webPackage);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must not define the postinstall lifecycle script/u,
  );

  delete webPackage.scripts.postinstall;
  webPackage.scripts.preprepare = 'node unreviewed.js';
  writeJson(root, 'apps/web/package.json', webPackage);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must not define the preprepare lifecycle script/u,
  );

  delete webPackage.scripts.preprepare;
  webPackage.scripts.postprepare = 'node unreviewed.js';
  writeJson(root, 'apps/web/package.json', webPackage);
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /must not define the postprepare lifecycle script/u,
  );

  delete webPackage.scripts.postprepare;
  writeJson(root, 'apps/web/package.json', webPackage);
  mkdirSync(path.join(root, 'packages/unreviewed'));
  writeJson(root, 'packages/unreviewed/package.json', {
    name: '@helpmath/unreviewed',
    version: '0.0.0',
  });
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /workspace package.json path set drifted/u,
  );
});

test('rejects policy key, order, or disposition drift', (t) => {
  const root = makeFixture(t);
  const policy = readJson(
    root,
    'catalog/launch-control/npm-install-script-policy.v1.json',
  );
  policy.unexpectedPrivateField = true;
  writeJson(
    root,
    'catalog/launch-control/npm-install-script-policy.v1.json',
    policy,
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /install-script policy keys must be exactly/u,
  );

  delete policy.unexpectedPrivateField;
  policy.trustedPackages.reverse();
  writeJson(
    root,
    'catalog/launch-control/npm-install-script-policy.v1.json',
    policy,
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /identities must be bytewise sorted/u,
  );

  policy.trustedPackages.reverse();
  policy.trustedPackages[0].disposition = 'allow';
  writeJson(
    root,
    'catalog/launch-control/npm-install-script-policy.v1.json',
    policy,
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /disposition must remain deny/u,
  );

  policy.trustedPackages[0].disposition = 'deny';
  policy.trustedPackages[0].resolved =
    'https://registry.npmjs.org/@parcel/watcher/-/watcher-2.6.1.tgz';
  writeJson(
    root,
    'catalog/launch-control/npm-install-script-policy.v1.json',
    policy,
  );
  assert.throws(
    () => verifyNpmInstallScriptPolicy({projectRoot: root}),
    /resolved URL must match the exact npm registry identity/u,
  );
});

test('CLI fails closed on unknown arguments', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, 'scripts/verify-npm-install-script-policy.mjs'), '--unexpected'],
    {cwd: PROJECT_ROOT, encoding: 'utf8'},
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown command-line arguments are forbidden/u);
});
