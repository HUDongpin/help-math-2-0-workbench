#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');
const POLICY_RELATIVE_PATH =
  'catalog/launch-control/npm-install-script-policy.v1.json';
const EXACT_NPMRC =
  'strict-allow-scripts=true\ndangerously-allow-all-scripts=false\n';
const ROOT_LIFECYCLE_EVENTS = Object.freeze([
  'preinstall',
  'install',
  'postinstall',
  'preprepare',
  'prepare',
  'postprepare',
  'prepublish',
  'prepublishOnly',
]);
const POLICY_KEYS = Object.freeze([
  'schemaVersion',
  'policyId',
  'npmVersion',
  'strictConfig',
  'workflowInstallBoundaries',
  'workspacePackageJsonPaths',
  'trustedPackages',
]);
const STRICT_CONFIG_KEYS = Object.freeze([
  'path',
  'exactContentsSha256',
]);
const TRUSTED_PACKAGE_KEYS = Object.freeze([
  'identity',
  'packageName',
  'version',
  'lockPath',
  'resolved',
  'integrity',
  'optional',
  'os',
  'disposition',
  'tarballSha256',
  'packageJsonSha256',
  'reviewedLifecycleEntrypoints',
  'reviewNote',
]);
const ENTRYPOINT_KEYS = Object.freeze([
  'event',
  'command',
  'path',
  'sha256',
]);
const WORKFLOW_INSTALL_BOUNDARY_KEYS = Object.freeze([
  'path',
  'installCommand',
  'installCommandCount',
  'verifierCommand',
  'verifierCommandCount',
  'verifierRequiredBeforeEveryInstall',
]);
const WORKFLOW_DIRECTORY = '.github/workflows';
const POLICY_VERIFIER_COMMAND =
  'node scripts/verify-npm-install-script-policy.mjs';
const STRICT_INSTALL_COMMAND =
  'npm ci --no-dangerously-allow-all-scripts';
const SCRIPTLESS_INSTALL_COMMAND = 'npm ci --ignore-scripts';
const GLOBAL_NPM_INSTALL_COMMAND = 'npm install --global npm@11.16.0';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sorted(values) {
  return [...values].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0);
}

function equalJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertExactKeys(value, expectedKeys, label) {
  invariant(isPlainObject(value), `${label} must be an object`);
  const actualKeys = Object.keys(value);
  invariant(
    equalJson(actualKeys, expectedKeys),
    `${label} keys must be exactly ${expectedKeys.join(', ')}`,
  );
}

