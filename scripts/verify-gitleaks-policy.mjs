#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');
const POLICY_PATH = path.join(PROJECT_ROOT, '.gitleaks.toml');
const EXPECTED_GITLEAKS_VERSION = '8.24.3';
const EXPECTED_POLICY_SHA256 =
  '9b8ee004c27541f9b1be4a2b30759b75ce93d4dbe43612117cc16361c6abccc1';
const GITLEAKS_COMMAND = process.env.GITLEAKS_BIN || 'gitleaks';

const SQL_CATALOG_HEADER = Object.freeze([
  'relative_path',
  'path_sha256',
  'bytes',
  'modified_utc',
  'extension',
  'category',
  'priority',
  'sensitivity',
  'database_table',
  'table_row_count',
  'manifest_sha256',
  'integrity_evidence',
  'useful_for_help_math_2_0',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  invariant(!quoted, 'CSV row contains an unterminated quoted field');
  fields.push(value);
  return fields;
}

function validateSqlCatalogHashColumns() {
  const catalogPath = path.join(
    PROJECT_ROOT,
    'catalog/newhelpprogram-20210203-files.csv',
  );
  const lines = readFileSync(catalogPath, 'utf8').split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  invariant(lines.length > 1, 'SQL archive catalog must include data rows');
  invariant(
    JSON.stringify(parseCsvLine(lines[0])) === JSON.stringify(SQL_CATALOG_HEADER),
    'SQL archive catalog header drifted from the reviewed hash-column schema',
  );
  for (const [offset, line] of lines.slice(1).entries()) {
    const fields = parseCsvLine(line);
    invariant(
      fields.length === SQL_CATALOG_HEADER.length,
      `SQL archive catalog row ${offset + 2} changed field count`,
    );
    invariant(
      /^[0-9a-f]{64}$/.test(fields[1]),
      `SQL archive catalog row ${offset + 2} path_sha256 is invalid`,
    );
    invariant(
      fields[10] === '' || /^[0-9a-f]{64}$/.test(fields[10]),
      `SQL archive catalog row ${offset + 2} manifest_sha256 is invalid`,
    );
    for (const [fieldIndex, field] of fields.entries()) {
      if (fieldIndex === 1 || fieldIndex === 10) continue;
      invariant(
        !/^[0-9a-f]{64}$/.test(field),
        `SQL archive catalog row ${offset + 2} has a SHA-shaped value outside an approved hash column`,
      );
    }
  }
}

function assertNoTrackedIgnorePaths(trackedPaths) {
  invariant(
    !trackedPaths.some((trackedPath) =>
      path.posix.basename(trackedPath) === '.gitleaksignore'),
    'tracked .gitleaksignore files are forbidden; use the reviewed path-and-shape policy',
  );
}

function verifyRepositorySuppressionBoundary() {
  const tracked = spawnSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(tracked.error === undefined, tracked.error?.message ?? 'git ls-tree could not start');
  invariant(tracked.status === 0, `git ls-tree exited ${tracked.status}`);
  const trackedPaths = tracked.stdout.split('\0').filter(Boolean);
  assertNoTrackedIgnorePaths(trackedPaths);

  const inlineSuppressionMarker = ['gitleaks', 'allow'].join(':');
  const inlineSuppression = spawnSync(
    'git',
    ['grep', '-q', '--fixed-strings', '-e', inlineSuppressionMarker, 'HEAD', '--', '.'],
    {cwd: PROJECT_ROOT, encoding: 'utf8'},
  );
  invariant(
    inlineSuppression.error === undefined,
    inlineSuppression.error?.message ?? 'git grep could not start',
  );
  invariant(
    inlineSuppression.status === 1,
    inlineSuppression.status === 0
      ? 'tracked inline Gitleaks suppression directives are forbidden'
      : `git grep failed operationally with exit ${inlineSuppression.status}`,
  );
}

function runGitleaksDirectory(
  targetRoot,
  {withPolicy, reportName, extraArguments = []},
) {
  const reportPath = path.join(targetRoot, reportName);
  const argumentsList = [
    'dir',
    '.',
    '--no-banner',
    '--redact=100',
    '--report-format',
    'json',
    '--report-path',
    reportPath,
    '--exit-code',
    '23',
  ];
  if (withPolicy) argumentsList.push('--config', POLICY_PATH);
  argumentsList.push(...extraArguments);
  const result = spawnSync(GITLEAKS_COMMAND, argumentsList, {
    cwd: targetRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(result.error === undefined, result.error?.message ?? 'gitleaks could not start');
  invariant(
    result.status === 0 || result.status === 23,
    `gitleaks policy canary scan failed operationally with exit ${result.status}`,
  );
  const findings = existsSync(reportPath) ?
    JSON.parse(readFileSync(reportPath, 'utf8')) : [];
  invariant(Array.isArray(findings), 'gitleaks canary report must be a JSON array');
  const fingerprints = findings.map((finding) => finding.Fingerprint).filter(
    (fingerprint) => typeof fingerprint === 'string' && fingerprint.length > 0,
  );
  rmSync(reportPath, {force: true});
  return Object.freeze({
    detected: result.status === 23,
    findingCount: findings.length,
    fingerprints: Object.freeze(fingerprints),
  });
}

function writeFixture(root, relativePath, contents) {
  const absolutePath = path.join(root, ...relativePath.split('/'));
  mkdirSync(path.dirname(absolutePath), {recursive: true, mode: 0o700});
  writeFileSync(absolutePath, contents, {encoding: 'utf8', mode: 0o600});
}

function verifyAllowedCase(suiteRoot, fixture) {
  const root = path.join(suiteRoot, `allowed-${fixture.id}`);
  mkdirSync(root, {recursive: true, mode: 0o700});
  writeFixture(root, fixture.path, fixture.contents);
  const withoutPolicy = runGitleaksDirectory(root, {
    withPolicy: false,
    reportName: 'without-policy.json',
  });
  invariant(
    withoutPolicy.detected && withoutPolicy.findingCount >= 1,
    `allowlist canary ${fixture.id} is not detected by the default rules`,
  );
  const withPolicy = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'with-policy.json',
  });
  invariant(
    !withPolicy.detected && withPolicy.findingCount === 0,
    `allowlist canary ${fixture.id} was not narrowly suppressed`,
  );
}

function verifyRejectedCase(suiteRoot, fixture) {
  const root = path.join(suiteRoot, `rejected-${fixture.id}`);
  mkdirSync(root, {recursive: true, mode: 0o700});
  writeFixture(root, fixture.path, fixture.contents);
  const withPolicy = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'with-policy.json',
  });
  invariant(
    withPolicy.detected && withPolicy.findingCount >= 1,
    `negative canary ${fixture.id} was incorrectly suppressed by the policy`,
  );
}

