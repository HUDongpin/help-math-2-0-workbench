import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CLERK_SYNTHETIC_FRESH_TEST_GREP,
  CLERK_SYNTHETIC_RECOVERY_TEST_GREP,
  assertClerkSyntheticExecutionResult,
  buildClerkSyntheticChildEnvironment,
  parseClerkSyntheticReporterOutput,
  parseClerkSyntheticRunLockContent,
} from '../scripts/run-clerk-synthetic-registration';
import {
  CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION,
  CLERK_SYNTHETIC_FAILURE_PHASES,
  CLERK_SYNTHETIC_ORIGIN,
  CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION,
  CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION,
  CLERK_SYNTHETIC_RUNNER_GUARD,
} from '../lib/clerk-synthetic-execution';

const webRoot = path.resolve(import.meta.dirname, '..');
const outputDirectory = path.join(
  tmpdir(),
  'help-math-clerk-synthetic-unitcontract',
);
const runId = 'abc123def456';

test('runner child environments remove output controls and separate recovery from registration', () => {
  const baseEnvironment: NodeJS.ProcessEnv = {
    CI: '1',
    CLERK_API_URL: 'https://ambient.invalid',
    CLERK_FAPI: 'ambient-fapi',
    CLERK_FAPI_URL: 'https://ambient.invalid',
    CLERK_SECRET_KEY: 'secret-sentinel',
    CLERK_SYNTHETIC_LIFECYCLE_E2E: 'broader-lifecycle-sentinel',
    CLERK_SYNTHETIC_RECOVERY_ONLY: 'ambient-recovery-sentinel',
    CLERK_SYNTHETIC_REGISTRATION_E2E: 'ambient-registration-sentinel',
    CLERK_TESTING_TOKEN: 'ambient-token-sentinel',
    DEBUG: 'playwright:*',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'publishable-sentinel',
    NODE_ENV: 'development',
    NODE_OPTIONS: '--inspect',
    PLAYWRIGHT_HTML_OUTPUT_DIR: '/tmp/ambient-report',
    PLAYWRIGHT_JSON_OUTPUT_NAME: 'ambient.json',
    PLAYWRIGHT_REPORTER: 'json',
    PWDEBUG: '1',
    UNRELATED_SECRET: 'must-never-enter-the-child',
  };
  const original = {...baseEnvironment};

  const fresh = buildClerkSyntheticChildEnvironment({
    baseEnvironment,
    mode: 'fresh',
    outputDirectory,
    runId,
  });
  const recovery = buildClerkSyntheticChildEnvironment({
    baseEnvironment,
    mode: 'recovery',
    outputDirectory,
    runId,
  });

  assert.deepEqual(baseEnvironment, original, 'the ambient snapshot is immutable');
  for (const environment of [fresh, recovery]) {
    for (const variable of [
      'CI',
      'CLERK_API_URL',
      'CLERK_FAPI',
      'CLERK_FAPI_URL',
      'CLERK_SYNTHETIC_LIFECYCLE_E2E',
      'CLERK_TESTING_TOKEN',
      'DEBUG',
      'NODE_OPTIONS',
      'PLAYWRIGHT_HTML_OUTPUT_DIR',
      'PLAYWRIGHT_JSON_OUTPUT_NAME',
      'PLAYWRIGHT_REPORTER',
      'PWDEBUG',
      'UNRELATED_SECRET',
    ]) assert.equal(environment[variable], undefined, variable);

    assert.equal(environment.CLERK_LOCAL_AUTH_ORIGIN, CLERK_SYNTHETIC_ORIGIN);
    assert.equal(
      environment.CLERK_SYNTHETIC_CLEANUP_AUTHORIZED,
      CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION,
    );
    assert.equal(
      environment.CLERK_SYNTHETIC_RUNNER_GUARD,
      CLERK_SYNTHETIC_RUNNER_GUARD,
    );
    assert.equal(environment.CLERK_SYNTHETIC_CANARY_RUN_ID, runId);
    assert.equal(environment.CLERK_SYNTHETIC_OUTPUT_DIR, outputDirectory);
    assert.equal(environment.NODE_ENV, 'development');
    assert.equal(environment.__NEXT_PROCESSED_ENV, 'true');
    assert.equal(environment.PLAYWRIGHT_HOST, '127.0.0.1');
    assert.equal(environment.PLAYWRIGHT_NO_COPY_PROMPT, '1');
    assert.equal(environment.PLAYWRIGHT_PORT, '3211');
    assert.equal(environment.PLAYWRIGHT_REUSE_EXISTING_SERVER, '0');
    assert.equal(environment.CLERK_SECRET_KEY, 'secret-sentinel');
    assert.equal(
      environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      'publishable-sentinel',
    );
  }

  assert.equal(
    fresh.CLERK_SYNTHETIC_REGISTRATION_E2E,
    CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION,
  );
  assert.equal(fresh.CLERK_SYNTHETIC_RECOVERY_ONLY, undefined);
  assert.equal(recovery.CLERK_SYNTHETIC_REGISTRATION_E2E, undefined);
  assert.equal(
    recovery.CLERK_SYNTHETIC_RECOVERY_ONLY,
    CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION,
  );
});