function readJson(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  invariant(isPlainObject(parsed), `${label} must be a JSON object`);
  return parsed;
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

function normalizedEnvironmentEntries(environment) {
  return Object.entries(environment).map(([key, value]) => [
    key.toLowerCase().replaceAll('-', '_'),
    String(value),
  ]);
}

function readUniqueNpmEnvironmentValue(environment, key) {
  const matches = normalizedEnvironmentEntries(environment)
    .filter(([candidate]) => candidate === key)
    .map(([, value]) => value);
  invariant(matches.length <= 1, `${key} has conflicting ambient aliases`);
  return matches[0];
}

function verifyAmbientNpmConfigBoundary(environment) {
  const strict = readUniqueNpmEnvironmentValue(
    environment,
    'npm_config_strict_allow_scripts',
  );
  invariant(
    strict === undefined || strict === 'true',
    'ambient npm config must not disable strict-allow-scripts',
  );
  const dangerous = readUniqueNpmEnvironmentValue(
    environment,
    'npm_config_dangerously_allow_all_scripts',
  );
  invariant(
    dangerous === undefined || dangerous === 'false',
    'ambient npm config must not enable dangerously-allow-all-scripts',
  );
  const ignore = readUniqueNpmEnvironmentValue(
    environment,
    'npm_config_ignore_scripts',
  );
  invariant(
    ignore === undefined || ignore === '' || ignore === 'false',
    'ambient npm config must not bypass strict review with ignore-scripts',
  );
  const allow = readUniqueNpmEnvironmentValue(
    environment,
    'npm_config_allow_scripts',
  );
  invariant(
    allow === undefined || allow === '',
    'ambient npm config must not replace the package.json allowScripts policy',
  );
}

function assertSafeRelativePath(value, label) {
  invariant(typeof value === 'string' && value.length > 0, `${label} must be a non-empty string`);
  invariant(!path.posix.isAbsolute(value), `${label} must be relative`);
  invariant(value === value.replaceAll('\\', '/'), `${label} must use POSIX separators`);
  invariant(
    !value.split('/').some((segment) => segment === '' || segment === '.' || segment === '..'),
    `${label} contains an unsafe path segment`,
  );
}

function packageNameFromLockPath(lockPath) {
  const marker = 'node_modules/';
  const markerIndex = lockPath.lastIndexOf(marker);
  invariant(markerIndex >= 0, `lock path ${lockPath} is not a node_modules package`);
  const remainder = lockPath.slice(markerIndex + marker.length);
  const segments = remainder.split('/');
  const packageName = remainder.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  invariant(packageName.length > 0, `lock path ${lockPath} has no package name`);
  return packageName;
}

function discoverWorkspacePackageJsonPaths(projectRoot, rootPackage) {
  invariant(
    Array.isArray(rootPackage.workspaces) && rootPackage.workspaces.length > 0,
    'root package.json workspaces must be a non-empty array',
  );
  const discovered = new Set(['package.json']);
  for (const [index, workspacePattern] of rootPackage.workspaces.entries()) {
    const label = `root package.json workspaces[${index}]`;
    assertSafeRelativePath(workspacePattern.replace(/\/\*$/u, ''), label);
    if (workspacePattern.endsWith('/*')) {
      const parentRelativePath = workspacePattern.slice(0, -2);
      const parentPath = path.join(projectRoot, ...parentRelativePath.split('/'));
      invariant(existsSync(parentPath) && statSync(parentPath).isDirectory(), `${label} parent is missing`);
      for (const entry of readdirSync(parentPath, {withFileTypes: true})) {
        if (!entry.isDirectory()) continue;
        const relativePath = `${parentRelativePath}/${entry.name}/package.json`;
        if (existsSync(path.join(projectRoot, ...relativePath.split('/')))) {
          discovered.add(relativePath);
        }
      }
      continue;
    }
    const relativePath = `${workspacePattern}/package.json`;
    invariant(
      existsSync(path.join(projectRoot, ...relativePath.split('/'))),
      `${label} package.json is missing`,
    );
    discovered.add(relativePath);
  }
  return sorted(discovered);
}

function verifyWorkspaceLifecycleBoundary(projectRoot, packageJsonPaths) {
  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = readJson(
      path.join(projectRoot, ...packageJsonPath.split('/')),
      packageJsonPath,
    );
    const scripts = packageJson.scripts ?? {};
    invariant(isPlainObject(scripts), `${packageJsonPath} scripts must be an object`);
    for (const lifecycleEvent of ROOT_LIFECYCLE_EVENTS) {
      invariant(
        !Object.hasOwn(scripts, lifecycleEvent),
        `${packageJsonPath} must not define the ${lifecycleEvent} lifecycle script`,
      );
    }
  }
}

function verifyPolicyEnvelope(policy) {
  assertExactKeys(policy, POLICY_KEYS, 'install-script policy');
  invariant(policy.schemaVersion === 1, 'install-script policy schemaVersion must be 1');
  invariant(
    policy.policyId === 'help-math-npm-install-script-policy-v1',
    'install-script policyId is not the reviewed v1 identifier',
  );
  invariant(/^\d+\.\d+\.\d+$/u.test(policy.npmVersion), 'policy npmVersion is invalid');
  assertExactKeys(policy.strictConfig, STRICT_CONFIG_KEYS, 'strictConfig');
  invariant(policy.strictConfig.path === '.npmrc', 'strictConfig path must be .npmrc');
  invariant(
    /^[0-9a-f]{64}$/u.test(policy.strictConfig.exactContentsSha256),
    'strictConfig exactContentsSha256 is invalid',
  );
  invariant(
    Array.isArray(policy.workflowInstallBoundaries),
    'workflowInstallBoundaries must be an array',
  );
  invariant(
    policy.workflowInstallBoundaries.length > 0,
    'workflowInstallBoundaries must not be empty',
  );
  invariant(
    Array.isArray(policy.workspacePackageJsonPaths),
    'workspacePackageJsonPaths must be an array',
  );
  invariant(Array.isArray(policy.trustedPackages), 'trustedPackages must be an array');
  invariant(policy.trustedPackages.length > 0, 'trustedPackages must not be empty');
}