function verifyInlineSuppressionCannotBypass(suiteRoot, tokenCanary) {
  const root = path.join(suiteRoot, 'inline-suppression');
  mkdirSync(root, {recursive: true, mode: 0o700});
  const inlineSuppressionMarker = ['gitleaks', 'allow'].join(':');
  writeFixture(
    root,
    'scripts/inline-suppression-canary.txt',
    `apiKey = "${tokenCanary}" # ${inlineSuppressionMarker}\n`,
  );
  const permissive = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'permissive-inline.json',
  });
  invariant(
    !permissive.detected && permissive.findingCount === 0,
    'inline-suppression canary no longer demonstrates the default bypass',
  );
  const strict = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'strict-inline.json',
    extraArguments: ['--ignore-gitleaks-allow'],
  });
  invariant(
    strict.detected && strict.findingCount >= 1,
    'strict scans failed to reject an inline suppression directive',
  );
}

function verifyFingerprintIgnoreCannotBypass(suiteRoot, tokenCanary) {
  const root = path.join(suiteRoot, 'fingerprint-suppression');
  mkdirSync(root, {recursive: true, mode: 0o700});
  writeFixture(
    root,
    'scripts/fingerprint-suppression-canary.txt',
    `apiKey = "${tokenCanary}"\n`,
  );
  const initial = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'initial-fingerprint.json',
    extraArguments: ['--ignore-gitleaks-allow'],
  });
  invariant(
    initial.detected && initial.findingCount >= 1 && initial.fingerprints.length >= 1,
    'fingerprint-suppression canary could not derive a detected fingerprint',
  );
  writeFixture(root, '.gitleaksignore', `${initial.fingerprints[0]}\n`);
  const permissive = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'permissive-fingerprint.json',
    extraArguments: ['--ignore-gitleaks-allow'],
  });
  invariant(
    !permissive.detected && permissive.findingCount === 0,
    'fingerprint canary no longer demonstrates the default ignore-file bypass',
  );
  let trackedIgnoreRejected = false;
  try {
    assertNoTrackedIgnorePaths(['nested/.gitleaksignore']);
  } catch {
    trackedIgnoreRejected = true;
  }
  invariant(
    trackedIgnoreRejected,
    'repository policy failed to reject a tracked fingerprint ignore file',
  );
  rmSync(path.join(root, '.gitleaksignore'));
  const strict = runGitleaksDirectory(root, {
    withPolicy: true,
    reportName: 'strict-fingerprint.json',
    extraArguments: ['--ignore-gitleaks-allow'],
  });
  invariant(
    strict.detected && strict.findingCount >= 1,
    'strict scans failed to reject a fingerprint ignore-file suppression',
  );
}