test('runner accepts only the fixed redacted reporter record grammar', () => {
  assert.deepEqual(parseClerkSyntheticReporterOutput([
    'CLERK_SYNTHETIC_TEST_COUNT=1',
    'CLERK_SYNTHETIC_TEST_STATUS=PASS',
    'CLERK_SYNTHETIC_RESULT=PASS',
    '',
  ].join('\n'), ''), {
    failurePhases: [],
    globalErrorCount: 0,
    results: ['PASS'],
    statuses: ['PASS'],
    testCounts: [1],
  });

  for (const phase of CLERK_SYNTHETIC_FAILURE_PHASES) {
    assert.deepEqual(parseClerkSyntheticReporterOutput([
      'CLERK_SYNTHETIC_TEST_COUNT=1',
      'CLERK_SYNTHETIC_TEST_STATUS=FAIL',
      `CLERK_SYNTHETIC_FAILURE_PHASE=${phase}`,
      'CLERK_SYNTHETIC_RESULT=FAIL',
      '',
    ].join('\n'), ''), {
      failurePhases: [phase],
      globalErrorCount: 0,
      results: ['FAIL'],
      statuses: ['FAIL'],
      testCounts: [1],
    });
  }

  assert.throws(
    () => parseClerkSyntheticReporterOutput(
      'CLERK_SYNTHETIC_TEST_COUNT=1\nunexpected-secret-sentinel\n',
      '',
    ),
    /failed closed/u,
  );
  assert.throws(
    () => parseClerkSyntheticReporterOutput('', 'provider diagnostic'),
    /failed closed/u,
  );
  for (const line of [
    'CLERK_SYNTHETIC_FAILURE_PHASE=signup',
    'CLERK_SYNTHETIC_FAILURE_PHASE=SIGNUP ',
    'CLERK_SYNTHETIC_FAILURE_PHASE=PRIVATE_SENTINEL',
    'CLERK_SYNTHETIC_FAILURE_PHASE=SIGNUP=PRIVATE',
  ]) assert.throws(
    () => parseClerkSyntheticReporterOutput(`${line}\n`, ''),
    /failed closed/u,
  );
});

test('runner accepts a clean pass and preserves only one controlled failure phase', () => {
  const child = (stdout: string, code: number) => ({
    code,
    outputOverflowed: false,
    signal: null,
    stderr: '',
    stdout,
  } as const);
  const pass = [
    'CLERK_SYNTHETIC_TEST_COUNT=1',
    'CLERK_SYNTHETIC_TEST_STATUS=PASS',
    'CLERK_SYNTHETIC_RESULT=PASS',
    '',
  ].join('\n');
  assert.doesNotThrow(() => assertClerkSyntheticExecutionResult(child(pass, 0)));

  const controlledFail = [
    'CLERK_SYNTHETIC_TEST_COUNT=1',
    'CLERK_SYNTHETIC_TEST_STATUS=FAIL',
    'CLERK_SYNTHETIC_FAILURE_PHASE=SESSION',
    'CLERK_SYNTHETIC_RESULT=FAIL',
    '',
  ].join('\n');
  try {
    assertClerkSyntheticExecutionResult(child(controlledFail, 1));
    assert.fail('controlled failure must throw');
  } catch (error) {
    assert.equal(
      (error as {failurePhase?: unknown}).failurePhase,
      'SESSION',
    );
  }

  for (const [stdout, code] of [
    [controlledFail, 0],
    [controlledFail.replace(
      'CLERK_SYNTHETIC_FAILURE_PHASE=SESSION',
      'CLERK_SYNTHETIC_GLOBAL_ERROR=REDACTED\nCLERK_SYNTHETIC_FAILURE_PHASE=SESSION',
    ), 1],
    [controlledFail.replace(
      'CLERK_SYNTHETIC_FAILURE_PHASE=SESSION',
      'CLERK_SYNTHETIC_FAILURE_PHASE=SESSION\nCLERK_SYNTHETIC_FAILURE_PHASE=CLEANUP',
    ), 1],
  ] as const) {
    try {
      assertClerkSyntheticExecutionResult(child(stdout, code));
      assert.fail('contradictory reporter records must throw');
    } catch (error) {
      assert.equal(
        (error as {failurePhase?: unknown}).failurePhase,
        'UNKNOWN_REDACTED',
      );
    }
  }
});