function verifyWorkflowInstallBoundaryRecords(policy) {
  const paths = [];
  for (const [index, record] of policy.workflowInstallBoundaries.entries()) {
    const label = `workflowInstallBoundaries[${index}]`;
    assertExactKeys(record, WORKFLOW_INSTALL_BOUNDARY_KEYS, label);
    assertSafeRelativePath(record.path, `${label} path`);
    invariant(
      record.path.startsWith(`${WORKFLOW_DIRECTORY}/`) &&
        /\.ya?ml$/u.test(record.path),
      `${label} path must identify one GitHub Actions workflow`,
    );
    invariant(
      [STRICT_INSTALL_COMMAND, SCRIPTLESS_INSTALL_COMMAND].includes(
        record.installCommand,
      ),
      `${label} installCommand is not an approved exact command`,
    );
    invariant(
      Number.isSafeInteger(record.installCommandCount) &&
        record.installCommandCount > 0,
      `${label} installCommandCount must be a positive integer`,
    );
    invariant(
      record.verifierCommand === null ||
        record.verifierCommand === POLICY_VERIFIER_COMMAND,
      `${label} verifierCommand is invalid`,
    );
    invariant(
      Number.isSafeInteger(record.verifierCommandCount) &&
        record.verifierCommandCount >= 0,
      `${label} verifierCommandCount must be a non-negative integer`,
    );
    invariant(
      typeof record.verifierRequiredBeforeEveryInstall === 'boolean',
      `${label} verifierRequiredBeforeEveryInstall must be boolean`,
    );
    if (record.verifierRequiredBeforeEveryInstall) {
      invariant(
        record.installCommand === STRICT_INSTALL_COMMAND ||
          record.path.endsWith('/security.yml'),
        `${label} verifier requirement is not bound to a reviewed workflow`,
      );
      invariant(
        record.verifierCommand === POLICY_VERIFIER_COMMAND &&
          record.verifierCommandCount === record.installCommandCount,
        `${label} must run one verifier before every install`,
      );
    } else {
      invariant(
        record.installCommand === SCRIPTLESS_INSTALL_COMMAND &&
          record.verifierCommand === null &&
          record.verifierCommandCount === 0,
        `${label} may omit the verifier only for an exact scriptless install`,
      );
    }
    paths.push(record.path);
  }
  invariant(
    equalJson(paths, sorted(paths)),
    'workflow install boundary paths must be bytewise sorted',
  );
  invariant(
    new Set(paths).size === paths.length,
    'workflow install boundary paths must be unique',
  );
}

function workflowJobStartIndex(lines, lineIndex, workflowPath) {
  for (let index = lineIndex; index >= 0; index -= 1) {
    if (/^ {2}[A-Za-z0-9][A-Za-z0-9_-]*:\s*(?:#.*)?$/u.test(lines[index])) {
      return index;
    }
  }
  throw new Error(`${workflowPath} command is not inside a named workflow job`);
}

function workflowStepBlock(lines, lineIndex, workflowPath) {
  let startIndex = -1;
  let stepIndent = -1;
  for (let index = lineIndex; index >= 0; index -= 1) {
    const match = /^(\s*)-\s+name:\s*\S/u.exec(lines[index]);
    if (match) {
      startIndex = index;
      stepIndent = match[1].length;
      break;
    }
  }
  invariant(
    startIndex >= 0,
    `${workflowPath} command is not inside a named workflow step`,
  );
  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const match = /^(\s*)-\s+name:\s*\S/u.exec(lines[index]);
    if (match && match[1].length === stepIndent) {
      endIndex = index;
      break;
    }
  }
  invariant(
    lineIndex >= startIndex && lineIndex < endIndex,
    `${workflowPath} command escaped its named workflow step`,
  );
  return lines.slice(startIndex, endIndex).map((line) => line.trim());
}

function verifyUnconditionalWorkflowStep(lines, lineIndex, workflowPath, label) {
  const block = workflowStepBlock(lines, lineIndex, workflowPath);
  invariant(
    !block.some((line) => /^if\s*:/u.test(line)),
    `${workflowPath} ${label} step must be unconditional`,
  );
  invariant(
    !block.some((line) => /^continue-on-error\s*:/u.test(line)),
    `${workflowPath} ${label} step must fail closed`,
  );
}