function main() {
  invariant(process.argv.length === 2, 'usage: node scripts/verify-gitleaks-policy.mjs');
  const policyBytes = readFileSync(POLICY_PATH);
  invariant(
    sha256(policyBytes) === EXPECTED_POLICY_SHA256,
    'the reviewed .gitleaks.toml policy hash drifted',
  );
  verifyRepositorySuppressionBoundary();
  validateSqlCatalogHashColumns();

  const version = spawnSync(GITLEAKS_COMMAND, ['version'], {
    encoding: 'utf8',
  });
  invariant(version.error === undefined, version.error?.message ?? 'gitleaks could not start');
  invariant(version.status === 0, `gitleaks version exited ${version.status}`);
  invariant(
    version.stdout.trim() === EXPECTED_GITLEAKS_VERSION,
    `gitleaks version must equal ${EXPECTED_GITLEAKS_VERSION}`,
  );

  const fixtureHash = sha256(Buffer.from('HELP_MATH_GITLEAKS_POLICY_CANARY_V1'));
  const tokenCanary = `hm_${fixtureHash.slice(0, 44)}`;
  const provenanceField = ['artifact', 'Token'].join('');
  const provenanceId = [
    'grade4',
    'quarantine',
    'intake',
    'receipt',
    '2026',
    '08',
    '02',
  ].join('-');
  const manifestRecordId = ['conditional', 'Operator', 'Gate', 'V1'].join('');
  const temporaryParent = process.env.RUNNER_TEMP || process.env.TMPDIR || os.tmpdir();
  const suiteRoot = mkdtempSync(path.join(temporaryParent, 'helpmath-gitleaks-policy-'));
  try {
    const allowed = [
      {
        id: 'exact-match-key-sha256',
        path: 'migrations/course-g05-l05-fq-999/audit/machine/g5-l5-renderer-neutral-work-package.json',
        contents: `{\n  "exactMatchKey": "${fixtureHash}"\n}\n`,
      },
      {
        id: 'animation-typed-swf-sha256',
        path: 'catalog/animations.csv',
        contents: `"course-keyterm-fixture","swf-${fixtureHash}","canonical"\n`,
      },
      {
        id: 'sql-catalog-path-sha256',
        path: 'catalog/newhelpprogram-20210203-files.csv',
        contents: `"archive/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-keyterm.file","${fixtureHash}",1\n`,
      },
      {
        id: 'fixed-provenance-artifact-id',
        path: 'scripts/build-g4-missing-mp3-resolution-plan-v2.mjs',
        contents: `${provenanceField}: "${provenanceId}",\n`,
      },
      {
        id: 'fixed-record-key-comparison',
        path: 'scripts/build-g4-l10-complete-migration-template-contract-v6.mjs',
        contents: `  record.key === "${manifestRecordId}").contents.toString("utf8");\n`,
      },
    ];
    const rejected = [
      {
        id: 'wrong-field-in-work-package',
        path: 'migrations/course-g05-l05-fq-999/audit/machine/g5-l5-renderer-neutral-work-package.json',
        contents: `{\n  "apiKey": "${fixtureHash}"\n}\n`,
      },
      {
        id: 'wrong-value-shape-for-exact-match-key',
        path: 'migrations/course-g05-l05-fq-999/audit/machine/g5-l5-renderer-neutral-work-package.json',
        contents: `{\n  "exactMatchKey": "${tokenCanary}"\n}\n`,
      },
      {
        id: 'typed-swf-id-outside-catalog',
        path: 'catalog/not-animations.csv',
        contents: `"course-keyterm-fixture","swf-${fixtureHash}"\n`,
      },
      {
        id: 'generic-key-in-animation-catalog',
        path: 'catalog/animations.csv',
        contents: `apiKey = "${tokenCanary}"\n`,
      },
      {
        id: 'generic-key-in-sql-catalog',
        path: 'catalog/newhelpprogram-20210203-files.csv',
        contents: `apiKey = "${tokenCanary}"\n`,
      },
      {
        id: 'unapproved-artifact-id',
        path: 'scripts/build-g4-missing-mp3-resolution-plan-v2.mjs',
        contents: `artifactToken: "${tokenCanary}",\n`,
      },
      {
        id: 'unapproved-record-key',
        path: 'scripts/build-g4-l10-complete-migration-template-contract-v6.mjs',
        contents: `  record.key === "${tokenCanary}").contents.toString("utf8");\n`,
      },
    ];
    for (const fixture of allowed) verifyAllowedCase(suiteRoot, fixture);
    for (const fixture of rejected) verifyRejectedCase(suiteRoot, fixture);
    verifyInlineSuppressionCannotBypass(suiteRoot, tokenCanary);
    verifyFingerprintIgnoreCannotBypass(suiteRoot, tokenCanary);
    process.stdout.write(
      `GITLEAKS_POLICY_PASS: ${allowed.length} exact false-positive shapes allowed; ` +
        `${rejected.length} near-miss secrets and 2 suppression bypasses rejected; ` +
        'current SQL catalog hash columns valid\n',
    );
  } finally {
    rmSync(suiteRoot, {recursive: true, force: true});
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