test('runner lock payload is exact, bounded, and rejects malformed ownership', () => {
  const token = 'a'.repeat(64);
  assert.deepEqual(parseClerkSyntheticRunLockContent(
    `${JSON.stringify({pid: 1234, token, version: 1})}\n`,
  ), {pid: 1234, token, version: 1});

  for (const content of [
    JSON.stringify({pid: 1234, token, version: 1}),
    `${JSON.stringify({pid: 1234, token, version: 1})}\nextra\n`,
    `${JSON.stringify({pid: 0, token, version: 1})}\n`,
    `${JSON.stringify({pid: 1234, token: 'short', version: 1})}\n`,
    `${JSON.stringify({extra: true, pid: 1234, token, version: 1})}\n`,
  ]) assert.throws(
    () => parseClerkSyntheticRunLockContent(content),
    /failed closed/u,
  );
});

test('runner source is a fixed local, no-shell, recovery-first launch boundary', async () => {
  const source = await readFile(
    path.join(webRoot, 'scripts/run-clerk-synthetic-registration.ts'),
    'utf8',
  );
  const packageJson = JSON.parse(await readFile(
    path.join(webRoot, 'package.json'),
    'utf8',
  )) as {scripts: Record<string, string>};

  assert.equal(
    packageJson.scripts['auth:test:synthetic'],
    'tsx scripts/run-clerk-synthetic-registration.ts',
  );
  assert.equal(
    CLERK_SYNTHETIC_FRESH_TEST_GREP,
    'Clerk synthetic registration contract \\(external, destructive\\) EN synthetic registration$',
  );
  assert.equal(
    CLERK_SYNTHETIC_RECOVERY_TEST_GREP,
    'Clerk synthetic registration contract \\(external, destructive\\) EN synthetic recovery cleanup$',
  );
  assert.match(
    source,
    /nextEnv\.loadEnvConfig\(\s*webRoot,\s*true,\s*\{error: \(\) => \{\}, info: \(\) => \{\}\},\s*true,\s*\)/u,
  );
  assert.match(source, /node_modules\/\.bin\/playwright/u);
  assert.match(source, /spawn\(playwrightBinary, args, \{/u);
  assert.match(source, /shell: false/u);
  assert.match(source, /stdio: \['ignore', 'pipe', 'pipe'\]/u);
  assert.match(source, /createServer\(\{pauseOnConnect: true\}\)/u);
  assert.match(source, /host: CLERK_SYNTHETIC_HOST/u);
  assert.match(source, /port: CLERK_SYNTHETIC_PORT/u);
  assert.match(source, /await chmod\(outputDirectory, 0o700\)/u);
  assert.match(source, /installSyntheticPhaseMarker\(outputDirectory\)/u);
  assert.match(source, /readSyntheticPhaseMarker\(outputDirectory\)/u);
  assert.match(source, /removeSyntheticDistDirectory\(\)/u);
  assert.match(source, /CLERK_SYNTHETIC_DIST_DIR/u);
  assert.match(source, /fsConstants\.O_EXCL/u);
  assert.match(source, /fsConstants\.O_NOFOLLOW/u);
  assert.match(source, /\(stat\.mode & 0o777\) !== 0o600/u);
  assert.match(
    source,
    /candidateStat\.dev !== lock\.device[\s\S]*candidateStat\.ino !== lock\.inode[\s\S]*candidateToken !== lock\.content[\s\S]*await unlink\(runLockFile\)/u,
  );
  assert.match(source, /LOCKED_REQUIRES_MANUAL_PROCESS_AUDIT/u);
  assert.doesNotMatch(source, /reclaimStaleRunLock/u);
  assert.doesNotMatch(source, /process\.kill\(pid, 0\)/u);
  assert.match(
    source,
    /if \(recoveryReceipt !== null\) \{[\s\S]*CLERK_SYNTHETIC_RECOVERY_TEST_GREP[\s\S]*if \(!isFreshRegistrationAuthorized\(baseEnvironment\)\) \{[\s\S]*if \(recoveryReceipt !== null\) return 'PASS'/u,
  );
  assert.match(source, /process\.once\(signal, handler\)/u);
  assert.match(
    source,
    /CLERK_SYNTHETIC_LAUNCHER_PHASE=\$\{safePhase\}/u,
  );
  assert.match(
    source,
    /process\.stdout\.write\(`CLERK_SYNTHETIC_LAUNCHER=\$\{outcome\}\\n`\)/u,
  );
  assert.doesNotMatch(source, /\b(?:execFile|fork)\s*\(/u);
  assert.doesNotMatch(
    source,
    /import \{[^}]*\bexec\b[^}]*\} from 'node:child_process'/u,
  );
  assert.doesNotMatch(source, /\bnpx\b/u);
  assert.doesNotMatch(source, /\b3211\b/u);
  assert.doesNotMatch(source, /console\.(?:debug|error|info|log|warn)/u);
  assert.doesNotMatch(source, /process\.stderr\.write/u);
});