function verifyWorkflowInstallSurface(projectRoot, policy) {
  const recordsByPath = new Map(
    policy.workflowInstallBoundaries.map((record) => [record.path, record]),
  );
  const workflowRoot = path.join(
    projectRoot,
    ...WORKFLOW_DIRECTORY.split('/'),
  );
  invariant(
    existsSync(workflowRoot) && statSync(workflowRoot).isDirectory(),
    'GitHub Actions workflow directory is missing',
  );
  const workflowPaths = readdirSync(workflowRoot, {withFileTypes: true})
    .filter((entry) => entry.isFile() && /\.ya?ml$/u.test(entry.name))
    .map((entry) => `${WORKFLOW_DIRECTORY}/${entry.name}`);

  for (const workflowPath of workflowPaths) {
    const contents = readFileSync(
      path.join(projectRoot, ...workflowPath.split('/')),
      'utf8',
    );
    const rawLines = contents.split(/\r?\n/u);
    const lines = rawLines.map((line) => line.trim());
    const npmCiLineIndexes = lines
      .map((line, index) => (/\bnpm\s+ci(?:\s|$)/u.test(line) ? index : -1))
      .filter((index) => index >= 0);
    const npmInstallLines = lines.filter((line) =>
      /\bnpm\s+install(?:\s|$)/u.test(line));
    invariant(
      npmInstallLines.every(
        (line) => line === `run: ${GLOBAL_NPM_INSTALL_COMMAND}`,
      ),
      `${workflowPath} contains an unreviewed npm install command`,
    );
    if (npmCiLineIndexes.length === 0) continue;

    const record = recordsByPath.get(workflowPath);
    invariant(
      record !== undefined,
      `${workflowPath} has an npm ci surface without a policy record`,
    );
    invariant(
      npmCiLineIndexes.every(
        (index) => lines[index] === `run: ${record.installCommand}`,
      ),
      `${workflowPath} npm ci command drifted from the exact policy`,
    );
    invariant(
      npmCiLineIndexes.length === record.installCommandCount,
      `${workflowPath} npm ci command count drifted`,
    );

    const verifierLineIndexes = lines
      .map((line, index) =>
        line === `run: ${POLICY_VERIFIER_COMMAND}` ? index : -1)
      .filter((index) => index >= 0);
    invariant(
      verifierLineIndexes.length === record.verifierCommandCount,
      `${workflowPath} policy verifier command count drifted`,
    );
    for (const installIndex of npmCiLineIndexes) {
      verifyUnconditionalWorkflowStep(
        rawLines,
        installIndex,
        workflowPath,
        'npm ci',
      );
    }
    for (const verifierIndex of verifierLineIndexes) {
      verifyUnconditionalWorkflowStep(
        rawLines,
        verifierIndex,
        workflowPath,
        'policy verifier',
      );
    }
    if (record.verifierRequiredBeforeEveryInstall) {
      let previousInstallIndex = -1;
      for (const installIndex of npmCiLineIndexes) {
        const jobStartIndex = workflowJobStartIndex(
          rawLines,
          installIndex,
          workflowPath,
        );
        const precedingVerifierCount = verifierLineIndexes.filter(
          (index) =>
            index > Math.max(previousInstallIndex, jobStartIndex) &&
            index < installIndex,
        ).length;
        invariant(
          precedingVerifierCount === 1,
          `${workflowPath} must run exactly one policy verifier before every npm ci`,
        );
        previousInstallIndex = installIndex;
      }
    }

    const normalizedContents = contents.toLowerCase().replaceAll('_', '-');
    const withoutExplicitDenial = normalizedContents.replaceAll(
      '--no-dangerously-allow-all-scripts',
      '',
    );
    invariant(
      !withoutExplicitDenial.includes('dangerously-allow-all-scripts'),
      `${workflowPath} contains a dangerously-allow-all-scripts bypass`,
    );
    invariant(
      !normalizedContents.includes('npm-config-strict-allow-scripts') &&
        !normalizedContents.includes('npm-config-allow-scripts') &&
        !normalizedContents.includes('npm-config-ignore-scripts'),
      `${workflowPath} contains an ambient npm lifecycle-policy override`,
    );
  }

  for (const record of policy.workflowInstallBoundaries) {
    invariant(
      workflowPaths.includes(record.path),
      `${record.path} workflow install boundary is missing`,
    );
  }
}

function verifyPolicyPackageRecords(policy) {
  const identities = [];
  const lockPaths = [];
  for (const [index, record] of policy.trustedPackages.entries()) {
    const label = `trustedPackages[${index}]`;
    assertExactKeys(record, TRUSTED_PACKAGE_KEYS, label);
    invariant(typeof record.packageName === 'string' && record.packageName.length > 0, `${label} packageName is invalid`);
    invariant(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(record.version), `${label} version is invalid`);
    invariant(record.identity === `${record.packageName}@${record.version}`, `${label} identity is not exact`);
    assertSafeRelativePath(record.lockPath, `${label} lockPath`);
    invariant(packageNameFromLockPath(record.lockPath) === record.packageName, `${label} lockPath package name mismatches`);
    const packageBaseName = record.packageName.split('/').at(-1);
    invariant(
      record.resolved ===
        `https://registry.npmjs.org/${record.packageName}/-/${packageBaseName}-${record.version}.tgz`,
      `${label} resolved URL must match the exact npm registry identity`,
    );
    invariant(/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(record.integrity), `${label} integrity is invalid`);
    invariant(typeof record.optional === 'boolean', `${label} optional must be boolean`);
    invariant(
      record.os === null || (Array.isArray(record.os) && record.os.length > 0 && record.os.every((entry) => typeof entry === 'string' && entry.length > 0)),
      `${label} os must be null or a non-empty string array`,
    );
    invariant(record.disposition === 'deny', `${label} disposition must remain deny`);
    invariant(/^[0-9a-f]{64}$/u.test(record.tarballSha256), `${label} tarballSha256 is invalid`);
    invariant(/^[0-9a-f]{64}$/u.test(record.packageJsonSha256), `${label} packageJsonSha256 is invalid`);
    invariant(Array.isArray(record.reviewedLifecycleEntrypoints), `${label} reviewedLifecycleEntrypoints must be an array`);
    for (const [entryIndex, entrypoint] of record.reviewedLifecycleEntrypoints.entries()) {
      const entryLabel = `${label}.reviewedLifecycleEntrypoints[${entryIndex}]`;
      assertExactKeys(entrypoint, ENTRYPOINT_KEYS, entryLabel);
      invariant(['preinstall', 'install', 'postinstall'].includes(entrypoint.event), `${entryLabel} event is invalid`);
      invariant(typeof entrypoint.command === 'string' && entrypoint.command.length > 0, `${entryLabel} command is invalid`);
      assertSafeRelativePath(entrypoint.path, `${entryLabel} path`);
      invariant(/^[0-9a-f]{64}$/u.test(entrypoint.sha256), `${entryLabel} sha256 is invalid`);
    }
    invariant(typeof record.reviewNote === 'string' && record.reviewNote.length > 0, `${label} reviewNote is required`);
    identities.push(record.identity);
    lockPaths.push(record.lockPath);
  }
  invariant(equalJson(identities, sorted(identities)), 'trusted package identities must be bytewise sorted');
  invariant(new Set(identities).size === identities.length, 'trusted package identities must be unique');
  invariant(new Set(lockPaths).size === lockPaths.length, 'trusted package lock paths must be unique');
}

function verifyRootPackage(rootPackage, policy) {
  invariant(rootPackage.packageManager === `npm@${policy.npmVersion}`, 'root packageManager must bind the reviewed npm version');
  invariant(rootPackage.engines?.npm === policy.npmVersion, 'root engines.npm must bind the reviewed npm version');
  invariant(isPlainObject(rootPackage.allowScripts), 'root allowScripts must be an object');
  const expectedAllowScripts = Object.fromEntries(
    policy.trustedPackages.map((record) => [record.identity, false]),
  );
  invariant(
    equalJson(rootPackage.allowScripts, expectedAllowScripts),
    'root allowScripts must exactly deny every reviewed install-script identity and no others',
  );
}

function verifyLockfile(lockfile, policy) {
  invariant(lockfile.lockfileVersion === 3, 'package-lock lockfileVersion must remain 3');
  invariant(lockfile.requires === true, 'package-lock requires must remain true');
  invariant(isPlainObject(lockfile.packages), 'package-lock packages must be an object');
  const installScriptEntries = Object.entries(lockfile.packages)
    .filter(([, value]) => value?.hasInstallScript === true)
    .map(([lockPath]) => lockPath);
  const expectedLockPaths = policy.trustedPackages.map((record) => record.lockPath);
  invariant(
    equalJson(sorted(installScriptEntries), sorted(expectedLockPaths)),
    'package-lock install-script path set drifted from the reviewed policy',
  );
  for (const record of policy.trustedPackages) {
    const locked = lockfile.packages[record.lockPath];
    invariant(isPlainObject(locked), `package-lock entry ${record.lockPath} is missing`);
    invariant(locked.hasInstallScript === true, `${record.lockPath} must remain marked hasInstallScript`);
    invariant(locked.version === record.version, `${record.lockPath} version drifted`);
    invariant(locked.resolved === record.resolved, `${record.lockPath} resolved URL drifted`);
    invariant(locked.integrity === record.integrity, `${record.lockPath} integrity drifted`);
    invariant(Boolean(locked.optional) === record.optional, `${record.lockPath} optional disposition drifted`);
    invariant(equalJson(locked.os ?? null, record.os), `${record.lockPath} operating-system boundary drifted`);
    invariant((locked.cpu ?? null) === null, `${record.lockPath} introduced an unreviewed CPU boundary`);
  }
}

export function verifyNpmInstallScriptPolicy({
  projectRoot = PROJECT_ROOT,
  environment = process.env,
} = {}) {
  const resolvedRoot = path.resolve(projectRoot);
  const policy = readJson(
    path.join(resolvedRoot, ...POLICY_RELATIVE_PATH.split('/')),
    POLICY_RELATIVE_PATH,
  );
  verifyPolicyEnvelope(policy);
  verifyWorkflowInstallBoundaryRecords(policy);
  verifyPolicyPackageRecords(policy);
  verifyAmbientNpmConfigBoundary(environment);
  verifyWorkflowInstallSurface(resolvedRoot, policy);

  const npmrcPath = path.join(resolvedRoot, policy.strictConfig.path);
  invariant(existsSync(npmrcPath), '.npmrc is missing');
  const npmrcContents = readFileSync(npmrcPath, 'utf8');
  invariant(
    npmrcContents === EXACT_NPMRC,
    '.npmrc must contain only the exact strict and dangerous-override denial settings',
  );
  invariant(
    sha256(npmrcContents) === policy.strictConfig.exactContentsSha256,
    '.npmrc hash drifted from the reviewed policy',
  );

  const rootPackage = readJson(path.join(resolvedRoot, 'package.json'), 'package.json');
  verifyRootPackage(rootPackage, policy);
  const workspacePackageJsonPaths = discoverWorkspacePackageJsonPaths(
    resolvedRoot,
    rootPackage,
  );
  invariant(
    equalJson(workspacePackageJsonPaths, policy.workspacePackageJsonPaths),
    'workspace package.json path set drifted from the reviewed policy',
  );
  verifyWorkspaceLifecycleBoundary(resolvedRoot, workspacePackageJsonPaths);

  const lockfile = readJson(
    path.join(resolvedRoot, 'package-lock.json'),
    'package-lock.json',
  );
  verifyLockfile(lockfile, policy);

  return Object.freeze({
    policyId: policy.policyId,
    npmVersion: policy.npmVersion,
    workspacePackageJsonCount: workspacePackageJsonPaths.length,
    controlledWorkflowCount: policy.workflowInstallBoundaries.length,
    controlledWorkflowInstallCount: policy.workflowInstallBoundaries
      .reduce((total, record) => total + record.installCommandCount, 0),
    controlledWorkflowPaths: Object.freeze(
      policy.workflowInstallBoundaries.map((record) => record.path),
    ),
    deniedInstallScriptPackageCount: policy.trustedPackages.length,
    deniedIdentities: Object.freeze(
      policy.trustedPackages.map((record) => record.identity),
    ),
  });
}

function main() {
  invariant(process.argv.length === 2, 'unknown command-line arguments are forbidden');
  const result = verifyNpmInstallScriptPolicy();
  console.log(
    `NPM_INSTALL_SCRIPT_POLICY_PASS npm=${result.npmVersion} ` +
      `workspaces=${result.workspacePackageJsonCount} ` +
      `workflows=${result.controlledWorkflowCount} ` +
      `installs=${result.controlledWorkflowInstallCount} ` +
      `denied=${result.deniedInstallScriptPackageCount}`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  try {
    main();
  } catch (error) {
    console.error(`NPM_INSTALL_SCRIPT_POLICY_FAIL ${error.message}`);
    process.exitCode = 1;
  }
}
